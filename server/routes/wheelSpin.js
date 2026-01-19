const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const WheelSpin = require('../models/WheelSpin');

// Get wheel configuration
router.get('/config', auth, async (req, res) => {
  try {
    const config = await WheelSpin.getConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting wheel config:', error);
    res.status(500).json({ message: 'Error fetching wheel configuration' });
  }
});

// Check if user can spin
router.get('/can-spin', auth, async (req, res) => {
  try {
    const result = await WheelSpin.canSpin(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error checking spin availability:', error);
    res.status(500).json({ message: 'Error checking spin availability' });
  }
});

// Spin the wheel
router.post('/spin', auth, async (req, res) => {
  try {
    const result = await WheelSpin.spin(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error spinning wheel:', error);
    res.status(400).json({ message: error.message || 'Error spinning wheel' });
  }
});

// Get spin history
router.get('/history', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const history = await WheelSpin.getHistory(req.user.id, limit);
    res.json(history);
  } catch (error) {
    console.error('Error fetching spin history:', error);
    res.status(500).json({ message: 'Error fetching spin history' });
  }
});

// Admin: Update wheel config
router.put('/config', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { prize_amounts, prize_weights, spins_per_day } = req.body;

    if (!prize_amounts || !prize_weights || !spins_per_day) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (prize_amounts.length !== prize_weights.length) {
      return res.status(400).json({ message: 'Prize amounts and weights must have same length' });
    }

    const config = await WheelSpin.updateConfig(prize_amounts, prize_weights, spins_per_day);
    res.json(config);
  } catch (error) {
    console.error('Error updating wheel config:', error);
    res.status(500).json({ message: 'Error updating wheel configuration' });
  }
});

module.exports = router;
