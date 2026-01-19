import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import '../styles/DailyReward.css';

const DailyReward = ({ onRewardClaimed }) => {
  const [showModal, setShowModal] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    checkDailyLogin();
  }, []);

  const checkDailyLogin = async () => {
    try {
      const response = await axios.post('/daily-rewards/record');
      const data = response.data;

      if (!data.alreadyLoggedIn && data.canClaim) {
        // New login today, show reward modal
        setRewardData(data);
        setShowModal(true);
      } else if (data.alreadyLoggedIn && !data.rewardClaimed) {
        // Already logged in but reward not claimed yet
        setRewardData(data);
      }
    } catch (error) {
      console.error('Error checking daily login:', error);
    }
  };

  const claimReward = async () => {
    if (claiming) return;

    setClaiming(true);
    try {
      const response = await axios.post('/daily-rewards/claim');
      const { amount, newBalance, streak } = response.data;

      setClaimed(true);
      
      if (onRewardClaimed) {
        onRewardClaimed(amount, newBalance, streak);
      }

      setTimeout(() => {
        setShowModal(false);
        setClaimed(false);
        setClaiming(false);
      }, 2000);

    } catch (error) {
      console.error('Error claiming reward:', error);
      alert(error.response?.data?.message || 'Error claiming reward');
      setClaiming(false);
    }
  };

  if (!showModal || !rewardData) return null;

  const streakBonus = rewardData.rewardAmount - 50;

  return (
    <div className="daily-reward-overlay">
      <div className="daily-reward-modal">
        {!claimed ? (
          <>
            <div className="reward-icon">🎁</div>
            <h2>Daily Login Reward!</h2>
            <div className="streak-info">
              <span className="streak-count">{rewardData.streak}</span>
              <span className="streak-label">Day Streak</span>
            </div>
            <div className="reward-amount">
              <span className="base-reward">50 VB</span>
              {streakBonus > 0 && (
                <span className="bonus-reward">+ {streakBonus} VB Streak Bonus</span>
              )}
            </div>
            <div className="total-reward">
              Total: {rewardData.rewardAmount} Valiant Bucks
            </div>
            <button 
              className="claim-button"
              onClick={claimReward}
              disabled={claiming}
            >
              {claiming ? 'Claiming...' : 'Claim Reward'}
            </button>
            <button 
              className="close-button"
              onClick={() => setShowModal(false)}
            >
              Claim Later
            </button>
          </>
        ) : (
          <div className="claimed-message">
            <div className="success-icon">✓</div>
            <h2>Reward Claimed!</h2>
            <p>+{rewardData.rewardAmount} Valiant Bucks</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReward;
