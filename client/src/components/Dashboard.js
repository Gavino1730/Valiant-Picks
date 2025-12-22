import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import '../styles/Dashboard.css';
import '../styles/Confetti.css';
import { formatCurrency } from '../utils/currency';
import Confetti from './Confetti';

function Dashboard({ user }) {
  const [balance, setBalance] = useState(user?.balance || 0);
  const [games, setGames] = useState([]);
  const [bets, setBets] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [confidence, setConfidence] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [winNotification, setWinNotification] = useState(null);
  const [lossNotification, setLossNotification] = useState(null);
  const [previousBets, setPreviousBets] = useState([]);
  const [stats, setStats] = useState({
    totalBets: 0,
    activeBets: 0,
    wonBets: 0,
    lostBets: 0,
    winRate: 0,
    totalWinnings: 0
  });

  const confidenceMultipliers = {
    low: 1.2,
    medium: 1.5,
    high: 2.0
  };

  useEffect(() => {
    fetchGames();
    fetchBets();
    // Poll for bet updates every 10 seconds
    const interval = setInterval(fetchBets, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      const response = await apiClient.get('/games');
      // Sort games by date (earliest first)
      const sortedGames = (response.data || []).sort((a, b) => {
        return new Date(a.game_date) - new Date(b.game_date);
      });
      setGames(sortedGames);
    } catch (err) {
      console.error('Error fetching games:', err);
      setGames([]);
    } finally {
      setGamesLoading(false);
    }
  };

  const fetchBets = async () => {
    tr
      // Check for newly resolved bets
      if (previousBets.length > 0) {
        userBets.forEach(newBet => {
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
      
      setPreviousBets(userBets);
      y {
      const response = await apiClient.get('/bets');
      const userBets = response.data || [];
      setBets(userBets);
      
      // Calculate stats
      const totalBets = userBets.length;
      const activeBets = userBets.filter(b => b.status === 'pending').length;
      const wonBets = userBets.filter(b => b.outcome === 'won').length;
      const lostBets = userBets.filter(b => b.outcome === 'lost').length;
      const winRate = totalBets > 0 ? Math.round((wonBets / (wonBets + lostBets)) * 100) || 0 : 0;
      const totalWinnings = userBets
        .filter(b => b.outcome === 'won')
        .reduce((sum, b) => sum + (b.potential_win - b.amount), 0);
      
      setStats({
        totalBets,
        activeBets,
        wonBets,
        lostBets,
        winRate,
        totalWinnings
      });
    } catch (err) {
      console.error('Error fetching bets:', err);
    }
  };

  const selectedGame = selectedGameId ? games.find(g => g.id === parseInt(selectedGameId)) : null;

  const handlePlaceBet = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (!selectedGame) {
        setMessage('Please select a game');
        setLoading(false);
        return;
      }

      const betAmount = parseFloat(amount);
      
      // Validate bet amount against balance
      if (betAmount > balance) {
        setMessage('Insufficient balance! You cannot bet more than you have.');
        setLoading(false);
        return;
      }

      const betData = {
        gameId: selectedGame.id,
        selectedTeam,
        confidence,
        amount: betAmount,
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
      
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
      
        odds: confidenceMultipliers[confidence],
      };

      await apiClient.post('/bets', betData);

      // Refresh user balance from server
      const userResponse = await apiClient.get('/users/profile');
      setBalance(userResponse.data.balance);

      setMessage(`Pick placed successfully on ${selectedTeam}! Potential win: ${formatCurrency(amount * confidenceMultipliers[confidence])}`);
      setSelectedGameId('');
      setSelectedTeam('');
      setConfidence('');
      setAmount('');
      
      // Refresh bets to update stats
      fetchBets();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error placing bet');
    } finally {
      setLoading(false);
    }
  };

  const upcomingGames = games.slice(0, 3); // Next 3 games
  const recentBets = bets.slice(0, 5); // Last 5 bets

  return (
    <div className="dashboard">
      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card balance-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Current Balance</h3>
            <p className="stat-value">{formatCurrency(balance)}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Active Picks</h3>
            <p className="stat-value">{stats.activeBets}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Win Rate</h3>
            <p className="stat-value">{stats.winRate}%</p>
            <p className="stat-subtitle">{stats.wonBets}W - {stats.lostBets}L</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>Total Winnings</h3>
            <p className="stat-value" style={{color: stats.totalWinnings >= 0 ? '#66bb6a' : '#ef5350'}}>
              {formatCurrency(Math.abs(stats.totalWinnings))}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="dashboard-grid">
        {/* Left Column - Place Pick */}
        <div className="card bet-card">
          <h3>🎲 Place a Bet</h3>
          {message && (
            <div className={`alert ${message.includes('Error') || message.includes('error') || message.includes('Insufficient') ? 'alert-error' : 'alert-success'}`}>
              {message}
            </div>
          )}

          {gamesLoading ? (
            <p>Loading games...</p>
          ) : games.length === 0 ? (
            <div className="empty-state">
              <p>🏀 No games available at the moment.</p>
              <p className="empty-subtitle">Check back soon for upcoming games!</p>
            </div>
          ) : (
            <form onSubmit={handlePlaceBet} className="bet-form">
              <div className="form-group">
                <label htmlFor="game">🏀 Select Game</label>
                <select
                  id="game"
                  value={selectedGameId}
                  onChange={(e) => {
                    setSelectedGameId(e.target.value);
                    setSelectedTeam('');
                    setConfidence('');
                  }}
                  required
                  className="game-select"
                >
                  <option value="">Choose a game...</option>
                  {games.map(game => (
                    <option key={game.id} value={game.id}>
                      {game.home_team} vs {game.away_team} • {new Date(game.game_date).toLocaleDateString()} {game.game_time}
                    </option>
                  ))}
                </select>
              </div>

              {selectedGame && (
                <div className="bet-details">
                  <div className="game-info-card">
                    <div className="game-header">
                      <span className="game-badge">{selectedGame.team_type}</span>
                      <span className="game-date">{new Date(selectedGame.game_date).toLocaleDateString()} • {selectedGame.game_time}</span>
                    </div>
                    <div className="matchup">
                      <div className="team-item">{selectedGame.home_team}</div>
                      <div className="vs">VS</div>
                      <div className="team-item">{selectedGame.away_team}</div>
                    </div>
                    {selectedGame.location && (
                      <div className="game-location">📍 {selectedGame.location}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>👥 Pick Your Winner</label>
                    <div className="team-selection">
                      <button
                        type="button"
                        className={`team-btn ${selectedTeam === selectedGame.home_team ? 'active' : ''}`}
                        onClick={() => setSelectedTeam(selectedGame.home_team)}
                      >
                        <span className="team-name">{selectedGame.home_team}</span>
                        <span className="team-label">Home</span>
                      </button>
                      <button
                        type="button"
                        className={`team-btn ${selectedTeam === selectedGame.away_team ? 'active' : ''}`}
                        onClick={() => setSelectedTeam(selectedGame.away_team)}
                      >
                        <span className="team-name">{selectedGame.away_team}</span>
                        <span className="team-label">Away</span>
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>💪 Confidence Level</label>
                    <div className="confidence-selection">
                      <button
                        type="button"
                        className={`confidence-btn low ${confidence === 'low' ? 'active' : ''}`}
                        onClick={() => setConfidence('low')}
                      >
                        <span className="confidence-label">Low Risk</span>
                        <span className="confidence-multiplier">1.2x</span>
                        <span className="confidence-desc">Safe bet</span>
                      </button>
                      <button
                        type="button"
                        className={`confidence-btn medium ${confidence === 'medium' ? 'active' : ''}`}
                        onClick={() => setConfidence('medium')}
                      >
                        <span className="confidence-label">Medium</span>
                        <span className="confidence-multiplier">1.5x</span>
                        <span className="confidence-desc">Balanced</span>
                      </button>
                      <button
                        type="button"
                        className={`confidence-btn high ${confidence === 'high' ? 'active' : ''}`}
                        onClick={() => setConfidence('high')}
                      >
                        <span className="confidence-label">High Risk</span>
                        <span className="confidence-multiplier">2.0x</span>
                        <span className="confidence-desc">Go big!</span>
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="amount">💵 Bet Amount</label>
                    <div className="amount-input-wrapper">
                      <input
                        id="amount"
                        type="number"
                        step="1"
                        min="1"
                        max={balance}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        required
                        className="amount-input"
                      />
                      <button 
                        type="button" 
                        className="max-btn"
                        onClick={() => setAmount(balance.toString())}
                      >
                        MAX
                      </button>
                    </div>
                    <div className="amount-helpers">
                      <button type="button" className="quick-amount" onClick={() => setAmount('10')}>10</button>
                      <button type="button" className="quick-amount" onClick={() => setAmount('25')}>25</button>
                      <button type="button" className="quick-amount" onClick={() => setAmount('50')}>50</button>
                      <button type="button" className="quick-amount" onClick={() => setAmount('100')}>100</button>
                    </div>
                  </div>

                  {confidence && amount && parseFloat(amount) > 0 && (
                    <div className="potential-{`recent-bet-item ${bet.outcome === 'won' ? 'win-animation' : ''} ${bet.outcome === 'lost' ? 'loss-animation' : ''}`}
                      <div className="potential-label">Potential Payout</div>
                      <div className="potential-amount">{formatCurrency(parseFloat(amount) * confidenceMultipliers[confidence])}</div>
                      <div className="potential-profit">Profit: {formatCurrency(parseFloat(amount) * (confidenceMultipliers[confidence] - 1))}</div>
                    </div>
                  )}

                  <button type="submit" className="btn btn-bet" disabled={loading || !selectedTeam || !confidence || !amount || parseFloat(amount) <= 0}>
                    {loading ? '⏳ Processing...' : '🎯 Place Pick'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Right Column - Info */}
        <div className="dashboard-sidebar">
          {/* Upcoming Games */}
          <div className="card">
            <h3>📅 Upcoming Games</h3>
            {upcomingGames.length > 0 ? (
              <div className="upcoming-games-list">
                {upcomingGames.map(game => (
                  <div key={game.id} className="upcoming-game-item">
                    <div className="game-teams">
                      <span>{game.home_team}</span>
                      <span className="vs-small">vs</span>
                      <span>{game.away_team}</span>
                    </div>
                    <div className="game-meta">
                      <span className="game-type-badge">{game.team_type?.replace(' Basketball', '')}</span>
                      <span>{new Date(game.game_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">No upcoming games</p>
            )}
          </div>

          {/* Recent Bets */}
          <div className="card">
            <h3>🎲 Recent Bets</h3>
            {recentBets.length > 0 ? (
              <div className="recent-bets-list">
                {recentBets.map(bet => (
                  <div key={bet.id} className="recent-bet-item">
                    <div className="bet-info">
                      <div className="bet-team">{bet.selected_team}</div>
                      <div className="bet-amount">{bet.amount}</div>
                    </div>
                    <div className="bet-status">
                      <span className={`status-badge status-${bet.status === 'pending' ? 'pending' : bet.outcome}`}>
                        {bet.status === 'pending' ? '⏳ Pending' : bet.outcome === 'won' ? '✅ Won' : '❌ Lost'}
                      </span>
                      {bet.outcome === 'won' && (
                        <span className="bet-win">+{formatCurrency(bet.potential_win - bet.amount)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">No picks placed yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
