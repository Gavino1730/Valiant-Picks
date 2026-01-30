import React, { useState, useEffect } from 'react';
import '../styles/SpiritWeekBanner.css';

function SpiritWeekBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem('spiritWeekBannerMinimized') === 'true';
  });

  const handleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    localStorage.setItem('spiritWeekBannerMinimized', newState.toString());
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('spiritWeekBannerClosed', 'true');
  };

  // Check if banner was previously closed
  useEffect(() => {
    const wasClosed = localStorage.getItem('spiritWeekBannerClosed') === 'true';
    if (wasClosed) {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`spirit-week-banner ${isMinimized ? 'minimized' : ''}`}>
      <div className="spirit-banner-content">
        {!isMinimized && (
          <>
            <div className="spirit-banner-icon">🎭</div>
            <div className="spirit-banner-text">
              <strong>🌟 Spirit Week: Battle of the Broadways 🌟</strong>
              <span className="spirit-banner-dates">Feb 2-6 • Themed dress-up days, competitions & prizes!</span>
            </div>
          </>
        )}
        {isMinimized && (
          <div className="spirit-banner-minimized-text">
            🎭 Spirit Week! 🌟
          </div>
        )}
        <div className="spirit-banner-controls">
          <button 
            className="spirit-banner-btn minimize" 
            onClick={handleMinimize}
            aria-label={isMinimized ? 'Expand banner' : 'Minimize banner'}
          >
            {isMinimized ? '▼' : '▲'}
          </button>
          <button 
            className="spirit-banner-btn close" 
            onClick={handleClose}
            aria-label="Close banner"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="spirit-banner-sparkles">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="sparkle" style={{
            left: `${(i + 1) * 12}%`,
            animationDelay: `${i * 0.3}s`
          }}>✨</div>
        ))}
      </div>
    </div>
  );
}

export default SpiritWeekBanner;
