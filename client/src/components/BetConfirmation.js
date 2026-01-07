import React from 'react';
import '../styles/BetConfirmation.css';
import { formatCurrency } from '../utils/currency';

function BetConfirmation({ isOpen, bet, onConfirm, onCancel, potentialWin, isSubmitting }) {
  if (!isOpen || !bet) return null;

  return (
    <div className="confirmation-overlay" onClick={isSubmitting ? undefined : onCancel}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-header">
          <h2>📋 Confirm Your Pick</h2>
          <button className="confirmation-close" onClick={onCancel} disabled={isSubmitting}>✕</button>
        </div>

        <div className="confirmation-content">
          <div className="confirmation-section">
            <label>Team Selected</label>
            <div className="confirmation-value team-name">{bet.team}</div>
          </div>

          <div className="confirmation-section">
            <label>Pick Amount</label>
            <div className="confirmation-value amount">{formatCurrency(bet.amount)}</div>
          </div>

          <div className="confirmation-section">
            <label>Confidence Level</label>
            <div className="confirmation-value confidence">
              <span className={`confidence-badge ${bet.confidence}`}>
                {bet.confidence.charAt(0).toUpperCase() + bet.confidence.slice(1)}
              </span>
              <span className="multiplier">{bet.odds}x</span>
            </div>
          </div>

          <div className="confirmation-divider"></div>

          <div className="confirmation-section highlight">
            <label>Potential Win</label>
            <div className="confirmation-value win-amount">
              {formatCurrency(potentialWin)}
            </div>
            <p className="win-note">If your pick wins, you'll receive this amount</p>
          </div>

          <div className="confirmation-breakdown">
            <div className="breakdown-row">
              <span>Your stake:</span>
              <span>{formatCurrency(bet.amount)}</span>
            </div>
            <div className="breakdown-row">
              <span>Multiplier:</span>
              <span>{bet.odds}x</span>
            </div>
            <div className="breakdown-row highlight">
              <span>You'll earn:</span>
              <span className="earn-amount">{formatCurrency(potentialWin - bet.amount)}</span>
            </div>
          </div>
        </div>

        <div className="confirmation-footer">
          <button className="btn-cancel" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="btn-confirm" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Placing...' : 'Confirm Pick ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BetConfirmation;
