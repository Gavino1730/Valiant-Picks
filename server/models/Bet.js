const { supabase } = require('../supabase');

class Bet {
  static async create(userId, gameId, confidence, selectedTeam, amount, odds) {
    const potentialWin = amount * odds;
    try {
      const { data, error } = await supabase
        .from('bets')
        .insert([{
          user_id: userId,
          game_id: gameId,
          bet_type: confidence,
          selected_team: selectedTeam,
          amount,
          odds,
          potential_win: potentialWin
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      throw new Error(`Error creating bet: ${err.message}`);
    }
  }

  static async findByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          games (
            home_team,
            away_team,
            team_type,
            game_date,
            game_time,
            status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error in findByUserId:', error);
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error('findByUserId exception:', err);
      throw new Error(`Error fetching user bets: ${err.message}`);
    }
  }

  static async findById(betId) {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          games (
            home_team,
            away_team,
            team_type,
            game_date,
            game_time
          )
        `)
        .eq('id', betId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      throw new Error(`Error fetching bet: ${err.message}`);
    }
  }

  static async updateSelectedTeam(betId, selectedTeam) {
    try {
      const { error } = await supabase
        .from('bets')
        .update({ selected_team: selectedTeam, updated_at: new Date().toISOString() })
        .eq('id', betId);

      if (error) throw error;
      return { changes: 1 };
    } catch (err) {
      throw new Error(`Error updating bet selected team: ${err.message}`);
    }
  }

  static async updateStatus(betId, status, outcome = null) {
    try {
      const updateData = { status, updated_at: new Date().toISOString() };
      if (outcome) updateData.outcome = outcome;

      const { error } = await supabase
        .from('bets')
        .update(updateData)
        .eq('id', betId);

      if (error) throw error;
      return { changes: 1 };
    } catch (err) {
      throw new Error(`Error updating bet: ${err.message}`);
    }
  }

  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          games (
            home_team,
            away_team,
            team_type,
            game_date,
            game_time,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      throw new Error(`Error fetching all bets: ${err.message}`);
    }
  }

  static async findByUserAndGame(userId, gameId) {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      throw new Error(`Error checking existing bet: ${err.message}`);
    }
  }
}

module.exports = Bet;
