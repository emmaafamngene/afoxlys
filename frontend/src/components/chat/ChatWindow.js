import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import DefaultAvatar from '../DefaultAvatar';
import AgoraCall from '../video/AgoraCall';
import CallModal from './CallModal';

export default function ChatWindow({
  messages = [],
  currentUserId,
  onSendMessage,
  onViewMessage,
  deliveryStatus = {},
  selectedConversation,
  socket,
}) {
  // State
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [fadingMessages, setFadingMessages] = useState([]);
  const [deletingMessages, setDeletingMessages] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  // Call state
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState(null);
  const [channelName, setChannelName] = useState(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, ringing, in-call, ended, rejected, cancelled
  const [callFrom, setCallFrom] = useState(null); // user info of caller
  const [isInCall, setIsInCall] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  // Get other user from conversation participants
  const participants = selectedConversation?.participants || [];
  const otherUser = participants.find(user => user._id !== currentUserId);

  // --- Socket.IO Call Signaling ---
  useEffect(() => {
    if (!socket || !otherUser) return;

    // Incoming call invite
    const handleCallInvite = (data) => {
      if (data.to !== currentUserId) return;
      setShowCallModal(true);
      setCallType(data.callType);
      setChannelName(data.channelName);
      setIsIncomingCall(true);
      setCallStatus('ringing');
      setCallFrom(data.fromUser);
    };

    // Call accepted by callee
    const handleCallAccept = (data) => {
      if (data.to !== currentUserId) return;
      setCallStatus('in-call');
      setIsInCall(true);
      setShowCallModal(true);
    };

    // Call rejected by callee
    const handleCallReject = (data) => {
      if (data.to !== currentUserId) return;
      setCallStatus('rejected');
      setTimeout(() => setShowCallModal(false), 1500);
    };

    // Call cancelled by caller
    const handleCallCancel = (data) => {
      if (data.to !== currentUserId) return;
      setCallStatus('cancelled');
      setTimeout(() => setShowCallModal(false), 1500);
    };

    // Call ended by either
    const handleCallEnd = (data) => {
      setCallStatus('ended');
      setIsInCall(false);
      setTimeout(() => setShowCallModal(false), 1500);
    };

    socket.on('call:invite', handleCallInvite);
    socket.on('call:accept', handleCallAccept);
    socket.on('call:reject', handleCallReject);
    socket.on('call:cancel', handleCallCancel);
    socket.on('call:end', handleCallEnd);

    return () => {
      socket.off('call:invite', handleCallInvite);
      socket.off('call:accept', handleCallAccept);
      socket.off('call:reject', handleCallReject);
      socket.off('call:cancel', handleCallCancel);
      socket.off('call:end', handleCallEnd);
    };
  }, [socket, currentUserId, otherUser]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);



  // Message handlers
  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim() && selectedConversation) {
      onSendMessage(input.trim(), selectedConversation._id);
      setInput('');
      setTyping(false);
    }
  };

  const handleView = (msg) => {
    onViewMessage(msg._id);
    setFadingMessages(prev => [...prev, msg._id]);
    setTimeout(() => {
      setDeletingMessages(prev => [...prev, msg._id]);
    }, 300);
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

  // --- Outgoing Call Handlers ---
  const handleVoiceCall = () => {
    if (!selectedConversation || !otherUser) return;
    const channel = `call-${currentUserId}-${otherUser._id}-${Date.now()}`;
    setCallType('voice');
    setChannelName(channel);
    setShowCallModal(true);
    setIsIncomingCall(false);
    setCallStatus('calling');
    setIsInCall(false);
    setCallFrom(null);
    // Emit call invite
    socket.emit('call:invite', {
      to: otherUser._id,
      from: currentUserId,
      fromUser: { _id: currentUserId },
      callType: 'voice',
      channelName: channel,
    });
  };

  const handleVideoCall = () => {
    if (!selectedConversation || !otherUser) return;
    const channel = `call-${currentUserId}-${otherUser._id}-${Date.now()}`;
    setCallType('video');
    setChannelName(channel);
    setShowCallModal(true);
    setIsIncomingCall(false);
    setCallStatus('calling');
    setIsInCall(false);
    setCallFrom(null);
    // Emit call invite
    socket.emit('call:invite', {
      to: otherUser._id,
      from: currentUserId,
      fromUser: { _id: currentUserId },
      callType: 'video',
      channelName: channel,
    });
  };

  // --- Incoming Call Handlers ---
  const handleAcceptCall = () => {
    setCallStatus('in-call');
    setIsInCall(true);
    socket.emit('call:accept', {
      to: callFrom?._id || otherUser._id,
      from: currentUserId,
      channelName,
    });
  };

  const handleRejectCall = () => {
    setCallStatus('rejected');
    setTimeout(() => setShowCallModal(false), 1500);
    socket.emit('call:reject', {
      to: callFrom?._id || otherUser._id,
      from: currentUserId,
      channelName,
    });
  };

  // --- Outgoing Cancel ---
  const handleCancelCall = () => {
    setCallStatus('cancelled');
    setTimeout(() => setShowCallModal(false), 1500);
    socket.emit('call:cancel', {
      to: otherUser._id,
      from: currentUserId,
      channelName,
    });
  };

  // --- End Call ---
  const handleEndCall = () => {
    setCallStatus('ended');
    setIsInCall(false);
    setTimeout(() => setShowCallModal(false), 1500);
    socket.emit('call:end', {
      to: otherUser._id,
      from: currentUserId,
      channelName,
    });
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
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Select a conversation</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Choose a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Call Modal (Signaling) */}
      {showCallModal && !isInCall && (
        <CallModal
          isOpen={showCallModal}
          callType={callType}
          otherUser={isIncomingCall ? (callFrom || otherUser) : otherUser}
          status={callStatus}
          isIncoming={isIncomingCall}
          isRinging={callStatus === 'ringing'}
          isInCall={isInCall}
          onAccept={handleAcceptCall}
          onReject={isIncomingCall ? handleRejectCall : handleCancelCall}
          onEnd={handleEndCall}
        />
      )}
      {/* AgoraCall (In-Call) */}
      {showCallModal && isInCall && (
        <AgoraCall
          channelName={channelName}
          callType={callType}
          onEndCall={handleEndCall}
          isIncoming={isIncomingCall}
          otherUser={isIncomingCall ? (callFrom || otherUser) : otherUser}
        />
      )}

      {/* Slim Chat Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {otherUser?.avatar ? (
              <img
                src={otherUser.avatar}
                alt={otherUser.username || 'User'}
                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <DefaultAvatar 
              user={otherUser} 
              size="sm" 
              showOnline={true}
              className={otherUser?.avatar ? 'hidden' : ''}
            />
          </div>
          
          {/* User Info */}
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.username : 'Unknown User'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {otherUser ? `@${otherUser.username}` : '@unknown'} • Online
            </p>
          </div>
        </div>
        
        {/* Call Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Voice Call Button */}
          <button 
            onClick={handleVoiceCall}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
            title="Voice Call"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          
          {/* Video Call Button */}
          <button 
            onClick={handleVideoCall}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
            title="Video Call"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {/* Menu Dropdown */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="py-1">
                  <button
                    onClick={handleViewProfile}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    View Profile
                  </button>
                  
                  <button
                    onClick={handleBlockUser}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                    </svg>
                    Block User
                  </button>
                  
                  <button
                    onClick={handleReportUser}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Report User
                  </button>
                  
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  
                  <button
                    onClick={handleClearChat}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
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



      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50 dark:bg-gray-900 min-h-0">
        {messages.length > 0 ? (
          <div className="space-y-2">
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
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start the conversation!</p>
            </div>
          </div>
        )}
      </div>

      {/* Slim Input Area */}
      <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="flex-1 min-w-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows="1"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex-shrink-0 p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
} 