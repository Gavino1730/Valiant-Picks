const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;
// Default off unless explicitly enabled
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED === 'true';
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || `${15 * 60 * 1000}`, 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '5000', 10);
const AUTH_RATE_LIMIT_MAX = parseInt(process.env.AUTH_RATE_LIMIT_MAX || '100', 10);

// Trust proxy - Required for Railway and other proxy services
app.set('trust proxy', 1);

// Enable gzip compression for all responses
app.use(compression({
  filter: (req, res) => {
    // Compress responses larger than 1KB
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Balance between speed and compression ratio (0-9, default is 6)
}));

// Rate limiting
const limiter = RATE_LIMIT_ENABLED ? rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: 'Too many requests, please try again later.'
}) : null;

const authLimiter = RATE_LIMIT_ENABLED ? rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX,
  message: 'Too many authentication attempts, please try again later.'
}) : null;

// Middleware
app.use(cors({
  origin: [
    'https://valiantpicks.com',
    'https://betting-6i9.pages.dev',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
if (limiter) {
  app.use(limiter);
}
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
if (authLimiter) {
  app.use('/api/auth', authLimiter, require('./routes/auth'));
} else {
  app.use('/api/auth', require('./routes/auth'));
}
app.use('/api/users', require('./routes/users'));
app.use('/api/bets', require('./routes/bets'));
app.use('/api/games', require('./routes/games'));
app.use('/api/prop-bets', require('./routes/propBets'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/teams-admin', require('./routes/teamsAdmin'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
