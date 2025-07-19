import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DefaultAvatar from '../components/chat/DefaultAvatar';
import { io } from 'socket.io-client';

const RINGTONE_URL = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export default function CallPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const otherUserId = searchParams.get('user');
  const currentUserId = user?._id;

  const [socket, setSocket] = useState(null);
  const [isIncoming, setIsIncoming] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // idle, ringing, connecting, in-call
  const [peer, setPeer] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [offer, setOffer] = useState(null);
  const [ringtoneAudio, setRingtoneAudio] = useState(null);
  const [permissionError, setPermissionError] = useState(null);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  // Setup socket
  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    setSocket(s);
    s.on('connect', () => {
      s.emit('register', currentUserId);
    });
    return () => s.disconnect();
  }, [currentUserId]);

  // Handle incoming/outgoing call events
  useEffect(() => {
    if (!socket) return;
    // Incoming call
    socket.on('incoming-call', async ({ from, offer }) => {
      setIsIncoming(true);
      setOffer(offer);
      setCallStatus('ringing');
      playRingtone();
    });
    // Call answered
    socket.on('call-answered', async ({ answer }) => {
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus('in-call');
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

  // Play/stop ringtone
  function playRingtone() {
    const audio = new window.Audio(RINGTONE_URL);
    audio.loop = true;
    audio.volume = 0.5;
    audio.play().catch(() => {});
    setRingtoneAudio(audio);
  }
  function stopRingtone() {
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
      setRingtoneAudio(null);
    }
  }

  // Start call (outgoing)
  async function startCall() {
    setIsCalling(true);
    setCallStatus('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      const pc = new RTCPeerConnection();
      setPeer(pc);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('ice-candidate', { to: otherUserId, candidate: e.candidate });
        }
      };
      pc.ontrack = (e) => {
        setRemoteStream(e.streams[0]);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('call-user', { to: otherUserId, offer });
    } catch (err) {
      setPermissionError('Camera/microphone permission denied. Please allow access and try again.');
      setCallStatus('idle');
    }
  }

  // Accept call (incoming)
  async function acceptCall() {
    stopRingtone();
    setCallStatus('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      const pc = new RTCPeerConnection();
      setPeer(pc);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('ice-candidate', { to: otherUserId, candidate: e.candidate });
        }
      };
      pc.ontrack = (e) => {
        setRemoteStream(e.streams[0]);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer-call', { to: otherUserId, answer });
      setCallStatus('in-call');
    } catch (err) {
      setPermissionError('Camera/microphone permission denied. Please allow access and try again.');
      setCallStatus('idle');
    }
  }

  // Reject call
  function rejectCall() {
    stopRingtone();
    setCallStatus('idle');
    setIsIncoming(false);
    setOffer(null);
    navigate(-1);
  }

  // End call
  function endCall() {
    stopRingtone();
    setCallStatus('idle');
    setIsIncoming(false);
    setOffer(null);
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
    navigate(-1);
  }

  // Outgoing: start call on mount if not incoming
  useEffect(() => {
    if (!isIncoming && otherUserId && socket) {
      startCall();
    }
    // eslint-disable-next-line
  }, [otherUserId, socket]);

  // UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="bg-white/80 dark:bg-gray-900/90 rounded-3xl shadow-2xl p-8 max-w-xs w-full flex flex-col items-center border border-gray-200 dark:border-gray-800 relative animate-fade-in">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mb-4 shadow-lg">
          <DefaultAvatar user={{ _id: otherUserId }} size="xl" />
        </div>
        {/* Name & Type */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 animate-fade-in-slow">
          Video Call
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-300 mb-2 animate-fade-in-slow">
          {isIncoming ? 'Incoming Call' : 'Calling...'}
        </div>
        {/* Status */}
        <div className="text-base font-medium text-blue-600 dark:text-blue-400 mb-6 animate-pulse">
          {callStatus === 'ringing' && 'Ringing...'}
          {callStatus === 'connecting' && 'Connecting...'}
          {callStatus === 'in-call' && 'In Call'}
        </div>
        {/* Video Area */}
        <div className="mb-4 flex flex-col items-center gap-2">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-24 h-24 rounded-lg border-2 border-blue-500 bg-black/40" />
          <video ref={remoteVideoRef} autoPlay playsInline className="w-40 h-40 rounded-lg border-2 border-green-500 bg-black/40" />
        </div>
        {/* Error Message */}
        {permissionError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{permissionError}</p>
          </div>
        )}
        {/* Buttons */}
        {isIncoming && callStatus === 'ringing' ? (
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
  );
} 