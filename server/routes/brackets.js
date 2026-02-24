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

  // Dynamically propagate winners round-by-round
  const rounds = Object.keys(byRound).map(Number).sort((a, b) => a - b);
  const updatedByRound = { ...byRound };

  for (let i = 1; i < rounds.length; i++) {
    const prevRound = rounds[i - 1];
    const currRound = rounds[i];
    const prevGames = updatedByRound[prevRound] || {};
    const currGames = updatedByRound[currRound] || {};
    const prevGameNumbers = Object.keys(prevGames).map(Number).sort((a, b) => a - b);

    // Each game in this round gets winners from 2 consecutive previous-round games
    const currGameNumbers = Object.keys(currGames).map(Number).sort((a, b) => a - b);
    for (let g = 0; g < currGameNumbers.length; g++) {
      const gameNum = currGameNumbers[g];
      const prevIdx = g * 2;
      const team1Source = prevGameNumbers[prevIdx];
      const team2Source = prevGameNumbers[prevIdx + 1];
      const team1Id = team1Source != null ? (prevGames[team1Source]?.winner_team_id || null) : null;
      const team2Id = team2Source != null ? (prevGames[team2Source]?.winner_team_id || null) : null;

      const updated = await updateGame(currGames[gameNum], team1Id, team2Id);
      if (updated) {
        if (!updatedByRound[currRound]) updatedByRound[currRound] = {};
        updatedByRound[currRound][gameNum] = updated;
      }
    }
  }

  // Check if the final round's only game has a winner → bracket completed
  const finalRound = rounds[rounds.length - 1];
  const finalGames = updatedByRound[finalRound] || {};
  const finalGameNums = Object.keys(finalGames).map(Number);
  if (finalGameNums.length === 1 && finalGames[finalGameNums[0]]?.winner_team_id) {
    await supabase
      .from('brackets')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', bracketId);
  }
};

router.get('/active', optionalAuth, async (req, res) => {
  try {
    const gender = req.query.gender || 'boys';
    let query = supabase
      .from('brackets')
      .select('*')
      .in('status', ['open', 'locked', 'in-progress', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1);

    // Filter by gender if the column exists, otherwise fall back to name-based detection
    query = query.eq('gender', gender);

    const { data: bracket, error } = await query.maybeSingle();

    if (error) throw error;

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
  const { name, season, entryFee, payoutPerPoint, status, gender } = req.body;

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
        status: status || 'open',
        gender: gender || 'boys'
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
  const { status, entryFee, payoutPerPoint, name, season, gender } = req.body;
  const updates = {
    updated_at: new Date().toISOString()
  };

  if (status) updates.status = status;
  if (entryFee !== undefined) updates.entry_fee = entryFee;
  if (payoutPerPoint !== undefined) updates.payout_per_point = payoutPerPoint;
  if (name) updates.name = name;
  if (season !== undefined) updates.season = season;
  if (gender) updates.gender = gender;

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

  const VALID_SIZES = [8, 16];
  if (!Array.isArray(teams) || !VALID_SIZES.includes(teams.length)) {
    return res.status(400).json({ error: `Teams array must include 8 or 16 seeds (got ${Array.isArray(teams) ? teams.length : 0})` });
  }

  const teamCount = teams.length;
  const seeds = teams.map((team) => Number(team.seed));
  const uniqueSeeds = new Set(seeds);
  if (uniqueSeeds.size !== teamCount || seeds.some((seed) => !Number.isInteger(seed) || seed < 1 || seed > teamCount)) {
    return res.status(400).json({ error: `Seeds must be unique numbers from 1 to ${teamCount}` });
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
    const VALID_SIZES = [8, 16];
    if (!teams || !VALID_SIZES.includes(teams.length)) {
      return res.status(400).json({ error: 'You must set 8 or 16 teams before seeding games' });
    }

    const teamCount = teams.length;
    const teamBySeed = teams.reduce((acc, team) => {
      acc[team.seed] = team.id;
      return acc;
    }, {});

    let games;
    if (teamCount === 16) {
      // 16-seed bracket: 8 R1, 4 R2, 2 R3, 1 R4
      games = [
        // Round 1 (8 games) - standard NCAA seeding
        { round: 1, game_number: 1, team1_id: teamBySeed[1],  team2_id: teamBySeed[16] },
        { round: 1, game_number: 2, team1_id: teamBySeed[8],  team2_id: teamBySeed[9] },
        { round: 1, game_number: 3, team1_id: teamBySeed[5],  team2_id: teamBySeed[12] },
        { round: 1, game_number: 4, team1_id: teamBySeed[4],  team2_id: teamBySeed[13] },
        { round: 1, game_number: 5, team1_id: teamBySeed[6],  team2_id: teamBySeed[11] },
        { round: 1, game_number: 6, team1_id: teamBySeed[3],  team2_id: teamBySeed[14] },
        { round: 1, game_number: 7, team1_id: teamBySeed[7],  team2_id: teamBySeed[10] },
        { round: 1, game_number: 8, team1_id: teamBySeed[2],  team2_id: teamBySeed[15] },
        // Round 2 (4 games) - quarterfinals
        { round: 2, game_number: 1, team1_id: null, team2_id: null },
        { round: 2, game_number: 2, team1_id: null, team2_id: null },
        { round: 2, game_number: 3, team1_id: null, team2_id: null },
        { round: 2, game_number: 4, team1_id: null, team2_id: null },
        // Round 3 (2 games) - semifinals
        { round: 3, game_number: 1, team1_id: null, team2_id: null },
        { round: 3, game_number: 2, team1_id: null, team2_id: null },
        // Round 4 (1 game) - championship
        { round: 4, game_number: 1, team1_id: null, team2_id: null }
      ];
    } else {
      // 8-seed bracket: 4 R1, 2 R2, 1 R3
      games = [
        { round: 1, game_number: 1, team1_id: teamBySeed[1], team2_id: teamBySeed[8] },
        { round: 1, game_number: 2, team1_id: teamBySeed[4], team2_id: teamBySeed[5] },
        { round: 1, game_number: 3, team1_id: teamBySeed[2], team2_id: teamBySeed[7] },
        { round: 1, game_number: 4, team1_id: teamBySeed[3], team2_id: teamBySeed[6] },
        { round: 2, game_number: 1, team1_id: null, team2_id: null },
        { round: 2, game_number: 2, team1_id: null, team2_id: null },
        { round: 3, game_number: 1, team1_id: null, team2_id: null }
      ];
    }

    games = games.map((game) => ({
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
    const { data: entries, error: entriesError } = await supabase
      .from('bracket_entries')
      .select('id, points, payout, created_at, user_id')
      .eq('bracket_id', req.params.id)
      .order('points', { ascending: false });

    if (entriesError) throw entriesError;

    if (!entries || entries.length === 0) {
      return res.json([]);
    }

    // Get user info for each entry
    const userIds = [...new Set(entries.map(e => e.user_id))];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, is_admin')
      .in('id', userIds);

    if (usersError) throw usersError;

    // Merge user data into entries
    const userMap = {};
    (users || []).forEach(u => { userMap[u.id] = u; });

    const enrichedEntries = entries.map(entry => ({
      ...entry,
      users: userMap[entry.user_id] || null
    }));

    const filtered = enrichedEntries.filter((entry) => !entry.users?.is_admin);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bracket leaderboard: ' + err.message });
  }
});

router.get('/:id/entry-stats', optionalAuth, async (req, res) => {
  try {
    const { data: entries, error: entriesError } = await supabase
      .from('bracket_entries')
      .select('picks')
      .eq('bracket_id', req.params.id);

    if (entriesError) throw entriesError;

    if (!entries || entries.length === 0) {
      return res.json({ totalEntries: 0 });
    }

    const [{ data: teams }, { data: round1Games }] = await Promise.all([
      supabase
        .from('bracket_teams')
        .select('id, name, seed')
        .eq('bracket_id', req.params.id),
      supabase
        .from('bracket_games')
        .select('game_number, team1_id, team2_id')
        .eq('bracket_id', req.params.id)
        .eq('round', 1)
    ]);

    const teamById = (teams || []).reduce((acc, team) => {
      acc[team.id] = team;
      return acc;
    }, {});

    const underdogByGame = (round1Games || []).reduce((acc, game) => {
      const team1 = teamById[game.team1_id];
      const team2 = teamById[game.team2_id];
      if (!team1 || !team2) return acc;

      const underdog = Number(team1.seed) > Number(team2.seed) ? team1 : team2;
      acc[game.game_number] = {
        teamId: underdog.id,
        teamName: underdog.name
      };
      return acc;
    }, {});

    const championCounts = {};
    const gamePickCounts = {};

    entries.forEach((entry) => {
      const safePicks = coercePicks(entry.picks);
      const championId = safePicks.round4?.game1;
      if (championId) {
        championCounts[championId] = (championCounts[championId] || 0) + 1;
      }

      Object.entries(safePicks.round1 || {}).forEach(([gameKey, teamId]) => {
        const gameNumber = Number(String(gameKey).replace('game', ''));
        if (!gameNumber || !teamId || !underdogByGame[gameNumber]) return;

        if (!gamePickCounts[gameNumber]) {
          gamePickCounts[gameNumber] = { total: 0, underdog: 0 };
        }

        gamePickCounts[gameNumber].total += 1;
        if (teamId === underdogByGame[gameNumber].teamId) {
          gamePickCounts[gameNumber].underdog += 1;
        }
      });
    });

    const totalEntries = entries.length;
    let topChampionPick = null;

    Object.entries(championCounts).forEach(([teamId, count]) => {
      if (!topChampionPick || count > topChampionPick.count) {
        topChampionPick = {
          teamId,
          teamName: teamById[teamId]?.name || 'Unknown',
          count,
          percent: Math.round((count / totalEntries) * 100)
        };
      }
    });

    let rareUpset = null;
    Object.entries(gamePickCounts).forEach(([gameNumber, counts]) => {
      if (!counts.total || !counts.underdog) return;
      const percent = Math.round((counts.underdog / counts.total) * 100);
      if (!rareUpset || percent < rareUpset.percent) {
        rareUpset = {
          teamId: underdogByGame[gameNumber]?.teamId || null,
          teamName: underdogByGame[gameNumber]?.teamName || 'Unknown',
          percent
        };
      }
    });

    res.json({ totalEntries, topChampionPick, rareUpset });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bracket entry stats: ' + err.message });
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

router.delete('/:bracketId/entries/:entryId', authenticateToken, adminOnly, async (req, res) => {
  const { bracketId, entryId } = req.params;

  try {
    // Get the entry
    const { data: entry, error: entryError } = await supabase
      .from('bracket_entries')
      .select('*')
      .eq('id', entryId)
      .eq('bracket_id', bracketId)
      .single();

    if (entryError || !entry) {
      return res.status(404).json({ error: 'Bracket entry not found' });
    }

    // Get bracket for refund info
    const { data: bracket, error: bracketError } = await supabase
      .from('brackets')
      .select('*')
      .eq('id', bracketId)
      .single();

    if (bracketError || !bracket) {
      return res.status(404).json({ error: 'Bracket not found' });
    }

    // Refund entry fee if applicable
    if (Number(bracket.entry_fee || 0) > 0) {
      await User.updateBalance(entry.user_id, Number(bracket.entry_fee));
      await Transaction.create(
        entry.user_id,
        'bracket_refund',
        Number(bracket.entry_fee),
        `User bracket entry removed from ${bracket.name} - entry fee refunded`
      );
    }

    // Delete the entry
    const { error: deleteError } = await supabase
      .from('bracket_entries')
      .delete()
      .eq('id', entryId);

    if (deleteError) throw deleteError;

    res.json({ message: 'Bracket entry deleted and entry fee refunded' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete bracket entry: ' + err.message });
  }
});

router.post('/:id/entries', authenticateToken, async (req, res) => {
  const { picks } = req.body;

  try {
      console.log(`[BRACKET] User ${req.user.id} posting to ${req.params.id}`);
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

    // Determine rounds present in bracket
    const rounds = Object.keys(gamesByRound).map(Number).sort((a, b) => a - b);
    if (rounds.length < 2) {
      return res.status(400).json({ error: 'Invalid bracket structure - need at least 2 rounds' });
    }

    // Validate picks round-by-round dynamically
    const picksByRound = {};

    for (let ri = 0; ri < rounds.length; ri++) {
      const round = rounds[ri];
      const roundKey = `round${round}`;
      const roundGames = gamesByRound[round] || [];
      const roundLabel = ri === rounds.length - 1 ? 'Championship' : `Round ${round}`;

      picksByRound[round] = {};

      for (const game of roundGames) {
        const pick = safePicks[roundKey]?.[normalizePickKey(game.game_number)];
        if (!pick) {
          return res.status(400).json({ error: `Complete all ${roundLabel} picks (game ${game.game_number} missing)` });
        }

        if (ri === 0) {
          // First round: pick must be one of the two seeded teams
          if (pick !== game.team1_id && pick !== game.team2_id) {
            return res.status(400).json({ error: `${roundLabel} game ${game.game_number} pick must be one of the teams` });
          }
        } else {
          // Later rounds: pick must come from corresponding previous-round winners
          const prevRound = rounds[ri - 1];
          const prevPicks = picksByRound[prevRound] || {};
          const prevGameNumbers = Object.keys(prevPicks).map(Number).sort((a, b) => a - b);
          // Each game in this round pulls from 2 consecutive previous-round games
          const prevIdx = (game.game_number - 1) * 2;
          const allowedFrom = [prevGameNumbers[prevIdx], prevGameNumbers[prevIdx + 1]].filter(n => n != null);
          const allowedTeams = allowedFrom.map(gn => prevPicks[gn]);
          if (!allowedTeams.includes(pick)) {
            return res.status(400).json({ error: `${roundLabel} game ${game.game_number} must come from Round ${prevRound} winners` });
          }
        }

        picksByRound[round][game.game_number] = pick;
      }
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
