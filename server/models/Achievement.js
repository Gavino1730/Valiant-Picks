const supabase = require('../supabase');

class Achievement {
  // Achievement types and rewards
  static TYPES = {
    ALL_GAMES_BET: { type: 'all_games_bet', reward: 200, description: 'Bet on all available games today!' },
    CONSECUTIVE_7: { type: 'consecutive_logins_7', reward: 300, description: '7 day login streak!' },
    CONSECUTIVE_30: { type: 'consecutive_logins_30', reward: 1500, description: '30 day login streak!' },
    BIG_WIN: { type: 'big_win', reward: 100, description: 'Won a big bet!' },
    FIRST_BET: { type: 'first_bet', reward: 50, description: 'Placed your first bet!' }
  };

  // Check and award "all games bet" achievement
  static async checkAllGamesBet(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if already earned today
      const { data: existing } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_type', this.TYPES.ALL_GAMES_BET.type)
        .eq('achievement_date', today)
        .single();

      if (existing) {
        return null; // Already earned
      }

      // Use database function to check
      const { data: qualified, error } = await supabase
        .rpc('check_all_games_bet', { p_user_id: userId });

      if (error) throw error;

      if (qualified) {
        // Award achievement
        const achievement = await this.awardAchievement(
          userId,
          this.TYPES.ALL_GAMES_BET.type,
          this.TYPES.ALL_GAMES_BET.description,
          this.TYPES.ALL_GAMES_BET.reward
        );

        return achievement;
      }

      return null;
    } catch (error) {
      console.error('Error checking all games bet achievement:', error);
      return null;
    }
  }

  // Check consecutive login achievements
  static async checkLoginStreak(userId, streakCount) {
    try {
      const today = new Date().toISOString().split('T')[0];
      let awarded = [];

      // Check for 7-day streak
      if (streakCount === 7) {
        const { data: existing7 } = await supabase
          .from('achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_type', this.TYPES.CONSECUTIVE_7.type)
          .eq('achievement_date', today)
          .single();

        if (!existing7) {
          const achievement = await this.awardAchievement(
            userId,
            this.TYPES.CONSECUTIVE_7.type,
            this.TYPES.CONSECUTIVE_7.description,
            this.TYPES.CONSECUTIVE_7.reward
          );
          awarded.push(achievement);
        }
      }

      // Check for 30-day streak
      if (streakCount === 30) {
        const { data: existing30 } = await supabase
          .from('achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_type', this.TYPES.CONSECUTIVE_30.type)
          .eq('achievement_date', today)
          .single();

        if (!existing30) {
          const achievement = await this.awardAchievement(
            userId,
            this.TYPES.CONSECUTIVE_30.type,
            this.TYPES.CONSECUTIVE_30.description,
            this.TYPES.CONSECUTIVE_30.reward
          );
          awarded.push(achievement);
        }
      }

      return awarded;
    } catch (error) {
      console.error('Error checking login streak achievements:', error);
      return [];
    }
  }

  // Award achievement
  static async awardAchievement(userId, type, description, rewardAmount) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Create achievement record
      const { data: achievement, error: achError } = await supabase
        .from('achievements')
        .insert({
          user_id: userId,
          achievement_type: type,
          achievement_date: today,
          reward_amount: rewardAmount,
          description: description,
          claimed: false
        })
        .select()
        .single();

      if (achError) throw achError;

      return achievement;
    } catch (error) {
      console.error('Error awarding achievement:', error);
      throw error;
    }
  }

  // Claim achievement reward
  static async claimAchievement(achievementId, userId) {
    try {
      // Get achievement
      const { data: achievement, error: fetchError } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', achievementId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !achievement) {
        throw new Error('Achievement not found');
      }

      if (achievement.claimed) {
        throw new Error('Achievement already claimed');
      }

      // Update user balance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const newBalance = parseFloat(userData.balance) + achievement.reward_amount;

      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Mark as claimed
      const { error: claimError } = await supabase
        .from('achievements')
        .update({ claimed: true })
        .eq('id', achievementId);

      if (claimError) throw claimError;

      // Create transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'achievement',
        amount: achievement.reward_amount,
        description: `Achievement: ${achievement.description}`,
        status: 'completed'
      });

      return {
        success: true,
        amount: achievement.reward_amount,
        newBalance: newBalance,
        achievement: achievement
      };
    } catch (error) {
      console.error('Error claiming achievement:', error);
      throw error;
    }
  }

  // Get user achievements
  static async getUserAchievements(userId) {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching achievements:', error);
      throw error;
    }
  }

  // Get unclaimed achievements
  static async getUnclaimedAchievements(userId) {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('claimed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching unclaimed achievements:', error);
      throw error;
    }
  }
}

module.exports = Achievement;
