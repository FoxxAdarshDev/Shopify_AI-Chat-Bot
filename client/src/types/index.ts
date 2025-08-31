export interface Store {
  id: string;
  shopifyDomain: string;
  shopifyStoreId: string;
  storeName: string;
  isActive: boolean;
  installedAt: string;
  lastSyncAt?: string;
  settings: Record<string, any>;
}

export interface Product {
  id: string;
  storeId: string;
  shopifyProductId: string;
  title: string;
  description?: string;
  handle: string;
  productType?: string;
  vendor?: string;
  tags: string[];
  price?: string;
  compareAtPrice?: string;
  images: any[];
  variants: any[];
  options: any[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  storeId: string;
  shopifyCollectionId: string;
  title: string;
  description?: string;
  handle: string;
  image?: any;
  productsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  storeId: string;
  sessionId: string;
  customerName?: string;
  customerEmail?: string;
  status: 'active' | 'closed' | 'archived';
  startedAt: string;
  lastMessageAt: string;
  metadata: Record<string, any>;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface DashboardAnalytics {
  totalConversations: number;
  activeChats: number;
  responseRate: number;
  averageResponseTime: number;
  productsCount: number;
  collectionsCount: number;
  pagesCount: number;
  blogPostsCount: number;
  recentConversations: ConversationWithMessages[];
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
  lastMessage?: Message;
}

export interface SyncStatus {
  products: {
    count: number;
    lastSync: string;
    status: 'synced' | 'syncing' | 'error';
  };
  collections: {
    count: number;
    lastSync: string;
    status: 'synced' | 'syncing' | 'error';
  };
  pages: {
    count: number;
    lastSync: string;
    status: 'synced' | 'syncing' | 'error';
  };
  blogPosts: {
    count: number;
    lastSync: string;
    status: 'synced' | 'syncing' | 'error';
  };
}

export interface ChatConfiguration {
  zaiModel: string;
  maxContextLength: number;
  chatWidgetPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  storeDataRestriction: boolean;
}

export interface WebSocketMessage {
  type: 'new_message' | 'typing_start' | 'typing_stop' | 'joined' | 'error';
  conversationId?: string;
  message?: Message;
  error?: string;
}
