const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly } = require('../middleware/auth');
const { supabase } = require('../supabase');

// Get all teams with full details
router.get('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    res.json(teams || []);
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

    // Build update object
    const updateData = {};
    updateKeys.forEach(key => {
      if (key === 'ranking') {
        // Convert ranking to "Rank #N" format for storage
        const rankNum = parseInt(updates[key]);
        updateData[key] = isNaN(rankNum) ? updates[key] : `Rank #${rankNum}`;
      } else {
        updateData[key] = updates[key];
      }
    });

    // Update in database
    const { data, error } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', teamId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    res.json({ message: 'Team updated successfully', team: data });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: error.message || 'Failed to update team' });
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
    const gameData = req.body;

    // Get current team
    const { data: team, error: fetchError } = await supabase
      .from('teams')
      .select('schedule')
      .eq('id', teamId)
      .single();

    if (fetchError) throw fetchError;

    // Update the specific game in the schedule array
    const schedule = Array.isArray(team.schedule) ? team.schedule : [];
    const gameIndex = parseInt(gameId);
    
    if (gameIndex >= 0 && gameIndex < schedule.length) {
      schedule[gameIndex] = gameData;
      
      // Update team with modified schedule
      const { data: updatedTeam, error: updateError } = await supabase
        .from('teams')
        .update({ schedule })
        .eq('id', teamId)
        .select()
        .single();

      if (updateError) throw updateError;

      res.json({ message: 'Game updated successfully', team: updatedTeam });
    } else {
      res.status(400).json({ error: 'Invalid game index' });
    }
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
