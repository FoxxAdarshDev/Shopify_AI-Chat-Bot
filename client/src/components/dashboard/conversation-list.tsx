import { ConversationWithMessages } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface ConversationListProps {
  conversations: ConversationWithMessages[];
}

export default function ConversationList({ conversations }: ConversationListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (message.length <= maxLength) return message;
    return message.slice(0, maxLength) + '...';
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Conversations</h3>
          <button className="text-accent hover:text-accent/80 text-sm font-medium" data-testid="button-view-all">
            View All
          </button>
        </div>
      </div>
      <div className="p-6">
        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            <p className="text-muted-foreground">No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <div 
                key={conversation.id} 
                className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                data-testid={`conversation-${conversation.id}`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-medium text-sm">
                    {getInitials(conversation.customerName)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium" data-testid={`conversation-name-${conversation.id}`}>
                      {conversation.customerName || 'Anonymous User'}
                    </p>
                    <span className="text-xs text-muted-foreground" data-testid={`conversation-time-${conversation.id}`}>
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate" data-testid={`conversation-message-${conversation.id}`}>
                    {conversation.lastMessage?.content ? 
                      truncateMessage(conversation.lastMessage.content) : 
                      'No messages yet'
                    }
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(conversation.status)}`}>
                      {conversation.status === 'active' ? 'AI Responded' : 
                       conversation.status === 'processing' ? 'Processing' : 'Completed'}
                    </span>
                    {conversation.lastMessage?.metadata?.responseTime && (
                      <span className="text-xs text-muted-foreground">
                        {(conversation.lastMessage.metadata.responseTime / 1000).toFixed(1)}s response
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
