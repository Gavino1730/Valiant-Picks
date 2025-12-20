const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly } = require('../middleware/auth');

// Get all teams with full details
router.get('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    // For now, returning sample data structure
    // In a real app, this would fetch from database
    const teams = [
      {
        id: 'boys',
        name: 'Valley Catholic Boys Basketball',
        type: 'Boys Basketball',
        record_wins: 4,
        record_losses: 1,
        league_record: '0-0',
        ranking: 3,
        coach_name: 'Bryan Fraser',
        assistant_coach: 'John Efstathiou',
        coach_bio: 'Head Coach Bryan Fraser is an OG hooper out of Sacramento with 11 years on the sideline and zero tolerance for bad basketball. Backed by Assistant Coach John Efstathiou, a towering presence whose laugh echoes through the gym and whose clipboard slams are felt emotionally and physically.',
        description: 'Depth for days and pace that never slows. The floor is spaced with shooters, the rim is under constant threat, and there\'s no such thing as taking a possession off. The goal is simple, win state. Anything less is a failure. The team motto is BTA and they play like it.',
        team_motto: 'BTA',
        schedule: [],
        players: []
      },
      {
        id: 'girls',
        name: 'Valley Catholic Girls Basketball',
        type: 'Girls Basketball',
        record_wins: 4,
        record_losses: 1,
        league_record: '0-0',
        ranking: 8,
        coach_name: 'Patrick Thomas',
        coach_bio: 'Head Coach Patrick Thomas is an English teacher who somehow blends grammar, conditioning, and controlled insanity into a system that overwhelms opponents and stacks wins.',
        description: 'Pure pressure from the opening tip. A relentless full court press, nonstop energy, shooters all over the floor, and substitutions so constant the other team never finds a rhythm. Games turn into chaos fast and stay that way.',
        schedule: [],
        players: []
      }
    ];

    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get single team by ID
router.get('/:teamId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teamId } = req.params;
    // Fetch from database based on teamId
    res.json({ message: 'Team data would be fetched from database' });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Update team info (name, record, ranking, etc)
router.put('/:teamId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teamId } = req.params;
    const updates = req.body;

    // Validate inputs
    const allowedUpdates = [
      'record_wins',
      'record_losses',
      'league_record',
      'ranking',
      'coach_name',
      'assistant_coach',
      'coach_bio',
      'description',
      'team_motto',
      'name'
    ];

    const updateKeys = Object.keys(updates).filter(key => allowedUpdates.includes(key));

    if (updateKeys.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Update in database
    res.json({ message: 'Team updated successfully', updates: updateKeys });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Add game to schedule
router.post('/:teamId/schedule', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { result, score, type, date, time, opponent, location } = req.body;

    // Validate required fields
    if (!result || !score || !type || !date || !time || !opponent || !location) {
      return res.status(400).json({ error: 'Missing required schedule fields' });
    }

    // Add to database
    res.json({ message: 'Game added to schedule', game: req.body });
  } catch (error) {
    console.error('Error adding game:', error);
    res.status(500).json({ error: 'Failed to add game' });
  }
});

// Update game in schedule
router.put('/:teamId/schedule/:gameId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teamId, gameId } = req.params;
    // Update in database
    res.json({ message: 'Game updated successfully' });
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ error: 'Failed to update game' });
  }
});

// Delete game from schedule
router.delete('/:teamId/schedule/:gameId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teamId, gameId } = req.params;
    // Delete from database
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

// Add player to roster
router.post('/:teamId/players', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { number, name, position, grade, height, bio } = req.body;

    // Validate required fields
    if (!number || !name || !position || !grade || !height || !bio) {
      return res.status(400).json({ error: 'Missing required player fields' });
    }

    // Add to database
    res.json({ message: 'Player added to roster', player: req.body });
  } catch (error) {
    console.error('Error adding player:', error);
    res.status(500).json({ error: 'Failed to add player' });
  }
});

// Update player
router.put('/:teamId/players/:playerId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teamId, playerId } = req.params;
    // Update in database
    res.json({ message: 'Player updated successfully' });
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// Delete player
router.delete('/:teamId/players/:playerId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teamId, playerId } = req.params;
    // Delete from database
    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

module.exports = router;
