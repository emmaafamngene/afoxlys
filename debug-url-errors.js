// Debug script to identify malformed URLs causing ERR_NAME_NOT_RESOLVED errors
console.log('🔍 Debug: Checking for potential URL issues...');

// Check if there are any malformed URLs in the current page
function checkForMalformedUrls() {
  console.log('🔍 Checking all img tags for malformed URLs...');
  const images = document.querySelectorAll('img');
  images.forEach((img, index) => {
    const src = img.src;
    console.log(`Image ${index + 1}:`, {
      src: src,
      isValid: isValidUrl(src),
      element: img
    });
  });

  console.log('🔍 Checking all link tags for malformed URLs...');
  const links = document.querySelectorAll('link');
  links.forEach((link, index) => {
    const href = link.href;
    console.log(`Link ${index + 1}:`, {
      href: href,
      isValid: isValidUrl(href),
      element: link
    });
  });

  console.log('🔍 Checking all script tags for malformed URLs...');
  const scripts = document.querySelectorAll('script');
  scripts.forEach((script, index) => {
    const src = script.src;
    if (src) {
      console.log(`Script ${index + 1}:`, {
        src: src,
        isValid: isValidUrl(src),
        element: script
      });
    }
  });
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Check for any CSS or other resources that might have malformed URLs
function checkForResourceErrors() {
  console.log('🔍 Checking for resource loading errors...');
  
  // Listen for resource loading errors
  window.addEventListener('error', function(e) {
    if (e.target && e.target.src) {
      console.error('❌ Resource loading error:', {
        type: e.target.tagName,
        src: e.target.src,
        error: e.message
      });
    }
  }, true);
}

// Check user data for malformed avatar URLs
function checkUserData() {
  console.log('🔍 Checking user data for malformed URLs...');
  
  // Check localStorage for user data
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log('User data from localStorage:', user);
      
      if (user.avatar) {
        console.log('User avatar URL:', {
          url: user.avatar,
          isValid: isValidUrl(user.avatar)
        });
      }
    } catch (err) {
      console.error('Error parsing user data:', err);
    }
  }
  
  // Check for any global user state
  if (window.user || window.currentUser) {
    console.log('Global user state:', {
      windowUser: window.user,
      windowCurrentUser: window.currentUser
    });
  }
}

// Run all checks
checkForMalformedUrls();
checkForResourceErrors();
checkUserData();

console.log('🔍 Debug: URL check complete. Check console for results.'); 