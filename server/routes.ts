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

  // Main app entry point - this is your App URL in Partner Dashboard
  app.get('/', async (req, res) => {
    try {
      const { shop, host } = req.query;
      
      if (!shop || typeof shop !== 'string') {
        return res.status(400).send('Missing shop parameter. Please install from Shopify admin.');
      }
      
      // Clean shop parameter (remove .myshopify.com if present)
      const cleanShop = shop.replace('.myshopify.com', '');
      
      // Check if store is already installed
      const existingStore = await storage.getStoreByDomain(cleanShop);
      
      if (existingStore && existingStore.accessToken) {
        // Store already installed - redirect to embedded app
        const hostParam = host || Buffer.from(`${cleanShop}.myshopify.com`).toString('base64');
        return res.redirect(`/app?shop=${cleanShop}&host=${hostParam}&embedded=true`);
      } else {
        // New installation - start OAuth flow
        const authUrl = await shopifyService.getAuthUrl(cleanShop);
        res.redirect(authUrl);
      }
    } catch (error) {
      console.error('App entry error:', error);
      res.status(500).send('App loading failed. Please try again.');
    }
  });
  
  // App installation page - legacy endpoint
  app.get('/install', async (req, res) => {
    try {
      const { shop } = req.query;
      if (!shop || typeof shop !== 'string') {
        return res.status(400).send('Missing shop parameter. Please install from Shopify admin.');
      }
      
      // Clean shop parameter (remove .myshopify.com if present)
      const cleanShop = shop.replace('.myshopify.com', '');
      
      // Redirect to OAuth flow
      const authUrl = await shopifyService.getAuthUrl(cleanShop);
      res.redirect(authUrl);
    } catch (error) {
      console.error('App install error:', error);
      res.status(500).send('Installation failed. Please try again.');
    }
  });

  // Shopify OAuth routes
  app.get('/api/auth/shopify', async (req, res) => {
    try {
      const { shop } = req.query;
      if (!shop || typeof shop !== 'string') {
        return res.status(400).json({ error: 'Shop parameter is required' });
      }
      
      // Clean shop parameter (remove .myshopify.com if present)
      const cleanShop = shop.replace('.myshopify.com', '');
      const authUrl = await shopifyService.getAuthUrl(cleanShop);
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

      // Clean shop parameter (remove .myshopify.com if present)
      const cleanShop = shop.replace('.myshopify.com', '');
      const storeData = await shopifyService.handleCallback(code, shop);
      const store = await storage.createStore(storeData);
      
      // Start initial data sync
      await shopifyService.syncStoreData(store.id, store.accessToken, cleanShop);
      
      // Redirect to app in Shopify admin with proper host parameter
      const host = Buffer.from(`${cleanShop}.myshopify.com`).toString('base64');
      const appHandle = 'store-ai-chat-bot'; // This should match your app handle in Partner Dashboard
      const redirectUrl = `https://${cleanShop}.myshopify.com/admin/apps/${appHandle}?shop=${cleanShop}&host=${host}`;
      res.redirect(redirectUrl);
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
        // Clean shop parameter and get store by Shopify domain
        const cleanShop = shop.replace('.myshopify.com', '');
        store = await storage.getStoreByDomain(cleanShop);
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
        // Clean shop parameter
        const cleanShop = shop.replace('.myshopify.com', '');
        store = await storage.getStoreByDomain(cleanShop);
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

  // Shopify embedded app route - serves React app directly
  app.get('/app', async (req, res, next) => {
    try {
      const { shop, host } = req.query;
      
      if (!shop || typeof shop !== 'string') {
        return res.status(400).send('Missing shop parameter. Please install from Shopify admin.');
      }
      
      // Clean shop parameter
      const cleanShop = (shop as string).replace('.myshopify.com', '');
      
      // Check if store exists
      const existingStore = await storage.getStoreByDomain(cleanShop);
      if (!existingStore || !existingStore.accessToken) {
        return res.status(400).send('Store not installed. Please install from Shopify admin.');
      }
      
      // Set embedded context and forward to Vite dev server
      req.url = '/?embedded=true&shop=' + encodeURIComponent(cleanShop) + (host ? '&host=' + encodeURIComponent(host as string) : '');
      next();
    } catch (error) {
      console.error('Embedded app error:', error);
      res.status(500).send('Failed to load app');
    }
  });

  // Widget integration routes
  app.get('/widget/:storeId.js', async (req, res) => {
    try {
      const { storeId } = req.params;
      const store = await storage.getStore(storeId);
      
      if (!store) {
        return res.status(404).send('// Store not found');
      }
      
      // Get store settings
      const settings = store.settings as any || {};
      const widgetConfig = {
        storeId: store.id,
        color: settings.widgetColor || '#3B82F6',
        position: settings.widgetPosition || 'bottom-right',
        enabledPages: settings.enabledPages || ['home', 'product'],
        apiUrl: process.env.APP_URL || `https://${req.get('host')}`
      };
      
      // Read widget script template
      const fs = require('fs');
      const path = require('path');
      const scriptPath = path.join(__dirname, 'widget-script.js');
      let scriptContent = fs.readFileSync(scriptPath, 'utf8');
      
      // Replace placeholders with actual config
      scriptContent = scriptContent
        .replace('__STORE_ID__', widgetConfig.storeId)
        .replace('__COLOR__', widgetConfig.color)
        .replace('__POSITION__', widgetConfig.position)
        .replace('__ENABLED_PAGES__', JSON.stringify(widgetConfig.enabledPages))
        .replace('__API_URL__', widgetConfig.apiUrl);
      
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(scriptContent);
    } catch (error) {
      console.error('Widget script error:', error);
      res.status(500).send('// Error loading widget');
    }
  });
  
  // Widget installation instructions
  app.get('/api/widget/install-instructions/:storeId', async (req, res) => {
    try {
      const { storeId } = req.params;
      const store = await storage.getStore(storeId);
      
      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }
      
      const widgetUrl = `${process.env.APP_URL || `https://${req.get('host')}`}/widget/${storeId}.js`;
      
      const instructions = {
        scriptTag: `<script src="${widgetUrl}" async></script>`,
        instructions: [
          "Copy the script tag above",
          "Go to your Shopify admin → Online Store → Themes",
          "Click 'Actions' → 'Edit code' on your active theme",
          "Open 'theme.liquid' file",
          "Paste the script tag before the closing </body> tag",
          "Save the file",
          "Visit your storefront to see the chat widget"
        ],
        alternativeMethod: {
          description: "Automatic installation via Theme App Extensions (recommended)",
          note: "This method requires theme app extensions to be enabled in your app."
        }
      };
      
      res.json(instructions);
    } catch (error) {
      console.error('Widget instructions error:', error);
      res.status(500).json({ error: 'Failed to get installation instructions' });
    }
  });
  
  // Update widget settings
  app.post('/api/widget/settings/:storeId', async (req, res) => {
    try {
      const { storeId } = req.params;
      const { widgetColor, widgetPosition, enabledPages } = req.body;
      
      const store = await storage.getStore(storeId);
      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }
      
      const updatedSettings = {
        ...store.settings as any,
        widgetColor,
        widgetPosition,
        enabledPages
      };
      
      await storage.updateStoreSettings(storeId, updatedSettings);
      
      res.json({ message: 'Widget settings updated successfully' });
    } catch (error) {
      console.error('Update widget settings error:', error);
      res.status(500).json({ error: 'Failed to update widget settings' });
    }
  });

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  return httpServer;
}
