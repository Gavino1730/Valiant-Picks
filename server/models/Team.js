const supabase = require('../supabase');

class Team {
  static async create(teamData) {
    const { data, error } = await supabase
      .from('teams')
      .insert([teamData])
      .select();

    if (error) throw error;
    return data[0];
  }

  static async getAll() {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  }

  static async getById(id) {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (teamError) throw teamError;

    // Fetch associated players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', id)
      .order('number');

    if (playersError) throw playersError;

    return { ...team, players };
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  }

  static async delete(id) {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

module.exports = Team;
