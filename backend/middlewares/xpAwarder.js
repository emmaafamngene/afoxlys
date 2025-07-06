const User = require('../models/User');
const { calculateLevel, getXPForNextLevel, getXPForCurrentLevel, calculateProgress } = require('../utils/levelCalculator');

/**
 * Middleware to award XP to users for actions
 * @param {number} xpAmount - Amount of XP to award
 * @param {string} actionType - Type of action (for logging)
 * @returns {Function} - Express middleware function
 */
function xpAwarder(xpAmount, actionType = 'action') {
  return async (req, res, next) => {
    try {
      // Skip if user is not authenticated
      if (!req.user || !req.user._id) {
        return next();
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return next();
      }

      const oldLevel = user.level;
      const oldXP = user.xp;

      // Award XP
      user.xp += xpAmount;

      // Check if user leveled up
      const newLevel = calculateLevel(user.xp);
      let leveledUp = false;

      if (newLevel > user.level) {
        user.level = newLevel;
        leveledUp = true;
        console.log(`🎉 User ${user.username} leveled up from ${oldLevel} to ${newLevel}! (${actionType})`);
      }

      await user.save();

      // Add level info to response
      if (leveledUp) {
        res.locals.levelUp = {
          oldLevel,
          newLevel,
          xpGained: xpAmount,
          totalXP: user.xp,
          progress: calculateProgress(user.xp, user.level),
          xpForNextLevel: getXPForNextLevel(user.level)
        };
      }

      // Add XP info to response
      res.locals.xpInfo = {
        xpGained: xpAmount,
        totalXP: user.xp,
        currentLevel: user.level,
        progress: calculateProgress(user.xp, user.level),
        xpForNextLevel: getXPForNextLevel(user.level),
        xpForCurrentLevel: getXPForCurrentLevel(user.level)
      };

      console.log(`✨ ${user.username} gained ${xpAmount} XP for ${actionType} (Total: ${user.xp} XP, Level: ${user.level})`);

    } catch (error) {
      console.error('Error awarding XP:', error);
      // Don't fail the request if XP awarding fails
    }

    next();
  };
}

/**
 * Award XP for login streak
 * @param {number} streakDays - Number of consecutive login days
 * @returns {number} - XP to award
 */
function calculateLoginStreakXP(streakDays) {
  if (streakDays <= 1) return 0;
  if (streakDays <= 3) return 5;
  if (streakDays <= 7) return 10;
  if (streakDays <= 14) return 20;
  if (streakDays <= 30) return 50;
  return 100; // Max streak bonus
}

/**
 * Update login streak and award XP
 * @param {Object} user - User object
 * @returns {number} - XP awarded for streak
 */
async function updateLoginStreak(user) {
  const today = new Date();
  const lastLogin = new Date(user.lastLoginDate);
  
  // Check if it's a consecutive day
  const daysDiff = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 1) {
    // Consecutive day
    user.loginStreak += 1;
  } else if (daysDiff > 1) {
    // Streak broken
    user.loginStreak = 1;
  }
  // If daysDiff === 0, same day login, don't change streak
  
  user.lastLoginDate = today;
  await user.save();
  
  const streakXP = calculateLoginStreakXP(user.loginStreak);
  if (streakXP > 0) {
    user.xp += streakXP;
    await user.save();
    console.log(`🔥 ${user.username} got ${streakXP} XP for ${user.loginStreak}-day login streak!`);
  }
  
  return streakXP;
}

module.exports = {
  xpAwarder,
  calculateLoginStreakXP,
  updateLoginStreak
}; 