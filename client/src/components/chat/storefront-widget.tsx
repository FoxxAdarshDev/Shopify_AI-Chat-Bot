import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X, User, Mail, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface UserData {
  name: string;
  email: string;
}

interface WidgetConfig {
  storeId: string;
  color: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  enabledPages: string[];
}

interface StorefrontWidgetProps {
  config: WidgetConfig;
}

export default function StorefrontWidget({ config }: StorefrontWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load user data from localStorage
  useEffect(() => {
    const storedUserData = localStorage.getItem(`chat_user_${config.storeId}`);
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, [config.storeId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (isOpen && !wsRef.current) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('Chat widget connected');
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'ai_response') {
          setIsTyping(false);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: data.message,
            sender: 'bot',
            timestamp: new Date()
          }]);
        }
        
        if (data.type === 'typing') {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('Chat widget disconnected');
        wsRef.current = null;
      };
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isOpen]);

  const handleUserDataSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newUserData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string
    };
    
    setUserData(newUserData);
    localStorage.setItem(`chat_user_${config.storeId}`, JSON.stringify(newUserData));
    setShowUserForm(false);
    
    // Send welcome message
    setMessages([{
      id: '1',
      text: `Hi ${newUserData.name}! I'm your AI shopping assistant. How can I help you today?`,
      sender: 'bot',
      timestamp: new Date()
    }]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !userData) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Send message via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'customer_message',
        conversationId,
        storeId: config.storeId,
        message: inputValue,
        customerData: userData
      }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const openChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
    
    if (!userData) {
      setShowUserForm(true);
    }
  };

  const getPositionClasses = () => {
    switch (config.position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-[9999] font-sans`}>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={openChat}
          className="flex items-center justify-center w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-white"
          style={{ backgroundColor: config.color }}
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 ${isMinimized ? 'h-14' : 'h-96 w-80'} transition-all duration-300`}>
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 rounded-t-lg text-white"
            style={{ backgroundColor: config.color }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <span className="font-semibold">Chat Support</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-white/20 p-1 rounded"
                aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1 rounded"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <>
              {/* User Form */}
              {showUserForm && (
                <div className="p-4">
                  <form onSubmit={handleUserDataSubmit} className="space-y-3">
                    <h3 className="font-semibold text-gray-800">Welcome! Let's get started</h3>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Your Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your email"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full text-white py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: config.color }}
                    >
                      Start Chat
                    </button>
                  </form>
                </div>
              )}

              {/* Messages */}
              {!showUserForm && (
                <>
                  <div className="h-64 overflow-y-auto p-4 space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            message.sender === 'user'
                              ? 'text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                          style={message.sender === 'user' ? { backgroundColor: config.color } : {}}
                        >
                          {message.text}
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-600">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim()}
                        className="text-white p-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: config.color }}
                        aria-label="Send message"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}