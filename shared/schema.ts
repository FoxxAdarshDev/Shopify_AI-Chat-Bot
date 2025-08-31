import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for basic user management
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Shopify stores table
export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  shopifyDomain: text("shopify_domain").notNull().unique(),
  shopifyStoreId: text("shopify_store_id").notNull().unique(),
  storeName: text("store_name").notNull(),
  accessToken: text("access_token").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  installedAt: timestamp("installed_at").defaultNow().notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  settings: jsonb("settings").default({}).notNull(),
});

// Store data cache tables
export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  shopifyProductId: text("shopify_product_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  handle: text("handle").notNull(),
  productType: text("product_type"),
  vendor: text("vendor"),
  tags: text("tags").array(),
  price: text("price"),
  compareAtPrice: text("compare_at_price"),
  images: jsonb("images").default([]).notNull(),
  variants: jsonb("variants").default([]).notNull(),
  options: jsonb("options").default([]).notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  shopifyCollectionId: text("shopify_collection_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  handle: text("handle").notNull(),
  image: jsonb("image"),
  productsCount: integer("products_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  shopifyPageId: text("shopify_page_id").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  handle: text("handle").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  shopifyBlogId: text("shopify_blog_id").notNull(),
  shopifyArticleId: text("shopify_article_id").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  excerpt: text("excerpt"),
  handle: text("handle").notNull(),
  tags: text("tags").array(),
  status: text("status").notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat conversations and messages
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  sessionId: text("session_id").notNull(),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  status: text("status").default("active").notNull(), // active, closed, archived
  startedAt: timestamp("started_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").references(() => conversations.id).notNull(),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  metadata: jsonb("metadata").default({}).notNull(), // For storing AI response data, product references, etc.
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// AI interaction logs
export const aiInteractions = pgTable("ai_interactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").references(() => conversations.id).notNull(),
  messageId: uuid("message_id").references(() => messages.id).notNull(),
  model: text("model").notNull(),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  tokensUsed: integer("tokens_used"),
  responseTime: integer("response_time"), // in milliseconds
  contextData: jsonb("context_data").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const storeRelations = relations(stores, ({ many }) => ({
  products: many(products),
  collections: many(collections),
  pages: many(pages),
  blogPosts: many(blogPosts),
  conversations: many(conversations),
}));

export const productRelations = relations(products, ({ one }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
}));

export const collectionRelations = relations(collections, ({ one }) => ({
  store: one(stores, { fields: [collections.storeId], references: [stores.id] }),
}));

export const pageRelations = relations(pages, ({ one }) => ({
  store: one(stores, { fields: [pages.storeId], references: [stores.id] }),
}));

export const blogPostRelations = relations(blogPosts, ({ one }) => ({
  store: one(stores, { fields: [blogPosts.storeId], references: [stores.id] }),
}));

export const conversationRelations = relations(conversations, ({ one, many }) => ({
  store: one(stores, { fields: [conversations.storeId], references: [stores.id] }),
  messages: many(messages),
  aiInteractions: many(aiInteractions),
}));

export const messageRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  aiInteractions: many(aiInteractions),
}));

export const aiInteractionRelations = relations(aiInteractions, ({ one }) => ({
  conversation: one(conversations, { fields: [aiInteractions.conversationId], references: [conversations.id] }),
  message: one(messages, { fields: [aiInteractions.messageId], references: [messages.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertStoreSchema = createInsertSchema(stores).omit({ id: true, installedAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCollectionSchema = createInsertSchema(collections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPageSchema = createInsertSchema(pages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, startedAt: true, lastMessageAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, timestamp: true });
export const insertAiInteractionSchema = createInsertSchema(aiInteractions).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Collection = typeof collections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type AiInteraction = typeof aiInteractions.$inferSelect;
export type InsertAiInteraction = z.infer<typeof insertAiInteractionSchema>;
