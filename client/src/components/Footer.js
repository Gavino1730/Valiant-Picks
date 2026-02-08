import React from 'react';
import '../styles/Footer.css';

function Footer({ onNavigate }) {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-links">
          <button 
            className="footer-link"
            onClick={() => onNavigate('about')}
          >
            About
          </button>
          <span className="footer-divider">•</span>
          <button 
            className="footer-link"
            onClick={() => onNavigate('terms')}
          >
            Terms
          </button>
        </div>
        <div className="footer-credit">
          <p>© 2026 Valiant Picks.</p>
          <p className="footer-disclaimer">Valiant Picks is an independent platform and is not affiliated with, endorsed by, or associated with any school, organization, or institution.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
