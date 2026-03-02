import React from 'react';
import '../styles/About.css';

const GITHUB_REPO = 'https://github.com/Gavino1730/Betting';

function About() {
  return (
    <div className="about-page">
      <div className="about-header">
        <h1>ℹ️ About Valiant Picks</h1>
      </div>

      <div className="about-container">

        {/* Why I Built This */}
        <section className="about-section mission-section">
          <h2>👋 From the Developer</h2>
          <div className="mission-content">
            <p>
              Hey — I'm <strong>Gavin</strong>, the developer behind Valiant Picks. I built this project because I wanted a way to 
              get people genuinely excited about supporting their sports teams. Most sports communities don't have an easy, 
              fun way to stay engaged beyond just watching games, so I wanted to fix that.
            </p>
            <p>
              The idea was simple: give everyone a stake in the game. When you have virtual Bucks on the line and you're 
              watching a leaderboard shift in real time, suddenly every game matters a lot more. It's not about real money — 
              it's about friendly competition, community pride, and having a reason to show up.
            </p>
            <p className="mission-closer">
              I built this as a solo full-stack project from scratch, and I've open-sourced it so that other developers or 
              organizations can pick it up, fork it, and adapt it for their own communities. Whether you're running it for 
              a school, a local league, or a friend group — the whole thing is configurable and self-hostable.
            </p>
          </div>
        </section>

        {/* What It Does */}
        <section className="about-section">
          <h2>🎯 What Valiant Picks Does</h2>
          <div className="mission-content">
            <div className="mission-grid">
              <div className="mission-card">
                <div className="mission-icon">🪙</div>
                <h3>Virtual Betting</h3>
                <p>Users bet with virtual Bucks on games using three confidence levels — Low (1.2x), Medium (1.5x), or High (2.0x) — keeping things fun without real money.</p>
              </div>
              <div className="mission-card">
                <div className="mission-icon">🏆</div>
                <h3>Leaderboards</h3>
                <p>A live public leaderboard tracks everyone's balance so the competition never stops, even between game days.</p>
              </div>
              <div className="mission-card">
                <div className="mission-icon">🎲</div>
                <h3>Prop Bets & Brackets</h3>
                <p>Admins can create custom prop bets with YES/NO outcomes and set up tournament brackets for extra engagement.</p>
              </div>
              <div className="mission-card">
                <div className="mission-icon">🛠️</div>
                <h3>Full Admin Control</h3>
                <p>A built-in admin panel lets you manage games, teams, players, bets, user balances, and resolve outcomes — no extra tools needed.</p>
              </div>
              <div className="mission-card">
                <div className="mission-icon">🎁</div>
                <h3>Rewards & Achievements</h3>
                <p>Daily login rewards, a spin wheel, and an achievements system keep users coming back and reward consistent engagement.</p>
              </div>
              <div className="mission-card">
                <div className="mission-icon">📱</div>
                <h3>Fully Responsive</h3>
                <p>Works on desktop, tablet, and mobile with a smooth, modern UI and real-time notifications built in.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Overview */}
        <section className="about-section">
          <h2>🛠️ How It's Built</h2>
          <div className="mission-content">
            <p>
              The stack is React on the frontend, Express.js on the backend, and PostgreSQL via Supabase for the database. 
              Authentication is handled with JWT tokens and bcryptjs. The whole thing is designed to be deployed on 
              <strong> Railway</strong> (backend) and <strong>Cloudflare Pages</strong> (frontend), though you can host it anywhere.
            </p>
            <p>
              The source code is organized as a monorepo with a <code>/client</code> and <code>/server</code> directory. 
              The database schema is included as a single SQL file you can run in Supabase to get started immediately. 
              Setup instructions are in the README.
            </p>
          </div>
        </section>

        {/* GitHub CTA */}
        <section className="about-section summary-section">
          <div className="summary-content">
            <div className="github-cta">
              <p>Want to use this for your own community, explore the code, or contribute?</p>
              <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="github-button">
                <span className="github-icon">⭐</span>
                View on GitHub
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default About;
