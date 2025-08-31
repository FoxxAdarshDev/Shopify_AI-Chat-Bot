import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// App Bridge is already loaded via script tag in HTML, so we don't need the React provider for now
import Dashboard from "@/pages/dashboard";
import ChatManagement from "@/pages/chat-management";
import Analytics from "@/pages/analytics";
import StoreSync from "@/pages/store-sync";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  
  // Debug logging for routing
  console.log('Current route location:', location, 'window.location.pathname:', window.location.pathname);
  
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/app" component={Dashboard} />
      <Route path="/chat-management" component={ChatManagement} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/store-sync" component={StoreSync} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Get shop parameter from URL or window object (for embedded apps)
  const urlParams = new URLSearchParams(window.location.search);
  const shopFromUrl = urlParams.get('shop');
  const hostFromUrl = urlParams.get('host');
  const isEmbedded = urlParams.get('embedded') === 'true' || window.top !== window.self;
  const shopFromWindow = (window as any).shopifyShop;
  const shop = shopFromUrl || shopFromWindow;
  
  // Debug logging for embedded app
  if (isEmbedded) {
    console.log('Embedded app detected:', {
      shop,
      shopFromUrl,
      shopFromWindow,
      host: hostFromUrl,
      embedded: isEmbedded,
      urlParams: Object.fromEntries(urlParams.entries())
    });
  }

  // Store shop in URL for all subsequent requests
  if (shop && !shopFromUrl) {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('shop', shop);
    if (hostFromUrl) newUrl.searchParams.set('host', hostFromUrl);
    if (isEmbedded) newUrl.searchParams.set('embedded', 'true');
    window.history.replaceState({}, '', newUrl.toString());
  }

  // Initialize App Bridge for embedded apps
  if (isEmbedded && shop && hostFromUrl && typeof window !== 'undefined') {
    const AppBridge = (window as any).app;
    if (!AppBridge && (window as any).ShopifyApp) {
      const app = (window as any).ShopifyApp.createApp({
        apiKey: document.querySelector('meta[name="shopify-api-key"]')?.getAttribute('content') || '',
        host: hostFromUrl,
        forceRedirect: true
      });
      (window as any).app = app;
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {!shop && !isEmbedded ? (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center max-w-md mx-auto p-6">
              <h1 className="text-2xl font-bold mb-4">AI Chat Support</h1>
              <p className="text-muted-foreground mb-4">
                This app needs to be installed from your Shopify admin.
              </p>
              <p className="text-sm text-muted-foreground">
                Missing shop parameter. Please install from Shopify admin.
              </p>
            </div>
          </div>
        ) : (
          <Router />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
