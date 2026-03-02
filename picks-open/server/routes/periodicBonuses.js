const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly } = require('../middleware/auth');
const { supabase } = require('../supabase');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { getCurrencyName } = require('../utils/orgConfig');

// Get user's periodic bonuses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('periodic_bonuses')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching periodic bonuses:', error);
    res.status(500).json({ error: 'Failed to fetch bonuses' });
  }
});

// Claim a periodic bonus
router.post('/claim/:id', authenticateToken, async (req, res) => {
  try {
    const bonusId = parseInt(req.params.id);

    // Get bonus details
    const { data: bonus, error: fetchError } = await supabase
      .from('periodic_bonuses')
      .select('*')
      .eq('id', bonusId)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError) throw fetchError;
    if (!bonus) {
      return res.status(404).json({ error: 'Bonus not found' });
    }

    if (bonus.claimed) {
      return res.status(400).json({ error: 'Bonus already claimed' });
    }

    // Update bonus as claimed
    const { error: updateError } = await supabase
      .from('periodic_bonuses')
      .update({ claimed: true })
      .eq('id', bonusId);

    if (updateError) throw updateError;

    // Credit user balance
    await User.updateBalance(req.user.id, bonus.amount);

    // Create transaction record
    await Transaction.create(
      req.user.id,
      'bonus',
      bonus.amount,
      `${bonus.bonus_type} bonus: ${bonus.description}`
    );

    // Create notification
    await Notification.create(
      req.user.id,
      '🎁 Bonus Claimed!',
      `You claimed ${bonus.amount} ${await getCurrencyName()} from ${bonus.description}`,
      'bonus_claimed'
    );

    // Get updated balance
    const user = await User.findById(req.user.id);

    res.json({
      message: 'Bonus claimed successfully',
      amount: bonus.amount,
      newBalance: user.balance
    });
  } catch (error) {
    console.error('Error claiming periodic bonus:', error);
    res.status(500).json({ error: 'Failed to claim bonus' });
  }
});

// Admin: Award weekly bonuses manually
router.post('/award-weekly', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { data: bonusData, error } = await supabase
      .rpc('award_weekly_bonuses');

    if (error) throw error;

    // Insert bonus records
    const bonuses = bonusData.map(b => ({
      user_id: b.user_id,
      bonus_type: 'weekly_top10',
      amount: b.bonus,
      period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      period_end: new Date().toISOString().split('T')[0],
      rank: b.rank,
      description: `Weekly Top ${b.rank} Performer`,
      claimed: false
    }));

    if (bonuses.length > 0) {
      const { error: insertError } = await supabase
        .from('periodic_bonuses')
        .insert(bonuses);

      if (insertError) throw insertError;

      // Send notifications
      for (const bonus of bonuses) {
        await Notification.create(
          bonus.user_id,
          '🏆 Weekly Bonus Earned!',
          `You finished #${bonus.rank} this week! Claim your ${bonus.amount} ${await getCurrencyName()} bonus.`,
          'weekly_bonus'
        );
      }
    }

    res.json({
      message: 'Weekly bonuses awarded',
      count: bonuses.length,
      bonuses
    });
  } catch (error) {
    console.error('Error awarding weekly bonuses:', error);
    res.status(500).json({ error: 'Failed to award weekly bonuses' });
  }
});

// Get bonus multipliers configuration (public)
router.get('/multipliers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bonus_multipliers')
      .select('*')
      .eq('is_active', true)
      .order('bonus_type');

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching bonus multipliers:', error);
    res.status(500).json({ error: 'Failed to fetch bonus multipliers' });
  }
});

// Admin: Update bonus multiplier
router.put('/multipliers/:type', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { type } = req.params;
    const { multiplier, is_active } = req.body;

    const updateData = {};
    if (multiplier !== undefined) updateData.multiplier = multiplier;
    if (is_active !== undefined) updateData.is_active = is_active;
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('bonus_multipliers')
      .update(updateData)
      .eq('bonus_type', type);

    if (error) throw error;

    res.json({ message: 'Bonus multiplier updated successfully' });
  } catch (error) {
    console.error('Error updating bonus multiplier:', error);
    res.status(500).json({ error: 'Failed to update bonus multiplier' });
  }
});

module.exports = router;
