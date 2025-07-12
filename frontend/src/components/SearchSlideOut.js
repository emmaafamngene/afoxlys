import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { searchAPI } from '../services/api';
import PostCard from './posts/PostCard';
import ClipCard from './clips/ClipCard';
import { FiSearch, FiUsers, FiFileText, FiVideo, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SearchSlideOut = ({ isOpen, onClose }) => {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState({
    users: [],
    posts: [],
    clips: []
  });
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key to close search
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setResults({ users: [], posts: [], clips: [] });
    }
  }, [searchQuery, activeTab]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      let response;
      
      if (activeTab === 'all') {
        response = await searchAPI.globalSearch({ q: searchQuery });
        setResults(response.data);
      } else if (activeTab === 'users') {
        response = await searchAPI.searchUsers({ q: searchQuery });
        setResults({ ...results, users: response.data.users });
      } else if (activeTab === 'posts') {
        response = await searchAPI.searchPosts({ q: searchQuery });
        setResults({ ...results, posts: response.data.posts });
      } else if (activeTab === 'clips') {
        response = await searchAPI.searchClips({ q: searchQuery });
        setResults({ ...results, clips: response.data.clips });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch();
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleClose = () => {
    setSearchQuery('');
    setResults({ users: [], posts: [], clips: [] });
    onClose();
  };

  const getTotalResults = () => {
    if (activeTab === 'all') {
      return results.users.length + results.posts.length + results.clips.length;
    } else if (activeTab === 'users') {
      return results.users.length;
    } else if (activeTab === 'posts') {
      return results.posts.length;
    } else if (activeTab === 'clips') {
      return results.clips.length;
    }
    return 0;
  };

  const UserCard = ({ user }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3">
        <img
          src={user.avatar || 'https://via.placeholder.com/48x48/6b7280/ffffff?text=U'}
          alt={user.username}
          className="w-12 h-12 rounded-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/48x48/6b7280/ffffff?text=U';
          }}
        />
        <div className="flex-1 min-w-0">
          <Link
            to={`/user/${user._id}`}
            className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block"
            onClick={handleClose}
          >
            {user.firstName} {user.lastName}
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
          {user.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{user.bio}</p>
          )}
        </div>
        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
          <div>{user.followerCount || 0} followers</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleClose}
        />
      )}
      
      {/* Slide-out panel */}
      <div 
        data-search-slideout
        className={`fixed top-0 left-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Search</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search users, posts, clips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </form>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {searchQuery.trim() ? (
            <>
              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 mx-4 mt-4 rounded-lg">
                <button
                  onClick={() => handleTabChange('all')}
                  className={`flex items-center space-x-2 flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'all'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <FiSearch className="w-3 h-3" />
                  <span>All ({getTotalResults()})</span>
                </button>
                <button
                  onClick={() => handleTabChange('users')}
                  className={`flex items-center space-x-2 flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'users'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <FiUsers className="w-3 h-3" />
                  <span>Users ({results.users.length})</span>
                </button>
                <button
                  onClick={() => handleTabChange('posts')}
                  className={`flex items-center space-x-2 flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'posts'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <FiFileText className="w-3 h-3" />
                  <span>Posts ({results.posts.length})</span>
                </button>
                <button
                  onClick={() => handleTabChange('clips')}
                  className={`flex items-center space-x-2 flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'clips'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <FiVideo className="w-3 h-3" />
                  <span>Clips ({results.clips.length})</span>
                </button>
              </div>

              {/* Results */}
              <div className="p-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeTab === 'all' && (
                      <>
                        {/* Users */}
                        {results.users.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Users</h3>
                            <div className="space-y-3">
                              {results.users.slice(0, 3).map((user) => (
                                <UserCard key={user._id} user={user} />
                              ))}
                              {results.users.length > 3 && (
                                <Link
                                  to={`/search?q=${encodeURIComponent(searchQuery)}&tab=users`}
                                  onClick={handleClose}
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  View all {results.users.length} users
                                </Link>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Posts */}
                        {results.posts.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Posts</h3>
                            <div className="space-y-3">
                              {results.posts.slice(0, 2).map((post) => (
                                <div key={post._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                  <PostCard post={post} compact />
                                </div>
                              ))}
                              {results.posts.length > 2 && (
                                <Link
                                  to={`/search?q=${encodeURIComponent(searchQuery)}&tab=posts`}
                                  onClick={handleClose}
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  View all {results.posts.length} posts
                                </Link>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Clips */}
                        {results.clips.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">AFEXClips</h3>
                            <div className="grid grid-cols-2 gap-3">
                              {results.clips.slice(0, 4).map((clip) => (
                                <ClipCard key={clip._id} clip={clip} compact />
                              ))}
                            </div>
                            {results.clips.length > 4 && (
                              <Link
                                to={`/search?q=${encodeURIComponent(searchQuery)}&tab=clips`}
                                onClick={handleClose}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 block"
                              >
                                View all {results.clips.length} clips
                              </Link>
                            )}
                          </div>
                        )}

                        {getTotalResults() === 0 && (
                          <div className="text-center py-8">
                            <FiSearch className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No results found</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Try adjusting your search terms</p>
                          </div>
                        )}
                      </>
                    )}

                    {activeTab === 'users' && (
                      <div className="space-y-3">
                        {results.users.length > 0 ? (
                          results.users.map((user) => (
                            <UserCard key={user._id} user={user} />
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No users found</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Try different search terms</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'posts' && (
                      <div className="space-y-3">
                        {results.posts.length > 0 ? (
                          results.posts.map((post) => (
                            <div key={post._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                              <PostCard post={post} compact />
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No posts found</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Try different search terms</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'clips' && (
                      <div>
                        {results.clips.length > 0 ? (
                          <div className="grid grid-cols-2 gap-3">
                            {results.clips.map((clip) => (
                              <ClipCard key={clip._id} clip={clip} compact />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <FiVideo className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No clips found</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Try different search terms</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <FiSearch className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Start searching</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Search for users, posts, or AFEXClips</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchSlideOut; 