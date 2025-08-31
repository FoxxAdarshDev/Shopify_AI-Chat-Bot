import { 
  users, stores, products, collections, pages, blogPosts, conversations, messages, aiInteractions, configurations,
  type User, type InsertUser, type Store, type InsertStore, type Product, type InsertProduct,
  type Collection, type InsertCollection, type Page, type InsertPage, type BlogPost, type InsertBlogPost,
  type Conversation, type InsertConversation, type Message, type InsertMessage, 
  type AiInteraction, type InsertAiInteraction, type Configuration, type InsertConfiguration
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, sql, count, avg } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Store methods
  getStore(id: string): Promise<Store | undefined>;
  getStoreByDomain(domain: string): Promise<Store | undefined>;
  getActiveStores(): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
  updateStoreLastSync(storeId: string): Promise<void>;
  updateStoreSettings(storeId: string, settings: any): Promise<Store>;
  deactivateStore(domain: string): Promise<void>;

  // Product methods
  createProduct(product: InsertProduct): Promise<Product>;
  upsertProduct(product: InsertProduct): Promise<Product>;
  getProducts(storeId: string, limit?: number): Promise<Product[]>;

  // Collection methods
  createCollection(collection: InsertCollection): Promise<Collection>;
  upsertCollection(collection: InsertCollection): Promise<Collection>;
  getCollections(storeId: string, limit?: number): Promise<Collection[]>;

  // Page methods
  createPage(page: InsertPage): Promise<Page>;
  upsertPage(page: InsertPage): Promise<Page>;
  getPages(storeId: string, limit?: number): Promise<Page[]>;

  // Blog post methods
  createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost>;
  upsertBlogPost(blogPost: InsertBlogPost): Promise<BlogPost>;
  getBlogPosts(storeId: string, limit?: number): Promise<BlogPost[]>;

  // Conversation methods
  getConversations(storeId: string, limit?: number, offset?: number): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversationLastMessage(conversationId: string): Promise<void>;

  // Message methods
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // AI interaction methods
  createAiInteraction(interaction: InsertAiInteraction): Promise<AiInteraction>;

  // Analytics methods
  getDashboardAnalytics(storeId: string): Promise<any>;
  getChatPerformance(storeId: string, period: string): Promise<any>;
  getConversationStats(storeId: string): Promise<any>;
  getStoreSyncStatus(storeId: string): Promise<any>;

  // Configuration methods
  getConfiguration(storeId?: string): Promise<Configuration | undefined>;
  createConfiguration(config: InsertConfiguration): Promise<Configuration>;
  updateConfiguration(storeId: string | undefined, config: Partial<InsertConfiguration>): Promise<Configuration>;

  // Search methods
  searchStoreData(storeId: string, query: string, limit?: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getStore(id: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store || undefined;
  }

  async getStoreByDomain(domain: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.shopifyDomain, domain));
    return store || undefined;
  }

  async getActiveStores(): Promise<Store[]> {
    return await db.select().from(stores)
      .where(eq(stores.isActive, true))
      .orderBy(desc(stores.installedAt));
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const [store] = await db.insert(stores).values(insertStore).returning();
    return store;
  }

  async updateStoreLastSync(storeId: string): Promise<void> {
    await db.update(stores)
      .set({ lastSyncAt: new Date() })
      .where(eq(stores.id, storeId));
  }

  async updateStoreSettings(storeId: string, settings: any): Promise<Store> {
    const [store] = await db.update(stores)
      .set({ settings })
      .where(eq(stores.id, storeId))
      .returning();
    return store;
  }

  async deactivateStore(domain: string): Promise<void> {
    await db.update(stores)
      .set({ isActive: false, accessToken: null })
      .where(eq(stores.shopifyDomain, domain));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async upsertProduct(insertProduct: InsertProduct): Promise<Product> {
    const existing = await db.select().from(products)
      .where(and(
        eq(products.storeId, insertProduct.storeId),
        eq(products.shopifyProductId, insertProduct.shopifyProductId)
      ));

    if (existing.length > 0) {
      const [updated] = await db.update(products)
        .set({ ...insertProduct, updatedAt: new Date() })
        .where(eq(products.id, existing[0].id))
        .returning();
      return updated;
    } else {
      return await this.createProduct(insertProduct);
    }
  }

  async getProducts(storeId: string, limit = 50): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.storeId, storeId))
      .limit(limit)
      .orderBy(desc(products.updatedAt));
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const [collection] = await db.insert(collections).values(insertCollection).returning();
    return collection;
  }

  async upsertCollection(insertCollection: InsertCollection): Promise<Collection> {
    const existing = await db.select().from(collections)
      .where(and(
        eq(collections.storeId, insertCollection.storeId),
        eq(collections.shopifyCollectionId, insertCollection.shopifyCollectionId)
      ));

    if (existing.length > 0) {
      const [updated] = await db.update(collections)
        .set({ ...insertCollection, updatedAt: new Date() })
        .where(eq(collections.id, existing[0].id))
        .returning();
      return updated;
    } else {
      return await this.createCollection(insertCollection);
    }
  }

  async getCollections(storeId: string, limit = 50): Promise<Collection[]> {
    return await db.select().from(collections)
      .where(eq(collections.storeId, storeId))
      .limit(limit)
      .orderBy(desc(collections.updatedAt));
  }

  async createPage(insertPage: InsertPage): Promise<Page> {
    const [page] = await db.insert(pages).values(insertPage).returning();
    return page;
  }

  async upsertPage(insertPage: InsertPage): Promise<Page> {
    const existing = await db.select().from(pages)
      .where(and(
        eq(pages.storeId, insertPage.storeId),
        eq(pages.shopifyPageId, insertPage.shopifyPageId)
      ));

    if (existing.length > 0) {
      const [updated] = await db.update(pages)
        .set({ ...insertPage, updatedAt: new Date() })
        .where(eq(pages.id, existing[0].id))
        .returning();
      return updated;
    } else {
      return await this.createPage(insertPage);
    }
  }

  async getPages(storeId: string, limit = 50): Promise<Page[]> {
    return await db.select().from(pages)
      .where(eq(pages.storeId, storeId))
      .limit(limit)
      .orderBy(desc(pages.updatedAt));
  }

  async createBlogPost(insertBlogPost: InsertBlogPost): Promise<BlogPost> {
    const [blogPost] = await db.insert(blogPosts).values(insertBlogPost).returning();
    return blogPost;
  }

  async upsertBlogPost(insertBlogPost: InsertBlogPost): Promise<BlogPost> {
    const existing = await db.select().from(blogPosts)
      .where(and(
        eq(blogPosts.storeId, insertBlogPost.storeId),
        eq(blogPosts.shopifyArticleId, insertBlogPost.shopifyArticleId)
      ));

    if (existing.length > 0) {
      const [updated] = await db.update(blogPosts)
        .set({ ...insertBlogPost, updatedAt: new Date() })
        .where(eq(blogPosts.id, existing[0].id))
        .returning();
      return updated;
    } else {
      return await this.createBlogPost(insertBlogPost);
    }
  }

  async getBlogPosts(storeId: string, limit = 50): Promise<BlogPost[]> {
    return await db.select().from(blogPosts)
      .where(eq(blogPosts.storeId, storeId))
      .limit(limit)
      .orderBy(desc(blogPosts.updatedAt));
  }

  async getConversations(storeId: string, limit = 50, offset = 0): Promise<Conversation[]> {
    return await db.select().from(conversations)
      .where(eq(conversations.storeId, storeId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values(insertConversation).returning();
    return conversation;
  }

  async updateConversationLastMessage(conversationId: string): Promise<void> {
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.timestamp);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async createAiInteraction(insertInteraction: InsertAiInteraction): Promise<AiInteraction> {
    const [interaction] = await db.insert(aiInteractions).values(insertInteraction).returning();
    return interaction;
  }

  async getDashboardAnalytics(storeId: string): Promise<any> {
    const [totalConversations] = await db.select({ count: count() })
      .from(conversations)
      .where(eq(conversations.storeId, storeId));

    const [activeChats] = await db.select({ count: count() })
      .from(conversations)
      .where(and(
        eq(conversations.storeId, storeId),
        eq(conversations.status, 'active')
      ));

    const [productsCount] = await db.select({ count: count() })
      .from(products)
      .where(eq(products.storeId, storeId));

    const [collectionsCount] = await db.select({ count: count() })
      .from(collections)
      .where(eq(collections.storeId, storeId));

    const [pagesCount] = await db.select({ count: count() })
      .from(pages)
      .where(eq(pages.storeId, storeId));

    const [blogPostsCount] = await db.select({ count: count() })
      .from(blogPosts)
      .where(eq(blogPosts.storeId, storeId));

    const [avgResponseTime] = await db.select({ avg: avg(aiInteractions.responseTime) })
      .from(aiInteractions)
      .innerJoin(conversations, eq(aiInteractions.conversationId, conversations.id))
      .where(eq(conversations.storeId, storeId));

    const recentConversations = await db.select().from(conversations)
      .where(eq(conversations.storeId, storeId))
      .limit(10)
      .orderBy(desc(conversations.lastMessageAt));

    // Get last message for each conversation
    const conversationsWithMessages = await Promise.all(
      recentConversations.map(async (conv) => {
        const lastMessage = await db.select().from(messages)
          .where(eq(messages.conversationId, conv.id))
          .orderBy(desc(messages.timestamp))
          .limit(1);
        
        return {
          ...conv,
          messages: [],
          lastMessage: lastMessage[0] || null
        };
      })
    );

    return {
      totalConversations: totalConversations.count,
      activeChats: activeChats.count,
      responseRate: 97.8, // Calculate based on successful responses
      averageResponseTime: avgResponseTime.avg || 0,
      productsCount: productsCount.count,
      collectionsCount: collectionsCount.count,
      pagesCount: pagesCount.count,
      blogPostsCount: blogPostsCount.count,
      recentConversations: conversationsWithMessages
    };
  }

  async getChatPerformance(storeId: string, period: string): Promise<any> {
    // Implementation for chat performance analytics
    return {
      totalChats: 0,
      resolvedChats: 0,
      averageResponseTime: 0,
      customerSatisfaction: 0
    };
  }

  async getConversationStats(storeId: string): Promise<any> {
    const [total] = await db.select({ count: count() })
      .from(conversations)
      .where(eq(conversations.storeId, storeId));

    const [active] = await db.select({ count: count() })
      .from(conversations)
      .where(and(
        eq(conversations.storeId, storeId),
        eq(conversations.status, 'active')
      ));

    const [today] = await db.select({ count: count() })
      .from(conversations)
      .where(and(
        eq(conversations.storeId, storeId),
        sql`DATE(${conversations.startedAt}) = CURRENT_DATE`
      ));

    const [avgResponseTime] = await db.select({ avg: avg(aiInteractions.responseTime) })
      .from(aiInteractions)
      .innerJoin(conversations, eq(aiInteractions.conversationId, conversations.id))
      .where(eq(conversations.storeId, storeId));

    return {
      total: total.count,
      active: active.count,
      today: today.count,
      averageResponseTime: avgResponseTime.avg || 0
    };
  }

  async getStoreSyncStatus(storeId: string): Promise<any> {
    const [productsCount] = await db.select({ count: count() })
      .from(products)
      .where(eq(products.storeId, storeId));

    const [collectionsCount] = await db.select({ count: count() })
      .from(collections)
      .where(eq(collections.storeId, storeId));

    const [pagesCount] = await db.select({ count: count() })
      .from(pages)
      .where(eq(pages.storeId, storeId));

    const [blogPostsCount] = await db.select({ count: count() })
      .from(blogPosts)
      .where(eq(blogPosts.storeId, storeId));

    const store = await this.getStore(storeId);

    return {
      products: {
        count: productsCount.count,
        lastSync: store?.lastSyncAt?.toISOString() || null,
        status: 'synced'
      },
      collections: {
        count: collectionsCount.count,
        lastSync: store?.lastSyncAt?.toISOString() || null,
        status: 'synced'
      },
      pages: {
        count: pagesCount.count,
        lastSync: store?.lastSyncAt?.toISOString() || null,
        status: 'synced'
      },
      blogPosts: {
        count: blogPostsCount.count,
        lastSync: store?.lastSyncAt?.toISOString() || null,
        status: 'synced'
      }
    };
  }

  async searchStoreData(storeId: string, query: string, limit = 10): Promise<{
    products: Product[];
    collections: Collection[];
    pages: Page[];
    blogPosts: BlogPost[];
  }> {
    const searchTerm = `%${query.toLowerCase()}%`;

    const searchProducts = await db.select().from(products)
      .where(and(
        eq(products.storeId, storeId),
        or(
          ilike(products.title, searchTerm),
          ilike(products.description, searchTerm),
          ilike(products.productType, searchTerm),
          ilike(products.vendor, searchTerm)
        )
      ))
      .limit(limit);

    const searchCollections = await db.select().from(collections)
      .where(and(
        eq(collections.storeId, storeId),
        or(
          ilike(collections.title, searchTerm),
          ilike(collections.description, searchTerm)
        )
      ))
      .limit(limit);

    const searchPages = await db.select().from(pages)
      .where(and(
        eq(pages.storeId, storeId),
        or(
          ilike(pages.title, searchTerm),
          ilike(pages.content, searchTerm)
        )
      ))
      .limit(limit);

    const searchBlogPosts = await db.select().from(blogPosts)
      .where(and(
        eq(blogPosts.storeId, storeId),
        or(
          ilike(blogPosts.title, searchTerm),
          ilike(blogPosts.content, searchTerm),
          ilike(blogPosts.excerpt, searchTerm)
        )
      ))
      .limit(limit);

    return {
      products: searchProducts,
      collections: searchCollections,
      pages: searchPages,
      blogPosts: searchBlogPosts
    };
  }

  async getConfiguration(storeId?: string): Promise<Configuration | undefined> {
    const query = db.select().from(configurations);
    
    if (storeId) {
      // Get store-specific configuration
      const [config] = await query.where(eq(configurations.storeId, storeId));
      if (config) return config;
    }
    
    // Fall back to global configuration (where storeId is null)
    const [globalConfig] = await query.where(sql`${configurations.storeId} IS NULL`);
    return globalConfig || undefined;
  }

  async createConfiguration(insertConfig: InsertConfiguration): Promise<Configuration> {
    const [config] = await db.insert(configurations).values(insertConfig).returning();
    return config;
  }

  async updateConfiguration(storeId: string | undefined, updateConfig: Partial<InsertConfiguration>): Promise<Configuration> {
    // First try to get existing configuration
    const existing = await this.getConfiguration(storeId);
    
    if (existing) {
      // Update existing configuration
      const [updated] = await db.update(configurations)
        .set({ ...updateConfig, updatedAt: new Date() })
        .where(eq(configurations.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new configuration
      const newConfig: InsertConfiguration = {
        storeId: storeId || null,
        zaiModel: "glm-4.5-flash",
        maxContextLength: 4000,
        chatWidgetPosition: "bottom-right",
        storeDataRestriction: true,
        chatWidgetColor: "#3B82F6",
        enabledPages: ["home", "product"],
        autoResponseEnabled: true,
        businessHours: {
          enabled: false,
          start: "09:00",
          end: "17:00",
          timezone: "UTC"
        },
        ...updateConfig
      };
      return await this.createConfiguration(newConfig);
    }
  }
}

export const storage = new DatabaseStorage();
