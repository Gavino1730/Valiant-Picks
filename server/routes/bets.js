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

    // Prevent bets after the game has started or when the game is closed
    const getGameStartDate = (gameRecord) => {
      if (!gameRecord?.game_date) return null;

      // Create date string in Pacific Time format (game times are Pacific Time)
      const dateStr = `${gameRecord.game_date}T${gameRecord.game_time || '00:00:00'}-08:00`;
      const date = new Date(dateStr);
      
      // Fallback: Parse manually if ISO string fails
      if (Number.isNaN(date.getTime())) {
        const [year, month, day] = (gameRecord.game_date || '').split('-').map(Number);
        const fallbackDate = new Date(year, month - 1, day);
        
        if (gameRecord.game_time) {
          const timeParts = gameRecord.game_time.split(':').map(Number);
          if (timeParts.length >= 2 && !timeParts.some(Number.isNaN)) {
            fallbackDate.setHours(timeParts[0]);
            fallbackDate.setMinutes(timeParts[1]);
            fallbackDate.setSeconds(timeParts[2] || 0);
          }
        }
        return fallbackDate;
      }
      
      return date;
    };

    const startDate = getGameStartDate(game);
    const normalizedStatus = (game.status || '').toLowerCase();
    const isClosedStatus = ['in progress', 'live', 'completed', 'final', 'resolved', 'closed', 'cancelled'].some(
      (keyword) => normalizedStatus.includes(keyword)
    );

    if (isClosedStatus) {
      return res.status(400).json({ error: 'Betting closed: game already started or finished' });
    }

    // Allow betting until 30 minutes AFTER scheduled start (games often start late, warmups, etc.)
    const BETTING_GRACE_PERIOD = 30 * 60 * 1000; // 30 minutes
    if (startDate && Date.now() >= (startDate.getTime() + BETTING_GRACE_PERIOD)) {
      return res.status(400).json({ error: 'Betting closed: game already started' });
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

    // Create notification
    const Notification = require('../models/Notification');
    await Notification.create(
      req.user.id,
      '✅ Bet Placed',
      `${confidence.charAt(0).toUpperCase() + confidence.slice(1)} confidence bet on ${selectedTeam} for ${parsedAmount} Valiant Bucks at ${parsedOdds}x odds`,
      'bet_placed'
    );

    res.status(201).json(bet);
  } catch (error) {
    console.error('Bet placement error:', error);
    res.status(500).json({ error: error.message || 'Failed to place bet' });
  }
});

// Get user's bets
router.get('/', authenticateToken, async (req, res) => {
  try {
    const bets = await Bet.findByUserId(req.user.id);
    res.json(bets || []);
  } catch (error) {
    console.error('Get bets error:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve bets' });
  }
});

// Get all bets (public for leaderboard)
router.get('/all', async (req, res) => {
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
    const { status, outcome, selectedTeam } = req.body;
    const bet = await Bet.findById(req.params.id);
    
    if (!bet) {
      return res.status(404).json({ error: 'Bet not found' });
    }

    // Update selected team if provided
    if (selectedTeam && selectedTeam !== bet.selected_team) {
      await Bet.updateSelectedTeam(req.params.id, selectedTeam);
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
