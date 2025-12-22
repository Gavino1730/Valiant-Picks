import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import '../styles/BetList.css';
import '../styles/Confetti.css';
import { formatCurrency } from '../utils/currency';
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
    // Poll for bet updates every 10 seconds
    const interval = setInterval(fetchBets, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBets = async () => {
    try {
      const response = await apiClient.get('/bets');
      const newBets = response.data;
      
      // Check for newly resolved bets
      if (previousBets.length > 0) {
        newBets.forEach(newBet => {
          const oldBet = previousBets.find(b => b.id === newBet.id);
          if (oldBet && oldBet.status === 'pending' && newBet.status === 'resolved') {
            // Bet was just resolved
            if (newBet.outcome === 'won') {
              const profit = parseFloat(newBet.potential_win) - parseFloat(newBet.amount);
              setWinNotification({ team: newBet.selected_team, amount: profit });
              setShowConfetti(true);
              setTimeout(() => {
                setWinNotification(null);
                setShowConfetti(false);
              }, 3000);
            } else if (newBet.outcome === 'lost') {
              setLossNotification({ team: newBet.selected_team, amount: newBet.amount });
              setTimeout(() => {
                setLossNotification(null);
              }, 2500);
            }
          }
        });
      }
      
      setPreviousBets(newBets);
      setBets(newBets);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch bets');
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

  cons<Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {winNotification && (
        <div className="win-notification">
          <span className="win-notification-emoji">🎉</span>
          <div>You Won!</div>
          <div className="win-notification-amount">+{formatCurrency(winNotification.amount)}</div>
          <div style={{fontSize: '1.2rem', marginTop: '0.5rem'}}>{winNotification.team}</div>
        </div>
      )}
      
      {lossNotification && (
        <div className="loss-notification">
          <span className="loss-notification-emoji">😔</span>
          <div>Better luck next time!</div>
          <div style={{fontSize: '1rem', marginTop: '0.5rem', opacity: 0.9}}>-{formatCurrency(lossNotification.amount)}</div>
        </div>
      )}
      
      t getConfidenceColor = (betType) => {
    switch(betType?.toLowerCase()) {
      case 'low': return 'confidence-low';
      case 'medium': return 'confidence-medium';
      case 'high': return 'confidence-high';
      default: return '';
    }
  };

  const getOpponent = (bet) => {
    if (!bet.games) return '';
    return bet.games.home_team === bet.selected_team ? bet.games.away_team : bet.games.home_team;
  };

  if (loading) {
    return (
      <div className="bet-list-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your bets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bet-list-container">
      {/* Header Section */}
      <div className="bet-list-header">
        <div className="header-title">
          <h1>My Picks</h1>
          <p className="subtitle">Track your betting history and performance</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="bet-stats-grid">
        <div className="bet-stat-card">
          <div className="stat-icon stat-icon-total">📊</div>
          <div className="stat-info">
            <span className="stat-label">Total Bets</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="bet-stat-card">
          <div className="stat-icon stat-icon-pending">⏳</div>
          <div className="stat-info">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>
        <div className="bet-stat-card">
          <div className="stat-icon stat-icon-won">🏆</div>
          <div className="stat-info">
            <span className="stat-label">Won</span>
            <span className="stat-value">{stats.won}</span>
          </div>
        </div>
        <div className="bet-stat-card">
          <div className="stat-icon stat-icon-lost">❌</div>
          <div className="stat-info">
            <span className="stat-label">Lost</span>
            <span className="stat-value">{stats.lost}</span>
          </div>
        </div>
        <div className="bet-stat-card">
          <div className="stat-icon stat-icon-wagered">💰</div>
          <div className="stat-info">
            <span className="stat-label">Total Wagered</span>
            <span className="stat-value">{formatCurrency(stats.totalWagered)}</span>
          </div>
        </div>
        <div className="bet-stat-card">
          <div className="stat-icon stat-icon-profit">💵</div>
          <div className="stat-info">
            <span className="stat-label">Total Profit</span>
            <span className={`stat-value ${stats.totalWinnings >= 0 ? 'profit-positive' : 'profit-negative'}`}>
              {stats.totalWinnings >= 0 ? '+' : ''}{formatCurrency(stats.totalWinnings)}
            </span>
          </div>
        </div>
      </div> ${bet.outcome === 'won' ? 'win-animation' : ''} ${bet.outcome === 'lost' ? 'loss-animation' : ''}

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filter Tabs */}
      <div className="bet-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Picks ({stats.total})
        </button>
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({stats.pending})
        </button>
        <button 
          className={`filter-btn ${filter === 'won' ? 'active' : ''}`}
          onClick={() => setFilter('won')}
        >
          Won ({stats.won})
        </button>
        <button 
          className={`filter-btn ${filter === 'lost' ? 'active' : ''}`}
          onClick={() => setFilter('lost')}
        >
          Lost ({stats.lost})
        </button>
      </div>

      {/* Bets List */}
      {filteredBets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎲</div>
          <h3>No {filter !== 'all' ? filter : ''} bets found</h3>
          <p>
            {filter === 'all' 
              ? "You haven't placed any bets yet. Head to the dashboard to get started!" 
              : `You don't have any ${filter} bets at the moment.`}
          </p>
        </div>
      ) : (
        <div className="bets-list">
          {filteredBets.map(bet => (
            <div key={bet.id} className={`bet-item ${bet.outcome ? `bet-${bet.outcome}` : 'bet-pending'}`}>
              {/* Bet Header */}
              <div className="bet-item-header">
                <div className="bet-team-info">
                  <span className="team-type-badge">{bet.games?.team_type || 'Game'}</span>
                  <h3 className="team-name">{bet.selected_team}</h3>
                  <span className="vs-text">vs</span>
                  <span className="opponent-name">{getOpponent(bet)}</span>
                </div>
                <div className="bet-status-badge">
                  {bet.status === 'pending' && <span className="badge badge-pending">Pending</span>}
                  {bet.outcome === 'won' && <span className="badge badge-won">Won</span>}
                  {bet.outcome === 'lost' && <span className="badge badge-lost">Lost</span>}
                </div>
              </div>

              {/* Bet Details Grid */}
              <div className="bet-item-details">
                <div className="detail-box">
                  <span className="detail-label">Bet Amount</span>
                  <span className="detail-amount">{formatCurrency(bet.amount)}</span>
                </div>
                <div className="detail-box">
                  <span className="detail-label">Confidence</span>
                  <span className={`confidence-badge ${getConfidenceColor(bet.bet_type)}`}>
                    {bet.bet_type?.toUpperCase()} ({bet.odds}x)
                  </span>
                </div>
                <div className="detail-box">
                  <span className="detail-label">Potential Win</span>
                  <span className="detail-potential">{formatCurrency(bet.potential_win)}</span>
                </div>
                {bet.outcome && (
                  <div className="detail-box">
                    <span className="detail-label">Result</span>
                    <span className={`detail-result ${bet.outcome === 'won' ? 'result-won' : 'result-lost'}`}>
                      {bet.outcome === 'won' 
                        ? `+${formatCurrency(parseFloat(bet.potential_win) - parseFloat(bet.amount))}`
                        : `-${formatCurrency(bet.amount)}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Bet Footer */}
              <div className="bet-item-footer">
                <span className="bet-date">
                  📅 {new Date(bet.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {bet.games?.game_date && (
                  <span className="game-date">
                    🏀 Game: {new Date(bet.games.game_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BetList;
