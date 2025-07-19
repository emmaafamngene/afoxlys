import React, { useState, useEffect } from 'react';
import AgoraUIKit from 'agora-react-uikit';

const AgoraCall = ({ 
  channelName, 
  callType = 'video', 
  onEndCall, 
  isIncoming = false,
  otherUser 
}) => {
  const [isInCall, setIsInCall] = useState(false);
  const [error, setError] = useState(null);

  const rtcProps = {
    appId: '031c6c76f0f8437089b337b62ccf2f38', // Your Agora App ID
    channel: channelName,
    token: null, // Set to null for testing, or provide a token for production
    role: 'host',
    layout: callType === 'video' ? 0 : 1, // 0 for video, 1 for voice
  };

  const callbacks = {
    EndCall: () => {
      console.log('Call ended');
      setIsInCall(false);
      if (onEndCall) onEndCall();
    },
    'user-joined': (uid) => {
      console.log('User joined:', uid);
    },
    'user-left': (uid) => {
      console.log('User left:', uid);
    },
  };

  const handleStartCall = async () => {
    try {
      // Check permissions based on call type
      const constraints = callType === 'voice' 
        ? { audio: true } 
        : { audio: true, video: true };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      
      console.log(`✅ ${callType === 'voice' ? 'Microphone' : 'Camera and microphone'} permission granted`);
      setIsInCall(true);
    } catch (error) {
      console.error('❌ Error starting call:', error);
      if (error.name === 'NotAllowedError') {
        const permissionType = callType === 'voice' ? 'microphone' : 'camera and microphone';
        setError(`${permissionType} permission denied. Please allow access and try again.`);
      } else {
        setError('Failed to start call. Please check your camera and microphone permissions.');
      }
    }
  };

  const handleAcceptCall = async () => {
    try {
      // Check permissions based on call type
      const constraints = callType === 'voice' 
        ? { audio: true } 
        : { audio: true, video: true };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      
      console.log(`✅ ${callType === 'voice' ? 'Microphone' : 'Camera and microphone'} permission granted`);
      setIsInCall(true);
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      if (error.name === 'NotAllowedError') {
        const permissionType = callType === 'voice' ? 'microphone' : 'camera and microphone';
        setError(`${permissionType} permission denied. Please allow access and try again.`);
      } else {
        setError('Failed to accept call. Please check your camera and microphone permissions.');
      }
    }
  };

  const handleRejectCall = () => {
    if (onEndCall) onEndCall();
  };

  // If we're in an active call, show the Agora UIKit
  if (isInCall) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <AgoraUIKit 
          rtcProps={rtcProps} 
          callbacks={callbacks}
          styleProps={{
            localBtnStyles: {
              backgroundColor: '#3b82f6',
              borderColor: '#3b82f6',
            },
            remoteBtnStyles: {
              backgroundColor: '#ef4444',
              borderColor: '#ef4444',
            },
            theme: {
              backgroundColor: '#1f2937',
              color: '#ffffff',
            },
          }}
        />
      </div>
    );
  }

  // Show call interface
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            {otherUser?.avatar ? (
              <img
                src={otherUser.avatar}
                alt={otherUser.username}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            {isIncoming ? 'Incoming Call' : 'Starting Call...'}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400">
            {otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.username : 'Unknown User'}
          </p>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {callType === 'video' ? 'Video Call' : 'Voice Call'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Call Controls */}
        <div className="flex justify-center gap-4">
          {isIncoming ? (
            <>
              {/* Accept Call */}
              <button
                onClick={handleAcceptCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              
              {/* Reject Call */}
              <button
                onClick={handleRejectCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            </>
          ) : (
            <>
              {/* Start Call */}
              <button
                onClick={handleStartCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              
              {/* Cancel Call */}
              <button
                onClick={handleRejectCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Call Info */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Channel: {channelName}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgoraCall; 