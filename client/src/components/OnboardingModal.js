import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Double-check on mount in case localStorage changed
    if (hasSeenOnboarding()) {
      setShowModal(false);
    }
  }, []);

  const handleClose = useCallback(() => {
    if (dontShowAgain) {
      localStorage.setItem('hasSeenOnboarding', 'true');
    }
    setShowModal(false);
  }, [dontShowAgain]);

  useEffect(() => {
    if (!showModal) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement;
    document.body.style.overflow = 'hidden';

    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    const trapFocus = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = modalRef.current
        ? Array.from(modalRef.current.querySelectorAll(focusableSelectors))
        : [];
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', trapFocus);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', trapFocus);
      if (previousActiveElement && previousActiveElement.focus) {
        previousActiveElement.focus();
      }
    };
  }, [handleClose, showModal]);

  if (!showModal) return null;

  return (
    <div className="onboarding-overlay" data-testid="onboarding-overlay" onClick={handleClose}>
      <div
        className="onboarding-modal"
        data-testid="onboarding-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-subtitle"
        ref={modalRef}
      >
        <div className="onboarding-header">
          <div className="onboarding-title">
            <h1 id="onboarding-title">Welcome</h1>
            <p id="onboarding-subtitle">Your 60-second guide to making your first pick.</p>
          </div>
          <button
            className="onboarding-close"
            data-testid="onboarding-close"
            onClick={handleClose}
            aria-label="Close welcome dialog"
            ref={closeButtonRef}
          >
            ✕
          </button>
        </div>

        <div className="onboarding-body">
          <div className="onboarding-bullets">
            <div className="onboarding-item">
              <span className="onboarding-dot" aria-hidden="true" />
              <div>
                <h3>Virtual Currency</h3>
                <p>Start with 1,000 Valiant Bucks. No real money involved.</p>
              </div>
            </div>

            <div className="onboarding-item">
              <span className="onboarding-dot" aria-hidden="true" />
              <div>
                <h3>How to Pick</h3>
                <p>Choose a team, select confidence, and set your stake.</p>
              </div>
            </div>

            <div className="onboarding-item">
              <span className="onboarding-dot" aria-hidden="true" />
              <div>
                <h3>Confidence Levels</h3>
                <div className="confidence-list">
                  <div className="confidence-row">
                    <span className="confidence-pill low" aria-hidden="true" />
                    <span className="confidence-label">Low</span>
                    <span className="confidence-multiplier">1.2x</span>
                    <span className="confidence-note">Safer picks</span>
                  </div>
                  <div className="confidence-row">
                    <span className="confidence-pill medium" aria-hidden="true" />
                    <span className="confidence-label">Medium</span>
                    <span className="confidence-multiplier">1.5x</span>
                    <span className="confidence-note">Balanced risk</span>
                  </div>
                  <div className="confidence-row">
                    <span className="confidence-pill high" aria-hidden="true" />
                    <span className="confidence-label">High</span>
                    <span className="confidence-multiplier">2.0x</span>
                    <span className="confidence-note">Highest reward</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="onboarding-item">
              <span className="onboarding-dot" aria-hidden="true" />
              <div>
                <h3>Bonuses and Leaderboard</h3>
                <p>Earn bonus payouts and track wins on the leaderboard.</p>
              </div>
            </div>
          </div>

          <div className="onboarding-tips">
            <h4>Pro Tips</h4>
            <ul>
              <li>Start with smaller stakes while you learn.</li>
              <li>Mix confidence levels across games.</li>
              <li>Build streaks for extra bonuses.</li>
            </ul>
          </div>
        </div>

        <div className="onboarding-footer">
          <button className="onboarding-btn-primary" data-testid="onboarding-start" onClick={handleClose}>
            Let's Get Started
          </button>
          <button
            type="button"
            className="onboarding-link"
            onClick={() => navigate('/howto')}
          >
            Read full How to Use
          </button>
          <label className="onboarding-checkbox">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(event) => setDontShowAgain(event.target.checked)}
            />
            Don't show again
          </label>
        </div>
      </div>
    </div>
  );
}

export default React.memo(OnboardingModal);
