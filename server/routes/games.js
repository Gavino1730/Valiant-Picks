const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const { authenticateToken } = require('../middleware/auth');

// Admin: Seed games from team schedules
router.post('/seed-from-schedule', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can seed games' });
  }

  try {
    // Get team IDs from database, create if they don't exist
    const { supabase } = require('../supabase');
    let { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, type')
      .in('type', ['Boys Basketball', 'Girls Basketball']);

    if (teamsError) throw teamsError;
    
    let boysTeam = teams?.find(t => t.type === 'Boys Basketball');
    let girlsTeam = teams?.find(t => t.type === 'Girls Basketball');

    // Create teams if they don't exist
    if (!boysTeam) {
      const { data: newBoysTeam, error: boysError } = await supabase
        .from('teams')
        .insert([{
          name: 'Valley Catholic Boys Basketball',
          type: 'Boys Basketball',
          record_wins: 4,
          record_losses: 1,
          ranking: 3,
          coach_name: 'Bryan Fraser'
        }])
        .select()
        .single();
      
      if (boysError) throw boysError;
      boysTeam = newBoysTeam;
    }

    if (!girlsTeam) {
      const { data: newGirlsTeam, error: girlsError } = await supabase
        .from('teams')
        .insert([{
          name: 'Valley Catholic Girls Basketball',
          type: 'Girls Basketball',
          record_wins: 4,
          record_losses: 1,
          ranking: 7,
          coach_name: 'Nick Blechman'
        }])
        .select()
        .single();
      
      if (girlsError) throw girlsError;
      girlsTeam = newGirlsTeam;
    }

    // Hardcoded schedule data matching what's in teamsAdmin.js
    const boysSchedule = [
      { result: 'W', score: '83-58', type: 'Non League', date: '12/3/25', time: '7:30 pm', opponent: 'Knappa', location: 'Away' },
      { result: 'W', score: '88-41', type: 'Non League', date: '12/5/25', time: '7:30 pm', opponent: 'Gladstone', location: 'Home' },
      { result: 'L', score: '69-90', type: 'Non League', date: '12/9/25', time: '7:00 pm', opponent: 'Scappoose', location: 'Away' },
      { result: 'W', score: '73-45', type: 'Non League', date: '12/12/25', time: '6:00 pm', opponent: 'Pleasant Hill', location: 'Home' },
      { result: 'W', score: '87-65', type: 'Non League', date: '12/15/25', time: '7:30 pm', opponent: 'Banks', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'Non League', date: '12/22/25', time: '2:30 pm', opponent: 'Tillamook', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/28/25', time: '12:30 pm', opponent: 'Jefferson', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/29/25', time: '11:45 am', opponent: 'Mid Pacific, HI', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/30/25', time: '6:45 pm', opponent: 'Regis', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'Non League', date: '1/3/26', time: '3:00 pm', opponent: 'Western Christian', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/6/26', time: '7:30 pm', opponent: 'Horizon Christian, Tualatin', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/8/26', time: '7:30 pm', opponent: 'Westside Christian', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/10/26', time: '6:30 pm', opponent: 'De La Salle North Catholic', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/13/26', time: '7:30 pm', opponent: 'Oregon Episcopal', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/16/26', time: '7:30 pm', opponent: 'Catlin Gabel', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/20/26', time: '7:30 pm', opponent: 'Riverside, WLWV', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/22/26', time: '7:30 pm', opponent: 'Portland Adventist Academy', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/24/26', time: '6:30 pm', opponent: 'Horizon Christian, Tualatin', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/27/26', time: '7:30 pm', opponent: 'Westside Christian', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/30/26', time: '7:30 pm', opponent: 'De La Salle North Catholic', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'League', date: '2/3/26', time: '7:30 pm', opponent: 'Oregon Episcopal', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'League', date: '2/6/26', time: '7:30 pm', opponent: 'Catlin Gabel', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'League', date: '2/10/26', time: '6:00 pm', opponent: 'Riverside, WLWV', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'League', date: '2/12/26', time: '7:30 pm', opponent: 'Portland Adventist Academy', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'Non League', date: '2/14/26', time: 'Noon', opponent: 'Neah Kah Nie', location: 'Home' }
    ];

    const girlsSchedule = [
      { result: 'W', score: '44-31', type: 'Non League', date: '12/3/25', time: '6:00 pm', opponent: 'Knappa', location: 'Away' },
      { result: 'W', score: '56-7', type: 'Non League', date: '12/5/25', time: '6:00 pm', opponent: 'Gladstone', location: 'Home' },
      { result: 'W', score: '44-16', type: 'Non League', date: '12/9/25', time: '5:30 pm', opponent: 'Scappoose', location: 'Away' },
      { result: 'W', score: '57-28', type: 'Non League', date: '12/12/25', time: '7:30 pm', opponent: 'Pleasant Hill', location: 'Home' },
      { result: 'L', score: '25-46', type: 'Non League', date: '12/15/25', time: '6:00 pm', opponent: 'Banks', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'Non League', date: '12/22/25', time: '5:00 pm', opponent: 'Santiam Christian', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/28/25', time: '7:30 pm', opponent: 'Regis', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/29/25', time: '3:15 pm', opponent: 'Jefferson', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/30/25', time: '3:15 pm', opponent: 'Sutherlin', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'Non League', date: '1/2/26', time: '5:30 pm', opponent: 'Seaside', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/6/26', time: '6:00 pm', opponent: 'Horizon Christian, Tualatin', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/8/26', time: '6:00 pm', opponent: 'Westside Christian', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/10/26', time: '5:00 pm', opponent: 'De La Salle North Catholic', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/13/26', time: '6:00 pm', opponent: 'Oregon Episcopal', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/16/26', time: '6:00 pm', opponent: 'Catlin Gabel', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'Non League', date: '1/19/26', time: '6:00 pm', opponent: 'Country Christian', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/22/26', time: '6:00 pm', opponent: 'Portland Adventist Academy', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/24/26', time: '5:00 pm', opponent: 'Horizon Christian, Tualatin', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/27/26', time: '6:00 pm', opponent: 'Westside Christian', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'League', date: '1/30/26', time: '6:00 pm', opponent: 'De La Salle North Catholic', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'League', date: '2/3/26', time: '6:00 pm', opponent: 'Oregon Episcopal', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'League', date: '2/6/26', time: '6:00 pm', opponent: 'Catlin Gabel', location: 'Away' },
      { result: 'Scheduled', score: '-', type: 'Non League', date: '2/9/26', time: '7:00 pm', opponent: 'Prairie, WA', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'League', date: '2/12/26', time: '6:00 pm', opponent: 'Portland Adventist Academy', location: 'Home' },
      { result: 'Scheduled', score: '-', type: 'Non League', date: '2/14/26', time: '10:30 am', opponent: 'Neah Kah Nie', location: 'Home' }
    ];

    let gamesCreated = 0;

    // Only add scheduled games (not already played)
    for (const game of boysSchedule) {
      if (game.result === 'Scheduled') {
        await Game.create({
          teamType: 'Boys Basketball',
          homeTeam: game.location === 'Home' ? 'Valley Catholic' : game.opponent,
          awayTeam: game.location === 'Home' ? game.opponent : 'Valley Catholic',
          gameDate: game.date,
          gameTime: game.time,
          location: game.location,
          winningOdds: 1.95,
          losingOdds: 1.95,
          spread: null,
          spreadOdds: null,
          overUnder: null,
          overOdds: null,
          underOdds: null,
          notes: `${game.type} game`,
          teamId: boysTeam.id
        });
        gamesCreated++;
      }
    }

    for (const game of girlsSchedule) {
      if (game.result === 'Scheduled') {
        await Game.create({
          teamType: 'Girls Basketball',
          homeTeam: game.location === 'Home' ? 'Valley Catholic' : game.opponent,
          awayTeam: game.location === 'Home' ? game.opponent : 'Valley Catholic',
          gameDate: game.date,
          gameTime: game.time,
          location: game.location,
          winningOdds: 1.95,
          losingOdds: 1.95,
          spread: null,
          spreadOdds: null,
          overUnder: null,
          overOdds: null,
          underOdds: null,
          notes: `${game.type} game`,
          teamId: girlsTeam.id
        });
        gamesCreated++;
      }
    }

    res.json({
      message: `Successfully seeded ${gamesCreated} games from team schedules`,
      gamesCreated
    });
  } catch (err) {
    res.status(500).json({ error: 'Error seeding games: ' + err.message });
  }
});

// Admin: Create a new game
router.post('/', authenticateToken, async (req, res) => {
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
router.put('/:id/status', authenticateToken, async (req, res) => {
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

// Admin: Set game outcome and resolve all bets
router.put('/:id/outcome', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can set game outcomes' });
  }

  const { winningTeam } = req.body;
  if (!winningTeam) {
    return res.status(400).json({ error: 'Winning team is required' });
  }

  try {
    const Bet = require('../models/Bet');
    const User = require('../models/User');
    const Transaction = require('../models/Transaction');
    const { supabase } = require('../supabase');

    // Get the game
    const game = await Game.getById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update game status and result
    await supabase
      .from('games')
      .update({ 
        status: 'completed',
        result: winningTeam,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id);

    // Get all pending bets for this game
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('game_id', req.params.id)
      .eq('status', 'pending');

    if (betsError) throw betsError;

    let betsResolved = 0;
    let winningsDistributed = 0;

    // Process each bet
    for (const bet of bets || []) {
      const won = bet.selected_team === winningTeam;
      const outcome = won ? 'won' : 'lost';

      // Update bet status
      await Bet.updateStatus(bet.id, 'resolved', outcome);

      // Credit winnings if won
      if (won) {
        const winnings = bet.amount * bet.odds;
        await User.updateBalance(bet.user_id, winnings);
        await Transaction.create(
          bet.user_id, 
          'win', 
          winnings, 
          `Won bet on ${bet.selected_team} (${bet.bet_type} confidence)`
        );
        winningsDistributed += winnings;
      }

      betsResolved++;
    }

    res.json({ 
      message: 'Game outcome set and bets resolved',
      betsResolved,
      winningsDistributed
    });
  } catch (err) {
    console.error('Error setting game outcome:', err);
    res.status(500).json({ error: 'Error setting game outcome: ' + err.message });
  }
});

// Admin: Update game details
router.put('/:id', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can update games' });
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

  if (!teamType || !homeTeam || !gameDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await Game.update(req.params.id, {
      teamType,
      homeTeam,
      awayTeam,
      gameDate,
      gameTime,
      location,
      winningOdds: winningOdds ? parseFloat(winningOdds) : null,
      losingOdds: losingOdds ? parseFloat(losingOdds) : null,
      spread: spread ? parseFloat(spread) : null,
      spreadOdds: spreadOdds ? parseFloat(spreadOdds) : null,
      overUnder: overUnder ? parseFloat(overUnder) : null,
      overOdds: overOdds ? parseFloat(overOdds) : null,
      underOdds: underOdds ? parseFloat(underOdds) : null,
      notes
    });

    res.json({ message: 'Game updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating game: ' + err.message });
  }
});

// Admin: Delete a game
router.delete('/:id', authenticateToken, async (req, res) => {
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
