import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../utils/axios';
import '../styles/Dashboard.css';
import '../styles/Confetti.css';
import { formatCurrency } from '../utils/currency';
import { formatTime } from '../utils/time';
import Confetti from './Confetti';

function Dashboard({ user, onNavigate, updateUser, fetchUserProfile }) {
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
  const [now, setNow] = useState(Date.now());
  const messageRef = useRef(null);

  const confidenceMultipliers = {
    low: 1.2,
    medium: 1.5,
    high: 2.0
  };

  useEffect(() => {
    // Update less frequently to reduce re-renders and improve interaction latency
    const intervalId = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(intervalId);
  }, []);

  const buildGameStartDate = (game) => {
    if (!game?.game_date) return null;

    // Parse as local date to avoid UTC shifting that pushes the day forward/backward
    const [year, month, day] = (game.game_date || '').split('-').map(Number);
    const date = Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)
      ? new Date(year, month - 1, day)
      : new Date(game.game_date);

    if (Number.isNaN(date.getTime())) return null;

    if (game.game_time) {
      const parts = game.game_time.split(':').map(Number);
      if (parts.length >= 2 && !parts.some(Number.isNaN)) {
        date.setHours(parts[0]);
        date.setMinutes(parts[1]);
        date.setSeconds(parts[2] || 0);
        date.setMilliseconds(0);
      }
    }

    return date;
  };

  const parseLocalDateOnly = (dateStr) => {
    const [year, month, day] = (dateStr || '').split('-').map(Number);
    if (Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)) {
      return new Date(year, month - 1, day);
    }
    const parsed = new Date(dateStr);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const getCountdown = (targetDate) => {
    if (!targetDate || Number.isNaN(targetDate.getTime())) {
      return { label: 'Start time TBD', isPast: false };
    }

    const diff = targetDate.getTime() - now;
    if (diff <= 0) return { label: 'In progress', isPast: true };

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return { label: `${days}d ${hours}h`, isPast: false };
    if (hours > 0) return { label: `${hours}h ${minutes}m`, isPast: false };
    return { label: `${minutes}m ${seconds.toString().padStart(2, '0')}s`, isPast: false };
  };

  const isGameLocked = (game) => {
    const startDate = buildGameStartDate(game);
    const normalizedStatus = (game?.status || '').toLowerCase();
    const statusClosed = ['in progress', 'live', 'completed', 'final', 'resolved', 'closed', 'cancelled'].some((keyword) =>
      normalizedStatus.includes(keyword)
    );

    if (statusClosed) return true;
    if (startDate && Date.now() >= startDate.getTime()) return true;
    return false;
  };

  const fetchGames = useCallback(async () => {
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
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await apiClient.get('/users/profile');
      if (response?.data?.balance !== undefined) {
        setBalance(response.data.balance);
        // Update parent component's user state and localStorage
        if (fetchUserProfile) {
          fetchUserProfile();
        } else if (updateUser) {
          updateUser(response.data);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, [fetchUserProfile, updateUser]);

  const fetchBets = useCallback(async () => {
    try {
      const response = await apiClient.get('/bets');
      const userBets = response.data || [];

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
  }, [previousBets]);

  useEffect(() => {
    fetchProfile();
    fetchGames();
    fetchBets();
    // Lighten load: poll for bet updates every 30 seconds
    const interval = setInterval(fetchBets, 30000);
    return () => clearInterval(interval);
  }, [fetchGames, fetchBets, fetchProfile]);

  const selectedGame = selectedGameId ? games.find(g => g.id === parseInt(selectedGameId)) : null;
  const selectedGameLocked = selectedGame ? isGameLocked(selectedGame) : false;
  const isGameBet = (bet) => Boolean(bet?.games) && !bet?.bet_type?.startsWith('prop-');
  const hasExistingBetOnSelectedGame = selectedGame
    ? bets.some(bet => isGameBet(bet) && bet.game_id === selectedGame.id)
    : false;

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

      if (isGameLocked(selectedGame)) {
        setMessage('Picking closed for this game');
        setLoading(false);
        return;
      }

      const betAmount = parseFloat(amount);
      
      // Validate bet amount against balance
      if (betAmount > balance) {
        setMessage('Insufficient balance! You cannot stake more than you have.');
        setLoading(false);
        return;
      }

      const betData = {
        gameId: selectedGame.id,
        selectedTeam,
        confidence,
        amount: betAmount,
        odds: confidenceMultipliers[confidence],
      };

      await apiClient.post('/bets', betData);

      // Refresh user balance from server
      const userResponse = await apiClient.get('/users/profile');
      setBalance(userResponse.data.balance);
      
      // Update parent component's user state and localStorage
      if (updateUser) {
        updateUser(userResponse.data);
      }

      setMessage(`Pick placed successfully on ${selectedTeam}! Potential win: ${formatCurrency(amount * confidenceMultipliers[confidence])}`);
      setSelectedGameId('');
      setSelectedTeam('');
      setConfidence('');
      setAmount('');
      
      // Scroll to message
      setTimeout(() => {
        messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
      
      // Refresh bets to update stats
      fetchBets();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error placing pick');
      // Scroll to message on error too
      setTimeout(() => {
        messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const renderBetDetails = () => (
    <>
      <div className="form-group">
        <label>👥 Step 2: Who Will Win?</label>
        <p className="field-help">Click on the team you think will win this game</p>
        <div className="team-selection">
          {/* Always show Valiants first (left) */}
          {selectedGame.home_team.toLowerCase().includes('valiant') ? (
            <>
              <button
                type="button"
                className={`team-btn valiant ${selectedTeam === selectedGame.home_team ? 'active' : ''}`}
                onClick={() => setSelectedTeam(selectedGame.home_team)}
              >
                <span className="team-name">{selectedGame.home_team}</span>
                <span className="team-label">Home</span>
              </button>
              <button
                type="button"
                className={`team-btn opponent ${selectedTeam === selectedGame.away_team ? 'active' : ''}`}
                onClick={() => setSelectedTeam(selectedGame.away_team)}
              >
                <span className="team-name">{selectedGame.away_team}</span>
                <span className="team-label">Away</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`team-btn valiant ${selectedTeam === selectedGame.away_team ? 'active' : ''}`}
                onClick={() => setSelectedTeam(selectedGame.away_team)}
              >
                <span className="team-name">{selectedGame.away_team}</span>
                <span className="team-label">Away</span>
              </button>
              <button
                type="button"
                className={`team-btn opponent ${selectedTeam === selectedGame.home_team ? 'active' : ''}`}
                onClick={() => setSelectedTeam(selectedGame.home_team)}
              >
                <span className="team-name">{selectedGame.home_team}</span>
                <span className="team-label">Home</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>💪 Step 3: How Sure Are You?</label>
        <p className="field-help">Choose your confidence level - higher confidence = bigger rewards if you win!</p>
        <div className="confidence-selection">
          <button
            type="button"
            className={`confidence-btn low ${confidence === 'low' ? 'active' : ''}`}
            onClick={() => setConfidence('low')}
          >
            <span className="confidence-label">Low</span>
            <span className="confidence-multiplier">1.2x</span>
            <span className="confidence-desc">Win 20% more</span>
          </button>
          <button
            type="button"
            className={`confidence-btn medium ${confidence === 'medium' ? 'active' : ''}`}
            onClick={() => setConfidence('medium')}
          >
            <span className="confidence-label">Medium</span>
            <span className="confidence-multiplier">1.5x</span>
            <span className="confidence-desc">Win 50% more</span>
          </button>
          <button
            type="button"
            className={`confidence-btn high ${confidence === 'high' ? 'active' : ''}`}
            onClick={() => setConfidence('high')}
          >
            <span className="confidence-label">High</span>
            <span className="confidence-multiplier">2.0x</span>
            <span className="confidence-desc">Double your stake!</span>
          </button>
        </div>
      </div>

      {hasExistingBetOnSelectedGame ? (
        <div className="form-group">
          <label htmlFor="amount">💵 Pick Amount</label>
          <div style={{padding: '12px', background: 'rgba(102, 187, 106, 0.15)', border: '1px solid rgba(102, 187, 106, 0.4)', borderRadius: '8px', textAlign: 'center', color: '#66bb6a', fontWeight: 'bold'}}>
            ✓ Bet Already Placed
          </div>
        </div>
      ) : selectedGameLocked ? (
        <div className="form-group">
          <label htmlFor="amount">💵 Pick Amount</label>
          <div style={{padding: '12px', background: 'rgba(239, 83, 80, 0.15)', border: '1px solid rgba(239, 83, 80, 0.4)', borderRadius: '8px', textAlign: 'center', color: '#ef5350', fontWeight: 'bold'}}>
            🔒 Betting Closed
          </div>
        </div>
      ) : (
        <>
          <div className="form-group">
            <label htmlFor="amount">💵 Step 4: How Much to Stake?</label>
            <p className="field-help">Enter how many Valiant Bucks you want to stake • Your balance: <strong>{formatCurrency(balance)}</strong></p>
            <div className="amount-input-wrapper">
              <input
                id="amount"
                type="number"
                step="1"
                min={balance > 0 ? 1 : 0}
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  const numeric = parseFloat(val);
                  if (balance > 0 && !Number.isNaN(numeric) && numeric > balance) {
                    setAmount(balance.toString());
                  } else {
                    setAmount(val);
                  }
                }}
                placeholder={balance > 0 ? 'Enter amount' : 'Balance too low'}
                required
                className="amount-input"
                disabled={balance <= 0}
              />
              <button 
                type="button" 
                className="max-btn"
                onClick={() => balance > 0 && setAmount(balance.toString())}
                disabled={balance <= 0}
              >
                MAX
              </button>
            </div>
            {amount && selectedTeam && confidence && (
              <div className="bet-preview">
                <div className="bet-preview-row">
                  <span className="bet-preview-label">Stake</span>
                  <span className="bet-preview-value">{formatCurrency(parseFloat(amount))}</span>
                </div>
                <div className="bet-preview-row">
                  <span className="bet-preview-label">Multiplier</span>
                  <span className="bet-preview-value">{confidenceMultipliers[confidence]}x</span>
                </div>
                <div className="bet-preview-row highlight">
                  <span className="bet-preview-label">Potential Win</span>
                  <span className="bet-preview-value">{formatCurrency(parseFloat(amount) * confidenceMultipliers[confidence])}</span>
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || !selectedGameId || !selectedTeam || !confidence || !amount || balance <= 0 || selectedGameLocked}
          >
            {loading ? 'Placing Pick...' : `✅ Lock In Pick for ${formatCurrency(parseFloat(amount || 0))}`}
          </button>
        </>
      )}
    </>
  );

  const upcomingGames = React.useMemo(() => games.slice(0, 3), [games]);
  const recentActivity = React.useMemo(
    () => [...bets].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6),
    [bets]
  );

  return (
    <div className="dashboard">
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {/* Beginner Help Banner */}
      <div className="beginner-banner">
        <div className="banner-icon">💡</div>
        <div className="banner-content">
          <h3>How It Works</h3>
          <p>Pick which team you think will win, choose how confident you are, and decide how many Valiant Bucks to stake. If you're right, you win back your stake multiplied by your confidence level!</p>
        </div>
      </div>
      
      {/* Reserve space for notifications to prevent layout shift */}
      <div style={{minHeight: winNotification || lossNotification ? 'auto' : '0px', marginBottom: winNotification || lossNotification ? '1rem' : '0'}}>
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
      </div>

      {/* Stats Overview - Compact */}
      <div className="dashboard-stats-compact">
        <div className="stat-compact">
          <span className="stat-compact-value">{stats.totalBets}</span>
          <span className="stat-compact-label">Total</span>
        </div>
        <div className="stat-compact pending">
          <span className="stat-compact-value">{stats.activeBets}</span>
          <span className="stat-compact-label">Pending</span>
        </div>
        <div className="stat-compact won">
          <span className="stat-compact-value">{stats.wonBets}</span>
          <span className="stat-compact-label">Won</span>
        </div>
        <div className="stat-compact lost">
          <span className="stat-compact-value">{stats.lostBets}</span>
          <span className="stat-compact-label">Lost</span>
        </div>
        <div className="stat-compact profit" style={{borderColor: stats.totalWinnings >= 0 ? '#66bb6a' : '#ef5350'}}>
          <span className="stat-compact-value" style={{color: stats.totalWinnings >= 0 ? '#81c784' : '#ef5350'}}>
            {stats.totalWinnings >= 0 ? '+' : ''}{formatCurrency(stats.totalWinnings)}
          </span>
          <span className="stat-compact-label">Profit</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="dashboard-grid">
        {/* Left Column - Place Pick */}
        <div className="card bet-card">
          <h3>🎲 Place a Pick</h3>
          {message && (
            <div ref={messageRef} className={`alert ${message.includes('Error') || message.includes('error') || message.includes('Insufficient') ? 'alert-error' : 'alert-success'}`}>
              {message}
            </div>
          )}

          {gamesLoading ? (
            <div className="skeleton-stack" style={{gap: '12px'}}>
              <span className="skeleton-line" style={{height: '14px', width: '60%'}} />
              <span className="skeleton-line" style={{height: '14px', width: '50%'}} />
              <span className="skeleton-line" style={{height: '44px', width: '100%', borderRadius: '10px'}} />
              <span className="skeleton-line" style={{height: '44px', width: '100%', borderRadius: '10px'}} />
            </div>
          ) : games.length === 0 ? (
            <div className="empty-state">
              <p>🏀 No games available at the moment.</p>
              <p className="empty-subtitle">Check back soon for upcoming games!</p>
            </div>
          ) : (
            <form onSubmit={handlePlaceBet} className="bet-form">
              <div className="form-group">
                <label>🏀 Step 1: Choose a Game</label>
                <p className="field-help">Select the game you want to predict the winner for</p>
                <div className="game-cards-selection">
                  {games.map((game, index) => {
                    const gameCountdown = getCountdown(buildGameStartDate(game));
                    const isLocked = isGameLocked(game);
                    const isSelected = selectedGameId === game.id.toString();
                    return (
                      <React.Fragment key={game.id}>
                        <button
                          type="button"
                          className={`game-card-btn ${isSelected ? 'active' : ''} ${isLocked ? 'locked' : ''} ${game.team_type?.toLowerCase().includes('boys') ? 'boys-game' : game.team_type?.toLowerCase().includes('girls') ? 'girls-game' : ''}`}
                          onClick={() => {
                            if (!isLocked) {
                              setSelectedGameId(game.id.toString());
                              setSelectedTeam('');
                              setConfidence('');
                            }
                          }}
                          disabled={isLocked}
                        >
                          <div className="game-card-header">
                            <span className={`game-badge ${game.team_type?.toLowerCase().includes('boys') ? 'boys' : game.team_type?.toLowerCase().includes('girls') ? 'girls' : ''}`}>
                              {game.team_type?.toLowerCase().includes('boys') ? '🏀 ' : game.team_type?.toLowerCase().includes('girls') ? '🏀 ' : ''}{game.team_type}
                            </span>
                            {gameCountdown && (
                              <span className={`countdown-chip ${gameCountdown.isPast ? 'countdown-closed' : ''}`}>
                                {gameCountdown.isPast ? '🔒 Closed' : `⏰ ${gameCountdown.label}`}
                              </span>
                            )}
                          </div>
                          <div className="game-card-matchup">
                            <div className="game-card-team">{game.home_team}</div>
                            <div className="game-card-vs">VS</div>
                            <div className="game-card-team">{game.away_team}</div>
                          </div>
                          <div className="game-card-details">
                            <span className="game-card-date">📅 {parseLocalDateOnly(game.game_date)?.toLocaleDateString() || 'Date TBD'}</span>
                            <span className="game-card-time">🕐 {formatTime(game.game_time)}</span>
                          </div>
                          {game.location && (
                            <div className="game-card-location">📍 {game.location}</div>
                          )}
                        </button>
                        
                        {isSelected && selectedGame && (
                          <div className="bet-details-expanded">
                            {renderBetDetails()}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
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
                      <span className={`game-type-badge ${game.team_type?.toLowerCase().includes('boys') ? 'boys' : game.team_type?.toLowerCase().includes('girls') ? 'girls' : ''}`}>
                        {game.team_type?.toLowerCase().includes('boys') ? '🏀 ' : game.team_type?.toLowerCase().includes('girls') ? '🏀 ' : ''}{game.team_type?.replace(' Basketball', '')}
                      </span>
                      <span>{parseLocalDateOnly(game.game_date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'TBD'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">No upcoming games</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3>📝 Recent Activity</h3>
            {recentActivity.length > 0 ? (
              <div className="recent-bets-list">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="recent-bet-item">
                    <div className="bet-info">
                      <div className="bet-team">{activity.selected_team}</div>
                      <div className="bet-amount">{activity.amount}</div>
                    </div>
                    <div className="bet-status">
                      <span className={`status-badge status-${activity.status === 'pending' ? 'pending' : activity.outcome}`}>
                        {activity.status === 'pending'
                          ? '⏳ Pending'
                          : activity.outcome === 'won'
                          ? '✅ Won'
                          : '❌ Lost'}
                      </span>
                      {activity.outcome === 'won' && (
                        <span className="bet-win">+{formatCurrency(activity.potential_win - activity.amount)}</span>
                      )}
                      {activity.status === 'pending' && (
                        <span className="bet-win" style={{ color: '#1f4e99' }}>
                          Possible: {formatCurrency(activity.potential_win - activity.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">No recent activity</p>
            )}
          </div>

          {/* About Section */}
          <div className="card about-section">
            <h3>Learn More About Valiant Picks</h3>
            <p>Curious about the platform? Check out our comprehensive information page.</p>
            <button 
              className="btn btn-secondary"
              onClick={() => onNavigate && onNavigate('about')}
              style={{ marginTop: '1rem' }}
            >
              ℹ️ About Valiant Picks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
