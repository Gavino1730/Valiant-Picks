import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import '../styles/Games.css';
import { formatCurrency } from '../utils/currency';

function Games() {
  const [games, setGames] = useState([]);
  const [propBets, setPropBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('games');
  const [balance, setBalance] = useState(0);
  const [propBetAmounts, setPropBetAmounts] = useState({});
  const [message, setMessage] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');

  useEffect(() => {
    fetchGames();
    fetchPropBets();
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await apiClient.get('/users/profile');
      setBalance(response.data.balance);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  useEffect(() => {
    fetchGames();
    fetchPropBets();
  }, []);

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handlePlacePropBet = async (propId, choice) => {
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
      
      setMessage(`Bet placed successfully on ${choice.toUpperCase()}!`);
      setPropBetAmounts({});
      fetchBalance();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to place bet');
    }
  };

  const handlePropAmountChange = (propId, choice, value) => {
    setPropBetAmounts(prev => ({
      ...prev,
      [`${propId}-${choice}`]: value
    }));
  };

  const activePropBets = propBets.filter(pb => pb.status === 'active');

  return (
    <div className="games-page">
      <div className="page-header">
        <h2>Available Bets</h2>
        <p className="page-subtitle">Browse all upcoming games and prop bets</p>
        <p className="balance-display">Your Balance: {formatCurrency(balance)}</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') || message.includes('Insufficient') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'games' ? 'active' : ''}`}
          onClick={() => setActiveTab('games')}
        >
          Games ({games.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'props' ? 'active' : ''}`}
          onClick={() => setActiveTab('props')}
        >
          Prop Bets ({activePropBets.length})
        </button>
      </div>

      {activeTab === 'games' && (
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
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {activeTab === 'games' && (
            <div className="games-grid">
              {games.length === 0 ? (
                <div className="empty-state">
                  <p>No games available at the moment</p>
                </div>
              ) : (
                games
                  .filter(game => {
                    if (teamFilter === 'all') return true;
                    if (teamFilter === 'boys') return game.team_type?.toLowerCase().includes('boys');
                    if (teamFilter === 'girls') return game.team_type?.toLowerCase().includes('girls');
                    return true;
                  })
                  .map(game => (
                  <div key={game.id} className="game-card-display">
                    <div className="game-header">
                      <span className="game-sport">{game.team_type}</span>
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
                          <span className="detail-text">{game.game_time}</span>
                        </div>
                      )}
                      {game.location && (
                        <div className="detail-item">
                          <span className="detail-icon">📍</span>
                          <span className="detail-text">{game.location}</span>
                        </div>
                      )}
                    </div>

                    {game.notes && (
                      <div className="game-notes">
                        <p>{game.notes}</p>
                      </div>
                    )}

                    <div className="betting-info">
                      <div className="confidence-options">
                        <div className="confidence-option">
                          <span className="label">Low</span>
                          <span className="multiplier">1.2x</span>
                        </div>
                        <div className="confidence-option">
                          <span className="label">Medium</span>
                          <span className="multiplier">1.5x</span>
                        </div>
                        <div className="confidence-option">
                          <span className="label">High</span>
                          <span className="multiplier">2.0x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'props' && (
            <div className="props-grid">
              {activePropBets.length === 0 ? (
                <div className="empty-state">
                  <p>No prop bets available at the moment</p>
                </div>
              ) : (
                activePropBets.map(prop => (
                  <div key={prop.id} className="prop-card">
                    <div className="prop-header">
                      <h3>{prop.title}</h3>
                      <span className="prop-category">{prop.team_type}</span>
                    </div>
                    
                    {prop.description && (
                      <p className="prop-description">{prop.description}</p>
                    )}

                    <div className="prop-betting-section">
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
                        />
                        <button
                          className="prop-bet-btn yes-btn"
                          onClick={() => handlePlacePropBet(prop.id, 'yes')}
                        >
                          Bet YES
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
                        />
                        <button
                          className="prop-bet-btn no-btn"
                          onClick={() => handlePlacePropBet(prop.id, 'no')}
                        >
                          Bet NO
                        </button>
                      </div>
                    </div>

                    {prop.expires_at && (
                      <div className="prop-expires">
                        Expires: {new Date(prop.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Games;
