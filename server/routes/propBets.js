const express = require('express');
const router = express.Router();
const PropBet = require('../models/PropBet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authenticateToken } = require('../middleware/auth');

// Get all active prop bets (public - visible only, admin - all)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    // Admins see all prop bets, regular users only see visible ones
    const propBets = user.is_admin ? await PropBet.getAll() : await PropBet.getVisible();
    res.json(propBets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single prop bet (public)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const propBet = await PropBet.getById(req.params.id);
    if (!propBet) {
      return res.status(404).json({ error: 'Prop bet not found' });
    }
    res.json(propBet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create prop bet (admin only)
router.post('/', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can create prop bets' });
  }

  const { title, description, teamType, yesOdds, noOdds, expiresAt, options, optionOdds } = req.body;

  // Validate required fields
  if (!title) {
    return res.status(400).json({ error: 'Missing required field: title' });
  }

  // Support both old format (yesOdds/noOdds) and new format (options/optionOdds)
  let finalYesOdds, finalNoOdds, finalOptionOdds;
  
  if (options && options.length >= 2 && optionOdds) {
    // New format: custom options
    finalOptionOdds = optionOdds;
    // Extract yes/no odds for backward compatibility
    finalYesOdds = optionOdds[options[0]] || 1.5;
    finalNoOdds = optionOdds[options[1]] || 1.5;
  } else if (yesOdds && noOdds) {
    // Old format: yesOdds/noOdds
    finalYesOdds = yesOdds;
    finalNoOdds = noOdds;
    finalOptionOdds = { 'Yes': yesOdds, 'No': noOdds };
  } else {
    return res.status(400).json({ error: 'Please provide odds for all options' });
  }

  try {
    const result = await PropBet.create({
      title,
      description,
      teamType: teamType || 'General',
      yesOdds: finalYesOdds,
      noOdds: finalNoOdds,
      options,
      optionOdds: finalOptionOdds,
      expiresAt
    });

    res.status(201).json({
      message: 'Prop bet created successfully',
      propBetId: result.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update prop bet status/outcome (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can update prop bets' });
  }

  const { status, outcome } = req.body;

  try {
    const { supabase } = require('../supabase');
    const Bet = require('../models/Bet');
    
    // Update prop bet status
    await PropBet.updateStatus(req.params.id, status, outcome);

    let betsResolved = 0;

// Toggle prop bet visibility (admin only)
router.put('/:id/visibility', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can toggle visibility' });
  }

  try {
    const result = await PropBet.toggleVisibility(req.params.id);
    res.json({ 
      message: 'Visibility toggled successfully',
      is_visible: result.is_visible 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
    let winningsDistributed = 0;

    // If outcome is set (yes or no), resolve all associated bets
    if (outcome && (outcome === 'yes' || outcome === 'no')) {
      // Get all pending bets for this prop bet
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('game_id', req.params.id)
        .eq('status', 'pending')
        .like('bet_type', 'prop-%');

      if (betsError) throw betsError;

      // Process each bet
      for (const bet of bets || []) {
        // Extract the user's choice from bet_type (e.g., "prop-yes" -> "yes")
        const betChoice = bet.bet_type.replace('prop-', '').toLowerCase();
        const won = betChoice === outcome.toLowerCase();
        const betOutcome = won ? 'won' : 'lost';

        // Update bet status
        await Bet.updateStatus(bet.id, 'resolved', betOutcome);

        // Create notification
        const Notification = require('../models/Notification');
        const propBet = await PropBet.getById(req.params.id);
        
        if (won) {
          const winnings = bet.amount * bet.odds;
          await User.updateBalance(bet.user_id, winnings);
          await Transaction.create(
            bet.user_id, 
            'win', 
            winnings, 
            `Won prop bet: ${bet.selected_team}`
          );
          await Notification.create(
            bet.user_id,
            '🎉 Prop Bet Won!',
            `Your prop bet "${propBet?.title}" won ${winnings} Valiant Bucks!`,
            'bet_won'
          );
          winningsDistributed += winnings;
        } else {
          await Notification.create(
            bet.user_id,
            '😔 Prop Bet Lost',
            `Your prop bet "${propBet?.title}" lost.`,
            'bet_lost'
          );
        }

        betsResolved++;
      }
    }

    res.json({ 
      message: outcome ? 'Prop bet outcome set and bets resolved' : 'Prop bet updated successfully',
      betsResolved,
      winningsDistributed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete prop bet (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can delete prop bets' });
  }

  try {
    await PropBet.delete(req.params.id);
    res.json({ message: 'Prop bet deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Place a bet on a prop bet (users)
router.post('/place', authenticateToken, async (req, res) => {
  try {
    const { propBetId, choice, amount } = req.body;
    
    // Validate input
    if (!propBetId || !choice || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }

    // Allow any non-empty choice string (supports both yes/no and custom options like "vc", "tillamook")
    if (!choice || typeof choice !== 'string' || choice.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid choice provided' });
    }

    const normalizedChoice = choice.toLowerCase().trim();

    // Check prop bet exists and is active
    const propBet = await PropBet.getById(propBetId);
    if (!propBet) {
      return res.status(404).json({ error: 'Prop bet not found' });
    }

    if (propBet.status !== 'active') {
      return res.status(400).json({ error: 'This prop bet is no longer active' });
    }

    const expiresAt = propBet.expires_at ? new Date(propBet.expires_at) : null;
    const hasExpired = expiresAt && !Number.isNaN(expiresAt.getTime()) && Date.now() >= expiresAt.getTime();

    if (hasExpired) {
      return res.status(400).json({ error: 'This prop bet has expired' });
    }

    // Check user balance
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.balance < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Calculate potential win - support both custom options and legacy yes/no
    let odds = 1.5; // Default fallback
    
    if (propBet.options && propBet.options.length > 0 && propBet.option_odds) {
      // Custom options - find matching option case-insensitively
      const matchedOption = propBet.options.find(opt => opt.toLowerCase() === normalizedChoice);
      if (matchedOption && propBet.option_odds[matchedOption]) {
        odds = parseFloat(propBet.option_odds[matchedOption]);
      }
    } else {
      // Legacy yes/no format
      odds = normalizedChoice === 'yes' ? propBet.yes_odds : propBet.no_odds;
    }

    const potentialWin = parsedAmount * odds;

    // Create bet record (using bets table with special marker for prop bets)
    const { supabase } = require('../supabase');
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        user_id: req.user.id,
        game_id: propBetId, // Store prop bet ID in game_id field
        bet_type: `prop-${normalizedChoice}`, // Mark as prop bet with choice
        selected_team: choice, // Store original choice (preserves case and formatting)
        amount: parsedAmount,
        odds: odds,
        status: 'pending',
        potential_win: potentialWin
      })
      .select()
      .single();

    if (betError) throw betError;

    // Deduct balance
    await User.updateBalance(req.user.id, -parsedAmount);

    // Create transaction
    await Transaction.create(
      req.user.id,
      'bet',
      -parsedAmount,
      `Prop bet: ${propBet.title} - ${choice}`
    );

    // Create notification
    const Notification = require('../models/Notification');
    await Notification.create(
      req.user.id,
      '✅ Prop Bet Placed',
      `Bet ${parsedAmount} Valiant Bucks on "${propBet.title}" - ${choice.toUpperCase()} at ${odds}x odds`,
      'bet_placed'
    );

    res.status(201).json({
      message: 'Prop bet placed successfully',
      bet,
      newBalance: user.balance - parsedAmount
    });
  } catch (err) {
    console.error('Prop bet placement error:', err);
    res.status(500).json({ error: err.message || 'Failed to place prop bet' });
  }
});

module.exports = router;
