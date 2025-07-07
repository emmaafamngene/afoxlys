import { useEffect } from 'react';

export default function useAdSense() {
  useEffect(() => {
    const pushAds = () => {
      try {
        if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
          window.adsbygoogle.push({});
          console.log("AdSense ads pushed successfully");
        }
      } catch (e) {
        console.error("AdSense error:", e);
      }
    };

    const scriptExists = document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    );

    if (!scriptExists) {
      const script = document.createElement("script");
      script.src =
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9943929128198070";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = pushAds;
      document.body.appendChild(script);
    } else {
      // Script exists, try to push ads after a short delay to ensure it's ready
      setTimeout(pushAds, 100);
    }
  }, []);

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
} 