import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../utils/axios';
import '../styles/Games.css';
import { formatCurrency } from '../utils/currency';
import { formatTime } from '../utils/time';

function Games() {
  const [games, setGames] = useState([]);
  const [propBets, setPropBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [propBetAmounts, setPropBetAmounts] = useState({});
  const [message, setMessage] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [selectedTeams, setSelectedTeams] = useState({});
  const [selectedConfidence, setSelectedConfidence] = useState({});
  const [betAmounts, setBetAmounts] = useState({});
  const [now, setNow] = useState(Date.now());
  const [userBets, setUserBets] = useState([]);
  const [betSuccess, setBetSuccess] = useState({});

  const confidenceMultipliers = {
    low: 1.2,
    medium: 1.5,
    high: 2.0
  };

  useEffect(() => {
    fetchGames();
    fetchPropBets();
    fetchBalance();
    fetchUserBets();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await apiClient.get('/users/profile');
      setBalance(response.data.balance);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const fetchUserBets = async () => {
    try {
      const response = await apiClient.get('/bets');
      setUserBets(response.data || []);
    } catch (err) {
      console.error('Error fetching user bets:', err);
      setUserBets([]);
    }
  };

  const fetchGames = async () => {
    try {
      const response = await apiClient.get('/games');
      const sortedGames = (response.data || []).sort((a, b) => {
        return new Date(a.game_date) - new Date(b.game_date);
      });
      setGames(sortedGames);
    } catch (err) {
      console.error('Error fetching games:', err);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPropBets = async () => {
    try {
      const response = await apiClient.get('/prop-bets');
      setPropBets(response.data || []);
    } catch (err) {
      console.error('Error fetching prop bets:', err);
      setPropBets([]);
    }
  };

  const hasExistingBet = (gameId) => {
    return userBets.some(bet => bet.game_id === gameId);
  };

  const parseLocalDateOnly = (dateStr) => {
    const [year, month, day] = (dateStr || '').split('-').map(Number);
    if (Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)) {
      return new Date(year, month - 1, day);
    }
    const parsed = new Date(dateStr);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDate = (dateString) => {
    const date = parseLocalDateOnly(dateString);
    if (!date) return 'Date TBD';
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const buildDateFromParts = (game) => {
    if (!game?.game_date) return null;

    const date = parseLocalDateOnly(game.game_date);
    if (!date) return null;

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

  const isClosedStatus = (statusText = '') => {
    const normalized = statusText.toLowerCase();
    return ['in progress', 'live', 'completed', 'final', 'resolved', 'closed', 'cancelled'].some((keyword) =>
      normalized.includes(keyword)
    );
  };

  const handlePlacePropBet = async (propId, choice, isLocked) => {
    if (isLocked) {
      setMessage('This prop bet is closed');
      return;
    }

    const amount = parseFloat(propBetAmounts[`${propId}-${choice}`]);
    
    if (!amount || amount <= 0) {
      setMessage('Please enter a valid bet amount');
      return;
    }

    if (amount > balance) {
      setMessage('Insufficient balance!');
      return;
    }

    try {
      await apiClient.post('/prop-bets/place', {
        propBetId: propId,
        choice,
        amount
      });
      
      setMessage(`Pick placed successfully on ${choice.toUpperCase()}!`);
      setPropBetAmounts({});
      fetchBalance();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to place pick');
    }
  };

  const handlePropAmountChange = (propId, choice, value) => {
    setPropBetAmounts(prev => ({
      ...prev,
      [`${propId}-${choice}`]: value
    }));
  };

  const handlePlaceGameBet = async (gameId, isLocked) => {
    if (isLocked) {
      setMessage('Betting closed for this game');
      return;
    }

    if (hasExistingBet(gameId)) {
      setMessage('You have already placed a bet on this game');
      return;
    }

    const team = selectedTeams[gameId];
    const confidence = selectedConfidence[gameId];
    const amount = parseFloat(betAmounts[gameId]);

    if (!team || !confidence || !amount) {
      setMessage('Please select team, confidence, and enter amount');
      return;
    }

    if (amount > balance) {
      setMessage('Insufficient balance!');
      return;
    }

    try {
      await apiClient.post('/bets', {
        gameId,
        selectedTeam: team,
        confidence,
        amount,
        odds: confidenceMultipliers[confidence]
      });

      setBetSuccess(prev => ({ ...prev, [gameId]: true }));
      setTimeout(() => {
        setBetSuccess(prev => ({ ...prev, [gameId]: false }));
      }, 3000);
      
      setSelectedTeams(prev => ({ ...prev, [gameId]: '' }));
      setSelectedConfidence(prev => ({ ...prev, [gameId]: '' }));
      setBetAmounts(prev => ({ ...prev, [gameId]: '' }));
      fetchBalance();
      fetchUserBets();

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to place pick');
    }
  };

  const activePropBets = useMemo(() => propBets.filter(pb => pb.status === 'active'), [propBets]);

  return (
    <div className="games-page">
      <div className="page-header">
        <h2>Available Picks</h2>
        <p className="page-subtitle">Browse all upcoming games and prop picks</p>
      </div>

      {/* Beginner Help Section */}
      <div className="help-banner">
        <div className="help-icon">📖</div>
        <div className="help-content">
          <h3>Quick Guide</h3>
          <p><strong>Game Picks:</strong> Predict which team wins. Choose your confidence level (Low 1.2x, Medium 1.5x, High 2.0x) to multiply your winnings!</p>
          <p><strong>Prop Bets:</strong> Special predictions like "Will the team score over 50 points?" Simple YES or NO picks with custom odds.</p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') || message.includes('Insufficient') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="filter-buttons" style={{marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
          <button 
            className={`btn ${teamFilter === 'all' ? 'active' : ''}`}
            style={{padding: '8px 16px', background: teamFilter === 'all' ? '#1e88e5' : 'rgba(255,255,255,0.1)'}}
            onClick={() => setTeamFilter('all')}
          >
            All Games
          </button>
          <button 
            className={`btn ${teamFilter === 'boys' ? 'active' : ''}`}
            style={{padding: '8px 16px', background: teamFilter === 'boys' ? '#1e88e5' : 'rgba(255,255,255,0.1)'}}
            onClick={() => setTeamFilter('boys')}
          >
            Boys Basketball
          </button>
          <button 
            className={`btn ${teamFilter === 'girls' ? 'active' : ''}`}
            style={{padding: '8px 16px', background: teamFilter === 'girls' ? '#1e88e5' : 'rgba(255,255,255,0.1)'}}
            onClick={() => setTeamFilter('girls')}
          >
            Girls Basketball
          </button>
        </div>

      {loading ? (
        <div className="games-grid">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div className="game-card-display skeleton-card" key={idx}>
              <div className="skeleton-row">
                <span className="skeleton-badge" />
                <span className="skeleton-pill" />
              </div>
              <div className="skeleton-block" style={{height: '24px', marginTop: '10px'}} />
              <div className="skeleton-block" style={{height: '18px', width: '60%', marginTop: '6px'}} />
              <div className="skeleton-stack" style={{marginTop: '16px'}}>
                <span className="skeleton-line" />
                <span className="skeleton-line short" />
                <span className="skeleton-line" />
              </div>
              <div className="skeleton-stack" style={{marginTop: '16px'}}>
                <span className="skeleton-line" />
                <span className="skeleton-line short" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* All Picks - Games and Props Combined */}
          <div style={{marginBottom: '3rem'}}>
            <div className="games-grid">
              {games.length === 0 && activePropBets.length === 0 ? (
                <div className="empty-state">
                  <p>No picks available at the moment</p>
                </div>
              ) : (
                <>
                {/* Render Prop Bets */}
                {activePropBets.map(prop => {
                  const expiresAt = prop.expires_at ? new Date(prop.expires_at) : null;
                  const countdown = getCountdown(expiresAt);
                  const propLocked = countdown.isPast || prop.status !== 'active';

                  return (
                  <div key={`prop-${prop.id}`} className="prop-card">
                    <div className="prop-header">
                      <h3>{prop.title}</h3>
                      <span className={`prop-category ${prop.team_type?.toLowerCase().includes('boys') ? 'boys' : prop.team_type?.toLowerCase().includes('girls') ? 'girls' : ''}`}>
                        {prop.team_type?.toLowerCase().includes('boys') ? '🏀 ' : prop.team_type?.toLowerCase().includes('girls') ? '🏀 ' : ''}{prop.team_type}
                      </span>
                    </div>
                    
                    {prop.description && (
                      <p className="prop-description">{prop.description}</p>
                    )}

                    <div className="prop-expiry-row">
                      <span className={`prop-expiry ${propLocked ? 'expired' : ''}`}>
                        {prop.expires_at ? (countdown.isPast ? 'Expired' : `Expires in ${countdown.label}`) : 'No expiry set'}
                      </span>
                    </div>

                    <div className="prop-betting-section">
                      {/* Determine if this is a custom options prop or legacy yes/no */}
                      {prop.options && prop.options.length > 0 ? (
                        // Custom options
                        prop.options.map((option, idx) => {
                          const optionKey = option.toLowerCase().replace(/\s+/g, '-');
                          const odds = prop.option_odds ? prop.option_odds[option] : null;
                          
                          return (
                            <div key={idx} className={`prop-option-bet ${idx === 0 ? 'yes' : 'no'}`}>
                              <div className="option-header">
                                <span className="option-label">{option}</span>
                                <span className="option-odds">{odds || 1.5}x</span>
                              </div>
                              <input
                                type="number"
                                placeholder="Bet amount"
                                min="0.01"
                                step="0.01"
                                value={propBetAmounts[`${prop.id}-${optionKey}`] || ''}
                                onChange={(e) => handlePropAmountChange(prop.id, optionKey, e.target.value)}
                                className="prop-bet-input"
                                disabled={propLocked}
                              />
                              <button
                                className={`prop-bet-btn ${idx === 0 ? 'yes' : 'no'}-btn`}
                                onClick={() => handlePlacePropBet(prop.id, optionKey, propLocked)}
                                disabled={propLocked}
                              >
                                {propLocked ? 'Closed' : `Bet ${option}`}
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        // Legacy yes/no options
                        <>
                          <div className="prop-option-bet yes">
                            <div className="option-header">
                              <span className="option-label">YES</span>
                              <span className="option-odds">{prop.yes_odds}x</span>
                            </div>
                            <input
                              type="number"
                              placeholder="Bet amount"
                              min="0.01"
                              step="0.01"
                              value={propBetAmounts[`${prop.id}-yes`] || ''}
                              onChange={(e) => handlePropAmountChange(prop.id, 'yes', e.target.value)}
                              className="prop-bet-input"
                              disabled={propLocked}
                            />
                            <button
                              className="prop-bet-btn yes-btn"
                              onClick={() => handlePlacePropBet(prop.id, 'yes', propLocked)}
                              disabled={propLocked}
                            >
                              {propLocked ? 'Closed' : 'Bet YES'}
                            </button>
                          </div>

                          <div className="prop-option-bet no">
                            <div className="option-header">
                              <span className="option-label">NO</span>
                              <span className="option-odds">{prop.no_odds}x</span>
                            </div>
                            <input
                              type="number"
                              placeholder="Bet amount"
                              min="0.01"
                              step="0.01"
                              value={propBetAmounts[`${prop.id}-no`] || ''}
                              onChange={(e) => handlePropAmountChange(prop.id, 'no', e.target.value)}
                              className="prop-bet-input"
                              disabled={propLocked}
                            />
                            <button
                              className="prop-bet-btn no-btn"
                              onClick={() => handlePlacePropBet(prop.id, 'no', propLocked)}
                              disabled={propLocked}
                            >
                              {propLocked ? 'Closed' : 'Bet NO'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {prop.expires_at && (
                      <div className="prop-expires">
                        Expires: {new Date(prop.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  );
                })}

                {/* Render Games */}
                {games
                  .filter(game => {
                    if (teamFilter === 'all') return true;
                    if (teamFilter === 'boys') return game.team_type?.toLowerCase().includes('boys');
                    if (teamFilter === 'girls') return game.team_type?.toLowerCase().includes('girls');
                    return true;
                  })
                  .map(game => {
                    const startDate = buildDateFromParts(game);
                    const countdown = getCountdown(startDate);
                    const gameLocked = countdown.isPast || isClosedStatus(game.status);

                    return (
                  <div key={game.id} className="game-card-display">
                    <div className="game-header">
                      <span className={`game-sport ${game.team_type?.toLowerCase().includes('boys') ? 'boys' : game.team_type?.toLowerCase().includes('girls') ? 'girls' : ''}`}>
                        {game.team_type?.toLowerCase().includes('boys') ? '🏀 ' : game.team_type?.toLowerCase().includes('girls') ? '🏀 ' : ''}{game.team_type}
                      </span>
                      <span className="game-status">{game.status}</span>
                    </div>
                    
                    <div className="game-matchup">
                      <div className="team">
                        <span className="team-name">{game.home_team}</span>
                      </div>
                      {game.away_team && (
                        <>
                          <span className="vs">VS</span>
                          <div className="team">
                            <span className="team-name">{game.away_team}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="game-details">
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <span className="detail-text">{formatDate(game.game_date)}</span>
                      </div>
                      {game.game_time && (
                        <div className="detail-item">
                          <span className="detail-icon">⏰</span>
                          <span className="detail-text">{formatTime(game.game_time)}</span>
                        </div>
                      )}
                      {game.location && (
                        <div className="detail-item">
                          <span className="detail-icon">📍</span>
                          <span className="detail-text">{game.location}</span>
                        </div>
                      )}
                      <div className={`countdown-chip ${gameLocked ? 'countdown-closed' : ''}`}>
                        {countdown.isPast ? 'Betting closed' : `Starts in ${countdown.label}`}
                      </div>
                    </div>

                    {game.notes && (
                      <div className="game-notes">
                        <p>{game.notes}</p>
                      </div>
                    )}

                    <div className="betting-section">
                      <div className="team-selection" style={{marginBottom: '15px'}}>
                        <button
                          type="button"
                          className={`team-btn ${selectedTeams[game.id] === game.home_team ? 'active' : ''}`}
                          style={{flex: 1, padding: '10px', background: selectedTeams[game.id] === game.home_team ? '#1e88e5' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', cursor: 'pointer', transition: 'all 0.3s'}}
                          onClick={() => setSelectedTeams({...selectedTeams, [game.id]: game.home_team})}
                        >
                          {game.home_team}
                        </button>
                        {game.away_team && (
                          <button
                            type="button"
                            className={`team-btn ${selectedTeams[game.id] === game.away_team ? 'active' : ''}`}
                            style={{flex: 1, padding: '10px', background: selectedTeams[game.id] === game.away_team ? '#1e88e5' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', cursor: 'pointer', transition: 'all 0.3s', marginLeft: '10px'}}
                            onClick={() => setSelectedTeams({...selectedTeams, [game.id]: game.away_team})}
                          >
                            {game.away_team}
                          </button>
                        )}
                      </div>

                      <div className="confidence-options" style={{marginBottom: '15px', display: 'flex', gap: '8px'}}>
                        <button
                          type="button"
                          className={`confidence-btn ${selectedConfidence[game.id] === 'low' ? 'active' : ''}`}
                          style={{flex: 1, padding: '8px', background: selectedConfidence[game.id] === 'low' ? '#66bb6a' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.9em'}}
                          onClick={() => setSelectedConfidence({...selectedConfidence, [game.id]: 'low'})}
                        >
                          <div>Low</div>
                          <div style={{fontSize: '0.85em'}}>1.2x</div>
                        </button>
                        <button
                          type="button"
                          className={`confidence-btn ${selectedConfidence[game.id] === 'medium' ? 'active' : ''}`}
                          style={{flex: 1, padding: '8px', background: selectedConfidence[game.id] === 'medium' ? '#ff9800' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.9em'}}
                          onClick={() => setSelectedConfidence({...selectedConfidence, [game.id]: 'medium'})}
                        >
                          <div>Medium</div>
                          <div style={{fontSize: '0.85em'}}>1.5x</div>
                        </button>
                        <button
                          type="button"
                          className={`confidence-btn ${selectedConfidence[game.id] === 'high' ? 'active' : ''}`}
                          style={{flex: 1, padding: '8px', background: selectedConfidence[game.id] === 'high' ? '#ef5350' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.9em'}}
                          onClick={() => setSelectedConfidence({...selectedConfidence, [game.id]: 'high'})}
                        >
                          <div>High</div>
                          <div style={{fontSize: '0.85em'}}>2.0x</div>
                        </button>
                      </div>

                      {hasExistingBet(game.id) ? (
                        <div style={{padding: '12px', background: 'rgba(102, 187, 106, 0.15)', border: '1px solid rgba(102, 187, 106, 0.4)', borderRadius: '8px', textAlign: 'center', color: '#66bb6a', fontWeight: 'bold'}}>
                          ✓ Bet Already Placed
                        </div>
                      ) : gameLocked ? (
                        <div style={{padding: '12px', background: 'rgba(239, 83, 80, 0.15)', border: '1px solid rgba(239, 83, 80, 0.4)', borderRadius: '8px', textAlign: 'center', color: '#ef5350', fontWeight: 'bold'}}>
                          🔒 Betting Closed
                        </div>
                      ) : (
                        <>
                          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                            <input
                              type="number"
                              placeholder="Bet amount"
                              min="0.01"
                              step="0.01"
                              value={betAmounts[game.id] || ''}
                              onChange={(e) => setBetAmounts({...betAmounts, [game.id]: e.target.value})}
                              style={{flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', fontSize: '1em'}}
                            />
                            <button
                              onClick={() => handlePlaceGameBet(game.id, gameLocked)}
                              disabled={gameLocked || !selectedTeams[game.id] || !selectedConfidence[game.id] || !betAmounts[game.id]}
                              style={{padding: '10px 20px', background: betSuccess[game.id] ? '#66bb6a' : '#1e88e5', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold', opacity: (gameLocked || !selectedTeams[game.id] || !selectedConfidence[game.id] || !betAmounts[game.id]) ? 0.5 : 1, transition: 'all 0.3s ease'}}
                            >
                              {betSuccess[game.id] ? '✓ Success!' : gameLocked ? 'Closed' : 'Bet'}
                            </button>
                          </div>
                          {betSuccess[game.id] && (
                            <div style={{marginTop: '10px', padding: '8px', background: 'rgba(102, 187, 106, 0.2)', border: '1px solid #66bb6a', borderRadius: '8px', textAlign: 'center', color: '#66bb6a', fontWeight: 'bold', animation: 'slideDown 0.3s ease'}}>
                              ✓ Pick placed successfully on {selectedTeams[game.id]}!
                            </div>
                          )}
                        </>
                      )}

                      {selectedConfidence[game.id] && betAmounts[game.id] && !gameLocked && !hasExistingBet(game.id) && (
                        <div style={{marginTop: '10px', textAlign: 'center', color: '#1f4e99', fontWeight: 'bold'}}>
                          Potential Win: {formatCurrency(parseFloat(betAmounts[game.id]) * confidenceMultipliers[selectedConfidence[game.id]])}
                        </div>
                      )}
                    </div>
                  </div>
                    );
                })}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Games;
