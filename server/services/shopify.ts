import crypto from 'crypto';
import { InsertStore, InsertProduct, InsertCollection, InsertPage, InsertBlogPost } from '@shared/schema';
import { storage } from '../storage';

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  handle: string;
  product_type: string;
  vendor: string;
  tags: string;
  status: string;
  variants: any[];
  images: any[];
  options: any[];
}

interface ShopifyCollection {
  id: number;
  title: string;
  body_html: string;
  handle: string;
  image: any;
  products_count: number;
}

interface ShopifyPage {
  id: number;
  title: string;
  body_html: string;
  handle: string;
  published_at: string;
}

interface ShopifyArticle {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  handle: string;
  tags: string;
  published_at: string;
  blog_id: number;
}

class ShopifyService {
  private readonly apiKey = process.env.SHOPIFY_API_KEY || '';
  private readonly apiSecret = process.env.SHOPIFY_API_SECRET || '';
  private readonly scopes = 'read_products,read_collections,read_content,read_orders,read_customers';
  private readonly redirectUri = process.env.SHOPIFY_REDIRECT_URI || 'https://your-app-domain.com/api/auth/shopify/callback';

  getAuthUrl(shop: string): string {
    const state = crypto.randomBytes(16).toString('hex');
    const authUrl = new URL(`https://${shop}.myshopify.com/admin/oauth/authorize`);
    
    authUrl.searchParams.set('client_id', this.apiKey);
    authUrl.searchParams.set('scope', this.scopes);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('state', state);
    
    return authUrl.toString();
  }

  async handleCallback(code: string, shop: string): Promise<InsertStore> {
    const accessToken = await this.exchangeCodeForToken(code, shop);
    const shopData = await this.getShopData(shop, accessToken);
    
    return {
      shopifyDomain: shop,
      shopifyStoreId: shopData.id.toString(),
      storeName: shopData.name,
      accessToken,
      isActive: true,
      settings: {
        timezone: shopData.timezone,
        currency: shopData.currency,
        domain: shopData.domain
      }
    };
  }

  private async exchangeCodeForToken(code: string, shop: string): Promise<string> {
    const response = await fetch(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.apiKey,
        client_secret: this.apiSecret,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  private async getShopData(shop: string, accessToken: string): Promise<any> {
    const response = await fetch(`https://${shop}.myshopify.com/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch shop data: ${response.statusText}`);
    }

    const data = await response.json();
    return data.shop;
  }

  async syncStoreData(storeId: string, accessToken: string, shop: string): Promise<void> {
    try {
      console.log(`Starting data sync for store ${storeId}`);
      
      // Sync products
      await this.syncProducts(storeId, accessToken, shop);
      
      // Sync collections
      await this.syncCollections(storeId, accessToken, shop);
      
      // Sync pages
      await this.syncPages(storeId, accessToken, shop);
      
      // Sync blog articles
      await this.syncBlogArticles(storeId, accessToken, shop);
      
      // Update last sync time
      await storage.updateStoreLastSync(storeId);
      
      console.log(`Data sync completed for store ${storeId}`);
    } catch (error) {
      console.error(`Data sync failed for store ${storeId}:`, error);
      throw error;
    }
  }

  private async syncProducts(storeId: string, accessToken: string, shop: string): Promise<void> {
    let hasNextPage = true;
    let pageInfo = '';
    
    while (hasNextPage) {
      const url = pageInfo 
        ? `https://${shop}.myshopify.com/admin/api/2023-10/products.json?limit=250&page_info=${pageInfo}`
        : `https://${shop}.myshopify.com/admin/api/2023-10/products.json?limit=250`;
      
      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const data = await response.json();
      const products: ShopifyProduct[] = data.products;

      // Process products in batches
      for (const product of products) {
        const productData: InsertProduct = {
          storeId,
          shopifyProductId: product.id.toString(),
          title: product.title,
          description: product.body_html,
          handle: product.handle,
          productType: product.product_type,
          vendor: product.vendor,
          tags: product.tags ? product.tags.split(',').map(tag => tag.trim()) : [],
          price: product.variants?.[0]?.price || '0.00',
          compareAtPrice: product.variants?.[0]?.compare_at_price,
          images: product.images || [],
          variants: product.variants || [],
          options: product.options || [],
          status: product.status
        };

        await storage.upsertProduct(productData);
      }

      // Check for pagination
      const linkHeader = response.headers.get('Link');
      hasNextPage = linkHeader?.includes('rel="next"') || false;
      
      if (hasNextPage && linkHeader) {
        const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]*)[^>]*>; rel="next"/);
        pageInfo = nextMatch ? nextMatch[1] : '';
      }
    }
  }

  private async syncCollections(storeId: string, accessToken: string, shop: string): Promise<void> {
    const response = await fetch(`https://${shop}.myshopify.com/admin/api/2023-10/custom_collections.json?limit=250`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }

    const data = await response.json();
    const collections: ShopifyCollection[] = data.custom_collections;

    for (const collection of collections) {
      const collectionData: InsertCollection = {
        storeId,
        shopifyCollectionId: collection.id.toString(),
        title: collection.title,
        description: collection.body_html,
        handle: collection.handle,
        image: collection.image,
        productsCount: collection.products_count
      };

      await storage.upsertCollection(collectionData);
    }
  }

  private async syncPages(storeId: string, accessToken: string, shop: string): Promise<void> {
    const response = await fetch(`https://${shop}.myshopify.com/admin/api/2023-10/pages.json?limit=250`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pages: ${response.statusText}`);
    }

    const data = await response.json();
    const pages: ShopifyPage[] = data.pages;

    for (const page of pages) {
      const pageData: InsertPage = {
        storeId,
        shopifyPageId: page.id.toString(),
        title: page.title,
        content: page.body_html,
        handle: page.handle,
        status: page.published_at ? 'published' : 'draft'
      };

      await storage.upsertPage(pageData);
    }
  }

  private async syncBlogArticles(storeId: string, accessToken: string, shop: string): Promise<void> {
    // First get all blogs
    const blogsResponse = await fetch(`https://${shop}.myshopify.com/admin/api/2023-10/blogs.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!blogsResponse.ok) {
      throw new Error(`Failed to fetch blogs: ${blogsResponse.statusText}`);
    }

    const blogsData = await blogsResponse.json();
    const blogs = blogsData.blogs;

    // Then get articles from each blog
    for (const blog of blogs) {
      const articlesResponse = await fetch(`https://${shop}.myshopify.com/admin/api/2023-10/blogs/${blog.id}/articles.json?limit=250`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      });

      if (!articlesResponse.ok) {
        console.error(`Failed to fetch articles for blog ${blog.id}: ${articlesResponse.statusText}`);
        continue;
      }

      const articlesData = await articlesResponse.json();
      const articles: ShopifyArticle[] = articlesData.articles;

      for (const article of articles) {
        const articleData: InsertBlogPost = {
          storeId,
          shopifyBlogId: blog.id.toString(),
          shopifyArticleId: article.id.toString(),
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          handle: article.handle,
          tags: article.tags ? article.tags.split(',').map(tag => tag.trim()) : [],
          status: article.published_at ? 'published' : 'draft',
          publishedAt: article.published_at ? new Date(article.published_at) : null
        };

        await storage.upsertBlogPost(articleData);
      }
    }
  }

  async searchStoreData(storeId: string, query: string, limit: number = 10): Promise<{
    products: any[];
    collections: any[];
    pages: any[];
    blogPosts: any[];
  }> {
    return await storage.searchStoreData(storeId, query, limit);
  }

  verifyWebhook(data: string, hmacHeader: string): boolean {
    const calculatedHmac = crypto
      .createHmac('sha256', this.apiSecret)
      .update(data, 'utf8')
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(calculatedHmac, 'base64'),
      Buffer.from(hmacHeader, 'base64')
    );
  }
}

export const shopifyService = new ShopifyService();
