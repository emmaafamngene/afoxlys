import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiBarChart2, FiVideo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const Studio = () => {
  const { user } = useAuth(); // get userId from context
  const [tab, setTab] = useState('upload');
  const [video, setVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [flicks, setFlicks] = useState([]); // Placeholder for uploaded flicks
  const [analytics, setAnalytics] = useState(null);
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideo(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!video || !user?._id) return;
    setUploading(true);
    try {
      // 1. Upload to Cloudinary via backend
      const formData = new FormData();
      formData.append('file', video);
      formData.append('type', 'video');
      
      const cloudRes = await fetch('/api/upload/upload-to-cloudinary', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const cloudData = await cloudRes.json();
      if (!cloudData.success || !cloudData.secure_url) {
        alert('Upload failed: ' + (cloudData.error || 'Unknown error'));
        setUploading(false);
        return;
      }
      const videoUrl = cloudData.secure_url;

      // 2. Save flick metadata in your backend
      await fetch('/api/flicks/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: video.name,
          userId: user._id,
          duration: 60, // or actual duration
          videoUrl
        })
      });

      // 3. Fetch updated flicks list
      const res = await fetch(`/api/flicks/user/${user._id}`);
      let flicksList = await res.json();
      if (!Array.isArray(flicksList)) {
        // If backend returns an object, try to extract array or fallback to []
        if (Array.isArray(flicksList.flicks)) {
          flicksList = flicksList.flicks;
        } else {
          flicksList = [];
        }
      }
      setFlicks(flicksList);
      setVideo(null);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Defensive: always render flicks as array
  const safeFlicks = Array.isArray(flicks) ? flicks : [];

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Top Bar */}
      <div className="w-full bg-white dark:bg-gray-950 shadow flex items-center px-8 py-4 z-10">
        <FiVideo className="text-purple-600 dark:text-purple-400 w-8 h-8 mr-3" />
        <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Flick Studio</span>
      </div>
      <div className="flex flex-1 w-full">
        {/* Sidebar */}
        <aside className="w-56 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col py-8 px-4 min-h-[calc(100vh-64px)]">
          <button
            className={`flex items-center gap-3 px-4 py-3 mb-4 rounded-lg font-semibold text-lg transition-all duration-200 ${tab === 'upload' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            onClick={() => setTab('upload')}
          >
            <FiUploadCloud className="w-6 h-6" /> Upload Flick
          </button>
          <button
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-lg transition-all duration-200 ${tab === 'analytics' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            onClick={() => setTab('analytics')}
          >
            <FiBarChart2 className="w-6 h-6" /> Analytics
          </button>
        </aside>
        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-start py-12 px-6">
          <AnimatePresence mode="wait">
            {tab === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-2xl"
              >
                <form onSubmit={handleUpload} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 flex flex-col items-center mb-10">
                  <label
                    htmlFor="video-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-purple-400 dark:border-purple-600 rounded-xl cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-800/30 transition mb-6"
                  >
                    <FiUploadCloud className="w-12 h-12 text-purple-500 mb-2 animate-bounce" />
                    <span className="text-lg font-semibold text-purple-700 dark:text-purple-300">Click or drag a short video here (max 60s)</span>
                    <input
                      id="video-upload"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                  </label>
                  {video && (
                    <video
                      src={URL.createObjectURL(video)}
                      controls
                      className="w-full rounded-lg shadow mb-4"
                      style={{ maxHeight: 240 }}
                    />
                  )}
                  <button
                    type="submit"
                    disabled={!video || uploading}
                    className="px-8 py-3 bg-purple-600 text-white rounded-lg font-bold shadow-lg hover:bg-purple-700 transition text-lg disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload Flick'}
                  </button>
                </form>
                <div className="w-full">
                  <h2 className="text-lg font-semibold mb-4">Your Flicks</h2>
                  {safeFlicks.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-6 min-h-[120px] flex items-center justify-center text-gray-400">
                      No flicks uploaded yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {safeFlicks.map((flick, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 flex items-center gap-4">
                          <video src={flick.url} controls className="w-32 h-20 rounded-lg shadow" />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white">{flick.name}</div>
                            <div className="text-xs text-gray-500">Uploaded: {flick.uploaded}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            {tab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-2xl"
              >
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-6 flex items-center gap-2">
                    <FiBarChart2 className="w-6 h-6" /> Flick Analytics
                  </h2>
                  {safeFlicks.length === 0 ? (
                    <div className="text-gray-400">No analytics to show yet.</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-6 w-full text-center">
                      {safeFlicks.map((flick, idx) => (
                        <div key={idx} className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 flex flex-col items-center">
                          <video src={flick.url} controls className="w-24 h-16 rounded mb-2" />
                          <div className="font-semibold text-gray-900 dark:text-white mb-1">{flick.name}</div>
                          <div className="text-xs text-gray-500 mb-2">Uploaded: {flick.uploaded}</div>
                          <div className="flex flex-wrap gap-4 justify-center">
                            <div>
                              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{flick.views}</div>
                              <div className="text-xs text-gray-500">Views</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-pink-600 dark:text-pink-400">{flick.likes}</div>
                              <div className="text-xs text-gray-500">Likes</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{flick.comments}</div>
                              <div className="text-xs text-gray-500">Comments</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">{flick.duration}s</div>
                              <div className="text-xs text-gray-500">Duration</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Studio; 