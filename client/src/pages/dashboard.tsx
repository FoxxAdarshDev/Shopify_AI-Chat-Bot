import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import StatsCards from "@/components/dashboard/stats-cards";
import ConversationList from "@/components/dashboard/conversation-list";
import LiveChatPreview from "@/components/chat/live-chat-preview";
import SyncStatus from "@/components/dashboard/sync-status";
import EnvConfigModal from "@/components/modals/env-config-modal";
import { DashboardAnalytics } from "@/types";
import { useState } from "react";

export default function Dashboard() {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const { data: analytics, isLoading } = useQuery<DashboardAnalytics>({
    queryKey: ['/api/analytics/dashboard'],
    refetchInterval: 30000 // Refetch every 30 seconds for live data
  });

  const { data: store } = useQuery({
    queryKey: ['/api/stores/current']
  });

  const handleSync = async () => {
    try {
      if (store?.id) {
        await fetch(`/api/stores/${store.id}/sync`, { method: 'POST' });
        // Refresh data after sync
        window.location.reload();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar store={store} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar store={store} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" data-testid="page-title">Dashboard Overview</h2>
              <p className="text-muted-foreground">Monitor your AI chat support performance</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium hover:bg-secondary/90 transition-colors"
                onClick={() => setIsConfigModalOpen(true)}
                data-testid="button-configure-apis"
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2m0 0a2 2 0 012-2"/>
                </svg>
                Configure APIs
              </button>
              <button 
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
                onClick={handleSync}
                data-testid="button-sync-store"
              >
                Sync Store Data
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Stats Cards */}
          <StatsCards analytics={analytics} />

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Recent Conversations */}
            <div className="lg:col-span-2">
              <ConversationList conversations={analytics?.recentConversations || []} />
            </div>

            {/* Live Chat Preview */}
            <div>
              <LiveChatPreview />
            </div>
          </div>

          {/* Store Data Sync Status */}
          <div className="mt-8">
            <SyncStatus />
          </div>
        </div>
      </main>

      {/* Environment Configuration Modal */}
      <EnvConfigModal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
      />
    </div>
  );
}
