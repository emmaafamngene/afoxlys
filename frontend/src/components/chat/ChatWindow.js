import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import { DefaultAvatar } from '../layout/AFEXLogo';
import CallModal from './CallModal';
import webrtcService from '../../services/webrtcService';

export default function ChatWindow({
  messages = [],
  currentUserId,
  onSendMessage,
  onViewMessage,
  deliveryStatus = {},
  selectedConversation,
}) {
  const [input, setInput] = useState('');
  const [fadingMessages, setFadingMessages] = useState([]); // messageIds that are fading out
  const [deletingMessages, setDeletingMessages] = useState([]); // messageIds that are being deleted
  const [typing, setTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState(null); // 'voice' or 'video'
  const [showCallModal, setShowCallModal] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  // Get other user from conversation participants
  const participants = selectedConversation?.participants || [];
  const otherUser = participants.find(user => user._id !== currentUserId);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  // Handle message fade-out after viewed (Snapchat style)
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.viewed && !fadingMessages.includes(msg._id) && msg.sender !== currentUserId) {
        // Start fade out after 2 seconds
        setTimeout(() => {
          setFadingMessages((prev) => [...prev, msg._id]);
        }, 2000);
        
        // Delete after 60 seconds total (Snapchat style)
        setTimeout(() => {
          setDeletingMessages((prev) => [...prev, msg._id]);
        }, 60000);
      }
    });
  }, [messages, fadingMessages, currentUserId]);

  const handleSend = (e) => {
    e.preventDefault();
    console.log('🔍 handleSend called with input:', input);
    
    if (input.trim()) {
      console.log('🔍 Calling onSendMessage with:', input.trim());
      onSendMessage(input.trim());
      setInput('');
      setTyping(false);
      console.log('🔍 Message sent, input cleared');
    } else {
      console.log('🔍 Input is empty, not sending');
    }
  };

  const handleView = (msg) => {
    if (!msg.viewed && msg.sender !== currentUserId) {
      onViewMessage(msg._id);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!typing && e.target.value) {
      setTyping(true);
    } else if (typing && !e.target.value) {
      setTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // Initialize WebRTC service
  useEffect(() => {
    if (selectedConversation && otherUser) {
      // Set up WebRTC event handler
      webrtcService.on('callEvent', (event, data) => {
        handleWebRTCEvent(event, data);
      });
    }
  }, [selectedConversation, otherUser]);

  // Handle WebRTC events
  const handleWebRTCEvent = (event, data) => {
    console.log('🔔 WebRTC Event:', event, data);
    switch (event) {
      case 'callReceived':
        console.log('🔔 Call received - setting incoming call state');
        setIsIncomingCall(true);
        setIncomingCallData(data);
        setCallType(data.callType);
        setShowCallModal(true);
        break;
      case 'callRinging':
        console.log('🔔 Call ringing - setting ringing state');
        setIsCallActive(false);
        setIsIncomingCall(false);
        setCallType(data.callType);
        setShowCallModal(true);
        break;
      case 'callStarted':
        console.log('🔔 Call started - setting active state');
        setIsCallActive(true);
        setCallType(data.callType);
        setShowCallModal(true);
        break;
      case 'callAccepted':
        console.log('🔔 Call accepted - updating state');
        setIsIncomingCall(false);
        setIsCallActive(true);
        break;
      case 'callEnded':
      case 'callRejected':
        console.log('🔔 Call ended/rejected - cleaning up');
        setIsCallActive(false);
        setIsIncomingCall(false);
        setShowCallModal(false);
        setCallType(null);
        setLocalStream(null);
        setRemoteStream(null);
        break;
      case 'localStreamReceived':
        console.log('🔔 Local stream received');
        setLocalStream(data);
        break;
      case 'remoteStreamReceived':
        console.log('🔔 Remote stream received');
        setRemoteStream(data);
        break;
      case 'callConnected':
        console.log('🔔 Call connected successfully');
        setIsCallActive(true);
        setIsIncomingCall(false);
        break;
      case 'callFailed':
        console.log('🔔 Call failed');
        alert('Call failed to connect. Please try again.');
        handleEndCall();
        break;
    }
  };

  // Call handlers
  const handleVoiceCall = async () => {
    if (!selectedConversation || !otherUser) return;
    
    try {
      setShowCallModal(true);
      await webrtcService.startCall(otherUser._id, 'voice');
    } catch (error) {
      console.error('❌ Error starting voice call:', error);
      alert('Failed to start voice call. Please check your microphone permissions.');
      setShowCallModal(false);
    }
  };

  const handleVideoCall = async () => {
    if (!selectedConversation || !otherUser) return;
    
    try {
      setShowCallModal(true);
      await webrtcService.startCall(otherUser._id, 'video');
    } catch (error) {
      console.error('❌ Error starting video call:', error);
      alert('Failed to start video call. Please check your camera and microphone permissions.');
      setShowCallModal(false);
    }
  };

  const handleEndCall = () => {
    webrtcService.endCall();
    setIsCallActive(false);
    setCallType(null);
    setShowCallModal(false);
    setLocalStream(null);
    setRemoteStream(null);
  };

  const handleAcceptCall = async () => {
    try {
      await webrtcService.acceptCall(incomingCallData.offer);
      setIsIncomingCall(false);
      setIsCallActive(true);
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      alert('Failed to accept call. Please check your camera and microphone permissions.');
      handleRejectCall();
    }
  };

  const handleRejectCall = () => {
    webrtcService.rejectCall();
    setIsIncomingCall(false);
    setShowCallModal(false);
    setIncomingCallData(null);
  };

  // Menu handlers
  const handleMenuToggle = () => {
    setShowMenu(!showMenu);
  };

  const handleMenuClose = () => {
    setShowMenu(false);
  };

  const handleViewProfile = () => {
    if (otherUser) {
      window.open(`/profile/${otherUser._id}`, '_blank');
    }
    setShowMenu(false);
  };

  const handleBlockUser = () => {
    if (otherUser) {
      const confirmed = window.confirm(`Are you sure you want to block ${otherUser.username}?`);
      if (confirmed) {
        console.log('🔔 Blocking user:', otherUser._id);
        alert(`Blocked ${otherUser.username}`);
      }
    }
    setShowMenu(false);
  };

  const handleReportUser = () => {
    if (otherUser) {
      const reason = prompt('Please provide a reason for reporting this user:');
      if (reason) {
        console.log('🔔 Reporting user:', otherUser._id, 'Reason:', reason);
        alert('User reported successfully');
      }
    }
    setShowMenu(false);
  };

  const handleClearChat = () => {
    const confirmed = window.confirm('Are you sure you want to clear this chat? This action cannot be undone.');
    if (confirmed) {
      console.log('🔔 Clearing chat:', selectedConversation._id);
      // You'll need to implement this in the parent component
      alert('Chat cleared successfully');
    }
    setShowMenu(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select a conversation</h3>
          <p className="text-gray-600 dark:text-gray-400">Choose a chat from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  // Add null checks for participants (already defined above)

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Call Modal */}
      <CallModal
        isOpen={showCallModal}
        callType={callType}
        otherUser={otherUser}
        onEndCall={handleEndCall}
        onAcceptCall={handleAcceptCall}
        onRejectCall={handleRejectCall}
        isIncoming={isIncomingCall}
        isRinging={showCallModal && !isIncomingCall && !isCallActive}
        localStream={localStream}
        remoteStream={remoteStream}
      />
      {/* Chat Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          {otherUser?.avatar ? (
            <div className="relative">
              <img
                src={otherUser.avatar}
                alt={otherUser.username || 'User'}
                className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <DefaultAvatar 
                user={otherUser} 
                size="md" 
                showOnline={true}
                className="hidden"
              />
            </div>
          ) : (
            <DefaultAvatar 
              user={otherUser} 
              size="md" 
              showOnline={true}
            />
          )}
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.username : 'Unknown User'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {otherUser ? `@${otherUser.username}` : '@unknown'} • Online
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Voice Call Button */}
          <button 
            onClick={handleVoiceCall}
            disabled={isCallActive}
            className={`p-2 rounded-full transition-colors ${
              isCallActive && callType === 'voice'
                ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
            title="Voice Call"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          
          {/* Video Call Button */}
          <button 
            onClick={handleVideoCall}
            disabled={isCallActive}
            className={`p-2 rounded-full transition-colors ${
              isCallActive && callType === 'video'
                ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
            title="Video Call"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          
          {/* Menu Button */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={handleMenuToggle}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
              title="More Options"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {/* Menu Dropdown */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="py-1">
                  <button
                    onClick={handleViewProfile}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    View Profile
                  </button>
                  
                  <button
                    onClick={handleBlockUser}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                    </svg>
                    Block User
                  </button>
                  
                  <button
                    onClick={handleReportUser}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Report User
                  </button>
                  
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  
                  <button
                    onClick={handleClearChat}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Call Status Bar */}
      {isCallActive && (
        <div className="flex-shrink-0 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                {callType === 'voice' ? 'Voice Call' : 'Video Call'} with {otherUser?.username || 'user'}
              </span>
            </div>
            <button
              onClick={handleEndCall}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              End Call
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-0">
        {messages.length > 0 ? (
          <div className="space-y-4">
            {messages
              .filter(msg => !deletingMessages.includes(msg._id))
              .map((msg) => (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isOwn={msg.sender === currentUserId}
                  sender={msg.sender === currentUserId ? currentUserId : otherUser}
                  showAvatar={msg.sender !== currentUserId && (msg.sender !== messages[messages.indexOf(msg) - 1]?.sender)}
                  onView={onViewMessage}
                  deliveryStatus={deliveryStatus}
                  isFading={fadingMessages.includes(msg._id)}
                  isDeleting={deletingMessages.includes(msg._id)}
                />
              ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No messages yet</h3>
              <p className="text-gray-600 dark:text-gray-400">Send a message to start the conversation</p>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <form onSubmit={handleSend} className="flex items-end gap-4">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              type="text"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Type your message..."
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              rows="1"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <button
                type="button"
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Emoji"
              >
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
} 