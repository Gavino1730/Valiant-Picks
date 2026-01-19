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

class Achievement {
  // Achievement types and rewards
  static TYPES = {
    ALL_GAMES_BET: { type: 'all_games_bet', reward: 200, description: 'Bet on all available games today!' },
    CONSECUTIVE_7: { type: 'consecutive_logins_7', reward: 300, description: '7 day login streak!' },
    CONSECUTIVE_30: { type: 'consecutive_logins_30', reward: 1500, description: '30 day login streak!' },
    BIG_WIN: { type: 'big_win', reward: 100, description: 'Won a big bet!' },
    FIRST_BET: { type: 'first_bet', reward: 50, description: 'Placed your first bet!' },
    
    // Girls game achievements
    GIRLS_SUPPORTER: { type: 'girls_supporter', reward: 150, description: 'Bet on 5 girls games!' },
    GIRLS_CHAMPION: { type: 'girls_champion', reward: 300, description: 'Bet on 20 girls games!' },
    GIRLS_LEGEND: { type: 'girls_legend', reward: 500, description: 'Bet on 50 girls games!' },
    GIRLS_STREAK_3: { type: 'girls_streak_3', reward: 100, description: '3 consecutive girls game bets!' },
    GIRLS_STREAK_7: { type: 'girls_streak_7', reward: 250, description: '7 consecutive girls game bets!' },
    GIRLS_ALL_TODAY: { type: 'girls_all_today', reward: 200, description: 'Bet on all girls games today!' },
    
    // Betting engagement
    BET_STREAK_3: { type: 'bet_streak_3', reward: 75, description: '3 days betting streak!' },
    BET_STREAK_7: { type: 'bet_streak_7', reward: 200, description: '7 days betting streak!' },
    BET_STREAK_30: { type: 'bet_streak_30', reward: 1000, description: '30 days betting streak!' },
    HIGH_ROLLER: { type: 'high_roller', reward: 300, description: 'Place 10 bets in one day!' },
    PERFECT_WEEK: { type: 'perfect_week', reward: 500, description: 'Win all bets for a week!' },
    COMEBACK_KID: { type: 'comeback_kid', reward: 150, description: 'Win after losing 5 in a row!' },
    
    // Milestones
    BETS_10: { type: 'bets_10', reward: 100, description: '10 total bets placed!' },
    BETS_50: { type: 'bets_50', reward: 300, description: '50 total bets placed!' },
    BETS_100: { type: 'bets_100', reward: 750, description: '100 total bets placed!' },
    BETS_500: { type: 'bets_500', reward: 2000, description: '500 total bets placed!' },
    WINS_10: { type: 'wins_10', reward: 150, description: '10 bets won!' },
    WINS_50: { type: 'wins_50', reward: 500, description: '50 bets won!' },
    WINS_100: { type: 'wins_100', reward: 1000, description: '100 bets won!' }
  };

  // Check and award "all games bet" achievement
  static async checkAllGamesBet(userId) {
    try {
      const today = getTodayPacific();

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

  // Check girls game achievements
  static async checkGirlsGameAchievements(userId) {
    try {
      const today = getTodayPacific();
      const awarded = [];

      // Count total girls game bets
      const { data: girlsBets } = await supabase
        .from('bets')
        .select('id, games!inner(team_type)')
        .eq('user_id', userId)
        .eq('games.team_type', 'girls');

      const totalGirlsBets = girlsBets?.length || 0;

      // Check milestones
      const milestones = [
        { count: 5, type: this.TYPES.GIRLS_SUPPORTER },
        { count: 20, type: this.TYPES.GIRLS_CHAMPION },
        { count: 50, type: this.TYPES.GIRLS_LEGEND }
      ];

      for (const milestone of milestones) {
        if (totalGirlsBets >= milestone.count) {
          const { data: existing } = await supabase
            .from('achievements')
            .select('id')
            .eq('user_id', userId)
            .eq('achievement_type', milestone.type.type)
            .single();

          if (!existing) {
            const achievement = await this.awardAchievement(
              userId,
              milestone.type.type,
              milestone.type.description,
              milestone.type.reward
            );
            awarded.push(achievement);
          }
        }
      }

      // Check consecutive girls game bets
      const { data: recentBets } = await supabase
        .from('bets')
        .select('id, created_at, games!inner(team_type)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      let girlsStreak = 0;
      for (const bet of recentBets || []) {
        if (bet.games?.team_type === 'girls') {
          girlsStreak++;
        } else {
          break;
        }
      }

      // Award streak achievements
      if (girlsStreak >= 3) {
        const { data: existing3 } = await supabase
          .from('achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_type', this.TYPES.GIRLS_STREAK_3.type)
          .gte('achievement_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .single();

        if (!existing3) {
          awarded.push(await this.awardAchievement(
            userId,
            this.TYPES.GIRLS_STREAK_3.type,
            this.TYPES.GIRLS_STREAK_3.description,
            this.TYPES.GIRLS_STREAK_3.reward
          ));
        }
      }

      if (girlsStreak >= 7) {
        const { data: existing7 } = await supabase
          .from('achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_type', this.TYPES.GIRLS_STREAK_7.type)
          .gte('achievement_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .single();

        if (!existing7) {
          awarded.push(await this.awardAchievement(
            userId,
            this.TYPES.GIRLS_STREAK_7.type,
            this.TYPES.GIRLS_STREAK_7.description,
            this.TYPES.GIRLS_STREAK_7.reward
          ));
        }
      }

      // Check all girls games today
      const { data: allGirlsToday } = await supabase
        .rpc('check_all_girls_games_bet', { p_user_id: userId });

      if (allGirlsToday) {
        const { data: existingToday } = await supabase
          .from('achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_type', this.TYPES.GIRLS_ALL_TODAY.type)
          .eq('achievement_date', today)
          .single();

        if (!existingToday) {
          awarded.push(await this.awardAchievement(
            userId,
            this.TYPES.GIRLS_ALL_TODAY.type,
            this.TYPES.GIRLS_ALL_TODAY.description,
            this.TYPES.GIRLS_ALL_TODAY.reward
          ));
        }
      }

      return awarded.filter(Boolean);
    } catch (error) {
      console.error('Error checking girls game achievements:', error);
      return [];
    }
  }

  // Check betting engagement achievements
  static async checkBettingMilestones(userId) {
    try {
      const awarded = [];

      // Count total bets and wins
      const { data: stats } = await supabase
        .from('bets')
        .select('id, outcome')
        .eq('user_id', userId);

      const totalBets = stats?.length || 0;
      const totalWins = stats?.filter(b => b.outcome === 'won').length || 0;

      // Check bet milestones
      const betMilestones = [
        { count: 10, type: this.TYPES.BETS_10 },
        { count: 50, type: this.TYPES.BETS_50 },
        { count: 100, type: this.TYPES.BETS_100 },
        { count: 500, type: this.TYPES.BETS_500 }
      ];

      for (const milestone of betMilestones) {
        if (totalBets >= milestone.count) {
          const { data: existing } = await supabase
            .from('achievements')
            .select('id')
            .eq('user_id', userId)
            .eq('achievement_type', milestone.type.type)
            .single();

          if (!existing) {
            awarded.push(await this.awardAchievement(
              userId,
              milestone.type.type,
              milestone.type.description,
              milestone.type.reward
            ));
          }
        }
      }

      // Check win milestones
      const winMilestones = [
        { count: 10, type: this.TYPES.WINS_10 },
        { count: 50, type: this.TYPES.WINS_50 },
        { count: 100, type: this.TYPES.WINS_100 }
      ];

      for (const milestone of winMilestones) {
        if (totalWins >= milestone.count) {
          const { data: existing } = await supabase
            .from('achievements')
            .select('id')
            .eq('user_id', userId)
            .eq('achievement_type', milestone.type.type)
            .single();

          if (!existing) {
            awarded.push(await this.awardAchievement(
              userId,
              milestone.type.type,
              milestone.type.description,
              milestone.type.reward
            ));
          }
        }
      }

      return awarded.filter(Boolean);
    } catch (error) {
      console.error('Error checking betting milestones:', error);
      return [];
    }
  }

  // Check consecutive login achievements
  static async checkLoginStreak(userId, streakCount) {
    try {
      const today = getTodayPacific();
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
      const today = getTodayPacific();

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
