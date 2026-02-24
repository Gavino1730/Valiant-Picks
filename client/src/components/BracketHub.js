import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BracketHub.css';

function BracketHub() {
  const navigate = useNavigate();

  return (
    <div className="bracket-hub">
      <div className="bracket-hub__header">
        <h1 className="bracket-hub__title">🏆 Brackets</h1>
        <p className="bracket-hub__subtitle">Select a bracket to view or submit your picks</p>
      </div>

      <div className="bracket-hub__cards">
        <button
          className="bracket-hub__card bracket-hub__card--boys"
          onClick={() => navigate('/boys-bracket')}
        >
          <span className="bracket-hub__card-icon">🏀</span>
          <span className="bracket-hub__card-label">Boys Bracket</span>
          <span className="bracket-hub__card-arrow">→</span>
        </button>

        <button
          className="bracket-hub__card bracket-hub__card--girls"
          onClick={() => navigate('/girls-bracket')}
        >
          <span className="bracket-hub__card-icon">🎀</span>
          <span className="bracket-hub__card-label">Girls Bracket</span>
          <span className="bracket-hub__card-arrow">→</span>
        </button>

        <button
          className="bracket-hub__card bracket-hub__card--leaderboard"
          onClick={() => navigate('/bracket-leaderboard')}
        >
          <span className="bracket-hub__card-icon">📊</span>
          <span className="bracket-hub__card-label">Leaderboard</span>
          <span className="bracket-hub__card-arrow">→</span>
        </button>
      </div>
    </div>
  );
}

export default BracketHub;
