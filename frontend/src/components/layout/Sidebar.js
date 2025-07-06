import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiSearch, FiMessageCircle, FiUser, FiPlus, FiBell, FiSettings, FiMoreHorizontal, FiSun, FiMoon, FiEdit, FiHeart, FiAward } from 'react-icons/fi';
import { MdExplore, MdVideoLibrary } from 'react-icons/md';
import { FaFire } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { to: '/', label: 'Home', icon: <FiHome /> },
  { to: '/search', label: 'Search', icon: <FiSearch /> },
  { to: '/clips', label: 'Fliks', icon: <MdVideoLibrary /> },
  { to: '/confessions', label: 'Confessions', icon: <FiHeart /> },
  { to: '/swipe', label: 'Swipe', icon: <FaFire /> },
  { to: '/chat', label: 'Messages', icon: <FiMessageCircle /> },
  { to: '/leaderboard', label: 'Leaderboard', icon: <FiAward /> },
  { to: '/create-post', label: 'Create Post', icon: <FiPlus /> },
  { to: '/profile', label: 'Profile', icon: <FiUser /> },
];

const moreOptions = [
  { to: '/edit-profile', label: 'Edit Profile', icon: <FiEdit /> },
  { to: '/settings', label: 'Settings', icon: <FiSettings /> },
];

export default function Sidebar({ darkMode, setDarkMode }) {
  const [hovered, setHovered] = useState(false);
  const [moreHovered, setMoreHovered] = useState(false);

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
                key={link.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
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
            
            {/* More Options Dropdown */}
            <div 
              className={`relative ${hovered ? 'w-full' : 'w-14'}`}
              onMouseEnter={() => setMoreHovered(true)}
              onMouseLeave={() => setMoreHovered(false)}
            >
              <div className={`group relative flex items-center ${hovered ? 'gap-4 px-4 py-3 w-full justify-start' : 'justify-center py-3 w-14'} 
                font-medium transition-all duration-200 text-base text-gray-600 dark:text-gray-300 
                hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md hover:text-gray-900 dark:hover:text-white 
                mx-1`}>
                <span className="text-lg transition-all duration-200 group-hover:scale-105"
                      style={{ minWidth: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiMoreHorizontal />
                </span>
                <span className={`ml-1 text-sm font-medium transition-all duration-200 ${hovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden pointer-events-none'}`}>More</span>
              </div>
              
              {/* Dropdown Menu */}
              {moreHovered && hovered && (
                <div className="absolute left-full top-0 ml-3 bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-48 z-50">
                  {moreOptions.map(option => (
                    <NavLink
                      key={option.to}
                      to={option.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors duration-200
                        ${isActive ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`
                      }
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>
        {/* Dark/Light Toggle always at the bottom */}
        <div className={`flex flex-col items-center p-4 w-full border-t border-gray-200 dark:border-gray-700 transition-all duration-300`}>
          <button
            onClick={() => setDarkMode((prev) => !prev)}
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden justify-around items-center h-16 sm:h-18 
        bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1
              ${isActive ? 'text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700' : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}`
            }
          >
            <span className="text-lg sm:text-xl mb-1">{link.icon}</span>
            <span className="text-xs font-medium truncate max-w-full">{link.label}</span>
          </NavLink>
        ))}
        
        {/* Mobile More Button */}
        <div className="relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800">
          <span className="text-lg sm:text-xl mb-1">
            <FiMoreHorizontal />
          </span>
          <span className="text-xs font-medium">More</span>
        </div>
      </nav>

      {/* Bottom padding for mobile to account for bottom bar */}
      <div className="lg:hidden h-16 sm:h-18"></div>
    </>
  );
}
