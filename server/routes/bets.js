const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly, optionalAuth } = require('../middleware/auth');
const Bet = require('../models/Bet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Game = require('../models/Game');
const Notification = require('../models/Notification');

// Place a bet on a game
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { gameId, selectedTeam, confidence, amount, odds } = req.body;
    
    // Input validation
    if (!gameId || !selectedTeam || !confidence || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate numeric inputs
    const parsedAmount = parseFloat(amount);
    const parsedOdds = parseFloat(odds);
    
    if (isNaN(parsedAmount)) {
      return res.status(400).json({ error: 'Invalid numeric values' });
    }
    
    if (parsedAmount <= 0 || parsedAmount > 10000) {
      return res.status(400).json({ error: 'Bet amount must be between $0.01 and $10,000' });
    }
    
    // Validate confidence level
    const validConfidence = ['low', 'medium', 'high'];
    if (!validConfidence.includes(confidence)) {
      return res.status(400).json({ error: 'Invalid confidence level' });
    }

    const oddsByConfidence = {
      low: 1.2,
      medium: 1.5,
      high: 2.0
    };

    const resolvedOdds = oddsByConfidence[confidence];
    if (!resolvedOdds) {
      return res.status(400).json({ error: 'Invalid confidence odds' });
    }

    if (!isNaN(parsedOdds) && parsedOdds !== resolvedOdds) {
      console.warn('Client odds mismatch; using server odds', {
        userId: req.user?.id,
        gameId,
        confidence,
        clientOdds: parsedOdds,
        serverOdds: resolvedOdds
      });
    }

    // Check if game exists
    const game = await Game.getById(gameId);
    if (!game) {
      return res.status(400).json({ error: 'Game not found' });
    }

    const normalizedSelectedTeam = String(selectedTeam).trim();
    const validTeams = [game.home_team, game.away_team].filter(Boolean);
    if (!validTeams.includes(normalizedSelectedTeam)) {
      return res.status(400).json({ error: 'Selected team does not match this game' });
    }

    // Check if user already has a bet on this game
    const existingBet = await Bet.findByUserAndGame(req.user.id, gameId);
    if (existingBet) {
      return res.status(400).json({ error: 'You have already placed a bet on this game' });
    }

    // Prevent bets after the game has started or when the game is closed
    const parseGameDate = (dateValue) => {
      if (!dateValue) return null;
      const isoMatch = String(dateValue).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) {
        return {
          year: Number(isoMatch[1]),
          month: Number(isoMatch[2]),
          day: Number(isoMatch[3])
        };
      }

      const slashMatch = String(dateValue).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
      if (slashMatch) {
        const month = Number(slashMatch[1]);
        const day = Number(slashMatch[2]);
        const yearValue = slashMatch[3];
        const year = yearValue.length === 2 ? Number(`20${yearValue}`) : Number(yearValue);
        return { year, month, day };
      }

      return null;
    };

    const parseGameTime = (timeValue) => {
      if (!timeValue) return { hour: 0, minute: 0, second: 0 };
      const trimmed = String(timeValue).trim().toLowerCase();

      if (trimmed === 'noon') return { hour: 12, minute: 0, second: 0 };
      if (trimmed === 'midnight') return { hour: 0, minute: 0, second: 0 };

      const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)$/);
      if (ampmMatch) {
        let hour = Number(ampmMatch[1]);
        const minute = Number(ampmMatch[2]);
        const second = Number(ampmMatch[3] || 0);
        const period = ampmMatch[4];
        if (period === 'pm' && hour !== 12) hour += 12;
        if (period === 'am' && hour === 12) hour = 0;
        return { hour, minute, second };
      }

      const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (timeMatch) {
        return {
          hour: Number(timeMatch[1]),
          minute: Number(timeMatch[2]),
          second: Number(timeMatch[3] || 0)
        };
      }

      return { hour: 0, minute: 0, second: 0 };
    };

    const buildPacificDate = (year, month, day, hour, minute, second) => {
      const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
      const pacificDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
      const offset = utcDate.getTime() - pacificDate.getTime();
      return new Date(Date.UTC(year, month - 1, day, hour, minute, second) + offset);
    };

    const getGameStartDate = (gameRecord) => {
      const dateParts = parseGameDate(gameRecord?.game_date);
      if (!dateParts) return null;
      const timeParts = parseGameTime(gameRecord?.game_time);
      if ([dateParts.year, dateParts.month, dateParts.day].some(Number.isNaN)) return null;
      if ([timeParts.hour, timeParts.minute, timeParts.second].some(Number.isNaN)) return null;
      return buildPacificDate(
        dateParts.year,
        dateParts.month,
        dateParts.day,
        timeParts.hour,
        timeParts.minute,
        timeParts.second
      );
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
    const bet = await Bet.create(req.user.id, gameId, confidence, normalizedSelectedTeam, parsedAmount, resolvedOdds);
    
    // Create transaction record first (before balance update)
    await Transaction.create(req.user.id, 'bet', -parsedAmount, `${confidence} confidence bet on ${normalizedSelectedTeam}: ${resolvedOdds}x odds`);
    
    // Then deduct balance
    await User.updateBalance(req.user.id, -parsedAmount);

    // Create notification
    await Notification.create(
      req.user.id,
      '✅ Bet Placed',
      `${confidence.charAt(0).toUpperCase() + confidence.slice(1)} confidence bet on ${normalizedSelectedTeam} for ${parsedAmount} Valiant Bucks at ${resolvedOdds}x odds`,
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
router.get('/all', optionalAuth, async (req, res) => {
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
