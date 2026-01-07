const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly, optionalAuth } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

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

router.post('/gift-balance', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if ((user.balance ?? 0) > 0) {
      return res.json({ gifted: false, user });
    }
    const latestGift = await Transaction.findLatestGiftForUser(user.id);
    if (latestGift) {
      const giftTimestamp = new Date(latestGift.created_at).getTime();
      if (!Number.isNaN(giftTimestamp)) {
        const now = Date.now();
        const daysSinceGift = (now - giftTimestamp) / (1000 * 60 * 60 * 24);
        if (daysSinceGift < 7) {
          return res.json({ gifted: false, user });
        }
      }
    }
    const giftAmount = 500;
    await User.updateBalance(user.id, giftAmount);
    await Transaction.create(user.id, 'gift', giftAmount, 'Zero-balance courtesy gift');
    const updatedUser = await User.findById(user.id);
    return res.json({ gifted: true, giftAmount, user: updatedUser });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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

router.put('/:id/admin', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { isAdmin } = req.body;
    if (isAdmin === undefined) {
      return res.status(400).json({ error: 'isAdmin flag required' });
    }
    await User.setAdminStatus(req.params.id, isAdmin);
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    // Prevent deleting yourself
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    await User.delete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
