import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { ConversationWithMessages } from "@/types";
import { Store } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function ChatManagement() {
  // Get shop parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop');

  const { data: store } = useQuery<Store>({
    queryKey: ['/api/stores/current', shop],
    queryFn: async () => {
      const url = shop 
        ? `/api/stores/current?shop=${encodeURIComponent(shop)}`
        : '/api/stores/current';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch store');
      }
      return response.json();
    }
  });

  const { data: conversations, isLoading } = useQuery<ConversationWithMessages[]>({
    queryKey: ['/api/conversations', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const response = await fetch(`/api/conversations?storeId=${store.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      return response.json();
    },
    enabled: !!store?.id,
    refetchInterval: 10000
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar store={store} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading conversations...</p>
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
              <h2 className="text-2xl font-bold" data-testid="page-title">Chat Management</h2>
              <p className="text-muted-foreground">Monitor and manage customer conversations</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {conversations?.length || 0} total conversations
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {!conversations || conversations.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
              <p className="text-muted-foreground">Customer conversations will appear here once your chat widget is active.</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold">All Conversations</h3>
              </div>
              <div className="divide-y divide-border">
                {conversations.map((conversation) => (
                  <div 
                    key={conversation.id} 
                    className="p-6 hover:bg-muted/50 transition-colors cursor-pointer"
                    data-testid={`conversation-item-${conversation.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {conversation.customerName?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium" data-testid={`conversation-name-${conversation.id}`}>
                              {conversation.customerName || 'Anonymous User'}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(conversation.status)}`}>
                              {conversation.status}
                            </span>
                          </div>
                          {conversation.customerEmail && (
                            <p className="text-sm text-muted-foreground mb-2">{conversation.customerEmail}</p>
                          )}
                          <p className="text-sm text-muted-foreground mb-2">
                            Session ID: {conversation.sessionId}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Started: {formatDistanceToNow(new Date(conversation.startedAt), { addSuffix: true })}
                            </span>
                            <span>
                              Last message: {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                            </span>
                            <span>
                              Messages: {conversation.messages?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">
                          View Details
                        </button>
                        {conversation.status === 'active' && (
                          <button className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/90">
                            Close Chat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
