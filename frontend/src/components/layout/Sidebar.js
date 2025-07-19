import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiSearch, FiMessageCircle, FiUser, FiPlus, FiBell, FiSettings, FiMoreHorizontal, FiSun, FiMoon, FiEdit, FiHeart, FiAward, FiZap } from 'react-icons/fi';
import { MdVideoLibrary } from 'react-icons/md';
import { FaFire, FaCrown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const navLinks = [
  { to: '/', label: 'Home', icon: <FiHome /> },
  { to: null, label: 'Search', icon: <FiSearch />, action: 'openSearch' },
  { to: '/shorts', label: 'Shorts', icon: <FaFire /> },
  { to: '/chat', label: 'Messages', icon: <FiMessageCircle /> },
  { to: '/afex-ai', label: 'AFEX AI', icon: <FiZap /> },
  { to: '/leaderboard', label: 'Leaderboard', icon: <FiAward /> },
  { to: '/premium', label: 'Premium', icon: <FaCrown /> },
  { to: '/profile', label: 'Profile', icon: <FiUser /> }, // Changed from '/edit-profile' to '/profile'
];

export default function Sidebar({ darkMode, setDarkMode }) {
  const [hovered, setHovered] = useState(false);
  const { user } = useAuth();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen z-[60] transition-all duration-300 
        bg-white dark:bg-black
        border-r border-gray-200 dark:border-gray-700 shadow-lg
        ${hovered ? 'w-64' : 'w-20'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ 
          minWidth: hovered ? '16rem' : '5rem'
        }}
      >
        {/* Main nav: all icons (no labels) when not hovered, all icons+labels when hovered */}
        <div className={`flex flex-col w-full transition-all duration-300 ${hovered ? '' : 'items-center'}`} style={{ flex: 1 }}>
          <nav className={`flex flex-col gap-2 w-full mt-6 px-3 ${hovered ? '' : 'items-center'}`}>
            {navLinks.map((link, index) => (
              <motion.div
                key={link.to || link.action}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                {link.action === 'openSearch' ? (
                  <button
                    onClick={() => {
                      // Dispatch custom event to open search
                      window.dispatchEvent(new CustomEvent('openSearchSlideOut'));
                    }}
                    className={`group relative flex items-center ${hovered ? 'gap-4 px-4 py-3 w-full justify-start' : 'justify-center py-3 w-14'} 
                    font-medium transition-all duration-300 text-base mx-1
                    text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md hover:text-gray-900 dark:hover:text-white`}
                  >
                    <motion.span 
                      className="text-lg transition-all duration-200 group-hover:scale-105"
                      whileHover={{ rotate: 2 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ minWidth: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {link.icon}
                    </motion.span>
                    <motion.span 
                      className={`ml-1 text-sm font-medium transition-all duration-300 ${hovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden pointer-events-none'}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hovered ? 1 : 0 }}
                    >
                      {link.label}
                    </motion.span>
                  </button>
                ) : (
                  <NavLink
                    to={link.to}
                    {...(link.to === '/leaderboard' ? { 'data-intro-leaderboard': true } : {})}
                    className={({ isActive }) =>
                      `group relative flex items-center ${hovered ? 'gap-4 px-4 py-3 w-full justify-start' : 'justify-center py-3 w-14'} 
                      font-medium transition-all duration-300 text-base mx-1
                      ${isActive 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md hover:text-gray-900 dark:hover:text-white'
                      }`
                    }
                  >
                    <motion.span 
                      className="text-lg transition-all duration-200 group-hover:scale-105"
                      whileHover={{ rotate: 2 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ minWidth: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {link.icon}
                    </motion.span>
                    <motion.span 
                      className={`ml-1 text-sm font-medium transition-all duration-300 ${hovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden pointer-events-none'}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hovered ? 1 : 0 }}
                    >
                      {link.label}
                    </motion.span>
                  </NavLink>
                )}
                <AnimatePresence>
                  {window.location.pathname === link.to && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gray-200 dark:bg-gray-700 -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </nav>
        </div>
        {/* Dark/Light Toggle always at the bottom */}
        <div className={`flex flex-col items-center p-4 w-full border-t border-gray-200 dark:border-gray-700 transition-all duration-300`}>
          <button
            onClick={() => {
              const newMode = !darkMode;
              setDarkMode(newMode);
              
              // Dispatch custom event for AFEXAI page to listen to
              window.dispatchEvent(new CustomEvent('themeChanged', { 
                detail: { isDark: newMode } 
              }));
            }}
            className={`flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 
              hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md hover:text-gray-900 dark:hover:text-white 
              transition-all duration-200 w-full font-medium`}
          >
            <span className="text-lg" style={{ minWidth: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {darkMode ? <FiSun /> : <FiMoon />}
            </span>
            <span className={`ml-1 text-sm font-medium transition-all duration-200 ${hovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden pointer-events-none'}`}>
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden justify-around items-center h-20 sm:h-22 
        bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg px-2">
        {navLinks.map(link => (
          link.action === 'openSearch' ? (
            <button
              key={link.action}
              onClick={() => {
                // Dispatch custom event to open search
                window.dispatchEvent(new CustomEvent('openSearchSlideOut'));
              }}
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 min-w-0 flex-1 mx-1 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="text-xl sm:text-2xl mb-1.5">{link.icon}</span>
              <span className="text-xs sm:text-sm font-medium truncate max-w-full">{link.label}</span>
            </button>
          ) : (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 min-w-0 flex-1 mx-1
                ${isActive ? 'text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 shadow-md' : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}`
              }
            >
              <span className="text-xl sm:text-2xl mb-1.5">{link.icon}</span>
              <span className="text-xs sm:text-sm font-medium truncate max-w-full">{link.label}</span>
            </NavLink>
          )
        ))}
      </nav>

      {/* Bottom padding for mobile to account for bottom bar */}
      <div className="lg:hidden h-20 sm:h-22"></div>
    </>
  );
}
