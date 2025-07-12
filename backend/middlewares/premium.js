const User = require('../models/User');

/**
 * Middleware to check if user has active premium subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requirePremium = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (!user.isPremiumActive()) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required',
        isPremium: user.isPremium,
        premiumExpiresAt: user.premiumExpiresAt,
        daysUntilExpiry: user.getDaysUntilExpiry(),
        upgradeUrl: '/premium'
      });
    }

    // Add premium info to request for use in route handlers
    req.premiumInfo = {
      isPremium: user.isPremium,
      premiumPlan: user.premiumPlan,
      premiumExpiresAt: user.premiumExpiresAt,
      daysUntilExpiry: user.getDaysUntilExpiry()
    };

    next();
  } catch (error) {
    console.error('Premium middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

/**
 * Optional premium middleware - doesn't block access but adds premium info
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalPremium = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const user = await User.findById(req.user._id);
    
    if (user) {
      req.premiumInfo = {
        isPremium: user.isPremium,
        isPremiumActive: user.isPremiumActive(),
        premiumPlan: user.premiumPlan,
        premiumExpiresAt: user.premiumExpiresAt,
        daysUntilExpiry: user.getDaysUntilExpiry()
      };
    }

    next();
  } catch (error) {
    console.error('Optional premium middleware error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Middleware to check premium status and return appropriate response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const checkPremiumStatus = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const premiumStatus = {
      isPremium: user.isPremium,
      isPremiumActive: user.isPremiumActive(),
      premiumPlan: user.premiumPlan,
      premiumExpiresAt: user.premiumExpiresAt,
      daysUntilExpiry: user.getDaysUntilExpiry(),
      paymentHistory: user.premiumPaymentHistory
    };

    res.json({
      success: true,
      ...premiumStatus
    });

  } catch (error) {
    console.error('Check premium status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

module.exports = {
  requirePremium,
  optionalPremium,
  checkPremiumStatus
}; 