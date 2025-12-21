const express = require('express');
const router = express.Router();
const PropBet = require('../models/PropBet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authenticateToken } = require('../middleware/auth');

// Get all active prop bets (public)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const propBets = await PropBet.getAll();
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

  const { title, description, teamType, yesOdds, noOdds, expiresAt } = req.body;

  // Validate required fields
  if (!title || !yesOdds || !noOdds) {
    return res.status(400).json({ error: 'Missing required fields: title, yesOdds, noOdds' });
  }

  try {
    const result = await PropBet.create({
      title,
      description,
      teamType: teamType || 'General',
      yesOdds: parseFloat(yesOdds),
      noOdds: parseFloat(noOdds),
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

        // Credit winnings if won
        if (won) {
          const winnings = bet.amount * bet.odds;
          await User.updateBalance(bet.user_id, winnings);
          await Transaction.create(
            bet.user_id, 
            'win', 
            winnings, 
            `Won prop bet: ${bet.selected_team}`
          );
          winningsDistributed += winnings;
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

    if (choice !== 'yes' && choice !== 'no') {
      return res.status(400).json({ error: 'Choice must be "yes" or "no"' });
    }

    // Check prop bet exists and is active
    const propBet = await PropBet.getById(propBetId);
    if (!propBet) {
      return res.status(404).json({ error: 'Prop bet not found' });
    }

    if (propBet.status !== 'active') {
      return res.status(400).json({ error: 'This prop bet is no longer active' });
    }

    // Check user balance
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.balance < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Calculate potential win
    const odds = choice === 'yes' ? propBet.yes_odds : propBet.no_odds;
    const potentialWin = parsedAmount * odds;

    // Create bet record (using bets table with special marker for prop bets)
    const { supabase } = require('../supabase');
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        user_id: req.user.id,
        game_id: propBetId, // Store prop bet ID in game_id field
        bet_type: `prop-${choice}`, // Mark as prop bet
        selected_team: choice.toUpperCase(),
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
      `Prop bet: ${propBet.title} - ${choice.toUpperCase()}`
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
