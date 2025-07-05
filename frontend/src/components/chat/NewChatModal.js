import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { followAPI, usersAPI, chatAPI } from '../../services/api';

export default function NewChatModal({ isOpen, onClose, onStartChat }) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [following, setFollowing] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('following'); // 'following' or 'search'

  // Fetch user's following list
  useEffect(() => {
    if (!user?._id) return;
    
    setLoading(true);
    followAPI.getFollowing(user._id)
      .then(res => {
        setFollowing(res.data.following);
      })
      .catch(err => {
        console.error('Error fetching following:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?._id]);

  // Search users
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      try {
        const res = await usersAPI.search(searchTerm);
        // Filter out current user and already following
        const filtered = res.data.filter(u => 
          u._id !== user._id && 
          !following.find(f => f._id === u._id)
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error('Error searching users:', err);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, following, user?._id]);

  const handleStartChat = async (selectedUser) => {
    try {
      // Create or get existing conversation
      const res = await chatAPI.createConversation(user._id, selectedUser._id);
      
      onStartChat(res.data);
      onClose();
    } catch (err) {
      console.error('Error starting chat:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              New Message
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 outline-none"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'following'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            Following
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            Search Results
          </button>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              Loading...
            </div>
          ) : activeTab === 'following' ? (
            following.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>You're not following anyone yet</p>
                <p className="text-sm mt-2">Follow people to start chatting with them</p>
              </div>
            ) : (
              <div className="p-2">
                {following.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleStartChat(user)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <img
                      src={user.avatar || '/default-avatar.png'}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover bg-zinc-200 dark:bg-zinc-700"
                      onError={e => { e.target.src = 'https://via.placeholder.com/48x48/6b7280/ffffff?text=U'; }}
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {user.username}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {user.fullName || user.username}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                ))}
              </div>
            )
          ) : (
            searchResults.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                {searchTerm.length >= 2 ? (
                  <>
                    <svg className="w-12 h-12 mx-auto mb-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p>No users found</p>
                    <p className="text-sm mt-2">Try searching for a different username</p>
                  </>
                ) : (
                  <>
                    <svg className="w-12 h-12 mx-auto mb-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p>Search for users</p>
                    <p className="text-sm mt-2">Type at least 2 characters to search</p>
                  </>
                )}
              </div>
            ) : (
              <div className="p-2">
                {searchResults.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleStartChat(user)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <img
                      src={user.avatar || '/default-avatar.png'}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover bg-zinc-200 dark:bg-zinc-700"
                      onError={e => { e.target.src = 'https://via.placeholder.com/48x48/6b7280/ffffff?text=U'; }}
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {user.username}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {user.fullName || user.username}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
} 