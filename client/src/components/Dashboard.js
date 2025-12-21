import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import '../styles/Dashboard.css';
import { formatCurrency } from '../utils/currency';

function Dashboard({ user }) {
  const [balance, setBalance] = useState(user?.balance || 0);
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [confidence, setConfidence] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(true);

  const confidenceMultipliers = {
    low: 1.2,
    medium: 1.5,
    high: 2.0
  };

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await apiClient.get('/games');
        setGames(response.data || []);
      } catch (err) {
        console.error('Error fetching games:', err);
        setGames([]);
      } finally {
        setGamesLoading(false);
      }
    };

    fetchGames();
  }, []);

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

      const betData = {
        gameId: selectedGame.id,
        betType,
        selectedTeam: selectedTeam || null,
        amount: parseFloat(amount),
        odds: parseFloat(odds),
      };

      await apiClient.post('/bets', betData);

      // Refresh user balance from server
      const userResponse = await apiClient.get('/users/profile');
      setBalance(userResponse.data.balance);

      setMessage(`Bet placed successfully on ${selectedGame.home_team}! Potential win: ${formatCurrency(amount * odds)}`);
      setSelectedGameId('');
      setBetType('moneyline');
      setSelectedTeam('');
      setAmount('');
      setOdds('');
    } caselectedTeam,
        confidence,
        amount: parseFloat(amount),
        odds: confidenceMultipliers[confidence],
      };

      await apiClient.post('/bets', betData);

      // Refresh user balance from server
      const userResponse = await apiClient.get('/users/profile');
      setBalance(userResponse.data.balance);

      setMessage(`Bet placed successfully on ${selectedTeam}! Potential win: ${formatCurrency(amount * confidenceMultipliers[confidence])}`);
      setSelectedGameId('');
      setSelectedTeam('');
      setConfidence('');
      setAmountv className={`alert ${message.includes('Error') || message.includes('error') ? 'alert-error' : 'alert-success'}`}>
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
                  <div clWhich team will win?</label>
                  <div className="team-selection">
                    <button
                      type="button"
                      className={`team-btn ${selectedTeam === selectedGame.home_team ? 'active' : ''}`}
                      onClick={() => setSelectedTeam(selectedGame.home_team)}
                    >
                      {selectedGame.home_team}
                    </button>
                    {selectedGame.away_team && (
                      <button
                        type="button"
                        className={`team-btn ${selectedTeam === selectedGame.away_team ? 'active' : ''}`}
                        onClick={() => setSelectedTeam(selectedGame.away_team)}
                      >
                        {selectedGame.away_team}
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>How confident are you?</label>
                  <div className="confidence-selection">
                    <button
                      type="button"
                      className={`confidence-btn low ${confidence === 'low' ? 'active' : ''}`}
                      onClick={() => setConfidence('low')}
                    >
                      <span className="confidence-label">Low</span>
                      <span className="confidence-multiplier">1.2x</span>
                    </button>
                    <button
                      type="button"
                      className={`confidence-btn medium ${confidence === 'medium' ? 'active' : ''}`}
                      onClick={() => setConfidence('medium')}
                    >
                      <span className="confidence-label">Medium</span>
                      <span className="confidence-multiplier">1.5x</span>
                    </button>
                    <button
                      type="button"
                      className={`confidence-btn high ${confidence === 'high' ? 'active' : ''}`}
                      onClick={() => setConfidence('high')}
                    >
                      <span className="confidence-label">High</span>
                      <span className="confidence-multiplier">2.0x</span>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="amount">Bet Amount (Valiant Bucks)</label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter bet amount"
                    required
                  />
                </div>

                {confidence && amount && (
                  <div className="potential-win">
                    Potential win: {formatCurrency(parseFloat(amount) * confidenceMultipliers[confidence])} Valiant Bucks
                  </div>
                )}

                <button type="submit" className="btn" disabled={loading || !selectedTeam || !confidence || !amount
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
