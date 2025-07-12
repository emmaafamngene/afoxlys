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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img
            src={user.avatar || 'https://via.placeholder.com/48x48/6b7280/ffffff?text=U'}
            alt={user.username}
            className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-md"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/48x48/6b7280/ffffff?text=U';
            }}
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
        </div>
        <div className="flex-1 min-w-0">
          <Link
            to={`/user/${user._id}`}
            className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block transition-colors"
            onClick={handleClose}
          >
            {user.firstName} {user.lastName}
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
          {user.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{user.bio}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900 dark:text-white">{user.followerCount || 0}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">followers</div>
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
        className={`fixed top-0 left-0 h-full w-full max-w-md bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <FiSearch className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Search AFEX</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 hover:scale-110"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 bg-white dark:bg-gray-800 shadow-sm">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search users, posts, clips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 text-base"
              />
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </form>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900" style={{ height: 'calc(100vh - 200px)' }}>
          {searchQuery.trim() ? (
            <>
              {/* Tabs */}
              <div className="flex space-x-2 bg-white dark:bg-gray-800 p-2 mx-6 mt-6 rounded-xl shadow-sm">
                <button
                  onClick={() => handleTabChange('all')}
                  className={`flex items-center space-x-2 flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'all'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FiSearch className="w-4 h-4" />
                  <span>All ({getTotalResults()})</span>
                </button>
                <button
                  onClick={() => handleTabChange('users')}
                  className={`flex items-center space-x-2 flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'users'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FiUsers className="w-4 h-4" />
                  <span>Users ({results.users.length})</span>
                </button>
                <button
                  onClick={() => handleTabChange('posts')}
                  className={`flex items-center space-x-2 flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'posts'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FiFileText className="w-4 h-4" />
                  <span>Posts ({results.posts.length})</span>
                </button>
                <button
                  onClick={() => handleTabChange('clips')}
                  className={`flex items-center space-x-2 flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'clips'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FiVideo className="w-4 h-4" />
                  <span>Clips ({results.clips.length})</span>
                </button>
              </div>

              {/* Results */}
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeTab === 'all' && (
                      <>
                        {/* Users */}
                        {results.users.length > 0 && (
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                              <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              <span>Users</span>
                            </h3>
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
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                              <FiFileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              <span>Posts</span>
                            </h3>
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
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                              <FiVideo className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              <span>AFEXClips</span>
                            </h3>
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
                          <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full mx-auto mb-6 flex items-center justify-center">
                              <FiSearch className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No results found</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search terms</p>
                            <div className="text-sm text-gray-500 dark:text-gray-500">
                              Search for users, posts, or AFEXClips
                            </div>
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
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full mx-auto mb-8 flex items-center justify-center">
                <FiSearch className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Start searching</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Search for users, posts, or AFEXClips</p>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                Type in the search box above to get started
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchSlideOut; 