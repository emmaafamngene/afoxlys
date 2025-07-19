import React from 'react';

export default function CallModal({
  isOpen,
  callType = 'video',
  otherUser = {},
  status = 'calling', // 'calling', 'ringing', 'in-call', 'ended', 'rejected', 'cancelled'
  onAccept,
  onReject,
  onEnd,
  isIncoming = false,
  isRinging = false,
  isInCall = false,
}) {
  if (!isOpen) return null;

  const statusText = {
    calling: isIncoming ? 'Incoming Call...' : 'Calling...',
    ringing: 'Ringing...',
    'in-call': 'In Call',
    ended: 'Call Ended',
    rejected: 'Call Rejected',
    cancelled: 'Call Cancelled',
  }[status] || 'Calling...';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white/80 dark:bg-gray-900/80 rounded-3xl shadow-2xl p-8 max-w-xs w-full flex flex-col items-center relative border border-gray-200 dark:border-gray-800">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mb-4 shadow-lg">
          {otherUser.avatar ? (
            <img src={otherUser.avatar} alt={otherUser.username} className="w-24 h-24 rounded-full object-cover" />
          ) : (
            <svg className="w-12 h-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
        {/* Name & Type */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 animate-fade-in-slow">
          {otherUser.firstName || otherUser.username || 'User'}
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-300 mb-2 animate-fade-in-slow">
          {callType === 'video' ? 'Video Call' : 'Voice Call'}
        </div>
        {/* Status */}
        <div className="text-base font-medium text-blue-600 dark:text-blue-400 mb-6 animate-pulse">
          {statusText}
        </div>
        {/* Buttons */}
        <div className="flex gap-6 mt-2">
          {isIncoming && !isInCall && (
            <button
              onClick={onAccept}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg transition-colors animate-pop-in"
              title="Accept Call"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          )}
          {(!isInCall || isIncoming) && (
            <button
              onClick={onReject}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-colors animate-pop-in"
              title="Reject Call"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          )}
          {isInCall && (
            <button
              onClick={onEnd}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg transition-colors animate-pop-in"
              title="End Call"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 