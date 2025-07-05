import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clipsAPI, likesAPI } from '../services/api';
import { 
  FiVideo, FiPlus, FiHeart, FiMessageCircle, FiShare, FiPlay, 
  FiBookmark, FiVolume2, FiVolumeX, FiX 
} from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { DefaultAvatar } from '../components/layout/AFEXLogo';

const dummyComments = [
  {
    id: 1,
    avatar: "/avatars/user1.jpg",
    username: "Daisy7",
    time: "5-21",
    text: "Weti bi this rubbish?",
    likes: 1679,
    replies: 73,
  },
  {
    id: 2,
    avatar: "/avatars/user2.jpg",
    username: "berospam0",
    time: "5-21",
    text: "wtf did I just watch...",
    likes: 5835,
    replies: 23,
  },
  // ...add more comments as needed
];

const AFEXClips = () => {
  const { isAuthenticated, user } = useAuth();
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [playingClips, setPlayingClips] = useState({});
  const [mutedClips, setMutedClips] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [selectedClipForComments, setSelectedClipForComments] = useState(null);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const [commentInput, setCommentInput] = useState("");
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false);

  useEffect(() => {
    fetchClips();
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check dark mode
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    
    checkMobile();
    checkDarkMode();
    window.addEventListener('resize', checkMobile);
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      observer.disconnect();
    };
  }, [selectedCategory]);

  useEffect(() => {
    // Auto-play the current clip when it comes into view (only if user has interacted)
    if (clips[currentClipIndex] && videoRefs.current[currentClipIndex] && userHasInteracted) {
      videoRefs.current[currentClipIndex].play().catch(err => {
        console.log('Autoplay prevented:', err);
      });
      setPlayingClips(prev => ({ ...prev, [currentClipIndex]: true }));
      setMutedClips(prev => ({ ...prev, [currentClipIndex]: true })); // Start muted like TikTok
      
      // Pause all other videos
      Object.keys(videoRefs.current).forEach(index => {
        if (parseInt(index) !== currentClipIndex && videoRefs.current[index]) {
          videoRefs.current[index].pause();
        }
      });
    }
  }, [currentClipIndex, clips, userHasInteracted]);

  const fetchClips = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const params = {
        page: pageNum,
        limit: 10,
        ...(selectedCategory !== 'all' && { category: selectedCategory })
      };
      
      const response = await clipsAPI.getAll(params);
      
      if (pageNum === 1) {
        setClips(response.data.clips);
        setCurrentClipIndex(0);
      } else {
        setClips(prev => [...prev, ...response.data.clips]);
      }
      
      setHasMore(response.data.pagination.hasNext);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching clips:', error);
      toast.error('Failed to load clips');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchClips(page + 1);
    }
  };

  const handleScroll = (e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const clipHeight = containerHeight;
    
    const newIndex = Math.round(scrollTop / clipHeight);
    if (newIndex !== currentClipIndex && newIndex < clips.length) {
      // Pause the current video
      if (videoRefs.current[currentClipIndex]) {
        videoRefs.current[currentClipIndex].pause();
      }
      
      // Play the new video only if user has interacted
      if (videoRefs.current[newIndex] && userHasInteracted) {
        videoRefs.current[newIndex].play().catch(err => {
          console.log('Autoplay prevented:', err);
        });
      }
      
      setCurrentClipIndex(newIndex);
      // Update playing state
      setPlayingClips(prev => {
        const newState = {};
        Object.keys(prev).forEach(key => {
          newState[key] = false;
        });
        newState[newIndex] = userHasInteracted;
        return newState;
      });
    }
  };

  const handleUserInteraction = () => {
    setUserHasInteracted(true);
    // Try to play the current video after user interaction
    if (videoRefs.current[currentClipIndex]) {
      videoRefs.current[currentClipIndex].play().catch(err => {
        console.log('Autoplay prevented:', err);
      });
      setPlayingClips(prev => ({ ...prev, [currentClipIndex]: true }));
    }
  };

  const handleVideoClick = (clipIndex) => {
    setUserHasInteracted(true);
    const video = videoRefs.current[clipIndex];
    if (video) {
      if (video.paused) {
        video.play().catch(err => {
          console.log('Play failed:', err);
        });
        setPlayingClips(prev => ({ ...prev, [clipIndex]: true }));
      } else {
        video.pause();
        setPlayingClips(prev => ({ ...prev, [clipIndex]: false }));
      }
    }
  };

  const handleMuteToggle = (clipIndex, e) => {
    e.stopPropagation();
    setMutedClips(prev => ({
      ...prev,
      [clipIndex]: !prev[clipIndex]
    }));
  };

  const handleLike = async (clip, e) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to like clips');
      return;
    }

    try {
      const response = await likesAPI.toggleClipLike(clip._id);
      setClips(prev => prev.map(c => 
        c._id === clip._id 
          ? { 
              ...c, 
              likes: response.data.liked 
                ? [...(c.likes || []), { _id: user._id }]
                : (c.likes || []).filter(like => like._id !== user._id),
              likeCount: response.data.liked ? (c.likeCount || 0) + 1 : Math.max(0, (c.likeCount || 0) - 1)
            }
          : c
      ));
    } catch (error) {
      toast.error('Failed to like clip');
    }
  };

  const handleShare = (clip, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/clip/${clip._id}`);
    toast.success('Link copied to clipboard!');
  };

  const handleBookmark = (clip, e) => {
    e.stopPropagation();
    toast.success('Added to bookmarks!');
  };

  const handleCommentInputChange = (clipIndex, value) => {
    setCommentInputs(prev => ({
      ...prev,
      [clipIndex]: value
    }));
  };

  const handleCommentSubmit = async (clip, clipIndex, e) => {
    e.preventDefault();
    const commentText = commentInputs[clipIndex]?.trim();
    
    if (!commentText) return;
    
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    try {
      // Here you would call your comment API
      // const response = await commentsAPI.createClipComment(clip._id, { content: commentText });
      
      // For now, just show a success message
      toast.success('Comment posted!');
      
      // Clear the input
      setCommentInputs(prev => ({
        ...prev,
        [clipIndex]: ''
      }));
      
      // Update the comment count (you would get this from the API response)
      setClips(prev => prev.map(c => 
        c._id === clip._id 
          ? { ...c, commentCount: (c.commentCount || 0) + 1 }
          : c
      ));
    } catch (error) {
      toast.error('Failed to post comment');
    }
  };

  const handleCommentButtonClick = (clip, e) => {
    e.stopPropagation();
    setSelectedClipForComments(clip);
    setCommentsPanelOpen(!commentsPanelOpen);
  };

  const closeCommentPanel = () => {
    setCommentsPanelOpen(false);
    setSelectedClipForComments(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mx-auto mb-8">
            <img 
              src={darkMode ? "/logo1.png" : "/logo.png"}
              alt="AFOXLY Logo" 
              className="h-32 w-auto mx-auto"
            />
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Discover amazing short-form videos from creators around the world
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          >
            <FiPlus className="w-5 h-5 mr-2" />
            Join AFOXLY Today
          </Link>
        </div>
      </div>
    );
  }

  if (loading && clips.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading clips...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Video Feed Section */}
      <div className={`flex-1 h-screen overflow-y-auto scroll-smooth snap-y snap-mandatory scrollbar-hide ${commentsPanelOpen ? 'mr-[400px]' : ''}`} onScroll={handleScroll} ref={containerRef}>
        {clips.map((clip, index) => (
          <div key={clip._id} className="h-screen snap-start flex items-center justify-center relative">
            {/* Video */}
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                src={clip.videoUrl}
                className="min-w-[350px] max-w-[400px] h-[80%] rounded-xl object-cover shadow-2xl mx-auto my-auto"
                autoPlay={playingClips[index]}
                loop
                muted={mutedClips[index]}
                controls={false}
                onClick={() => handleVideoClick(index)}
                ref={(el) => {
                  videoRefs.current[index] = el;
                }}
              />
              
              {/* Play Button Overlay for non-interacted videos */}
              {!userHasInteracted && index === currentClipIndex && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer"
                  onClick={handleUserInteraction}
                >
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <FiPlay size={32} className="text-white ml-1" />
                  </div>
                </div>
              )}
              
              {/* Video Controls Overlay - Floating on video */}
              <div className="absolute bottom-4 right-4 flex flex-col items-center space-y-3">
                {/* Mute/Unmute Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserInteraction();
                    handleMuteToggle(index, e);
                  }}
                  className="w-8 h-8 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition-all"
                >
                  {mutedClips[index] ? <FiVolumeX size={14} /> : <FiVolume2 size={14} />}
                </button>
                
                {/* Like Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserInteraction();
                    handleLike(clip, e);
                  }}
                  className="w-8 h-8 bg-black bg-opacity-60 rounded-full flex flex-col items-center justify-center text-white hover:bg-opacity-80 transition-all"
                >
                  {clip.likes?.some(like => like._id === user?._id) ? (
                    <FaHeart className="text-red-500" size={12} />
                  ) : (
                    <FiHeart size={12} />
                  )}
                  <span className="text-xs mt-0.5">{clip.likeCount || 0}</span>
                </button>
                
                {/* Comment Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserInteraction();
                    handleCommentButtonClick(clip, e);
                  }}
                  className={`w-8 h-8 rounded-full flex flex-col items-center justify-center transition-all ${
                    commentsPanelOpen && selectedClipForComments?._id === clip._id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-black bg-opacity-60 text-white hover:bg-opacity-80'
                  }`}
                >
                  <FiMessageCircle size={12} />
                  <span className="text-xs mt-0.5">{clip.commentCount || 0}</span>
                </button>
                
                {/* Share Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserInteraction();
                    handleShare(clip, e);
                  }}
                  className="w-8 h-8 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition-all"
                >
                  <FiShare size={12} />
                </button>
                
                {/* Bookmark Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserInteraction();
                    handleBookmark(clip, e);
                  }}
                  className="w-8 h-8 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition-all"
                >
                  <FiBookmark size={12} />
                </button>
              </div>
              
              {/* Video Info - Floating on video */}
              <div className="absolute bottom-4 left-4 max-w-xs">
                <div className="flex items-center space-x-2 mb-2">
                  <img 
                    src={clip.creator?.avatar || DefaultAvatar} 
                    alt={clip.creator?.username} 
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="text-white font-semibold text-xs">{clip.creator?.username}</p>
                    <p className="text-gray-300 text-xs">{clip.title}</p>
                  </div>
                </div>
                <p className="text-white text-xs mb-1">{clip.description}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300 text-xs">#{clip.category}</span>
                  <span className="text-gray-300 text-xs">•</span>
                  <span className="text-gray-300 text-xs">{new Date(clip.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Load More Indicator */}
        {hasMore && (
          <div className="h-screen snap-start flex items-center justify-center">
            <div className="text-gray-600 text-xl">Loading more clips...</div>
          </div>
        )}
      </div>

      {/* Comments Panel */}
      {commentsPanelOpen && (
        <div className="fixed top-0 right-0 h-screen w-[400px] bg-zinc-900 flex flex-col border-l border-zinc-800 z-30">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-white font-bold text-lg">Comments ({selectedClipForComments?.commentCount || 0})</span>
            <button onClick={closeCommentPanel} className="text-gray-400 hover:text-white">
              <FiX size={20} />
            </button>
          </div>
          {/* Comments List */}
          <div className="flex-1 h-0 overflow-y-auto p-4 space-y-6 pb-20">
            {dummyComments.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                <img src={c.avatar} className="w-8 h-8 rounded-full" alt={c.username} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{c.username}</span>
                    <span className="text-xs text-gray-400">{c.time}</span>
                    <button className="ml-2 text-xs text-blue-400 hover:underline">Reply</button>
                  </div>
                  <p className="text-sm text-gray-300">{c.text}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    <button className="flex items-center gap-1 hover:text-pink-500">
                      <span>❤️</span>
                      <span>{c.likes}</span>
                    </button>
                    <button className="hover:underline">View {c.replies} replies</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Input Bar */}
          <div className="p-4 border-t border-zinc-800 flex items-center bg-zinc-900 w-full">
            <input
              className="flex-1 bg-zinc-800 rounded-full px-4 py-2 text-white text-sm outline-none"
              placeholder="Add a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
            />
            <button className="ml-2 text-blue-500 font-bold">Post</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AFEXClips; 