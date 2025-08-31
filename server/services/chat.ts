import { WebSocket } from 'ws';
import { storage } from '../storage';
import { zaiService } from './zai';
import { shopifyService } from './shopify';
import { InsertMessage, InsertAiInteraction } from '@shared/schema';

interface WebSocketMessage {
  type: 'join_conversation' | 'send_message' | 'typing_start' | 'typing_stop';
  conversationId?: string;
  storeId?: string;
  sessionId?: string;
  content?: string;
  customerName?: string;
  customerEmail?: string;
}

class ChatService {
  private connectedClients = new Map<string, WebSocket>();

  async handleWebSocketMessage(ws: WebSocket, message: WebSocketMessage): Promise<void> {
    switch (message.type) {
      case 'join_conversation':
        if (message.conversationId) {
          this.connectedClients.set(message.conversationId, ws);
          ws.send(JSON.stringify({
            type: 'joined',
            conversationId: message.conversationId
          }));
        }
        break;

      case 'send_message':
        if (message.conversationId && message.content) {
          await this.handleUserMessage(message.conversationId, message.content, ws);
        }
        break;

      case 'typing_start':
      case 'typing_stop':
        if (message.conversationId) {
          this.broadcastToConversation(message.conversationId, {
            type: message.type,
            conversationId: message.conversationId
          }, ws);
        }
        break;
    }
  }

  async handleUserMessage(conversationId: string, content: string, ws: WebSocket): Promise<void> {
    try {
      // Save user message
      const userMessage = await storage.createMessage({
        conversationId,
        role: 'user',
        content,
        metadata: {}
      });

      // Broadcast user message to all clients in conversation
      this.broadcastToConversation(conversationId, {
        type: 'new_message',
        conversationId,
        message: userMessage
      });

      // Generate and send AI response
      const aiResponse = await this.generateResponse(
        userMessage.conversationId,
        conversationId,
        content
      );

      this.broadcastToConversation(conversationId, {
        type: 'new_message',
        conversationId,
        message: aiResponse
      });

    } catch (error) {
      console.error('Error handling user message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  }

  async generateResponse(storeId: string, conversationId: string, userMessage: string): Promise<any> {
    try {
      // Get conversation history
      const messages = await storage.getMessages(conversationId);
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }));

      // Get store context data
      const storeContext = await this.getStoreContext(storeId, userMessage);

      // Generate AI response
      const aiResult = await zaiService.generateResponse(
        userMessage,
        storeContext,
        conversationHistory
      );

      // Save AI message
      const aiMessage = await storage.createMessage({
        conversationId,
        role: 'assistant',
        content: aiResult.response,
        metadata: {
          model: process.env.ZAI_MODEL || 'glm-4.5-flash',
          tokensUsed: aiResult.tokensUsed,
          responseTime: aiResult.responseTime,
          intent: await this.analyzeIntent(userMessage),
          contextProducts: storeContext.products.slice(0, 5).map(p => ({
            id: p.id,
            title: p.title,
            handle: p.handle
          }))
        }
      });

      // Log AI interaction
      await storage.createAiInteraction({
        conversationId,
        messageId: aiMessage.id,
        model: process.env.ZAI_MODEL || 'glm-4.5-flash',
        prompt: userMessage,
        response: aiResult.response,
        tokensUsed: aiResult.tokensUsed,
        responseTime: aiResult.responseTime,
        contextData: {
          storeContext: {
            productsCount: storeContext.products.length,
            collectionsCount: storeContext.collections.length,
            pagesCount: storeContext.pages.length,
            blogPostsCount: storeContext.blogPosts.length
          }
        }
      });

      // Update conversation last message time
      await storage.updateConversationLastMessage(conversationId);

      return aiMessage;
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Create fallback message
      const fallbackMessage = await storage.createMessage({
        conversationId,
        role: 'assistant',
        content: 'I apologize, but I\'m experiencing some technical difficulties. Please try again in a moment, or feel free to contact our support team directly.',
        metadata: { error: true, errorType: 'ai_generation_failed' }
      });

      return fallbackMessage;
    }
  }

  private async getStoreContext(storeId: string, query: string): Promise<{
    products: any[];
    collections: any[];
    pages: any[];
    blogPosts: any[];
  }> {
    // Analyze query to determine what store data to include
    const analysis = await zaiService.analyzeQuery(query);
    
    // Get relevant store data based on query analysis
    if (analysis.intent === 'product_search') {
      // For product searches, include more products and collections
      return await shopifyService.searchStoreData(storeId, query, 20);
    } else if (analysis.intent === 'policy_question') {
      // For policy questions, focus on pages and blog posts
      const storeData = await shopifyService.searchStoreData(storeId, query, 5);
      return {
        ...storeData,
        pages: await storage.getPages(storeId, 20),
        blogPosts: await storage.getBlogPosts(storeId, 10)
      };
    } else {
      // For general inquiries, include a balanced mix
      return await shopifyService.searchStoreData(storeId, query, 10);
    }
  }

  private async analyzeIntent(message: string): Promise<string> {
    const analysis = await zaiService.analyzeQuery(message);
    return analysis.intent;
  }

  private broadcastToConversation(conversationId: string, data: any, excludeWs?: WebSocket): void {
    this.connectedClients.forEach((ws, clientConversationId) => {
      if (clientConversationId === conversationId && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }

  async createConversation(storeId: string, sessionId: string, customerName?: string, customerEmail?: string): Promise<string> {
    const conversation = await storage.createConversation({
      storeId,
      sessionId,
      customerName,
      customerEmail,
      status: 'active',
      metadata: {}
    });

    return conversation.id;
  }

  async getConversationStats(storeId: string): Promise<{
    total: number;
    active: number;
    today: number;
    averageResponseTime: number;
  }> {
    return await storage.getConversationStats(storeId);
  }

  cleanupDisconnectedClients(): void {
    this.connectedClients.forEach((ws, conversationId) => {
      if (ws.readyState !== WebSocket.OPEN) {
        this.connectedClients.delete(conversationId);
      }
    });
  }
}

export const chatService = new ChatService();

// Cleanup disconnected clients every 5 minutes
setInterval(() => {
  chatService.cleanupDisconnectedClients();
}, 5 * 60 * 1000);
