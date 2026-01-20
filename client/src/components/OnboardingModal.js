import React, { useState, useEffect } from 'react';
import '../styles/OnboardingModal.css';

// Check localStorage before component mounts to prevent flash
const hasSeenOnboarding = () => {
  try {
    return localStorage.getItem('hasSeenOnboarding') === 'true';
  } catch {
    return false;
  }
};

function OnboardingModal() {
  // Initialize from localStorage immediately to prevent flash
  const [showModal, setShowModal] = useState(!hasSeenOnboarding());

  useEffect(() => {
    // Double-check on mount in case localStorage changed
    if (hasSeenOnboarding()) {
      setShowModal(false);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="onboarding-overlay" data-testid="onboarding-overlay" onClick={handleClose}>
      <div className="onboarding-modal" data-testid="onboarding-modal" onClick={(e) => e.stopPropagation()}>
        <button className="onboarding-close" data-testid="onboarding-close" onClick={handleClose}>✕</button>

        <div className="onboarding-header">
          <div className="onboarding-header-brand">
            <img 
              src="/assets/transparent.png" 
              alt="Valiant Picks" 
              className="onboarding-logo"
              width="40"
              height="40"
            />
            <span className="onboarding-brand-text">Valiant Picks</span>
          </div>
          <h1>🎯 Welcome!</h1>
          <p>Learn the basics before you start playing</p>
        </div>

        <div className="onboarding-content">
          <div className="onboarding-section">
            <div className="section-icon">💰</div>
            <h3>Virtual Currency</h3>
            <p>Start with 1,000 Valiant Bucks. No real money involved!</p>
          </div>

          <div className="onboarding-section">
            <div className="section-icon">🎮</div>
            <h3>How to Pick</h3>
            <p>Select a team, choose your confidence level, and stake your Valiant Bucks. Win = Multiply your stake by the odds!</p>
          </div>

          <div className="onboarding-section">
            <div className="section-icon">📊</div>
            <h3>Confidence Levels</h3>
            <div className="confidence-guide">
              <div className="confidence-item">
                <span className="confidence-badge low">Low</span>
                <div className="confidence-details">
                  <strong>1.2x Multiplier</strong>
                  <p>Safe bet on clear favorites</p>
                </div>
              </div>
              <div className="confidence-item">
                <span className="confidence-badge medium">Medium</span>
                <div className="confidence-details">
                  <strong>1.5x Multiplier</strong>
                  <p>Balanced risk & reward</p>
                </div>
              </div>
              <div className="confidence-item">
                <span className="confidence-badge high">High</span>
                <div className="confidence-details">
                  <strong>2.0x Multiplier</strong>
                  <p>Biggest risk, biggest reward</p>
                </div>
              </div>
            </div>
          </div>

          <div className="onboarding-section">
            <div className="section-icon">🏆</div>
            <h3>Climb the Leaderboard</h3>
            <p>Your wins are tracked. Compete with friends and earn bragging rights!</p>
          </div>

          <div className="onboarding-tips">
            <h4>💡 Pro Tips:</h4>
            <ul>
              <li>Start with smaller picks to learn the system</li>
              <li>Check the "How to Use" page for more details</li>
              <li>You can place multiple picks on different games</li>
              <li>Each game only allows one pick per user</li>
            </ul>
          </div>
        </div>

        <div className="onboarding-footer">
          <button className="onboarding-btn-primary" data-testid="onboarding-start" onClick={handleClose}>
            Let's Get Started! 🚀
          </button>
          <p className="onboarding-hint">You can always visit "How to Use" for more information</p>
        </div>
      </div>
    </div>
  );
}

export default React.memo(OnboardingModal);
