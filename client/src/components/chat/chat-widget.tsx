import { useState, useEffect, useRef } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { Message } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";

interface ChatWidgetProps {
  storeId: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
}

export default function ChatWidget({ 
  storeId, 
  position = 'bottom-right',
  primaryColor = '#22c55e'
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState({ name: "", email: "" });
  const [showWelcome, setShowWelcome] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isConnected, lastMessage, sendMessage } = useWebSocket('/ws');

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'new_message':
          if (lastMessage.message && lastMessage.conversationId === conversationId) {
            setMessages(prev => [...prev, lastMessage.message!]);
            setIsTyping(false);
          }
          break;
        case 'typing_start':
          setIsTyping(true);
          break;
        case 'typing_stop':
          setIsTyping(false);
          break;
      }
    }
  }, [lastMessage, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const startConversation = async () => {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeId,
          sessionId,
          customerName: customerInfo.name || undefined,
          customerEmail: customerInfo.email || undefined,
          status: 'active',
          metadata: {}
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const conversation = await response.json();
      setConversationId(conversation.id);
      
      // Join the conversation via WebSocket
      sendMessage({
        type: 'join_conversation',
        conversationId: conversation.id,
        storeId
      });

      setShowWelcome(false);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const sendChatMessage = async () => {
    if (!inputValue.trim() || !conversationId) return;

    const userMessage: Message = {
      id: `temp_${Date.now()}`,
      conversationId,
      role: 'user',
      content: inputValue,
      metadata: {},
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'user',
          content: inputValue,
          metadata: {}
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // WebSocket will handle the AI response
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) {
    return (
      <div 
        className={`fixed ${positionClasses[position]} z-50`}
        data-testid="chat-widget-trigger"
      >
        <Button
          className="w-16 h-16 rounded-full shadow-lg hover:scale-110 transition-transform"
          style={{ backgroundColor: primaryColor }}
          onClick={() => setIsOpen(true)}
          data-testid="button-open-chat"
        >
          <MessageCircle className="w-8 h-8 text-white" />
        </Button>
        {/* Notification badge */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
          1
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 w-96 h-[600px]`}
      data-testid="chat-widget"
    >
      <Card className="h-full flex flex-col shadow-2xl">
        <CardHeader className="pb-3" style={{ backgroundColor: primaryColor }}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">Chat Support</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-white/90">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setIsMinimized(!isMinimized)}
                data-testid="button-minimize-chat"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="flex-1 flex flex-col p-0">
            {showWelcome ? (
              /* Welcome Form */
              <div className="flex-1 p-4 flex flex-col justify-center">
                <div className="text-center mb-6">
                  <h3 className="font-semibold mb-2">Welcome! How can we help?</h3>
                  <p className="text-sm text-muted-foreground">
                    Start a conversation with our AI assistant to get instant help.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name (Optional)</label>
                    <Input
                      placeholder="Your name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      data-testid="input-customer-name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Email (Optional)</label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      data-testid="input-customer-email"
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    style={{ backgroundColor: primaryColor }}
                    onClick={startConversation}
                    data-testid="button-start-chat"
                  >
                    Start Chatting
                  </Button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    Powered by AI • Instant responses
                  </p>
                </div>
              </div>
            ) : (
              /* Chat Interface */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                        <MessageCircle className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ask me anything about our products!
                      </p>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-xs p-3 rounded-lg ${
                          message.role === 'user' 
                            ? 'text-white' 
                            : 'bg-muted text-foreground'
                        }`}
                        style={message.role === 'user' ? { backgroundColor: primaryColor } : {}}
                        data-testid={`message-${message.id}`}
                      >
                        <p className="text-sm">{message.content}</p>
                        
                        {message.metadata?.products && (
                          <div className="mt-2 p-2 bg-white/20 rounded border">
                            {message.metadata.products.map((product: any, index: number) => (
                              <div key={index} className="text-xs">
                                <p className="font-medium">📱 {product.title} - {product.price}</p>
                                <p className="opacity-90">{product.description}</p>
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
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                          <span className="text-xs text-muted-foreground ml-2">AI is typing...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-border p-4">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={!conversationId || !isConnected}
                      data-testid="input-chat-message"
                    />
                    <Button
                      size="sm"
                      onClick={sendChatMessage}
                      disabled={!inputValue.trim() || !conversationId || !isConnected}
                      style={{ backgroundColor: primaryColor }}
                      data-testid="button-send-message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-xs text-muted-foreground">
                        {isConnected ? 'Connected' : 'Connecting...'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Powered by AI
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
