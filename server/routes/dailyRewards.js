const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const DailyLogin = require('../models/DailyLogin');

// Record login and check for reward
router.post('/record', auth, async (req, res) => {
  try {
    const result = await DailyLogin.recordLogin(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error recording login:', error);
    res.status(500).json({ message: 'Error recording login' });
  }
});

// Claim daily reward
router.post('/claim', auth, async (req, res) => {
  try {
    const result = await DailyLogin.claimReward(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(400).json({ message: error.message || 'Error claiming reward' });
  }
});

// Get login history
router.get('/history', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const history = await DailyLogin.getLoginHistory(req.user.id, limit);
    res.json(history);
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({ message: 'Error fetching login history' });
  }
});

// Get current streak
router.get('/streak', auth, async (req, res) => {
  try {
    const streak = await DailyLogin.getCurrentStreak(req.user.id);
    res.json({ streak });
  } catch (error) {
    console.error('Error fetching streak:', error);
    res.status(500).json({ message: 'Error fetching streak' });
  }
});

module.exports = router;
