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
      setUsers(usersRes.data);

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

      <div className="leaderboard-table-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="rank">Rank</th>
              <th className="username">User</th>
              <th className="stat">Balance</th>
              <th className="stat">Bets</th>
              <th className="stat">Won/Lost</th>
              <th className="stat">Pending</th>
              <th className="stat">Wagered</th>
              <th className="stat">Winnings</th>
              <th className="stat">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {rankedUsers.map((user, index) => (
              <tr key={user.id} className={`rank-${index + 1}`}>
                <td className="rank">
                  <span className="rank-badge">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </span>
                </td>
                <td className="username">
                  <span className="user-name">{user.username}</span>
                  {user.is_admin && <span className="admin-badge">ADMIN</span>}
                </td>
                <td className="stat balance-stat">
                  <strong>{formatCurrency(user.balance)}</strong>
                </td>
                <td className="stat">
                  <span className="stat-value">{user.stats.totalBets}</span>
                </td>
                <td className="stat">
                  <span className="stat-won">{user.stats.wonBets}</span>
                  <span className="stat-divider">/</span>
                  <span className="stat-lost">{user.stats.lostBets}</span>
                </td>
                <td className="stat">
                  <span className="stat-pending">{user.stats.pendingBets}</span>
                </td>
                <td className="stat">
                  <span className="stat-value">{user.stats.totalWagered.toFixed(2)}</span>
                </td>
                <td className="stat">
                  <span className="stat-winning">{user.stats.totalWinnings.toFixed(2)}</span>
                </td>
                <td className="stat">
                  <span className="stat-value">{user.stats.winRate}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="leaderboard-stats">
        <div className="overview-stat">
          <h4>Total Users</h4>
          <p className="value">{users.length}</p>
        </div>
        <div className="overview-stat">
          <h4>Total Bets Placed</h4>
          <p className="value">{bets.length}</p>
        </div>
        <div className="overview-stat">
          <h4>Avg Balance</h4>
          <p className="value">
            {users.length > 0 ? formatCurrency(users.reduce((sum, u) => sum + u.balance, 0) / users.length) : formatCurrency(0)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
