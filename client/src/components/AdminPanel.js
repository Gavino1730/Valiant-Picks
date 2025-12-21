import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import AdminTeams from './AdminTeams';
import '../styles/AdminPanel.css';
import { formatCurrency } from '../utils/currency';

function AdminPanel() {
  const [allBets, setAllBets] = useState([]);
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [propBets, setPropBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('games');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newBalance, setNewBalance] = useState('');
  const [editingGame, setEditingGame] = useState(null);
  const [gameStatusModal, setGameStatusModal] = useState(null);
  const [gameFilter, setGameFilter] = useState('all'); // 'all', 'boys', 'girls'
  const [showCreateForm, setShowCreateForm] = useState(false);
  
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

  // Prop bet creation form
  const [propBetForm, setPropBetForm] = useState({
    title: '',
    description: '',
    teamType: 'General',
    yesOdds: '',
    noOdds: '',
    expiresAt: ''
  });

  useEffect(() => {
    fetchAllBets();
    fetchUsers();
    fetchGames();
    fetchPropBets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seedGamesFromSchedule = async () => {
    try {
      setError('');
      const response = await apiClient.post('/games/seed-from-schedule');
      alert(response.data.message || 'Games seeded successfully!');
      fetchGames();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to seed games');
    }
  };

  const toggleAllVisibility = async (isVisible) => {
    if (!window.confirm(`Are you sure you want to ${isVisible ? 'show' : 'hide'} ALL games?`)) {
      return;
    }
    try {
      setError('');
      const response = await apiClient.put('/games/bulk/toggle-visibility', { isVisible });
      alert(response.data.message || `All games ${isVisible ? 'shown' : 'hidden'}`);
      fetchGames();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle visibility');
    }
  };

  const deleteAllGames = async () => {
    if (!window.confirm('⚠️ Are you ABSOLUTELY SURE you want to DELETE ALL GAMES? This cannot be undone!')) {
      return;
    }
    if (!window.confirm('This will permanently delete all games. Type YES in the next dialog to confirm.')) {
      return;
    }
    try {
      setError('');
      const response = await apiClient.delete('/games/bulk/delete-all');
      alert(response.data.message || 'All games deleted');
      fetchGames();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete games');
    }
  };

  const fetchAllBets = async () => {
    try {
      const response = await apiClient.get('/bets/all');
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
      const response = await apiClient.get('/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch users: ' + (err.response?.data?.error || err.message));
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchGames = async () => {
    try {
      const response = await apiClient.get('/games/admin/all');
      // Sort games by date (earliest first)
      const sortedGames = (response.data || []).sort((a, b) => {
        return new Date(a.game_date) - new Date(b.game_date);
      });
      setGames(sortedGames);
      setError('');
    } catch (err) {
      setError('Failed to fetch games: ' + (err.response?.data?.error || err.message));
      console.error('Failed to fetch games:', err);
    }
  };

  const fetchPropBets = async () => {
    try {
      const response = await apiClient.get('/prop-bets');
      setPropBets(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch prop bets: ' + (err.response?.data?.error || err.message));
      console.error('Failed to fetch prop bets:', err);
    }
  };

  const handleCreateGame = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/games', gameForm);
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

  const handleEditGame = (game) => {
    setEditingGame({
      ...game,
      teamType: game.team_type,
      homeTeam: game.home_team,
      awayTeam: game.away_team || '',
      gameDate: game.game_date,
      gameTime: game.game_time || '',
      winningOdds: game.winning_odds || '',
      losingOdds: game.losing_odds || '',
      spreadOdds: game.spread_odds || '',
      overUnder: game.over_under || '',
      overOdds: game.over_odds || '',
      underOdds: game.under_odds || '',
      notes: game.notes || ''
    });
  };

  const handleUpdateGame = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/games/${editingGame.id}`, {
        teamType: editingGame.teamType,
        homeTeam: editingGame.homeTeam,
        awayTeam: editingGame.awayTeam,
        gameDate: editingGame.gameDate,
        gameTime: editingGame.gameTime,
        location: editingGame.location,
        winningOdds: editingGame.winningOdds,
        losingOdds: editingGame.losingOdds,
        spread: editingGame.spread,
        spreadOdds: editingGame.spreadOdds,
        overUnder: editingGame.overUnder,
        overOdds: editingGame.overOdds,
        underOdds: editingGame.underOdds,
        notes: editingGame.notes
      });
      alert('Game updated successfully!');
      setEditingGame(null);
      fetchGames();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update game');
    }
  };

  const handleEditingGameChange = (e) => {
    const { name, value } = e.target;
    setEditingGame(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleGameVisibility = async (gameId, currentVisibility) => {
    const newVisibility = !currentVisibility;
    
    try {
      await apiClient.put(`/games/${gameId}/visibility`, { isVisible: newVisibility });
      fetchGames();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle visibility');
    }
  };

  const handlePropBetFormChange = (e) => {
    const { name, value } = e.target;
    setPropBetForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreatePropBet = async (e) => {
    e.preventDefault();
    try {
      // Convert empty expiresAt to null for database
      const payload = {
        ...propBetForm,
        expiresAt: propBetForm.expiresAt || null
      };
      await apiClient.post('/prop-bets', payload);
      alert('Prop bet created successfully!');
      setPropBetForm({
        title: '',
        description: '',
        teamType: 'General',
        yesOdds: '',
        noOdds: '',
        expiresAt: ''
      });
      fetchPropBets();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create prop bet');
    }
  };

  const handleUpdatePropBet = async (propBetId, status, outcome) => {
    try {
      await apiClient.put(`/prop-bets/${propBetId}`, { status, outcome });
      fetchPropBets();
      alert('Prop bet updated successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update prop bet');
    }
  };

  const handleDeletePropBet = async (propBetId) => {
    if (!window.confirm('Are you sure you want to delete this prop bet?')) return;
    try {
      await apiClient.delete(`/prop-bets/${propBetId}`);
      fetchPropBets();
      alert('Prop bet deleted successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete prop bet');
    }
  };

  const handleUpdateUserBalance = async (userId) => {
    try {
      const balance = parseFloat(newBalance);
      if (isNaN(balance)) {
        alert('Invalid balance amount');
        return;
      }
      await apiClient.put(`/users/${userId}/balance`, { balance });
      fetchUsers();
      setSelectedUser(null);
      setNewBalance('');
      alert('User balance updated!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update balance');
    }
  };

  const handleOpenGameStatus = (game) => {
    setGameStatusModal({
      id: game.id,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      status: game.status || 'upcoming',
      homeScore: game.home_score || '',
      awayScore: game.away_score || '',
      winner: game.result || ''
    });
  };

  const handleUpdateGameStatus = async () => {
    try {
      const { id, status, homeScore, awayScore, winner } = gameStatusModal;
      
      const updateData = {
        status,
        homeScore: homeScore ? parseInt(homeScore) : undefined,
        awayScore: awayScore ? parseInt(awayScore) : undefined
      };

      // If status is completed and winner is set, resolve bets
      if (status === 'completed' && winner) {
        updateData.winningTeam = winner;
      }

      const response = await apiClient.put(`/games/${id}/outcome`, updateData);
      
      if (response.data.betsResolved > 0) {
        alert(`Game updated! ${response.data.betsResolved} bets completed, ${formatCurrency(response.data.winningsDistributed)} distributed.`);
      } else {
        alert('Game status updated successfully!');
      }
      
      setGameStatusModal(null);
      fetchGames();
      fetchAllBets();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update game');
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
        <button className={`tab-btn ${tab === 'propbets' ? 'active' : ''}`} onClick={() => setTab('propbets')}>
          Prop Bets
        </button>
        <button className={`tab-btn ${tab === 'bets' ? 'active' : ''}`} onClick={() => setTab('bets')}>
          View All Bets
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
          {/* Filter and Action Bar */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '15px', flexWrap: 'wrap'}}>
            <div style={{display: 'flex', gap: '10px'}}>
              <button 
                onClick={() => setGameFilter('all')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: gameFilter === 'all' ? 'linear-gradient(135deg, #ffd700, #ffed4e)' : 'rgba(255, 255, 255, 0.1)',
                  color: gameFilter === 'all' ? '#0d47a1' : 'white',
                  fontWeight: gameFilter === 'all' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                All Games ({games.length})
              </button>
              <button 
                onClick={() => setGameFilter('boys')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: gameFilter === 'boys' ? 'linear-gradient(135deg, #2196f3, #1976d2)' : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontWeight: gameFilter === 'boys' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Boys Basketball ({games.filter(g => g.team_type === 'Boys Basketball').length})
              </button>
              <button 
                onClick={() => setGameFilter('girls')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: gameFilter === 'girls' ? 'linear-gradient(135deg, #e91e63, #c2185b)' : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontWeight: gameFilter === 'girls' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Girls Basketball ({games.filter(g => g.team_type === 'Girls Basketball').length})
              </button>
            </div>
            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
              <button 
                type="button" 
                className="btn" 
                onClick={seedGamesFromSchedule}
                style={{background: '#66bb6a', padding: '10px 20px'}}
              >
                📥 Seed from Schedules
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={() => toggleAllVisibility(true)}
                style={{background: '#29b6f6', padding: '10px 20px'}}
              >
                👁️ Show All
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={() => toggleAllVisibility(false)}
                style={{background: '#ff9800', padding: '10px 20px'}}
              >
                🚫 Hide All
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={deleteAllGames}
                style={{background: '#ef5350', padding: '10px 20px'}}
              >
                🗑️ Delete All
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={() => setShowCreateForm(!showCreateForm)}
                style={{background: showCreateForm ? '#757575' : '#ffd700', color: showCreateForm ? 'white' : '#0d47a1', padding: '10px 20px'}}
              >
                {showCreateForm ? '✕ Close Form' : '+ Create Game'}
              </button>
            </div>
          </div>

          {/* Create Game Form (Collapsible) */}
          {showCreateForm && (
            <div style={{background: 'rgba(255, 215, 0, 0.05)', padding: '25px', borderRadius: '12px', marginBottom: '25px', border: '2px solid rgba(255, 215, 0, 0.3)'}}>
              <h3 style={{marginTop: 0}}>Create New Game</h3>
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
                      placeholder="Home or Away"
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
                      placeholder="1.95"
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
                      placeholder="1.95"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="notes">Notes</label>
                    <input 
                      id="notes" 
                      type="text"
                      name="notes" 
                      value={gameForm.notes} 
                      onChange={handleGameFormChange}
                      placeholder="Optional notes"
                    />
                  </div>
                </div>

                <button type="submit" className="btn">Create Game</button>
              </form>
            </div>
          )}

          {/* Edit Game Form */}
          {editingGame && (
            <div style={{background: 'rgba(30, 136, 229, 0.1)', padding: '25px', borderRadius: '12px', marginBottom: '25px', border: '2px solid #1e88e5'}}>
              <h3 style={{marginTop: 0}}>✏️ Edit Game</h3>
              <form onSubmit={handleUpdateGame} className="game-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Team Type</label>
                    <select name="teamType" value={editingGame.teamType} onChange={handleEditingGameChange} required>
                      <option value="Boys Basketball">Boys Basketball</option>
                      <option value="Girls Basketball">Girls Basketball</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Home Team</label>
                    <input type="text" name="homeTeam" value={editingGame.homeTeam} onChange={handleEditingGameChange} required />
                  </div>
                  <div className="form-group">
                    <label>Away Team</label>
                    <input type="text" name="awayTeam" value={editingGame.awayTeam} onChange={handleEditingGameChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Game Date</label>
                    <input type="text" name="gameDate" value={editingGame.gameDate} onChange={handleEditingGameChange} required />
                  </div>
                  <div className="form-group">
                    <label>Game Time</label>
                    <input type="text" name="gameTime" value={editingGame.gameTime} onChange={handleEditingGameChange} />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input type="text" name="location" value={editingGame.location} onChange={handleEditingGameChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Notes</label>
                    <input type="text" name="notes" value={editingGame.notes || ''} onChange={handleEditingGameChange} />
                  </div>
                </div>
                <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                  <button type="submit" className="btn" style={{background: '#66bb6a'}}>💾 Save Changes</button>
                  <button type="button" className="btn" style={{background: '#757575'}} onClick={() => setEditingGame(null)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
          
          {/* Games List */}
          <h3 style={{marginBottom: '20px'}}>
            {gameFilter === 'all' && 'All Games'}
            {gameFilter === 'boys' && 'Boys Basketball Games'}
            {gameFilter === 'girls' && 'Girls Basketball Games'}
          </h3>
          
          {games.filter(game => {
            if (gameFilter === 'boys') return game.team_type === 'Boys Basketball';
            if (gameFilter === 'girls') return game.team_type === 'Girls Basketball';
            return true;
          }).length === 0 ? (
            <p style={{textAlign: 'center', padding: '40px', color: '#888'}}>
              {gameFilter === 'all' ? 'No games created yet. Click "Create Game" or "Seed from Schedules" to get started.' : `No ${gameFilter} games found.`}
            </p>
          ) : (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px'}}>
              {games.filter(game => {
                if (gameFilter === 'boys') return game.team_type === 'Boys Basketball';
                if (gameFilter === 'girls') return game.team_type === 'Girls Basketball';
                return true;
              }).map(game => (
                <div key={game.id} style={{
                  background: 'linear-gradient(135deg, #1e2139 0%, #161b2e 100%)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: `2px solid ${game.team_type === 'Boys Basketball' ? '#2196f3' : '#e91e63'}`,
                  transition: 'transform 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px'}}>
                    <div>
                      <h4 style={{margin: '0 0 5px 0', color: '#ffd700'}}>{game.home_team} {game.away_team ? `vs ${game.away_team}` : ''}</h4>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: game.team_type === 'Boys Basketball' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(233, 30, 99, 0.2)',
                        color: game.team_type === 'Boys Basketball' ? '#64b5f6' : '#f48fb1',
                        border: `1px solid ${game.team_type === 'Boys Basketball' ? '#2196f3' : '#e91e63'}`
                      }}>
                        {game.team_type}
                      </span>
                    </div>
                    <span style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      background: game.is_visible === false ? '#ef5350' : '#66bb6a',
                      color: 'white'
                    }}>
                      {game.is_visible === false ? '👁️ HIDDEN' : '👁️ VISIBLE'}
                    </span>
                  </div>
                  
                  <div style={{fontSize: '0.9rem', color: '#b8c5d6', marginBottom: '15px'}}>
                    <p style={{margin: '5px 0'}}><strong>📅</strong> {game.game_date} {game.game_time ? `at ${game.game_time}` : ''}</p>
                    <p style={{margin: '5px 0'}}><strong>📍</strong> {game.location || 'TBD'}</p>
                    <p style={{margin: '5px 0'}}><strong>Status:</strong> {game.status}</p>
                    {game.result && <p style={{margin: '5px 0', color: '#66bb6a'}}><strong>Winner:</strong> {game.result}</p>}
                  </div>
                  
                  {game.status !== 'completed' && (
                    <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={game.is_visible !== false}
                          onChange={() => handleToggleGameVisibility(game.id, game.is_visible !== false)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <button 
                        className="btn" 
                        style={{background: '#1e88e5', padding: '8px 14px', fontSize: '0.85em', flex: '1'}}
                        onClick={() => handleEditGame(game)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="btn" 
                        style={{background: '#9c27b0', padding: '8px 14px', fontSize: '0.85em', flex: '1'}}
                        onClick={() => handleOpenGameStatus(game)}
                      >
                        ⚙️ Set Outcome
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'propbets' && (
        <div className="admin-section">
          <h3>Create Prop Bet</h3>
          <form onSubmit={handleCreatePropBet} className="game-form">
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="propTitle">Title *</label>
                <input 
                  id="propTitle" 
                  type="text" 
                  name="title" 
                  value={propBetForm.title} 
                  onChange={handlePropBetFormChange}
                  placeholder="e.g., Will Valley Catholic win by 10+ points?"
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="propDescription">Description</label>
                <textarea 
                  id="propDescription" 
                  name="description" 
                  value={propBetForm.description} 
                  onChange={handlePropBetFormChange}
                  placeholder="Add details about this prop bet"
                  rows="3"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="propTeamType">Category</label>
                <select 
                  id="propTeamType" 
                  name="teamType" 
                  value={propBetForm.teamType} 
                  onChange={handlePropBetFormChange}
                >
                  <option value="General">General</option>
                  <option value="Boys Basketball">Boys Basketball</option>
                  <option value="Girls Basketball">Girls Basketball</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="yesOdds">Yes Odds *</label>
                <input 
                  id="yesOdds" 
                  type="number" 
                  step="0.01" 
                  name="yesOdds" 
                  value={propBetForm.yesOdds} 
                  onChange={handlePropBetFormChange}
                  placeholder="e.g., 1.75"
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="noOdds">No Odds *</label>
                <input 
                  id="noOdds" 
                  type="number" 
                  step="0.01" 
                  name="noOdds" 
                  value={propBetForm.noOdds} 
                  onChange={handlePropBetFormChange}
                  placeholder="e.g., 2.10"
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="expiresAt">Expires At</label>
                <input 
                  id="expiresAt" 
                  type="datetime-local" 
                  name="expiresAt" 
                  value={propBetForm.expiresAt} 
                  onChange={handlePropBetFormChange}
                />
              </div>
            </div>

            <button type="submit" className="btn">Create Prop Bet</button>
          </form>

          <h3>Active Prop Bets</h3>
          {propBets.length === 0 ? (
            <p>No prop bets created yet</p>
          ) : (
            <div className="games-list">
              {propBets.map(propBet => (
                <div key={propBet.id} className="game-card">
                  <h4>{propBet.title}</h4>
                  {propBet.description && <p>{propBet.description}</p>}
                  <p><strong>Category:</strong> {propBet.team_type}</p>
                  <p><strong>Odds:</strong> Yes: {propBet.yes_odds}x | No: {propBet.no_odds}x</p>
                  {propBet.expires_at && <p><strong>Expires:</strong> {new Date(propBet.expires_at).toLocaleString()}</p>}
                  <p><strong>Status:</strong> {propBet.status}</p>
                  {propBet.outcome && <p><strong>Outcome:</strong> {propBet.outcome}</p>}
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {propBet.status === 'active' && (
                      <>
                        <button className="btn" style={{background: '#66bb6a', padding: '8px 12px'}} onClick={() => handleUpdatePropBet(propBet.id, 'resolved', 'yes')}>
                          Resolve Yes
                        </button>
                        <button className="btn" style={{background: '#ef5350', padding: '8px 12px'}} onClick={() => handleUpdatePropBet(propBet.id, 'resolved', 'no')}>
                          Resolve No
                        </button>
                        <button className="btn" style={{background: '#ffc107', padding: '8px 12px'}} onClick={() => handleUpdatePropBet(propBet.id, 'cancelled', null)}>
                          Cancel
                        </button>
                      </>
                    )}
                    <button className="btn" style={{background: '#757575', padding: '8px 12px'}} onClick={() => handleDeletePropBet(propBet.id)}>
                      Delete
                    </button>
                  </div>
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
            <p style={{marginBottom: '15px', color: '#b8c5d6'}}>
              Bets are automatically completed when you set game outcomes or prop bet results. This is a read-only view.
            </p>
            <div className="bets-table-wrapper">
              <table className="bets-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User ID</th>
                    <th>Game/Prop</th>
                    <th>Selected</th>
                    <th>Amount</th>
                    <th>Odds</th>
                    <th>Status</th>
                    <th>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {allBets.map(bet => (
                    <tr key={bet.id}>
                      <td>{bet.id}</td>
                      <td>{bet.user_id}</td>
                      <td>{bet.game_id}</td>
                      <td>{bet.selected_team}</td>
                      <td>{formatCurrency(bet.amount)}</td>
                      <td>{bet.odds}x</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.85em',
                          background: bet.status === 'pending' ? '#ff9800' : '#66bb6a',
                          color: 'white'
                        }}>
                          {bet.status === 'resolved' ? 'Completed' : bet.status}
                        </span>
                      </td>
                      <td>
                        {bet.outcome ? (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.85em',
                            background: bet.outcome === 'won' ? '#66bb6a' : '#ef5350',
                            color: 'white'
                          }}>
                            {bet.outcome}
                          </span>
                        ) : '-'}
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

      {/* Game Status Management Modal */}
      {gameStatusModal && (
        <div className="modal-overlay" onClick={() => setGameStatusModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Manage Game Status</h3>
            <p><strong>{gameStatusModal.homeTeam} vs {gameStatusModal.awayTeam}</strong></p>
            
            <div className="form-group">
              <label>Game Status</label>
              <select 
                value={gameStatusModal.status}
                onChange={(e) => setGameStatusModal({...gameStatusModal, status: e.target.value})}
              >
                <option value="upcoming">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{gameStatusModal.homeTeam} Score</label>
                <input
                  type="number"
                  value={gameStatusModal.homeScore}
                  onChange={(e) => setGameStatusModal({...gameStatusModal, homeScore: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>{gameStatusModal.awayTeam} Score</label>
                <input
                  type="number"
                  value={gameStatusModal.awayScore}
                  onChange={(e) => setGameStatusModal({...gameStatusModal, awayScore: e.target.value})}
                  placeholder="0"
                />
              </div>
            </div>

            {gameStatusModal.status === 'completed' && (
              <div className="form-group">
                <label>Winner (resolves bets)</label>
                <select 
                  value={gameStatusModal.winner}
                  onChange={(e) => setGameStatusModal({...gameStatusModal, winner: e.target.value})}
                >
                  <option value="">-- Select Winner --</option>
                  <option value={gameStatusModal.homeTeam}>{gameStatusModal.homeTeam}</option>
                  <option value={gameStatusModal.awayTeam}>{gameStatusModal.awayTeam}</option>
                </select>
              </div>
            )}

            <div className="modal-buttons">
              <button className="btn" onClick={handleUpdateGameStatus}>
                Update Game
              </button>
              <button className="btn btn-secondary" onClick={() => setGameStatusModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
