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

      // Always keep yes/no columns for backward compatibility,
      // but also persist custom options + odds when provided.
      const finalYesOdds = yesOdds
        ? parseFloat(yesOdds)
        : (optionOdds['Yes'] ? parseFloat(optionOdds['Yes']) : 1.5);
      const finalNoOdds = noOdds
        ? parseFloat(noOdds)
        : (optionOdds['No'] ? parseFloat(optionOdds['No']) : 1.5);

      // If no expiration date provided, set to 1 year from now
      const finalExpiresAt = expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('prop_bets')
        .insert([{
          title,
          description,
          team_type: teamType,
          yes_odds: finalYesOdds,
          no_odds: finalNoOdds,
          // These JSON columns are used by the frontend to render
          // custom options instead of default YES/NO.
          options: options && options.length ? options : null,
          option_odds: optionOdds && Object.keys(optionOdds).length ? optionOdds : null,
          expires_at: finalExpiresAt,
          status: 'active',
          is_visible: true
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      throw new Error(`Error fetching prop bets: ${err.message}`);
    }
  },

  getVisible: async () => {
    try {
      const { data, error } = await supabase
        .from('prop_bets')
        .select('*')
        .eq('status', 'active')
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      throw new Error(`Error fetching visible prop bets: ${err.message}`);
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

  update: async (id, propBetData) => {
    try {
      const {
        title,
        description,
        teamType,
        options,
        optionOdds,
        expiresAt,
        yesOdds,
        noOdds
      } = propBetData;

      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (teamType !== undefined) updateData.team_type = teamType;
      if (expiresAt !== undefined) updateData.expires_at = expiresAt;
      
      // Handle odds - support both old format (yes/no) and new format (custom options)
      if (yesOdds !== undefined) updateData.yes_odds = parseFloat(yesOdds);
      if (noOdds !== undefined) updateData.no_odds = parseFloat(noOdds);
      if (options !== undefined) updateData.options = options;
      if (optionOdds !== undefined) updateData.option_odds = optionOdds;

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

  toggleVisibility: async (id) => {
    try {
      // First get the current visibility state
      const { data: propBet, error: fetchError } = await supabase
        .from('prop_bets')
        .select('is_visible')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Toggle the visibility
      const { error } = await supabase
        .from('prop_bets')
        .update({ is_visible: !propBet.is_visible })
        .eq('id', id);

      if (error) throw error;
      return { changes: 1, is_visible: !propBet.is_visible };
    } catch (err) {
      throw new Error(`Error toggling visibility: ${err.message}`);
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
