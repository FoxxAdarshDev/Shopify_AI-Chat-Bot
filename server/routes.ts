import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { shopifyService } from "./services/shopify";
import { zaiService } from "./services/zai";
import { chatService } from "./services/chat";
import { insertConversationSchema, insertMessageSchema, insertStoreSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await chatService.handleWebSocketMessage(ws, message);
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Shopify OAuth routes
  app.get('/api/auth/shopify', async (req, res) => {
    try {
      const { shop } = req.query;
      if (!shop || typeof shop !== 'string') {
        return res.status(400).json({ error: 'Shop parameter is required' });
      }
      
      const authUrl = await shopifyService.getAuthUrl(shop);
      res.redirect(authUrl);
    } catch (error) {
      console.error('Shopify auth error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  app.get('/api/auth/shopify/callback', async (req, res) => {
    try {
      const { code, shop, hmac, timestamp } = req.query;
      
      if (!code || !shop || typeof code !== 'string' || typeof shop !== 'string') {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const storeData = await shopifyService.handleCallback(code, shop);
      const store = await storage.createStore(storeData);
      
      // Start initial data sync
      await shopifyService.syncStoreData(store.id, store.accessToken, shop);
      
      // Redirect back to Shopify admin where app will be embedded
      const shopifyAdminUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_APP_HANDLE || 'store-ai-chat-bot'}`;
      res.redirect(shopifyAdminUrl);
    } catch (error) {
      console.error('Shopify callback error:', error);
      res.status(500).json({ error: 'Installation failed' });
    }
  });

  // Store management routes
  app.get('/api/stores/current', async (req, res) => {
    try {
      const { shop } = req.query;
      let store;
      
      if (shop && typeof shop === 'string') {
        // Get store by Shopify domain
        store = await storage.getStoreByDomain(shop);
      } else {
        // For development/demo, get the first active store
        // In production, this should be determined by session/auth
        const stores = await storage.getActiveStores();
        store = stores[0];
      }
      
      if (!store) {
        return res.status(404).json({ error: 'No store found. Please install the app first.' });
      }
      
      res.json(store);
    } catch (error) {
      console.error('Get current store error:', error);
      res.status(500).json({ error: 'Failed to fetch store' });
    }
  });

  app.get('/api/stores/current/sync-status', async (req, res) => {
    try {
      const { shop } = req.query;
      let store;
      
      if (shop && typeof shop === 'string') {
        store = await storage.getStoreByDomain(shop);
      } else {
        const stores = await storage.getActiveStores();
        store = stores[0];
      }
      
      if (!store) {
        return res.status(404).json({ error: 'No store found' });
      }
      
      const syncStatus = await storage.getStoreSyncStatus(store.id);
      res.json(syncStatus);
    } catch (error) {
      console.error('Get sync status error:', error);
      res.status(500).json({ error: 'Failed to fetch sync status' });
    }
  });

  app.get('/api/stores/:storeId', async (req, res) => {
    try {
      const store = await storage.getStore(req.params.storeId);
      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }
      res.json(store);
    } catch (error) {
      console.error('Get store error:', error);
      res.status(500).json({ error: 'Failed to fetch store' });
    }
  });

  app.get('/api/stores/:storeId/sync-status', async (req, res) => {
    try {
      const syncStatus = await storage.getStoreSyncStatus(req.params.storeId);
      res.json(syncStatus);
    } catch (error) {
      console.error('Get sync status error:', error);
      res.status(500).json({ error: 'Failed to fetch sync status' });
    }
  });

  app.post('/api/stores/:storeId/sync', async (req, res) => {
    try {
      const store = await storage.getStore(req.params.storeId);
      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }
      
      await shopifyService.syncStoreData(store.id, store.accessToken, store.shopifyDomain);
      res.json({ message: 'Sync initiated successfully' });
    } catch (error) {
      console.error('Store sync error:', error);
      res.status(500).json({ error: 'Sync failed' });
    }
  });

  // Chat conversation routes
  app.get('/api/conversations', async (req, res) => {
    try {
      const { storeId, limit = 50, offset = 0 } = req.query;
      const conversations = await storage.getConversations(
        storeId as string,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(conversations);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  app.get('/api/conversations/:conversationId', async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      res.json(conversation);
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  });

  app.get('/api/conversations/:conversationId/messages', async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/conversations', async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid conversation data', details: error.errors });
      }
      console.error('Create conversation error:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  });

  app.post('/api/conversations/:conversationId/messages', async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        conversationId: req.params.conversationId
      });
      
      const message = await storage.createMessage(messageData);
      
      // If it's a user message, generate AI response
      if (message.role === 'user') {
        const conversation = await storage.getConversation(req.params.conversationId);
        if (conversation) {
          const aiResponse = await chatService.generateResponse(
            conversation.storeId,
            req.params.conversationId,
            message.content
          );
          
          // Broadcast to WebSocket clients
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'new_message',
                conversationId: req.params.conversationId,
                message: aiResponse
              }));
            }
          });
        }
      }
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid message data', details: error.errors });
      }
      console.error('Create message error:', error);
      res.status(500).json({ error: 'Failed to create message' });
    }
  });

  // Analytics routes
  app.get('/api/analytics/dashboard', async (req, res) => {
    try {
      const { storeId } = req.query;
      const analytics = await storage.getDashboardAnalytics(storeId as string);
      res.json(analytics);
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  app.get('/api/analytics/chat-performance', async (req, res) => {
    try {
      const { storeId, period = '7d' } = req.query;
      const performance = await storage.getChatPerformance(storeId as string, period as string);
      res.json(performance);
    } catch (error) {
      console.error('Get chat performance error:', error);
      res.status(500).json({ error: 'Failed to fetch chat performance' });
    }
  });

  // Configuration routes
  app.get('/api/config', async (req, res) => {
    try {
      const config = {
        zaiModel: process.env.ZAI_MODEL || 'glm-4.5-flash',
        maxContextLength: parseInt(process.env.MAX_CONTEXT_LENGTH || '4000'),
        chatWidgetPosition: process.env.CHAT_WIDGET_POSITION || 'bottom-right',
        storeDataRestriction: process.env.STORE_DATA_RESTRICTION === 'true'
      };
      res.json(config);
    } catch (error) {
      console.error('Get config error:', error);
      res.status(500).json({ error: 'Failed to fetch configuration' });
    }
  });

  // Route to provide Shopify API key for App Bridge
  app.get('/api/config/shopify-api-key', async (req, res) => {
    try {
      res.json({ apiKey: process.env.SHOPIFY_API_KEY || '' });
    } catch (error) {
      console.error('Get Shopify API key error:', error);
      res.status(500).json({ error: 'Failed to fetch API key' });
    }
  });

  app.post('/api/config', async (req, res) => {
    try {
      const { zaiApiKey, databaseUrl, shopifyApiKey, shopifyApiSecret, ...otherConfig } = req.body;
      
      // In a real implementation, you'd save these to a secure configuration store
      // For now, we'll just validate the structure
      const configSchema = z.object({
        zaiModel: z.string().optional(),
        maxContextLength: z.number().min(1000).max(32000).optional(),
        chatWidgetPosition: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional(),
        storeDataRestriction: z.boolean().optional()
      });
      
      const validatedConfig = configSchema.parse(otherConfig);
      
      res.json({ message: 'Configuration updated successfully', config: validatedConfig });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid configuration data', details: error.errors });
      }
      console.error('Update config error:', error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  });

  // Shopify webhook routes
  app.post('/api/webhooks/app/uninstalled', async (req, res) => {
    try {
      const { domain } = req.body;
      await storage.deactivateStore(domain);
      res.status(200).json({ message: 'App uninstalled successfully' });
    } catch (error) {
      console.error('App uninstall webhook error:', error);
      res.status(500).json({ error: 'Failed to process uninstall webhook' });
    }
  });

  app.post('/api/webhooks/products/create', async (req, res) => {
    try {
      const productData = req.body;
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (shop) {
        const store = await storage.getStoreByDomain(shop);
        if (store) {
          await storage.createProduct({
            storeId: store.id,
            shopifyProductId: productData.id.toString(),
            title: productData.title,
            description: productData.body_html,
            handle: productData.handle,
            productType: productData.product_type,
            vendor: productData.vendor,
            tags: productData.tags ? productData.tags.split(',').map((tag: string) => tag.trim()) : [],
            price: productData.variants?.[0]?.price || '0.00',
            compareAtPrice: productData.variants?.[0]?.compare_at_price,
            images: productData.images || [],
            variants: productData.variants || [],
            options: productData.options || [],
            status: productData.status
          });
        }
      }
      
      res.status(200).json({ message: 'Product created successfully' });
    } catch (error) {
      console.error('Product create webhook error:', error);
      res.status(500).json({ error: 'Failed to process product webhook' });
    }
  });

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  return httpServer;
}
