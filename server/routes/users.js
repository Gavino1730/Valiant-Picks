const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly, optionalAuth } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

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
    
    // If balance is above 0, clear any pending refill and return
    if ((user.balance ?? 0) > 0) {
      if (user.pending_refill_timestamp) {
        await User.clearPendingRefill(user.id);
      }
      return res.json({ gifted: false, user });
    }
    
    const now = Date.now();
    
    // If no pending refill timestamp, this is the first time hitting $0
    if (!user.pending_refill_timestamp) {
      // Set the timestamp - user must wait 72 hours from now
      await User.setPendingRefill(user.id, new Date());
      
      const updatedUser = await User.findById(user.id);
      return res.json({ 
        gifted: false, 
        pending: true,
        hoursRemaining: 72,
        message: 'Your refill will be available in 72 hours',
        user: updatedUser 
      });
    }
    
    // Check if 72 hours have passed since pending timestamp
    const pendingTimestamp = new Date(user.pending_refill_timestamp).getTime();
    const hoursSincePending = (now - pendingTimestamp) / (1000 * 60 * 60);
    
    // If less than 72 hours, user must wait
    if (hoursSincePending < 72) {
      const hoursRemaining = Math.ceil(72 - hoursSincePending);
      return res.json({ 
        gifted: false,
        pending: true,
        hoursRemaining,
        message: `Your refill will be available in ${hoursRemaining} hours`,
        user 
      });
    }
    
    // 72 hours have passed - grant the refill!
    const giftAmount = 500;
    await User.updateBalance(user.id, giftAmount);
    await User.clearPendingRefill(user.id);
    await Transaction.create(user.id, 'gift', giftAmount, 'Balance refill after 72-hour wait - spendable immediately');
    
    // Create notification for the gift
    await Notification.create(
      user.id,
      '🎁 Balance Refilled!',
      `Your 72-hour wait is complete! We've added ${giftAmount} Valiant Bucks to your account. These funds are spendable immediately.`,
      'balance_gift'
    );
    
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

router.put('/:id/reset-password', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: 'New password required' });
    }
    
    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await User.updatePassword(req.params.id, hashedPassword);
    
    // Notify user about password change
    await Notification.create(
      req.params.id,
      '🔒 Password Reset',
      'Your password has been reset by an administrator. Please use your new password to log in.',
      'password_reset'
    );
    
    res.json({ message: 'Password reset successfully', newPassword }); // Return the plaintext password so admin can share it
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
