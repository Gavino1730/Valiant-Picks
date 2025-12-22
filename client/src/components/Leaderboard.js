import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import '../styles/Leaderboard.css';
import { formatCurrency } from '../utils/currency';

function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      // Get all users
      const usersRes = await apiClient.get('/users');
      // Filter out admin account
      setUsers(usersRes.data.filter(u => u.username !== 'admin'));

      // Get all bets
      const betsRes = await apiClient.get('/bets/all');
      setBets(betsRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch leaderboard');
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = (userId) => {
    const userBets = bets.filter(b => b.user_id === userId);
    const totalBets = userBets.length;
    const wonBets = userBets.filter(b => b.outcome === 'won').length;
    const lostBets = userBets.filter(b => b.outcome === 'lost').length;
    const pendingBets = userBets.filter(b => b.status === 'pending').length;
    const totalWagered = userBets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalWinnings = userBets
      .filter(b => b.outcome === 'won')
      .reduce((sum, b) => sum + (b.potential_win || 0), 0);
    const winRate = totalBets > 0 ? ((wonBets / totalBets) * 100).toFixed(1) : 0;

    return {
      totalBets,
      wonBets,
      lostBets,
      pendingBets,
      totalWagered,
      totalWinnings,
      winRate,
    };
  };

  const getUsersWithStats = () => {
    return users.map(user => ({
      ...user,
      stats: calculateUserStats(user.id),
    }));
  };

  const sortedUsers = () => {
    const usersWithStats = getUsersWithStats();
    // Sort by balance (default)
    const sorted = [...usersWithStats].sort((a, b) => b.balance - a.balance);
    return sorted;
  };

  if (loading) {
    return (
      <div className="card leaderboard">
        <h2>Loading Leaderboard...</h2>
      </div>
    );
  }

  const rankedUsers = sortedUsers();

  return (
    <div className="leaderboard">
      <h2>🏆 Leaderboard</h2>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="leaderboard-container">
        {rankedUsers.map((user, index) => (
          <div key={user.id} className={`leaderboard-card rank-${index + 1}`}>
            <div className="rank-section">
              <div className="rank-badge">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && `#${index + 1}`}
              </div>
            </div>
            
            <div className="user-section">
              <div className="user-name">{user.username}</div>
              {user.is_admin && <span className="admin-badge">ADMIN</span>}
            </div>
            
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Balance</div>
                <div className="stat-value balance">{formatCurrency(user.balance)}</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Total Picks</div>
                <div className="stat-value">{user.stats.totalBets}</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Record</div>
                <div className="stat-value record">
                  <span className="wins">{user.stats.wonBets}W</span>
                  <span className="divider">-</span>
                  <span className="losses">{user.stats.lostBets}L</span>
                  {user.stats.pendingBets > 0 && (
                    <>
                      <span className="divider">-</span>
                      <span className="pending">{user.stats.pendingBets}P</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Win Rate</div>
                <div className={`stat-value win-rate ${parseFloat(user.stats.winRate) >= 50 ? 'positive' : 'negative'}`}>
                  {user.stats.winRate}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="leaderboard-stats">
        <div className="overview-stat">
          <h4>Total Users</h4>
          <p className="value">{users.length}</p>
        </div>
        <div className="overview-stat">
          <h4>Total Picks Placed</h4>
          <p className="value">{bets.length}</p>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
