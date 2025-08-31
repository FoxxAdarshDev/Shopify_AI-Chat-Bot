import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { SyncStatus as SyncStatusType } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function StoreSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: store } = useQuery({
    queryKey: ['/api/stores/current']
  });

  const { data: syncStatus, isLoading } = useQuery<SyncStatusType>({
    queryKey: ['/api/stores/current/sync-status'],
    refetchInterval: 5000,
    enabled: !!store?.id
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) throw new Error('No store found');
      
      const response = await fetch(`/api/stores/${store.id}/sync`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Sync failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sync initiated",
        description: "Store data synchronization has been started.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores/current/sync-status'] });
    },
    onError: (error) => {
      toast({
        title: "Sync failed",
        description: "Failed to initiate store data sync. Please try again.",
        variant: "destructive"
      });
    }
  });

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'syncing':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced':
        return 'bg-green-100 text-green-800';
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const syncItems = [
    {
      type: "Products",
      key: "products",
      description: "Product catalog including variants, pricing, and inventory",
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
      ),
      bgColor: "bg-green-100"
    },
    {
      type: "Collections",
      key: "collections",
      description: "Product collections and categories",
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      ),
      bgColor: "bg-blue-100"
    },
    {
      type: "Pages",
      key: "pages",
      description: "Store pages including policies and information",
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      ),
      bgColor: "bg-purple-100"
    },
    {
      type: "Blog Posts",
      key: "blogPosts",
      description: "Blog articles and content marketing",
      icon: (
        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
        </svg>
      ),
      bgColor: "bg-orange-100"
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar store={store} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sync status...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar store={store} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" data-testid="page-title">Store Data Synchronization</h2>
              <p className="text-muted-foreground">Manage and monitor your Shopify store data integration</p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="bg-primary text-primary-foreground"
                data-testid="button-sync-all"
              >
                {syncMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync All Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {/* Sync Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {syncItems.map((item) => {
              const itemData = syncStatus?.[item.key as keyof SyncStatusType];
              return (
                <Card key={item.type} data-testid={`sync-card-${item.key}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                        {item.icon}
                      </div>
                      {getSyncStatusIcon(itemData?.status || 'unknown')}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg mb-1">{item.type}</CardTitle>
                    <p className="text-3xl font-bold mb-2" data-testid={`sync-count-${item.key}`}>
                      {itemData?.count || 0}
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge className={getSyncStatusColor(itemData?.status || 'unknown')}>
                        {itemData?.status || 'Unknown'}
                      </Badge>
                      {itemData?.lastSync && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(itemData.lastSync), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Sync Configuration */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Sync Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Automatic Sync Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-sync interval</span>
                      <Badge variant="outline">Every 6 hours</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Webhook sync</span>
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Real-time updates</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Data Quality</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Data completeness</span>
                      <Badge className="bg-green-100 text-green-800">98.5%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last error</span>
                      <span className="text-xs text-muted-foreground">None</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API quota used</span>
                      <Badge variant="outline">15%</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sync History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border border-border rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">Full data synchronization completed</p>
                    <p className="text-sm text-muted-foreground">
                      Synced 847 products, 23 collections, 12 pages, and 45 blog posts
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">2 hours ago</span>
                </div>
                
                <div className="flex items-center gap-4 p-4 border border-border rounded-lg">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium">Webhook update received</p>
                    <p className="text-sm text-muted-foreground">
                      Product "Wireless Headphones Pro" was updated
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">15 minutes ago</span>
                </div>
                
                <div className="flex items-center gap-4 p-4 border border-border rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">New collection added</p>
                    <p className="text-sm text-muted-foreground">
                      "Summer Electronics" collection created
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">1 hour ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
