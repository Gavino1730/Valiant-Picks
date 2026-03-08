import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/ThankYouModal.css';

const STORAGE_KEY = 'hasSeenThankYouV1';

const hasSeenModal = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

function ThankYouModal() {
  const [showModal, setShowModal] = useState(!hasSeenModal());
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (hasSeenModal()) setShowModal(false);
  }, []);

  const handleClose = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowModal(false);
  }, []);

  useEffect(() => {
    if (!showModal) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement;
    document.body.style.overflow = 'hidden';

    const trapFocus = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusableSelectors = [
        'button:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');
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
    <div
      className="ty-overlay"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="ty-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ty-title"
        aria-describedby="ty-body"
        ref={modalRef}
      >
        {/* Decorative stars */}
        <span className="ty-star ty-star-1" aria-hidden="true">★</span>
        <span className="ty-star ty-star-2" aria-hidden="true">★</span>
        <span className="ty-star ty-star-3" aria-hidden="true">✦</span>
        <span className="ty-star ty-star-4" aria-hidden="true">✦</span>
        <span className="ty-star ty-star-5" aria-hidden="true">★</span>

        <button
          className="ty-close"
          onClick={handleClose}
          aria-label="Close message"
          ref={closeButtonRef}
        >
          ✕
        </button>

        <div className="ty-badge" aria-hidden="true">{'\u{1F3C6}'}</div>

        <h1 className="ty-title" id="ty-title">Thanks for Playing</h1>

        <p className="ty-subtitle">Valiant Picks — 2025–26 Season</p>

        <div className="ty-body" id="ty-body">
          <p>
            Hopefully this made the season a little more fun and kept the community
            connected along the way.
          </p>
          <p>
            Congrats to both the boys and girls teams on great seasons — it was a
            pleasure having something to root for.
          </p>
          <p className="ty-highlight">
            Hoping to bring it back next year. See you then.
          </p>
        </div>

        <div className="ty-footer">
          <button className="ty-btn" onClick={handleClose}>
            Sounds Good
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ThankYouModal);
