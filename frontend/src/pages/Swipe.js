import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { swipeAPI } from '../services/api';
import SwipeCard from '../components/swipe/SwipeCard';
import DefaultAvatar from '../components/DefaultAvatar';
import { getAvatarUrl } from '../utils/avatarUtils';
import { FiRefreshCw, FiTrendingUp, FiBarChart2, FiAward, FiHeart, FiX } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';

const Swipe = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPost, setCurrentPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalVotes: 0, hotVotes: 0, notVotes: 0 });
  const [leaderboard, setLeaderboard] = useState({ topPosts: [], topVoters: [] });
  const [activeTab, setActiveTab] = useState('game');
  const [noMorePosts, setNoMorePosts] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const fetchRandomPost = async () => {
    try {
      setLoading(true);
      setNoMorePosts(false);
      const response = await swipeAPI.getRandomPost();
      const postData = response.data.post || response.data;
      
      if (!postData) {
        setNoMorePosts(true);
        setCurrentPost(null);
        return;
      }
      
      setCurrentPost(postData);
    } catch (error) {
      console.error('Error fetching random post:', error);
      if (error.response?.status === 404) {
        setNoMorePosts(true);
        setCurrentPost(null);
      } else {
        console.error('Failed to load post. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await swipeAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await swipeAPI.getLeaderboard();
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRandomPost();
      fetchStats();
      fetchLeaderboard();
    }
  }, [user]);

  const handleVote = async (voteType, post) => {
    if (!user) {
      console.error('Please log in to vote');
      return;
    }

    if (isVoting) return;

    try {
      setIsVoting(true);
      
      // Send vote to backend
      await swipeAPI.vote(post._id, voteType);
      
      // Show success message
      console.log(voteType === 'hot' ? '🔥 Hot vote recorded!' : '👎 Not vote recorded!');
      
      // Update stats immediately for better UX
      setStats(prev => ({
        ...prev,
        totalVotes: prev.totalVotes + 1,
        [voteType === 'hot' ? 'hotVotes' : 'notVotes']: prev[voteType === 'hot' ? 'hotVotes' : 'notVotes'] + 1
      }));
      
      // Fetch fresh stats
      fetchStats();
      
      // Move to next post
      setTimeout(() => {
        handleNext();
      }, 1000);
      
    } catch (error) {
      console.error('Error voting:', error);
      console.error('Failed to record vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleNext = () => {
    fetchRandomPost();
  };

  const handleSubmitToSwipe = () => {
    navigate('/create-post?for=swipe');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Loading next post...</p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Finding something hot for you 🔥</p>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="text-8xl mb-6">🎉</div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        You've seen all posts!
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
        Submit your own post to keep the game going and see how hot you are! 🔥
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={fetchRandomPost}
          className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <button
          onClick={handleSubmitToSwipe}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-colors flex items-center gap-2"
        >
          <FaFire className="w-4 h-4" />
          Submit Your Post
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                🔥 Hot or Not
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Swipe to vote on posts and discover what's trending
              </p>
            </div>
            <button
              onClick={handleSubmitToSwipe}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <FaFire className="w-5 h-5" />
              Submit to Swipe
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-2">
            <button
              onClick={() => setActiveTab('game')}
              className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'game'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-lg transform scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FiTrendingUp className="w-4 h-4" />
              Game
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'stats'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-lg transform scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FiBarChart2 className="w-4 h-4" />
              Stats
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'leaderboard'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-lg transform scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FiAward className="w-4 h-4" />
              Leaderboard
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'game' && (
          <div className="space-y-6">
            {loading ? (
              <LoadingSpinner />
            ) : noMorePosts ? (
              <EmptyState />
            ) : currentPost ? (
              <div className="max-w-md mx-auto">
                <SwipeCard
                  post={currentPost}
                  onVote={handleVote}
                  onNext={handleNext}
                />
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                <FiBarChart2 className="w-6 h-6 text-blue-500" />
                Your Voting Stats
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-700">
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {stats.totalVotes}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    Total Votes
                  </div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-700">
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {stats.hotVotes}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 font-medium">
                    🔥 Hot Votes
                  </div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-700">
                  <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">
                    {stats.notVotes}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300 font-medium">
                    👎 Not Votes
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-8">
            {/* Top Posts */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 flex items-center gap-3">
                <FaFire className="w-6 h-6 text-orange-500" />
                Hottest Posts
              </h2>
              {leaderboard.topPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    No posts have been voted on yet. Be the first to vote!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.topPosts.map((post, index) => (
                    <div key={post._id} className="flex items-center gap-4 p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                          'bg-gradient-to-r from-blue-400 to-blue-600'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                        {post.mediaUrl ? (
                          <img
                            src={post.mediaUrl}
                            alt="Post"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl" style={{ display: post.mediaUrl ? 'none' : 'flex' }}>
                          📷
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {post.userId?.avatar ? (
                            <img
                              src={getAvatarUrl(post.userId.avatar)}
                              alt={post.userId.username}
                              className="w-6 h-6 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <DefaultAvatar 
                            username={post.userId?.username} 
                            size={24}
                            style={{ display: post.userId?.avatar ? 'none' : 'block' }}
                          />
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {post.userId?.username || 'Unknown User'}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {formatTime(post.createdAt)}
                        </p>
                        {post.content && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {post.content}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          🔥 {post.score || 0}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          hot votes
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Voters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 flex items-center gap-3">
                <FiAward className="w-6 h-6 text-yellow-500" />
                Top Voters
              </h2>
              {leaderboard.topVoters.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏆</div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    No voting activity yet. Start voting to see the leaderboard!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.topVoters.map((voter, index) => (
                    <div key={voter._id} className="flex items-center gap-4 p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                          'bg-gradient-to-r from-blue-400 to-blue-600'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {voter.avatar ? (
                          <img
                            src={getAvatarUrl(voter.avatar)}
                            alt={voter.username}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <DefaultAvatar 
                          username={voter.username} 
                          size={48}
                          style={{ display: voter.avatar ? 'none' : 'block' }}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                          {voter.username || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{voter.username}
                        </p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {voter.voteCount} votes
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {voter.hotVotes} 🔥 hot
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Swipe; 