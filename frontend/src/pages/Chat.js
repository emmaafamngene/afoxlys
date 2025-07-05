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
  const [loading, setLoading] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const currentUserId = user?._id;
  const socketRef = useRef(null);
  
  usePageTitle('Messages');

  // Fetch conversations on mount
  useEffect(() => {
    if (!currentUserId) return;
    
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const res = await chatAPI.getConversations(currentUserId);
        // Add currentUserId to each conversation for ChatSidebar
        const conversationsWithUserId = res.data.map(c => ({ ...c, currentUserId }));
        setConversations(conversationsWithUserId);
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
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
        setLoading(true);
        const res = await chatAPI.getMessages(selectedConversation._id);
        setMessages(res.data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
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
      setSocketConnected(true);
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ Socket.IO connection error:', error);
      setSocketConnected(false);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      setSocketConnected(false);
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
  const handleSendMessage = useCallback(async (content) => {
    console.log('🔍 handleSendMessage called with:', content);
    
    if (!selectedConversation?._id) {
      console.log('❌ No conversation selected');
      return;
    }
    
    // Find the other participant (not the current user)
    const otherParticipant = selectedConversation.participants?.find(
      participant => participant._id !== currentUserId
    );
    
    if (!otherParticipant) {
      console.log('❌ Could not find other participant');
      return;
    }
    
    const messageData = {
      conversationId: selectedConversation._id,
      sender: currentUserId,
      recipient: otherParticipant._id,
      content,
    };
    
    // Create a temporary message for immediate display
    const tempMessage = {
      _id: `temp-${Date.now()}-${Math.random()}`,
      conversation: selectedConversation._id,
      conversationId: selectedConversation._id,
      sender: currentUserId,
      recipient: otherParticipant._id,
      content,
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
      delivered: false,
      viewed: false,
      isTemp: true
    };
    
    // Add message to local state immediately
    setMessages(prev => [...prev, tempMessage]);
    
    // Update conversation list immediately
    setConversations(prev => 
      prev.map(conv => 
        conv._id === selectedConversation._id 
          ? { ...conv, lastMessage: content, updatedAt: Date.now() }
          : conv
      )
    );
    
    // Try socket first, fallback to API
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', messageData);
      console.log('🔍 Message emitted to socket');
    } else {
      console.log('❌ Socket not connected, trying API fallback');
      try {
        const response = await chatAPI.sendMessage(messageData);
        console.log('✅ Message sent via API:', response.data);
        
        // Replace temp message with real message
        setMessages(prev => 
          prev.map(msg => 
            msg.isTemp && msg._id === tempMessage._id 
              ? { ...response.data, conversationId: response.data.conversation }
              : msg
          )
        );
      } catch (error) {
        console.error('❌ Failed to send message via API:', error);
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      }
    }
  }, [selectedConversation, currentUserId]);

  // View message - Fixed to handle message viewing properly
  const handleViewMessage = useCallback((messageId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('view_message', { messageId });
    }
  }, []);

  // Start new chat - Fixed to properly handle new conversations
  const handleStartNewChat = useCallback((conversation) => {
    console.log('🔍 Starting new chat with conversation:', conversation);
    
    // Add currentUserId to the conversation
    const conversationWithUserId = { ...conversation, currentUserId };
    
    // Add to conversations list if not already there
    const exists = conversations.find(c => c._id === conversation._id);
    if (!exists) {
      console.log('🔍 Adding new conversation to list');
      setConversations(prev => [...prev, conversationWithUserId]);
    } else {
      console.log('🔍 Conversation already exists in list');
    }
    
    // Select the new conversation
    setSelectedConversation(conversationWithUserId);
    
    // Clear messages for the new conversation
    setMessages([]);
    
    // Fetch messages for the new conversation
    if (conversation._id) {
      const fetchMessagesForConversation = async () => {
        try {
          const res = await chatAPI.getMessages(conversation._id);
          setMessages(res.data);
        } catch (err) {
          console.error('Error fetching messages for new conversation:', err);
        }
      };
      fetchMessagesForConversation();
    }
  }, [conversations, currentUserId]);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-gray-900">
      {/* Connection Status Indicator */}
      {!socketConnected && (
        <div className="fixed top-20 right-4 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Connecting...</span>
          </div>
        </div>
      )}
      
      <ChatSidebar
        conversations={conversations}
        selectedConversationId={selectedConversation?._id}
        onSelectConversation={setSelectedConversation}
        onNewChat={() => setShowNewChatModal(true)}
      />
      
      <div className="flex-1 h-full">
        {selectedConversation ? (
          <ChatWindow
            messages={messages}
            currentUserId={currentUserId}
            onSendMessage={handleSendMessage}
            onViewMessage={handleViewMessage}
            deliveryStatus={deliveryStatus}
            selectedConversation={selectedConversation}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-900">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your Messages</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Select a conversation or start a new one</p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              Start New Chat
            </button>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onStartChat={handleStartNewChat}
      />
    </div>
  );
} 