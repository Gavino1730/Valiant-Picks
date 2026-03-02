const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Helper function for consistent currency rounding
const roundCurrency = (amount) => Math.round(amount * 100) / 100;

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

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(gameDate)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  // Validate time format if provided (HH:MM:SS or HH:MM)
  if (gameTime) {
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!timeRegex.test(gameTime)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM or HH:MM:SS' });
    }
  }

  // Validate date is valid
  const testDate = new Date(gameDate);
  if (isNaN(testDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date value' });
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

// Get all upcoming games (public - only visible games, even for admins when betting)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const games = await Game.getAll();
    // Always filter to only visible games (explicitly true)
    const filteredGames = games.filter(g => g.is_visible === true);
    res.json(filteredGames);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching games: ' + err.message });
  }
});

// Admin: Get all games (including hidden ones)
router.get('/admin/all', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can view all games' });
  }

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

// Admin: Toggle game visibility
router.put('/:id/visibility', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can toggle game visibility' });
  }

  const { isVisible } = req.body;
  if (typeof isVisible !== 'boolean') {
    return res.status(400).json({ error: 'isVisible must be a boolean' });
  }

  try {
    const result = await Game.toggleVisibility(req.params.id, isVisible);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json({ message: `Game ${isVisible ? 'shown' : 'hidden'} successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Error toggling visibility: ' + err.message });
  }
});

// Admin: Set game outcome and resolve all bets
router.put('/:id/outcome', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can set game outcomes' });
  }

  const { winningTeam, homeScore, awayScore, status } = req.body;

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

    // Build update object
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // If status is provided, update it
    if (status) {
      updateData.status = status;
    }

    // If scores are provided, update them
    if (homeScore !== undefined) {
      updateData.home_score = parseInt(homeScore);
    }
    if (awayScore !== undefined) {
      updateData.away_score = parseInt(awayScore);
    }

    // If marking as completed with a winner, resolve bets
    if (winningTeam) {
      updateData.status = 'completed';
      updateData.result = winningTeam;
    }

    // Update game
    await supabase
      .from('games')
      .update(updateData)
      .eq('id', req.params.id);

    let betsResolved = 0;
    let winningsDistributed = 0;

    // Only resolve bets if a winner was declared
    if (winningTeam) {
      // Get all pending bets for this game
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('game_id', req.params.id)
        .eq('status', 'pending');

      if (betsError) throw betsError;

      // Process each bet
      for (const bet of bets || []) {
        const won = bet.selected_team === winningTeam;
        const outcome = won ? 'won' : 'lost';

        // Update bet status
        await Bet.updateStatus(bet.id, 'resolved', outcome);

        // Create notification
        const Notification = require('../models/Notification');
        if (won) {
          let payout = bet.potential_win || (bet.amount * bet.odds);
          
          // Add game bonus to payout (works for girls, boys, and general bonuses)
          if (bet.girls_game_bonus && bet.girls_game_bonus > 0) {
            const bonusAmount = payout * bet.girls_game_bonus;
            payout += bonusAmount;
            const bonusPercent = (bet.girls_game_bonus * 100).toFixed(0);
            
            // Determine bonus emoji based on game type
            const gameType = game.team_type || '';
            let bonusEmoji = '⭐';
            if (gameType.toLowerCase().includes('girl')) {
              bonusEmoji = '💗';
            } else if (gameType.toLowerCase().includes('boy')) {
              bonusEmoji = '🏀';
            }
            
            await User.updateBalance(bet.user_id, payout);
            await Transaction.create(
              bet.user_id,
              'win',
              payout,
              `Won bet on ${bet.selected_team} (${bet.bet_type} confidence) with +${bonusPercent}% bonus`
            );
            await Notification.create(
              bet.user_id,
              `🎉${bonusEmoji} Bet Won with Bonus!`,
              `Your ${bet.bet_type} confidence bet on ${bet.selected_team} won ${payout.toFixed(0)} Valiant Bucks (including +${bonusPercent}% bonus)!`,
              'bet_won'
            );
          } else {
            await User.updateBalance(bet.user_id, payout);
            await Transaction.create(
              bet.user_id,
              'win',
              payout,
              `Won bet on ${bet.selected_team} (${bet.bet_type} confidence)`
            );
            await Notification.create(
              bet.user_id,
              '🎉 Bet Won!',
              `Your ${bet.bet_type} confidence bet on ${bet.selected_team} won ${payout} Valiant Bucks!`,
              'bet_won'
            );
          }
          winningsDistributed += payout;
        } else {
          await Notification.create(
            bet.user_id,
            '😔 Bet Lost',
            `Your ${bet.bet_type} confidence bet on ${bet.selected_team} lost.`,
            'bet_lost'
          );
        }

        betsResolved++;
      }
    }

    res.json({ 
      message: winningTeam ? 'Game outcome set and bets resolved' : 'Game updated successfully',
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
    const { supabase } = require('../supabase');
    
    // Get all bets for this game
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('id, user_id, amount')
      .eq('game_id', req.params.id);
    
    if (betsError) throw betsError;
    
    // Refund all users
    if (bets && bets.length > 0) {
      // Group by user_id to sum refunds
      const refundMap = {};
      bets.forEach(bet => {
        if (!refundMap[bet.user_id]) {
          refundMap[bet.user_id] = 0;
        }
        refundMap[bet.user_id] += bet.amount;
      });
      
      // Update user balances and create transactions
      for (const [userId, refundAmount] of Object.entries(refundMap)) {
        // Update user balance
        const { data: currentUser, error: userError } = await supabase
          .from('users')
          .select('balance')
          .eq('id', userId)
          .single();
        
        if (userError) throw userError;
        
        const newBalance = (currentUser.balance || 0) + refundAmount;
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('id', userId);
        
        if (updateError) throw updateError;
        
        // Create transaction record
        const { error: transError } = await supabase
          .from('transactions')
          .insert([{
            user_id: userId,
            type: 'refund',
            amount: refundAmount,
            description: 'Refund for deleted game',
            status: 'completed'
          }]);
        
        if (transError) throw transError;
      }
    }
    
    // Now delete the game (bets will be cascade deleted)
    const result = await Game.delete(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json({ 
      message: 'Game deleted and bets refunded',
      betsRefunded: bets?.length || 0,
      totalRefunded: bets?.reduce((sum, b) => sum + b.amount, 0) || 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting game: ' + err.message });
  }
});

// Admin: Toggle visibility for all games
router.put('/bulk/toggle-visibility', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can toggle visibility' });
  }

  const { isVisible } = req.body;

  try {
    const { supabase } = require('../supabase');
    const { data, error } = await supabase
      .from('games')
      .update({ is_visible: isVisible })
      .neq('id', 0); // Update all games
    
    if (error) throw error;

    res.json({ message: `All games ${isVisible ? 'shown' : 'hidden'}` });
  } catch (err) {
    res.status(500).json({ error: 'Error toggling visibility: ' + err.message });
  }
});

// Admin: Delete all games
router.delete('/bulk/delete-all', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can delete all games' });
  }

  try {
    const { supabase } = require('../supabase');
    
    // Get all bets
    const { data: allBets, error: betsError } = await supabase
      .from('bets')
      .select('id, user_id, amount');
    
    if (betsError) throw betsError;
    
    // Refund all users
    if (allBets && allBets.length > 0) {
      // Group by user_id to sum refunds
      const refundMap = {};
      allBets.forEach(bet => {
        if (!refundMap[bet.user_id]) {
          refundMap[bet.user_id] = 0;
        }
        refundMap[bet.user_id] += bet.amount;
      });
      
      // Update user balances and create transactions
      for (const [userId, refundAmount] of Object.entries(refundMap)) {
        // Update user balance
        const { data: currentUser, error: userError } = await supabase
          .from('users')
          .select('balance')
          .eq('id', userId)
          .single();
        
        if (userError) throw userError;
        
        const newBalance = (currentUser.balance || 0) + refundAmount;
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('id', userId);
        
        if (updateError) throw updateError;
        
        // Create transaction record
        const { error: transError } = await supabase
          .from('transactions')
          .insert([{
            user_id: userId,
            type: 'refund',
            amount: refundAmount,
            description: 'Refund for deleted games',
            status: 'completed'
          }]);
        
        if (transError) throw transError;
      }
    }
    
    // Now delete all games
    const { data, error } = await supabase
      .from('games')
      .delete()
      .neq('id', 0);
    
    if (error) throw error;

    res.json({ 
      message: 'All games deleted and bets refunded',
      betsRefunded: allBets?.length || 0,
      usersRefunded: Object.keys(allBets?.reduce((map, b) => (map[b.user_id] = true, map), {}) || {}).length,
      totalRefunded: allBets?.reduce((sum, b) => sum + b.amount, 0) || 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting games: ' + err.message });
  }
});

// Admin: Retroactive payout for OES games (winning bets that weren't paid)
router.post('/retroactive-payout-oes', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Only admins can process retroactive payouts' });
  }

  const { dryRun = true } = req.body; // Default to dry run for safety

  try {
    const Bet = require('../models/Bet');
    const User = require('../models/User');
    const Transaction = require('../models/Transaction');
    const Notification = require('../models/Notification');
    const { supabase } = require('../supabase');

    // Find all winning bets for OES games that don't have corresponding win transactions
    // Step 1: Get all resolved winning bets
    const { data: allWinningBets, error: betsError } = await supabase
      .from('bets')
      .select(`
        id,
        user_id,
        game_id,
        selected_team,
        bet_type,
        amount,
        odds,
        potential_win,
        status,
        outcome,
        created_at,
        updated_at,
        games (
          home_team,
          away_team,
          team_type,
          game_date,
          result
        )
      `)
      .eq('status', 'resolved')
      .eq('outcome', 'won')
      .not('game_id', 'is', null);

    if (betsError) throw betsError;

    // Step 2: Filter to only OES games
    const unpaidBets = (allWinningBets || []).filter(bet => {
      if (!bet.games) return false;
      const homeTeam = (bet.games.home_team || '').toLowerCase();
      const awayTeam = (bet.games.away_team || '').toLowerCase();
      return homeTeam.includes('oregon episcopal') || 
             awayTeam.includes('oregon episcopal') ||
             homeTeam.includes('oes') || 
             awayTeam.includes('oes');
    });

    // Filter out bets that already have win transactions
    // Optimize: Get all potential transactions in one query instead of N queries
    const betUpdatedTimes = unpaidBets.map(bet => ({
      userId: bet.user_id,
      minTime: new Date(new Date(bet.updated_at).getTime() - 10000).toISOString(),
      maxTime: new Date(new Date(bet.updated_at).getTime() + 10000).toISOString(),
      payout: bet.potential_win || (bet.amount * bet.odds)
    }));

    // Get all win transactions for these users in the time range
    const userIds = [...new Set(unpaidBets.map(b => b.user_id))];
    const minTime = Math.min(...betUpdatedTimes.map(b => new Date(b.minTime).getTime()));
    const maxTime = Math.max(...betUpdatedTimes.map(b => new Date(b.maxTime).getTime()));

    const { data: allWinTransactions, error: txError } = await supabase
      .from('transactions')
      .select('id, user_id, amount, created_at')
      .eq('type', 'win')
      .in('user_id', userIds)
      .gte('created_at', new Date(minTime).toISOString())
      .lte('created_at', new Date(maxTime).toISOString());

    if (txError) throw txError;

    // Build index of transactions by user for fast lookup
    const transactionsByUser = {};
    (allWinTransactions || []).forEach(tx => {
      if (!transactionsByUser[tx.user_id]) {
        transactionsByUser[tx.user_id] = [];
      }
      transactionsByUser[tx.user_id].push(tx);
    });

    const betsToPayOut = [];
    for (let i = 0; i < unpaidBets.length; i++) {
      const bet = unpaidBets[i];
      const betTiming = betUpdatedTimes[i];
      const userTransactions = transactionsByUser[bet.user_id] || [];

      // Pre-calculate timestamps for performance
      const minTimeMs = new Date(betTiming.minTime).getTime();
      const maxTimeMs = new Date(betTiming.maxTime).getTime();

      // Check if a matching transaction exists
      const hasMatchingTransaction = userTransactions.some(tx => {
        const txTime = new Date(tx.created_at).getTime();
        const inTimeWindow = txTime >= minTimeMs && txTime <= maxTimeMs;
        const matchesAmount = Math.abs(tx.amount - betTiming.payout) < 0.01;
        return inTimeWindow && matchesAmount;
      });

      if (!hasMatchingTransaction) {
        betsToPayOut.push({
          ...bet,
          payout: betTiming.payout
        });
      }
    }

    if (betsToPayOut.length === 0) {
      return res.json({ 
        message: 'No unpaid winning bets found for OES games',
        betsProcessed: 0,
        totalPaid: 0
      });
    }

    // Calculate totals
    const totalPayout = betsToPayOut.reduce((sum, bet) => sum + bet.payout, 0);
    const affectedUsers = [...new Set(betsToPayOut.map(bet => bet.user_id))];

    // If dry run, just return what would be paid
    if (dryRun) {
      // Get usernames for the report
      const userPayouts = {};
      for (const bet of betsToPayOut) {
        if (!userPayouts[bet.user_id]) {
          const userData = await User.findById(bet.user_id);
          userPayouts[bet.user_id] = {
            username: userData?.username || 'Unknown',
            bets: [],
            totalOwed: 0
          };
        }
        userPayouts[bet.user_id].bets.push({
          betId: bet.id,
          amount: bet.amount,
          odds: bet.odds,
          payout: bet.payout,
          gameDate: bet.games?.game_date,
          teamType: bet.games?.team_type
        });
        userPayouts[bet.user_id].totalOwed += bet.payout;
      }

      return res.json({
        dryRun: true,
        message: 'DRY RUN - No changes made. Set dryRun=false to execute payouts.',
        summary: {
          betsToProcess: betsToPayOut.length,
          affectedUsers: affectedUsers.length,
          totalPayout: roundCurrency(totalPayout)
        },
        userPayouts: Object.entries(userPayouts).map(([userId, data]) => ({
          userId,
          username: data.username,
          betCount: data.bets.length,
          totalOwed: roundCurrency(data.totalOwed),
          bets: data.bets
        }))
      });
    }

    // Execute payouts
    let successfulPayouts = 0;
    const payoutResults = [];

    for (const bet of betsToPayOut) {
      try {
        // Update user balance
        await User.updateBalance(bet.user_id, bet.payout);

        // Create transaction record
        await Transaction.create(
          bet.user_id,
          'win',
          bet.payout,
          `Retroactive payout: ${bet.bet_type} confidence bet on ${bet.selected_team} (OES game)`
        );

        successfulPayouts++;
        payoutResults.push({
          betId: bet.id,
          userId: bet.user_id,
          payout: bet.payout,
          status: 'success'
        });
      } catch (error) {
        console.error(`Failed to process payout for bet ${bet.id}:`, error);
        payoutResults.push({
          betId: bet.id,
          userId: bet.user_id,
          payout: bet.payout,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Send notifications to affected users
    const userPayoutTotals = {};
    for (const result of payoutResults.filter(r => r.status === 'success')) {
      if (!userPayoutTotals[result.userId]) {
        userPayoutTotals[result.userId] = { count: 0, total: 0 };
      }
      userPayoutTotals[result.userId].count++;
      userPayoutTotals[result.userId].total += result.payout;
    }

    for (const [userId, data] of Object.entries(userPayoutTotals)) {
      await Notification.create(
        userId,
        '💰 Retroactive Payout - OES Games',
        `You received ${roundCurrency(data.total)} Valiant Bucks from ${data.count} winning bet(s) on OES games that were not paid out previously. Sorry for the delay!`,
        'system'
      );
    }

    res.json({
      message: 'Retroactive payouts processed',
      betsProcessed: successfulPayouts,
      totalPaid: roundCurrency(payoutResults.filter(r => r.status === 'success').reduce((sum, r) => sum + r.payout, 0)),
      affectedUsers: Object.keys(userPayoutTotals).length,
      results: payoutResults
    });
  } catch (err) {
    console.error('Error processing retroactive payouts:', err);
    res.status(500).json({ error: 'Error processing retroactive payouts: ' + err.message });
  }
});

module.exports = router;
