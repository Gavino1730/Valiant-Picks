const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly, optionalAuth } = require('../middleware/auth');
const User = require('../models/User');

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', optionalAuth, async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/balance', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { balance } = req.body;
    if (balance === undefined) {
      return res.status(400).json({ error: 'Balance required' });
    }
    await User.setBalance(req.params.id, balance);
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
