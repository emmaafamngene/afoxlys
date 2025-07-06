import React, { useState, useEffect } from 'react';
import { FiAward, FiUsers, FiTrendingUp, FiStar, FiZap } from 'react-icons/fi';
import { getAvatarUrl } from '../utils/avatarUtils';
import { DefaultAvatar } from '../components/layout/AFEXLogo';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://afoxlys.onrender.com/api';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('xp');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy, page]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/leaderboard?type=${sortBy}&page=${page}&limit=20`);
      const data = await response.json();
      
      setUsers(data.users);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return (
      <div className="flex items-center space-x-2 animate-bounce">
        <FiAward className="w-6 h-6 text-yellow-500 animate-pulse" />
        <span className="text-lg font-bold text-yellow-500 animate-pulse">#{rank}</span>
        <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-20 animate-ping"></div>
      </div>
    );
    if (rank === 2) return (
      <div className="flex items-center space-x-2">
        <FiAward className="w-5 h-5 text-gray-400 animate-pulse" />
        <span className="text-base font-bold text-gray-400">#{rank}</span>
      </div>
    );
    if (rank === 3) return (
      <div className="flex items-center space-x-2">
        <FiAward className="w-5 h-5 text-orange-500 animate-pulse" />
        <span className="text-base font-bold text-orange-500">#{rank}</span>
      </div>
    );
    return <span className="text-sm font-bold text-gray-500 hover:scale-110 transition-transform duration-200">#{rank}</span>;
  };

  const getLevelColor = (level) => {
    if (level >= 20) return 'text-purple-600';
    if (level >= 15) return 'text-blue-600';
    if (level >= 10) return 'text-green-600';
    if (level >= 5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            {/* Animated loading spinner */}
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-gray-700 mx-auto"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 absolute top-0 left-1/2 transform -translate-x-1/2"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <FiAward className="w-6 h-6 text-blue-600 animate-pulse" />
              </div>
            </div>
            
            {/* Loading text with typing animation */}
            <div className="mt-6">
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium animate-pulse">
                Loading leaderboard
                <span className="animate-ping">.</span>
                <span className="animate-ping" style={{ animationDelay: '0.2s' }}>.</span>
                <span className="animate-ping" style={{ animationDelay: '0.4s' }}>.</span>
              </p>
            </div>
            
            {/* Floating elements */}
            <div className="mt-8 relative">
              <div className="absolute left-1/4 top-0 animate-bounce">
                <FiStar className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="absolute right-1/4 top-4 animate-bounce" style={{ animationDelay: '1s' }}>
                <FiAward className="w-4 h-4 text-purple-400" />
              </div>
              <div className="absolute left-1/3 top-8 animate-bounce" style={{ animationDelay: '2s' }}>
                <FiZap className="w-4 h-4 text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 relative">
          {/* Floating elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
              <FiStar className="w-6 h-6 text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div className="absolute top-4 right-1/4 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}>
              <FiAward className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            <div className="absolute top-8 left-1/3 animate-bounce" style={{ animationDelay: '2s', animationDuration: '3s' }}>
              <FiZap className="w-4 h-4 text-blue-400 animate-ping" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 animate-pulse bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
            🏆 Leaderboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 animate-fade-in">
            Top performers on AFEX
          </p>
          
          {/* Animated underline */}
          <div className="mt-4 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse"></div>
        </div>

        {/* Sort Options */}
        <div className="flex justify-center mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-1 shadow-lg animate-pulse">
            <button
              onClick={() => setSortBy('xp')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                sortBy === 'xp'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg animate-pulse'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FiTrendingUp className={`inline w-4 h-4 mr-2 ${sortBy === 'xp' ? 'animate-bounce' : ''}`} />
              By XP
            </button>
            <button
              onClick={() => setSortBy('level')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                sortBy === 'level'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg animate-pulse'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FiUsers className={`inline w-4 h-4 mr-2 ${sortBy === 'level' ? 'animate-bounce' : ''}`} />
              By Level
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {users.length === 0 ? (
            <div className="p-8 text-center">
              <div className="relative">
                <FiAward className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-bounce" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 border-2 border-gray-300 rounded-full animate-ping opacity-20"></div>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium animate-pulse">No leaderboard data available</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Check back later for updates!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    XP
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Streak
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user, index) => (
                  <tr 
                    key={user._id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-500 transform hover:scale-[1.02] hover:shadow-lg animate-fade-in-up ${
                      (index + 1) === 1 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 animate-pulse' :
                      (index + 1) === 2 ? 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/20 dark:to-slate-800/20' :
                      (index + 1) === 3 ? 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20' :
                      ''
                    }`}
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      animationDuration: '800ms'
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRankIcon(user.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 relative group">
                          {user.avatar ? (
                            <img
                              className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
                              src={getAvatarUrl(user.avatar)}
                              alt={user.displayName || user.username}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${user.avatar ? 'hidden' : 'flex'}`}>
                            <DefaultAvatar username={user.username} size={48} />
                          </div>
                          {/* Rank badge overlay for top 3 */}
                          {(index + 1) <= 3 && (
                            <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white animate-bounce ${
                              (index + 1) === 1 ? 'bg-yellow-500 shadow-lg' :
                              (index + 1) === 2 ? 'bg-gray-400 shadow-lg' :
                              'bg-orange-500 shadow-lg'
                            }`}>
                              {index + 1}
                            </div>
                          )}
                          {/* Hover glow effect */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {user.displayName || user.firstName || user.username}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${
                          (user.level || 1) >= 20 ? 'from-purple-500 to-pink-500' :
                          (user.level || 1) >= 15 ? 'from-blue-500 to-purple-500' :
                          (user.level || 1) >= 10 ? 'from-green-500 to-blue-500' :
                          (user.level || 1) >= 5 ? 'from-yellow-500 to-orange-500' :
                          'from-gray-500 to-gray-600'
                        } text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-pulse`}>
                          <span className="text-sm font-bold animate-bounce">⭐</span>
                          <span className="text-sm font-semibold">Level {user.level || 1}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900 dark:text-white font-medium">
                          {(user.xp || 0).toLocaleString()} XP
                        </div>
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000 animate-pulse"
                            style={{ 
                              width: `${Math.min(100, ((user.xp || 0) % 100) / 100 * 100)}%`,
                              animationDelay: `${index * 200}ms`
                            }}
                          >
                            <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-ping"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.loginStreak || 0} days
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 animate-fade-in">
            <div className="flex space-x-3">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-6 py-3 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                ← Previous
              </button>
              <div className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700 animate-pulse">
                Page {page} of {totalPages}
              </div>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-6 py-3 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard; 