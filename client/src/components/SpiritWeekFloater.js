import React, { useState } from 'react';
import '../styles/SpiritWeekFloater.css';

function SpiritWeekFloater() {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`spirit-floater ${isExpanded ? 'expanded' : ''}`}>
      <div className="floater-header" onClick={toggleExpand}>
        <span className="floater-emoji">🎭</span>
        <span className="floater-title">Spirit Week!</span>
      </div>
      {isExpanded && (
        <div className="floater-body">
          <p><strong>Battle of the Broadways</strong></p>
          <p className="floater-dates">📅 Feb 2-6, 2026</p>
          <div className="floater-highlights">
            <div className="highlight-item">🎪 Mon: Opening Night</div>
            <div className="highlight-item">👯 Tue: Twinning Tuesday</div>
            <div className="highlight-item">💚 Wed: Wicked Wednesday</div>
            <div className="highlight-item">😴 Thu: Hakuna Matata Thursday</div>
            <div className="highlight-item">🎪 Fri: Be Your Broadway Friday</div>
          </div>
          <p className="floater-cta">Check Dashboard for details! ⭐</p>
        </div>
      )}
    </div>
  );
}

export default SpiritWeekFloater;
