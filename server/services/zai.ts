import { InsertAiInteraction } from '@shared/schema';

interface ZAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ZAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface StoreContext {
  products: any[];
  collections: any[];
  pages: any[];
  blogPosts: any[];
}

class ZAIService {
  private readonly apiKey = process.env.ZAI_API_KEY || '';
  private readonly baseUrl = 'https://api.z.ai/api/paas/v4';
  private readonly model = process.env.ZAI_MODEL || 'glm-4.5-flash';
  private readonly maxContextLength = parseInt(process.env.MAX_CONTEXT_LENGTH || '4000');

  async generateResponse(
    prompt: string,
    storeContext: StoreContext,
    conversationHistory: ZAIMessage[] = []
  ): Promise<{
    response: string;
    tokensUsed: number;
    responseTime: number;
  }> {
    const startTime = Date.now();

    try {
      const systemPrompt = this.buildSystemPrompt(storeContext);
      const messages: ZAIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: prompt }
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'en-US,en',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: this.maxContextLength,
          temperature: 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Z.AI API error: ${response.status} ${response.statusText}`);
      }

      const data: ZAIResponse = await response.json();
      const responseTime = Date.now() - startTime;

      return {
        response: data.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.',
        tokensUsed: data.usage?.total_tokens || 0,
        responseTime
      };
    } catch (error) {
      console.error('Z.AI API error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private buildSystemPrompt(storeContext: StoreContext): string {
    const { products, collections, pages, blogPosts } = storeContext;
    
    let systemPrompt = `You are an AI customer support assistant for this Shopify store. Your role is to help customers find products, answer questions about policies, and provide helpful information about the store.

IMPORTANT GUIDELINES:
- You can ONLY provide information about THIS STORE and its products, collections, pages, and blog content
- Do NOT provide information about other stores, competitors, or general shopping advice
- If asked about something not in the store data, politely redirect to store-specific content
- Always be helpful, friendly, and professional
- When recommending products, include specific details like price, features, and availability
- If you reference a product, collection, or page, try to include its handle or ID for easy access

STORE DATA CONTEXT:

PRODUCTS (${products.length} items):`;

    // Add product context (limited to prevent context overflow)
    const topProducts = products.slice(0, 20);
    topProducts.forEach(product => {
      systemPrompt += `
- ${product.title} (${product.handle}): ${product.price ? '$' + product.price : 'Price not set'}
  Description: ${(product.description || '').substring(0, 200)}${(product.description || '').length > 200 ? '...' : ''}
  Type: ${product.productType || 'Not specified'}
  Vendor: ${product.vendor || 'Not specified'}
  Status: ${product.status}`;
    });

    if (products.length > 20) {
      systemPrompt += `\n... and ${products.length - 20} more products available`;
    }

    systemPrompt += `\n\nCOLLECTIONS (${collections.length} items):`;
    collections.forEach(collection => {
      systemPrompt += `
- ${collection.title} (${collection.handle}): ${collection.productsCount} products
  Description: ${(collection.description || '').substring(0, 150)}${(collection.description || '').length > 150 ? '...' : ''}`;
    });

    systemPrompt += `\n\nPAGES (${pages.length} items):`;
    pages.forEach(page => {
      systemPrompt += `
- ${page.title} (${page.handle}): ${(page.content || '').substring(0, 200)}${(page.content || '').length > 200 ? '...' : ''}`;
    });

    systemPrompt += `\n\nBLOG POSTS (${blogPosts.length} items):`;
    blogPosts.slice(0, 10).forEach(post => {
      systemPrompt += `
- ${post.title} (${post.handle}): ${(post.excerpt || post.content || '').substring(0, 150)}${(post.excerpt || post.content || '').length > 150 ? '...' : ''}`;
    });

    systemPrompt += `

When helping customers:
1. Search through the available products, collections, pages, and blog posts to find relevant information
2. Provide specific product recommendations with prices and details
3. Direct customers to relevant pages for policies, shipping info, etc.
4. If asked about something not available in the store, politely explain that you can only help with this store's products and content
5. Always maintain a helpful and professional tone
6. Include product handles or IDs when referencing specific items so customers can easily find them

Remember: You represent this specific store and should only provide information about its products and content.`;

    return systemPrompt;
  }

  async analyzeQuery(query: string): Promise<{
    intent: 'product_search' | 'policy_question' | 'general_inquiry' | 'complaint' | 'other';
    entities: string[];
    keywords: string[];
  }> {
    // Simple query analysis - in a real implementation, you might use more sophisticated NLP
    const lowerQuery = query.toLowerCase();
    
    let intent: 'product_search' | 'policy_question' | 'general_inquiry' | 'complaint' | 'other' = 'other';
    
    if (lowerQuery.includes('looking for') || lowerQuery.includes('find') || lowerQuery.includes('recommend') || lowerQuery.includes('suggest')) {
      intent = 'product_search';
    } else if (lowerQuery.includes('return') || lowerQuery.includes('shipping') || lowerQuery.includes('policy') || lowerQuery.includes('refund')) {
      intent = 'policy_question';
    } else if (lowerQuery.includes('problem') || lowerQuery.includes('issue') || lowerQuery.includes('wrong') || lowerQuery.includes('complaint')) {
      intent = 'complaint';
    } else if (lowerQuery.includes('how') || lowerQuery.includes('what') || lowerQuery.includes('when') || lowerQuery.includes('where')) {
      intent = 'general_inquiry';
    }

    // Extract potential entities (product names, brands, etc.)
    const words = query.split(/\s+/).filter(word => word.length > 2);
    const entities = words.filter(word => 
      /^[A-Z]/.test(word) || // Capitalized words
      word.includes('$') || // Prices
      /\d/.test(word) // Contains numbers
    );

    const keywords = words.filter(word => 
      !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word.toLowerCase())
    );

    return {
      intent,
      entities,
      keywords
    };
  }
}

export const zaiService = new ZAIService();
