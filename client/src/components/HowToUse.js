import React, { useEffect, useState } from 'react';
import '../styles/HowToUse.css';

function HowToUse({ onNavigate }) {
  const [isMobile, setIsMobile] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setOpenFaqIndex(mobile ? null : 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFaqToggle = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="how-to-use">
      <div className="page-header">
        <h1>📚 How to Use Valiant Picks</h1>
      </div>

      {/* What is Valiant Picks */}
      <section className="card tutorial-section section-card">
        <div className="section-header">
          <span className="section-icon">🎮</span>
          <h2>What is Valiant Picks?</h2>
        </div>
        <p className="section-description">
          Valiant Picks is a fun, virtual prediction platform for Valiants sports games.
          Use your <strong className="highlight">Valiant Bucks</strong> (virtual currency) to make predictions on game outcomes,
          compete with your friends on the leaderboard, and show your school spirit!
        </p>
        <div className="info-row">
          <div className="info-item">
            <div className="info-icon">💰</div>
            <div className="info-text">
              <h4>No Real Money</h4>
              <p>100% free to play with virtual Valiant Bucks</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">🏀</div>
            <div className="info-text">
              <h4>Support Your Teams</h4>
              <p>Make predictions on Boys and Girls Basketball games</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">🏆</div>
            <div className="info-text">
              <h4>Compete & Win</h4>
              <p>Climb the leaderboard and earn bragging rights</p>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="card tutorial-section section-card">
        <div className="section-header">
          <span className="section-icon">🚀</span>
          <h2>Getting Started</h2>
        </div>
        <ol className="steps-list">
          <li>
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Create Your Account</h3>
              <p>Sign up with a username, email, and password. You'll start with <strong>1,000 Valiant Bucks</strong>!</p>
            </div>
          </li>
          <li>
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Browse Available Games</h3>
              <p>Check the Dashboard or Place Picks page to see upcoming games and prop bets.</p>
            </div>
          </li>
          <li>
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Make Your Predictions</h3>
              <p>Pick a team, choose your confidence level, and stake your Valiant Bucks!</p>
            </div>
          </li>
          <li>
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Track Your Results</h3>
              <p>Watch your picks, see results, and track your winnings on the Dashboard and My Picks pages.</p>
            </div>
          </li>
        </ol>
      </section>

      {/* How to Place a Pick */}
      <section className="card tutorial-section section-card highlight-section">
        <div className="section-header">
          <span className="section-icon">🎯</span>
          <h2>How to Place a Pick</h2>
        </div>
        <div className="tutorial-content">
          <div className="tutorial-step">
            <h3>Step 1: Choose a Game</h3>
            <p>Select an upcoming game from the list. Games show team matchups, date, time, and countdown.</p>
          </div>

          <div className="tutorial-step">
            <h3>Step 2: Pick Your Winner</h3>
            <p>Click on the team you think will win - Home or Away.</p>
          </div>

          <div className="tutorial-step">
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
          </div>

          <div className="tutorial-step">
            <h3>Step 4: Enter Your Amount</h3>
            <p>Choose how many Valiant Bucks to stake. Quick buttons available for 50, 100, 250, or 500.</p>
          </div>

          <div className="tutorial-step">
            <h3>Step 5: Confirm Your Pick</h3>
            <p>Review the potential payout and click "Place Pick". You can only place <strong>one pick per game</strong>!</p>
          </div>
        </div>
      </section>

      {/* Understanding Prop Bets */}
      <details className="card tutorial-section section-card collapsible-section" open={!isMobile}>
        <summary className="section-summary">
          <span className="section-icon">🎲</span>
          <h2>What are Prop Bets?</h2>
        </summary>
        <div className="compact-box">
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
      </details>

      {/* Betting Bonuses */}
      <details className="card tutorial-section section-card collapsible-section" open={!isMobile}>
        <summary className="section-summary">
          <span className="section-icon">🎁</span>
          <h2>Betting Bonuses & Incentives</h2>
        </summary>
        <p className="section-description">
          Earn extra Valiant Bucks on your winnings! Different game types offer different bonuses:
        </p>
        <div className="bonus-tiers">
          <div className="bonus-tier girls">
            <div className="bonus-header">
              <span className="bonus-icon">💗</span>
              <h4>Girls Games</h4>
            </div>
            <ul>
              <li><strong>10% base bonus</strong> on all girls game bets</li>
              <li><strong>+5%</strong> for 3+ consecutive girls bets</li>
              <li><strong>+10%</strong> for 7+ consecutive girls bets</li>
              <li className="bonus-max">Maximum: 25% bonus (+5% on weekends!)</li>
            </ul>
          </div>
          <div className="bonus-tier boys">
            <div className="bonus-header">
              <span className="bonus-icon">🏀</span>
              <h4>Boys Games</h4>
            </div>
            <ul>
              <li><strong>5% base bonus</strong> on all boys game bets</li>
              <li><strong>+3%</strong> for 3+ consecutive boys bets</li>
              <li><strong>+5%</strong> for 7+ consecutive boys bets</li>
              <li className="bonus-max">Maximum: 15% bonus (+5% on weekends!)</li>
            </ul>
          </div>
          <div className="bonus-tier general">
            <div className="bonus-header">
              <span className="bonus-icon">🔥</span>
              <h4>Streak Bonuses</h4>
            </div>
            <ul>
              <li><strong>+2% base</strong> for betting daily</li>
              <li><strong>+3%</strong> for betting 3 days in a row</li>
              <li><strong>+5%</strong> for betting 7 days in a row</li>
              <li className="bonus-max">Stacks with game bonuses (+5% on weekends!)</li>
            </ul>
          </div>
        </div>
        <div className="bonus-example">
          <h4>💰 Examples:</h4>
          <p>Win 200 VB on a girls game with 15% bonus = <strong>230 Bucks total!</strong></p>
          <p>Win 200 VB on a boys game with 10% bonus = <strong>220 Bucks total!</strong></p>
          <p className="bonus-tip">💡 Tip: Build streaks and bet on weekends for maximum bonuses on ALL games!</p>
        </div>
      </details>

      {/* Tips & Strategies */}
      <details className="card tutorial-section section-card collapsible-section" open={!isMobile}>
        <summary className="section-summary">
          <span className="section-icon">💡</span>
          <h2>Tips & Strategies</h2>
        </summary>
        <ul className="tips-list">
          <li>
            <span className="tip-icon">🎯</span>
            <div>
              <h4>Start Small</h4>
              <p>Don't risk all your Valiant Bucks on one game. Spread your picks to minimize risk.</p>
            </div>
          </li>
          <li>
            <span className="tip-icon">💡</span>
            <div>
              <h4>Earn Bonuses</h4>
              <p>All games offer bonus payouts! Girls games up to 25%, Boys games up to 15%, plus streak bonuses!</p>
            </div>
          </li>
          <li>
            <span className="tip-icon">📊</span>
            <div>
              <h4>Check Team Stats</h4>
              <p>Visit the Teams page to see records, rankings, and schedules before making picks.</p>
            </div>
          </li>
          <li>
            <span className="tip-icon">🔥</span>
            <div>
              <h4>Build Streaks</h4>
              <p>Consecutive bets on the same game type earn streak bonuses. Keep it going!</p>
            </div>
          </li>
          <li>
            <span className="tip-icon">⏰</span>
            <div>
              <h4>Pick Early</h4>
              <p>Make your predictions early - betting closes when the game starts!</p>
            </div>
          </li>
          <li>
            <span className="tip-icon">🎉</span>
            <div>
              <h4>Weekend Betting</h4>
              <p>Extra 5% bonus on ALL bets during weekends! Stack it with other bonuses.</p>
            </div>
          </li>
          <li>
            <span className="tip-icon">🏆</span>
            <div>
              <h4>Track Performance</h4>
              <p>Review your win rate and adjust your strategy. Learn from past picks!</p>
            </div>
          </li>
          <li>
            <span className="tip-icon">💰</span>
            <div>
              <h4>Manage Your Bankroll</h4>
              <p>Keep some Valiant Bucks in reserve. You can't make picks if your balance is 0!</p>
            </div>
          </li>
          <li>
            <span className="tip-icon">🎲</span>
            <div>
              <h4>Mix Confidence Levels</h4>
              <p>Use high confidence for games you're sure about, low confidence for riskier picks.</p>
            </div>
          </li>
          <li>
            <span className="tip-icon">📅</span>
            <div>
              <h4>Daily Bets</h4>
              <p>Bet every day to build your daily streak bonus. Even small bets count!</p>
            </div>
          </li>
        </ul>
      </details>

      {/* Navigation Guide */}
      <details className="card tutorial-section section-card collapsible-section" open={!isMobile}>
        <summary className="section-summary">
          <span className="section-icon">🧭</span>
          <h2>Page Guide</h2>
        </summary>
        <ul className="nav-guide-list">
          <li>
            <span className="nav-icon">📊</span>
            <div className="nav-content">
              <h4>Dashboard</h4>
              <p>Your home base. See stats, place picks on upcoming games, and view recent activity.</p>
            </div>
          </li>
          <li>
            <span className="nav-icon">🎯</span>
            <div className="nav-content">
              <h4>Place Picks</h4>
              <p>View all available games and prop bets in one place. Filter by Boys or Girls Basketball.</p>
            </div>
          </li>
          <li>
            <span className="nav-icon">📋</span>
            <div className="nav-content">
              <h4>My Picks</h4>
              <p>Track all your picks - pending, won, and lost. See your complete betting history.</p>
            </div>
          </li>
          <li>
            <span className="nav-icon">🏆</span>
            <div className="nav-content">
              <h4>Leaderboard</h4>
              <p>See how you rank against other users. Top balance wins bragging rights!</p>
            </div>
          </li>
          <li>
            <span className="nav-icon">🏀</span>
            <div className="nav-content">
              <h4>Teams</h4>
              <p>View team rosters, schedules, records, and stats for both Boys and Girls Basketball.</p>
            </div>
          </li>
        </ul>
      </details>

      {/* FAQ */}
      <section className="card tutorial-section section-card">
        <div className="section-header">
          <span className="section-icon">❓</span>
          <h2>Frequently Asked Questions</h2>
        </div>
        <div className="faq-list">
          {[
            {
              question: 'What happens if I run out of Valiant Bucks?',
              answer: 'Contact an admin - they can adjust balances if needed. Manage your picks wisely!',
            },
            {
              question: 'Can I cancel a pick after placing it?',
              answer: "No, picks are final once placed. Make sure you're confident before confirming!",
            },
            {
              question: 'When do I get my winnings?',
              answer: 'Winnings are automatically credited to your balance after the admin resolves the game.',
            },
            {
              question: 'Can I place multiple picks on the same game?',
              answer: 'No, only one pick per game. Choose wisely!',
            },
            {
              question: "What's the difference between Boys and Girls Basketball?",
              answer: 'Both are tracked separately with different teams, schedules, and games. You can bet on both!',
            },
          ].map((faq, index) => (
            <details
              key={faq.question}
              className="faq-item"
              open={openFaqIndex === index}
              onToggle={() => handleFaqToggle(index)}
            >
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

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
          <button className="btn btn-secondary" onClick={() => onNavigate('about')}>
            ℹ️ About Valiant Picks
          </button>
        </div>
      </div>
    </div>
  );
}

export default HowToUse;
