import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import '../styles/BetList.css';
import '../styles/Confetti.css';
import { formatCurrency, formatSignedCurrency, getValueClass, formatDate } from '../utils/formatting';
import Confetti from './Confetti';

function BetList() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, won, lost
  const [showConfetti, setShowConfetti] = useState(false);
  const [winNotification, setWinNotification] = useState(null);
  const [lossNotification, setLossNotification] = useState(null);
  const [previousBets, setPreviousBets] = useState([]);

  useEffect(() => {
    fetchBets();
    // Poll for bet updates every 5 seconds
    const interval = setInterval(fetchBets, 5000);
    let timeoutCleanups = [];
    return () => {
      clearInterval(interval);
      timeoutCleanups.forEach(cleanup => cleanup && cleanup());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBets = async () => {
    try {
      const response = await apiClient.get('/bets');
      const newBets = response.data;
      
      // Check for newly resolved bets
      if (previousBets.length > 0) {
        const timeoutIds = [];
        newBets.forEach(newBet => {
          const oldBet = previousBets.find(b => b.id === newBet.id);
          if (oldBet && oldBet.status === 'pending' && newBet.status === 'resolved') {
            // Bet was just resolved
            if (newBet.outcome === 'won') {
              const profit = newBet.potential_win ? (parseFloat(newBet.potential_win) - parseFloat(newBet.amount)) : 0;
              setWinNotification({ team: newBet.selected_team, amount: profit });
              setShowConfetti(true);
              const winTimeout = setTimeout(() => {
                setWinNotification(null);
                setShowConfetti(false);
              }, 3000);
              timeoutIds.push(winTimeout);
            } else if (newBet.outcome === 'lost') {
              setLossNotification({ team: newBet.selected_team, amount: newBet.amount });
              const lossTimeout = setTimeout(() => {
                setLossNotification(null);
              }, 2500);
              timeoutIds.push(lossTimeout);
            }
          }
        });
        // Return cleanup function for timeouts
        return () => timeoutIds.forEach(id => clearTimeout(id));
      }
      
      setPreviousBets(newBets);
      setBets(newBets);
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch picks';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const filteredBets = bets.filter(bet => {
    if (filter === 'all') return true;
    if (filter === 'pending') return bet.status === 'pending';
    if (filter === 'won') return bet.outcome === 'won';
    if (filter === 'lost') return bet.outcome === 'lost';
    return true;
  });

  const stats = {
    total: bets.length,
    pending: bets.filter(b => b.status === 'pending').length,
    won: bets.filter(b => b.outcome === 'won').length,
    lost: bets.filter(b => b.outcome === 'lost').length,
    totalWagered: bets.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0),
    totalWinnings: bets.filter(b => b.outcome === 'won').reduce((sum, b) => sum + (parseFloat(b.potential_win || 0) - parseFloat(b.amount || 0)), 0)
  };
  const getConfidenceColor = (betType) => {
    switch(betType?.toLowerCase()) {
      case 'low': return 'confidence-low';
      case 'medium': return 'confidence-medium';
      case 'high': return 'confidence-high';
      default: return '';
    }
  };

  const parseLocalDateOnly = (dateStr) => {
    const [year, month, day] = (dateStr || '').split('-').map(Number);
    if (Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)) {
      return new Date(year, month - 1, day);
    }
    const parsed = new Date(dateStr);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const PACIFIC_TZ = 'America/Los_Angeles';

  const parseUtcDate = (dateStr) => {
    if (!dateStr) return null;
    const hasTz = /[zZ]|[+-]\d\d:?\d\d$/.test(dateStr);
    const iso = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`;
    const withTz = hasTz ? iso : `${iso}Z`;
    const parsed = new Date(withTz);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatPlacedAt = (createdAt) => {
    const date = parseUtcDate(createdAt) || new Date(createdAt);
    if (Number.isNaN(date.getTime())) return 'Placed date unknown';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: PACIFIC_TZ,
      timeZoneName: 'short'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="bet-list-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your picks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bet-list-container ds-page">
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {winNotification && (
        <div className="win-notification">
          <span className="win-notification-emoji">🎉</span>
          <div>You Won!</div>
          <div className={`win-notification-amount u-num ${getValueClass(winNotification.amount)}`}>{formatSignedCurrency(winNotification.amount)}</div>
          <div style={{fontSize: '1.2rem', marginTop: '0.5rem'}}>{winNotification.team}</div>
        </div>
      )}
      
      {lossNotification && (
        <div className="loss-notification">
          <span className="loss-notification-emoji">😔</span>
          <div>Better luck next time!</div>
          <div className={`u-num ${getValueClass(-lossNotification.amount)}`} style={{fontSize: '1rem', marginTop: '0.5rem', opacity: 0.9}}>{formatSignedCurrency(-lossNotification.amount)}</div>
        </div>
      )}
      
      {/* Header Section */}
      <div className="bet-list-header page-header">
        <div className="header-title">
          <h1>My Picks</h1>
          <p className="subtitle">Track your picking history and performance</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="bet-stats-grid">
        <div className="bet-stat-card stat-card">
          <div className="stat-icon stat-icon-total">📊</div>
          <div className="stat-info">
            <span className="stat-label">Total Picks</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="bet-stat-card stat-card">
          <div className="stat-icon stat-icon-won">🏆</div>
          <div className="stat-info">
            <span className="stat-label">Won</span>
            <span className="stat-value">{stats.won}</span>
          </div>
        </div>
        <div className="bet-stat-card stat-card">
          <div className="stat-icon stat-icon-lost">❌</div>
          <div className="stat-info">
            <span className="stat-label">Lost</span>
            <span className="stat-value">{stats.lost}</span>
          </div>
        </div>
        <div className="bet-stat-card stat-card">
          <div className="stat-icon stat-icon-wagered">💰</div>
          <div className="stat-info">
            <span className="stat-label">Total Wagered</span>
            <span className="stat-value">{formatCurrency(stats.totalWagered)}</span>
          </div>
        </div>
        <div className="bet-stat-card stat-card">
          <div className="stat-icon stat-icon-profit">💵</div>
          <div className="stat-info">
            <span className="stat-label">Total Profit</span>
            <span className={`stat-value u-num ${getValueClass(stats.totalWinnings)}`}>
              {formatSignedCurrency(stats.totalWinnings)}
            </span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filter Tabs */}
      <div className="bet-filters tabs">
        <button 
          className={`tab-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({stats.total})
        </button>
        <button 
          className={`tab-button ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({stats.pending})
        </button>
        <button 
          className={`tab-button ${filter === 'won' ? 'active' : ''}`}
          onClick={() => setFilter('won')}
        >
          Won ({stats.won})
        </button>
        <button 
          className={`tab-button ${filter === 'lost' ? 'active' : ''}`}
          onClick={() => setFilter('lost')}
        >
          Lost ({stats.lost})
        </button>
      </div>

      {/* Bets List */}
      {filteredBets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎲</div>
          <h3>No {filter !== 'all' ? filter : ''} picks found</h3>
          <p>
            {filter === 'all' 
              ? "You haven't placed any picks yet. Head to the dashboard to get started!" 
              : `You don't have any ${filter} picks at the moment.`}
          </p>
        </div>
      ) : (
        <div className="bets-list">
          {filteredBets.map(bet => {
            const profit = (parseFloat(bet.potential_win || 0) - parseFloat(bet.amount || 0));
            return (
              <div key={bet.id} className={`bet-item ${bet.outcome ? `bet-${bet.outcome}` : 'bet-pending'}`}>
              {/* Bet Header */}
              <div className="bet-item-header">
                <div className="bet-team-info">
                  <span className="team-type-badge">{bet.games?.team_type || 'Game'}</span>
                  <h3 className="team-name">{bet.games?.home_team} vs {bet.games?.away_team}</h3>
                  {bet.games?.game_date && (
                    <span className="game-date-badge">📅 {formatDate(parseLocalDateOnly(bet.games.game_date) || bet.games.game_date)}</span>
                  )}
                </div>
                <div className="bet-status-badge">
                  {bet.status === 'pending' && <span className="badge badge-pending status--pending">Pending</span>}
                  {bet.outcome === 'won' && <span className="badge badge-won status--won">Won</span>}
                  {bet.outcome === 'lost' && <span className="badge badge-lost status--lost">Lost</span>}
                </div>
              </div>

              {/* Selected Team Highlight */}
              <div className="bet-picked-team">
                <span className="bet-picked-label">Your Pick</span>
                <span className="bet-picked-team-name">{bet.selected_team}</span>
              </div>

              {/* Bet Details Grid */}
              <div className="bet-item-details">
                <div className="detail-box">
                  <span className="detail-label">Wager</span>
                  <span className="detail-amount">{formatCurrency(bet.amount)}</span>
                </div>
                <div className="detail-box">
                  <span className="detail-label">Confidence</span>
                  <span className={`confidence-badge ${getConfidenceColor(bet.bet_type)}`}>
                    {(bet.bet_type || 'n/a').toUpperCase()}
                  </span>
                </div>
                <div className="detail-box">
                  <span className="detail-label">Potential Win</span>
                  <span className="detail-potential">{formatCurrency(bet.potential_win)}</span>
                </div>
                {bet.outcome && (
                  <div className="detail-box">
                    <span className="detail-label">Result</span>
                    <span className={`detail-result u-num ${bet.outcome === 'won' ? 'result-won status--won' : 'result-lost status--lost'}`}>
                      {bet.outcome === 'won' ? formatSignedCurrency(profit) : formatSignedCurrency(-bet.amount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Bet Footer */}
              <div className="bet-item-footer">
                <span className="bet-date">📅 Pick placed: {formatPlacedAt(bet.created_at)}</span>
              </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BetList;
