import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ConfessionCard from '../components/confessions/ConfessionCard';
import NewConfessionModal from '../components/confessions/NewConfessionModal';

const Confessions = () => {
  const { user } = useAuth();
  const [confessions, setConfessions] = useState([]);
  const [trendingConfessions, setTrendingConfessions] = useState([]);
  const [activeTab, setActiveTab] = useState('recent');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchConfessions = async (pageNum = 1, trending = false) => {
    try {
      const response = await api.get('/confessions', {
        params: {
          page: pageNum,
          limit: 10,
          trending: trending
        }
      });
      
      if (trending) {
        setTrendingConfessions(response.data.confessions);
      } else {
        if (pageNum === 1) {
          setConfessions(response.data.confessions);
        } else {
          setConfessions(prev => [...prev, ...response.data.confessions]);
        }
        setHasMore(response.data.currentPage < response.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching confessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfessions(1, activeTab === 'trending');
  }, [activeTab]);

  const handleConfessionPosted = (newConfession) => {
    setConfessions(prev => [newConfession, ...prev]);
  };

  const handleConfessionUpdate = (updatedConfession) => {
    setConfessions(prev => 
      prev.map(conf => 
        conf._id === updatedConfession._id ? updatedConfession : conf
      )
    );
    setTrendingConfessions(prev => 
      prev.map(conf => 
        conf._id === updatedConfession._id ? updatedConfession : conf
      )
    );
  };

  const loadMore = () => {
    if (activeTab === 'recent' && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchConfessions(nextPage, false);
    }
  };

  const currentConfessions = activeTab === 'trending' ? trendingConfessions : confessions;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Confession Box
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Share your thoughts anonymously
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>✍️</span>
              Write Confession
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'recent'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'trending'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              🔥 Trending
            </button>
          </div>
        </div>

        {/* Confessions List */}
        <div className="space-y-4">
          {loading && activeTab === 'recent' ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading confessions...</p>
            </div>
          ) : currentConfessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">😶</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No confessions yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {activeTab === 'trending' 
                  ? 'No trending confessions at the moment' 
                  : 'Be the first to share a confession!'
                }
              </p>
              {activeTab === 'recent' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Write First Confession
                </button>
              )}
            </div>
          ) : (
            <>
              {currentConfessions.map((confession) => (
                <ConfessionCard
                  key={confession._id}
                  confession={confession}
                  onUpdate={handleConfessionUpdate}
                />
              ))}
              
              {activeTab === 'recent' && hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={loadMore}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* New Confession Modal */}
      <NewConfessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfessionPosted={handleConfessionPosted}
      />
    </div>
  );
};

export default Confessions; 