import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiSearch, FiMessageCircle, FiUser, FiPlus, FiBell, FiSettings, FiMoreHorizontal, FiSun, FiMoon, FiEdit, FiHeart } from 'react-icons/fi';
import { MdExplore, MdVideoLibrary } from 'react-icons/md';
import { FaFire } from 'react-icons/fa';

const navLinks = [
  { to: '/', label: 'Home', icon: <FiHome /> },
  { to: '/search', label: 'Search', icon: <FiSearch /> },
  { to: '/clips', label: 'Fliks', icon: <MdVideoLibrary /> },
  { to: '/confessions', label: 'Confessions', icon: <FiHeart /> },
  { to: '/swipe', label: 'Swipe', icon: <FaFire /> },
  { to: '/chat', label: 'Messages', icon: <FiMessageCircle /> },
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
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen z-[60] border-r border-gray-200 dark:border-gray-800 transition-all duration-300 bg-white dark:bg-gray-900 ${hovered ? 'w-56' : 'w-16'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ minWidth: hovered ? '14rem' : '4rem', borderRadius: 0, margin: 0 }}
      >
        {/* Main nav: all icons (no labels) when not hovered, all icons+labels when hovered */}
        <div className={`flex flex-col w-full transition-all duration-300 ${hovered ? '' : 'items-center'}`} style={{ flex: 1 }}>
          <nav className={`flex flex-col gap-1 w-full mt-4 ${hovered ? '' : 'items-center'}`}>
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `group relative flex items-center ${hovered ? 'gap-3 px-3 py-2.5 w-full justify-start' : 'justify-center py-2.5 w-12'} font-medium transition-all duration-200 text-base rounded-lg mx-2
                  ${isActive ? 'bg-blue-600/90 text-white dark:bg-blue-500/90 shadow-lg' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`
                }
              >
                <span className={`${hovered ? 'text-xl' : 'text-2xl'} transition-transform duration-200 group-hover:scale-110`}>{link.icon}</span>
                <span className={`ml-3 text-sm transition-all duration-200 ${hovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden pointer-events-none'}`}>{link.label}</span>
              </NavLink>
            ))}
            
            {/* More Options Dropdown */}
            <div 
              className={`relative ${hovered ? 'w-full' : 'w-12'}`}
              onMouseEnter={() => setMoreHovered(true)}
              onMouseLeave={() => setMoreHovered(false)}
            >
              <div className={`group relative flex items-center ${hovered ? 'gap-3 px-3 py-2.5 w-full justify-start' : 'justify-center py-2.5 w-12'} font-medium transition-all duration-200 text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg mx-2`}>
                <span className={`${hovered ? 'text-xl' : 'text-2xl'} transition-transform duration-200 group-hover:scale-110`}>
                  <FiMoreHorizontal />
                </span>
                <span className={`ml-3 text-sm transition-all duration-200 ${hovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden pointer-events-none'}`}>More</span>
              </div>
              
              {/* Dropdown Menu */}
              {moreHovered && hovered && (
                <div className="absolute left-full top-0 ml-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-48 z-50">
                  {moreOptions.map(option => (
                    <NavLink
                      key={option.to}
                      to={option.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors duration-200
                        ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`
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
        <div className={`flex flex-col items-center p-3 w-full border-t border-gray-200 dark:border-gray-800 transition-all duration-300`}>
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full rounded-lg`}
          >
            {darkMode ? <span className="text-xl"><FiSun /></span> : <span className="text-xl"><FiMoon /></span>}
            <span className={`ml-2 transition-all duration-200 ${hovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden pointer-events-none'}`}>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden justify-around items-center h-16 sm:h-18 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1
              ${isActive ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`
            }
          >
            <span className="text-lg sm:text-xl mb-1">{link.icon}</span>
            <span className="text-xs font-medium truncate max-w-full">{link.label}</span>
          </NavLink>
        ))}
        
        {/* Mobile More Button */}
        <div className="relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 text-gray-500 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800">
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
