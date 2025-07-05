import React, { useState, useEffect } from 'react';
import { DefaultAvatar } from '../layout/AFEXLogo';

export default function MessageBubble({ 
  message, 
  isOwn, 
  sender, 
  showAvatar = true, 
  onView, 
  deliveryStatus = {}, 
  isFading = false, 
  isDeleting = false 
}) {
  const [showDeleteTimer, setShowDeleteTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  // Handle Snapchat-style deletion timer
  useEffect(() => {
    if (message.viewed && !isOwn && !showDeleteTimer) {
      setShowDeleteTimer(true);
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [message.viewed, isOwn, showDeleteTimer]);

  const handleView = () => {
    if (onView && !message.viewed && !isOwn && !message.isTemp) {
      onView(message._id);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDeliveryStatusIcon = () => {
    const status = deliveryStatus[message._id];
    if (status === 'sent') {
      return (
        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    } else if (status === 'delivered') {
      return (
        <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (status === 'read') {
      return (
        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return null;
  };

  if (isDeleting) {
    return null;
  }

  // Add null checks for message and sender
  if (!message) {
    return null;
  }

  return (
    <div className={`flex items-end gap-3 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="flex-shrink-0">
          {sender?.avatar ? (
            <div className="relative">
              <img
                src={sender.avatar}
                alt={sender.username || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-white dark:border-gray-800 shadow-sm"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <DefaultAvatar 
                user={sender} 
                size="sm" 
                className="hidden"
              />
            </div>
          ) : (
            <DefaultAvatar 
              user={sender} 
              size="sm"
            />
          )}
        </div>
      )}
      
      {showAvatar && isOwn && (
        <div className="flex-shrink-0 w-8"></div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-xs lg:max-w-md`}>
        {/* Sender name for group chats */}
        {!isOwn && showAvatar && (
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 px-2">
            {sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.username : 'Unknown User'}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-3 rounded-2xl shadow-sm transition-all duration-300 ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md'
          } ${isFading ? 'opacity-50' : 'opacity-100'} ${
            !message.viewed && !isOwn ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''
          }`}
          onClick={handleView}
          style={{ cursor: !message.viewed && !isOwn ? 'pointer' : 'default' }}
        >
          {/* Message text */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content || 'Empty message'}
          </div>

          {/* Media content */}
          {message.media && (
            <div className="mt-2 max-w-xs">
              {message.media.type?.startsWith('image/') ? (
                <img
                  src={message.media.url}
                  alt="Message media"
                  className="max-w-full rounded-lg shadow-sm"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : message.media.type?.startsWith('video/') ? (
                <video
                  src={message.media.url}
                  controls
                  className="max-w-full rounded-lg shadow-sm"
                  preload="metadata"
                />
              ) : null}
            </div>
          )}

          {/* View indicator for unviewed messages */}
          {!message.viewed && !isOwn && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          )}
        </div>

        {/* Message metadata */}
        <div className={`flex items-center gap-1 mt-1 px-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(message.createdAt)}
          </span>
          
          {isOwn && (
            <div className="flex items-center">
              {getDeliveryStatusIcon()}
            </div>
          )}

          {/* Message status indicators */}
          {message.viewed && !isOwn && (
            <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Typing indicator */}
        {message.isTyping && (
          <div className="flex items-center gap-1 mt-1 px-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">typing...</span>
          </div>
        )}
      </div>
    </div>
  );
} 