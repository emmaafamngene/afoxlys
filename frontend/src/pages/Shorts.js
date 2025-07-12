import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { shortsAPI } from '../services/api';
import { FiPlay, FiPause, FiPlus } from 'react-icons/fi';
import DefaultAvatar from '../components/DefaultAvatar';
import { getOptimizedAvatarUrl } from '../utils/avatarUtils';

const VideoPlayer = ({ short, isPaused, onToggle, onVideoPlay, onVideoInView }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onVideoInView(short._id);
            // Play the video when it comes into view (only if not manually paused)
            if (videoRef.current && !isPaused) {
              videoRef.current.play();
            }
          } else {
            // Pause the video when it goes out of view
            if (videoRef.current) {
              videoRef.current.pause();
            }
          }
        });
      },
      {
        threshold: 0.7, // Video is considered "in view" when 70% visible
        rootMargin: '-10% 0px -10% 0px' // Trigger when video is in center 80% of viewport
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [short._id, onVideoInView, isPaused]);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPaused) {
        // Pause all other videos first
        onVideoPlay(short._id);
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
      onToggle(short._id);
    }
  };

  // Handle manual play/pause that overrides auto-play
  const handleManualToggle = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        onVideoPlay(short._id);
      } else {
        videoRef.current.pause();
      }
      onToggle(short._id);
    }
  };

  const handleUserClick = (e) => {
    e.stopPropagation(); // Prevent video from playing/pausing
    if (short.author?._id) {
      navigate(`/user/${short.author._id}`);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      const progressPercent = (currentTime / duration) * 100;
      setProgress(progressPercent);
    }
  };

  const handleProgressClick = (e) => {
    if (videoRef.current) {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const progressBarWidth = rect.width;
      const clickPercent = (clickX / progressBarWidth) * 100;
      
      const duration = videoRef.current.duration;
      const newTime = (clickPercent / 100) * duration;
      videoRef.current.currentTime = newTime;
      setProgress(clickPercent);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative bg-black rounded-2xl overflow-hidden shadow-2xl cursor-pointer" 
      style={{ width: '363.938px', height: '647px' }}
      onClick={handleManualToggle}
    >
      {short.type === 'video' ? (
        <video
          ref={videoRef}
          src={short.mediaUrl}
          className="w-full h-full object-cover"
          loop
          muted
          playsInline
          onTimeUpdate={handleTimeUpdate}
        />
      ) : (
        <img
          src={short.mediaUrl}
          alt={short.caption}
          className="w-full h-full object-cover"
        />
      )}
      
      {/* Play/Pause Overlay */}
      {short.type === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity duration-300">
          <div className={`w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 ${isPaused ? 'opacity-100' : 'opacity-0'}`}>
            {isPaused ? (
              <FiPlay className="w-8 h-8 text-white ml-1" />
            ) : (
              <FiPause className="w-8 h-8 text-white" />
            )}
          </div>
        </div>
      )}
      


      {/* Video Description */}
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <h3 className="text-sm font-medium mb-1 truncate">
          {short.caption}
        </h3>
        <p className="text-xs text-gray-300">
          By @{short.author?.username || 'Unknown'}
        </p>
      </div>

      {/* Custom Video Progress Bar */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 bg-opacity-30 cursor-pointer hover:h-3 hover:bg-opacity-50 transition-all duration-200"
        onClick={handleProgressClick}
      >
        <div 
          className="h-full bg-blue-500 transition-all duration-300 relative" 
          style={{ width: `${progress}%` }}
        >
          {/* Progress indicator dot - only visible on hover */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-md opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
        </div>
      </div>
    </div>
  );
};

const Shorts = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pausedVideos, setPausedVideos] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [currentPlayingVideo, setCurrentPlayingVideo] = useState(null);

  useEffect(() => {
    fetchShorts();
  }, []);

  const fetchShorts = async () => {
    try {
      setLoading(true);
      const response = await shortsAPI.getAll();
      console.log('Shorts response:', response);
      if (response.data && response.data.success) {
        setShorts(response.data.shorts || []);
        console.log('Shorts data:', response.data.shorts);
      } else {
        setShorts([]);
      }
    } catch (error) {
      console.error('Error fetching shorts:', error);
      setShorts([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVideo = (videoId) => {
    setPausedVideos(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  };

  const handleVideoPlay = (playingVideoId) => {
    // Pause all videos except the one being played
    setPausedVideos(prev => {
      const newState = {};
      shorts.forEach(short => {
        newState[short._id] = short._id !== playingVideoId;
      });
      return newState;
    });
    setCurrentPlayingVideo(playingVideoId);
  };

  const handleVideoInView = (videoId) => {
    if (currentPlayingVideo !== videoId) {
      // Pause current video and play the new one
      setPausedVideos(prev => {
        const newState = {};
        shorts.forEach(short => {
          newState[short._id] = short._id !== videoId;
        });
        return newState;
      });
      setCurrentPlayingVideo(videoId);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !caption.trim()) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', selectedFile.type.startsWith('video/') ? 'video' : 'image');

      const response = await shortsAPI.create({
        caption,
        mediaUrl: URL.createObjectURL(selectedFile), // For demo, you'll need to upload to Cloudinary first
        type: selectedFile.type.startsWith('video/') ? 'video' : 'image',
      });

      if (response.data && response.data.success) {
        setShorts(prev => [response.data.short, ...prev]);
        setShowUploadModal(false);
        setSelectedFile(null);
        setCaption('');
        alert('Short uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading short:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 flex items-center justify-center h-screen">
        <div className="text-gray-600 dark:text-gray-400 text-xl">Loading videos...</div>
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 flex items-center justify-center h-screen">
        <div className="text-center text-gray-900 dark:text-white">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-2xl font-bold mb-2">No Videos Yet</h2>
          <p className="text-gray-600 dark:text-gray-400">No videos available to play.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* Post Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowUploadModal(true)}
          className="group relative w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 hover:scale-110"
        >
          <div className="absolute inset-0 bg-white/10 rounded-2xl"></div>
          <FiPlus className="w-8 h-8 text-white group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Scrollable Video Feed */}
      <div className="flex flex-col items-center p-4 space-y-8 pt-20">
        {shorts.map((short, index) => {
          const isPaused = pausedVideos[short._id];

          return (
            <div key={short._id} className="relative flex items-center space-x-4">
              {/* Video Player */}
              <VideoPlayer 
                short={short} 
                isPaused={isPaused}
                onToggle={toggleVideo}
                onVideoPlay={handleVideoPlay}
                onVideoInView={handleVideoInView}
              />

              {/* User Avatar - Outside Video */}
              <div className="flex flex-col items-center space-y-2">
                <button
                  onClick={() => {
                    if (currentUser?._id) {
                      navigate(`/user/${currentUser._id}`);
                    }
                  }}
                  className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer bg-gray-100 dark:bg-gray-800"
                >
                  {currentUser?.avatar ? (
                    <img
                      src={getOptimizedAvatarUrl(currentUser.avatar, 56)}
                      alt={currentUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <DefaultAvatar username={currentUser?.username || 'You'} />
                  )}
                </button>
                <div className="w-1 h-8 bg-gradient-to-b from-gray-400 to-transparent rounded-full"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400 text-center max-w-16 truncate">
                  {currentUser?.username || 'You'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-lg mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiPlus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Your Short</h2>
              <p className="text-gray-600 dark:text-gray-400">Share your moment with the world</p>
            </div>
            
            <div className="space-y-6">
              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Choose Media</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <FiPlus className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      {selectedFile ? selectedFile.name : 'Click to select video or image'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      MP4, MOV, JPG, PNG up to 100MB
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Caption Input */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="What's on your mind? Share your story..."
                  className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-2xl resize-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  rows="4"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || !caption.trim() || uploading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/25"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Uploading...
                    </div>
                  ) : (
                    'Create Short'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shorts; 