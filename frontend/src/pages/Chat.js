import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import NewChatModal from '../components/chat/NewChatModal';
import { io } from 'socket.io-client';
import { chatAPI } from '../services/api';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket;

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [deliveryStatus, setDeliveryStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const currentUserId = user?._id;
  const socketRef = useRef(null);

  // Fetch conversations on mount
  useEffect(() => {
    if (!currentUserId) return;
    
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const res = await chatAPI.getConversations(currentUserId);
        // Add currentUserId to each conversation for ChatSidebar
        setConversations(res.data.map(c => ({ ...c, currentUserId })));
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
    if (!selectedConversation) {
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
  }, [selectedConversation]);

  // Setup Socket.IO
  useEffect(() => {
    if (!currentUserId) return;
    
    console.log('🔍 Setting up Socket.IO connection to:', SOCKET_URL);
    socket = io(SOCKET_URL);
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected with ID:', socket.id);
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ Socket.IO connection error:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
    });
    
    socket.emit('join', currentUserId);
    console.log('🔍 Emitted join event for user:', currentUserId);
    
    socket.on('receive_message', (msg) => {
      console.log('🔍 Received message:', msg);
      setMessages((prev) => [...prev, msg]);
      
      // Update conversation list with new message
      setConversations(prev => 
        prev.map(conv => 
          conv._id === msg.conversationId 
            ? { ...conv, lastMessage: msg.content, updatedAt: msg.timestamp }
            : conv
        )
      );
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

    return () => {
      console.log('🔍 Cleaning up Socket.IO connection');
      socket.disconnect();
    };
  }, [currentUserId]);

  // Send message
  const handleSendMessage = (content) => {
    console.log('🔍 handleSendMessage called with:', content);
    console.log('🔍 selectedConversation:', selectedConversation);
    
    if (!selectedConversation) {
      console.log('❌ No conversation selected');
      return;
    }
    
    // Find the other participant (not the current user)
    const otherParticipant = selectedConversation.participants.find(
      participant => participant._id !== currentUserId
    );
    
    console.log('🔍 otherParticipant:', otherParticipant);
    console.log('🔍 currentUserId:', currentUserId);
    console.log('🔍 all participants:', selectedConversation.participants);
    
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
    
    console.log('🔍 Sending message data:', messageData);
    console.log('🔍 Socket ref:', socketRef.current);
    
    if (socketRef.current) {
      socketRef.current.emit('send_message', messageData);
      console.log('🔍 Message emitted to socket');
    } else {
      console.log('❌ Socket not connected');
    }
  };

  // View message
  const handleViewMessage = (messageId) => {
    socketRef.current.emit('view_message', { messageId });
  };

  // Start new chat
  const handleStartNewChat = (conversation) => {
    // Add to conversations list if not already there
    const exists = conversations.find(c => c._id === conversation._id);
    if (!exists) {
      setConversations(prev => [...prev, { ...conversation, currentUserId }]);
    }
    
    // Select the new conversation
    setSelectedConversation({ ...conversation, currentUserId });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-gray-900">
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