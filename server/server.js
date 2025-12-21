const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - Required for Railway and other proxy services
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit login/register attempts
  message: 'Too many authentication attempts, please try again later.'
});

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
app.use(limiter);
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
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
