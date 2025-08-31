import { Store, Product, Collection, Page, BlogPost } from "@/types";

export interface ShopifyAuthParams {
  shop: string;
  code?: string;
  state?: string;
  hmac?: string;
  timestamp?: string;
}

export interface ShopifyStoreInfo {
  id: number;
  name: string;
  domain: string;
  email: string;
  currency: string;
  timezone: string;
  shop_owner: string;
  plan_name: string;
}

class ShopifyClient {
  private readonly apiVersion = '2023-10';

  /**
   * Get the OAuth authorization URL for Shopify app installation
   */
  getInstallUrl(shop: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/auth/shopify?shop=${encodeURIComponent(shop)}`;
  }

  /**
   * Verify if the current session is authenticated with Shopify
   */
  async verifyAuthentication(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/verify', {
        credentials: 'include'
      });
      return response.ok;
    } catch (error) {
      console.error('Auth verification failed:', error);
      return false;
    }
  }

  /**
   * Get current store information
   */
  async getCurrentStore(): Promise<Store | null> {
    try {
      const response = await fetch('/api/stores/current', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get current store:', error);
      return null;
    }
  }

  /**
   * Initiate manual sync of store data
   */
  async syncStoreData(storeId: string): Promise<void> {
    const response = await fetch(`/api/stores/${storeId}/sync`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to initiate sync');
    }
  }

  /**
   * Get store sync status
   */
  async getSyncStatus(storeId: string): Promise<any> {
    const response = await fetch(`/api/stores/${storeId}/sync-status`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to get sync status');
    }

    return await response.json();
  }

  /**
   * Search store products
   */
  async searchProducts(storeId: string, query: string, limit = 10): Promise<Product[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      type: 'products'
    });

    const response = await fetch(`/api/stores/${storeId}/search?${params}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to search products');
    }

    const data = await response.json();
    return data.products || [];
  }

  /**
   * Search store collections
   */
  async searchCollections(storeId: string, query: string, limit = 10): Promise<Collection[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      type: 'collections'
    });

    const response = await fetch(`/api/stores/${storeId}/search?${params}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to search collections');
    }

    const data = await response.json();
    return data.collections || [];
  }

  /**
   * Get product details by handle
   */
  async getProductByHandle(storeId: string, handle: string): Promise<Product | null> {
    try {
      const response = await fetch(`/api/stores/${storeId}/products/${handle}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get product by handle:', error);
      return null;
    }
  }

  /**
   * Get collection details by handle
   */
  async getCollectionByHandle(storeId: string, handle: string): Promise<Collection | null> {
    try {
      const response = await fetch(`/api/stores/${storeId}/collections/${handle}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get collection by handle:', error);
      return null;
    }
  }

  /**
   * Format Shopify price for display
   */
  formatPrice(price: string | number, currency = 'USD'): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(numPrice);
  }

  /**
   * Generate product URL for the storefront
   */
  getProductUrl(store: Store, product: Product): string {
    return `https://${store.shopifyDomain}/products/${product.handle}`;
  }

  /**
   * Generate collection URL for the storefront
   */
  getCollectionUrl(store: Store, collection: Collection): string {
    return `https://${store.shopifyDomain}/collections/${collection.handle}`;
  }

  /**
   * Generate page URL for the storefront
   */
  getPageUrl(store: Store, page: Page): string {
    return `https://${store.shopifyDomain}/pages/${page.handle}`;
  }

  /**
   * Parse Shopify shop parameter from URL
   */
  getShopFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('shop');
  }

  /**
   * Check if app installation is complete
   */
  isInstallationComplete(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('installed') === 'true';
  }

  /**
   * Validate Shopify shop domain format
   */
  isValidShopDomain(shop: string): boolean {
    const shopRegex = /^[a-zA-Z0-9-]+\.myshopify\.com$/;
    return shopRegex.test(shop) || /^[a-zA-Z0-9-]+$/.test(shop);
  }

  /**
   * Extract shop name from domain
   */
  extractShopName(domain: string): string {
    return domain.replace('.myshopify.com', '');
  }

  /**
   * Build GraphQL query for products
   */
  buildProductQuery(limit = 50): string {
    return `
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              description
              productType
              vendor
              tags
              status
              images(first: 5) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price
                    compareAtPrice
                    inventoryQuantity
                    availableForSale
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
  }

  /**
   * Build GraphQL query for collections
   */
  buildCollectionQuery(limit = 50): string {
    return `
      query getCollections($first: Int!) {
        collections(first: $first) {
          edges {
            node {
              id
              title
              handle
              description
              image {
                url
                altText
              }
              productsCount
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
  }
}

export const shopifyClient = new ShopifyClient();

// Utility functions for Shopify data processing
export const shopifyUtils = {
  /**
   * Extract Shopify ID from GraphQL global ID
   */
  extractShopifyId(gid: string): string {
    return gid.split('/').pop() || '';
  },

  /**
   * Create GraphQL global ID
   */
  createGlobalId(type: string, id: string): string {
    return `gid://shopify/${type}/${id}`;
  },

  /**
   * Parse Shopify money format
   */
  parseMoney(money: string): number {
    return parseFloat(money) / 100;
  },

  /**
   * Format money for Shopify API
   */
  formatMoney(amount: number): string {
    return (amount * 100).toString();
  },

  /**
   * Extract image URLs from Shopify image objects
   */
  extractImageUrls(images: any[]): string[] {
    return images.map(image => image.url || image.src).filter(Boolean);
  },

  /**
   * Clean HTML content for plain text display
   */
  stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  },

  /**
   * Truncate text to specified length
   */
  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  }
};
