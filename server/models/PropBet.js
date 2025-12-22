const { supabase } = require('../supabase');

const PropBet = {
  create: async (propBetData) => {
    try {
      const {
        title,
        description,
        teamType,
        options = [],
        optionOdds = {},
        expiresAt,
        // Legacy support for yesOdds/noOdds
        yesOdds,
        noOdds
      } = propBetData;

      // If options not provided but yesOdds/noOdds are, use legacy format
      let finalOptions = options;
      let finalOptionOdds = optionOdds;

      if (!options || options.length === 0) {
        finalOptions = ['Yes', 'No'];
        finalOptionOdds = {
          'Yes': parseFloat(yesOdds || 1.5),
          'No': parseFloat(noOdds || 1.5)
        };
      }

      const { data, error } = await supabase
        .from('prop_bets')
        .insert([{
          title,
          description,
          team_type: teamType,
          options: finalOptions,
          option_odds: finalOptionOdds,
          expires_at: expiresAt,
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;
      return { id: data.id };
    } catch (err) {
      throw new Error(`Error creating prop bet: ${err.message}`);
    }
  },

  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('prop_bets')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      throw new Error(`Error fetching prop bets: ${err.message}`);
    }
  },

  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('prop_bets')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      throw new Error(`Error fetching prop bet: ${err.message}`);
    }
  },

  updateStatus: async (id, status, outcome = null) => {
    try {
      const updateData = { 
        status, 
        updated_at: new Date().toISOString() 
      };
      
      if (outcome !== null) {
        updateData.outcome = outcome;
      }

      const { error } = await supabase
        .from('prop_bets')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return { changes: 1 };
    } catch (err) {
      throw new Error(`Error updating prop bet: ${err.message}`);
    }
  },

  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('prop_bets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { changes: 1 };
    } catch (err) {
      throw new Error(`Error deleting prop bet: ${err.message}`);
    }
  }
};

module.exports = PropBet;
