import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const RINGTONE_URL = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://afoxlys.onrender.com';

const CallContext = createContext();

export function CallProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null); // { from, offer }
  const [ringtoneAudio, setRingtoneAudio] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const localVideoRef = useRef();

  // Setup global socket
  useEffect(() => {
    if (!user?._id) return;
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    setSocket(s);
    s.on('connect', () => {
      s.emit('register', user._id);
    });
    return () => s.disconnect();
  }, [user?._id]);

  // Listen for incoming calls globally
  useEffect(() => {
    if (!socket) return;
    socket.on('incoming-call', async ({ from, offer }) => {
      setIncomingCall({ from, offer });
      playRingtone();
      // Show camera preview for receiver
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch {}
    });
    return () => {
      socket.off('incoming-call');
    };
  }, [socket]);

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

  // Accept call: navigate to /call?user=...&offer=... (base64-encoded)
  function acceptCall() {
    stopRingtone();
    const offerStr = btoa(JSON.stringify(incomingCall.offer));
    setIncomingCall(null);
    navigate(`/call?user=${incomingCall.from}&offer=${offerStr}`);
  }
  // Reject call: just stop ringtone and clear state
  function rejectCall() {
    stopRingtone();
    setIncomingCall(null);
    setLocalStream(null);
  }

  return (
    <CallContext.Provider value={{ socket, incomingCall, localStream }}>
      {children}
      {/* Global incoming call modal */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
          <div className="bg-white/90 dark:bg-gray-900/90 rounded-3xl shadow-2xl p-8 max-w-xs w-full flex flex-col items-center border border-gray-200 dark:border-gray-800 relative">
            <div className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Incoming Call</div>
            <div className="mb-2 text-base text-gray-700 dark:text-gray-200">From: {incomingCall.from}</div>
            {/* Camera preview */}
            {localStream && (
              <div className="mb-4 w-24 h-24 rounded-full overflow-hidden border-4 border-blue-400 shadow-lg bg-black/60">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ borderRadius: '50%' }}
                />
              </div>
            )}
            <div className="flex gap-8 mt-4">
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
          </div>
        </div>
      )}
    </CallContext.Provider>
  );
}

export function useCallContext() {
  return useContext(CallContext);
} 