import React from 'react';
import useAdSense from '../hooks/useAdSense';

const AdSenseAd = ({ 
  adSlot, 
  adFormat = "auto", 
  fullWidthResponsive = true,
  style = {},
  className = ""
}) => {
  useAdSense();

  return (
    <div className={`ad-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-9943929128198070"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
};

export default AdSenseAd; 