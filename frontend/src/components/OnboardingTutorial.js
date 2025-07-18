import React, { useEffect } from 'react';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import { useAuth } from '../contexts/AuthContext';

// Add custom animation CSS for the tutorial popups
const style = document.createElement('style');
style.innerHTML = `
/* Override default Intro.js styles to prevent default tutorial */
.introjs-tooltip:not(.afex-animated) {
  display: none !important;
}

.introjs-overlay:not(.afex-custom) {
  display: none !important;
}

.introjs-helperLayer:not(.afex-custom) {
  display: none !important;
}

/* Custom AFEX tutorial styles */
.introjs-tooltip.afex-animated {
  animation: afex-slide-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  border-radius: 16px !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
  border: none !important;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  max-width: 400px !important;
  min-width: 320px !important;
  padding: 24px !important;
  display: block !important;
}

.introjs-tooltip.afex-animated .introjs-tooltiptext {
  color: white !important;
  font-size: 16px !important;
  line-height: 1.6 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
}

.introjs-tooltip.afex-animated .introjs-arrow {
  border-color: #667eea !important;
}

.introjs-tooltip.afex-animated .introjs-arrow.top {
  border-bottom-color: #667eea !important;
}

.introjs-tooltip.afex-animated .introjs-arrow.bottom {
  border-top-color: #667eea !important;
}

.introjs-tooltip.afex-animated .introjs-arrow.left {
  border-right-color: #667eea !important;
}

.introjs-tooltip.afex-animated .introjs-arrow.right {
  border-left-color: #667eea !important;
}

.introjs-tooltip.afex-animated .introjs-button {
  background: rgba(255, 255, 255, 0.2) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 12px !important;
  color: white !important;
  font-weight: 600 !important;
  padding: 8px 16px !important;
  margin: 0 4px !important;
  transition: all 0.3s ease !important;
  backdrop-filter: blur(10px) !important;
}

.introjs-tooltip.afex-animated .introjs-button:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2) !important;
}

.introjs-tooltip.afex-animated .introjs-button.introjs-disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

.introjs-tooltip.afex-animated .introjs-progress {
  background: rgba(255, 255, 255, 0.2) !important;
  border-radius: 10px !important;
  height: 6px !important;
}

.introjs-tooltip.afex-animated .introjs-progressbar {
  background: linear-gradient(90deg, #ffd700, #ffed4e) !important;
  border-radius: 10px !important;
  transition: width 0.3s ease !important;
}

@keyframes afex-slide-in {
  0% { 
    opacity: 0; 
    transform: scale(0.8) translateY(30px) rotate(-2deg); 
  }
  50% { 
    opacity: 1; 
    transform: scale(1.05) translateY(-5px) rotate(1deg); 
  }
  100% { 
    opacity: 1; 
    transform: scale(1) translateY(0) rotate(0deg); 
  }
}

.introjs-overlay.afex-custom {
  background: rgba(0, 0, 0, 0.7) !important;
  backdrop-filter: blur(3px) !important;
}

.introjs-helperLayer.afex-custom {
  border-radius: 12px !important;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.3), 0 8px 32px rgba(102, 126, 234, 0.2) !important;
  background: rgba(102, 126, 234, 0.1) !important;
}
`;
document.head.appendChild(style);

const OnboardingTutorial = () => {
  const { isAuthenticated, user } = useAuth();

  // Development utility: Uncomment the line below to reset tutorial for testing
  // localStorage.removeItem('afex_onboarding_complete');

  // Immediate cleanup to prevent default tutorial
  React.useEffect(() => {
    // Remove any existing Intro.js instances immediately
    const cleanupIntroJS = () => {
      const existingOverlay = document.querySelector('.introjs-overlay');
      const existingTooltip = document.querySelector('.introjs-tooltip');
      const existingHelperLayer = document.querySelector('.introjs-helperLayer');
      
      if (existingOverlay) existingOverlay.remove();
      if (existingTooltip) existingTooltip.remove();
      if (existingHelperLayer) existingHelperLayer.remove();
    };

    // Run cleanup immediately
    cleanupIntroJS();
    
    // Also run cleanup periodically to catch any new instances
    const interval = setInterval(cleanupIntroJS, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Only run tutorial for authenticated users
    if (!isAuthenticated || !user) return;
    
    // Check if tutorial has already been completed
    if (localStorage.getItem('afex_onboarding_complete')) return;

    // Clean up any existing Intro.js instances
    const existingOverlay = document.querySelector('.introjs-overlay');
    const existingTooltip = document.querySelector('.introjs-tooltip');
    const existingHelperLayer = document.querySelector('.introjs-helperLayer');
    
    if (existingOverlay) existingOverlay.remove();
    if (existingTooltip) existingTooltip.remove();
    if (existingHelperLayer) existingHelperLayer.remove();

    // Wait for DOM elements to be available and user to be fully loaded
    const startTutorial = () => {
      // Check if required elements exist
      const swipeElement = document.querySelector('[data-intro-swipe]');
      const confessElement = document.querySelector('[data-intro-confess]');
      const profileElement = document.querySelector('[data-intro-profile]');
      const leaderboardElement = document.querySelector('[data-intro-leaderboard]');

      if (!swipeElement || !confessElement || !profileElement || !leaderboardElement) {
        // If elements aren't ready yet, try again in 500ms
        setTimeout(startTutorial, 500);
        return;
      }

      const intro = introJs.tour();
      intro.setOptions({
        steps: [
          {
            intro: `<div style='text-align:center;'>
              <div style='font-size:3rem;margin-bottom:16px;'>👋</div>
              <div style='font-size:1.4rem;font-weight:bold;margin-bottom:12px;'>Welcome to <span style='color:#ffd700;'>AFEX</span>!</div>
              <div style='font-size:1rem;line-height:1.6;'>
                Your next-gen social platform where you can:<br/>
                <span style='color:#ffd700;font-weight:600;'>🤫 Confess</span> anonymously<br/>
                <span style='color:#ffd700;font-weight:600;'>🏆 Level up</span> • <span style='color:#ffd700;font-weight:600;'>📊 Climb</span> the leaderboard<br/>
                Let's take a quick tour! 🚀
              </div>
            </div>`
          },
          {
            element: document.querySelector('[data-intro-confess]'),
            intro: `<div style='text-align:center;'>
              <div style='font-size:2rem;margin-bottom:12px;'>🤫</div>
              <div style='font-size:1.2rem;font-weight:bold;margin-bottom:8px;'>Confession Box</div>
              <div style='font-size:1rem;line-height:1.5;'>
                Share your thoughts anonymously!<br/>
                See what others think and react to confessions.<br/>
                <span style='color:#ffd700;font-size:0.9rem;'>Tap to switch to Confessions</span>
              </div>
            </div>`,
            position: 'bottom'
          },
          {
            element: document.querySelector('[data-intro-profile]'),
            intro: `<div style='text-align:center;'>
              <div style='font-size:2rem;margin-bottom:12px;'>🏆</div>
              <div style='font-size:1.2rem;font-weight:bold;margin-bottom:8px;'>Your Profile</div>
              <div style='font-size:1rem;line-height:1.5;'>
                Track your progress, level, and XP!<br/>
                View your badges and achievements.<br/>
                <span style='color:#ffd700;font-size:0.9rem;'>Click to view your profile</span>
              </div>
            </div>`,
            position: 'left'
          },
          {
            element: document.querySelector('[data-intro-leaderboard]'),
            intro: `<div style='text-align:center;'>
              <div style='font-size:2rem;margin-bottom:12px;'>📊</div>
              <div style='font-size:1.2rem;font-weight:bold;margin-bottom:8px;'>Leaderboard</div>
              <div style='font-size:1rem;line-height:1.5;'>
                See the top users and your rank!<br/>
                Can you reach the <span style='color:#ffd700;font-weight:600;'>#1 spot</span>?<br/>
                <span style='color:#ffd700;font-size:0.9rem;'>Click to view leaderboard</span>
              </div>
            </div>`,
            position: 'right'
          },
          {
            intro: `<div style='text-align:center;'>
              <div style='font-size:3rem;margin-bottom:16px;'>🎉</div>
              <div style='font-size:1.4rem;font-weight:bold;margin-bottom:12px;'>You're all set!</div>
              <div style='font-size:1rem;line-height:1.6;'>
                Start posting, swiping, and winning on AFEX!<br/>
                <span style='color:#ffd700;font-weight:600;'>Good luck on your journey!</span><br/>
                <span style='color:#ffd700;font-size:0.9rem;'>🌟 Ready to dominate? 🌟</span>
              </div>
            </div>`
          }
        ],
        showProgress: true,
        showBullets: false,
        exitOnOverlayClick: false,
        nextLabel: 'Next →',
        prevLabel: '← Back',
        doneLabel: 'Let\'s Go! 🚀',
        hidePrev: true,
        hideNext: false,
        overlayOpacity: 0.8,
        scrollToElement: true,
        scrollPadding: 50
      });

      // Add animation class to each tooltip
      intro.onafterchange(function(targetElement) {
        setTimeout(() => {
          const tooltip = document.querySelector('.introjs-tooltip');
          const overlay = document.querySelector('.introjs-overlay');
          const helperLayer = document.querySelector('.introjs-helperLayer');
          
          if (tooltip) tooltip.classList.add('afex-animated');
          if (overlay) overlay.classList.add('afex-custom');
          if (helperLayer) helperLayer.classList.add('afex-custom');
        }, 0);

        // Auto-switch tabs for Swipe Game and Confessions
        if (targetElement && targetElement.getAttribute('data-intro-swipe')) {
          // Switch to Swipe tab
          const event = new CustomEvent('switchToSwipe');
          window.dispatchEvent(event);
        } else if (targetElement && targetElement.getAttribute('data-intro-confess')) {
          // Switch to Confessions tab
          const event = new CustomEvent('switchToConfessions');
          window.dispatchEvent(event);
        }
      });

      intro.onbeforechange(function() {
        const tooltip = document.querySelector('.introjs-tooltip');
        if (tooltip) tooltip.classList.remove('afex-animated');
      });

      intro.oncomplete(() => {
        localStorage.setItem('afex_onboarding_complete', 'true');
      });

      intro.onexit(() => {
        localStorage.setItem('afex_onboarding_complete', 'true');
      });

      // Start the tutorial with a delay to ensure smooth experience
      setTimeout(() => intro.start(), 200);
    };

    // Start the tutorial after a delay to ensure everything is loaded
    setTimeout(startTutorial, 300);
  }, [isAuthenticated, user]);

  return null;
};

export default OnboardingTutorial; 