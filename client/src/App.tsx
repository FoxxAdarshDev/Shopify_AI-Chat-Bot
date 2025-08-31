import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";
import Dashboard from "@/pages/dashboard";
import ChatManagement from "@/pages/chat-management";
import Analytics from "@/pages/analytics";
import StoreSync from "@/pages/store-sync";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";

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
  const [apiKey, setApiKey] = useState<string>('');
  const [host, setHost] = useState<string>('');

  useEffect(() => {
    // Get API key from server
    fetch('/api/config/shopify-api-key')
      .then(res => res.json())
      .then(data => setApiKey(data.apiKey))
      .catch(console.error);

    // Get host parameter from URL (provided by Shopify)
    const urlParams = new URLSearchParams(window.location.search);
    const hostParam = urlParams.get('host');
    if (hostParam) {
      setHost(hostParam);
    }
  }, []);

  // If we have both API key and host, wrap with App Bridge
  if (apiKey && host) {
    return (
      <AppBridgeProvider
        config={{
          apiKey,
          host,
          forceRedirect: false,
        }}
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </AppBridgeProvider>
    );
  }

  // If no host parameter, show standalone version (for testing)
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
