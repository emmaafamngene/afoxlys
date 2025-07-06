import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import SwipeCard from '../components/swipe/SwipeCard';

const Swipe = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPost, setCurrentPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalVotes: 0, hotVotes: 0, notVotes: 0 });
  const [leaderboard, setLeaderboard] = useState({ topPosts: [], topVoters: [] });
  const [activeTab, setActiveTab] = useState('game');
  const [noMorePosts, setNoMorePosts] = useState(false);

  const fetchRandomPost = async () => {
    try {
      setLoading(true);
      const response = await api.get('/swipe/post');
      setCurrentPost(response.data);
      setNoMorePosts(false);
    } catch (error) {
      if (error.response?.status === 404) {
        setNoMorePosts(true);
        setCurrentPost(null);
      } else {
        console.error('Error fetching random post:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/swipe/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/swipe/leaderboard');
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  useEffect(() => {
    fetchRandomPost();
    fetchStats();
    fetchLeaderboard();
  }, []);

  const handleVote = async (voteType, post) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      // Send vote to backend
      await api.post('/swipe/vote', {
        postId: post._id,
        voteType: voteType
      });

      // Update stats immediately for better UX
      setStats(prev => ({
        ...prev,
        totalVotes: prev.totalVotes + 1,
        [voteType === 'hot' ? 'hotVotes' : 'notVotes']: prev[voteType === 'hot' ? 'hotVotes' : 'notVotes'] + 1
      }));
      
      // Fetch fresh stats
      fetchStats();
      
      // Move to next post
      handleNext();
    } catch (error) {
      console.error('Error voting:', error);
      // Revert stats if vote failed
      setStats(prev => ({
        ...prev,
        totalVotes: prev.totalVotes - 1,
        [voteType === 'hot' ? 'hotVotes' : 'notVotes']: prev[voteType === 'hot' ? 'hotVotes' : 'notVotes'] - 1
      }));
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                🔥 Hot or Not
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Swipe to vote on posts
              </p>
            </div>
            <button
              onClick={handleSubmitToSwipe}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>📤</span>
              Submit to Swipe
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('game')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'game'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              🎮 Game
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              📊 Stats
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'leaderboard'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              🏆 Leaderboard
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'game' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading next post...</p>
              </div>
            ) : noMorePosts ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                  You've seen all posts!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Submit your own post to keep the game going!
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={fetchRandomPost}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={handleSubmitToSwipe}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Submit Your Post
                  </button>
                </div>
              </div>
            ) : currentPost ? (
              <SwipeCard
                post={currentPost}
                onVote={handleVote}
                onNext={handleNext}
              />
            ) : null}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Your Voting Stats
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.totalVotes}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Votes
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {stats.hotVotes}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    🔥 Hot Votes
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {stats.notVotes}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    👎 Not Votes
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            {/* Top Posts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                🔥 Hottest Posts
              </h2>
              {leaderboard.topPosts.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                  No posts have been voted on yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.topPosts.map((post, index) => (
                    <div key={post._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                        #{index + 1}
                      </div>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600">
                        {post.mediaUrl ? (
                          <img
                            src={post.mediaUrl}
                            alt="Post"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            📷
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {post.userId?.firstName || post.userId?.username || 'Anonymous'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTime(post.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                          🔥 {post.score || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Voters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                👆 Top Voters
              </h2>
              {leaderboard.topVoters.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                  No voting activity yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.topVoters.map((voter, index) => (
                    <div key={voter._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                        #{index + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                        {voter.avatar ? (
                          <img
                            src={voter.avatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            👤
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {voter.firstName || voter.username}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {voter.voteCount} votes
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {voter.hotVotes} 🔥
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