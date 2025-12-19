const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const auth = require('../middleware/auth');

// Admin: Create a new game
router.post('/', auth, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can create games' });
  }

  const {
    teamType,
    homeTeam,
    awayTeam,
    gameDate,
    gameTime,
    location,
    winningOdds,
    losingOdds,
    spread,
    spreadOdds,
    overUnder,
    overOdds,
    underOdds,
    notes
  } = req.body;

  // Validate required fields
  if (!teamType || !homeTeam || !gameDate || !winningOdds || !losingOdds) {
    return res.status(400).json({ error: 'Missing required fields: teamType, homeTeam, gameDate, winningOdds, losingOdds' });
  }

  try {
    const result = await Game.create({
      teamType,
      homeTeam,
      awayTeam,
      gameDate,
      gameTime,
      location,
      winningOdds: parseFloat(winningOdds),
      losingOdds: parseFloat(losingOdds),
      spread: spread ? parseFloat(spread) : null,
      spreadOdds: spreadOdds ? parseFloat(spreadOdds) : null,
      overUnder: overUnder ? parseFloat(overUnder) : null,
      overOdds: overOdds ? parseFloat(overOdds) : null,
      underOdds: underOdds ? parseFloat(underOdds) : null,
      notes
    });

    res.status(201).json({
      message: 'Game created successfully',
      gameId: result.id
    });
  } catch (err) {
    res.status(500).json({ error: 'Error creating game: ' + err.message });
  }
});

// Get all upcoming games (public)
router.get('/', async (req, res) => {
  try {
    const games = await Game.getAll();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching games: ' + err.message });
  }
});

// Get game by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.getById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching game: ' + err.message });
  }
});

// Admin: Update game status
router.put('/:id/status', auth, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can update games' });
  }

  const { status } = req.body;
  if (!status || !['upcoming', 'in-progress', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await Game.updateStatus(req.params.id, status);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json({ message: 'Game status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating game: ' + err.message });
  }
});

// Admin: Delete a game
router.delete('/:id', auth, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can delete games' });
  }

  try {
    const result = await Game.delete(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json({ message: 'Game deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting game: ' + err.message });
  }
});

module.exports = router;
