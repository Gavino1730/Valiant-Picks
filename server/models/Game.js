const { supabase } = require('../supabase');
const { handleSupabaseError, isHtmlError } = require('../utils/supabaseErrorHandler');

const Game = {
  create: async (gameData) => {
    try {
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
        notes,
        teamId
      } = gameData;

      const { data, error } = await supabase
        .from('games')
        .insert([{
          team_type: teamType,
          home_team: homeTeam,
          away_team: awayTeam,
          game_date: gameDate,
          game_time: gameTime,
          location,
          type: gameData.gameType || null,
          winning_odds: winningOdds,
          losing_odds: losingOdds,
          spread,
          spread_odds: spreadOdds,
          over_under: overUnder,
          over_odds: overOdds,
          under_odds: underOdds,
          notes,
          team_id: teamId || null
        }])
        .select()
        .single();

      if (error) throw error;
      return { id: data.id };
    } catch (err) {
      throw new Error(`Error creating game: ${err.message}`);
    }
  },

  getAll: async ({ visibleOnly = false } = {}) => {
    try {
      let query = supabase
        .from('games')
        .select('*')
        .order('game_date', { ascending: true });

      if (visibleOnly) {
        query = query.eq('is_visible', true);
      }

      const { data, error } = await query;

      if (error) {
        handleSupabaseError(error, 'fetching games');
      }
      return data || [];
    } catch (err) {
      if (err.message.includes('Database temporarily unavailable')) {
        throw err;
      }
      if (isHtmlError(err)) {
        throw new Error('Database temporarily unavailable. Please try again in a few moments.');
      }
      throw err;
    }
  },

  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      throw new Error(`Error fetching game: ${err.message}`);
    }
  },

  updateStatus: async (id, status) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return { changes: 1 };
    } catch (err) {
      throw new Error(`Error updating game: ${err.message}`);
    }
  },

  update: async (id, gameData) => {
    try {
      const updateFields = {
        team_type: gameData.teamType,
        home_team: gameData.homeTeam,
        away_team: gameData.awayTeam,
        game_date: gameData.gameDate,
        game_time: gameData.gameTime,
        location: gameData.location,
        type: gameData.gameType || null,
        winning_odds: gameData.winningOdds,
        losing_odds: gameData.losingOdds,
        spread: gameData.spread,
        spread_odds: gameData.spreadOdds,
        over_under: gameData.overUnder,
        over_odds: gameData.overOdds,
        under_odds: gameData.underOdds,
        notes: gameData.notes,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('games')
        .update(updateFields)
        .eq('id', id);

      if (error) throw error;
      return { changes: 1 };
    } catch (err) {
      throw new Error(`Error updating game: ${err.message}`);
    }
  },

  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { changes: 1 };
    } catch (err) {
      throw new Error(`Error deleting game: ${err.message}`);
    }
  },

  toggleVisibility: async (id, isVisible) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return { changes: 1 };
    } catch (err) {
      throw new Error(`Error toggling game visibility: ${err.message}`);
    }
  }
};

module.exports = Game;
