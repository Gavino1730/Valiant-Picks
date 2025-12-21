const { supabase } = require('../supabase');

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
          winning_odds: winningOdds,
          losing_odds: losingOdds,
          spread,
          spread_odds: spreadOdds,
          over_under: overUnder,
          over_odds: overOdds,
          under_odds: underOdds,
          notes,
          team_id: teamId || 'boys'
        }])
        .select()
        .single();

      if (error) throw error;
      return { id: data.id };
    } catch (err) {
      throw new Error(`Error creating game: ${err.message}`);
    }
  },

  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .neq('status', 'completed')
        .order('game_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      throw new Error(`Error fetching games: ${err.message}`);
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
