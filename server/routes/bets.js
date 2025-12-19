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
    const { gameId, betType, selectedTeam, amount, odds } = req.body;
    
    if (!gameId || !betType || !amount || !odds || amount <= 0 || odds <= 0) {
      return res.status(400).json({ error: 'gameId, betType, amount, and odds are required and must be positive' });
    }

    // Validate bet type
    const validBetTypes = ['moneyline', 'spread', 'over-under'];
    if (!validBetTypes.includes(betType)) {
      return res.status(400).json({ error: 'Invalid bet type' });
    }

    // Check if game exists
    const game = await Game.getById(gameId);
    if (!game) {
      return res.status(400).json({ error: 'Game not found' });
    }

    const user = await User.findById(req.user.id);
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const bet = await Bet.create(req.user.id, gameId, betType, selectedTeam || null, amount, odds);
    await User.updateBalance(req.user.id, -amount);
    await Transaction.create(req.user.id, 'bet', -amount, `${betType} bet on ${game.home_team}: ${odds}x odds`);

    res.status(201).json(bet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's bets
router.get('/', authenticateToken, async (req, res) => {
  try {
    const bets = await Bet.findByUserId(req.user.id);
    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all bets
router.get('/all', authenticateToken, adminOnly, async (req, res) => {
  try {
    const bets = await Bet.getAll();
    res.json(bets);
  } catch (error) {
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

    await Bet.updateStatus(req.params.id, status, outcome);
    
    // Handle bet settlement - update user balance if won
    if (outcome === 'won' && bet.status !== 'resolved') {
      const winnings = bet.amount * bet.odds;
      await User.updateBalance(bet.user_id, winnings);
      await Transaction.create(bet.user_id, 'win', winnings, `Bet won: ${bet.odds}x odds`);
    }

    const updatedBet = await Bet.findById(req.params.id);
    res.json(updatedBet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
