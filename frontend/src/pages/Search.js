import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { searchAPI } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import PostCard from '../components/posts/PostCard';
import ClipCard from '../components/clips/ClipCard';
import { FiSearch, FiUsers, FiFileText, FiVideo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Search = () => {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState('all');
  
  usePageTitle(searchQuery ? `Search: ${searchQuery}` : 'Search');
  const [results, setResults] = useState({
    users: [],
    posts: [],
    clips: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
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
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
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
    <div className="card p-4">
      <div className="flex items-center space-x-3">
        <img
          src={user.avatar || 'https://via.placeholder.com/48x48/6b7280/ffffff?text=U'}
          alt={user.username}
          className="w-12 h-12 rounded-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/48x48/6b7280/ffffff?text=U';
          }}
        />
        <div className="flex-1">
          <Link
            to={`/user/${user._id}`}
            className="font-medium text-gray-900 hover:text-primary-600"
          >
            {user.firstName} {user.lastName}
          </Link>
          <p className="text-sm text-gray-500">@{user.username}</p>
          {user.bio && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{user.bio}</p>
          )}
        </div>
        <div className="text-right text-sm text-gray-500">
          <div>{user.followerCount || 0} followers</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Search</h1>
        
        <form onSubmit={handleSearch} className="max-w-2xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users, posts, clips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </form>
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <>
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => handleTabChange('all')}
              className={`flex items-center space-x-2 flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiSearch className="w-4 h-4" />
              <span>All ({getTotalResults()})</span>
            </button>
            <button
              onClick={() => handleTabChange('users')}
              className={`flex items-center space-x-2 flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiUsers className="w-4 h-4" />
              <span>Users ({results.users.length})</span>
            </button>
            <button
              onClick={() => handleTabChange('posts')}
              className={`flex items-center space-x-2 flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiFileText className="w-4 h-4" />
              <span>Posts ({results.posts.length})</span>
            </button>
            <button
              onClick={() => handleTabChange('clips')}
              className={`flex items-center space-x-2 flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'clips'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiVideo className="w-4 h-4" />
              <span>Clips ({results.clips.length})</span>
            </button>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div>
              {activeTab === 'all' && (
                <div className="space-y-8">
                  {/* Users */}
                  {results.users.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Users</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.users.map((user) => (
                          <UserCard key={user._id} user={user} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Posts */}
                  {results.posts.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Posts</h2>
                      <div className="space-y-6">
                        {results.posts.map((post) => (
                          <PostCard key={post._id} post={post} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clips */}
                  {results.clips.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">AFEXClips</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.clips.map((clip) => (
                          <ClipCard key={clip._id} clip={clip} />
                        ))}
                      </div>
                    </div>
                  )}

                  {getTotalResults() === 0 && (
                    <div className="text-center py-12">
                      <FiSearch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                      <p className="text-gray-600">Try adjusting your search terms</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div>
                  {results.users.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.users.map((user) => (
                        <UserCard key={user._id} user={user} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                      <p className="text-gray-600">Try different search terms</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'posts' && (
                <div>
                  {results.posts.length > 0 ? (
                    <div className="space-y-6">
                      {results.posts.map((post) => (
                        <PostCard key={post._id} post={post} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FiFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                      <p className="text-gray-600">Try different search terms</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'clips' && (
                <div>
                  {results.clips.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.clips.map((clip) => (
                        <ClipCard key={clip._id} clip={clip} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FiVideo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No clips found</h3>
                      <p className="text-gray-600">Try different search terms</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!searchQuery.trim() && (
        <div className="text-center py-12">
          <FiSearch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
          <p className="text-gray-600">Search for users, posts, or AFEXClips</p>
        </div>
      )}
    </div>
  );
};

export default Search; 