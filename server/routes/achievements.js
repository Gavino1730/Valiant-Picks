const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Achievement = require('../models/Achievement');

// Get user achievements
router.get('/', auth, async (req, res) => {
  try {
    const achievements = await Achievement.getUserAchievements(req.user.id);
    res.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ message: 'Error fetching achievements' });
  }
});

// Get unclaimed achievements
router.get('/unclaimed', auth, async (req, res) => {
  try {
    const achievements = await Achievement.getUnclaimedAchievements(req.user.id);
    res.json(achievements);
  } catch (error) {
    console.error('Error fetching unclaimed achievements:', error);
    res.status(500).json({ message: 'Error fetching unclaimed achievements' });
  }
});

// Claim achievement reward
router.post('/claim/:id', auth, async (req, res) => {
  try {
    const achievementId = parseInt(req.params.id);
    const result = await Achievement.claimAchievement(achievementId, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error claiming achievement:', error);
    res.status(400).json({ message: error.message || 'Error claiming achievement' });
  }
});

// Check for "all games bet" achievement
router.post('/check-all-games', auth, async (req, res) => {
  try {
    const achievement = await Achievement.checkAllGamesBet(req.user.id);
    res.json({ achievement });
  } catch (error) {
    console.error('Error checking all games achievement:', error);
    res.status(500).json({ message: 'Error checking achievement' });
  }
});

module.exports = router;
