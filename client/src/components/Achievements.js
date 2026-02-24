import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import '../styles/Achievements.css';

const Achievements = ({ onAchievementClaimed, user }) => {
  const [achievements, setAchievements] = useState([]);
  const [unclaimedCount, setUnclaimedCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [claiming, setClaiming] = useState(null);

  useEffect(() => {
    // Only run for authenticated users
    if (!user) return;
    loadAchievements();
  }, [user]);

  const loadAchievements = async () => {
    try {
      const response = await axios.get('/achievements/unclaimed');
      const unclaimed = response.data || [];
      setAchievements(unclaimed);
      setUnclaimedCount(unclaimed.length);
      
      if (unclaimed.length > 0) {
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
      // Set empty state on error to prevent infinite retries
      setAchievements([]);
      setUnclaimedCount(0);
    }
  };

  const claimAchievement = async (achievementId) => {
    if (claiming) return;

    setClaiming(achievementId);
    try {
      const response = await axios.post(`/achievements/claim/${achievementId}`);
      const { amount, newBalance } = response.data;

      // Remove claimed achievement from list
      setAchievements(prev => prev.filter(a => a.id !== achievementId));
      setUnclaimedCount(prev => prev - 1);

      if (onAchievementClaimed) {
        onAchievementClaimed(amount, newBalance);
      }

      setClaiming(null);
    } catch (error) {
      console.error('Error claiming achievement:', error);
      alert(error.response?.data?.message || 'Error claiming achievement');
      setClaiming(null);
    }
  };

  const getAchievementIcon = (type) => {
    const icons = {
      'all_games_bet': '🎯',
      'consecutive_logins_7': '🔥',
      'consecutive_logins_30': '⭐',
      'big_win': '💰',
      'first_bet': '🎉',
      // Girls game achievements
      'girls_supporter': '💗',
      'girls_champion': '👑',
      'girls_legend': '🏆',
      'girls_streak_3': '💖',
      'girls_streak_7': '💝',
      'girls_all_today': '🌟',
      // Betting engagement
      'bet_streak_3': '📈',
      'bet_streak_7': '🚀',
      'bet_streak_30': '🌠',
      'high_roller': '🎲',
      'perfect_week': '✨',
      'comeback_kid': '💪',
      // Milestones
      'bets_10': '🎊',
      'bets_50': '🎖️',
      'bets_100': '🏅',
      'bets_500': '👑',
      'wins_10': '🥉',
      'wins_50': '🥈',
      'wins_100': '🥇'
    };
    return icons[type] || '🏆';
  };

  if (!showModal || achievements.length === 0) {
    // Badge indicator when there are unclaimed achievements
    if (unclaimedCount > 0) {
      return (
        <button 
          className="achievement-badge"
          onClick={() => setShowModal(true)}
          title="You have unclaimed achievements!"
        >
          🏆 {unclaimedCount}
        </button>
      );
    }
    return null;
  }

  return (
    <div className="achievements-overlay" onClick={() => setShowModal(false)}>
      <div className="achievements-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
        <h2>🏆 Achievements Unlocked!</h2>
        <p className="achievements-subtitle">You've earned new rewards!</p>
        
        <div className="achievements-list">
          {achievements.map(achievement => (
            <div key={achievement.id} className="achievement-card">
              <div className="achievement-icon">
                {getAchievementIcon(achievement.achievement_type)}
              </div>
              <div className="achievement-info">
                <h3>{achievement.description}</h3>
                <div className="achievement-reward">
                  +{achievement.reward_amount} Valiant Bucks
                </div>
              </div>
              <button
                className="claim-achievement-btn"
                onClick={() => claimAchievement(achievement.id)}
                disabled={claiming === achievement.id}
              >
                {claiming === achievement.id ? 'Claiming...' : 'Claim'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Achievements;
