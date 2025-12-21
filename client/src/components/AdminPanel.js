import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminTeams from './AdminTeams';
import '../styles/AdminPanel.css';
import { formatCurrency } from '../utils/currency';

function AdminPanel({ apiUrl }) {
  const [allBets, setAllBets] = useState([]);
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('games');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newBalance, setNewBalance] = useState('');
  
  // Game creation form
  const [gameForm, setGameForm] = useState({
    teamType: 'Boys Basketball',
    homeTeam: '',
    awayTeam: '',
    gameDate: '',
    gameTime: '',
    location: '',
    winningOdds: '',
    losingOdds: '',
    spread: '',
    spreadOdds: '',
    overUnder: '',
    overOdds: '',
    underOdds: '',
    notes: ''
  });

  useEffect(() => {
    fetchAllBets();
    fetchUsers();
    fetchGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllBets = async () => {
    try {
      const response = await axios.get(`${apiUrl}/bets/all`);
      setAllBets(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch bets');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${apiUrl}/users`);
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch users: ' + (err.response?.data?.error || err.message));
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchGames = async () => {
    try {
      const response = await axios.get(`${apiUrl}/games`);
      setGames(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch games: ' + (err.response?.data?.error || err.message));
      console.error('Failed to fetch games:', err);
    }
  };

  const handleCreateGame = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${apiUrl}/games`, gameForm, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      alert('Game created successfully!');
      setGameForm({
        teamType: 'Boys Basketball',
        homeTeam: '',
        awayTeam: '',
        gameDate: '',
        gameTime: '',
        location: '',
        winningOdds: '',
        losingOdds: '',
        spread: '',
        spreadOdds: '',
        overUnder: '',
        overOdds: '',
        underOdds: '',
        notes: ''
      });
      fetchGames();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create game');
    }
  };

  const handleGameFormChange = (e) => {
    const { name, value } = e.target;
    setGameForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateBet = async (betId, status, outcome) => {
    try {
      await axios.put(`${apiUrl}/bets/${betId}`, { status, outcome });
      fetchAllBets();
      alert('Bet updated successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update bet');
    }
  };

  const handleUpdateUserBalance = async (userId) => {
    try {
      const balance = parseFloat(newBalance);
      if (isNaN(balance)) {
        alert('Invalid balance amount');
        return;
      }
      await axios.put(`${apiUrl}/users/${userId}/balance`, { balance });
      fetchUsers();
      setSelectedUser(null);
      setNewBalance('');
      alert('User balance updated!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update balance');
    }
  };

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      
      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button className={`tab-btn ${tab === 'games' ? 'active' : ''}`} onClick={() => setTab('games')}>
          Manage Games
        </button>
        <button className={`tab-btn ${tab === 'bets' ? 'active' : ''}`} onClick={() => setTab('bets')}>
          Manage Bets
        </button>
        <button className={`tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          Manage Users
        </button>
        <button className={`tab-btn ${tab === 'teams' ? 'active' : ''}`} onClick={() => setTab('teams')}>
          Manage Teams
        </button>
      </div>

      {tab === 'games' && (
        <div className="admin-section">
          <h3>Create New Game</h3>
          <form onSubmit={handleCreateGame} className="game-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="teamType">Sport Type</label>
                <select 
                  id="teamType" 
                  name="teamType" 
                  value={gameForm.teamType} 
                  onChange={handleGameFormChange}
                  required
                >
                  <option value="Boys Basketball">Boys Basketball</option>
                  <option value="Girls Basketball">Girls Basketball</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="homeTeam">Home Team *</label>
                <input 
                  id="homeTeam" 
                  type="text" 
                  name="homeTeam" 
                  value={gameForm.homeTeam} 
                  onChange={handleGameFormChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="awayTeam">Away Team</label>
                <input 
                  id="awayTeam" 
                  type="text" 
                  name="awayTeam" 
                  value={gameForm.awayTeam} 
                  onChange={handleGameFormChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gameDate">Game Date *</label>
                <input 
                  id="gameDate" 
                  type="date" 
                  name="gameDate" 
                  value={gameForm.gameDate} 
                  onChange={handleGameFormChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="gameTime">Game Time</label>
                <input 
                  id="gameTime" 
                  type="time" 
                  name="gameTime" 
                  value={gameForm.gameTime} 
                  onChange={handleGameFormChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input 
                  id="location" 
                  type="text" 
                  name="location" 
                  value={gameForm.location} 
                  onChange={handleGameFormChange}
                  placeholder="e.g., New York, NY"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="winningOdds">Winning Odds *</label>
                <input 
                  id="winningOdds" 
                  type="number" 
                  step="0.01" 
                  name="winningOdds" 
                  value={gameForm.winningOdds} 
                  onChange={handleGameFormChange}
                  placeholder="e.g., 1.95"
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="losingOdds">Losing Odds *</label>
                <input 
                  id="losingOdds" 
                  type="number" 
                  step="0.01" 
                  name="losingOdds" 
                  value={gameForm.losingOdds} 
                  onChange={handleGameFormChange}
                  placeholder="e.g., 1.95"
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="spread">Point Spread</label>
                <input 
                  id="spread" 
                  type="number" 
                  step="0.5" 
                  name="spread" 
                  value={gameForm.spread} 
                  onChange={handleGameFormChange}
                  placeholder="e.g., -3.5"
                />
              </div>
              <div className="form-group">
                <label htmlFor="spreadOdds">Spread Odds</label>
                <input 
                  id="spreadOdds" 
                  type="number" 
                  step="0.01" 
                  name="spreadOdds" 
                  value={gameForm.spreadOdds} 
                  onChange={handleGameFormChange}
                  placeholder="e.g., 1.91"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="overUnder">Over/Under Total</label>
                <input 
                  id="overUnder" 
                  type="number" 
                  step="0.5" 
                  name="overUnder" 
                  value={gameForm.overUnder} 
                  onChange={handleGameFormChange}
                  placeholder="e.g., 45.5"
                />
              </div>
              <div className="form-group">
                <label htmlFor="overOdds">Over Odds</label>
                <input 
                  id="overOdds" 
                  type="number" 
                  step="0.01" 
                  name="overOdds" 
                  value={gameForm.overOdds} 
                  onChange={handleGameFormChange}
                  placeholder="e.g., 1.91"
                />
              </div>
              <div className="form-group">
                <label htmlFor="underOdds">Under Odds</label>
                <input 
                  id="underOdds" 
                  type="number" 
                  step="0.01" 
                  name="underOdds" 
                  value={gameForm.underOdds} 
                  onChange={handleGameFormChange}
                  placeholder="e.g., 1.91"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="notes">Notes</label>
              <textarea 
                id="notes" 
                name="notes" 
                value={gameForm.notes} 
                onChange={handleGameFormChange}
                placeholder="Add any additional notes about this game"
                rows="3"
              />
            </div>

            <button type="submit" className="btn">Create Game</button>
          </form>

          <h3>Active Games</h3>
          {games.length === 0 ? (
            <p>No games created yet</p>
          ) : (
            <div className="games-list">
              {games.map(game => (
                <div key={game.id} className="game-card">
                  <h4>{game.home_team} {game.away_team ? `vs ${game.away_team}` : ''}</h4>
                  <p><strong>Sport:</strong> {game.team_type}</p>
                  <p><strong>Date:</strong> {game.game_date} {game.game_time ? `at ${game.game_time}` : ''}</p>
                  <p><strong>Location:</strong> {game.location || 'N/A'}</p>
                  <p><strong>Moneyline Odds:</strong> {game.winning_odds}x / {game.losing_odds}x</p>
                  {game.spread && <p><strong>Spread:</strong> {game.spread} ({game.spread_odds}x)</p>}
                  {game.over_under && <p><strong>Over/Under:</strong> {game.over_under} (O: {game.over_odds}x / U: {game.under_odds}x)</p>}
                  {game.notes && <p><strong>Notes:</strong> {game.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'bets' && (
        <>
          <div className="stats">
            <div className="stat-card">
              <h4>Total Bets</h4>
              <p>{allBets.length}</p>
            </div>
            <div className="stat-card">
              <h4>Pending</h4>
              <p>{allBets.filter(b => b.status === 'pending').length}</p>
            </div>
            <div className="stat-card">
              <h4>Won</h4>
              <p>{allBets.filter(b => b.outcome === 'won').length}</p>
            </div>
            <div className="stat-card">
              <h4>Lost</h4>
              <p>{allBets.filter(b => b.outcome === 'lost').length}</p>
            </div>
          </div>

          <div className="card">
            <h3>All Bets</h3>
            <div className="bets-table-wrapper">
              <table className="bets-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User ID</th>
                    <th>Amount</th>
                    <th>Odds</th>
                    <th>Status</th>
                    <th>Outcome</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allBets.map(bet => (
                    <tr key={bet.id}>
                      <td>{bet.id}</td>
                      <td>{bet.user_id}</td>
                      <td>{formatCurrency(bet.amount)}</td>
                      <td>{bet.odds}x</td>
                      <td>{bet.status}</td>
                      <td>
                        <select
                          value={bet.outcome || ''}
                          onChange={(e) => handleUpdateBet(bet.id, bet.status, e.target.value || null)}
                        >
                          <option value="">Select outcome</option>
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                        </select>
                      </td>
                      <td>
                        <button onClick={() => handleUpdateBet(bet.id, 'resolved', bet.outcome)}>
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'users' && (
        <div className="card">
          <h3>All Users</h3>
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Balance</th>
                  <th>Admin</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>{formatCurrency(u.balance)}</td>
                    <td>{u.is_admin ? 'Yes' : 'No'}</td>
                    <td>
                      <button onClick={() => {
                        setSelectedUser(u.id);
                        setNewBalance(u.balance.toString());
                      }}>
                        Edit Balance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedUser && (
            <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Update Balance for User {selectedUser}</h3>
                <div className="form-group">
                  <label htmlFor="balance">New Balance</label>
                  <input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                  />
                </div>
                <div className="modal-buttons">
                  <button className="btn" onClick={() => handleUpdateUserBalance(selectedUser)}>
                    Update
                  </button>
                  <button className="btn btn-secondary" onClick={() => setSelectedUser(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'teams' && (
        <AdminTeams />
      )}
    </div>
  );
}

export default AdminPanel;
