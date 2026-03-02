const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { supabase } = require('../supabase');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { getCurrencyName } = require('../utils/orgConfig');

// Get user's referral code
router.get('/code', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Generate referral code if doesn't exist
    if (!user.referral_code) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      await supabase
        .from('users')
        .update({ referral_code: code })
        .eq('id', req.user.id);
      
      return res.json({ referral_code: code });
    }
    
    res.json({ referral_code: user.referral_code });
  } catch (error) {
    console.error('Error getting referral code:', error);
    res.status(500).json({ error: 'Failed to get referral code' });
  }
});

// Get user's referral stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('*, referred:referred_id(username, created_at)')
      .eq('referrer_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter(r => r.status === 'completed').length;
    const totalEarned = referrals.reduce((sum, r) => {
      return sum + (r.referrer_rewarded ? r.referrer_reward : 0);
    }, 0);

    res.json({
      totalReferrals,
      completedReferrals,
      totalEarned,
      referrals
    });
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
});

// Apply referral code during registration (called from auth route)
const applyReferralCode = async (newUserId, referralCode) => {
  try {
    if (!referralCode) return;

    // Find referrer by code
    const { data: referrer, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (findError || !referrer) {
      return;
    }

    // Create referral record
    const { error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: newUserId,
        referral_code: referralCode.toUpperCase(),
        referrer_reward: 100,
        referred_reward: 50,
        status: 'pending'
      });

    if (insertError) throw insertError;

    // Give referred user immediate bonus
    await User.updateBalance(newUserId, 50);
    await Transaction.create(
      newUserId,
      'bonus',
      50,
      'Welcome bonus from referral!'
    );
    await Notification.create(
      newUserId,
      '🎁 Welcome Bonus!',
      `You received 50 ${await getCurrencyName()} from using a referral code!`,
      'referral_bonus'
    );

    // Notify referrer
    await Notification.create(
      referrer.id,
      '👋 New Referral!',
      `Someone used your referral code! You'll earn 100 ${await getCurrencyName()} when they place their first bet.`,
      'referral_pending'
    );

  } catch (error) {
    console.error('Error applying referral code:', error);
  }
};

// Complete referral (call this when referred user places first bet)
const completeReferral = async (userId) => {
  try {
    // Find pending referral for this user
    const { data: referral, error: findError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', userId)
      .eq('status', 'pending')
      .single();

    if (findError || !referral) return;

    // Mark as completed
    await supabase
      .from('referrals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        referrer_rewarded: true
      })
      .eq('id', referral.id);

    // Reward referrer
    await User.updateBalance(referral.referrer_id, referral.referrer_reward);
    await Transaction.create(
      referral.referrer_id,
      'bonus',
      referral.referrer_reward,
      'Referral reward - friend placed first bet!'
    );
    await Notification.create(
      referral.referrer_id,
      '💰 Referral Complete!',
      `Your referral placed their first bet! You earned ${referral.referrer_reward} ${await getCurrencyName()}!`,
      'referral_complete'
    );

  } catch (error) {
    console.error('Error completing referral:', error);
  }
};

// Validate referral code (public endpoint for registration form)
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ valid: false, error: 'Code required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username')
      .eq('referral_code', code.toUpperCase())
      .single();

    if (error || !user) {
      return res.json({ valid: false, error: 'Invalid referral code' });
    }

    res.json({ valid: true, referrer: user.username });
  } catch (error) {
    console.error('Error validating referral code:', error);
    res.status(500).json({ valid: false, error: 'Validation failed' });
  }
});

module.exports = router;
module.exports.applyReferralCode = applyReferralCode;
module.exports.completeReferral = completeReferral;
