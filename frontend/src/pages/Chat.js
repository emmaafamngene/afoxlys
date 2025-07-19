import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import NewChatModal from '../components/chat/NewChatModal';
import { io } from 'socket.io-client';
import { chatAPI } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';


const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://afoxlys.onrender.com';

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [deliveryStatus, setDeliveryStatus] = useState({});
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const currentUserId = user?._id;
  const socketRef = useRef(null);
  
  usePageTitle('Messages');

  // Fetch conversations on mount
  useEffect(() => {
    if (!currentUserId) return;
    
    const fetchConversations = async () => {
      try {
        const res = await chatAPI.getConversations(currentUserId);
        // Add currentUserId to each conversation for ChatSidebar
        const conversationsWithUserId = res.data.map(c => ({ ...c, currentUserId }));
        setConversations(conversationsWithUserId);
      } catch (err) {
        console.error('Error fetching conversations:', err);
      }
    };

    fetchConversations();
  }, [currentUserId]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!selectedConversation?._id) {
      setMessages([]);
      return;
    }
    
    const fetchMessages = async () => {
      try {
        const res = await chatAPI.getMessages(selectedConversation._id);
        setMessages(res.data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();
  }, [selectedConversation?._id]);

  // Setup Socket.IO - Fixed to prevent multiple connections
  useEffect(() => {
    if (!currentUserId) return;
    
    // Clean up existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    console.log('🔍 Setting up Socket.IO connection to:', SOCKET_URL);
    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected with ID:', socket.id);
      console.log('🔍 Current user ID:', currentUserId);
      // Register userId for WebRTC signaling
      socket.emit('register', currentUserId);
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ Socket.IO connection error:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
    });
    
    socket.on('error', (error) => {
      console.log('❌ Socket.IO error:', error);
    });
    
    socket.emit('join', currentUserId);
    console.log('🔍 Emitted join event for user:', currentUserId);
    

    
    // Handle incoming messages
    socket.on('receive_message', (msg) => {
      console.log('🔍 Received message:', msg);
      
      const messageConversationId = msg.conversation || msg.conversationId;
      const isOwnMessage = msg.sender === currentUserId;
      
      setMessages((prev) => {
        // If it's our own message, replace the temp message
        if (isOwnMessage) {
          return prev.map(existingMsg => 
            existingMsg.isTemp && existingMsg.content === msg.content
              ? { ...msg, conversationId: messageConversationId }
              : existingMsg
          );
        } else {
          // If it's someone else's message, add it if it's for current conversation
          if (selectedConversation && messageConversationId === selectedConversation._id) {
            return [...prev, { ...msg, conversationId: messageConversationId }];
          }
          return prev;
        }
      });
      
      // Update conversation list with new message
      setConversations(prev => {
        const existingConv = prev.find(conv => conv._id === messageConversationId);
        
        if (existingConv) {
          // Update existing conversation
          return prev.map(conv => 
            conv._id === messageConversationId 
              ? { ...conv, lastMessage: msg.content, updatedAt: msg.timestamp || Date.now() }
              : conv
          );
        } else {
          // This might be a new conversation, try to fetch it
          console.log('🔍 New conversation detected, fetching conversation details...');
          const fetchNewConversation = async () => {
            try {
              const res = await chatAPI.getConversations(currentUserId);
              const conversationsWithUserId = res.data.map(c => ({ ...c, currentUserId }));
              setConversations(conversationsWithUserId);
            } catch (err) {
              console.error('Error fetching updated conversations:', err);
            }
          };
          fetchNewConversation();
          return prev;
        }
      });
    });
    
    socket.on('delivered', ({ messageId }) => {
      console.log('🔍 Message delivered:', messageId);
      setDeliveryStatus((prev) => ({ ...prev, [messageId]: 'delivered' }));
    });
    
    socket.on('seen', ({ messageId }) => {
      console.log('🔍 Message seen:', messageId);
      setDeliveryStatus((prev) => ({ ...prev, [messageId]: 'seen' }));
    });
    
    socket.on('message_deleted', ({ messageId }) => {
      console.log('🔍 Message deleted:', messageId);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    });

    // Listen for newConversation event (real-time new chat)
    socket.on('newConversation', (conversation) => {
      console.log('🔔 Received newConversation event:', conversation);
      // Add currentUserId to the conversation for sidebar
      const conversationWithUserId = { ...conversation, currentUserId };
      setConversations(prev => {
        const exists = prev.find(c => c._id === conversation._id);
        if (!exists) {
          return [...prev, conversationWithUserId];
        }
        return prev;
      });
    });

    // Listen for friend request events
    socket.on('friend_request_received', (data) => {
      console.log('🔔 Received friend request:', data);
      // Refresh conversations to show new potential chat
      const refreshConversations = async () => {
        try {
          const res = await chatAPI.getConversations(currentUserId);
          const conversationsWithUserId = res.data.map(c => ({ ...c, currentUserId }));
          setConversations(conversationsWithUserId);
        } catch (err) {
          console.error('Error refreshing conversations after friend request:', err);
        }
      };
      refreshConversations();
    });

    socket.on('friend_request_accepted', (data) => {
      console.log('🔔 Friend request accepted:', data);
      // Refresh conversations to show new chat
      const refreshConversations = async () => {
        try {
          const res = await chatAPI.getConversations(currentUserId);
          const conversationsWithUserId = res.data.map(c => ({ ...c, currentUserId }));
          setConversations(conversationsWithUserId);
        } catch (err) {
          console.error('Error refreshing conversations after friend request accepted:', err);
        }
      };
      refreshConversations();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUserId, selectedConversation]);

  const handleSendMessage = useCallback(async (content, conversationId) => {
    if (!content.trim() || !conversationId) return;

    const tempMessage = {
      _id: `temp-${Date.now()}`,
      content: content.trim(),
      sender: currentUserId,
      conversationId,
      timestamp: new Date().toISOString(),
      isTemp: true
    };

    // Add temp message immediately
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await chatAPI.sendMessage({
        content: content.trim(),
        recipient: selectedConversation.participants.find(p => p._id !== currentUserId)?._id,
        conversationId
      });

      console.log('🔍 Message sent successfully:', response.data);
      
      // Update delivery status
      setDeliveryStatus(prev => ({ ...prev, [response.data._id]: 'sent' }));
      
    } catch (error) {
      console.error('🔍 Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
    }
  }, [currentUserId, selectedConversation]);

  const handleViewMessage = useCallback(async (messageId) => {
    try {
      await chatAPI.viewMessage(messageId);
      console.log('🔍 Message viewed:', messageId);
    } catch (error) {
      console.error('🔍 Error viewing message:', error);
    }
  }, []);

  const handleNewConversation = useCallback((conversation) => {
    setConversations(prev => {
      const exists = prev.find(c => c._id === conversation._id);
      if (!exists) {
        return [...prev, { ...conversation, currentUserId }];
      }
      return prev;
    });
    setSelectedConversation({ ...conversation, currentUserId });
    setShowNewChatModal(false);
  }, []);

  const handleConversationSelect = useCallback((conversation) => {
    console.log('🔍 handleConversationSelect called with:', conversation);
    setSelectedConversation(conversation);
    // On mobile, hide sidebar when conversation is selected
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setShowSidebar(prev => !prev);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth < 768 && showSidebar) {
        const sidebar = document.getElementById('chat-sidebar');
        const toggleButton = document.getElementById('sidebar-toggle');
        
        if (sidebar && !sidebar.contains(event.target) && 
            toggleButton && !toggleButton.contains(event.target)) {
          setShowSidebar(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSidebar]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Authentication Required</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Please log in to access messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Mobile Sidebar Toggle */}
      <button
        id="sidebar-toggle"
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        id="chat-sidebar"
        className={`fixed md:relative inset-y-0 left-0 z-40 w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out ${
          showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <ChatSidebar
          conversations={conversations}
          selectedConversationId={selectedConversation?._id}
          onSelectConversation={handleConversationSelect}
          onNewChat={() => setShowNewChatModal(true)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatWindow
          messages={messages}
          currentUserId={currentUserId}
          onSendMessage={handleSendMessage}
          onViewMessage={handleViewMessage}
          deliveryStatus={deliveryStatus}
          selectedConversation={selectedConversation}
          socket={socketRef.current}
        />
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onNewConversation={handleNewConversation}
        currentUserId={currentUserId}
      />

      {/* Mobile Overlay */}
      {showSidebar && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
} 