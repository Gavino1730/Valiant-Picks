const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth, adminOnly } = require('../middleware/auth');
const { supabase } = require('../supabase');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const ROUND_POINTS = {
  1: 5,    // 8 games × 5 pts = 40 pts max
  2: 10,   // 4 games × 10 pts = 40 pts max
  3: 20,   // 2 games × 20 pts = 40 pts max
  4: 40    // 1 game × 40 pts = 40 pts max
};

const normalizePickKey = (gameNumber) => `game${gameNumber}`;

const coercePicks = (picks) => {
  if (!picks || typeof picks !== 'object') {
    return { round1: {}, round2: {}, round3: {}, round4: {} };
  }
  return {
    round1: picks.round1 || {},
    round2: picks.round2 || {},
    round3: picks.round3 || {},
    round4: picks.round4 || {}
  };
};

const computePoints = (picks, winnersByRound) => {
  const safePicks = coercePicks(picks);
  let points = 0;

  [1, 2, 3, 4].forEach((round) => {
    const roundWinners = winnersByRound[round] || {};
    Object.entries(roundWinners).forEach(([gameKey, winnerId]) => {
      if (!winnerId) return;
      const pickedTeamId = safePicks[`round${round}`]?.[gameKey];
      if (pickedTeamId && pickedTeamId === winnerId) {
        points += ROUND_POINTS[round] || 0;
      }
    });
  });

  return points;
};

const recalcEntries = async (bracketId) => {
  const { data: bracket, error: bracketError } = await supabase
    .from('brackets')
    .select('*')
    .eq('id', bracketId)
    .single();

  if (bracketError) throw bracketError;

  const { data: games, error: gamesError } = await supabase
    .from('bracket_games')
    .select('round, game_number, winner_team_id')
    .eq('bracket_id', bracketId);

  if (gamesError) throw gamesError;

  const winnersByRound = games.reduce((acc, game) => {
    const round = game.round;
    if (!acc[round]) acc[round] = {};
    acc[round][normalizePickKey(game.game_number)] = game.winner_team_id;
    return acc;
  }, {});

  const { data: entries, error: entriesError } = await supabase
    .from('bracket_entries')
    .select('id, user_id, picks, points, payout')
    .eq('bracket_id', bracketId);

  if (entriesError) throw entriesError;

  for (const entry of entries || []) {
    const points = computePoints(entry.picks, winnersByRound);
    const payout = points * Number(bracket.payout_per_point || 0);
    const previousPayout = Number(entry.payout || 0);
    const delta = payout - previousPayout;

    if (delta !== 0) {
      await User.updateBalance(entry.user_id, delta);
      await Transaction.create(
        entry.user_id,
        delta > 0 ? 'bracket_payout' : 'bracket_adjustment',
        delta,
        `${bracket.name} bracket payout update`
      );
    }

    await supabase
      .from('bracket_entries')
      .update({
        points,
        payout,
        updated_at: new Date().toISOString()
      })
      .eq('id', entry.id);
  }
};

const recomputeBracketGames = async (bracketId) => {
  const { data: games, error } = await supabase
    .from('bracket_games')
    .select('*')
    .eq('bracket_id', bracketId);

  if (error) throw error;

  const byRound = games.reduce((acc, game) => {
    if (!acc[game.round]) acc[game.round] = {};
    acc[game.round][game.game_number] = game;
    return acc;
  }, {});

  const round1 = byRound[1] || {};
  const round2 = byRound[2] || {};
  const round3 = byRound[3] || {};

  const updateGame = async (game, team1Id, team2Id) => {
    if (!game) return null;
    let winnerId = game.winner_team_id;
    let status = game.status;

    if (winnerId && winnerId !== team1Id && winnerId !== team2Id) {
      winnerId = null;
      status = 'scheduled';
    } else if (winnerId && team1Id && team2Id) {
      status = 'completed';
    } else if (!winnerId) {
      status = 'scheduled';
    }

    await supabase
      .from('bracket_games')
      .update({
        team1_id: team1Id,
        team2_id: team2Id,
        winner_team_id: winnerId,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', game.id);

    return { ...game, team1_id: team1Id, team2_id: team2Id, winner_team_id: winnerId, status };
  };

  const round2Game1 = await updateGame(
    round2[1],
    round1[1]?.winner_team_id || null,
    round1[2]?.winner_team_id || null
  );

  const round2Game2 = await updateGame(
    round2[2],
    round1[3]?.winner_team_id || null,
    round1[4]?.winner_team_id || null
  );

  const round3Game1 = await updateGame(
    round3[1],
    round2Game1?.winner_team_id || null,
    round2Game2?.winner_team_id || null
  );

  if (round3Game1?.winner_team_id) {
    await supabase
      .from('brackets')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', bracketId);
  }
};

router.get('/active', optionalAuth, async (req, res) => {
  try {
    const { data: bracket, error } = await supabase
      .from('brackets')
      .select('*')
      .in('status', ['open', 'locked', 'in-progress', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!bracket) {
      return res.json({ bracket: null, teams: [], games: [] });
    }

    const [{ data: teams }, { data: games }] = await Promise.all([
      supabase.from('bracket_teams').select('*').eq('bracket_id', bracket.id).order('seed', { ascending: true }),
      supabase.from('bracket_games').select('*').eq('bracket_id', bracket.id).order('round', { ascending: true }).order('game_number', { ascending: true })
    ]);

    res.json({ bracket, teams: teams || [], games: games || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bracket: ' + err.message });
  }
});

router.get('/admin', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('brackets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch brackets: ' + err.message });
  }
});

router.post('/', authenticateToken, adminOnly, async (req, res) => {
  const { name, season, entryFee, payoutPerPoint, status } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Bracket name is required' });
  }

  try {
    const { data, error } = await supabase
      .from('brackets')
      .insert([{ 
        name,
        season: season || null,
        entry_fee: entryFee ?? 0,
        payout_per_point: payoutPerPoint ?? 1000,
        status: status || 'open'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create bracket: ' + err.message });
  }
});

router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  const { status, entryFee, payoutPerPoint, name, season } = req.body;
  const updates = {
    updated_at: new Date().toISOString()
  };

  if (status) updates.status = status;
  if (entryFee !== undefined) updates.entry_fee = entryFee;
  if (payoutPerPoint !== undefined) updates.payout_per_point = payoutPerPoint;
  if (name) updates.name = name;
  if (season !== undefined) updates.season = season;

  try {
    const { data, error } = await supabase
      .from('brackets')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update bracket: ' + err.message });
  }
});

router.put('/:id/teams', authenticateToken, adminOnly, async (req, res) => {
  const { teams } = req.body;

  if (!Array.isArray(teams) || teams.length !== 8) {
    return res.status(400).json({ error: 'Teams array must include 8 seeds' });
  }

  const seeds = teams.map((team) => Number(team.seed));
  const uniqueSeeds = new Set(seeds);
  if (uniqueSeeds.size !== 8 || seeds.some((seed) => !Number.isInteger(seed) || seed < 1 || seed > 8)) {
    return res.status(400).json({ error: 'Seeds must be unique numbers from 1 to 8' });
  }

  try {
    await supabase
      .from('bracket_teams')
      .delete()
      .eq('bracket_id', req.params.id);

    const payload = teams.map((team) => ({
      bracket_id: req.params.id,
      seed: Number(team.seed),
      name: team.name ? String(team.name).trim() : `TBD Seed ${team.seed}`
    }));

    const { error } = await supabase
      .from('bracket_teams')
      .insert(payload);

    if (error) throw error;
    res.json({ message: 'Teams updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update teams: ' + err.message });
  }
});

router.post('/:id/seed', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { data: existingGames, error: existingError } = await supabase
      .from('bracket_games')
      .select('id')
      .eq('bracket_id', req.params.id)
      .limit(1);

    if (existingError) throw existingError;
    if (existingGames && existingGames.length > 0) {
      return res.status(400).json({ error: 'Games already seeded for this bracket' });
    }

    const { data: teams, error: teamsError } = await supabase
      .from('bracket_teams')
      .select('id, seed')
      .eq('bracket_id', req.params.id);

    if (teamsError) throw teamsError;
    if (!teams || teams.length !== 8) {
      return res.status(400).json({ error: 'You must set all 8 teams before seeding games' });
    }

    const teamBySeed = teams.reduce((acc, team) => {
      acc[team.seed] = team.id;
      return acc;
    }, {});

    const games = [
      { round: 1, game_number: 1, team1_id: teamBySeed[1], team2_id: teamBySeed[8] },
      { round: 1, game_number: 2, team1_id: teamBySeed[4], team2_id: teamBySeed[5] },
      { round: 1, game_number: 3, team1_id: teamBySeed[2], team2_id: teamBySeed[7] },
      { round: 1, game_number: 4, team1_id: teamBySeed[3], team2_id: teamBySeed[6] },
      { round: 2, game_number: 1, team1_id: null, team2_id: null },
      { round: 2, game_number: 2, team1_id: null, team2_id: null },
      { round: 3, game_number: 1, team1_id: null, team2_id: null }
    ].map((game) => ({
      bracket_id: req.params.id,
      ...game
    }));

    const { error: insertError } = await supabase
      .from('bracket_games')
      .insert(games);

    if (insertError) throw insertError;

    res.json({ message: 'Bracket games seeded' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to seed games: ' + err.message });
  }
});

router.put('/:id/games/:gameId/winner', authenticateToken, adminOnly, async (req, res) => {
  const { winnerTeamId } = req.body;

  try {
    const { data: game, error } = await supabase
      .from('bracket_games')
      .select('*')
      .eq('id', req.params.gameId)
      .eq('bracket_id', req.params.id)
      .single();

    if (error) throw error;

    if (winnerTeamId && winnerTeamId !== game.team1_id && winnerTeamId !== game.team2_id) {
      return res.status(400).json({ error: 'Winner must be one of the teams in this game' });
    }

    await supabase
      .from('bracket_games')
      .update({
        winner_team_id: winnerTeamId || null,
        status: winnerTeamId ? 'completed' : 'scheduled',
        updated_at: new Date().toISOString()
      })
      .eq('id', game.id);

    await recomputeBracketGames(req.params.id);
    await recalcEntries(req.params.id);

    res.json({ message: 'Winner updated and bracket recalculated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update winner: ' + err.message });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { data: bracket, error } = await supabase
      .from('brackets')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    const [{ data: teams }, { data: games }] = await Promise.all([
      supabase.from('bracket_teams').select('*').eq('bracket_id', bracket.id).order('seed', { ascending: true }),
      supabase.from('bracket_games').select('*').eq('bracket_id', bracket.id).order('round', { ascending: true }).order('game_number', { ascending: true })
    ]);

    res.json({ bracket, teams: teams || [], games: games || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bracket: ' + err.message });
  }
});

router.get('/:id/leaderboard', optionalAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bracket_entries')
      .select(`
        id,
        points,
        payout,
        created_at,
        users (
          id,
          username,
          is_admin
        )
      `)
      .eq('bracket_id', req.params.id)
      .order('points', { ascending: false });

    if (error) throw error;

    const filtered = (data || []).filter((entry) => !entry.users?.is_admin);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bracket leaderboard: ' + err.message });
  }
});

router.get('/:id/entries/me', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bracket_entries')
      .select('*')
      .eq('bracket_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json(data || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entry: ' + err.message });
  }
});

router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  const bracketId = req.params.id;

  try {
    // Get bracket details
    const { data: bracket, error: bracketError } = await supabase
      .from('brackets')
      .select('*')
      .eq('id', bracketId)
      .single();

    if (bracketError || !bracket) {
      return res.status(404).json({ error: 'Bracket not found' });
    }

    // Get all bracket entries to reverse entry fees if applicable
    const { data: entries, error: entriesError } = await supabase
      .from('bracket_entries')
      .select('user_id')
      .eq('bracket_id', bracketId);

    if (entriesError && entriesError.code !== 'PGRST116') throw entriesError;

    // Reverse entry fees for all users who entered
    if (entries && entries.length > 0 && Number(bracket.entry_fee || 0) > 0) {
      for (const entry of entries) {
        await User.updateBalance(entry.user_id, Number(bracket.entry_fee));
        await Transaction.create(
          entry.user_id,
          'bracket_refund',
          Number(bracket.entry_fee),
          `${bracket.name} bracket deleted - entry fee refunded`
        );
      }
    }

    // Delete bracket entries
    const { error: deleteEntriesError } = await supabase
      .from('bracket_entries')
      .delete()
      .eq('bracket_id', bracketId);

    if (deleteEntriesError) throw deleteEntriesError;

    // Delete bracket games
    const { error: deleteGamesError } = await supabase
      .from('bracket_games')
      .delete()
      .eq('bracket_id', bracketId);

    if (deleteGamesError) throw deleteGamesError;

    // Delete bracket teams
    const { error: deleteTeamsError } = await supabase
      .from('bracket_teams')
      .delete()
      .eq('bracket_id', bracketId);

    if (deleteTeamsError) throw deleteTeamsError;

    // Delete bracket
    const { error: deleteBracketError } = await supabase
      .from('brackets')
      .delete()
      .eq('id', bracketId);

    if (deleteBracketError) throw deleteBracketError;

    res.json({ message: `Bracket "${bracket.name}" deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete bracket: ' + err.message });
  }
});

router.post('/:id/entries', authenticateToken, async (req, res) => {
  const { picks } = req.body;

  try {
    const { data: bracket, error: bracketError } = await supabase
      .from('brackets')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (bracketError) throw bracketError;
    if (bracket.status !== 'open') {
      return res.status(400).json({ error: 'Bracket is not open for entries' });
    }

    const { data: existingEntry, error: existingEntryError } = await supabase
      .from('bracket_entries')
      .select('id')
      .eq('bracket_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (existingEntryError && existingEntryError.code !== 'PGRST116') {
      throw existingEntryError;
    }

    if (existingEntry) {
      return res.status(400).json({ error: 'You already submitted a bracket' });
    }

    // Get all games for this bracket
    const { data: allGames, error: gamesError } = await supabase
      .from('bracket_games')
      .select('id, round, game_number, team1_id, team2_id')
      .eq('bracket_id', req.params.id)
      .order('round', { ascending: true })
      .order('game_number', { ascending: true });

    if (gamesError) throw gamesError;
    if (!allGames || allGames.length === 0) {
      return res.status(400).json({ error: 'Bracket games not seeded yet' });
    }

    // Group games by round
    const gamesByRound = allGames.reduce((acc, game) => {
      if (!acc[game.round]) acc[game.round] = [];
      acc[game.round].push(game);
      return acc;
    }, {});

    const safePicks = coercePicks(picks);

    // Validate Round 1: All 8 picks must be valid (one of the team1/team2 for that game)
    const round1Games = gamesByRound[1] || [];
    if (round1Games.length !== 8) {
      return res.status(400).json({ error: 'Invalid bracket structure - expected 8 quarterfinal games' });
    }

    const round1Picks = {};
    for (const game of round1Games) {
      const pick = safePicks.round1[normalizePickKey(game.game_number)];
      if (!pick) {
        return res.status(400).json({ error: `Complete all Round 1 picks (game ${game.game_number} missing)` });
      }
      if (pick !== game.team1_id && pick !== game.team2_id) {
        return res.status(400).json({ error: `Round 1 game ${game.game_number} pick must be one of the teams` });
      }
      round1Picks[game.game_number] = pick;
    }

    // Validate Round 2: 4 picks, each must be a winner from the corresponding games
    // Game 1: from R1 games 1-2, Game 2: from R1 games 3-4, Game 3: from R1 games 5-6, Game 4: from R1 games 7-8
    const round2Games = gamesByRound[2] || [];
    if (round2Games.length !== 4) {
      return res.status(400).json({ error: 'Invalid bracket structure - expected 4 semifinal games' });
    }

    const round2Picks = {};
    const round2Validations = [
      { gameNum: 1, allowedFrom: [1, 2] },
      { gameNum: 2, allowedFrom: [3, 4] },
      { gameNum: 3, allowedFrom: [5, 6] },
      { gameNum: 4, allowedFrom: [7, 8] }
    ];

    for (const validation of round2Validations) {
      const pick = safePicks.round2[normalizePickKey(validation.gameNum)];
      if (!pick) {
        return res.status(400).json({ error: `Complete all Round 2 picks (game ${validation.gameNum} missing)` });
      }
      const allowedTeams = validation.allowedFrom.map(rNum => round1Picks[rNum]);
      if (!allowedTeams.includes(pick)) {
        return res.status(400).json({ error: `Round 2 game ${validation.gameNum} must come from Round 1 winners` });
      }
      round2Picks[validation.gameNum] = pick;
    }

    // Validate Round 3: 2 picks, each from corresponding R2 winners
    // Game 1: from R2 games 1-2, Game 2: from R2 games 3-4
    const round3Games = gamesByRound[3] || [];
    if (round3Games.length !== 2) {
      return res.status(400).json({ error: 'Invalid bracket structure - expected 2 final games' });
    }

    const round3Picks = {};
    const round3Validations = [
      { gameNum: 1, allowedFrom: [1, 2] },
      { gameNum: 2, allowedFrom: [3, 4] }
    ];

    for (const validation of round3Validations) {
      const pick = safePicks.round3[normalizePickKey(validation.gameNum)];
      if (!pick) {
        return res.status(400).json({ error: `Complete all Round 3 picks (game ${validation.gameNum} missing)` });
      }
      const allowedTeams = validation.allowedFrom.map(rNum => round2Picks[rNum]);
      if (!allowedTeams.includes(pick)) {
        return res.status(400).json({ error: `Round 3 game ${validation.gameNum} must come from Round 2 winners` });
      }
      round3Picks[validation.gameNum] = pick;
    }

    // Validate Round 4 (Championship): 1 pick from R3 winners
    const round4Games = gamesByRound[4] || [];
    if (round4Games.length !== 1) {
      return res.status(400).json({ error: 'Invalid bracket structure - expected 1 championship game' });
    }

    const round4Pick = safePicks.round4[normalizePickKey(1)];
    if (!round4Pick) {
      return res.status(400).json({ error: 'Complete the championship pick' });
    }
    const allowedChampionshipTeams = [round3Picks[1], round3Picks[2]];
    if (!allowedChampionshipTeams.includes(round4Pick)) {
      return res.status(400).json({ error: 'Championship pick must come from your Round 3 winners' });
    }

    // Deduct entry fee if applicable
    if (Number(bracket.entry_fee || 0) > 0) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (Number(user.balance || 0) < Number(bracket.entry_fee)) {
        return res.status(400).json({ error: 'Insufficient balance for entry fee' });
      }

      await Transaction.create(
        req.user.id,
        'bracket_entry',
        -Number(bracket.entry_fee),
        `${bracket.name} bracket entry fee`
      );
      await User.updateBalance(req.user.id, -Number(bracket.entry_fee));
    }

    // Insert the bracket entry
    const { data: entry, error: insertError } = await supabase
      .from('bracket_entries')
      .insert({
        bracket_id: req.params.id,
        user_id: req.user.id,
        picks: safePicks,
        points: 0,
        payout: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit bracket: ' + err.message });
  }
});

module.exports = router;
