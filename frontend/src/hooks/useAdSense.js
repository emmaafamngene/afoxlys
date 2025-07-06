import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useAdSense = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize AdSense on route change
    if (window.adsbygoogle) {
      try {
        // Push adsbygoogle to reinitialize ads on the new page
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log('AdSense reinitialized on route change:', location.pathname);
      } catch (error) {
        console.error('Error reinitializing AdSense:', error);
      }
    }
  }, [location.pathname]);

  // Function to manually initialize AdSense
  const initializeAdSense = () => {
    if (window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log('AdSense manually initialized');
      } catch (error) {
        console.error('Error initializing AdSense:', error);
      }
    }
  };

  return { initializeAdSense };
}; 