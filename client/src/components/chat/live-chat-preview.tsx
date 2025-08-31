import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { Message } from "@/types";

export default function LiveChatPreview() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { isConnected, sendMessage } = useWebSocket('/ws');

  // Mock conversation for preview
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: '1',
        conversationId: 'preview',
        role: 'user',
        content: "Hi! I'm looking for bluetooth headphones under $100. What do you recommend?",
        metadata: {},
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        conversationId: 'preview',
        role: 'assistant',
        content: "I'd be happy to help you find the perfect bluetooth headphones! Based on your budget of under $100, I found several great options in our store:",
        metadata: {
          products: [
            {
              title: "TechSound Pro Wireless",
              price: "$79.99",
              description: "Great sound quality, 30hr battery"
            }
          ]
        },
        timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        conversationId: 'preview',
        role: 'user',
        content: "That sounds perfect! Can you tell me more about the battery life and if it has noise cancellation?",
        metadata: {},
        timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString()
      }
    ];

    setMessages(mockMessages);

    // Simulate typing indicator
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const aiResponse: Message = {
          id: '4',
          conversationId: 'preview',
          role: 'assistant',
          content: "The TechSound Pro Wireless features an impressive 30-hour battery life and active noise cancellation technology. It's perfect for your needs!",
          metadata: {},
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 2000);
    }, 3000);
  }, []);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Live Chat Preview</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-4 h-96 overflow-y-auto" data-testid="chat-preview">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`p-3 rounded-lg max-w-xs ${
                message.role === 'user' 
                  ? 'chat-bubble-user text-white' 
                  : 'chat-bubble-ai text-white'
              }`}
              data-testid={`message-${message.id}`}
            >
              <p className="text-sm">{message.content}</p>
              {message.metadata?.products && (
                <div className="mt-2 p-2 bg-white/20 rounded border">
                  {message.metadata.products.map((product: any, index: number) => (
                    <div key={index}>
                      <p className="text-xs font-medium">📱 {product.title} - {product.price}</p>
                      <p className="text-xs opacity-90">{product.description}</p>
                    </div>
                  ))}
                </div>
              )}
              <span className="text-xs opacity-75 block mt-1">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted p-3 rounded-lg max-w-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                <span className="text-xs text-muted-foreground ml-2">AI is typing...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
