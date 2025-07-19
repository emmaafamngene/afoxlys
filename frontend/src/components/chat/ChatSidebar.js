import React from 'react';
import { DefaultAvatar } from '../layout/AFEXLogo';

export default function ChatSidebar({ conversations = [], selectedConversationId, onSelectConversation, onNewChat }) {
  // Add defensive check for onSelectConversation
  const handleConversationSelect = (conversation) => {
    if (typeof onSelectConversation === 'function') {
      onSelectConversation(conversation);
    } else {
      console.warn('onSelectConversation is not a function:', onSelectConversation);
    }
  };

  // Add defensive check for onNewChat
  const handleNewChat = () => {
    if (typeof onNewChat === 'function') {
      onNewChat();
    } else {
      console.warn('onNewChat is not a function:', onNewChat);
    }
  };
  return (
    <aside className="w-80 h-full border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col shadow-sm">
      {/* Header - Fixed height */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Messages
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleNewChat}
            className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            title="New Message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Bar - Fixed height */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full px-4 py-3 pl-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Conversations List - Scrollable area */}
      <div className="flex-1 overflow-y-auto min-h-0 chat-sidebar-scroll">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No conversations yet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Start a new chat to begin messaging</p>
            <button
              onClick={handleNewChat}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Start New Chat
            </button>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conv) => {
              // Add null checks for participants
              const participants = conv.participants || [];
              const currentUserId = conv.currentUserId;
              const other = participants.find((u) => u._id !== currentUserId);
              
              // Skip if no other participant found
              if (!other) {
                return null;
              }
              const isSelected = selectedConversationId === conv._id;
              
              return (
                <button
                  key={conv._id}
                  onClick={() => handleConversationSelect(conv)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 mb-2 group hover:shadow-md
                    ${isSelected 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 shadow-sm' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-2 border-transparent'
                    }`}
                >
                  {/* Avatar */}
                  {other?.avatar ? (
                    <div className="relative flex-shrink-0">
                      <img
                        src={other.avatar}
                        alt={other.username || 'User'}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <DefaultAvatar 
                        user={other} 
                        size="md" 
                        showOnline={true}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <DefaultAvatar 
                      user={other} 
                      size="md" 
                      showOnline={true}
                    />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-gray-900 dark:text-white truncate">
                        {other ? `${other.firstName || ''} ${other.lastName || ''}`.trim() || other.username : 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                        {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {conv.lastMessage || 'No messages yet'}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {other ? `@${other.username}` : '@unknown'}
                      </div>
                      {/* Unread indicator */}
                      {conv.unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div className={`transition-transform duration-200 ${isSelected ? 'rotate-90' : 'rotate-0'}`}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - Fixed height */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Messages are end-to-end encrypted
          </p>
        </div>
      </div>
    </aside>
  );
} 