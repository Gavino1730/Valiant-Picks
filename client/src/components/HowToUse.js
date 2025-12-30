import React from 'react';
import '../styles/HowToUse.css';

function HowToUse({ onNavigate }) {
  return (
    <div className="how-to-use">
      <div className="page-header">
        <h1>📚 How to Use Valiant Picks</h1>
        <p className="page-subtitle">Learn how to make predictions and climb the leaderboard</p>
      </div>

      {/* What is Valiant Picks */}
      <div className="card tutorial-section">
        <div className="section-icon">🎮</div>
        <h2>What is Valiant Picks?</h2>
        <p className="section-description">
          Valiant Picks is a fun, virtual prediction platform for Valiant Academy basketball games. 
          Use your <strong className="highlight">Valiant Bucks</strong> (virtual currency) to make predictions on game outcomes, 
          compete with your friends on the leaderboard, and show your school spirit!
        </p>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-icon">💰</div>
            <h4>No Real Money</h4>
            <p>100% free to play with virtual Valiant Bucks</p>
          </div>
          <div className="info-item">
            <div className="info-icon">🏀</div>
            <h4>Support Your Teams</h4>
            <p>Make predictions on Boys and Girls Basketball games</p>
          </div>
          <div className="info-item">
            <div className="info-icon">🏆</div>
            <h4>Compete & Win</h4>
            <p>Climb the leaderboard and earn bragging rights</p>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="card tutorial-section">
        <div className="section-icon">🚀</div>
        <h2>Getting Started</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Create Your Account</h3>
              <p>Sign up with a username, email, and password. You'll start with <strong>1,000 Valiant Bucks</strong>!</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Browse Available Games</h3>
              <p>Check the Dashboard or Browse Picks page to see upcoming games and prop bets.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Make Your Predictions</h3>
              <p>Pick a team, choose your confidence level, and stake your Valiant Bucks!</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Track Your Results</h3>
              <p>Watch your picks, see results, and track your winnings on the Dashboard and My Picks pages.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How to Place a Pick */}
      <div className="card tutorial-section">
        <div className="section-icon">🎯</div>
        <h2>How to Place a Pick</h2>
        <div className="tutorial-content">
          <h3>Step 1: Choose a Game</h3>
          <p>Select an upcoming game from the list. Games show team matchups, date, time, and countdown.</p>
          
          <h3>Step 2: Pick Your Winner</h3>
          <p>Click on the team you think will win - Home or Away.</p>
          
          <h3>Step 3: Select Confidence Level</h3>
          <div className="confidence-explainer">
            <div className="confidence-option low">
              <div className="confidence-header">
                <span className="confidence-name">Low Risk</span>
                <span className="confidence-mult">1.2x</span>
              </div>
              <p>Safest option with smaller returns. Great for obvious favorites.</p>
            </div>
            <div className="confidence-option medium">
              <div className="confidence-header">
                <span className="confidence-name">Medium Risk</span>
                <span className="confidence-mult">1.5x</span>
              </div>
              <p>Balanced risk and reward. Good for competitive matchups.</p>
            </div>
            <div className="confidence-option high">
              <div className="confidence-header">
                <span className="confidence-name">High Risk</span>
                <span className="confidence-mult">2.0x</span>
              </div>
              <p>Double your Valiant Bucks! Use when you're very confident.</p>
            </div>
          </div>
          
          <h3>Step 4: Enter Your Amount</h3>
          <p>Choose how many Valiant Bucks to stake. Quick buttons available for 50, 100, 250, or 500.</p>
          
          <h3>Step 5: Confirm Your Pick</h3>
          <p>Review the potential payout and click "Place Pick". You can only place <strong>one pick per game</strong>!</p>
        </div>
      </div>

      {/* Understanding Prop Bets */}
      <div className="card tutorial-section">
        <div className="section-icon">🎲</div>
        <h2>What are Prop Bets?</h2>
        <p className="section-description">
          Prop bets (proposition bets) are special predictions on specific outcomes or events. 
          Instead of picking which team wins, you predict things like:
        </p>
        <ul className="prop-examples">
          <li>Will a player score over 20 points?</li>
          <li>Will the game go into overtime?</li>
          <li>Will the total score be over 100?</li>
        </ul>
        <p>Prop bets have custom odds (like 1.8x or 2.5x) and usually expire before the game starts!</p>
      </div>

      {/* Tips & Strategies */}
      <div className="card tutorial-section">
        <div className="section-icon">💡</div>
        <h2>Tips & Strategies</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">🎯</div>
            <h4>Start Small</h4>
            <p>Don't risk all your Valiant Bucks on one game. Spread your picks to minimize risk.</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">📊</div>
            <h4>Check Team Stats</h4>
            <p>Visit the Teams page to see records, rankings, and schedules before making picks.</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">⏰</div>
            <h4>Pick Early</h4>
            <p>Make your predictions early - betting closes when the game starts!</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🏆</div>
            <h4>Track Performance</h4>
            <p>Review your win rate and adjust your strategy. Learn from past picks!</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">💰</div>
            <h4>Manage Your Bankroll</h4>
            <p>Keep some Valiant Bucks in reserve. You can't make picks if your balance is 0!</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🎲</div>
            <h4>Mix Confidence Levels</h4>
            <p>Use high confidence for games you're sure about, low confidence for riskier picks.</p>
          </div>
        </div>
      </div>

      {/* Navigation Guide */}
      <div className="card tutorial-section">
        <div className="section-icon">🧭</div>
        <h2>Page Guide</h2>
        <div className="nav-guide">
          <div className="nav-item">
            <div className="nav-icon">📊</div>
            <div className="nav-content">
              <h4>Dashboard</h4>
              <p>Your home base. See stats, place picks on upcoming games, and view recent activity.</p>
            </div>
          </div>
          <div className="nav-item">
            <div className="nav-icon">🎯</div>
            <div className="nav-content">
              <h4>Browse Picks</h4>
              <p>View all available games and prop bets in one place. Filter by Boys or Girls Basketball.</p>
            </div>
          </div>
          <div className="nav-item">
            <div className="nav-icon">📋</div>
            <div className="nav-content">
              <h4>My Picks</h4>
              <p>Track all your picks - pending, won, and lost. See your complete betting history.</p>
            </div>
          </div>
          <div className="nav-item">
            <div className="nav-icon">🏆</div>
            <div className="nav-content">
              <h4>Leaderboard</h4>
              <p>See how you rank against other users. Top balance wins bragging rights!</p>
            </div>
          </div>
          <div className="nav-item">
            <div className="nav-icon">🏀</div>
            <div className="nav-content">
              <h4>Teams</h4>
              <p>View team rosters, schedules, records, and stats for both Boys and Girls Basketball.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="card tutorial-section">
        <div className="section-icon">❓</div>
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          <div className="faq-item">
            <h4>What happens if I run out of Valiant Bucks?</h4>
            <p>Contact an admin - they can adjust balances if needed. Manage your picks wisely!</p>
          </div>
          <div className="faq-item">
            <h4>Can I cancel a pick after placing it?</h4>
            <p>No, picks are final once placed. Make sure you're confident before confirming!</p>
          </div>
          <div className="faq-item">
            <h4>When do I get my winnings?</h4>
            <p>Winnings are automatically credited to your balance after the admin resolves the game.</p>
          </div>
          <div className="faq-item">
            <h4>Can I place multiple picks on the same game?</h4>
            <p>No, only one pick per game. Choose wisely!</p>
          </div>
          <div className="faq-item">
            <h4>What's the difference between Boys and Girls Basketball?</h4>
            <p>Both are tracked separately with different teams, schedules, and games. You can bet on both!</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="card cta-section">
        <h2>Ready to Start?</h2>
        <p>Now that you know how it works, it's time to make your first pick!</p>
        <div className="cta-buttons">
          <button className="btn btn-primary" onClick={() => onNavigate('games')}>
            🎯 Browse Games
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
            📊 Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default HowToUse;
