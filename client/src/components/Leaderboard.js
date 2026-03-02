import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import '../styles/Leaderboard.css';
import { formatCurrency, formatNumber, formatSignedCurrency, formatSignedPercentage, getValueClass } from '../utils/formatting';

function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'balance', direction: 'desc' });

  const PAGE_SIZE = 25;
  let currentUser = null;
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      currentUser = JSON.parse(storedUser);
    }
  } catch (e) {
    localStorage.removeItem('user');
  }

  useEffect(() => {
    fetchData();
    // Poll for leaderboard updates every 20 seconds
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [users.length, bets.length, sortConfig.key, sortConfig.direction]);

  const fetchData = async () => {
    try {
      // Fetch users and bets simultaneously to avoid intermediate renders with stale data
      const [usersRes, betsRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/bets/all'),
      ]);

      // Filter out admin account from displayed users
      const nonAdminUsers = usersRes.data.filter(u => u.username !== 'admin');
      // Filter out admin bets to match filtered users
      const adminUser = usersRes.data.find(u => u.username === 'admin');
      const nonAdminBets = adminUser
        ? betsRes.data.filter(b => b.user_id !== adminUser.id)
        : betsRes.data;

      // Set both at once so React 18 batches them into a single render
      setUsers(nonAdminUsers);
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

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const getSortValue = (user) => {
    if (sortConfig.key === 'profit') return user.stats.netProfit;
    if (sortConfig.key === 'roi') return user.stats.roi;
    if (sortConfig.key === 'record') return user.stats.winRate;
    return user.balance;
  };

  const getSortedUsers = () => {
    const usersWithStats = getUsersWithStats();
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    return usersWithStats.sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);
      if (aValue === bValue && sortConfig.key === 'record') {
        if (a.stats.wonBets === b.stats.wonBets) return 0;
        return (a.stats.wonBets > b.stats.wonBets ? 1 : -1) * direction;
      }
      if (aValue === bValue) return 0;
      return (aValue > bValue ? 1 : -1) * direction;
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  if (loading) {
    return null;
  }

  const usersWithStats = getUsersWithStats();
  const rankedUsers = getSortedUsers();
  const totalPicks = bets.length;
  const activePlayers = usersWithStats.filter(user => user.stats.totalBets > 0).length;
  const totalPages = Math.max(1, Math.ceil(rankedUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedUsers = rankedUsers.slice(pageStartIndex, pageStartIndex + PAGE_SIZE);
  const showingStart = rankedUsers.length === 0 ? 0 : pageStartIndex + 1;
  const showingEnd = Math.min(pageStartIndex + PAGE_SIZE, rankedUsers.length);
  const currentUserRankIndex = currentUser
    ? rankedUsers.findIndex(user => user.id === currentUser.id)
    : -1;
  const currentUserPage = currentUserRankIndex >= 0 ? Math.floor(currentUserRankIndex / PAGE_SIZE) + 1 : null;
  const showJumpToRank = currentUserPage && currentUserPage !== safePage;

  return (
    <div className="leaderboard-page ds-page">
      <div className="leaderboard-header page-header">
        <h1>Leaderboard</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Summary Bar */}
      <div className="summary-bar">
        <div className="summary-item">
          <div className="summary-value">{formatNumber(activePlayers)}</div>
          <div className="summary-label">Active Players</div>
        </div>
        <div className="summary-divider" aria-hidden="true" />
        <div className="summary-item">
          <div className="summary-value">{formatNumber(totalPicks)}</div>
          <div className="summary-label">Total Picks</div>
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
            <div className="leaderboard-toolbar">
              {showJumpToRank && (
                <button
                  type="button"
                  className="jump-btn"
                  onClick={() => setCurrentPage(currentUserPage)}
                >
                  Jump to my rank
                </button>
              )}
            </div>
            <div className="leaderboard-list" role="list">
              {paginatedUsers.map((user, index) => {
                const rank = pageStartIndex + index + 1;
                const roi = user.stats.roi || 0;
                const isCurrentUser = currentUser?.id === user.id;
                const isActive = user.stats.totalBets > 0;
                return (
                  <div
                    key={user.id}
                    className={`leaderboard-list-row ${rank <= 3 ? `rank-${rank}` : ''} ${isCurrentUser ? 'is-current-user' : ''}`}
                    role="listitem"
                    tabIndex={0}
                  >
                    <div className="list-rank">
                      <span className={`rank-badge ${rank <= 3 ? `rank-${rank}` : ''}`}>{rank}</span>
                    </div>
                    <div className="list-main">
                      <div className="list-name-row">
                        <span
                          className={`activity-dot ${isActive ? 'active' : 'inactive'}`}
                          title={isActive ? 'Active bettor' : 'No picks yet'}
                        />
                        <span className="user-name">{user.username}</span>
                        {isCurrentUser && <span className="you-badge">YOU</span>}
                        {user.is_admin && <span className="admin-badge">ADMIN</span>}
                      </div>
                      <div className="list-meta">
                        <span className="record-meta">
                          {formatNumber(user.stats.wonBets)}W–{formatNumber(user.stats.lostBets)}L
                        </span>
                        <span className="meta-separator">•</span>
                        <span className={`roi-meta ${getValueClass(roi)}`}>
                          {formatSignedPercentage(roi)}
                        </span>
                      </div>
                    </div>
                    <div className={`list-stat ${getValueClass(user.stats.netProfit)}`}>
                      <div className="list-stat-value">{formatSignedCurrency(user.stats.netProfit)}</div>
                      <div className="list-stat-label">Profit</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="leaderboard-table-wrapper ds-table-wrapper">
              <table className="leaderboard-table ds-table">
                <colgroup>
                  <col style={{ width: '64px' }} />
                  <col style={{ width: '280px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '110px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="th-rank">Rank</th>
                    <th>Player</th>
                    <th className="th-right u-align-right">
                      <button
                        type="button"
                        className={`th-sort-btn ${sortConfig.key === 'balance' ? 'active' : ''}`}
                        onClick={() => handleSort('balance')}
                      >
                        Balance
                        <span className="sort-indicator">{getSortIndicator('balance')}</span>
                      </button>
                    </th>
                    <th className="th-right u-align-right">
                      <button
                        type="button"
                        className={`th-sort-btn ${sortConfig.key === 'profit' ? 'active' : ''}`}
                        onClick={() => handleSort('profit')}
                      >
                        Net Profit
                        <span
                          className="th-help"
                          title="Net profit from resolved picks (winnings minus wagers)."
                          aria-label="Net profit from resolved picks"
                        >
                          ⓘ
                        </span>
                        <span className="sort-indicator">{getSortIndicator('profit')}</span>
                      </button>
                    </th>
                    <th className="th-center u-align-center">
                      <button
                        type="button"
                        className={`th-sort-btn ${sortConfig.key === 'record' ? 'active' : ''}`}
                        onClick={() => handleSort('record')}
                      >
                        Record
                        <span className="sort-indicator">{getSortIndicator('record')}</span>
                      </button>
                    </th>
                    <th className="th-right u-align-right">
                      <button
                        type="button"
                        className={`th-sort-btn ${sortConfig.key === 'roi' ? 'active' : ''}`}
                        onClick={() => handleSort('roi')}
                      >
                        ROI
                        <span
                          className="th-help"
                          title="ROI = Net Profit ÷ Total Wagered."
                          aria-label="Return on investment"
                        >
                          ⓘ
                        </span>
                        <span className="sort-indicator">{getSortIndicator('roi')}</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user, index) => {
                    const rank = pageStartIndex + index + 1;
                    const roi = user.stats.roi || 0;
                    const isCurrentUser = currentUser?.id === user.id;
                    const isActive = user.stats.totalBets > 0;
                    return (
                      <tr
                        key={user.id}
                        className={`leaderboard-row ${rank <= 3 ? `rank-${rank}` : ''} ${isCurrentUser ? 'is-current-user' : ''}`}
                      >
                        <td className="td-rank">
                          <span className={`rank-badge ${rank <= 3 ? `rank-${rank}` : ''}`}>{rank}</span>
                        </td>
                        <td className="username-cell">
                          <div className="user-name-row">
                            <span
                              className={`activity-dot ${isActive ? 'active' : 'inactive'}`}
                              title={isActive ? 'Active bettor' : 'No picks yet'}
                            />
                            <span className="user-name">{user.username}</span>
                            {isCurrentUser && <span className="you-badge">YOU</span>}
                            {user.is_admin && <span className="admin-badge">ADMIN</span>}
                          </div>
                        </td>
                        <td className="td-right u-align-right u-num">
                          {formatCurrency(user.balance)}
                        </td>
                        <td className={`td-right u-align-right u-num ${getValueClass(user.stats.netProfit)}`}>
                          {formatSignedCurrency(user.stats.netProfit)}
                        </td>
                        <td className="td-center u-align-center u-num record-cell">
                          <span className="wins">{formatNumber(user.stats.wonBets)}W</span>
                          <span className="separator">•</span>
                          <span className="losses">{formatNumber(user.stats.lostBets)}L</span>
                        </td>
                        <td className={`td-right u-align-right u-num ${getValueClass(roi)}`}>
                          {formatSignedPercentage(roi)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pagination-bar">
              <div className="pagination-summary">
                Showing {formatNumber(showingStart)}–{formatNumber(showingEnd)} of {formatNumber(rankedUsers.length)}
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
