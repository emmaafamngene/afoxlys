import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiX, FiMessageCircle, FiUserPlus, FiHeart, FiVideo } from 'react-icons/fi';
import { notificationService } from '../../services/notificationService';
import { DefaultAvatar } from '../layout/AFEXLogo';
import { getAvatarUrl } from '../../utils/avatarUtils';

const NotificationMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    // Load existing notifications
    loadNotifications();
  }, []);

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const handleNewMessage = (data) => {
    const notification = {
      _id: Date.now().toString(),
      type: 'message',
      title: 'New Message',
      message: `${data.senderName} sent you a message`,
      createdAt: new Date(),
      read: false,
      sender: {
        avatar: data.senderAvatar,
        firstName: data.senderName?.split(' ')[0] || '',
        lastName: data.senderName?.split(' ').slice(1).join(' ') || '',
        username: data.senderUsername || ''
      }
    };
    
    addNotification(notification);
    playNotificationSound();
    toast.success('New message received!');
  };

  const handleNewFollow = (data) => {
    const notification = {
      _id: Date.now().toString(),
      type: 'follow',
      title: 'New Follower',
      message: `${data.followerName} started following you`,
      createdAt: new Date(),
      read: false,
      sender: {
        avatar: data.followerAvatar,
        firstName: data.followerName?.split(' ')[0] || '',
        lastName: data.followerName?.split(' ').slice(1).join(' ') || '',
        username: data.followerUsername || ''
      }
    };
    
    addNotification(notification);
    playNotificationSound();
    toast.success('New follower!');
  };

  const handleNewLike = (data) => {
    const notification = {
      _id: Date.now().toString(),
      type: 'like',
      title: 'New Like',
      message: `${data.likerName} liked your ${data.contentType}`,
      createdAt: new Date(),
      read: false,
      sender: {
        avatar: data.likerAvatar,
        firstName: data.likerName?.split(' ')[0] || '',
        lastName: data.likerName?.split(' ').slice(1).join(' ') || '',
        username: data.likerUsername || ''
      }
    };
    
    addNotification(notification);
    playNotificationSound();
    toast.success('New like received!');
  };

  const handleNewComment = (data) => {
    const notification = {
      _id: Date.now().toString(),
      type: 'comment',
      title: 'New Comment',
      message: `${data.commenterName} commented on your ${data.contentType}`,
      createdAt: new Date(),
      read: false,
      sender: {
        avatar: data.commenterAvatar,
        firstName: data.commenterName?.split(' ')[0] || '',
        lastName: data.commenterName?.split(' ').slice(1).join(' ') || '',
        username: data.commenterUsername || ''
      }
    };
    
    addNotification(notification);
    playNotificationSound();
    toast.success('New comment!');
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep max 50 notifications
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <FiMessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <FiUserPlus className="w-4 h-4 text-green-500" />;
      case 'like':
        return <FiHeart className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <FiVideo className="w-4 h-4 text-purple-500" />;
      default:
        return <FiBell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Menu */}
      <div
        className={`absolute right-0 top-full mt-2 w-80 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <FiBell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => markAsRead(notification._id)}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    {notification.sender?.avatar ? (
                      <div className="relative flex-shrink-0">
                        <img
                          src={getAvatarUrl(notification.sender.avatar)}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover border border-white dark:border-gray-800 shadow-sm"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <DefaultAvatar 
                          user={notification.sender} 
                          size="sm" 
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <DefaultAvatar 
                        user={notification.sender} 
                        size="sm"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {getNotificationIcon(notification.type)}
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View all notifications
            </button>
          </div>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification-sound.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default NotificationMenu; 