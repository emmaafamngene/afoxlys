import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DefaultAvatar from '../components/DefaultAvatar';
import { io } from 'socket.io-client';

const RINGTONE_URL = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://afoxlys.onrender.com';

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
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

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
    socket.on('incoming-call', async ({ from, offer }) => {
      setIsIncoming(true);
      setOffer(offer);
      setCallStatus('ringing');
      playRingtone();
      // Show camera preview for receiver
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch {}
    });
    socket.on('call-answered', async ({ answer }) => {
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus('in-call');
      }
    });
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

  // Mute/unmute mic
  function toggleMic() {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setMicOn(track.enabled);
      });
    }
  }
  // Camera on/off
  function toggleCam() {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setCamOn(track.enabled);
      });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] relative overflow-hidden">
      {/* Animated Instagram-like background shapes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute w-80 h-80 bg-gradient-to-br from-[#f58529]/30 via-[#dd2a7b]/30 to-[#8134af]/30 rounded-full blur-3xl top-[-100px] left-[-100px] animate-float" />
        <div className="absolute w-64 h-64 bg-gradient-to-br from-[#fdc468]/30 via-[#fa7e1e]/30 to-[#f58529]/30 rounded-full blur-2xl bottom-[-80px] right-[-80px] animate-float2" />
      </div>
      {/* Slim Instagram Call Card, now wider */}
      <div className="relative z-10 w-full max-w-3xl min-h-[520px] bg-white/80 dark:bg-gray-900/90 rounded-3xl shadow-2xl flex flex-col items-center px-6 py-8 border border-gray-200 dark:border-gray-800 animate-fade-in">
        {/* Status Bar */}
        <div className="w-full flex justify-center mb-4">
          <div className="px-4 py-1 rounded-full bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] shadow text-base font-semibold text-white backdrop-blur-md animate-fade-in">
            {callStatus === 'ringing' && 'Ringing...'}
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'in-call' && 'In Call'}
          </div>
        </div>
        {/* Remote Video - now 3/4 width, aspect-video */}
        <div className="relative w-3/4 aspect-video bg-black/80 rounded-2xl shadow-lg overflow-hidden flex items-center justify-center border-4 border-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-2xl"
            style={{ background: '#222' }}
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70">
              <div className="w-24 h-24 rounded-full border-4 border-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] flex items-center justify-center shadow-lg">
                <DefaultAvatar user={{ _id: otherUserId }} size="xl" />
              </div>
              <span className="mt-4 text-lg">Waiting for video...</span>
            </div>
          )}
        </div>
        {/* Remote user avatar and name */}
        <div className="flex flex-col items-center gap-1 mt-3">
          <div className="w-14 h-14 rounded-full border-4 border-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] flex items-center justify-center shadow">
            <DefaultAvatar user={{ _id: otherUserId }} size="md" />
          </div>
          <span className="text-gray-700 dark:text-gray-200 text-base font-semibold mt-1">{otherUserId}</span>
        </div>
        {/* Local Video PiP (circle) */}
        {localStream && (
          <div className="absolute bottom-28 right-8 w-24 h-24 rounded-full overflow-hidden border-4 border-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] shadow-lg bg-black/60">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ borderRadius: '50%' }}
            />
            <div className="absolute left-2 bottom-2 text-xs text-white/80 bg-black/40 px-2 py-1 rounded-full">
              You
            </div>
          </div>
        )}
        {/* Controls Bar */}
        <div className="w-full flex justify-center mt-8">
          <div className="flex gap-8 px-6 py-3 rounded-full bg-gradient-to-r from-[#f58529]/80 via-[#dd2a7b]/80 to-[#8134af]/80 shadow-2xl backdrop-blur-md animate-fade-in">
            <button
              onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg transition-colors ${micOn ? 'bg-white text-[#f58529]' : 'bg-gray-300 dark:bg-gray-700 text-gray-500'}`}
              title={micOn ? 'Mute' : 'Unmute'}
            >
              {micOn ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v22m6-6a6 6 0 01-12 0" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 19L5 5m7 7v6a3 3 0 01-6 0v-6m6 0a3 3 0 016 0v6a3 3 0 01-6 0v-6z" />
                </svg>
              )}
            </button>
            <button
              onClick={toggleCam}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg transition-colors ${camOn ? 'bg-white text-[#dd2a7b]' : 'bg-gray-300 dark:bg-gray-700 text-gray-500'}`}
              title={camOn ? 'Turn Camera Off' : 'Turn Camera On'}
            >
              {camOn ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 19L5 5m7 7v6a3 3 0 01-6 0v-6m6 0a3 3 0 016 0v6a3 3 0 01-6 0v-6z" />
                </svg>
              )}
            </button>
            <button
              onClick={endCall}
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-white text-[#8134af] shadow-lg transition-colors"
              title="End Call"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          </div>
        </div>
        {/* Error Message */}
        {permissionError && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 shadow-lg animate-fade-in">
            <p className="text-sm text-red-600 dark:text-red-400">{permissionError}</p>
          </div>
        )}
        {/* Incoming call accept/reject overlay */}
        {isIncoming && callStatus === 'ringing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-40 animate-fade-in rounded-3xl">
            <div className="mb-8 text-2xl text-white font-bold">Incoming Call</div>
            <div className="flex gap-8">
              <button
                onClick={acceptCall}
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] flex items-center justify-center shadow-lg transition-colors animate-pop-in"
                title="Accept Call"
              >
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button
                onClick={rejectCall}
                className="w-20 h-20 rounded-full bg-white text-[#dd2a7b] flex items-center justify-center shadow-lg transition-colors animate-pop-in"
                title="Reject Call"
              >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            </div>
            {/* Camera preview for receiver */}
            {localStream && (
              <div className="mt-8 w-24 h-24 rounded-full overflow-hidden border-4 border-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] shadow-lg bg-black/60">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ borderRadius: '50%' }}
                />
                <div className="absolute left-2 bottom-2 text-xs text-white/80 bg-black/40 px-2 py-1 rounded-full">
                  You
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 