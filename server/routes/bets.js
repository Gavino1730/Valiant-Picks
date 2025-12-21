const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly } = require('../middleware/auth');
const Bet = require('../models/Bet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Game = require('../models/Game');

// Place a bet on a game
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { gameId, selectedTeam, confidence, amount, odds } = req.body;
    
    // Input validation
    if (!gameId || !selectedTeam || !confidence || !amount || !odds) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate numeric inputs
    const parsedAmount = parseFloat(amount);
    const parsedOdds = parseFloat(odds);
    
    if (isNaN(parsedAmount) || isNaN(parsedOdds)) {
      return res.status(400).json({ error: 'Invalid numeric values' });
    }
    
    if (parsedAmount <= 0 || parsedAmount > 10000) {
      return res.status(400).json({ error: 'Bet amount must be between $0.01 and $10,000' });
    }
    
    if (parsedOdds <= 0 || parsedOdds > 100) {
      return res.status(400).json({ error: 'Invalid odds value' });
    }

    // Validate confidence level
    const validConfidence = ['low', 'medium', 'high'];
    if (!validConfidence.includes(confidence)) {
      return res.status(400).json({ error: 'Invalid confidence level' });
    }

    // Check if game exists
    const game = await Game.getById(gameId);
    if (!game) {
      return res.status(400).json({ error: 'Game not found' });
    }

    // Get fresh balance from database to prevent race conditions
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.balance < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create bet and update balance atomically
    const bet = await Bet.create(req.user.id, gameId, confidence, selectedTeam, parsedAmount, parsedOdds);
    await User.updateBalance(req.user.id, -parsedAmount);
    await Transaction.create(req.user.id, 'bet', -parsedAmount, `${confidence} confidence bet on ${selectedTeam}: ${parsedOdds}x odds`);

    res.status(201).json(bet);
  } catch (error) {
    console.error('Bet placement error:', error);
    res.status(500).json({ error: 'Failed to place bet' });
  }
});

// Get user's bets
router.get('/', authenticateToken, async (req, res) => {
  try {
    const bets = await Bet.findByUserId(req.user.id);
    res.json(bets);
  } catch (error) {
    console.error('Get bets error:', error);
    res.status(500).json({ error: 'Failed to retrieve bets' });
  }
});

// Admin: Get all bets
router.get('/all', authenticateToken, adminOnly, async (req, res) => {
  try {
    const bets = await Bet.getAll();
    res.json(bets);
  } catch (error) {
    console.error('Get all bets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Settle a bet (mark as resolved with outcome)
router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { status, outcome } = req.body;
    const bet = await Bet.findById(req.params.id);
    
    if (!bet) {
      return res.status(404).json({ error: 'Bet not found' });
    }

    // Handle bet settlement - update user balance if won (BEFORE updating status)
    if (outcome === 'won' && bet.status !== 'resolved') {
      const winnings = bet.amount * bet.odds;
      await User.updateBalance(bet.user_id, winnings);
      await Transaction.create(bet.user_id, 'win', winnings, `Bet won: ${bet.odds}x odds`);
    }
    
    // Update bet status AFTER payout to prevent double-payout
    await Bet.updateStatus(req.params.id, status, outcome);

    const updatedBet = await Bet.findById(req.params.id);
    res.json(updatedBet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
