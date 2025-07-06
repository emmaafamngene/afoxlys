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
    }
    
    console.log('🔍 Setting up Socket.IO connection to:', SOCKET_URL);
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected with ID:', socket.id);
      console.log('🔍 Current user ID:', currentUserId);
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

    return () => {
      console.log('🔍 Cleaning up Socket.IO connection');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUserId, selectedConversation?._id]);

  // Send message - Fixed with better error handling and temp message logic
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || !selectedConversation || !socketRef.current) return;

    const tempMessage = {
      _id: `temp_${Date.now()}`,
      content: content.trim(),
      sender: currentUserId,
      conversationId: selectedConversation._id,
      timestamp: new Date().toISOString(),
      isTemp: true
    };

    // Add temp message immediately
    setMessages(prev => [...prev, tempMessage]);

    try {
      // Find the recipient (other participant in the conversation)
      const recipient = selectedConversation.participants.find(p => p._id !== currentUserId);
      
      if (!recipient) {
        console.error('❌ No recipient found in conversation:', selectedConversation);
        throw new Error('No recipient found');
      }
      
      console.log('📨 Sending message to:', recipient._id);
      
      const response = await chatAPI.sendMessage({
        conversationId: selectedConversation._id,
        sender: currentUserId,
        recipient: recipient._id,
        content: content.trim()
      });
      console.log('✅ Message sent successfully:', response.data);

      // Emit socket event
      socketRef.current.emit('send_message', {
        conversationId: selectedConversation._id,
        content: content.trim(),
        sender: currentUserId,
        timestamp: new Date().toISOString()
      });

      // Update conversation list
      setConversations(prev => 
        prev.map(conv => 
          conv._id === selectedConversation._id 
            ? { ...conv, lastMessage: content.trim(), updatedAt: Date.now() }
            : conv
        )
      );

    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
    }
  }, [selectedConversation, currentUserId]);

  // Handle conversation selection
  const handleConversationSelect = useCallback((conversation) => {
    setSelectedConversation(conversation);
    // Close sidebar on mobile when conversation is selected
    setShowSidebar(false);
  }, []);

  // Handle message viewing (for Snapchat-style functionality)
  const handleViewMessage = useCallback(async (messageId) => {
    try {
      await chatAPI.viewMessage(messageId);
      // Update message as viewed locally
      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, viewed: true }
            : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as viewed:', error);
    }
  }, []);

  // Handle new conversation creation
  const handleNewConversation = useCallback((conversation) => {
    const conversationWithUserId = { ...conversation, currentUserId };
    setConversations(prev => [conversationWithUserId, ...prev]);
    setSelectedConversation(conversationWithUserId);
    setShowNewChatModal(false);
    // Close sidebar on mobile
    setShowSidebar(false);
  }, [currentUserId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  }, [messages]);

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSidebar]);

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      {/* Mobile Sidebar Toggle */}
      <button
        id="sidebar-toggle"
        onClick={() => setShowSidebar(!showSidebar)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        id="chat-sidebar"
        className={`fixed lg:relative inset-y-0 left-0 z-40 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${
          showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <ChatSidebar
          conversations={conversations}
          selectedConversationId={selectedConversation?._id}
          onSelectConversation={handleConversationSelect}
          onNewChat={() => setShowNewChatModal(true)}
        />
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatWindow
            selectedConversation={selectedConversation}
            messages={messages}
            currentUserId={currentUserId}
            onSendMessage={sendMessage}
            onViewMessage={handleViewMessage}
            deliveryStatus={deliveryStatus}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Select a conversation</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                Choose a conversation from the sidebar or start a new one
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="btn btn-primary text-sm sm:text-base px-6 py-3"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
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
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
} 