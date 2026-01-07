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
    // Poll for leaderboard updates every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
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
    const resolvedBets = userBets.filter(b => b.status === 'resolved');
    const totalBets = userBets.length;
    const resolvedCount = resolvedBets.length;
    const wonBets = userBets.filter(b => b.outcome === 'won').length;
    const lostBets = userBets.filter(b => b.outcome === 'lost').length;
    const pendingBets = userBets.filter(b => b.status === 'pending').length;
    const totalWagered = resolvedBets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalWinnings = userBets
      .filter(b => b.outcome === 'won')
      .reduce((sum, b) => sum + (b.potential_win || 0), 0);
    const netProfit = totalWinnings - totalWagered;
    const winRate = resolvedCount > 0 ? ((wonBets / resolvedCount) * 100) : 0;
    return {
      totalBets,
      resolvedCount,
      wonBets,
      lostBets,
      pendingBets,
      totalWagered,
      totalWinnings,
      netProfit,
      winRate,
    };
  };

  const getUsersWithStats = () => {
    return users.map(user => ({
      ...user,
      stats: calculateUserStats(user.id),
    }));
  };

  const getSortedUsers = () => {
    return getUsersWithStats().sort((a, b) => b.balance - a.balance);
  };

  const formatWinRate = (winRate) => {
    if (!Number.isFinite(winRate)) {
      return '0';
    }
    return winRate.toFixed(2).replace(/\.00$/, '');
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div style={{textAlign: 'center', padding: '40px', color: '#b8c5d6'}}>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading Leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const rankedUsers = getSortedUsers();
  const totalPicks = bets.length;
  const totalWagered = bets.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalWinnings = bets.filter(b => b.outcome === 'won').reduce((sum, b) => sum + (b.potential_win || 0), 0);

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1>🏆 Leaderboard</h1>
        <p className="subtitle">Track your picks and compete with other players</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Overview Stats */}
      <div className="overview-stats">
        <div className="stat-card">
          <div className="stat-card-value">{users.length}</div>
          <div className="stat-card-label">Active Players</div>
          <div className="stat-card-icon">👥</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{totalPicks}</div>
          <div className="stat-card-label">Total Picks</div>
          <div className="stat-card-icon">🎲</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{formatCurrency(totalWagered)}</div>
          <div className="stat-card-label">Total Wagered</div>
          <div className="stat-card-icon">💰</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{color: '#66bb6a'}}>{formatCurrency(totalWinnings)}</div>
          <div className="stat-card-label">Total Winnings</div>
          <div className="stat-card-icon">🎉</div>
        </div>
      </div>

      {/* Leaderboard Table/Cards */}
      <div className="leaderboard-container">
        {rankedUsers.length === 0 ? (
          <div className="empty-state">
            <p>No players yet. Be the first to place a pick!</p>
          </div>
        ) : (
          rankedUsers.map((user, index) => (
            <div key={user.id} className={`leaderboard-row rank-${index + 1}`}>
              <div className="rank-cell">
                <div className="rank-number">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${index + 1}`}
                </div>
              </div>
              
              <div className="user-cell">
                <div className="user-info">
                  <div className="user-name-row">
                    <span className="user-name">{user.username}</span>
                  </div>
                  {user.is_admin && <span className="admin-badge">ADMIN</span>}
                </div>
              </div>
                
                <div className="stats-cell balance-cell">
                  <div className="cell-label">Balance</div>
                  <div className="cell-value balance">{formatCurrency(user.balance)}</div>
                </div>

                <div className="stats-cell">
                  <div className="cell-label">Record</div>
                  <div className="cell-value record">
                    <span className="wins">{user.stats.wonBets}W</span>
                    <span className="separator">•</span>
                    <span className="losses">{user.stats.lostBets}L</span>
                  </div>
                </div>

                <div className="stats-cell">
                  <div className="cell-label">Win Rate</div>
                  <div className={`cell-value win-rate ${parseFloat(user.stats.winRate) >= 50 ? 'positive' : parseFloat(user.stats.winRate) === 0 ? 'neutral' : 'negative'}`}>
                    {formatWinRate(user.stats.winRate)}%
                  </div>
                </div>

                <div className="stats-cell profit-cell">
                  <div className="cell-label">Profit</div>
                  <div className={`cell-value profit ${user.stats.netProfit >= 0 ? 'positive' : 'negative'}`}>
                    {user.stats.netProfit >= 0 ? '+' : ''}{formatCurrency(user.stats.netProfit)}
                  </div>
                </div>

                <div className="stats-cell picks-cell">
                  <div className="cell-label">Picks</div>
                  <div className="cell-value">{user.stats.totalBets}</div>
                </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
