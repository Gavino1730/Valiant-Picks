const { supabase } = require('../supabase');

// Get current date in Pacific timezone (YYYY-MM-DD format)
const getTodayPacific = () => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Los_Angeles'
  });
  
  const parts = formatter.formatToParts(new Date());
  const date = {};
  parts.forEach(part => {
    date[part.type] = part.value;
  });
  
  // Return YYYY-MM-DD format
  return `${date.year}-${date.month}-${date.day}`;
};

class WheelSpin {
  // Get wheel configuration
  static async getConfig() {
    try {
      const { data, error } = await supabase
        .from('wheel_config')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data || {
        prize_amounts: [500, 750, 1000, 2000, 3000, 5000, 7500, 10000],
        prize_weights: [30, 25, 20, 12, 7, 4, 1, 1],
        spins_per_day: 1
      };
    } catch (error) {
      console.error('Error getting wheel config:', error);
      // Return defaults if error
      return {
        prize_amounts: [500, 750, 1000, 2000, 3000, 5000, 7500, 10000],
        prize_weights: [30, 25, 20, 12, 7, 4, 1, 1],
        spins_per_day: 1
      };
    }
  }

  // Check if user can spin today
  static async canSpin(userId) {
    try {
      const today = getTodayPacific(); // Use Pacific timezone
      const config = await this.getConfig();

      // Count spins today using spin_date instead of spin_time
      const { data, error } = await supabase
        .from('wheel_spins')
        .select('id')
        .eq('user_id', userId)
        .eq('spin_date', today);

      if (error) throw error;

      const spinsToday = data ? data.length : 0;
      const spinsRemaining = config.spins_per_day - spinsToday;

      return {
        canSpin: spinsRemaining > 0,
        spinsRemaining: Math.max(0, spinsRemaining),
        spinsToday: spinsToday,
        maxSpins: config.spins_per_day
      };
    } catch (error) {
      console.error('Error checking spin availability:', error);
      throw error;
    }
  }

  // Weighted random selection
  static selectPrize(amounts, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < amounts.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return amounts[i];
      }
    }
    
    return amounts[0]; // Fallback
  }

  // Spin the wheel
  static async spin(userId) {
    try {
      // Check if can spin
      const canSpinCheck = await this.canSpin(userId);
      if (!canSpinCheck.canSpin) {
        throw new Error('No spins remaining today');
      }

      // Get config
      const config = await this.getConfig();
      
      // Select prize
      const prizeAmount = this.selectPrize(
        config.prize_amounts,
        config.prize_weights
      );

      // Update user balance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const newBalance = parseFloat(userData.balance) + prizeAmount;

      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Record spin
      const today = getTodayPacific(); // Use Pacific timezone
      const { data: spinRecord, error: spinError } = await supabase
        .from('wheel_spins')
        .insert({
          user_id: userId,
          spin_date: today,
          reward_amount: prizeAmount
        })
        .select()
        .single();

      if (spinError) throw spinError;

      // Create transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'wheel_spin',
        amount: prizeAmount,
        description: `Spin wheel reward: ${prizeAmount} VB`,
        status: 'completed'
      });

      return {
        success: true,
        prizeAmount: prizeAmount,
        newBalance: newBalance,
        spinsRemaining: canSpinCheck.spinsRemaining - 1
      };
    } catch (error) {
      console.error('Error spinning wheel:', error);
      throw error;
    }
  }

  // Get spin history
  static async getHistory(userId, limit = 30) {
    try {
      const { data, error } = await supabase
        .from('wheel_spins')
        .select('*')
        .eq('user_id', userId)
        .order('spin_time', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching spin history:', error);
      throw error;
    }
  }

  // Admin: Update wheel config
  static async updateConfig(prizeAmounts, prizeWeights, spinsPerDay) {
    try {
      const { data: currentConfig } = await supabase
        .from('wheel_config')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .single();

      if (currentConfig) {
        // Update existing
        const { data, error } = await supabase
          .from('wheel_config')
          .update({
            prize_amounts: prizeAmounts,
            prize_weights: prizeWeights,
            spins_per_day: spinsPerDay,
            updated_at: new Date()
          })
          .eq('id', currentConfig.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('wheel_config')
          .insert({
            prize_amounts: prizeAmounts,
            prize_weights: prizeWeights,
            spins_per_day: spinsPerDay
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error updating wheel config:', error);
      throw error;
    }
  }
}

module.exports = WheelSpin;
