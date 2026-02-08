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
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 25;

  useEffect(() => {
    fetchData();
    // Poll for leaderboard updates every 20 seconds
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [users.length, bets.length]);

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
    const roi = totalWagered > 0 ? ((netProfit / totalWagered) * 100) : 0;
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
      roi,
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

  const formatSignedCurrency = (value) => {
    if (!Number.isFinite(value)) {
      return formatCurrency(0);
    }
    const absValue = Math.abs(value);
    const formatted = formatCurrency(absValue);
    if (value > 0) {
      return `+${formatted}`;
    }
    if (value < 0) {
      return `-${formatted}`;
    }
    return formatted;
  };

  const formatRoi = (roi) => {
    if (!Number.isFinite(roi)) {
      return '0.00%';
    }
    const absValue = Math.abs(roi).toFixed(2);
    if (roi > 0) {
      return `+${absValue}%`;
    }
    if (roi < 0) {
      return `-${absValue}%`;
    }
    return `${absValue}%`;
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-header">
          <h1>Leaderboard</h1>
          <p>Ranked by Valiant Bucks balance</p>
        </div>
        <div className="leaderboard-table-wrapper">
          <table className="leaderboard-table">
            <colgroup>
              <col style={{ width: '70px' }} />
              <col style={{ width: '32%' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '110px' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="th-rank">Rank</th>
                <th>Player</th>
                <th className="th-right">Balance</th>
                <th className="th-right">Profit</th>
                <th className="th-center">Record</th>
                <th className="th-right">ROI</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, idx) => (
                <LeaderboardRowSkeleton key={idx} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const rankedUsers = getSortedUsers();
  const totalPicks = bets.length;
  const totalPages = Math.max(1, Math.ceil(rankedUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedUsers = rankedUsers.slice(pageStartIndex, pageStartIndex + PAGE_SIZE);

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1>Leaderboard</h1>
        <p className="subtitle">Track performance across all players</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Overview Stats */}
      <div className="overview-stats">
        <div className="stat-card">
          <div className="stat-card-value">{users.length}</div>
          <div className="stat-card-label">Active Players</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{totalPicks}</div>
          <div className="stat-card-label">Total Picks</div>
        </div>
      </div>

      {/* Leaderboard Table/Cards */}
      <div className="leaderboard-container">
        {rankedUsers.length === 0 ? (
          <div className="empty-state">
            <p>No players yet. Be the first to place a pick!</p>
          </div>
        ) : (
          <>
            <div className="leaderboard-table-wrapper">
              <table className="leaderboard-table">
                <colgroup>
                  <col style={{ width: '70px' }} />
                  <col style={{ width: '32%' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '110px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="th-rank">Rank</th>
                    <th>Player</th>
                    <th className="th-right">Balance</th>
                    <th className="th-right">Profit</th>
                    <th className="th-center">Record</th>
                    <th className="th-right">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user, index) => {
                    const rank = pageStartIndex + index + 1;
                    const roi = user.stats.roi || 0;
                    return (
                      <tr key={user.id} className={`leaderboard-row ${rank <= 3 ? `rank-${rank}` : ''}`}>
                        <td className="rank-cell">
                          <span className={`rank-badge ${rank <= 3 ? `rank-${rank}` : ''}`}>{rank}</span>
                        </td>
                        <td className="username-cell">
                          <div className="user-name-row">
                            <span className="user-name">{user.username}</span>
                            {user.is_admin && <span className="admin-badge">ADMIN</span>}
                          </div>
                        </td>
                        <td className="numeric balance-cell">{formatCurrency(user.balance)}</td>
                        <td className={`numeric profit-cell ${user.stats.netProfit >= 0 ? 'positive' : 'negative'}`}>
                          {formatSignedCurrency(user.stats.netProfit)}
                        </td>
                        <td className="record-cell">
                          <span className="wins">{user.stats.wonBets}W</span>
                          <span className="separator">–</span>
                          <span className="losses">{user.stats.lostBets}L</span>
                        </td>
                        <td className={`numeric roi-cell ${roi >= 0 ? 'positive' : 'negative'}`}>
                          {formatRoi(roi)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safePage === 1}
              >
                Previous
              </button>
              <div className="pagination-info">
                Page {safePage} of {totalPages}
              </div>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safePage === totalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
