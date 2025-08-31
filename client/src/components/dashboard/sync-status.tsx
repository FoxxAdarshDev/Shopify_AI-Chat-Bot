import { useQuery } from "@tanstack/react-query";
import { SyncStatus as SyncStatusType } from "@/types";
import { formatDistanceToNow } from "date-fns";

export default function SyncStatus() {
  const { data: syncStatus, isLoading } = useQuery<SyncStatusType>({
    queryKey: ['/api/stores/current/sync-status'],
    refetchInterval: 30000
  });

  const syncItems = [
    {
      type: "Products",
      count: syncStatus?.products?.count || 0,
      lastSync: syncStatus?.products?.lastSync,
      status: syncStatus?.products?.status || 'unknown',
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
      ),
      bgColor: "bg-green-100"
    },
    {
      type: "Collections",
      count: syncStatus?.collections?.count || 0,
      lastSync: syncStatus?.collections?.lastSync,
      status: syncStatus?.collections?.status || 'unknown',
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      ),
      bgColor: "bg-blue-100"
    },
    {
      type: "Pages",
      count: syncStatus?.pages?.count || 0,
      lastSync: syncStatus?.pages?.lastSync,
      status: syncStatus?.pages?.status || 'unknown',
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      ),
      bgColor: "bg-purple-100"
    },
    {
      type: "Blog Posts",
      count: syncStatus?.blogPosts?.count || 0,
      lastSync: syncStatus?.blogPosts?.lastSync,
      status: syncStatus?.blogPosts?.status || 'unknown',
      icon: (
        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
        </svg>
      ),
      bgColor: "bg-orange-100"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced':
        return 'text-green-600';
      case 'syncing':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold">Store Data Synchronization</h3>
        <p className="text-sm text-muted-foreground">Monitor the status of your store data integration</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {syncItems.map((item) => (
            <div key={item.type} className="text-center" data-testid={`sync-${item.type.toLowerCase().replace(' ', '-')}`}>
              <div className={`w-16 h-16 mx-auto ${item.bgColor} rounded-full flex items-center justify-center mb-3`}>
                {item.icon}
              </div>
              <h4 className="font-medium">{item.type}</h4>
              <p className={`text-2xl font-bold ${getStatusColor(item.status)}`} data-testid={`sync-count-${item.type.toLowerCase().replace(' ', '-')}`}>
                {item.count}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.lastSync ? 
                  `Last sync: ${formatDistanceToNow(new Date(item.lastSync), { addSuffix: true })}` :
                  'Never synced'
                }
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
