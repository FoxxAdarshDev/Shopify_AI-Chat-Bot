// AI Chat Widget for Shopify Stores
// This script creates and manages the chat widget on the storefront

(function() {
  'use strict';
  
  // Widget configuration (will be dynamically replaced)
  const WIDGET_CONFIG = {
    storeId: '__STORE_ID__',
    color: '__COLOR__',
    position: '__POSITION__',
    enabledPages: '__ENABLED_PAGES__',
    apiUrl: '__API_URL__'
  };

  // Check if widget should be shown on current page
  function shouldShowWidget() {
    const enabledPages = WIDGET_CONFIG.enabledPages;
    const currentPath = window.location.pathname;
    
    // Home page
    if (enabledPages.includes('home') && (currentPath === '/' || currentPath === '')) {
      return true;
    }
    
    // Product pages
    if (enabledPages.includes('product') && currentPath.includes('/products/')) {
      return true;
    }
    
    // Collection pages
    if (enabledPages.includes('collection') && currentPath.includes('/collections/')) {
      return true;
    }
    
    // Content pages
    if (enabledPages.includes('page') && currentPath.includes('/pages/')) {
      return true;
    }
    
    // Blog pages
    if (enabledPages.includes('blog') && (currentPath.includes('/blogs/') || currentPath.includes('/articles/'))) {
      return true;
    }
    
    return false;
  }

  // Create widget HTML structure
  function createWidget() {
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'ai-chat-widget';
    widgetContainer.innerHTML = `
      <div id="chat-widget-root" style="
        position: fixed;
        ${WIDGET_CONFIG.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        ${WIDGET_CONFIG.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <!-- Chat button -->
        <button id="chat-toggle-btn" style="
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          background-color: ${WIDGET_CONFIG.color};
          color: white;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
          </svg>
        </button>
        
        <!-- Chat window -->
        <div id="chat-window" style="
          display: none;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          border: 1px solid #e5e7eb;
          position: absolute;
          bottom: 70px;
          right: 0;
          flex-direction: column;
        ">
          <!-- Header -->
          <div id="chat-header" style="
            background-color: ${WIDGET_CONFIG.color};
            color: white;
            padding: 16px;
            border-radius: 12px 12px 0 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
          ">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
              </svg>
              <span style="font-weight: 600; font-size: 14px;">AI Chat Support</span>
            </div>
            <button id="chat-close-btn" style="
              background: none;
              border: none;
              color: white;
              cursor: pointer;
              padding: 4px;
              border-radius: 4px;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <!-- User form -->
          <div id="user-form" style="
            padding: 20px;
            display: block;
          ">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1f2937;">Welcome! Let's get started</h3>
            <form id="user-data-form">
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px;">Your Name</label>
                <input type="text" id="user-name" required style="
                  width: 100%;
                  padding: 8px 12px;
                  border: 1px solid #d1d5db;
                  border-radius: 6px;
                  font-size: 14px;
                  box-sizing: border-box;
                " placeholder="Enter your name">
              </div>
              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px;">Email Address</label>
                <input type="email" id="user-email" required style="
                  width: 100%;
                  padding: 8px 12px;
                  border: 1px solid #d1d5db;
                  border-radius: 6px;
                  font-size: 14px;
                  box-sizing: border-box;
                " placeholder="Enter your email">
              </div>
              <button type="submit" style="
                width: 100%;
                background-color: ${WIDGET_CONFIG.color};
                color: white;
                border: none;
                padding: 10px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
              ">Start Chat</button>
            </form>
          </div>
          
          <!-- Chat interface -->
          <div id="chat-interface" style="
            display: none;
            flex-direction: column;
            height: 100%;
          ">
            <!-- Messages container -->
            <div id="messages-container" style="
              flex: 1;
              padding: 16px;
              overflow-y: auto;
              max-height: 300px;
            ">
              <!-- Messages will be added here -->
            </div>
            
            <!-- Input area -->
            <div style="
              padding: 16px;
              border-top: 1px solid #e5e7eb;
              display: flex;
              gap: 8px;
            ">
              <input type="text" id="message-input" placeholder="Type your message..." style="
                flex: 1;
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
              ">
              <button id="send-btn" style="
                background-color: ${WIDGET_CONFIG.color};
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22,2 15,22 11,13 2,9"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    return widgetContainer;
  }

  // Initialize widget functionality
  function initializeWidget() {
    const toggleBtn = document.getElementById('chat-toggle-btn');
    const chatWindow = document.getElementById('chat-window');
    const closeBtn = document.getElementById('chat-close-btn');
    const userForm = document.getElementById('user-form');
    const chatInterface = document.getElementById('chat-interface');
    const userDataForm = document.getElementById('user-data-form');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const messagesContainer = document.getElementById('messages-container');
    
    let isOpen = false;
    let userData = null;
    let ws = null;
    let conversationId = null;
    
    // Check for stored user data
    const storedUserData = localStorage.getItem(`chat_user_${WIDGET_CONFIG.storeId}`);
    if (storedUserData) {
      userData = JSON.parse(storedUserData);
    }
    
    // Toggle chat window
    function toggleChat() {
      isOpen = !isOpen;
      chatWindow.style.display = isOpen ? 'flex' : 'none';
      
      if (isOpen && !ws) {
        connectWebSocket();
      }
      
      if (isOpen && userData && !conversationId) {
        showChatInterface();
        sendWelcomeMessage();
      }
    }
    
    // Connect to WebSocket
    function connectWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws = new WebSocket(wsUrl);
      
      ws.onopen = function() {
        console.log('Chat widget connected');
      };
      
      ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        
        if (data.type === 'ai_response') {
          addMessage(data.message, 'bot');
        }
        
        if (data.type === 'conversation_started') {
          conversationId = data.conversationId;
        }
      };
      
      ws.onclose = function() {
        console.log('Chat widget disconnected');
        ws = null;
      };
    }
    
    // Show chat interface
    function showChatInterface() {
      userForm.style.display = 'none';
      chatInterface.style.display = 'flex';
    }
    
    // Send welcome message
    function sendWelcomeMessage() {
      addMessage(`Hi ${userData.name}! I'm your AI shopping assistant. How can I help you today?`, 'bot');
    }
    
    // Add message to chat
    function addMessage(text, sender) {
      const messageDiv = document.createElement('div');
      messageDiv.style.cssText = `
        display: flex;
        justify-content: ${sender === 'user' ? 'flex-end' : 'flex-start'};
        margin-bottom: 12px;
      `;
      
      const messageBubble = document.createElement('div');
      messageBubble.style.cssText = `
        max-width: 70%;
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 14px;
        ${sender === 'user' 
          ? `background-color: ${WIDGET_CONFIG.color}; color: white;` 
          : 'background-color: #f3f4f6; color: #1f2937;'
        }
      `;
      messageBubble.textContent = text;
      
      messageDiv.appendChild(messageBubble);
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Send message
    function sendMessage() {
      const message = messageInput.value.trim();
      if (!message || !userData) return;
      
      addMessage(message, 'user');
      messageInput.value = '';
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'customer_message',
          conversationId,
          storeId: WIDGET_CONFIG.storeId,
          message: message,
          customerData: userData
        }));
      }
    }
    
    // Event listeners
    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);
    
    userDataForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('user-name').value;
      const email = document.getElementById('user-email').value;
      
      userData = { name, email };
      localStorage.setItem(`chat_user_${WIDGET_CONFIG.storeId}`, JSON.stringify(userData));
      
      showChatInterface();
      sendWelcomeMessage();
    });
    
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
    
    // Auto-open for returning users
    if (userData) {
      showChatInterface();
    }
  }

  // Initialize widget when DOM is ready
  function init() {
    if (!shouldShowWidget()) {
      return;
    }
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        const widget = createWidget();
        document.body.appendChild(widget);
        initializeWidget();
      });
    } else {
      const widget = createWidget();
      document.body.appendChild(widget);
      initializeWidget();
    }
  }
  
  // Start initialization
  init();
})();