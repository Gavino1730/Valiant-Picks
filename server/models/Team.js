const { supabase } = require('../supabase');

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
    
    // Parse JSON fields for all teams
    return data.map(team => {
      let parsedSchedule = [];
      let parsedPlayers = [];
      
      try {
        if (team.schedule) {
          parsedSchedule = typeof team.schedule === 'string' ? JSON.parse(team.schedule) : team.schedule;
        }
      } catch (e) {
        console.error('Error parsing schedule for team', team.id, ':', e);
      }
      
      try {
        if (team.players) {
          parsedPlayers = typeof team.players === 'string' ? JSON.parse(team.players) : team.players;
        }
      } catch (e) {
        console.error('Error parsing players for team', team.id, ':', e);
      }
      
      return {
        ...team,
        schedule: parsedSchedule,
        players: parsedPlayers
      };
    });
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

    // Parse JSON fields
    let parsedSchedule = [];
    if (team.schedule) {
      try {
        parsedSchedule = typeof team.schedule === 'string' ? JSON.parse(team.schedule) : team.schedule;
      } catch (e) {
        console.error('Error parsing schedule:', e);
        parsedSchedule = [];
      }
    }

    return { 
      ...team, 
      schedule: parsedSchedule,
      players 
    };
  }

  static async update(id, updates) {
    console.log('Team.update called with id:', id, 'updates:', updates);
    
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    
    console.log('Supabase update result:', data);
    
    if (!data || data.length === 0) {
      throw new Error('No team found with that ID');
    }
    
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
