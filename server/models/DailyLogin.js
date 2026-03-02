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

class DailyLogin {
  // Record a daily login and calculate streak
  static async recordLogin(userId) {
    try {
      const today = getTodayPacific(); // Use Pacific timezone
      
      // Check if already logged in today
      const { data: existing, error: checkError } = await supabase
        .from('daily_logins')
        .select('*')
        .eq('user_id', userId)
        .eq('login_date', today)
        .single();

      // PGRST116 = no rows found — that's expected. Any other error is a real failure.
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        return { 
          alreadyLoggedIn: true, 
          streak: existing.streak_count,
          rewardClaimed: existing.reward_claimed,
          rewardAmount: existing.reward_amount
        };
      }

      // Calculate streak using database function.
      // Pass today's Pacific-timezone date so the function doesn't rely on
      // CURRENT_DATE (UTC), which can differ from the client's local date.
      const { data: streakData, error: streakError } = await supabase
        .rpc('calculate_login_streak', { p_user_id: userId, p_login_date: today });

      if (streakError) {
        console.error('Error calculating streak:', streakError);
        throw streakError;
      }

      const streakCount = streakData || 1;
      
      // Bonus for streaks: +2500 VB per day in streak (capped at +25000)
      const baseReward = 2500;
      const streakBonus = Math.min((streakCount - 1) * 2500, 25000);
      const totalReward = baseReward + streakBonus;

      // Insert new daily login record
      const { data: loginRecord, error: insertError } = await supabase
        .from('daily_logins')
        .insert({
          user_id: userId,
          login_date: today,
          reward_claimed: false,
          reward_amount: totalReward,
          streak_count: streakCount
        })
        .select()
        .single();

      if (insertError) {
        // 23505 = unique_violation — a parallel request already inserted today's record.
        // Treat this as a normal "already logged in" response instead of a 500.
        if (insertError.code === '23505') {
          const { data: existing2, error: fetchError } = await supabase
            .from('daily_logins')
            .select('*')
            .eq('user_id', userId)
            .eq('login_date', today)
            .single();
          if (fetchError) throw fetchError;
          return {
            alreadyLoggedIn: true,
            streak: existing2.streak_count,
            rewardClaimed: existing2.reward_claimed,
            rewardAmount: existing2.reward_amount
          };
        }
        throw insertError;
      }

      return {
        alreadyLoggedIn: false,
        streak: streakCount,
        rewardClaimed: false,
        rewardAmount: totalReward,
        canClaim: true
      };
    } catch (error) {
      console.error('Error recording login:', error);
      throw error;
    }
  }

  // Claim daily login reward
  static async claimReward(userId) {
    try {
      const today = getTodayPacific(); // Use Pacific timezone

      // Get today's login record
      const { data: loginRecord, error: fetchError } = await supabase
        .from('daily_logins')
        .select('*')
        .eq('user_id', userId)
        .eq('login_date', today)
        .single();

      if (fetchError || !loginRecord) {
        throw new Error('No login record found for today');
      }

      if (loginRecord.reward_claimed) {
        throw new Error('Reward already claimed today');
      }

      // Update user balance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const newBalance = parseFloat(userData.balance) + loginRecord.reward_amount;

      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Mark reward as claimed
      const { error: claimError } = await supabase
        .from('daily_logins')
        .update({ reward_claimed: true })
        .eq('user_id', userId)
        .eq('login_date', today);

      if (claimError) throw claimError;

      // Create transaction record
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'daily_reward',
        amount: loginRecord.reward_amount,
        description: `Daily login reward (${loginRecord.streak_count} day streak)`,
        status: 'completed'
      });

      // Check for streak achievements
      const Achievement = require('./Achievement');
      try {
        await Achievement.checkLoginStreak(userId, loginRecord.streak_count);
      } catch (achError) {
        console.error('Error checking streak achievements:', achError);
        // Don't fail the reward claim if achievement check fails
      }

      return {
        success: true,
        amount: loginRecord.reward_amount,
        newBalance: newBalance,
        streak: loginRecord.streak_count
      };
    } catch (error) {
      console.error('Error claiming reward:', error);
      throw error;
    }
  }

  // Get user's login history
  static async getLoginHistory(userId, limit = 30) {
    try {
      const { data, error } = await supabase
        .from('daily_logins')
        .select('*')
        .eq('user_id', userId)
        .order('login_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching login history:', error);
      throw error;
    }
  }

  // Get current streak
  static async getCurrentStreak(userId) {
    try {
      const today = getTodayPacific();
      const { data, error } = await supabase
        .rpc('calculate_login_streak', { p_user_id: userId, p_login_date: today });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error getting current streak:', error);
      throw error;
    }
  }
}

module.exports = DailyLogin;
