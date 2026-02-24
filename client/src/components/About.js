import React from 'react';
import '../styles/About.css';

function About() {
  const stats = {
    revisions: 661,
    developer: 'Gavin Galan',
    github: {
      repo: 'https://github.com/Gavino1730/Betting',
      commits: 661,
      branches: 'main',
      license: 'MIT'
    },
    files: {
      javascript: 76,
      css: 29,
      sql: 8,
      json: 4,
      markdown: 15,
      tests: 9,
      shell: 4
    },
    languages: [
      { name: 'JavaScript', percentage: 52, count: 76, color: '#F7DF1E' },
      { name: 'CSS', percentage: 20, count: 29, color: '#264de4' },
      { name: 'Markdown', percentage: 10, count: 15, color: '#083fa1' },
      { name: 'SQL', percentage: 5, count: 8, color: '#e38c00' },
      { name: 'Tests', percentage: 6, count: 9, color: '#16a34a' },
      { name: 'Other', percentage: 7, count: 8, color: '#888a9b' }
    ],
    components: [
      { category: 'React Components', count: 35 },
      { category: 'CSS Stylesheets', count: 29 },
      { category: 'API Routes', count: 12 },
      { category: 'Database Models', count: 10 },
      { category: 'Middleware', count: 3 },
      { category: 'E2E Tests', count: 9 },
      { category: 'Utilities', count: 8 },
      { category: 'SQL Scripts', count: 8 }
    ],
    stack: [
      { name: 'React', version: '18.2.0', role: 'Frontend Framework' },
      { name: 'Express.js', version: '4.x', role: 'Backend API' },
      { name: 'PostgreSQL', version: '14+', role: 'Database' },
      { name: 'Supabase', version: 'Cloud', role: 'Database Platform' },
      { name: 'JWT + bcryptjs', version: '-', role: 'Authentication' },
      { name: 'Axios', version: '1.x', role: 'HTTP Client' },
      { name: 'Playwright', version: '1.57', role: 'E2E Testing' },
      { name: 'Node.js', version: '18+', role: 'Runtime' }
    ],
    deployment: {
      backend: 'v1.0.0 - Production (Railway)',
      frontend: 'v1.0.0 - Production (Cloudflare Pages)',
      database: 'PostgreSQL 14+ (Supabase Cloud)',
      domain: 'valiantpicks.com'
    },
    timeline: {
      startDate: 'December 17, 2025',
      endDate: 'January 4, 2026',
      daysElapsed: 18,
      totalFiles: 52337,
      totalFolders: 7731,
      trackedFiles: 145
    },
    features: {
      routes: 12,
      models: 10,
      components: 35,
      pages: 15,
      adminFeatures: 8,
      userFeatures: 12
    }
  };

  return (
    <div className="about-page">
      <div className="about-header">
        <h1>ℹ️ About Valiant Picks</h1>
      </div>

      <div className="about-container">
        {/* Mission Section */}
        <section className="about-section mission-section">
          <h2>🎯 Our Mission</h2>
          <div className="mission-content">
            <p>
              Valiant Picks was created with a simple but powerful goal: <strong>to bring our community together</strong> and foster genuine engagement with Valiants sports.
            </p>
            
            <div className="mission-grid">
              <div className="mission-card">
                <div className="mission-icon">👥</div>
                <h3>Build Community</h3>
                <p>Connect teachers, students, parents, and players in a shared experience that goes beyond the game.</p>
              </div>
              <div className="mission-card">
                <div className="mission-icon">🏟️</div>
                <h3>Increase Attendance</h3>
                <p>Give everyone a reason to show up to games and support our teams with increased excitement and friendly competition.</p>
              </div>
              <div className="mission-card">
                <div className="mission-icon">⚡</div>
                <h3>Boost Engagement</h3>
                <p>Create a fun, accessible way for everyone to get involved with sports teams and stay invested in their success.</p>
              </div>
              <div className="mission-card">
                <div className="mission-icon">🤝</div>
                <h3>Strengthen Connections</h3>
                <p>Foster meaningful bonds between players, supporters, and the wider community through interactive participation.</p>
              </div>
            </div>

            <p className="mission-closer">
              By combining the excitement of sports with a virtual betting platform, Valiant Picks transforms how we experience games together. 
              It's not just about predictions—it's about building a vibrant community where everyone feels invested, supported, and connected.
            </p>
          </div>
        </section>

        {/* Git Stats with GitHub */}
        <section className="about-section">
          <h2>📈 Development History</h2>
          <div className="sole-creator">
            <div className="creator-title">✨ Entirely Created By</div>
            <div className="creator-name">{stats.developer}</div>
            <div className="creator-subtitle">All {stats.revisions} commits across {stats.timeline.trackedFiles} tracked files</div>
          </div>
          <div className="github-section">
            <div className="github-badge">
              <span className="github-icon">🔗</span>
              <a href={stats.github.repo} target="_blank" rel="noopener noreferrer" className="github-link">
                GitHub Repository
              </a>
            </div>
            <div className="github-details">
              <span className="github-stat">
                <strong>{stats.github.commits}</strong> commits
              </span>
              <span className="github-stat">
                <strong>{stats.github.license}</strong> License
              </span>
              <span className="github-stat">
                <strong>Open Source</strong> Available
              </span>
            </div>
          </div>
          <div className="about-grid">
            <div className="stat-card highlight">
              <div className="stat-number">{stats.revisions}</div>
              <div className="stat-label">Total Commits</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.timeline.trackedFiles}</div>
              <div className="stat-label">Tracked Files</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.features.routes}</div>
              <div className="stat-label">API Routes</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.features.components}</div>
              <div className="stat-label">Components</div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="about-section timeline-section">
          <h2>⏱️ Development Timeline</h2>
          <div className="timeline-content">
            <div className="timeline-item">
              <span className="timeline-label">Project Created</span>
              <span className="timeline-date">{stats.timeline.startDate}</span>
            </div>
            <div className="timeline-divider">↓</div>
            <div className="timeline-item">
              <span className="timeline-label">Completed</span>
              <span className="timeline-date">{stats.timeline.endDate}</span>
            </div>
          </div>
          <div className="timeline-stats">
            <div className="timeline-stat-card">
              <div className="timeline-stat-number">{stats.timeline.daysElapsed}</div>
              <div className="timeline-stat-label">Days</div>
            </div>
            <div className="timeline-stat-card">
              <div className="timeline-stat-number">{stats.timeline.totalFiles.toLocaleString()}</div>
              <div className="timeline-stat-label">Total Files</div>
            </div>
            <div className="timeline-stat-card">
              <div className="timeline-stat-number">{stats.timeline.totalFolders.toLocaleString()}</div>
              <div className="timeline-stat-label">Total Folders</div>
            </div>
          </div>
        </section>

        {/* Language Breakdown */}
        <section className="about-section">
          <h2>💻 Language Breakdown</h2>
          <div className="language-charts">
            {stats.languages.map((lang, idx) => (
              <div key={idx} className="language-item">
                <div className="language-header">
                  <span className="lang-name">{lang.name}</span>
                  <span className="lang-count">{lang.count} files</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                  />
                </div>
                <div className="lang-percentage">{lang.percentage}%</div>
              </div>
            ))}
          </div>
        </section>

        {/* Files by Type */}
        <section className="about-section">
          <h2>📁 Files by Type</h2>
          <div className="files-grid">
            <div className="file-card">
              <div className="file-icon">📄</div>
              <div className="file-name">JavaScript</div>
              <div className="file-count">{stats.files.javascript}</div>
            </div>
            <div className="file-card">
              <div className="file-icon">🎨</div>
              <div className="file-name">CSS</div>
              <div className="file-count">{stats.files.css}</div>
            </div>
            <div className="file-card">
              <div className="file-icon">📝</div>
              <div className="file-name">Markdown</div>
              <div className="file-count">{stats.files.markdown}</div>
            </div>
            <div className="file-card">
              <div className="file-icon">🧪</div>
              <div className="file-name">E2E Tests</div>
              <div className="file-count">{stats.files.tests}</div>
            </div>
            <div className="file-card">
              <div className="file-icon">🗄️</div>
              <div className="file-name">SQL</div>
              <div className="file-count">{stats.files.sql}</div>
            </div>
            <div className="file-card">
              <div className="file-icon">⚙️</div>
              <div className="file-name">JSON</div>
              <div className="file-count">{stats.files.json}</div>
            </div>
            <div className="file-card">
              <div className="file-icon">💻</div>
              <div className="file-name">Shell Scripts</div>
              <div className="file-count">{stats.files.shell}</div>
            </div>
          </div>
        </section>

        {/* Architecture */}
        <section className="about-section">
          <h2>🏗️ Architecture Breakdown</h2>
          <div className="architecture-grid">
            {stats.components.map((comp, idx) => (
              <div key={idx} className="arch-card">
                <div className="arch-count">{comp.count}</div>
                <div className="arch-label">{comp.category}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="about-section">
          <h2>🛠️ Tech Stack</h2>
          <div className="tech-table">
            <table>
              <thead>
                <tr>
                  <th>Technology</th>
                  <th>Version</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {stats.stack.map((tech, idx) => (
                  <tr key={idx}>
                    <td className="tech-name">{tech.name}</td>
                    <td className="tech-version">{tech.version}</td>
                    <td className="tech-role">{tech.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Deployment */}
        <section className="about-section">
          <h2>� Production Deployment</h2>
          <div className="deployment-cards">
            <div className="deploy-card">
              <div className="deploy-label">Live Site</div>
              <div className="deploy-value">
                <a href="https://valiantpicks.com" target="_blank" rel="noopener noreferrer" className="deploy-link">
                  {stats.deployment.domain}
                </a>
              </div>
            </div>
            <div className="deploy-card">
              <div className="deploy-label">Backend API</div>
              <div className="deploy-value">{stats.deployment.backend}</div>
            </div>
            <div className="deploy-card">
              <div className="deploy-label">Frontend Client</div>
              <div className="deploy-value">{stats.deployment.frontend}</div>
            </div>
            <div className="deploy-card">
              <div className="deploy-label">Database</div>
              <div className="deploy-value">{stats.deployment.database}</div>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="about-section summary-section">
          <h2>✨ Project Overview</h2>
          <div className="summary-content">
            <p>
              <strong>Valiant Picks</strong> is a comprehensive full-stack sports betting web application developed entirely from the ground up by <strong>Gavin Galan</strong>. 
              Built for the Valiants sports community, this production-ready application enables users to place confidence-based bets on games with virtual Valiant Bucks, 
              manage teams and player rosters, track betting history, compete on public leaderboards, and participate in tournament brackets.
            </p>
            
            <h3>Development Scale</h3>
            <p>
              The project represents a substantial solo development effort with <strong>{stats.github.commits} commits</strong> across <strong>{stats.timeline.trackedFiles} tracked files</strong> 
              over {stats.timeline.daysElapsed} days. The codebase includes {stats.features.components} React components, {stats.features.routes} API routes, 
              {stats.features.models} database models, and {stats.files.tests} comprehensive E2E tests built with Playwright. The complete source code is available on 
              <a href={stats.github.repo} target="_blank" rel="noopener noreferrer" className="inline-link"> GitHub</a> under the {stats.github.license} license.
            </p>

            <h3>Technical Architecture</h3>
            <p>
              The application follows a modern full-stack monorepo architecture with a React 18.2.0 frontend hosted on Cloudflare Pages and an Express.js 
              backend deployed on Railway. Data is persisted in a PostgreSQL 14+ database through Supabase, ensuring reliability and scalability. Authentication 
              is handled via JWT tokens with bcryptjs password hashing, providing secure user sessions. The production site is live at 
              <a href="https://valiantpicks.com" target="_blank" rel="noopener noreferrer" className="inline-link"> valiantpicks.com</a> with SSL encryption 
              and optimized performance through Cloudflare's CDN.
            </p>

            <h3>Key Capabilities</h3>
            <p>
              Users can authenticate with secure JWT tokens, browse available games across multiple sports, place bets with three confidence levels 
              (Low 1.2x, Medium 1.5x, High 2.0x), track their comprehensive betting history, view real-time leaderboards with position tracking, 
              explore team rosters with detailed player information, participate in tournament brackets, claim daily rewards and achievements, 
              spin the reward wheel, and receive real-time push notifications. Admin users gain access to a comprehensive dashboard for managing 
              games, teams, players, bets, brackets, user balances, and proposition bets with custom odds systems.
            </p>

            <h3>User Experience</h3>
            <p>
              The frontend is fully responsive across five breakpoints (1024px+, 768px, 520px, 480px, and below) ensuring seamless experiences on desktop, tablet, 
              and mobile devices. Features include a mobile slide-out navigation menu, real-time balance updates with animated counters, toast notifications, 
              onboarding modals for new users, comprehensive error handling with error boundaries, skeleton loading states, tooltips and confirmations, 
              and intuitive forms with validation feedback. The interface uses a professional color scheme anchored by #004f9e Valiant blue with careful 
              attention to accessibility and visual hierarchy.
            </p>

            <h3>Data & Security</h3>
            <p>
              The database includes 10 core models (User, Game, Team, Bet, PropBet, Notification, Player, Transaction, Achievement, WheelSpin, DailyLogin, Bracket) 
              with Row-Level Security (RLS) policies for data protection. All API endpoints are protected with JWT middleware at the route level, and user inputs 
              are validated both client-side and server-side with Joi schemas. The system maintains referential integrity through foreign keys and cascading deletes, 
              prevents overbetting by validating user balances before bet placement, automatically calculates and credits winnings upon bet resolution, tracks all 
              financial transactions with audit trails, and logs errors to the database for monitoring and debugging.
            </p>

            <h3>Testing & Quality Assurance</h3>
            <p>
              The project includes {stats.files.tests} comprehensive E2E test suites built with Playwright covering authentication flows, game management, 
              bet placement and resolution, admin panel functionality, team management, transaction tracking, bracket management, and reward systems. 
              Tests run across multiple browsers (Chromium, Firefox, WebKit) to ensure cross-browser compatibility. The test infrastructure includes 
              helper utilities for test data management and automated test result exports.
            </p>

            <div className="summary-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">🎯</span>
                <span>{stats.github.commits} commits across {stats.timeline.trackedFiles} tracked files</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">📱</span>
                <span>5-breakpoint responsive design for all devices</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🔐</span>
                <span>JWT + RLS security with comprehensive validation</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">⚡</span>
                <span>Production-ready with Railway + Cloudflare deployment</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🎲</span>
                <span>Confidence-based betting with live odds and brackets</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">📊</span>
                <span>Real-time leaderboards and transaction tracking</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🧪</span>
                <span>{stats.files.tests} E2E test suites with Playwright automation</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🔗</span>
                <span>Open source on GitHub with {stats.github.license} license</span>
              </div>
            </div>

            <div className="github-cta">
              <p>Want to explore the code or contribute to the project?</p>
              <a href={stats.github.repo} target="_blank" rel="noopener noreferrer" className="github-button">
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
