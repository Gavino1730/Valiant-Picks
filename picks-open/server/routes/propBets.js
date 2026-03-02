const express = require('express');
const router = express.Router();
const PropBet = require('../models/PropBet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { supabase } = require('../supabase');
const { authenticateToken } = require('../middleware/auth');
const { getCurrencyName } = require('../utils/orgConfig');

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
  
  if (options && options.length >= 1 && optionOdds) {
    // New format: custom options (single or multiple)
    finalOptionOdds = optionOdds;
    // Extract yes/no odds for backward compatibility
    finalYesOdds = optionOdds[options[0]] || 1.5;
    finalNoOdds = options.length > 1 ? (optionOdds[options[1]] || 1.0) : 1.0; // Default NO to 1.0 if single option
  } else if (yesOdds) {
    // Old format: yesOdds with optional noOdds
    finalYesOdds = yesOdds;
    finalNoOdds = noOdds || 1.0; // Default to 1.0 if not provided
    finalOptionOdds = { 'Yes': yesOdds, 'No': finalNoOdds };
  } else {
    return res.status(400).json({ error: 'Please provide odds for at least one option' });
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

// Update prop bet status/outcome OR full edit (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can update prop bets' });
  }

  const { status, outcome, title, description, teamType, yesOdds, noOdds, expiresAt, options, optionOdds } = req.body;

  try {
    const { supabase } = require('../supabase');
    const Bet = require('../models/Bet');
    
    // If status/outcome are provided, handle bet resolution
    if (status !== undefined || outcome !== undefined) {
      // Update prop bet status
      await PropBet.updateStatus(req.params.id, status, outcome);

    let betsResolved = 0;
    let winningsDistributed = 0;

    // If outcome is set (yes or no), resolve all associated bets
    if (outcome && (outcome === 'yes' || outcome === 'no')) {
      // Get all pending bets for this prop bet
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('prop_bet_id', req.params.id)
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
          // Use potential_win if available, otherwise calculate
          const winnings = bet.potential_win || (bet.amount * bet.odds);
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
            `Your prop bet "${propBet?.title}" won ${winnings} ${await getCurrencyName()}!`,
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
    } else {
      // Full prop bet edit (title, description, odds, etc.)
      await PropBet.update(req.params.id, {
        title,
        description,
        teamType,
        yesOdds,
        noOdds,
        expiresAt,
        options,
        optionOdds
      });
      
      res.json({ message: 'Prop bet updated successfully' });
    }
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

    // Check if user already has a bet on this prop
    const { data: existingBets } = await supabase
      .from('bets')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('prop_bet_id', propBetId)
      .like('bet_type', 'prop-%');
    
    if (existingBets && existingBets.length > 0) {
      return res.status(400).json({ error: 'You have already placed a bet on this prop' });
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
    let validChoice = false;
    
    if (propBet.options && propBet.options.length > 0 && propBet.option_odds) {
      // Custom options - find matching option case-insensitively
      const matchedOption = propBet.options.find(opt => opt.toLowerCase() === normalizedChoice);
      if (matchedOption && propBet.option_odds[matchedOption]) {
        odds = parseFloat(propBet.option_odds[matchedOption]);
        validChoice = true;
      } else {
        // Invalid choice - not in available options
        return res.status(400).json({ 
          error: `Invalid choice. Valid options are: ${propBet.options.join(', ')}` 
        });
      }
    } else {
      // Legacy yes/no format
      if (normalizedChoice === 'yes' || normalizedChoice === 'no') {
        odds = normalizedChoice === 'yes' ? propBet.yes_odds : propBet.no_odds;
        validChoice = true;
      } else {
        return res.status(400).json({ error: 'Invalid choice. Must be YES or NO' });
      }
    }

    const potentialWin = parsedAmount * odds;

    // Calculate game bonus for prop bets based on team type
    let gameBonus = 0;
    let bonusMessage = '';
    let bonusEmoji = '';
    
    try {
      const { data: bonusData } = await supabase
        .rpc('calculate_game_bonus', { 
          p_user_id: req.user.id, 
          p_team_type: propBet.team_type || 'general'
        });
      
      gameBonus = bonusData || 0;
      
      if (gameBonus > 0) {
        const bonusPercent = (gameBonus * 100).toFixed(0);
        const teamType = (propBet.team_type || '').toLowerCase();
        
        // Different emojis for different prop types
        if (teamType.includes('girl')) {
          bonusEmoji = '💗';
          bonusMessage = ` ${bonusEmoji} +${bonusPercent}% Girls Prop Bonus!`;
        } else if (teamType.includes('boy')) {
          bonusEmoji = '🏀';
          bonusMessage = ` ${bonusEmoji} +${bonusPercent}% Boys Prop Bonus!`;
        } else {
          bonusEmoji = '⭐';
          bonusMessage = ` ${bonusEmoji} +${bonusPercent}% Prop Bonus!`;
        }
      }
    } catch (error) {
      console.error('Error calculating prop bonus:', error);
    }

    // Create bet record (using bets table with special marker for prop bets)
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        user_id: req.user.id,
        prop_bet_id: propBetId,
        bet_type: `prop-${normalizedChoice}`, // Mark as prop bet with choice
        selected_team: choice, // Store original choice (preserves case and formatting)
        amount: parsedAmount,
        odds: odds,
        status: 'pending',
        potential_win: potentialWin,
        girls_game_bonus: gameBonus // Reuse existing column for all bonus types
      })
      .select()
      .single();

    if (betError) throw betError;

    // Create transaction record first
    await Transaction.create(
      req.user.id,
      'bet',
      -parsedAmount,
      `Prop bet: ${propBet.title} - ${choice}${bonusMessage}`
    );

    // Then deduct balance
    await User.updateBalance(req.user.id, -parsedAmount);

    // Create notification
    const Notification = require('../models/Notification');
    await Notification.create(
      req.user.id,
      '✅ Prop Bet Placed' + (gameBonus > 0 ? ` ${bonusEmoji}` : ''),
      `Bet ${parsedAmount} ${await getCurrencyName()} on "${propBet.title}" - ${choice.toUpperCase()} at ${odds}x odds${bonusMessage}`,
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
