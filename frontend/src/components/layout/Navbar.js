import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiVideo, FiPlus, FiUser, FiLogOut, FiSettings, FiX, FiMessageCircle, FiBell, FiChevronDown, FiMenu, FiAward } from 'react-icons/fi';
import AFEXLogo, { DefaultAvatar } from './AFEXLogo';
import { getAvatarUrl } from '../../utils/avatarUtils';
import XPBar from '../leveling/XPBar';
import SearchSlideOut from '../SearchSlideOut';

const Navbar = ({ darkMode = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);



  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Handle clicking outside search to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSearchOpen) {
        // Check if click is not on the search slide-out
        const searchSlideOut = document.querySelector('[data-search-slideout]');
        if (searchSlideOut && !searchSlideOut.contains(event.target)) {
          setIsSearchOpen(false);
        }
      }
    };

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  // Listen for custom event to open search from sidebar
  useEffect(() => {
    const handleOpenSearch = () => {
      setIsSearchOpen(true);
    };

    window.addEventListener('openSearchSlideOut', handleOpenSearch);

    return () => {
      window.removeEventListener('openSearchSlideOut', handleOpenSearch);
    };
  }, []);

  const formatDate = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);

    if (diff < 60) {
      return 'Just now';
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)} minutes ago`;
    } else if (diff < 86400) {
      return `${Math.floor(diff / 3600)} hours ago`;
    } else if (diff < 604800) {
      return `${Math.floor(diff / 86400)} days ago`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0">
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-lg sm:rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <span className="text-white font-bold text-lg sm:text-xl">AFEX</span>
            </div>
          </Link>



          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-6">
            {/* Level Display */}
            {user?.level && (
              <div className="group relative">
                <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-pulse">
                  <span className="text-sm font-bold animate-bounce">⭐</span>
                  <span className="text-sm font-bold">Level {user.level}</span>
                  <span className="text-xs opacity-90 bg-white bg-opacity-20 px-2 py-0.5 rounded-full">{(user.xp || 0).toLocaleString()} XP</span>
                </div>
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                  <div className="text-center">
                    <div className="font-semibold">Level {user.level}</div>
                    <div className="text-gray-300">{(user.xp || 0).toLocaleString()} XP</div>
                    <div className="text-gray-400">{(user.loginStreak || 0)} day streak</div>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
            
            {/* Create Post Button - Only on Home */}
            {window.location.pathname === '/' && (
              <Link
                to="/create-post"
                className="p-2.5 sm:p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                title="Create Post"
              >
                <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            )}

            {/* Chat Button */}
            <Link
              to="/chat"
              className="relative p-2.5 sm:p-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg sm:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transform hover:scale-105"
              title="Chat"
            >
              <FiMessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 sm:p-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg sm:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transform hover:scale-105"
                title="Notifications"
              >
                <FiBell className="w-5 h-5 sm:w-6 sm:h-6" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold animate-pulse">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
                  </div>
                  <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                        >
                          <p className="text-sm text-gray-900 dark:text-white">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 sm:p-8 text-center">
                        <FiBell className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No notifications yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tutorial Trigger Button */}
            <button
              onClick={() => {
                localStorage.removeItem('afex_onboarding_complete');
                window.location.reload();
              }}
              className="p-2.5 sm:p-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
              title="Start Tutorial"
            >
              <FiAward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                data-intro-profile
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors transform hover:scale-105"
              >
                {user?.avatar ? (
                  <img
                    src={getAvatarUrl(user.avatar)}
                    alt={user?.username || 'User'}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : (
                  <DefaultAvatar username={user?.username || 'User'} size={40} />
                )}
                <FiChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">@{user?.username}</p>
                    
                    {/* XP Bar */}
                    {user?.level && (
                      <div className="mt-3">
                        <XPBar 
                          xp={user.xp || 0}
                          level={user.level}
                          progress={user.progress || 0}
                          xpForNextLevel={user.xpForNextLevel || 100}
                          xpForCurrentLevel={user.xpForCurrentLevel || 0}
                          className="text-xs"
                        />
                      </div>
                    )}
                  </div>
                  <div className="py-1 sm:py-2">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
                    >
                      <FiUser className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
                    >
                      <FiSettings className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left text-sm sm:text-base"
                    >
                      <FiLogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Level Display */}
            {user?.level && (
              <div className="group relative">
                <div className="flex items-center space-x-1 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 text-white px-2 py-1.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <span className="text-xs font-bold animate-pulse">⭐</span>
                  <span className="text-xs font-bold">Lv.{user.level}</span>
                </div>
                {/* Mobile tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                  <div className="text-center">
                    <div>Level {user.level}</div>
                    <div className="text-gray-300">{(user.xp || 0).toLocaleString()} XP</div>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
            

            
            {/* Hamburger Menu */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isMenuOpen ? (
                <FiX className="w-5 h-5" />
              ) : (
                <FiMenu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">

            {/* Mobile Navigation Items */}
            <div className="py-2">
              <div className="grid grid-cols-2 gap-2 p-4">
                <Link
                  to="/create-post"
                  className="flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiPlus className="w-5 h-5" />
                  <span className="font-medium">Create Post</span>
                </Link>
                <Link
                  to="/create-clip"
                  className="flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiVideo className="w-5 h-5" />
                  <span className="font-medium">Create Clip</span>
                </Link>
              </div>

              <div className="px-4 space-y-1">
                <Link
                  to="/chat"
                  className="flex items-center space-x-3 p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiMessageCircle className="w-5 h-5" />
                  <span>Chat</span>
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                
                <Link
                  to="/profile"
                  className="flex items-center space-x-3 p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiUser className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                
                <Link
                  to="/leaderboard"
                  className="flex items-center space-x-3 p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiAward className="w-5 h-5" />
                  <span>Leaderboard</span>
                </Link>
                
                <Link
                  to="/settings"
                  className="flex items-center space-x-3 p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiSettings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
                
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg w-full text-left"
                >
                  <FiLogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Slide-out */}
      <SearchSlideOut 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </nav>
  );
};

export default Navbar; 