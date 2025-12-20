const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Player = require('../models/Player');
const { authenticateToken } = require('../middleware/auth');

// Get all teams with rosters
router.get('/', async (req, res) => {
  try {
    const teams = await Team.getAll();
    // Fetch players for each team
    const teamsWithPlayers = await Promise.all(
      teams.map(async (team) => {
        const players = await Player.getByTeam(team.id);
        return { ...team, players };
      })
    );
    res.json(teamsWithPlayers);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching teams: ' + err.message });
  }
});

// Get single team with roster
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.getById(req.params.id);
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching team: ' + err.message });
  }
});

// Admin: Create team
router.post('/', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can create teams' });
  }

  const { name, type, description, coachName, coachEmail } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Missing required fields: name, type' });
  }

  try {
    const team = await Team.create({
      name,
      type,
      description,
      coach_name: coachName,
      coach_email: coachEmail
    });

    res.status(201).json({ message: 'Team created', teamId: team.id });
  } catch (err) {
    res.status(500).json({ error: 'Error creating team: ' + err.message });
  }
});

// Admin: Update team
router.put('/:id', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can update teams' });
  }

  try {
    const updates = {
      name: req.body.name,
      type: req.body.type,
      description: req.body.description,
      record_wins: req.body.recordWins,
      record_losses: req.body.recordLosses,
      ranking: req.body.ranking,
      coach_name: req.body.coachName,
      coach_email: req.body.coachEmail
    };

    const team = await Team.update(req.params.id, updates);
    res.json({ message: 'Team updated', team });
  } catch (err) {
    res.status(500).json({ error: 'Error updating team: ' + err.message });
  }
});

// Admin: Add player to team
router.post('/:teamId/players', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can add players' });
  }

  const { number, name, position, height, weight, grade, bio } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Player name is required' });
  }

  try {
    const player = await Player.create({
      team_id: req.params.teamId,
      number,
      name,
      position,
      height,
      weight,
      grade,
      bio
    });

    res.status(201).json({ message: 'Player added', playerId: player.id });
  } catch (err) {
    res.status(500).json({ error: 'Error adding player: ' + err.message });
  }
});

// Admin: Update player
router.put('/players/:playerId', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can edit players' });
  }

  try {
    const updates = {
      number: req.body.number,
      name: req.body.name,
      position: req.body.position,
      height: req.body.height,
      weight: req.body.weight,
      grade: req.body.grade,
      bio: req.body.bio
    };

    const player = await Player.update(req.params.playerId, updates);
    res.json({ message: 'Player updated', player });
  } catch (err) {
    res.status(500).json({ error: 'Error updating player: ' + err.message });
  }
});

// Admin: Delete player
router.delete('/players/:playerId', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can delete players' });
  }

  try {
    await Player.delete(req.params.playerId);
    res.json({ message: 'Player deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting player: ' + err.message });
  }
});

module.exports = router;
