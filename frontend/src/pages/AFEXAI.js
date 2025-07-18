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
  const messagesEndRef = useRef(null);
  const controls = useAnimation();

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
      color: 'from-violet-500 to-purple-600',
      gradient: 'from-violet-500/20 to-purple-600/20'
    }
  ];

  // Floating particles component
  const FloatingParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-gradient-to-r from-violet-400 to-purple-500 rounded-full opacity-30"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(34,197,94,0.1),transparent_50%)]" />
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
              <div className="w-20 h-20 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mr-6 shadow-2xl shadow-purple-500/50">
                <FiZap className="w-10 h-10 text-white" />
              </div>
              <motion.div
                className="absolute -inset-4 bg-gradient-to-r from-violet-500 to-pink-500 rounded-3xl opacity-20 blur-xl"
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
                className="text-6xl font-black bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2"
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
                className="text-xl text-gray-300 font-medium"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Next-Generation Social Intelligence
              </motion.p>
            </div>
          </motion.div>
        </motion.div>

        {/* Static Feature Tabs (AI Tab) - now outside chat */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-4"
        >
          {features.map((feature, index) => (
            <motion.button
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => setSelectedFeature(feature.id)}
              className={`group relative p-6 rounded-3xl border-2 transition-all duration-500 overflow-hidden ${
                selectedFeature === feature.id
                  ? `bg-gradient-to-r ${feature.color} border-transparent text-white shadow-2xl shadow-purple-500/25`
                  : 'bg-white/10 backdrop-blur-xl border-white/20 text-gray-300 hover:border-purple-400/50 hover:bg-white/20'
              }`}
              whileHover={{ 
                scale: 1.05,
                y: -5
              }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Animated background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <motion.div 
                  className={`mb-4 p-3 rounded-2xl ${
                    selectedFeature === feature.id 
                      ? 'bg-white/20 backdrop-blur-sm' 
                      : 'bg-white/10 backdrop-blur-sm'
                  }`}
                  animate={selectedFeature === feature.id ? {
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm opacity-80 leading-relaxed">{feature.description}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Main Chat Interface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-visible min-h-[700px] flex flex-col justify-between"
        >
          <div className="flex flex-1">
            {/* Enhanced Chat List Sidebar */}
            <motion.div 
              className={`w-80 border-r border-white/20 flex flex-col transition-all duration-500 ${
                showChatList ? 'translate-x-0' : '-translate-x-full'
              } md:translate-x-0`}
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {/* Chat List Header */}
              <div className="p-6 border-b border-white/20 bg-gradient-to-r from-violet-500/20 to-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Neural Chats</h3>
                  <motion.button
                    onClick={createNewChat}
                    className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white hover:from-violet-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiPlus className="w-5 h-5" />
                  </motion.button>
                </div>
                <button
                  onClick={() => setShowChatList(false)}
                  className="md:hidden w-full p-3 text-sm text-gray-300 hover:text-white transition-colors bg-white/10 rounded-xl"
                >
                  <FiChevronLeft className="w-4 h-4 inline mr-2" />
                  Back to Chat
                </button>
              </div>

              {/* Chat List */}
              <div className="flex-1 p-4 space-y-3">
                {loading ? (
                  <div className="text-center text-gray-400 py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"
                    />
                    Loading neural networks...
                  </div>
                ) : chats.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                                         <FiCpu className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No conversations yet</p>
                    <button
                      onClick={createNewChat}
                      className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
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
                            ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                            : 'bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white'
                        }`}
                        onClick={() => loadChat(chat._id)}
                        whileHover={{ scale: 1.02, x: 5 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold truncate ${
                              currentChat?._id === chat._id ? 'text-white' : 'text-white'
                            }`}>
                              {chat.title}
                            </h4>
                            <p className={`text-sm truncate mt-1 ${
                              currentChat?._id === chat._id ? 'text-violet-100' : 'text-gray-400'
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
                              currentChat?._id === chat._id ? 'hover:bg-white' : 'hover:bg-gray-300'
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

            {/* Enhanced Chat Area */}
            <div className="flex-1 flex flex-col justify-between">
              {/* Chat Header */}
              <div className="p-6 border-b border-white/20 bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => setShowChatList(true)}
                    className="md:hidden mr-4 p-3 text-gray-300 hover:text-white transition-colors bg-white/10 rounded-xl"
                  >
                    <FiMessageCircle className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {currentChat?.title || 'Neural Interface'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {currentChat ? 'Active neural session' : 'Ready to connect'}
                    </p>
                  </div>
                </div>
                {!currentChat && (
                  <motion.button
                    onClick={createNewChat}
                    className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Initialize Session
                  </motion.button>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-6 space-y-6">
                {messages.length === 0 && !currentChat ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center text-gray-400 mt-20"
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
                      className="w-24 h-24 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-xl"
                    >
                      <FiCpu className="w-12 h-12 text-violet-400" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-4 text-white">Welcome to AFEX AI</h3>
                    <p className="mb-6 text-lg leading-relaxed max-w-md mx-auto">
                      I'm your advanced neural assistant, ready to revolutionize your social media experience with cutting-edge AI technology.
                    </p>
                    <motion.button
                      onClick={createNewChat}
                      className="px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl hover:from-violet-600 hover:to-purple-700 transition-all duration-300 shadow-2xl shadow-purple-500/25 font-semibold"
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
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                              message.type === 'user' 
                                ? 'bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg' 
                                : 'bg-gradient-to-r from-gray-600 to-gray-700 shadow-lg'
                            }`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            {message.type === 'user' ? (
                              <FiUser className="w-6 h-6 text-white" />
                            ) : (
                              <FiCpu className="w-6 h-6 text-white" />
                            )}
                          </motion.div>
                          <motion.div 
                            className={`px-6 py-4 rounded-3xl backdrop-blur-xl ${
                              message.type === 'user'
                                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                                : 'bg-white/20 text-white border border-white/20'
                            }`}
                            whileHover={{ scale: 1.02 }}
                          >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            <p className={`text-xs mt-3 ${
                              message.type === 'user' ? 'text-violet-100' : 'text-gray-400'
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
                        className="w-12 h-12 rounded-2xl bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center shadow-lg"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                                                 <FiCpu className="w-6 h-6 text-white" />
                      </motion.div>
                      <div className="px-6 py-4 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/20">
                        <div className="flex space-x-2">
                          <motion.div 
                            className="w-3 h-3 bg-violet-400 rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                          />
                          <motion.div 
                            className="w-3 h-3 bg-purple-400 rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                          />
                          <motion.div 
                            className="w-3 h-3 bg-pink-400 rounded-full"
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
              <div className="border-t border-white/20 p-6 bg-gradient-to-r from-slate-800/50 to-purple-900/50">
                <div className="flex items-end space-x-4">
                  <div className="flex-1 relative">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={currentChat ? "Transmit your thoughts to the neural network..." : "Initialize neural interface to begin..."}
                      className="w-full p-4 border border-white/20 rounded-2xl resize-none bg-white/10 backdrop-blur-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-300"
                      rows="1"
                      style={{ minHeight: '56px', maxHeight: '120px' }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 opacity-0 pointer-events-none"
                      animate={{ opacity: isHovering ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <motion.button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || !currentChat}
                    className="w-14 h-14 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center text-white transition-all duration-300 shadow-2xl shadow-purple-500/25"
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
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AFEXAI; 