import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import '../styles/Leaderboard.css';
import '../styles/Skeleton.css';
import { formatCurrency } from '../utils/currency';
import { LeaderboardRowSkeleton } from './Skeleton';

function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    // Poll for leaderboard updates every 20 seconds
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      // Get all users
      const usersRes = await apiClient.get('/users');
      // Filter out admin account from displayed users
      const nonAdminUsers = usersRes.data.filter(u => u.username !== 'admin');
      setUsers(nonAdminUsers);

      // Get all bets
      const betsRes = await apiClient.get('/bets/all');
      // Filter out admin bets to match filtered users
      const adminUser = usersRes.data.find(u => u.username === 'admin');
      const nonAdminBets = adminUser 
        ? betsRes.data.filter(b => b.user_id !== adminUser.id)
        : betsRes.data;
      setBets(nonAdminBets);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = (userId) => {
    const userBets = bets.filter(b => b.user_id === userId);
    const resolvedBets = userBets.filter(b => b.status === 'resolved');
    const totalBets = userBets.length;
    const resolvedCount = resolvedBets.length;
    const wonBets = resolvedBets.filter(b => b.outcome === 'won').length;
    const lostBets = resolvedBets.filter(b => b.outcome === 'lost').length;
    const pendingBets = userBets.filter(b => b.status === 'pending').length;
    
    // Calculate profit from resolved bets only
    // For won bets: profit = potential_win - amount (net gain)
    // For lost bets: profit = -amount (loss)
    const netProfit = resolvedBets.reduce((sum, b) => {
      if (b.outcome === 'won') {
        return sum + ((b.potential_win || 0) - (b.amount || 0));
      } else if (b.outcome === 'lost') {
        return sum - (b.amount || 0);
      }
      return sum;
    }, 0);
    
    const totalWagered = resolvedBets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalWinnings = resolvedBets
      .filter(b => b.outcome === 'won')
      .reduce((sum, b) => sum + (b.potential_win || 0), 0);
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
        <div className="leaderboard-header">
          <h1>Leaderboard</h1>
          <p>Top performers ranked by Valiant Bucks balance</p>
        </div>
        <div className="leaderboard-table">
          {Array.from({ length: 10 }).map((_, idx) => (
            <LeaderboardRowSkeleton key={idx} />
          ))}
        </div>
      </div>
    );
  }

  const rankedUsers = getSortedUsers();
  const totalPicks = bets.length;

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1>🏆 Leaderboard</h1>
        <p className="subtitle">Track your picks and compete with other players</p>
        <div className="spirit-week-badge">
          🎭 Spirit Week is here! Show your Valiant pride! 🌟
        </div>
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
