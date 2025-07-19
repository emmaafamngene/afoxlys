import React, { useState } from 'react';
import AgoraCall from '../components/video/AgoraCall';

export default function AgoraTest() {
  const [channelName, setChannelName] = useState('test-channel');
  const [callType, setCallType] = useState('video');
  const [showCall, setShowCall] = useState(false);

  const handleStartCall = () => {
    setShowCall(true);
  };

  const handleEndCall = () => {
    setShowCall(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🎥 Agora Video Call Test
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Test Agora video calling functionality. Enter a channel name and click "Start Call" to begin.
          </p>

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Channel Name
              </label>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter channel name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Call Type
              </label>
              <select
                value={callType}
                onChange={(e) => setCallType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="video">Video Call</option>
                <option value="voice">Voice Call</option>
              </select>
            </div>
          </div>

          {/* Call Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Call Settings</h3>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Channel: <span className="font-medium">{channelName}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Type: <span className="font-medium">{callType === 'video' ? 'Video Call' : 'Voice Call'}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                App ID: <span className="font-medium">031c6c76f0f8437089b337b62ccf2f38</span>
              </p>
            </div>
          </div>

          {/* Start Call Button */}
          <button
            onClick={handleStartCall}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Start {callType === 'video' ? 'Video' : 'Voice'} Call
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">How to Test</h3>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>1. Open this page in two different browser tabs or devices</li>
            <li>2. Use the same channel name in both tabs</li>
            <li>3. Click "Start Call" in both tabs</li>
            <li>4. Allow camera and microphone permissions when prompted</li>
            <li>5. You should see and hear each other</li>
            <li>6. Use the built-in controls for mute, camera, etc.</li>
          </ol>
        </div>
      </div>

      {/* Call Modal */}
      {showCall && (
        <AgoraCall
          channelName={channelName}
          callType={callType}
          onEndCall={handleEndCall}
          isIncoming={false}
          otherUser={{ username: 'Test User' }}
        />
      )}
    </div>
  );
} 