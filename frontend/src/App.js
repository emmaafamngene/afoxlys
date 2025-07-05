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

  // Listen for sidebar hover events
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

  // Responsive sidebar width
  const sidebarWidth = sidebarHovered ? 'w-56' : 'w-16';
  const sidebarMargin = sidebarHovered ? 'ml-56' : 'ml-16';

  // Show loading page while app is initializing
  if (isLoading) {
    return <LoadingPage darkMode={darkMode} />;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
          <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
          <div
            className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarMargin} pt-0`}
            style={{ zIndex: 0 }}
          >
            <Navbar darkMode={darkMode} />
            <main className="flex-1 pt-16 px-2 md:px-8 pb-4">
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