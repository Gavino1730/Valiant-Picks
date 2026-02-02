import React, { useState, useEffect } from 'react';
import '../styles/RivalryWeekPopup.css';
import popupQueue from '../utils/popupQueue';

const RivalryWeekPopup = ({ enabled = true, gameInfo = {} }) => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Only show if enabled and user hasn't dismissed it this session
    const dismissed = sessionStorage.getItem('rivalryWeekDismissed');
    if (enabled && !dismissed) {
      // Add to popup queue with priority 1 (highest priority)
      popupQueue.enqueue(
        'rivalryWeek',
        () => {
          setShowPopup(true);
          // Auto-dismiss after 10 seconds
          setTimeout(() => {
            handleClose();
          }, 10000);
        },
        1, // Priority: 1 (show first)
        500 // Initial delay: 500ms
      );
    }
  }, [enabled]);

  const handleClose = () => {
    setShowPopup(false);
    sessionStorage.setItem('rivalryWeekDismissed', 'true');
    popupQueue.dismiss('rivalryWeek');
  };

  if (!showPopup) return null;

  const {
    opponent = 'WESTSIDE',
    date = 'Friday, January 10',
    time = '7:00 PM',
    location = 'Home'
  } = gameInfo;

  return (
    <div className="rivalry-popup-overlay" onClick={handleClose}>
      <div className="rivalry-popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="rivalry-close-btn" onClick={handleClose}>×</button>
        
        {/* Top Badge */}
        <div className="rivalry-top-badge">‼️ RIVALRY GAME ‼️</div>
        
        <div className="rivalry-image-container">
          <img 
            src="/assets/varks.png" 
            alt="Rivalry Week" 
            className="rivalry-image"
          />
        </div>

        <div className="rivalry-text-container">
          <div className="rivalry-fire-row">🔥🔥🔥</div>
          <h1 className="rivalry-title animated">BEEF IS ON</h1>
          <div className="rivalry-matchup animated-delayed">
            <span className="rivalry-team valiant">VC</span>
            <span className="rivalry-vs">VS</span>
            <span className="rivalry-team opponent">{opponent}</span>
          </div>
          <p className="rivalry-tagline animated-delayed-more">SETTLE THE SCORE!</p>
          
          <div className="rivalry-hype-badges">
            <span className="hype-badge">😤 BAD BLOOD</span>
            <span className="hype-badge">👊 TIME TO BATTLE</span>
          </div>
          
          <div className="rivalry-game-info">
            <div className="rivalry-info-item">
              <span className="info-icon">📅</span>
              <span className="info-text">{date}</span>
            </div>
            <div className="rivalry-info-item">
              <span className="info-icon">⏰</span>
              <span className="info-text">{time}</span>
            </div>
            <div className="rivalry-info-item">
              <span className="info-icon">📍</span>
              <span className="info-text">{location}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RivalryWeekPopup;
