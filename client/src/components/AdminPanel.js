import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import AdminTeams from './AdminTeams';
import '../styles/AdminPanel.css';
import { formatCurrency } from '../utils/currency';
import { formatTime } from '../utils/time';

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
  const [editingBet, setEditingBet] = useState(null);
  const [editingBetOutcome, setEditingBetOutcome] = useState('');
  const [editingBetTeam, setEditingBetTeam] = useState('');
  const [userBets, setUserBets] = useState([]);
  const [userTransactions, setUserTransactions] = useState([]);
  const [userHistoryLoading, setUserHistoryLoading] = useState(false);
  const [showEmailList, setShowEmailList] = useState(false);
  
  // Game creation form
  const [showCompletedGames, setShowCompletedGames] = useState(false);
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

  // Prop pick creation form
  const [propBetForm, setPropBetForm] = useState({
    title: '',
    description: '',
    teamType: 'General',
    options: ['Option 1', 'Option 2'],
    optionOdds: { 'Option 1': '', 'Option 2': '' },
    expiresAt: '',
    useCustomOptions: true
  });

  const adminTabs = [
    { key: 'games', label: 'Manage Games', icon: '🏀' },
    { key: 'propbets', label: 'Prop Picks', icon: '🎯' },
    { key: 'bets', label: 'View All Picks', icon: '📋' },
    { key: 'users', label: 'Manage Users', icon: '🧑‍💼' },
    { key: 'teams', label: 'Manage Teams', icon: '🛠️' }
  ];

  useEffect(() => {
    fetchAllBets();
    fetchUsers();
    fetchGames();
    fetchPropBets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user bets and transactions when selectedUser changes
  useEffect(() => {
    if (!selectedUser) {
      setUserBets([]);
      setUserTransactions([]);
      return;
    }
    setUserHistoryLoading(true);
    Promise.all([
      apiClient.get('/bets/all').then(res => res.data.filter(b => b.user_id === selectedUser)),
      apiClient.get('/transactions').then(res => {
        // Since transactions endpoint doesn't support filtering by user, filter client-side
        // or return empty array if endpoint fails
        return [];
      }).catch(() => [])
    ]).then(([bets, txs]) => {
      setUserBets(bets);
      setUserTransactions(txs);
      setUserHistoryLoading(false);
    }).catch(err => {
      console.error('Error fetching user history:', err);
      setUserHistoryLoading(false);
    });
  }, [selectedUser]);

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
      setError(err.response?.data?.error || 'Failed to fetch picks');
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
      setError('Failed to fetch prop picks: ' + (err.response?.data?.error || err.message));
      console.error('Failed to fetch prop picks:', err);
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
    
    // Optimistic update
    setGames(prevGames => 
      prevGames.map(g => 
        g.id === gameId ? { ...g, is_visible: newVisibility } : g
      )
    );
    
    try {
      await apiClient.put(`/games/${gameId}/visibility`, { isVisible: newVisibility });
    } catch (err) {
      // Revert on error
      setGames(prevGames => 
        prevGames.map(g => 
          g.id === gameId ? { ...g, is_visible: currentVisibility } : g
        )
      );
      alert(err.response?.data?.error || 'Failed to toggle visibility');
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Are you sure you want to delete this completed game? All related bets will be refunded.')) {
      return;
    }
    
    try {
      await apiClient.delete(`/games/${gameId}`);
      fetchGames();
      alert('Game deleted successfully');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete game');
    }
  };

  const handlePropBetFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPropBetForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...propBetForm.options];
    const oldName = propBetForm.options[index];
    newOptions[index] = value;
    const newOdds = { ...propBetForm.optionOdds };
    // Rename the key in odds object
    const oldOddsValue = newOdds[oldName] || '';
    delete newOdds[oldName];
    newOdds[value] = oldOddsValue;
    setPropBetForm(prev => ({
      ...prev,
      options: newOptions,
      optionOdds: newOdds
    }));
  };

  const handleOddsChange = (option, value) => {
    setPropBetForm(prev => ({
      ...prev,
      optionOdds: {
        ...prev.optionOdds,
        [option]: value
      }
    }));
  };

  const addPropBetOption = () => {
    const newOptionName = `Option ${propBetForm.options.length + 1}`;
    setPropBetForm(prev => ({
      ...prev,
      options: [...prev.options, newOptionName],
      optionOdds: {
        ...prev.optionOdds,
        [newOptionName]: ''
      }
    }));
  };

  const removePropBetOption = (index) => {
    if (propBetForm.options.length <= 2) {
      alert('You must have at least 2 options');
      return;
    }
    const optionToRemove = propBetForm.options[index];
    const newOptions = propBetForm.options.filter((_, i) => i !== index);
    const newOdds = { ...propBetForm.optionOdds };
    delete newOdds[optionToRemove];
    setPropBetForm(prev => ({
      ...prev,
      options: newOptions,
      optionOdds: newOdds
    }));
  };

  const handleCreatePropBet = async (e) => {
    e.preventDefault();
    try {
      // Validate that all options have odds
      for (const option of propBetForm.options) {
        if (!propBetForm.optionOdds[option]) {
          alert(`Please enter odds for "${option}"`);
          return;
        }
      }

      // Convert empty expiresAt to null for database
      const payload = {
        title: propBetForm.title,
        description: propBetForm.description,
        teamType: propBetForm.teamType,
        options: propBetForm.options,
        optionOdds: propBetForm.optionOdds,
        expiresAt: propBetForm.expiresAt || null
      };
      await apiClient.post('/prop-bets', payload);
      alert('Prop pick created successfully!');
      setPropBetForm({
        title: '',
        description: '',
        teamType: 'General',
        options: ['Option 1', 'Option 2'],
        optionOdds: { 'Option 1': '', 'Option 2': '' },
        expiresAt: '',
        useCustomOptions: true
      });
      fetchPropBets();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create prop pick');
    }
  };

  const handleUpdatePropBet = async (propBetId, status, outcome) => {
    try {
      await apiClient.put(`/prop-bets/${propBetId}`, { status, outcome });
      fetchPropBets();
      alert('Prop pick updated successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update prop pick');
    }
  };

  const handleDeletePropBet = async (propBetId) => {
    if (!window.confirm('Are you sure you want to delete this prop pick?')) return;
    try {
      await apiClient.delete(`/prop-bets/${propBetId}`);
      fetchPropBets();
      alert('Prop pick deleted successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete prop pick');
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

  const handleToggleAdminStatus = async (userId, currentAdminStatus) => {
    try {
      await apiClient.put(`/users/${userId}/admin`, { isAdmin: !currentAdminStatus });
      fetchUsers();
      alert(`User ${!currentAdminStatus ? 'promoted to' : 'demoted from'} admin status!`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update admin status');
    }
  };

  const handleUpdateBet = async (betId) => {
    if (!editingBetOutcome) {
      alert('Please select an outcome');
      return;
    }

    try {
      await apiClient.put(`/bets/${betId}`, {
        status: 'resolved',
        outcome: editingBetOutcome,
        selectedTeam: editingBetTeam || undefined
      });
      fetchAllBets();
      setEditingBet(null);
      setEditingBetOutcome('');
      setEditingBetTeam('');
      alert('Pick updated successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update pick');
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
        alert(`Game updated! ${response.data.betsResolved} picks completed, ${formatCurrency(response.data.winningsDistributed)} distributed.`);
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

      <div className="admin-mobile-nav">
        {adminTabs.map((t) => (
          <button
            key={t.key}
            className={`mobile-admin-pill ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span className="pill-icon">{t.icon}</span>
            <span className="pill-label">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'games' ? 'active' : ''}`} onClick={() => setTab('games')}>
          Manage Games
        </button>
        <button className={`tab-btn ${tab === 'propbets' ? 'active' : ''}`} onClick={() => setTab('propbets')}>
          Prop Picks
        </button>
        <button className={`tab-btn ${tab === 'bets' ? 'active' : ''}`} onClick={() => setTab('bets')}>
          View All Picks
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
                  background: gameFilter === 'all' ? 'linear-gradient(135deg, #1f4e99, #3b82f6)' : 'rgba(255, 255, 255, 0.1)',
                  color: gameFilter === 'all' ? '#ffffff' : 'white',
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
            <div className="admin-game-actions">
              <button
                type="button"
                className="btn"
                onClick={seedGamesFromSchedule}
                style={{
                  background: 'linear-gradient(135deg, #66bb6a, #43a047)',
                  borderRadius: '999px',
                }}
              >
                📥 Seed from Schedules
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => toggleAllVisibility(true)}
                style={{
                  background: 'linear-gradient(135deg, #29b6f6, #0288d1)',
                  borderRadius: '999px',
                }}
              >
                👁️ Show All
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => toggleAllVisibility(false)}
                style={{
                  background: 'linear-gradient(135deg, #ffb300, #fb8c00)',
                  borderRadius: '999px',
                }}
              >
                🚫 Hide All
              </button>
              <button
                type="button"
                className="btn"
                onClick={deleteAllGames}
                style={{
                  background: 'linear-gradient(135deg, #ef5350, #e53935)',
                  borderRadius: '999px',
                }}
              >
                🗑️ Delete All
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setShowCreateForm(!showCreateForm)}
                style={{
                  background: showCreateForm
                    ? 'linear-gradient(135deg, #757575, #616161)'
                    : 'linear-gradient(135deg, #1e88e5, #1565c0)',
                  color: '#ffffff',
                  borderRadius: '999px',
                }}
              >
                {showCreateForm ? '✕ Close Form' : '+ Create Game'}
              </button>
            </div>
          </div>

          {/* Create Game Form (Collapsible) */}
          {showCreateForm && (
            <div style={{background: 'rgba(31, 78, 153, 0.05)', padding: '25px', borderRadius: '12px', marginBottom: '25px', border: '2px solid rgba(31, 78, 153, 0.3)'}}>
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
            {gameFilter === 'all' && 'Active Games'}
            {gameFilter === 'boys' && 'Active Boys Basketball Games'}
            {gameFilter === 'girls' && 'Active Girls Basketball Games'}
          </h3>
          
          {games.filter(game => {
            if (gameFilter === 'boys') return game.team_type === 'Boys Basketball' && !game.result;
            if (gameFilter === 'girls') return game.team_type === 'Girls Basketball' && !game.result;
            return !game.result;
          }).length === 0 ? (
            <p style={{textAlign: 'center', padding: '40px', color: '#888'}}>
              {gameFilter === 'all' ? 'No active games. Click "Create Game" or "Seed from Schedules" to get started.' : `No active ${gameFilter} games found.`}
            </p>
          ) : (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginBottom: '40px'}}>
              {games.filter(game => {
                if (gameFilter === 'boys') return game.team_type === 'Boys Basketball' && !game.result;
                if (gameFilter === 'girls') return game.team_type === 'Girls Basketball' && !game.result;
                return !game.result;
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
                      <h4 style={{margin: '0 0 5px 0', color: '#1f4e99'}}>{game.home_team} {game.away_team ? `vs ${game.away_team}` : ''}</h4>
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
                    <p style={{margin: '5px 0'}}><strong>📅</strong> {game.game_date} {game.game_time ? `at ${formatTime(game.game_time)}` : ''}</p>
                    <p style={{margin: '5px 0'}}><strong>📍</strong> {game.location || 'TBD'}</p>
                    <p style={{margin: '5px 0'}}><strong>Status:</strong> {game.status}</p>
                    {game.result && <p style={{margin: '5px 0', color: '#66bb6a'}}><strong>Winner:</strong> {game.result}</p>}
                  </div>
                  
                  <div style={{display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap'}}>
                    <label className="toggle-switch" style={{flexShrink: 0}}>
                      <input 
                        type="checkbox" 
                        checked={game.is_visible !== false}
                        onChange={() => handleToggleGameVisibility(game.id, game.is_visible !== false)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <button 
                      className="btn" 
                      style={{background: '#1e88e5', padding: '8px 16px', fontSize: '0.85em', whiteSpace: 'nowrap', flex: 1, minWidth: '100px'}}
                      onClick={() => handleEditGame(game)}
                    >
                      ✏️ Edit
                    </button>
                      <button 
                        className="btn" 
                        style={{background: '#9c27b0', padding: '8px 16px', fontSize: '0.85em', whiteSpace: 'nowrap', flex: 1, minWidth: '100px'}}
                        onClick={() => handleOpenGameStatus(game)}
                      >
                        ⚙️ Outcome
                      </button>
                    </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed Games Section */}
          {games.filter(game => {
            if (gameFilter === 'boys') return game.team_type === 'Boys Basketball' && game.result;
            if (gameFilter === 'girls') return game.team_type === 'Girls Basketball' && game.result;
            return game.result;
          }).length > 0 && (
            <div style={{marginTop: '50px', paddingTop: '30px', borderTop: '2px solid rgba(31, 78, 153, 0.2)'}}>
              <button
                onClick={() => setShowCompletedGames(!showCompletedGames)}
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  marginBottom: '20px',
                  background: 'linear-gradient(135deg, rgba(31, 78, 153, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                  border: '2px solid rgba(31, 78, 153, 0.3)',
                  borderRadius: '12px',
                  color: '#1f4e99',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(31, 78, 153, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(31, 78, 153, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)'}
              >
                {showCompletedGames ? '▼' : '▶'} Completed Games ({games.filter(game => {
                  if (gameFilter === 'boys') return game.team_type === 'Boys Basketball' && game.result;
                  if (gameFilter === 'girls') return game.team_type === 'Girls Basketball' && game.result;
                  return game.result;
                }).length})
              </button>

              {showCompletedGames && (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px'}}>
                  {games.filter(game => {
                    if (gameFilter === 'boys') return game.team_type === 'Boys Basketball' && game.result;
                    if (gameFilter === 'girls') return game.team_type === 'Girls Basketball' && game.result;
                    return game.result;
                  }).map(game => (
                    <div key={game.id} style={{
                      background: 'linear-gradient(135deg, rgba(102, 187, 106, 0.1) 0%, rgba(67, 160, 71, 0.1) 100%)',
                      padding: '20px',
                      borderRadius: '12px',
                      border: `2px solid rgba(102, 187, 106, 0.3)`,
                      transition: 'transform 0.2s ease',
                      opacity: 0.8
                    }}
                    onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.opacity = '1'}}
                    onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '0.8'}}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px'}}>
                        <div>
                          <h4 style={{margin: '0 0 5px 0', color: '#81c784'}}>{game.home_team} {game.away_team ? `vs ${game.away_team}` : ''}</h4>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'rgba(102, 187, 106, 0.2)',
                            color: '#81c784',
                            border: '1px solid #66bb6a'
                          }}>
                            ✅ COMPLETED
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
                        <p style={{margin: '5px 0'}}><strong>📅</strong> {game.game_date} {game.game_time ? `at ${formatTime(game.game_time)}` : ''}</p>
                        <p style={{margin: '5px 0'}}><strong>📍</strong> {game.location || 'TBD'}</p>
                        {game.result && <p style={{margin: '5px 0', color: '#66bb6a', fontWeight: '600'}}><strong>🏆 Winner:</strong> {game.result}</p>}
                      </div>
                      
                      <div style={{display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap'}}>
                        <label className="toggle-switch" style={{flexShrink: 0}}>
                          <input 
                            type="checkbox" 
                            checked={game.is_visible !== false}
                            onChange={() => handleToggleGameVisibility(game.id, game.is_visible !== false)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <button 
                          className="btn" 
                          style={{background: '#1e88e5', padding: '8px 16px', fontSize: '0.85em', whiteSpace: 'nowrap', flex: 1, minWidth: '100px'}}
                          onClick={() => handleEditGame(game)}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="btn" 
                          style={{background: '#757575', padding: '8px 16px', fontSize: '0.85em', whiteSpace: 'nowrap', flex: 1, minWidth: '100px'}}
                          onClick={() => handleDeleteGame(game.id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'propbets' && (
        <div className="admin-section">
          <h3>Create Prop Pick</h3>
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
                  placeholder="e.g., Which team will win?"
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
                  placeholder="Add details about this prop pick"
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

            <div className="form-row">
              <div className="form-group full-width">
                <label>Pick Options *</label>
                <p style={{fontSize: '0.9rem', color: '#888a9b', marginBottom: '1rem'}}>Define custom options users can pick</p>
                
                {propBetForm.options.map((option, index) => (
                  <div key={index} style={{display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end'}}>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '0.85rem'}}>Option {index + 1} Name</label>
                      <input 
                        type="text" 
                        value={option} 
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder="e.g., Valiants win"
                        style={{width: '100%'}}
                      />
                    </div>
                    <div style={{minWidth: '150px'}}>
                      <label style={{fontSize: '0.85rem'}}>Odds</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={propBetForm.optionOdds[option] || ''} 
                        onChange={(e) => handleOddsChange(option, e.target.value)}
                        placeholder="e.g., 1.75"
                        style={{width: '100%'}}
                      />
                    </div>
                    {propBetForm.options.length > 2 && (
                      <button 
                        type="button" 
                        onClick={() => removePropBetOption(index)}
                        style={{padding: '0.5rem 1rem', background: '#ef5350', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                
                <button 
                  type="button" 
                  onClick={addPropBetOption}
                  style={{marginTop: '0.5rem', padding: '0.5rem 1rem', background: '#66bb6a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                >
                  + Add Option
                </button>
              </div>
            </div>

            <button type="submit" className="btn">Create Prop Pick</button>
          </form>

          <h3>Active Prop Picks</h3>
          {propBets.length === 0 ? (
            <p style={{color: '#b8c5d6'}}>No prop picks created yet</p>
          ) : (
            <div className="prop-bets-grid">
              {propBets.map(propBet => (
                <div key={propBet.id} className="prop-bet-card">
                  <div className="prop-card-header">
                    <h4 style={{margin: '0 0 8px 0', color: '#1f4e99', fontSize: '1.2rem'}}>{propBet.title}</h4>
                    <div className="prop-status-badge" style={{background: propBet.status === 'active' ? 'rgba(102, 187, 106, 0.2)' : 'rgba(239, 83, 80, 0.2)', color: propBet.status === 'active' ? '#66bb6a' : '#ef5350', padding: '4px 12px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600}}>
                      {propBet.status.toUpperCase()}
                    </div>
                  </div>
                  
                  {propBet.description && <p style={{color: '#b8c5d6', marginBottom: '12px', fontSize: '0.95rem'}}>{propBet.description}</p>}
                  
                  <div className="prop-card-info">
                    <div className="info-row">
                      <span className="info-label">Category:</span>
                      <span className="info-value">{propBet.team_type}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Odds:</span>
                      <span className="info-value">YES: <strong style={{color: '#66bb6a'}}>{propBet.yes_odds}x</strong> | NO: <strong style={{color: '#ef5350'}}>{propBet.no_odds}x</strong></span>
                    </div>
                    {propBet.expires_at && (
                      <div className="info-row">
                        <span className="info-label">Expires:</span>
                        <span className="info-value">
                          {new Date(propBet.expires_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                    {propBet.outcome && (
                      <div className="info-row">
                        <span className="info-label">Outcome:</span>
                        <span className="info-value" style={{color: propBet.outcome === 'yes' ? '#66bb6a' : '#ef5350', fontWeight: 600}}>{propBet.outcome.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="prop-card-actions">
                    {propBet.status === 'active' && (
                      <>
                        <button className="prop-action-btn resolve-yes" onClick={() => handleUpdatePropBet(propBet.id, 'resolved', 'yes')}>
                          ✅ Resolve YES
                        </button>
                        <button className="prop-action-btn resolve-no" onClick={() => handleUpdatePropBet(propBet.id, 'resolved', 'no')}>
                          ❌ Resolve NO
                        </button>
                        <button className="prop-action-btn cancel" onClick={() => handleUpdatePropBet(propBet.id, 'cancelled', null)}>
                          ⚠️ Cancel
                        </button>
                      </>
                    )}
                    <button className="prop-action-btn delete" onClick={() => handleDeletePropBet(propBet.id)}>
                      🗑️ Delete
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
          <div className="stats" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px'}}>
            <div className="stat-card" style={{background: 'linear-gradient(135deg, #1e2139 0%, #161b2e 100%)', padding: '25px', borderRadius: '12px', border: '2px solid #2196f3', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s ease'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}> 
              <h4 style={{margin: '0 0 10px 0', color: '#64b5f6', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px'}}>📊 Total Picks</h4>
              <p style={{margin: '0', fontSize: '2.5rem', fontWeight: 'bold', color: '#1f4e99'}}>{allBets.length}</p>
            </div>
            <div className="stat-card" style={{background: 'linear-gradient(135deg, #1e2139 0%, #161b2e 100%)', padding: '25px', borderRadius: '12px', border: '2px solid #ff9800', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s ease'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <h4 style={{margin: '0 0 10px 0', color: '#ffb74d', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px'}}>⏳ Pending</h4>
              <p style={{margin: '0', fontSize: '2.5rem', fontWeight: 'bold', color: '#ffb74d'}}>{allBets.filter(b => b.status === 'pending').length}</p>
            </div>
            <div className="stat-card" style={{background: 'linear-gradient(135deg, #1e2139 0%, #161b2e 100%)', padding: '25px', borderRadius: '12px', border: '2px solid #66bb6a', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s ease'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <h4 style={{margin: '0 0 10px 0', color: '#81c784', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px'}}>✅ Won</h4>
              <p style={{margin: '0', fontSize: '2.5rem', fontWeight: 'bold', color: '#81c784'}}>{allBets.filter(b => b.outcome === 'won').length}</p>
            </div>
            <div className="stat-card" style={{background: 'linear-gradient(135deg, #1e2139 0%, #161b2e 100%)', padding: '25px', borderRadius: '12px', border: '2px solid #ef5350', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s ease'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <h4 style={{margin: '0 0 10px 0', color: '#e57373', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px'}}>❌ Lost</h4>
              <p style={{margin: '0', fontSize: '2.5rem', fontWeight: 'bold', color: '#e57373'}}>{allBets.filter(b => b.outcome === 'lost').length}</p>
            </div>
          </div>

          <div className="card">
            <h3>All Picks</h3>
            <p style={{marginBottom: '15px', color: '#b8c5d6'}}>
              Picks are automatically completed when you set game outcomes or prop pick results. You can also manually resolve picks below.
            </p>
            <div className="bets-table-wrapper">
              <table className="bets-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Game / Prop</th>
                    <th>Selection</th>
                    <th>Stake</th>
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
                      <td>{bet.users?.username || bet.user_id}</td>
                      <td>{bet.game_id || 'Prop'}</td>
                      <td>{bet.selected_team}</td>
                      <td>{formatCurrency(bet.amount)}</td>
                      <td>{bet.odds}x</td>
                      <td>
                        <span className={`chip chip-${bet.status === 'resolved' ? 'completed' : bet.status}`}>
                          {bet.status === 'resolved' ? 'Completed' : bet.status || 'pending'}
                        </span>
                      </td>
                      <td>
                        {bet.outcome ? (
                          <span className={`chip chip-${bet.outcome === 'won' ? 'won' : 'lost'}`}>
                            {bet.outcome}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        {bet.status !== 'resolved' && (
                          <button 
                            className="btn" 
                            style={{padding: '4px 8px', fontSize: '0.85rem'}}
                            onClick={() => {
                              setEditingBet(bet);
                              setEditingBetOutcome('');
                              setEditingBetTeam(bet.selected_team);
                            }}
                          >
                            Manage
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bets-mobile-list">
              {allBets.map(bet => (
                <div key={bet.id} className="bet-card">
                  <div className="bet-card-row">
                    <span className="bet-label">User</span>
                    <span className="bet-value">{bet.users?.username || bet.user_id}</span>
                  </div>
                  <div className="bet-card-row">
                    <span className="bet-label">Game / Prop</span>
                    <span className="bet-value">{bet.game_id || 'Prop'}</span>
                  </div>
                  <div className="bet-card-row">
                    <span className="bet-label">Selection</span>
                    <span className="bet-value">{bet.selected_team}</span>
                  </div>
                  <div className="bet-card-row two-col">
                    <div>
                      <span className="bet-label">Stake</span>
                      <div className="bet-value">{formatCurrency(bet.amount)}</div>
                    </div>
                    <div>
                      <span className="bet-label">Odds</span>
                      <div className="bet-value">{bet.odds}x</div>
                    </div>
                  </div>
                  <div className="bet-card-row two-col">
                    <div>
                      <span className="bet-label">Status</span>
                      <div className={`chip chip-compact ${bet.status === 'resolved' ? 'chip-completed' : 'chip-pending'}`}>
                        {bet.status === 'resolved' ? 'Completed' : bet.status || 'pending'}
                      </div>
                    </div>
                    <div>
                      <span className="bet-label">Outcome</span>
                      <div className={`chip chip-compact ${bet.outcome === 'won' ? 'chip-won' : bet.outcome === 'lost' ? 'chip-lost' : 'chip-neutral'}`}>
                        {bet.outcome || '—'}
                      </div>
                    </div>
                  </div>
                  {bet.status !== 'resolved' && (
                    <div className="bet-card-row" style={{marginTop: '1rem'}}>
                      <button 
                        className="btn" 
                        style={{width: '100%', padding: '0.75rem'}}
                        onClick={() => {
                          setEditingBet(bet);
                          setEditingBetOutcome('');
                          setEditingBetTeam(bet.selected_team);
                        }}
                      >
                        Manage Pick
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {editingBet && (
            <div className="modal-overlay" onClick={() => setEditingBet(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3 style={{marginBottom: '1.5rem'}}>Manage Pick #{editingBet.id}</h3>
                
                <div style={{marginBottom: '1.5rem'}}>
                  <p><strong>User:</strong> {editingBet.user_id}</p>
                  <p><strong>Selection:</strong> {editingBet.selected_team}</p>
                  <p><strong>Stake:</strong> {formatCurrency(editingBet.amount)}</p>
                  <p><strong>Odds:</strong> {editingBet.odds}x</p>
                </div>

                <div style={{marginBottom: '1rem'}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 'bold'}}>
                    Adjust Selection (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter team/option name"
                    value={editingBetTeam}
                    onChange={(e) => setEditingBetTeam(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #444',
                      background: '#1a1a1a',
                      color: '#fff',
                      marginBottom: '1rem'
                    }}
                  />
                </div>

                <div style={{marginBottom: '1.5rem'}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 'bold'}}>
                    Pick Outcome
                  </label>
                  <div style={{display: 'flex', gap: '1rem'}}>
                    <button
                      onClick={() => setEditingBetOutcome('won')}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: editingBetOutcome === 'won' ? '2px solid #66bb6a' : '1px solid #444',
                        background: editingBetOutcome === 'won' ? 'rgba(102, 187, 106, 0.2)' : '#2a2a2a',
                        color: editingBetOutcome === 'won' ? '#66bb6a' : '#b0b0b0',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ✓ WON
                    </button>
                    <button
                      onClick={() => setEditingBetOutcome('lost')}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: editingBetOutcome === 'lost' ? '2px solid #ef5350' : '1px solid #444',
                        background: editingBetOutcome === 'lost' ? 'rgba(239, 83, 80, 0.2)' : '#2a2a2a',
                        color: editingBetOutcome === 'lost' ? '#ef5350' : '#b0b0b0',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ✗ LOST
                    </button>
                  </div>
                </div>

                <div style={{display: 'flex', gap: '1rem'}}>
                  <button
                    onClick={() => handleUpdateBet(editingBet.id)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '6px',
                      background: '#1e88e5',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingBet(null)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '6px',
                      background: '#555',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'users' && (
        <div className="card">
          <h3>👥 User Management</h3>
          <div style={{background: 'rgba(33, 150, 243, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(33, 150, 243, 0.3)'}}>
            <p style={{margin: '0 0 5px 0', color: '#64b5f6'}}>
              <strong>📊 Total Users:</strong> {users.length}
            </p>
            <p style={{margin: '0 0 5px 0', color: '#64b5f6'}}>
              <strong>🧑‍💼 Admins:</strong> {users.filter(u => u.is_admin).length}
            </p>
            <p style={{margin: '0', color: '#64b5f6'}}>
              <strong>💰 Total Balance:</strong> {formatCurrency(users.reduce((sum, u) => sum + (u.balance || 0), 0))}
            </p>
          </div>

          <button 
            onClick={() => setShowEmailList(true)}
            style={{
              marginBottom: '20px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #66bb6a, #4caf50)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            📧 Export All Emails
          </button>

          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Bets Placed</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const userBetsCount = allBets.filter(b => b.user_id === u.id).length;
                  const userWinnings = allBets
                    .filter(b => b.user_id === u.id && b.outcome === 'won')
                    .reduce((sum, b) => sum + (b.potential_win - b.amount), 0);
                  
                  return (
                    <tr key={u.id} style={{borderLeft: u.is_admin ? '4px solid #1f4e99' : 'none'}}>
                      <td>
                        <div style={{fontWeight: '600', color: u.is_admin ? '#1f4e99' : '#b8c5d6'}}>
                          {u.is_admin && '👑 '}{u.username}
                        </div>
                      </td>
                      <td style={{fontSize: '0.9em', color: '#888'}}>{u.email}</td>
                      <td>
                        <span style={{fontWeight: 'bold', color: '#66bb6a', fontSize: '1.1em'}}>
                          {formatCurrency(u.balance)}
                        </span>
                      </td>
                      <td>
                        <span style={{padding: '4px 12px', borderRadius: '20px', fontSize: '0.8em', fontWeight: '600', background: u.is_admin ? 'rgba(31, 78, 153, 0.2)' : 'rgba(102, 187, 106, 0.2)', color: u.is_admin ? '#1f4e99' : '#66bb6a'}}>
                          {u.is_admin ? '👑 Admin' : '👤 User'}
                        </span>
                      </td>
                      <td>
                        <div style={{fontSize: '0.9em'}}>
                          <div style={{color: '#b8c5d6'}}>{userBetsCount} bets</div>
                          <div style={{color: userWinnings >= 0 ? '#66bb6a' : '#ef5350', fontSize: '0.85em'}}>
                            {userWinnings >= 0 ? '+' : ''}{formatCurrency(userWinnings)}
                          </div>
                        </div>
                      </td>
                      <td style={{fontSize: '0.9em', color: '#888'}}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <button 
                          className="btn"
                          style={{background: '#9c27b0', padding: '6px 10px', fontSize: '0.8em', whiteSpace: 'nowrap'}}
                          onClick={() => {
                            setSelectedUser(u.id);
                            setNewBalance(u.balance.toString());
                          }}
                        >
                          ⚙️ Options
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Users List */}
          <div className="users-mobile-list">
            {users.map(u => {
              const userBetsCount = allBets.filter(b => b.user_id === u.id).length;
              const userWinnings = allBets
                .filter(b => b.user_id === u.id && b.outcome === 'won')
                .reduce((sum, b) => sum + (b.potential_win - b.amount), 0);
              
              return (
                <div key={u.id} className={`user-card ${u.is_admin ? 'admin' : ''}`}>
                  <div className="user-card-header">
                    <div className="user-card-title">
                      <h4 className="user-card-username">
                        {u.is_admin && '👑 '}{u.username}
                      </h4>
                      <p className="user-card-email">{u.email}</p>
                    </div>
                    <span className={`user-card-badge ${u.is_admin ? 'admin' : 'user'}`}>
                      {u.is_admin ? '👑 Admin' : '👤 User'}
                    </span>
                  </div>

                  <div className="user-card-body">
                    <div className="user-card-stat">
                      <div className="user-card-stat-label">💰 Balance</div>
                      <div className="user-card-stat-value balance">
                        {formatCurrency(u.balance)}
                      </div>
                    </div>

                    <div className="user-card-stat">
                      <div className="user-card-stat-label">🎲 Bets Placed</div>
                      <div className="user-card-stat-value">{userBetsCount}</div>
                    </div>

                    <div className="user-card-stat">
                      <div className="user-card-stat-label">📈 Net Winnings</div>
                      <div className={`user-card-stat-value ${userWinnings >= 0 ? 'positive' : 'negative'}`}>
                        {userWinnings >= 0 ? '+' : ''}{formatCurrency(userWinnings)}
                      </div>
                    </div>

                    <div className="user-card-stat">
                      <div className="user-card-stat-label">📅 Joined</div>
                      <div className="user-card-stat-value">
                        {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="user-card-actions">
                    <button 
                      className="btn"
                      style={{background: '#9c27b0', flex: '1'}}
                      onClick={() => {
                        setSelectedUser(u.id);
                        setNewBalance(u.balance.toString());
                      }}
                    >
                      ⚙️ Options
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedUser && (
            <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{minWidth: '500px', maxWidth: '90vw'}}>
                <h3 style={{marginBottom: '20px', color: '#1f4e99'}}>⚙️ User Options</h3>
                <div style={{marginBottom: '20px', background: 'rgba(30, 136, 229, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(30, 136, 229, 0.3)'}}>
                  <p style={{margin: '5px 0', color: '#b8c5d6'}}>
                    <strong>Username:</strong> {users.find(u => u.id === selectedUser)?.username}
                  </p>
                  <p style={{margin: '5px 0', color: '#b8c5d6'}}>
                    <strong>Current Balance:</strong> <span style={{color: '#66bb6a', fontWeight: 'bold'}}>{formatCurrency(users.find(u => u.id === selectedUser)?.balance || 0)}</span>
                  </p>
                  <p style={{margin: '0', color: '#b8c5d6'}}>
                    <strong>Status:</strong> {users.find(u => u.id === selectedUser)?.is_admin ? '👑 Admin' : '👤 Regular User'}
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="balance">💰 Update Balance</label>
                  <input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    style={{width: '100%', padding: '10px', background: '#1e2139', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#fff'}}
                  />
                </div>

                <div className="form-group" style={{marginBottom: '20px'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}>
                    <input 
                      type="checkbox" 
                      checked={users.find(u => u.id === selectedUser)?.is_admin || false}
                      onChange={() => handleToggleAdminStatus(selectedUser, users.find(u => u.id === selectedUser)?.is_admin || false)}
                      style={{width: '18px', height: '18px', cursor: 'pointer'}}
                    />
                    <span style={{color: '#b8c5d6', fontWeight: '500'}}>👑 Make Admin</span>
                  </label>
                </div>

                <div className="modal-buttons" style={{display: 'flex', gap: '10px', marginBottom: 24}}>
                  <button 
                    className="btn" 
                    style={{flex: 1, background: '#66bb6a'}}
                    onClick={() => handleUpdateUserBalance(selectedUser)}
                  >
                    ✅ Save Balance
                  </button>
                  <button 
                    className="btn btn-secondary"
                    style={{flex: 1, background: '#ef5350'}}
                    onClick={() => setSelectedUser(null)}
                  >
                    ❌ Close
                  </button>
                </div>

                {/* User Bets and Actions */}
                <div style={{marginTop: 10}}>
                  <h4 style={{color: '#1f4e99', marginBottom: 8}}>🎲 Bets & Actions</h4>
                  {userHistoryLoading ? (
                    <div style={{color: '#b8c5d6'}}>Loading bet and action history...</div>
                  ) : (
                    <>
                      <div style={{marginBottom: 16}}>
                        <strong>Bets:</strong>
                        <div style={{maxHeight: 180, overflowY: 'auto', background: '#181c2f', borderRadius: 6, padding: 8, marginTop: 4}}>
                          {userBets.length === 0 ? (
                            <div style={{color: '#b8c5d6'}}>No bets found.</div>
                          ) : (
                            <table style={{width: '100%', fontSize: '0.95em'}}>
                              <thead>
                                <tr style={{color: '#64b5f6'}}>
                                  <th>Date</th>
                                  <th>Game/Prop</th>
                                  <th>Selection</th>
                                  <th>Amount</th>
                                  <th>Odds</th>
                                  <th>Status</th>
                                  <th>Outcome</th>
                                </tr>
                              </thead>
                              <tbody>
                                {userBets.map(bet => (
                                  <tr key={bet.id}>
                                    <td>{new Date(bet.created_at).toLocaleString()}</td>
                                    <td>{bet.game_id || 'Prop'}</td>
                                    <td>{bet.selected_team}</td>
                                    <td>{formatCurrency(bet.amount)}</td>
                                    <td>{bet.odds}x</td>
                                    <td>{bet.status}</td>
                                    <td>{bet.outcome || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                      <div>
                        <strong>Actions:</strong>
                        <div style={{maxHeight: 120, overflowY: 'auto', background: '#181c2f', borderRadius: 6, padding: 8, marginTop: 4}}>
                          {userTransactions.length === 0 ? (
                            <div style={{color: '#b8c5d6'}}>No actions found.</div>
                          ) : (
                            <table style={{width: '100%', fontSize: '0.95em'}}>
                              <thead>
                                <tr style={{color: '#64b5f6'}}>
                                  <th>Date</th>
                                  <th>Type</th>
                                  <th>Amount</th>
                                  <th>Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {userTransactions.map(tx => (
                                  <tr key={tx.id}>
                                    <td>{new Date(tx.created_at).toLocaleString()}</td>
                                    <td>{tx.type}</td>
                                    <td>{formatCurrency(tx.amount)}</td>
                                    <td>{tx.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </>
                  )}
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
        <div 
          className="modal-overlay" 
          onClick={() => setGameStatusModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1e2139 0%, #161b2e 100%)',
              padding: '2rem',
              borderRadius: '14px',
              border: '2px solid rgba(31, 78, 153, 0.3)',
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5), 0 0 40px rgba(31, 78, 153, 0.15)',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <h3 style={{color: '#1f4e99', marginBottom: '1rem', textShadow: '0 2px 4px rgba(31, 78, 153, 0.2)'}}>
              ⚙️ Manage Game Status
            </h3>
            <p style={{color: '#b8c5d6', marginBottom: '1.5rem', fontSize: '1rem'}}>
              <strong style={{color: '#1f4e99'}}>{gameStatusModal.homeTeam} vs {gameStatusModal.awayTeam}</strong>
            </p>
            
            <div className="form-group" style={{marginBottom: '1.5rem'}}>
              <label style={{color: '#1f4e99', marginBottom: '0.5rem', display: 'block', fontWeight: '600'}}>Game Status</label>
              <select 
                value={gameStatusModal.status}
                onChange={(e) => setGameStatusModal({...gameStatusModal, status: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  background: '#0f1419',
                  border: '2px solid rgba(31, 78, 153, 0.2)',
                  borderRadius: '8px',
                  color: '#1f4e99',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <option value="upcoming" style={{background: '#0f1419', color: '#1f4e99'}}>📅 Scheduled</option>
                <option value="in_progress" style={{background: '#0f1419', color: '#1f4e99'}}>🏀 In Progress</option>
                <option value="completed" style={{background: '#0f1419', color: '#1f4e99'}}>✅ Completed</option>
              </select>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem'}}>
              <div className="form-group">
                <label style={{color: '#1f4e99', marginBottom: '0.5rem', display: 'block', fontWeight: '600'}}>
                  {gameStatusModal.homeTeam} Score
                </label>
                <input
                  type="number"
                  value={gameStatusModal.homeScore}
                  onChange={(e) => setGameStatusModal({...gameStatusModal, homeScore: e.target.value})}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: '#0f1419',
                    border: '2px solid rgba(31, 78, 153, 0.2)',
                    borderRadius: '8px',
                    color: '#b8c5d6',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
              <div className="form-group">
                <label style={{color: '#1f4e99', marginBottom: '0.5rem', display: 'block', fontWeight: '600'}}>
                  {gameStatusModal.awayTeam} Score
                </label>
                <input
                  type="number"
                  value={gameStatusModal.awayScore}
                  onChange={(e) => setGameStatusModal({...gameStatusModal, awayScore: e.target.value})}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: '#0f1419',
                    border: '2px solid rgba(31, 78, 153, 0.2)',
                    borderRadius: '8px',
                    color: '#b8c5d6',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
            </div>

            {gameStatusModal.status === 'completed' && (
              <div className="form-group" style={{marginBottom: '2rem'}}>
                <label style={{color: '#1f4e99', marginBottom: '0.5rem', display: 'block', fontWeight: '600'}}>
                  🏆 Winner (resolves bets)
                </label>
                <select 
                  value={gameStatusModal.winner}
                  onChange={(e) => setGameStatusModal({...gameStatusModal, winner: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: '#0f1419',
                    border: '2px solid rgba(102, 187, 106, 0.3)',
                    borderRadius: '8px',
                    color: '#66bb6a',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <option value="" style={{background: '#0f1419', color: '#888'}}>-- Select Winner --</option>
                  <option value={gameStatusModal.homeTeam} style={{background: '#0f1419', color: '#66bb6a'}}>
                    {gameStatusModal.homeTeam} (Home)
                  </option>
                  <option value={gameStatusModal.awayTeam} style={{background: '#0f1419', color: '#66bb6a'}}>
                    {gameStatusModal.awayTeam} (Away)
                  </option>
                </select>
              </div>
            )}

            <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
              <button 
                className="btn" 
                onClick={handleUpdateGameStatus}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)',
                  color: 'white',
                  padding: '0.9rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(102, 187, 106, 0.3)'
                }}
              >
                ✅ Update Game
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setGameStatusModal(null)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#b8c5d6',
                  padding: '0.9rem 1.5rem',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email List Modal */}
      {showEmailList && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1f2e',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid rgba(31, 78, 153, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{marginTop: 0, color: '#1f4e99', marginBottom: '1rem'}}>📧 All User Emails</h2>
            <p style={{color: '#888a9b', marginBottom: '1.5rem', fontSize: '0.9rem'}}>
              {users.length} email{users.length !== 1 ? 's' : ''} ready to copy
            </p>
            
            <textarea 
              readOnly
              value={users.map(u => u.email).join('\n')}
              style={{
                width: '100%',
                height: '300px',
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(31, 78, 153, 0.2)',
                borderRadius: '8px',
                color: '#e9f1ff',
                fontFamily: 'monospace',
                fontSize: '0.95rem',
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />
            
            <div style={{display: 'flex', gap: '10px', marginTop: '1.5rem', flexWrap: 'wrap'}}>
              <button
                onClick={() => {
                  const text = users.map(u => u.email).join('\n');
                  navigator.clipboard.writeText(text);
                  alert('Emails copied to clipboard!');
                }}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #1f4e99, #3b82f6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  minWidth: '120px'
                }}
              >
                📋 Copy All
              </button>
              <button
                onClick={() => setShowEmailList(false)}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#b8c5d6',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  minWidth: '120px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
