const fs = require('fs');
const path = require('path');

// Files to fix with their specific changes
const fixes = [
  {
    file: 'frontend/src/components/chat/ChatWindow.js',
    search: 'const handleView = (conversation) => {',
    replace: '// const handleView = (conversation) => {'
  },
  {
    file: 'frontend/src/components/chat/MessageBubble.js',
    search: 'const timeLeft = useMemo(() => {',
    replace: '// const timeLeft = useMemo(() => {'
  },
  {
    file: 'frontend/src/components/chat/MessageBubble.js',
    search: '}, [message.createdAt]);',
    replace: '// }, [message.createdAt]);'
  },
  {
    file: 'frontend/src/pages/AFEXClips.js',
    search: 'import React, { useState, useEffect } from \'react\';',
    replace: 'import React, { useState } from \'react\';'
  },
  {
    file: 'frontend/src/pages/AFEXClips.js',
    search: 'const { isAuthenticated, user } = useAuth();',
    replace: 'const { } = useAuth();'
  },
  {
    file: 'frontend/src/pages/AFEXClips.js',
    search: 'const [fundraisingStats, setFundraisingStats] = useState({',
    replace: 'const [fundraisingStats] = useState({'
  },
  {
    file: 'frontend/src/pages/Chat.js',
    search: '}, [selectedConversation]);',
    replace: '}, [selectedConversation, fetchMessages]);'
  },
  {
    file: 'frontend/src/pages/Confessions.js',
    search: 'const { user } = useAuth();',
    replace: 'const { } = useAuth();'
  },
  {
    file: 'frontend/src/pages/CreateClip.js',
    search: 'import { FiUpload, FiVideo } from \'react-icons/fi\';',
    replace: 'import { FiUpload } from \'react-icons/fi\';'
  },
  {
    file: 'frontend/src/pages/CreatePost.js',
    search: 'import { FiUpload, FiImage, FiVideo } from \'react-icons/fi\';',
    replace: 'import { FiUpload } from \'react-icons/fi\';'
  },
  {
    file: 'frontend/src/pages/EditProfile.js',
    search: 'import React, { useState, useEffect } from \'react\';',
    replace: 'import React, { useState } from \'react\';'
  },
  {
    file: 'frontend/src/pages/EditProfile.js',
    search: 'import { FiUpload } from \'react-icons/fi\';',
    replace: '// import { FiUpload } from \'react-icons/fi\';'
  },
  {
    file: 'frontend/src/pages/Leaderboard.js',
    search: 'const { user } = useAuth();',
    replace: 'const { } = useAuth();'
  },
  {
    file: 'frontend/src/pages/Leaderboard.js',
    search: '}, []);',
    replace: '}, [fetchLeaderboard]);'
  },
  {
    file: 'frontend/src/pages/Leaderboard.js',
    search: 'const getLevelColor = (level) => {',
    replace: '// const getLevelColor = (level) => {'
  },
  {
    file: 'frontend/src/pages/Profile.js',
    search: 'import { useNavigate } from \'react-router-dom\';',
    replace: '// import { useNavigate } from \'react-router-dom\';'
  },
  {
    file: 'frontend/src/pages/Profile.js',
    search: 'import { postsAPI, clipsAPI } from \'../services/api\';',
    replace: '// import { postsAPI, clipsAPI } from \'../services/api\';'
  },
  {
    file: 'frontend/src/pages/Profile.js',
    search: 'import { FiMapPin, FiCalendar, FiLink, FiMail, FiEdit2, FiHeart, FiMessageCircle, FiAward, FiStar, FiZap, FiTrendingUp } from \'react-icons/fi\';',
    replace: 'import { FiEdit2 } from \'react-icons/fi\';'
  },
  {
    file: 'frontend/src/pages/Profile.js',
    search: '}, []);',
    replace: '}, [checkFollowStatus, fetchUserProfile]);'
  },
  {
    file: 'frontend/src/pages/Search.js',
    search: 'const { isAuthenticated } = useAuth();',
    replace: 'const { } = useAuth();'
  },
  {
    file: 'frontend/src/pages/Search.js',
    search: '}, [searchQuery]);',
    replace: '}, [searchQuery, performSearch]);'
  },
  {
    file: 'frontend/src/pages/Swipe.js',
    search: 'import { FiBarChart2, FiHeart, FiX } from \'react-icons/fi\';',
    replace: 'import { FiBarChart2 } from \'react-icons/fi\';'
  }
];

// Apply fixes
fixes.forEach(fix => {
  try {
    const filePath = path.join(__dirname, fix.file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(fix.search)) {
        content = content.replace(fix.search, fix.replace);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${fix.file}`);
      } else {
        console.log(`Search string not found in: ${fix.file}`);
      }
    } else {
      console.log(`File not found: ${fix.file}`);
    }
  } catch (error) {
    console.error(`Error fixing ${fix.file}:`, error.message);
  }
});

console.log('ESLint fixes applied!'); 