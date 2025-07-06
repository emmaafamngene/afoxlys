/**
 * Calculate user level based on XP
 * @param {number} xp - User's experience points
 * @returns {number} - User's level
 */
function calculateLevel(xp) {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 800) return 4;
  if (xp < 1200) return 5;
  if (xp < 1700) return 6;
  if (xp < 2300) return 7;
  if (xp < 3000) return 8;
  if (xp < 3800) return 9;
  if (xp < 4700) return 10;
  
  // For levels beyond 10, use exponential scaling
  return Math.floor(Math.sqrt(xp / 100)) + 4;
}

/**
 * Get XP required for next level
 * @param {number} currentLevel - Current user level
 * @returns {number} - XP required for next level
 */
function getXPForNextLevel(currentLevel) {
  const levelThresholds = {
    1: 100,
    2: 250,
    3: 500,
    4: 800,
    5: 1200,
    6: 1700,
    7: 2300,
    8: 3000,
    9: 3800,
    10: 4700
  };
  
  if (currentLevel >= 10) {
    return Math.pow(currentLevel - 3, 2) * 100;
  }
  
  return levelThresholds[currentLevel] || 0;
}

/**
 * Get XP required for current level
 * @param {number} currentLevel - Current user level
 * @returns {number} - XP required for current level
 */
function getXPForCurrentLevel(currentLevel) {
  if (currentLevel === 1) return 0;
  
  const levelThresholds = {
    2: 100,
    3: 250,
    4: 500,
    5: 800,
    6: 1200,
    7: 1700,
    8: 2300,
    9: 3000,
    10: 3800
  };
  
  if (currentLevel > 10) {
    return Math.pow(currentLevel - 4, 2) * 100;
  }
  
  return levelThresholds[currentLevel - 1] || 0;
}

/**
 * Calculate progress percentage to next level
 * @param {number} xp - Current XP
 * @param {number} level - Current level
 * @returns {number} - Progress percentage (0-100)
 */
function calculateProgress(xp, level) {
  const currentLevelXP = getXPForCurrentLevel(level);
  const nextLevelXP = getXPForNextLevel(level);
  const xpInCurrentLevel = xp - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  
  return Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100));
}

module.exports = {
  calculateLevel,
  getXPForNextLevel,
  getXPForCurrentLevel,
  calculateProgress
}; 