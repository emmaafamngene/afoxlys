import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiZap, FiCpu, FiMessageCircle, FiStar, FiUser, FiEdit, FiPlus, FiTrash2, FiChevronLeft, FiGlobe, FiTrendingUp } from 'react-icons/fi';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { aiAPI } from '../services/api';

const AFEXAI = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState('chat');
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [showChatList, setShowChatList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [particleCount, setParticleCount] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);
  const messagesEndRef = useRef(null);
  const controls = useAnimation();

  // Theme detection
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const body = document.body;
      const isDark = body.classList.contains('dark') || 
                    body.style.backgroundColor === 'black' || 
                    body.style.backgroundColor === 'rgb(0, 0, 0)' ||
                    window.getComputedStyle(body).backgroundColor === 'rgb(0, 0, 0)' ||
                    body.style.background === 'black' ||
                    body.style.background === 'rgb(0, 0, 0)';
      
      const wasDark = isDarkTheme;
      setIsDarkTheme(isDark);
      
      // Force re-render if theme actually changed
      if (wasDark !== isDark) {
        setForceUpdate(prev => prev + 1);
      }
    };

    checkTheme();
    
    // Create a mutation observer to watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['class', 'style'],
      subtree: false 
    });

    // Also listen for window resize and other events that might trigger theme changes
    window.addEventListener('resize', checkTheme);
    window.addEventListener('storage', checkTheme);
    
    // Listen for custom theme change event from sidebar
    const handleThemeChange = (event) => {
      const { isDark } = event.detail;
      setIsDarkTheme(isDark);
      setForceUpdate(prev => prev + 1);
    };
    window.addEventListener('themeChanged', handleThemeChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkTheme);
      window.removeEventListener('storage', checkTheme);
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chats on component mount
  useEffect(() => {
    loadChats();
  }, []);

  // Particle animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setParticleCount(prev => (prev + 1) % 20);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await aiAPI.getChats();
      if (response.data.success) {
        setChats(response.data.chats);
        console.log('✅ Loaded', response.data.chats.length, 'chats');
      }
    } catch (error) {
      console.error('❌ Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await aiAPI.createChat();
      if (response.data.success) {
        const newChat = response.data.chat;
        setChats(prev => [newChat, ...prev]);
        setCurrentChat(newChat);
        setMessages([]);
        setShowChatList(false);
        console.log('✅ Created new chat:', newChat._id);
      }
    } catch (error) {
      console.error('❌ Error creating new chat:', error);
    }
  };

  const loadChat = async (chatId) => {
    try {
      const response = await aiAPI.getChat(chatId);
      if (response.data.success) {
        const chat = response.data.chat;
        setCurrentChat(chat);
        setMessages(chat.messages.map(msg => ({
          id: msg._id || Date.now() + Math.random(),
          type: msg.role === 'user' ? 'user' : 'ai',
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        })));
        setShowChatList(false);
        console.log('✅ Loaded chat:', chatId, 'with', chat.messages.length, 'messages');
      }
    } catch (error) {
      console.error('❌ Error loading chat:', error);
    }
  };

  const deleteChat = async (chatId) => {
    try {
      const response = await aiAPI.deleteChat(chatId);
      if (response.data.success) {
        setChats(prev => prev.filter(chat => chat._id !== chatId));
        if (currentChat && currentChat._id === chatId) {
          setCurrentChat(null);
          setMessages([]);
        }
        console.log('✅ Deleted chat:', chatId);
      }
    } catch (error) {
      console.error('❌ Error deleting chat:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      console.log('🤖 Frontend: Sending message to AI:', inputMessage);
      console.log('🤖 Frontend: Current chat ID:', currentChat?._id);
      
      const res = await aiAPI.chat(userMessage.content, currentChat?._id);
      console.log('✅ Frontend: AI response received:', res.data);
      
      if (res.data.success) {
        const aiResponse = {
          id: Date.now() + 1,
          type: 'ai',
          content: res.data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
        
        // Update current chat with new data
        if (res.data.chat) {
          setCurrentChat(res.data.chat);
          
          // Update chats list with new chat info
          if (!currentChat) {
            // This is a new chat
            setChats(prev => [res.data.chat, ...prev]);
          } else {
            // Update existing chat in list
            setChats(prev => prev.map(chat => 
              chat._id === res.data.chat._id ? res.data.chat : chat
            ));
          }
        }
      } else {
        throw new Error(res.data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Frontend: AI Chat Error Details:', error);
      
      let errorMessage = 'Sorry, I could not process your request. Please try again later.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please check if the backend is running properly.';
      } else if (error.response?.status === 404) {
        errorMessage = 'AI service not found. Please check the backend deployment.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        type: 'ai',
        content: errorMessage,
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const features = [
    {
      id: 'chat',
      title: 'Neural Chat',
      description: 'Advanced AI conversations',
      icon: <FiCpu className="w-6 h-6" />,
      color: 'from-gray-800 to-black',
      gradient: 'from-gray-800/20 to-black/20'
    }
  ];

  // Floating particles component
  const FloatingParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full opacity-30"
          animate={{
            x: [0, Math.random() * 400 - 200],
            y: [0, Math.random() * 600 - 300],
            scale: [0, 1, 0],
            opacity: [0, 0.5, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
        />
      ))}
    </div>
  );

  return (
    <div 
      key={`afex-ai-${forceUpdate}`}
      className={`min-h-screen relative overflow-hidden transition-all duration-200 ${
        isDarkTheme 
          ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' 
          : 'bg-gradient-to-br from-white via-gray-50 to-blue-50'
      }`}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        {isDarkTheme ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(34,197,94,0.1),transparent_50%)]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,197,253,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(191,219,254,0.1),transparent_50%)]" />
          </>
        )}
      </div>

      {/* Floating Particles */}
      <FloatingParticles />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="flex items-center justify-center mb-6"
          >
            <div className="relative">
                              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mr-6 shadow-2xl transition-all duration-200 ${
                  isDarkTheme 
                    ? 'bg-gradient-to-r from-gray-600 via-gray-700 to-black shadow-gray-500/50' 
                    : 'bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 shadow-blue-500/50'
                }`}>
                  <FiZap className="w-10 h-10 text-white" />
                </div>
                          <motion.div
              className={`absolute -inset-4 rounded-3xl opacity-20 blur-xl transition-all duration-200 ${
                isDarkTheme 
                  ? 'bg-gradient-to-r from-gray-600 to-black' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-400'
              }`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            <div>
              <motion.h1 
                className={`text-6xl font-black bg-clip-text text-transparent mb-2 transition-all duration-200 ${
                  isDarkTheme 
                    ? 'bg-gradient-to-r from-gray-300 via-gray-400 to-white' 
                    : 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400'
                }`}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  backgroundSize: '200% 200%'
                }}
              >
                AFEX AI
              </motion.h1>
              <motion.p 
                className={`text-xl font-medium transition-colors duration-200 ${
                  isDarkTheme ? 'text-gray-300' : 'text-gray-600'
                }`}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Next-Generation Social Intelligence
              </motion.p>
            </div>
          </motion.div>
        </motion.div>



        {/* Main Chat Interface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className={`backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden min-h-[700px] flex flex-row transition-all duration-200 ${
            isDarkTheme 
              ? 'bg-white/10 border border-white/20' 
              : 'bg-white/90 border border-blue-200'
          }`}
        >
          {/* Enhanced Chat List Sidebar - fixed position */}
          <motion.div 
            className={`w-80 border-r flex flex-col transition-all duration-200 h-[700px] ${
              isDarkTheme ? 'border-white/20' : 'border-blue-200'
            }`}
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            style={{ flex: 'none', position: 'sticky', top: 0 }}
          >
              {/* Chat List Header */}
              <div className={`p-6 border-b bg-gradient-to-r transition-all duration-200 ${
                isDarkTheme 
                  ? 'border-white/20 from-gray-500/20 to-black/20' 
                  : 'border-blue-200 from-blue-500/20 to-blue-400/20'
              }`}>
                <div className="flex items-center justify-end mb-4">
                                      <motion.button
                      onClick={createNewChat}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all duration-200 shadow-lg ${
                        isDarkTheme 
                          ? 'bg-gradient-to-r from-gray-600 to-black hover:from-gray-700 hover:to-gray-900' 
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                      }`}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiPlus className="w-5 h-5" />
                  </motion.button>
                </div>
                                  <button
                    onClick={() => setShowChatList(false)}
                    className={`md:hidden w-full p-3 text-sm transition-colors rounded-xl ${
                      isDarkTheme 
                        ? 'text-gray-300 hover:text-white bg-white/10' 
                        : 'text-gray-600 hover:text-gray-800 bg-blue-100'
                    }`}
                  >
                  <FiChevronLeft className="w-4 h-4 inline mr-2" />
                  Back to Chat
                </button>
              </div>

              {/* Chat List */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {loading ? (
                  <div className={`text-center py-8 ${
                    isDarkTheme ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                                          <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className={`w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-4 ${
                          isDarkTheme ? 'border-gray-500' : 'border-blue-500'
                        }`}
                      />
                    Loading neural networks...
                  </div>
                                ) : chats.length === 0 ? (
                  <div className={`text-center py-8 ${
                    isDarkTheme ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <FiCpu className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No conversations yet</p>
                    <button
                      onClick={createNewChat}
                      className={`transition-colors font-medium ${
                        isDarkTheme ? 'text-gray-400 hover:text-gray-300' : 'text-blue-500 hover:text-blue-600'
                      }`}
                    >
                      Initialize new neural session
                    </button>
                  </div>
                ) : (
                  <AnimatePresence>
                    {chats.map((chat, index) => (
                      <motion.div
                        key={chat._id}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                          currentChat?._id === chat._id
                            ? isDarkTheme 
                              ? 'bg-gradient-to-r from-gray-800 to-black text-white shadow-lg'
                              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                            : isDarkTheme
                              ? 'bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white'
                              : 'bg-blue-50 hover:bg-blue-100 text-gray-700 hover:text-gray-900'
                        }`}
                        onClick={() => loadChat(chat._id)}
                        whileHover={{ scale: 1.02, x: 5 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold truncate ${
                              currentChat?._id === chat._id ? 'text-white' : isDarkTheme ? 'text-white' : 'text-gray-800'
                            }`}>
                              {chat.title}
                            </h4>
                            <p className={`text-sm truncate mt-1 ${
                              currentChat?._id === chat._id 
                                ? isDarkTheme ? 'text-gray-300' : 'text-blue-100'
                                : isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {chat.lastMessage || 'No messages yet'}
                            </p>
                          </div>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat._id);
                            }}
                            className={`ml-2 p-2 rounded-lg hover:bg-opacity-20 transition-all duration-200 ${
                              currentChat?._id === chat._id ? 'hover:bg-white' : isDarkTheme ? 'hover:bg-gray-300' : 'hover:bg-gray-200'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
          </motion.div>

          {/* Enhanced Chat Area - flex-1, scrollable if needed */}
          <div className="flex-1 flex flex-col justify-between h-[700px] overflow-hidden">
              {/* Chat Header */}
              <div className={`p-6 border-b bg-gradient-to-r flex items-center justify-between ${
                isDarkTheme 
                  ? 'border-white/20 from-gray-500/20 to-black/20' 
                  : 'border-blue-200 from-blue-500/20 to-blue-400/20'
              }`}>
                <div className="flex items-center">
                                      <button
                      onClick={() => setShowChatList(true)}
                      className={`md:hidden mr-4 p-3 transition-colors rounded-xl ${
                        isDarkTheme 
                          ? 'text-gray-300 hover:text-white bg-white/10' 
                          : 'text-gray-600 hover:text-gray-800 bg-blue-100'
                      }`}
                    >
                    <FiMessageCircle className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className={`text-xl font-bold ${
                      isDarkTheme ? 'text-white' : 'text-gray-800'
                    }`}>
                      {currentChat?.title || 'Neural Interface'}
                    </h3>
                    <p className={`text-sm ${
                      isDarkTheme ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {currentChat ? 'Active neural session' : 'Ready to connect'}
                    </p>
                  </div>
                </div>
                {!currentChat && (
                  <motion.button
                    onClick={createNewChat}
                    className={`px-6 py-3 text-white rounded-xl transition-all duration-200 shadow-lg ${
                      isDarkTheme 
                        ? 'bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Initialize Session
                  </motion.button>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(700px - 200px)' }}>
                {messages.length === 0 && !currentChat ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`text-center mt-20 ${
                      isDarkTheme ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    <motion.div
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                      className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-xl transition-all duration-200 ${
                        isDarkTheme 
                          ? 'bg-gradient-to-r from-gray-800/20 to-black/20' 
                          : 'bg-gradient-to-r from-blue-500/20 to-blue-400/20'
                      }`}
                    >
                      <FiCpu className={`w-12 h-12 transition-colors duration-200 ${
                        isDarkTheme ? 'text-gray-300' : 'text-blue-500'
                      }`} />
                    </motion.div>
                                          <h3 className={`text-2xl font-bold mb-4 ${
                        isDarkTheme ? 'text-white' : 'text-gray-800'
                      }`}>Welcome to AFEX AI</h3>
                      <p className={`mb-6 text-lg leading-relaxed max-w-md mx-auto ${
                        isDarkTheme ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        I'm your advanced neural assistant, ready to revolutionize your social media experience with cutting-edge AI technology.
                      </p>
                      <motion.button
                        onClick={createNewChat}
                        className={`px-8 py-4 text-white rounded-2xl transition-all duration-200 shadow-2xl font-semibold ${
                          isDarkTheme 
                            ? 'bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 shadow-gray-500/25' 
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25'
                        }`}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Initialize Neural Session
                    </motion.button>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.9 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start space-x-4 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <motion.div 
                            className={`px-6 py-4 rounded-3xl backdrop-blur-xl ${
                              message.type === 'user'
                                ? isDarkTheme 
                                  ? 'bg-gradient-to-r from-gray-800 to-black text-white shadow-lg'
                                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                : isDarkTheme
                                  ? 'bg-white/20 text-white border border-white/20'
                                  : 'bg-blue-50 text-gray-800 border border-blue-200'
                            }`}
                            whileHover={{ scale: 1.02 }}
                          >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            <p className={`text-xs mt-3 ${
                              message.type === 'user' 
                                ? isDarkTheme ? 'text-gray-300' : 'text-blue-100'
                                : isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                {/* Enhanced Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start space-x-4">
                      <motion.div 
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
                          isDarkTheme 
                            ? 'bg-gradient-to-r from-gray-800 to-black' 
                            : 'bg-gradient-to-r from-blue-500 to-blue-600'
                        }`}
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                                                 <FiCpu className="w-6 h-6 text-white" />
                      </motion.div>
                      <div className={`px-6 py-4 rounded-3xl backdrop-blur-xl border ${
                        isDarkTheme 
                          ? 'bg-white/20 border-white/20' 
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex space-x-2">
                          <motion.div 
                            className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                              isDarkTheme ? 'bg-gray-400' : 'bg-blue-400'
                            }`}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                          />
                          <motion.div 
                            className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                              isDarkTheme ? 'bg-gray-500' : 'bg-blue-500'
                            }`}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                          />
                          <motion.div 
                            className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                              isDarkTheme ? 'bg-gray-600' : 'bg-blue-600'
                            }`}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Enhanced Input Area */}
              <div className={`border-t p-6 bg-gradient-to-r flex-shrink-0 ${
                isDarkTheme 
                  ? 'border-white/20 from-gray-800/50 to-black/50' 
                  : 'border-blue-200 from-blue-50/50 to-blue-100/50'
              }`}>
                <div className="flex items-end space-x-4">
                  <div className="flex-1 relative">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={currentChat ? "Transmit your thoughts to the neural network..." : "Initialize neural interface to begin..."}
                      className={`w-full p-4 border rounded-2xl resize-none backdrop-blur-xl transition-all duration-300 text-lg min-w-[400px] max-w-[900px] mx-auto ${
                        isDarkTheme 
                          ? 'border-white/20 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-transparent' 
                          : 'border-blue-200 bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      }`}
                      rows="1"
                      style={{ minHeight: '56px', maxHeight: '120px' }}
                    />
                    <motion.div
                      className={`absolute inset-0 rounded-2xl opacity-0 pointer-events-none ${
                        isDarkTheme 
                          ? 'bg-gradient-to-r from-gray-500/20 to-black/20' 
                          : 'bg-gradient-to-r from-blue-500/20 to-blue-400/20'
                      }`}
                      animate={{ opacity: isHovering ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <motion.button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || !currentChat}
                    className={`w-14 h-14 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center text-white transition-all duration-200 shadow-2xl ${
                      isDarkTheme 
                        ? 'bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 shadow-gray-500/25' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25'
                    }`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onHoverStart={() => setIsHovering(true)}
                    onHoverEnd={() => setIsHovering(false)}
                  >
                    <FiSend className="w-6 h-6" />
                  </motion.button>
                </div>

              </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AFEXAI; 