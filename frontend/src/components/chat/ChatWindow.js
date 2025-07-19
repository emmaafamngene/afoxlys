import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import DefaultAvatar from '../DefaultAvatar';
import { useNavigate } from 'react-router-dom';
import { getAvatarUrl } from '../../utils/avatarUtils';

// Use a free online ringtone
const RINGTONE_URL = 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa4c82.mp3';

// Helper to generate a safe Agora channel name
function safeChannelName(...parts) {
  // Only allow supported characters, join with dash, and trim to 63 chars
  return parts
    .map(p => (p || '').toString().replace(/[^a-zA-Z0-9!#$%&()+\-:;<=.>?@[\]^_{\}|~, ]/g, ''))
    .join('-')
    .slice(0, 63);
}

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

  // --- WebRTC Call State ---
  const [callModal, setCallModal] = useState(false);
  const [callType, setCallType] = useState('video');
  const [isCalling, setIsCalling] = useState(false);
  const [isIncoming, setIsIncoming] = useState(false);
  const [callerId, setCallerId] = useState(null);
  const [peer, setPeer] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [offer, setOffer] = useState(null);
  const [callUserId, setCallUserId] = useState(null);
  const [ringtoneAudio, setRingtoneAudio] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle, ringing, connecting, in-call

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  const navigate = useNavigate();

  // Get other user from conversation participants
  const participants = selectedConversation?.participants || [];
  const otherUser = participants.find(user => user._id !== currentUserId);

  // --- WebRTC/Socket.IO Call Logic ---
  useEffect(() => {
    if (!socket) return;

    // Incoming call
    socket.on('incoming-call', async ({ from, offer }) => {
      setCallModal(true);
      setIsIncoming(true);
      setCallerId(from);
      setOffer(offer);
    });

    // Call answered
    socket.on('call-answered', async ({ answer }) => {
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // ICE candidate
    socket.on('ice-candidate', async ({ candidate }) => {
      if (peer && candidate) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off('incoming-call');
      socket.off('call-answered');
      socket.off('ice-candidate');
    };
  }, [socket, peer]);

  // --- Play/Stop Ringtone ---
  useEffect(() => {
    if (isIncoming && callModal) {
      // Play ringtone
      const audio = new window.Audio(RINGTONE_URL);
      audio.loop = true;
      audio.volume = 0.5;
      audio.play().catch(() => {});
      setRingtoneAudio(audio);
    } else if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
      setRingtoneAudio(null);
    }
    // Stop on unmount
    return () => {
      if (ringtoneAudio) {
        ringtoneAudio.pause();
        ringtoneAudio.currentTime = 0;
      }
    };
  }, [isIncoming, callModal]);

  // --- WebRTC Peer Setup ---
  async function getMedia() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }

  // Remove in-chat call modal logic
  // Instead, navigate to /call?user=otherUser._id when starting/accepting a call
  async function startCall() {
    if (!otherUser) return;
    navigate(`/call?user=${otherUser._id}`);
  }

  async function acceptCall() {
    setCallModal(true);
    setIsCalling(false);
    setIsIncoming(false);
    setCallUserId(callerId);
    const stream = await getMedia();
    const pc = new RTCPeerConnection();
    setPeer(pc);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', { to: callerId, candidate: e.candidate });
      }
    };
    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer-call', { to: callerId, answer });
  }

  function rejectCall() {
    setCallModal(false);
    setIsIncoming(false);
    setCallerId(null);
    setOffer(null);
    // Optionally notify caller
  }

  function endCall() {
    setCallModal(false);
    setIsCalling(false);
    setIsIncoming(false);
    setCallerId(null);
    setOffer(null);
    setCallUserId(null);
    if (peer) peer.close();
    setPeer(null);
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
  }

  // Scroll to bottom on new messages
  useEffect(() => {
    // messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); // Removed
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
    // const channel = safeChannelName('call', currentUserId, otherUser._id, Date.now()); // Removed
    // setCallType(data.callType); // Removed
    // setChannelName(data.channelName); // Removed
    // setShowCallModal(true); // Removed
    // setIsIncomingCall(false); // Removed
    // setCallStatus('calling'); // Removed
    // setIsInCall(false); // Removed
    // setCallFrom(null); // Removed
    // // Emit call invite // Removed
    // socket.emit('call:invite', { // Removed
    //   to: otherUser._id, // Removed
    //   from: currentUserId, // Removed
    //   fromUser: { _id: currentUserId }, // Removed
    //   callType: 'voice', // Removed
    //   channelName: channel, // Removed
    // }); // Removed
  };

  const handleVideoCall = () => {
    if (!selectedConversation || !otherUser) return;
    // const channel = safeChannelName('call', currentUserId, otherUser._id, Date.now()); // Removed
    // setCallType('video'); // Removed
    // setChannelName(channel); // Removed
    // setShowCallModal(true); // Removed
    // setIsIncomingCall(false); // Removed
    // setCallStatus('calling'); // Removed
    // setIsInCall(false); // Removed
    // setCallFrom(null); // Removed
    // // Emit call invite // Removed
    // socket.emit('call:invite', { // Removed
    //   to: otherUser._id, // Removed
    //   from: currentUserId, // Removed
    //   fromUser: { _id: currentUserId }, // Removed
    //   callType: 'video', // Removed
    //   channelName: channel, // Removed
    // }); // Removed
  };

  // --- Incoming Call Handlers ---
  const handleAcceptCall = () => {
    // setCallStatus('in-call'); // Removed
    // setIsInCall(true); // Removed
    // socket.emit('call:accept', { // Removed
    //   to: callFrom?._id || otherUser._id, // Removed
    //   from: currentUserId, // Removed
    //   channelName, // Removed
    // }); // Removed
  };

  const handleRejectCall = () => {
    // setCallStatus('rejected'); // Removed
    // setTimeout(() => setShowCallModal(false), 1500); // Removed
    // socket.emit('call:reject', { // Removed
    //   to: callFrom?._id || otherUser._id, // Removed
    //   from: currentUserId, // Removed
    //   channelName, // Removed
    // }); // Removed
  };

  // --- Outgoing Cancel ---
  const handleCancelCall = () => {
    // setCallStatus('cancelled'); // Removed
    // setTimeout(() => setShowCallModal(false), 1500); // Removed
    // socket.emit('call:cancel', { // Removed
    //   to: otherUser._id, // Removed
    //   from: currentUserId, // Removed
    //   channelName, // Removed
    // }); // Removed
  };

  // --- End Call ---
  const handleEndCall = () => {
    // setCallStatus('ended'); // Removed
    // setIsInCall(false); // Removed
    // setTimeout(() => setShowCallModal(false), 1500); // Removed
    // socket.emit('call:end', { // Removed
    //   to: otherUser._id, // Removed
    //   from: currentUserId, // Removed
    //   channelName, // Removed
    // }); // Removed
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
      // if (menuRef.current && !menuRef.current.contains(event.target)) { // Removed
      //   setShowMenu(false); // Removed
      // } // Removed
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

  // --- UI ---
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Modern WebRTC Call Modal */}
      {callModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/80 dark:bg-gray-900/90 rounded-3xl shadow-2xl p-8 max-w-xs w-full flex flex-col items-center border border-gray-200 dark:border-gray-800 relative">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mb-4 shadow-lg">
              {otherUser?.avatar ? (
                <img src={otherUser.avatar} alt={otherUser.username} className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <svg className="w-12 h-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            {/* Name & Type */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 animate-fade-in-slow">
              {otherUser?.firstName || otherUser?.username || 'User'}
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-300 mb-2 animate-fade-in-slow">
              Video Call
            </div>
            {/* Status */}
            <div className="text-base font-medium text-blue-600 dark:text-blue-400 mb-6 animate-pulse">
              {isIncoming && callStatus === 'ringing' && 'Ringing...'}
              {isCalling && callStatus === 'connecting' && 'Connecting...'}
              {!isIncoming && !isCalling && callStatus === 'in-call' && 'In Call'}
            </div>
            {/* Video Area */}
            <div className="mb-4 flex flex-col items-center gap-2">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-24 h-24 rounded-lg border-2 border-blue-500 bg-black/40" />
              <video ref={remoteVideoRef} autoPlay playsInline className="w-40 h-40 rounded-lg border-2 border-green-500 bg-black/40" />
            </div>
            {/* Buttons */}
            {isIncoming ? (
              <div className="flex gap-6 mt-2">
                <button
                  onClick={acceptCall}
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg transition-colors animate-pop-in"
                  title="Accept Call"
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button
                  onClick={rejectCall}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-colors animate-pop-in"
                  title="Reject Call"
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex gap-6 mt-2">
                <button
                  onClick={endCall}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg transition-colors animate-pop-in"
                  title="End Call"
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Slim Chat Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {otherUser?.avatar ? (
              <img
                src={getAvatarUrl(otherUser.avatar)}
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
        {/* Call Button */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button 
            onClick={startCall}
            className="p-2 rounded-full hover:bg-green-100 dark:hover:bg-green-800 transition-colors text-green-600 dark:text-green-400"
            title="Start Call"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
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
            {/* <div ref={messagesEndRef} /> */}
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
              // ref={inputRef} // Removed
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