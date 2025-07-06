# 🎮 AFEX Leveling System Guide

## Overview
The AFEX leveling system rewards users for engaging with the platform through XP (Experience Points) and levels. Users can earn XP through various activities and compete on leaderboards.

## 🏆 Features

### Core Features
- **XP System**: Users earn XP for various activities
- **Level Progression**: Automatic level calculation based on XP
- **Login Streaks**: Bonus XP for consecutive daily logins
- **Leaderboards**: Global and user-specific rankings
- **Progress Tracking**: Visual progress bars and level information
- **Real-time Updates**: XP awarded immediately for actions

### XP Rewards
| Activity | XP Reward |
|----------|-----------|
| Create a post | +10 XP |
| Comment on a post | +5 XP |
| Get a follower | +15 XP |
| Receive a like | +2 XP |
| Daily login streak (3+ days) | +5-100 XP |
| Stay active for 10 min | +1 XP |

### Level Thresholds
| Level | XP Required |
|-------|-------------|
| 1 | 0 XP |
| 2 | 100 XP |
| 3 | 250 XP |
| 4 | 500 XP |
| 5 | 800 XP |
| 6 | 1200 XP |
| 7 | 1700 XP |
| 8 | 2300 XP |
| 9 | 3000 XP |
| 10 | 3800 XP |
| 11+ | Exponential scaling |

## 🛠 Technical Implementation

### Backend Components

#### 1. Database Schema (User Model)
```javascript
// Added to User model
xp: { type: Number, default: 0 },
level: { type: Number, default: 1 },
loginStreak: { type: Number, default: 0 },
lastLoginDate: { type: Date, default: Date.now }
```

#### 2. Level Calculator (`backend/utils/levelCalculator.js`)
- `calculateLevel(xp)`: Determines level from XP
- `getXPForNextLevel(level)`: XP needed for next level
- `getXPForCurrentLevel(level)`: XP needed for current level
- `calculateProgress(xp, level)`: Progress percentage to next level

#### 3. XP Awarder Middleware (`backend/middlewares/xpAwarder.js`)
- `xpAwarder(xpAmount, actionType)`: Middleware to award XP
- `updateLoginStreak(user)`: Handles login streak logic
- `calculateLoginStreakXP(streakDays)`: Calculates streak bonuses

#### 4. API Endpoints
- `POST /api/auth/login`: Awards login streak XP
- `GET /api/auth/me`: Returns user with level info
- `GET /api/leaderboard`: Global leaderboard
- `GET /api/leaderboard/user/:userId`: User's rank and nearby users

### Frontend Components

#### 1. XP Bar Component (`frontend/src/components/leveling/XPBar.js`)
- Displays current level and XP progress
- Shows progress bar to next level
- Responsive design with dark mode support

#### 2. Level Up Notification (`frontend/src/components/leveling/LevelUpNotification.js`)
- Animated notification when user levels up
- Shows XP gained and progress to next level
- Auto-dismisses after 5 seconds

#### 3. Leaderboard Page (`frontend/src/pages/Leaderboard.js`)
- Displays top users by XP or level
- Pagination support
- User rankings and statistics

#### 4. Navbar Integration
- XP bar shown in user profile dropdown
- Level information displayed prominently

## 🚀 Usage Examples

### Awarding XP for Actions
```javascript
// In your route handlers
router.post('/posts', 
  auth, 
  xpAwarder(10, 'creating a post'),
  async (req, res) => {
    // Post creation logic
  }
);
```

### Getting User Level Info
```javascript
// From API response
{
  user: {
    level: 5,
    xp: 1250,
    progress: 75.5,
    xpForNextLevel: 1700,
    loginStreak: 7
  }
}
```

### Displaying XP Bar
```jsx
<XPBar 
  xp={user.xp}
  level={user.level}
  progress={user.progress}
  xpForNextLevel={user.xpForNextLevel}
  xpForCurrentLevel={user.xpForCurrentLevel}
/>
```

## 📊 Leaderboard Features

### Global Leaderboard
- Sort by XP or Level
- Pagination support
- User avatars and display names
- Login streak information

### User Rankings
- Individual user rank
- Nearby users (5 above, 5 below)
- Progress within rank bracket

## 🎯 Customization

### Adding New XP Sources
1. Import the XP awarder middleware
2. Add to your route: `xpAwarder(amount, 'action description')`
3. The system automatically handles level progression

### Modifying Level Thresholds
Edit `backend/utils/levelCalculator.js`:
```javascript
function calculateLevel(xp) {
  // Modify these thresholds
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  // ... add more levels
}
```

### Changing XP Rewards
Update the XP amounts in your route handlers:
```javascript
xpAwarder(15, 'new action') // Change from 10 to 15 XP
```

## 🔧 Testing

### Test Script
Run the comprehensive test:
```bash
node test-leveling-system.js
```

### Manual Testing
1. Register a new user
2. Create posts to earn XP
3. Check level progression
4. View leaderboard rankings
5. Test login streak bonuses

## 📱 Frontend Integration

### Navigation
- Leaderboard accessible via sidebar "More" menu
- XP bar visible in navbar profile dropdown
- Level information shown throughout the app

### Responsive Design
- XP bar adapts to mobile screens
- Leaderboard table scrolls horizontally on mobile
- Touch-friendly interface

## 🎨 UI/UX Features

### Visual Elements
- Gradient progress bars
- Trophy icons for rankings
- Level badges with colors
- Animated level-up notifications

### Dark Mode Support
- All components support dark/light themes
- Consistent color schemes
- Proper contrast ratios

## 🔮 Future Enhancements

### Planned Features
- Weekly/Monthly leaderboards
- Achievement badges
- Level-based rewards
- XP multipliers for special events
- Team/Clan systems

### Potential Additions
- Quest system for bonus XP
- Seasonal level resets
- Custom avatar frames for high levels
- Special features unlocked at certain levels

## 🐛 Troubleshooting

### Common Issues
1. **XP not updating**: Check if user is authenticated
2. **Level not progressing**: Verify XP calculation logic
3. **Leaderboard not loading**: Check database connectivity
4. **Frontend not showing XP**: Ensure API responses include level data

### Debug Tips
- Check server logs for XP awarding messages
- Verify user object includes level fields
- Test API endpoints directly
- Monitor database for XP updates

## 📈 Analytics

### Metrics to Track
- User engagement by level
- XP earning patterns
- Leaderboard participation
- Login streak retention
- Level progression rates

### Performance Considerations
- Index XP and level fields in database
- Cache leaderboard results
- Optimize level calculation queries
- Monitor API response times

---

## 🎉 Summary

The AFEX leveling system provides a comprehensive gamification experience that encourages user engagement through:
- **Immediate feedback** for actions
- **Progressive challenges** with level thresholds
- **Social competition** via leaderboards
- **Visual progress** tracking
- **Streak rewards** for consistency

The system is designed to be easily extensible and maintainable, with clear separation of concerns between backend logic and frontend presentation. 