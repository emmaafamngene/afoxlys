import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LoadingPage from './components/LoadingPage';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Main Pages
import Home from './pages/Home';
import AFEXClips from './pages/AFEXClips';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import EditProfile from './pages/EditProfile';
import CreatePost from './pages/CreatePost';
import CreateClip from './pages/CreateClip';
import Chat from './pages/Chat';
import Confessions from './pages/Confessions';
import Swipe from './pages/Swipe';
import Leaderboard from './pages/Leaderboard';

// Component to redirect to current user's profile
const CurrentUserProfile = () => {
  const { user } = useAuth();
  return user ? <Navigate to={`/user/${user._id}`} replace /> : <Navigate to="/login" replace />;
};

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('afex-dark') === 'true';
  });
  const [isLoading, setIsLoading] = useState(true);
  // Sidebar hover state for layout shift
  const [sidebarHovered, setSidebarHovered] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('afex-dark', darkMode);
  }, [darkMode]);

  // Simulate loading time and initialize app
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Show loading for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  // Listen for sidebar hover events (desktop only)
  useEffect(() => {
    const sidebar = document.querySelector('aside');
    if (!sidebar) return;
    
    const onEnter = () => setSidebarHovered(true);
    const onLeave = () => setSidebarHovered(false);
    
    sidebar.addEventListener('mouseenter', onEnter);
    sidebar.addEventListener('mouseleave', onLeave);
    
    return () => {
      sidebar.removeEventListener('mouseenter', onEnter);
      sidebar.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // Show loading page while app is initializing
  if (isLoading) {
    return <LoadingPage darkMode={darkMode} />;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
          {/* Sidebar - Hidden on mobile, visible on large screens */}
          <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-h-screen w-full lg:ml-16 transition-all duration-300">
            {/* Navbar */}
            <Navbar darkMode={darkMode} />
            
            {/* Main Content */}
            <main className="flex-1 pt-16 lg:pt-16 px-3 sm:px-4 md:px-6 lg:px-8 pb-20 lg:pb-6">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route path="/" element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                } />
                <Route path="/clips" element={
                  <PrivateRoute>
                    <AFEXClips />
                  </PrivateRoute>
                } />
                <Route path="/search" element={
                  <PrivateRoute>
                    <Search />
                  </PrivateRoute>
                } />
                <Route path="/profile" element={
                  <PrivateRoute>
                    <CurrentUserProfile />
                  </PrivateRoute>
                } />
                <Route path="/user/:userId" element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } />
                <Route path="/edit-profile" element={
                  <PrivateRoute>
                    <EditProfile />
                  </PrivateRoute>
                } />
                <Route path="/settings" element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                } />
                <Route path="/create-post" element={
                  <PrivateRoute>
                    <CreatePost />
                  </PrivateRoute>
                } />
                <Route path="/create-clip" element={
                  <PrivateRoute>
                    <CreateClip />
                  </PrivateRoute>
                } />
                <Route path="/chat" element={
                  <PrivateRoute>
                    <Chat />
                  </PrivateRoute>
                } />
                <Route path="/confessions" element={
                  <PrivateRoute>
                    <Confessions />
                  </PrivateRoute>
                } />
                <Route path="/swipe" element={
                  <PrivateRoute>
                    <Swipe />
                  </PrivateRoute>
                } />
                <Route path="/leaderboard" element={
                  <PrivateRoute>
                    <Leaderboard />
                  </PrivateRoute>
                } />
                
                {/* Redirect unknown routes to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              fontSize: '14px',
              padding: '12px 16px',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App; 