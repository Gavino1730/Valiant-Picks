const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly } = require('../middleware/auth');

// In-memory settings store (resets on server restart; swap for DB if persistence is needed)
const settings = {
  leaderboard_frozen: false,
};

// GET /api/settings — public (leaderboard needs to read this without auth)
router.get('/', (req, res) => {
  res.json({ success: true, settings });
});

// PUT /api/settings — admin only
router.put('/', authenticateToken, adminOnly, (req, res) => {
  const { leaderboard_frozen } = req.body;

  if (typeof leaderboard_frozen === 'boolean') {
    settings.leaderboard_frozen = leaderboard_frozen;
  }

  res.json({ success: true, settings });
});

module.exports = router;
