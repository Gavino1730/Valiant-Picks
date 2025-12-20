import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';

function Dashboard({ user, apiUrl }) {
  const [balance, setBalance] = useState(user?.balance || 0);
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [betType, setBetType] = useState('moneyline');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [amount, setAmount] = useState('');
  const [odds, setOdds] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await axios.get(`${apiUrl}/games`);
        setGames(response.data || []);
      } catch (err) {
        console.error('Error fetching games:', err);
        setGames([]);
      } finally {
        setGamesLoading(false);
      }
    };

    fetchGames();
  }, [apiUrl]);

  const selectedGame = selectedGameId ? games.find(g => g.id === parseInt(selectedGameId)) : null;

  const getAvailableOdds = () => {
    if (!selectedGame) return {};
    
    const oddsMap = {
      moneyline: selectedGame.winning_odds,
      spread: selectedGame.spread_odds,
      'over-under': selectedGame.over_odds,
    };
    
    return oddsMap;
  };

  const handleBetTypeChange = (type) => {
    setBetType(type);
    setSelectedTeam('');
    setOdds('');
  };

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

      const betData = {
        gameId: selectedGame.id,
        betType,
        selectedTeam: selectedTeam || null,
        amount: parseFloat(amount),
        odds: parseFloat(odds),
      };

      await axios.post(`${apiUrl}/bets`, betData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setMessage(`Bet placed successfully on ${selectedGame.home_team}! Potential win: ${(amount * odds).toFixed(2)} Valiant Bucks`);
      setSelectedGameId('');
      setBetType('moneyline');
      setSelectedTeam('');
      setAmount('');
      setOdds('');
      setBalance(balance - parseFloat(amount));
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error placing bet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="card">
        <h2>Welcome back!</h2>
        <p>Your current balance: <span className="balance">{balance.toFixed(2)} Valiant Bucks</span></p>
      </div>

      <div className="card">
        <h3>Place a Bet</h3>
        {message && (
          <div className={`alert ${message.includes('Error') || message.includes('error') ? 'alert-error' : 'alert-success'}`}>
            {message}
          </div>
        )}

        {gamesLoading ? (
          <p>Loading games...</p>
        ) : games.length === 0 ? (
          <p>No games available at the moment. Please check back later.</p>
        ) : (
          <form onSubmit={handlePlaceBet}>
            <div className="form-group">
              <label htmlFor="game">Select a Game</label>
              <select
                id="game"
                value={selectedGameId}
                onChange={(e) => {
                  setSelectedGameId(e.target.value);
                  setSelectedTeam('');
                  setOdds('');
                }}
                required
              >
                <option value="">Select a game...</option>
                {games.map(game => (
                  <option key={game.id} value={game.id}>
                    {game.home_team} {game.away_team ? `vs ${game.away_team}` : ''} - {game.game_date}
                  </option>
                ))}
              </select>
            </div>

            {selectedGame && (
              <>
                <div className="form-group">
                  <label>Bet Type</label>
                  <div className="bet-type-buttons">
                    <button
                      type="button"
                      className={`bet-type-btn ${betType === 'moneyline' ? 'active' : ''}`}
                      onClick={() => handleBetTypeChange('moneyline')}
                    >
                      Moneyline ({selectedGame.winning_odds}x)
                    </button>
                    {selectedGame.spread_odds && (
                      <button
                        type="button"
                        className={`bet-type-btn ${betType === 'spread' ? 'active' : ''}`}
                        onClick={() => handleBetTypeChange('spread')}
                      >
                        Spread ({selectedGame.spread_odds}x)
                      </button>
                    )}
                    {selectedGame.over_odds && (
                      <button
                        type="button"
                        className={`bet-type-btn ${betType === 'over-under' ? 'active' : ''}`}
                        onClick={() => handleBetTypeChange('over-under')}
                      >
                        Over/Under ({selectedGame.over_odds}x)
                      </button>
                    )}
                  </div>
                </div>

                {betType === 'moneyline' && (
                  <div className="form-group">
                    <label>Select Team to Win</label>
                    <div className="team-selection">
                      <button
                        type="button"
                        className={`team-btn ${selectedTeam === selectedGame.home_team ? 'active' : ''}`}
                        onClick={() => setSelectedTeam(selectedGame.home_team)}
                      >
                        {selectedGame.home_team} ({selectedGame.winning_odds}x)
                      </button>
                      {selectedGame.away_team && (
                        <button
                          type="button"
                          className={`team-btn ${selectedTeam === selectedGame.away_team ? 'active' : ''}`}
                          onClick={() => setSelectedTeam(selectedGame.away_team)}
                        >
                          {selectedGame.away_team} ({selectedGame.winning_odds}x)
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="odds">Odds (Auto-filled)</label>
                  <input
                    id="odds"
                    type="number"
                    step="0.01"
                    value={odds}
                    onChange={(e) => setOdds(e.target.value)}
                    placeholder={getAvailableOdds()[betType] || ''}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="amount">Bet Amount (Valiant Bucks)</label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                {odds && amount && (
                  <div className="potential-win">
                    Potential win: {(parseFloat(amount) * parseFloat(odds)).toFixed(2)} Valiant Bucks
                  </div>
                )}

                <button type="submit" className="btn" disabled={loading || !selectedTeam || !amount || !odds}>
                  {loading ? 'Processing...' : 'Place Bet'}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
