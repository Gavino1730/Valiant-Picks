import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import apiClient from '../utils/axios';
import '../styles/Games.css';
import { formatCurrency } from '../utils/currency';
import { formatTime } from '../utils/time';

function Games({ user, updateUser }) {
  const [games, setGames] = useState([]);
  const [propBets, setPropBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(user?.balance || 0);
  const [message, setMessage] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [confidence, setConfidence] = useState('');
  const [amount, setAmount] = useState('');
  const [now, setNow] = useState(Date.now());
  const [userBets, setUserBets] = useState([]);
  const [isSubmittingBet, setIsSubmittingBet] = useState(false);
  const [propBetLoading, setPropBetLoading] = useState({});
  const [propBetAmounts, setPropBetAmounts] = useState({});
  const expandedBetRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const propDebounceTimersRef = useRef({});

  // Sync balance immediately when user prop changes
  useEffect(() => {
    if (user?.balance !== undefined) {
      setBalance(user.balance);
    }
  }, [user?.balance]);

  const confidenceMultipliers = {
    low: 1.2,
    medium: 1.5,
    high: 2.0
  };

  const fetchBalance = useCallback(async () => {
    try {
      const response = await apiClient.get('/users/profile');
      setBalance(response.data.balance);
    } catch (err) {
      // Balance will be fetched again on next update
    }
  }, []);

  const fetchUserBets = useCallback(async () => {
    try {
      const response = await apiClient.get('/bets');
      setUserBets(response.data || []);
    } catch (err) {
      setUserBets([]);
    }
  }, []);

  const fetchGames = useCallback(async () => {
    try {
      const response = await apiClient.get('/games', { timeout: 5000 });
      const sortedGames = (response.data || []).sort((a, b) => {
        return new Date(a.game_date) - new Date(b.game_date);
      });
      setGames(sortedGames);
    } catch (err) {
      // Don't clear games on error - keep showing what we had before
      setGames(prevGames => {
        return prevGames.length === 0 ? [] : prevGames;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPropBets = useCallback(async () => {
    try {
      const response = await apiClient.get('/prop-bets');
      setPropBets(response.data || []);
    } catch (err) {
      setPropBets([]);
    }
  }, []);

  useEffect(() => {
    // Create flag to prevent polling after unmount
    let isActive = true;
    let isPageVisible = true;
    
    // Capture refs at effect setup time to avoid stale reference warning
    const debounceTimer = debounceTimerRef;
    const propDebounceTimers = propDebounceTimersRef;
    
    // Track page visibility to pause polling when tab is not in focus
    const handleVisibilityChange = () => {
      isPageVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial fetch on mount
    const loadData = async () => {
      try {
        await Promise.all([
          fetchGames(),
          fetchPropBets(),
          fetchBalance(),
          fetchUserBets()
        ]);
      } catch (err) {
        // Initial load errors handled by individual fetch functions
      }
    };
    
    loadData();
    
    // Poll with staggered intervals for better performance
    // Games and prop bets every 30 seconds (stable data)
    const gamesInterval = setInterval(async () => {
      if (isActive && isPageVisible) {
        try {
          await Promise.all([fetchGames(), fetchPropBets()]);
        } catch (err) {
          // Polling error - will retry on next interval
        }
      }
    }, 30000);
    
    // Balance and bets every 15 seconds
    const userDataInterval = setInterval(async () => {
      if (isActive && isPageVisible) {
        try {
          await Promise.all([fetchBalance(), fetchUserBets()]);
        } catch (err) {
          // Polling error - will retry on next interval
        }
      }
    }, 15000);
    
    // Cleanup on unmount
    return () => {
      isActive = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(gamesInterval);
      clearInterval(userDataInterval);
      
      // Cleanup debounce timers using captured refs
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      const timers = propDebounceTimers.current;
      Object.values(timers || {}).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array - only run on mount

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(intervalId);
  }, []);

  const hasExistingBet = (gameId) => {
    return userBets.some(bet => bet.game_id === gameId && bet.games && !bet.bet_type?.startsWith('prop-'));
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
      setMessage('This prop bet is closed and no longer accepting picks');
      return;
    }

    const loadingKey = `${propId}-${choice}`;
    
    // Prevent double-clicking
    if (propBetLoading[loadingKey]) {
      return;
    }

    const amount = parseFloat(propBetAmounts[loadingKey]);
    
    if (!amount || amount <= 0) {
      setMessage('Please enter a bet amount greater than $0');
      return;
    }

    if (amount > balance) {
      const needed = amount - balance;
      setMessage(`Insufficient balance! You need ${formatCurrency(needed)} more to place this bet. Your current balance: ${formatCurrency(balance)}`);
      return;
    }

    // Store the original balance before optimistic update
    const originalBalance = balance;

    // Set loading state
    setPropBetLoading(prev => ({ ...prev, [loadingKey]: true }));

    // Set timeout failsafe to re-enable button after 10 seconds
    const timeoutId = setTimeout(() => {
      if (propBetLoading[loadingKey]) {
        setPropBetLoading(prev => ({ ...prev, [loadingKey]: false }));
        setBalance(originalBalance);
        if (updateUser) {
          updateUser({ ...user, balance: originalBalance });
        }
        setMessage('Request timed out - taking too long to respond. Check your connection and try again.');
        setTimeout(() => setMessage(''), 3000);
      }
    }, 10000);

    // CRITICAL: Optimistically subtract balance immediately to prevent double-betting
    const newBalance = balance - amount;
    setBalance(newBalance);
    if (updateUser) {
      updateUser({ ...user, balance: newBalance });
    }

    try {
      const response = await apiClient.post('/prop-bets/place', {
        propBetId: propId,
        choice,
        amount
      });
      
      clearTimeout(timeoutId);
      
      // Use the balance returned from the server
      const serverBalance = response.data.newBalance;
      setBalance(serverBalance);
      if (updateUser) {
        updateUser({ ...user, balance: serverBalance });
      }
      
      setMessage(`Pick placed successfully on ${choice.toUpperCase()}!`);
      setPropBetAmounts(prev => {
        const updated = { ...prev };
        delete updated[loadingKey];
        return updated;
      });
      
      // Refetch data to update UI
      fetchUserBets();
      fetchPropBets();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      clearTimeout(timeoutId);
      
      // Restore the original balance if bet fails
      setBalance(originalBalance);
      if (updateUser) {
        updateUser({ ...user, balance: originalBalance });
      }
      const errorMsg = err.response?.data?.error;
      if (errorMsg) {
        setMessage(`Error: ${errorMsg}`);
      } else if (err.message === 'Network Error') {
        setMessage('Connection issue - check your internet and try again');
      } else {
        setMessage('Failed to place pick - please try again or refresh the page');
      }
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setPropBetLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handlePropAmountChange = (propId, choice, value) => {
    const key = `${propId}-${choice}`;
    setPropBetAmounts(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear previous debounce timer for this prop bet
    if (propDebounceTimersRef.current[key]) {
      clearTimeout(propDebounceTimersRef.current[key]);
    }
    
    // Debounce validation by 300ms
    propDebounceTimersRef.current[key] = setTimeout(() => {
      const numeric = parseFloat(value);
      if (balance > 0 && !Number.isNaN(numeric) && numeric > balance) {
        setPropBetAmounts(prev => ({
          ...prev,
          [key]: balance.toString()
        }));
      }
    }, 300);
  };

  const handlePlaceGameBet = async (e) => {
    e.preventDefault();
    setMessage('');

    const selectedGame = games.find(g => g.id === parseInt(selectedGameId));
    if (!selectedGame) {
      setMessage('Please select a game to place your pick');
      return;
    }

    const startDate = buildDateFromParts(selectedGame);
    const countdown = getCountdown(startDate);
    const gameLocked = countdown.isPast || isClosedStatus(selectedGame.status);

    if (gameLocked) {
      if (countdown.isPast) {
        setMessage('Picking closed - this game has already started or finished');
      } else {
        setMessage(`Picking closed - ${selectedGame.status || 'game is no longer accepting bets'}`);
      }
      return;
    }

    if (hasExistingBet(selectedGame.id)) {
      setMessage('You have already placed a pick on this game - check your active picks below');
      return;
    }

    const betAmount = parseFloat(amount);

    if (!selectedTeam || !confidence || !betAmount) {
      if (!selectedTeam) {
        setMessage('Please select which team you think will win');
      } else if (!confidence) {
        setMessage('Please choose your confidence level (Low, Medium, or High)');
      } else {
        setMessage('Please enter a bet amount');
      }
      return;
    }

    if (betAmount > balance) {
      const needed = betAmount - balance;
      setMessage(`Insufficient balance! You need ${formatCurrency(needed)} more to place this bet. Your current balance: ${formatCurrency(balance)}`);
      return;
    }

    // Set timeout failsafe to re-enable button after 10 seconds
    const timeoutId = setTimeout(() => {
      if (isSubmittingBet) {
        setIsSubmittingBet(false);
        setMessage('Request timed out - taking too long to respond. Check your connection and try again.');
        setTimeout(() => setMessage(''), 3000);
      }
    }, 10000);

    try {
      setIsSubmittingBet(true);
      await apiClient.post('/bets', {
        gameId: selectedGame.id,
        selectedTeam,
        confidence,
        amount: betAmount,
        odds: confidenceMultipliers[confidence]
      });

      clearTimeout(timeoutId);
      setMessage(`Pick placed successfully on ${selectedTeam}!`);
      setSelectedGameId('');
      setSelectedTeam('');
      setConfidence('');
      setAmount('');
      fetchBalance();
      fetchUserBets();

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      clearTimeout(timeoutId);
      const errorMsg = err.response?.data?.error;
      if (errorMsg) {
        setMessage(`Error: ${errorMsg}`);
      } else if (err.message === 'Network Error') {
        setMessage('Connection issue - your bet was not placed. Check your internet and try again.');
      } else {
        setMessage('Failed to place pick - your bet was not placed. Please try again.');
      }
    } finally {
      setIsSubmittingBet(false);
    }
  };

  const activePropBets = useMemo(() => propBets.filter(pb => pb.status === 'active'), [propBets]);

  const selectedGame = selectedGameId ? games.find(g => g.id === parseInt(selectedGameId)) : null;
  const selectedGameLocked = selectedGame ? (getCountdown(buildDateFromParts(selectedGame)).isPast || isClosedStatus(selectedGame.status)) : false;
  const hasExistingBetOnSelectedGame = selectedGame ? hasExistingBet(selectedGame.id) : false;

  return (
    <div className="games-page">
      <div className="page-header">
        <h2>Place Your Picks</h2>
        <p className="page-subtitle">Select a game and make your predictions</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') || message.includes('Insufficient') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="filter-buttons">
          <button 
            className={`filter-btn ${teamFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTeamFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${teamFilter === 'boys' ? 'active' : ''}`}
            onClick={() => setTeamFilter('boys')}
          >
            Boys
          </button>
          <button 
            className={`filter-btn ${teamFilter === 'girls' ? 'active' : ''}`}
            onClick={() => setTeamFilter('girls')}
          >
            Girls
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
                  const isBoys = prop.team_type?.toLowerCase().includes('boys');
                  const isGirls = prop.team_type?.toLowerCase().includes('girls');

                  return (
                  <div key={`prop-${prop.id}`} className={`prop-card ${isBoys ? 'boys-prop' : isGirls ? 'girls-prop' : ''}`}>
                    <div className="prop-header">
                      <h3>{prop.title}</h3>
                      <span className={`prop-category ${prop.team_type?.toLowerCase().includes('boys') ? 'boys' : prop.team_type?.toLowerCase().includes('girls') ? 'girls' : ''}`}>
                        {prop.team_type}
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

                    <div className={`prop-betting-section ${prop.options && prop.options.length === 1 ? 'single-option' : ''}`}>
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
                                disabled={propLocked || propBetLoading[`${prop.id}-${optionKey}`]}
                                style={{
                                  opacity: (propLocked || propBetLoading[`${prop.id}-${optionKey}`]) ? 0.6 : 1,
                                  cursor: (propLocked || propBetLoading[`${prop.id}-${optionKey}`]) ? 'not-allowed' : 'pointer'
                                }}
                              >
                                {propBetLoading[`${prop.id}-${optionKey}`] ? 'Placing...' : (propLocked ? 'Closed' : `Bet ${option}`)}
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
                              placeholder="Pick amount"
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
                              disabled={propLocked || propBetLoading[`${prop.id}-yes`]}
                              style={{
                                opacity: (propLocked || propBetLoading[`${prop.id}-yes`]) ? 0.6 : 1,
                                cursor: (propLocked || propBetLoading[`${prop.id}-yes`]) ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {propBetLoading[`${prop.id}-yes`] ? 'Placing...' : (propLocked ? 'Closed' : 'Pick YES')}
                            </button>
                          </div>

                          <div className="prop-option-bet no">
                            <div className="option-header">
                              <span className="option-label">NO</span>
                              <span className="option-odds">{prop.no_odds}x</span>
                            </div>
                            <input
                              type="number"
                              placeholder="Pick amount"
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
                              disabled={propLocked || propBetLoading[`${prop.id}-no`]}
                              style={{
                                opacity: (propLocked || propBetLoading[`${prop.id}-no`]) ? 0.6 : 1,
                                cursor: (propLocked || propBetLoading[`${prop.id}-no`]) ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {propBetLoading[`${prop.id}-no`] ? 'Placing...' : (propLocked ? 'Closed' : 'Pick NO')}
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

                {/* Render Games with Card-based Expandable UI */}
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
                    const isSelected = selectedGameId === game.id.toString();

                    return (
                      <React.Fragment key={game.id}>
                        <button
                          type="button"
                          className={`game-card-btn ${isSelected ? 'active' : ''} ${gameLocked ? 'locked' : ''} ${game.team_type?.toLowerCase().includes('boys') ? 'boys-game' : game.team_type?.toLowerCase().includes('girls') ? 'girls-game' : ''}`}
                          onClick={() => {
                            if (!gameLocked) {
                              const willBeSelected = !isSelected;
                              setSelectedGameId(isSelected ? '' : game.id.toString());
                              if (!isSelected) {
                                setSelectedTeam('');
                                setConfidence('');
                                setAmount('');
                                // Scroll to expanded section after state updates
                                setTimeout(() => {
                                  if (expandedBetRef.current && willBeSelected) {
                                    expandedBetRef.current.scrollIntoView({ 
                                      behavior: 'smooth', 
                                      block: 'center'
                                    });
                                  }
                                }, 100);
                              }
                            }
                          }}
                          disabled={gameLocked}
                        >
                          <div className="game-card-header">
                            <span className={`game-badge ${game.team_type?.toLowerCase().includes('boys') ? 'boys' : game.team_type?.toLowerCase().includes('girls') ? 'girls' : ''}`}>
                              {game.team_type?.toLowerCase().includes('boys') ? '🏀 ' : game.team_type?.toLowerCase().includes('girls') ? '🏀 ' : ''}{game.team_type}
                            </span>
                            {countdown && (
                              <span className={`countdown-chip ${countdown.isPast ? 'countdown-closed' : ''}`}>
                                {countdown.isPast ? 'Closed' : countdown.label}
                              </span>
                            )}
                          </div>
                          <div className="game-card-matchup">
                            <div className="game-card-team">
                              <span className="team-name-text">{game.home_team}</span>
                              <span className="team-tag home">Home</span>
                            </div>
                            <div className="game-card-vs">vs</div>
                            <div className="game-card-team">
                              <span className="team-name-text">{game.away_team}</span>
                              <span className="team-tag away">Away</span>
                            </div>
                          </div>
                          <div className="game-card-details">
                            <span className="game-card-date">{formatDate(game.game_date)}</span>
                            <span className="game-card-time">{formatTime(game.game_time)}</span>
                          </div>
                          {game.location && (
                            <div className="game-card-location">{game.location}</div>
                          )}
                        </button>
                        
                        {isSelected && selectedGame && (
                          <div ref={expandedBetRef} className="bet-details-expanded">
                            <form onSubmit={handlePlaceGameBet} className="expanded-bet-form">
                              <div className="form-group">
                                <label>Step 1: Who Will Win?</label>
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
                                <label>Step 2: How Sure Are You?</label>
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
                                  <label htmlFor="amount">Pick Amount</label>
                                  <div style={{padding: '12px', background: 'rgba(102, 187, 106, 0.15)', border: '1px solid rgba(102, 187, 106, 0.4)', borderRadius: '8px', textAlign: 'center', color: '#66bb6a', fontWeight: 'bold'}}>
                                    Pick Already Placed
                                  </div>
                                </div>
                              ) : selectedGameLocked ? (
                                <div className="form-group">
                                  <label htmlFor="amount">Pick Amount</label>
                                  <div style={{padding: '12px', background: 'rgba(239, 83, 80, 0.15)', border: '1px solid rgba(239, 83, 80, 0.4)', borderRadius: '8px', textAlign: 'center', color: '#ef5350', fontWeight: 'bold'}}>
                                    Picking Closed
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="form-group">
                                    <label htmlFor="amount">Step 3: How Much to Stake?</label>
                                    <p className="field-help">Enter how many Valiant Bucks you want to stake - Your balance: <strong>{formatCurrency(balance)}</strong></p>
                                    <div className="amount-input-wrapper">
                                      <input
                                        id="amount"
                                        type="number"
                                        step="1"
                                        min={balance > 0 ? 1 : 0}
                                        value={amount}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setAmount(val);
                                          
                                          // Clear previous debounce timer
                                          if (debounceTimerRef.current) {
                                            clearTimeout(debounceTimerRef.current);
                                          }
                                          
                                          // Debounce validation by 300ms
                                          debounceTimerRef.current = setTimeout(() => {
                                            const numeric = parseFloat(val);
                                            if (balance > 0 && !Number.isNaN(numeric) && numeric > balance) {
                                              setAmount(balance.toString());
                                            }
                                          }, 300);
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
                                    {amount && selectedTeam && confidence && parseFloat(amount) > 0 && (
                                      <div className="bet-slip-preview">
                                        <div className="bet-slip-header">
                                          <span className="bet-slip-title">Your Bet Slip</span>
                                          <span className="bet-slip-team">{selectedTeam}</span>
                                        </div>
                                        <div className="bet-slip-body">
                                          <div className="bet-slip-row">
                                            <span className="bet-slip-label">Amount Wagered</span>
                                            <span className="bet-slip-value">{formatCurrency(parseFloat(amount))}</span>
                                          </div>
                                          <div className="bet-slip-row">
                                            <span className="bet-slip-label">Confidence Multiplier</span>
                                            <span className="bet-slip-value confidence-value">
                                              <span className={`confidence-badge ${confidence}`}>{confidence.toUpperCase()}</span>
                                              <span>{confidenceMultipliers[confidence]}x</span>
                                            </span>
                                          </div>
                                          {/* Show bonus info for all game types */}
                                          {selectedGame?.team_type?.toLowerCase().includes('girls') ? (
                                            <div className="bet-slip-row bonus-row">
                                              <span className="bet-slip-label">💗 Girls Game Bonus</span>
                                              <span className="bet-slip-value bonus-value">+10% to +25%</span>
                                            </div>
                                          ) : selectedGame?.team_type?.toLowerCase().includes('boys') ? (
                                            <div className="bet-slip-row bonus-row">
                                              <span className="bet-slip-label">🏀 Boys Game Bonus</span>
                                              <span className="bet-slip-value bonus-value">+5% to +15%</span>
                                            </div>
                                          ) : (
                                            <div className="bet-slip-row bonus-row">
                                              <span className="bet-slip-label">⭐ Betting Bonus</span>
                                              <span className="bet-slip-value bonus-value">+2% to +12%</span>
                                            </div>
                                          )}
                                          <div className="bet-slip-divider"></div>
                                          <div className="bet-slip-row payout">
                                            <span className="bet-slip-label">Base Payout</span>
                                            <span className="bet-slip-value payout-value">{formatCurrency(parseFloat(amount) * confidenceMultipliers[confidence])}</span>
                                          </div>
                                          {/* Show potential bonus payout for all game types */}
                                          {selectedGame?.team_type?.toLowerCase().includes('girls') ? (
                                            <div className="bet-slip-row bonus-payout">
                                              <span className="bet-slip-label">💗 With Girls Bonus</span>
                                              <span className="bet-slip-value bonus-payout-value">Up to {formatCurrency(parseFloat(amount) * confidenceMultipliers[confidence] * 1.25)}</span>
                                            </div>
                                          ) : selectedGame?.team_type?.toLowerCase().includes('boys') ? (
                                            <div className="bet-slip-row bonus-payout">
                                              <span className="bet-slip-label">🏀 With Boys Bonus</span>
                                              <span className="bet-slip-value bonus-payout-value">Up to {formatCurrency(parseFloat(amount) * confidenceMultipliers[confidence] * 1.15)}</span>
                                            </div>
                                          ) : (
                                            <div className="bet-slip-row bonus-payout">
                                              <span className="bet-slip-label">⭐ With Streak Bonus</span>
                                              <span className="bet-slip-value bonus-payout-value">Up to {formatCurrency(parseFloat(amount) * confidenceMultipliers[confidence] * 1.12)}</span>
                                            </div>
                                          )}
                                          <div className="bet-slip-row profit">
                                            <span className="bet-slip-label">Profit if Won</span>
                                            <span className="bet-slip-value profit-value">+{formatCurrency((parseFloat(amount) * confidenceMultipliers[confidence]) - parseFloat(amount))}</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    disabled={!selectedTeam || !confidence || !amount || balance <= 0 || selectedGameLocked || isSubmittingBet}
                                  >
                                    {isSubmittingBet ? 'Placing...' : `Lock In Pick for ${formatCurrency(parseFloat(amount || 0))}`}
                                  </button>
                                </>
                              )}
                            </form>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </>
      )}

      <div className="info-accordions">
        <details className="info-accordion">
          <summary className="info-summary">
            <span className="info-title">Quick Guide</span>
            <span className="info-meta">How picks work</span>
          </summary>
          <div className="info-content">
            <ul className="info-list">
              <li><strong>Game picks:</strong> Choose the winner and a confidence level (Low 1.2x, Medium 1.5x, High 2.0x).</li>
              <li><strong>Prop bets:</strong> YES/NO or custom options with their own odds.</li>
              <li><strong>One pick per game.</strong></li>
            </ul>
          </div>
        </details>

        <details className="info-accordion">
          <summary className="info-summary">
            <span className="info-title">Bonus Payouts</span>
            <span className="info-meta">Applied to winnings</span>
          </summary>
          <div className="info-content">
            <div className="bonus-list">
              <div className="bonus-row">
                <span className="bonus-row-icon">💗</span>
                <span className="bonus-row-label">Girls Games</span>
                <span className="bonus-row-range">+10% to +25%</span>
              </div>
              <div className="bonus-row">
                <span className="bonus-row-icon">🏀</span>
                <span className="bonus-row-label">Boys Games</span>
                <span className="bonus-row-range">+5% to +15%</span>
              </div>
              <div className="bonus-row">
                <span className="bonus-row-icon">🔥</span>
                <span className="bonus-row-label">Streak Bonus</span>
                <span className="bonus-row-range">+3% to +5%</span>
              </div>
              <div className="bonus-row">
                <span className="bonus-row-icon">📅</span>
                <span className="bonus-row-label">Weekend</span>
                <span className="bonus-row-range">+5% Extra</span>
              </div>
            </div>
            <p className="bonus-helper">Tip: streaks and weekend picks add extra boosts.</p>
          </div>
        </details>
      </div>
    </div>
  );
}

export default Games;
