import { Switch, Route } from "wouter";
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
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
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
  const shopFromWindow = (window as any).shopifyShop;
  const shop = shopFromUrl || shopFromWindow;

  // Store shop in URL for all subsequent requests
  if (shop && !shopFromUrl) {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('shop', shop);
    window.history.replaceState({}, '', newUrl.toString());
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
