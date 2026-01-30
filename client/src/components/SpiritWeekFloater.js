import React, { useState, useEffect } from 'react';
import '../styles/SpiritWeekFloater.css';

function SpiritWeekFloater() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Show floater after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isVisible) return null;

  return (
    <div className={`spirit-floater ${isExpanded ? 'expanded' : ''}`}>
      <div className="floater-header" onClick={toggleExpand}>
        <span className="floater-emoji">🎭</span>
        <span className="floater-title">Spirit Week!</span>
        <button 
          className="floater-close" 
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      {isExpanded && (
        <div className="floater-body">
          <p><strong>Battle of the Broadways</strong></p>
          <p className="floater-dates">📅 Feb 2-6, 2026</p>
          <div className="floater-highlights">
            <div className="highlight-item">🎪 Mon: Opening Night</div>
            <div className="highlight-item">👯 Tue: Twinning Tuesday</div>
            <div className="highlight-item">💚 Wed: Wicked Wednesday</div>
            <div className="highlight-item">🦁 Thu: Lion King Thursday</div>
            <div className="highlight-item">🎤 Fri: Hamilton Friday</div>
          </div>
          <p className="floater-cta">Check Dashboard for details! ⭐</p>
        </div>
      )}
    </div>
  );
}

export default SpiritWeekFloater;
