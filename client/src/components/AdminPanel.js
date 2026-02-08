import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import AdminTeams from './AdminTeams';
import AdminLayout from './admin/AdminLayout';
import AdminHeader from './admin/AdminHeader';
import AdminToolbar from './admin/AdminToolbar';
import AdminTable from './admin/AdminTable';
import AdminCard from './admin/AdminCard';
import AdminBadge from './admin/AdminBadge';
import AdminActionsMenu from './admin/AdminActionsMenu';
import '../styles/AdminPanel.css';
import '../styles/AdminDesignSystem.css';
import { formatCurrency } from '../utils/currency';
import { formatTime } from '../utils/time';

function AdminPanel() {
  const [allBets, setAllBets] = useState([]);
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [propBets, setPropBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(() => {
    return localStorage.getItem('adminPanelTab') || 'games';
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [newBalance, setNewBalance] = useState('');
  const [editingGame, setEditingGame] = useState(null);
  const [gameStatusModal, setGameStatusModal] = useState(null);
  const [gameFilter, setGameFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBet, setEditingBet] = useState(null);
  const [editingBetOutcome, setEditingBetOutcome] = useState('');
  const [editingBetTeam, setEditingBetTeam] = useState('');
  const [showEmailList, setShowEmailList] = useState(false);
  const [editingPropBet, setEditingPropBet] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [showCompletedGames, setShowCompletedGames] = useState(false);
  const [selectedGameIds, setSelectedGameIds] = useState([]);

  const gameFormDefaults = {
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
  };

  const [gameForm, setGameForm] = useState(gameFormDefaults);

  const [propBetForm, setPropBetForm] = useState({
    title: '',
    description: '',
    teamType: 'General',
    options: ['YES'],
    optionOdds: {},
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
    }
  };

  const fetchPropBets = async () => {
    try {
      const response = await apiClient.get('/prop-bets');
      setPropBets(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch prop picks: ' + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => {
    fetchAllBets();
    fetchUsers();
    fetchGames();
    fetchPropBets();
  }, []);

  useEffect(() => {
    localStorage.setItem('adminPanelTab', tab);
  }, [tab]);

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

  const seedGamesFromSchedule = async () => {
    if (!window.confirm('Seed games from the current team schedules? This may create duplicate games if run multiple times.')) {
      return;
    }
    try {
      setError('');
      const response = await apiClient.post('/games/seed-from-schedule');
      alert(response.data?.message || 'Games seeded successfully');
      fetchGames();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to seed games from schedule');
    }
  };

  const toggleAllVisibility = async (isVisible) => {
    if (!window.confirm(`Are you sure you want to ${isVisible ? 'show' : 'hide'} all games?`)) {
      return;
    }
    try {
      setError('');
      const response = await apiClient.put('/games/bulk/toggle-visibility', { isVisible });
      alert(response.data?.message || `All games ${isVisible ? 'shown' : 'hidden'}`);
      fetchGames();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle visibility for all games');
    }
  };

  const handleCreateGame = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/games', gameForm);
      alert('Game created successfully!');
      setGameForm(gameFormDefaults);
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

  // eslint-disable-next-line no-unused-vars
  const toggleGameSelection = (gameId) => {
    setSelectedGameIds(prev => (
      prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]
    ));
  };

  // eslint-disable-next-line no-unused-vars
  const setSelectedGames = (ids, shouldSelect) => {
    setSelectedGameIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => {
        if (shouldSelect) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });
      return Array.from(next);
    });
  };

  const clearSelectedGames = () => setSelectedGameIds([]);

  // eslint-disable-next-line no-unused-vars
  const handleBulkVisibility = async (isVisible) => {
    if (selectedGameIds.length === 0) return;
    if (!window.confirm(`Set visibility to ${isVisible ? 'Show' : 'Hide'} for ${selectedGameIds.length} selected games?`)) {
      return;
    }
    try {
      await Promise.all(
        selectedGameIds.map(gameId => apiClient.put(`/games/${gameId}/visibility`, { isVisible }))
      );
      fetchGames();
      clearSelectedGames();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update visibility for selected games');
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleBulkDelete = async () => {
    if (selectedGameIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedGameIds.length} selected games? All related bets will be refunded.`)) {
      return;
    }
    try {
      await Promise.all(selectedGameIds.map(gameId => apiClient.delete(`/games/${gameId}`)));
      fetchGames();
      clearSelectedGames();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete selected games');
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
    if (propBetForm.options.length <= 1) {
      alert('You must have at least 1 option');
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
      // Validate that all options have names
      for (let i = 0; i < propBetForm.options.length; i++) {
        const option = propBetForm.options[i];
        if (!option || option.trim() === '') {
          alert(`Please enter a name for Option ${i + 1}`);
          return;
        }
      }

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
      setError('Prop pick created successfully!', 'success', 3000);
      setPropBetForm({
        title: '',
        description: '',
        teamType: 'General',
        options: ['YES'],
        optionOdds: {},
        expiresAt: '',
        useCustomOptions: true
      });
      fetchPropBets();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create prop pick', 'error', 4000);
    }
  };

  const handleUpdatePropBet = async (propBetId, status, outcome) => {
    try {
      await apiClient.put(`/prop-bets/${propBetId}`, { status, outcome });
      fetchPropBets();
      setError('Prop pick updated successfully!', 'success', 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update prop pick', 'error', 4000);
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

  const handleEditPropBet = (propBet) => {
    setEditingPropBet(propBet);
    
    // Handle legacy props that use yes_odds/no_odds without custom options
    let editOptions = ['Yes', 'No'];
    let editOptionOdds = { 'Yes': propBet.yes_odds, 'No': propBet.no_odds };
    
    // If custom options exist, use them
    if (propBet.options && propBet.options.length > 0) {
      editOptions = [...propBet.options];
      editOptionOdds = propBet.option_odds || {};
      // Fill in missing odds from yes_odds/no_odds
      if (!editOptionOdds[editOptions[0]]) editOptionOdds[editOptions[0]] = propBet.yes_odds;
      if (!editOptionOdds[editOptions[1]]) editOptionOdds[editOptions[1]] = propBet.no_odds;
    }
    
    // Pre-fill the form with existing prop bet data
    setPropBetForm({
      title: propBet.title,
      description: propBet.description || '',
      teamType: propBet.team_type || 'General',
      options: editOptions,
      optionOdds: editOptionOdds,
      expiresAt: propBet.expires_at ? new Date(propBet.expires_at).toISOString().slice(0, 16) : '',
      useCustomOptions: true
    });
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditPropBet = () => {
    setEditingPropBet(null);
    setPropBetForm({
      title: '',
      description: '',
      teamType: 'General',
      options: ['YES'],
      optionOdds: {},
      expiresAt: '',
      useCustomOptions: true
    });
  };

  const handleUpdatePropBetDetails = async (e) => {
    e.preventDefault();
    
    if (!editingPropBet) return;

    // Validate options and odds
    const filledOptions = propBetForm.options.filter(opt => opt.trim() !== '');
    if (filledOptions.length < 1) {
      alert('Please provide at least 1 option');
      return;
    }

    const missingOdds = filledOptions.some(opt => !propBetForm.optionOdds[opt] || propBetForm.optionOdds[opt] <= 0);
    if (missingOdds) {
      alert('Please provide odds for all options');
      return;
    }

    try {
      await apiClient.put(`/prop-bets/${editingPropBet.id}`, {
        title: propBetForm.title,
        description: propBetForm.description,
        teamType: propBetForm.teamType,
        options: filledOptions,
        optionOdds: propBetForm.optionOdds,
        expiresAt: propBetForm.expiresAt || null,
        yesOdds: propBetForm.optionOdds[filledOptions[0]],
        noOdds: filledOptions.length > 1 ? propBetForm.optionOdds[filledOptions[1]] : 1.0
      });

      alert('Prop pick updated successfully!');
      handleCancelEditPropBet();
      fetchPropBets();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update prop pick');
    }
  };

  const handleTogglePropVisibility = async (propBetId) => {
    try {
      // Optimistic update - update UI immediately
      const updatedPropBets = propBets.map(pb => 
        pb.id === propBetId ? { ...pb, is_visible: !pb.is_visible } : pb
      );
      setPropBets(updatedPropBets);
      
      // Then sync with server
      await apiClient.put(`/prop-bets/${propBetId}/visibility`);
      
      // Fetch to ensure server state matches
      fetchPropBets();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle visibility');
      // Revert on error by fetching fresh data
      fetchPropBets();
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

  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmDelete = window.confirm(
      `⚠️ WARNING: Permanently delete "${user.username}"?\n\n` +
      `This will delete ALL their data:\n` +
      `• All bets\n` +
      `• All transactions\n` +
      `• All notifications\n\n` +
      `This CANNOT be undone!`
    );

    if (!confirmDelete) return;

    try {
      await apiClient.delete(`/users/${userId}`);
      fetchUsers();
      setSelectedUser(null);
      alert('✅ User deleted successfully');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newPassword = window.prompt(
      `🔒 Reset password for "${user.username}"\n\n` +
      `Enter a new password (minimum 6 characters):`
    );

    if (!newPassword) return;

    if (newPassword.length < 6) {
      alert('❌ Password must be at least 6 characters long');
      return;
    }

    try {
      const response = await apiClient.put(`/users/${userId}/reset-password`, { newPassword });
      alert(
        `✅ Password reset successfully!\n\n` +
        `New password: ${response.data.newPassword}\n\n` +
        `Please share this password with ${user.username}.\n` +
        `They will also receive a notification in the app.`
      );
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reset password');
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
    if (loading) return; // Prevent double-click
    
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout className="admin-panel">
        <AdminCard>Loading...</AdminCard>
      </AdminLayout>
    );
  }

  // eslint-disable-next-line no-unused-vars
  const boysGamesCount = games.filter(g => g.team_type === 'Boys Basketball').length;
  // eslint-disable-next-line no-unused-vars
  const girlsGamesCount = games.filter(g => g.team_type === 'Girls Basketball').length;

  const activeGames = games.filter(game => {
    if (gameFilter === 'boys') return game.team_type === 'Boys Basketball' && !game.result;
    if (gameFilter === 'girls') return game.team_type === 'Girls Basketball' && !game.result;
    return !game.result;
  });

  const completedGames = games.filter(game => {
    if (gameFilter === 'boys') return game.team_type === 'Boys Basketball' && game.result;
    if (gameFilter === 'girls') return game.team_type === 'Girls Basketball' && game.result;
    return game.result;
  });

  const activeIds = activeGames.map(game => game.id);
  const completedIds = completedGames.map(game => game.id);
  // eslint-disable-next-line no-unused-vars
  const isAllActiveSelected = activeIds.length > 0 && activeIds.every(id => selectedGameIds.includes(id));
  // eslint-disable-next-line no-unused-vars
  const isAllCompletedSelected = completedIds.length > 0 && completedIds.every(id => selectedGameIds.includes(id));

  const headerConfig = {
    games: {
      title: 'Manage Games',
      subtitle: 'Create, edit, and resolve games.'
    },
    propbets: {
      title: 'Prop Picks',
      subtitle: 'Create, edit, and resolve prop picks.'
    },
    bets: {
      title: 'View All Picks',
      subtitle: 'Review and manage all user picks.'
    },
    users: {
      title: 'Manage Users',
      subtitle: 'Roles, balances, and account actions.'
    },
    teams: {
      title: 'Manage Teams',
      subtitle: 'Update team info, schedules, and rosters.'
    }
  };

  const headerActions = {
    games: (
      <button
        className="admin-button admin-button--primary"
        type="button"
        onClick={() => setShowCreateForm(prev => !prev)}
      >
        {showCreateForm ? 'Close Create Form' : 'Create Game'}
      </button>
    ),
    propbets: editingPropBet ? (
      <button
        className="admin-button admin-button--secondary"
        type="button"
        onClick={handleCancelEditPropBet}
      >
        Cancel Edit
      </button>
    ) : null,
    users: (
      <button
        className="admin-button admin-button--secondary"
        type="button"
        onClick={() => setShowEmailList(true)}
      >
        Export Emails
      </button>
    ),
    bets: null,
    teams: null
  };

  const { title, subtitle } = headerConfig[tab] || headerConfig.games;

  return (
    <AdminLayout className="admin-panel">
      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <AdminHeader title={title} subtitle={subtitle} actions={headerActions[tab]} />

      <div className="admin-mobile-nav">
        {adminTabs.map((t) => (
          <button
            key={t.key}
            className={`admin-mobile-pill ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'games' ? 'active' : ''}`} onClick={() => setTab('games')}>
          Manage Games
        </button>
        <button className={`admin-tab ${tab === 'propbets' ? 'active' : ''}`} onClick={() => setTab('propbets')}>
          Prop Picks
        </button>
        <button className={`admin-tab ${tab === 'bets' ? 'active' : ''}`} onClick={() => setTab('bets')}>
          View All Picks
        </button>
        <button className={`admin-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          Manage Users
        </button>
        <button className={`admin-tab ${tab === 'teams' ? 'active' : ''}`} onClick={() => setTab('teams')}>
          Manage Teams
        </button>
      </div>

      {tab === 'games' && (
        <div className="admin-section admin-games">
          <AdminToolbar
            left={
              <div className="admin-segmented" role="tablist" aria-label="Game filters">
                <button
                  type="button"
                  className={`admin-segmented__btn ${gameFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setGameFilter('all')}
                >
                  All Games ({games.length})
                </button>
                <button
                  type="button"
                  className={`admin-segmented__btn ${gameFilter === 'boys' ? 'active' : ''}`}
                  onClick={() => setGameFilter('boys')}
                >
                  Boys Basketball ({boysGamesCount})
                </button>
                <button
                  type="button"
                  className={`admin-segmented__btn ${gameFilter === 'girls' ? 'active' : ''}`}
                  onClick={() => setGameFilter('girls')}
                >
                  Girls Basketball ({girlsGamesCount})
                </button>
              </div>
            }
            right={
              <>
                <button type="button" className="admin-button admin-button--secondary" onClick={seedGamesFromSchedule}>
                  Seed from Schedule
                </button>
                <button type="button" className="admin-button admin-button--secondary" onClick={() => toggleAllVisibility(true)}>
                  Show All
                </button>
                <button type="button" className="admin-button admin-button--secondary" onClick={() => toggleAllVisibility(false)}>
                  Hide All
                </button>
                <AdminActionsMenu label="More">
                  <button
                    type="button"
                    className="admin-actions-menu__item admin-actions-menu__item--destructive"
                    onClick={deleteAllGames}
                  >
                    Delete All Games
                  </button>
                </AdminActionsMenu>
              </>
            }
          />

          {selectedGameIds.length > 0 && (
            <div className="admin-bulk-bar">
              <div className="admin-bulk-count">{selectedGameIds.length} selected</div>
              <div className="admin-bulk-actions">
                <button type="button" className="admin-button admin-button--secondary" onClick={() => handleBulkVisibility(true)}>
                  Show
                </button>
                <button type="button" className="admin-button admin-button--secondary" onClick={() => handleBulkVisibility(false)}>
                  Hide
                </button>
                <button type="button" className="admin-button admin-button--destructive" onClick={handleBulkDelete}>
                  Delete
                </button>
                <button type="button" className="admin-button admin-button--secondary" onClick={clearSelectedGames}>
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Create Game Form (Collapsible) */}
          {showCreateForm && (
            <AdminCard className="admin-form-card">
              <h3 className="admin-section__title">Create New Game</h3>
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

                <button type="submit" className="admin-button admin-button--primary">Create Game</button>
              </form>
            </AdminCard>
          )}

          {/* Edit Game Form */}
          {editingGame && (
            <AdminCard className="admin-form-card">
              <h3 className="admin-section__title">Edit Game</h3>
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
                <div className="admin-actions-inline">
                  <button type="submit" className="admin-button admin-button--primary">Save Changes</button>
                  <button type="button" className="admin-button admin-button--secondary" onClick={() => setEditingGame(null)}>Cancel</button>
                </div>
              </form>
            </AdminCard>
          )}
          
          {/* Games List */}
          <div className="admin-section-header admin-section-header--sticky">
            <div className="admin-section-title">
              {gameFilter === 'all' && 'Active Games'}
              {gameFilter === 'boys' && 'Active Boys Basketball Games'}
              {gameFilter === 'girls' && 'Active Girls Basketball Games'}
              <span className="count-badge">{activeGames.length}</span>
            </div>
            <label className="admin-checkbox admin-checkbox--select-all">
              <input
                type="checkbox"
                checked={isAllActiveSelected}
                onChange={(e) => setSelectedGames(activeIds, e.target.checked)}
              />
              <span>Select all</span>
            </label>
          </div>

          {activeGames.length === 0 ? (
            <div className="admin-empty-state">
              {gameFilter === 'all'
                ? 'No active games. Use Create Game or Seed from Schedule to get started.'
                : `No active ${gameFilter} games found.`}
            </div>
          ) : (
            <div className="admin-game-grid">
              {activeGames.map(game => (
                <div key={game.id} className="admin-game-card">
                  <div className="admin-game-card__header">
                    <label className="admin-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedGameIds.includes(game.id)}
                        onChange={() => toggleGameSelection(game.id)}
                      />
                      <span></span>
                    </label>
                    <div className="admin-game-card__title">
                      <div className="admin-game-card__teams">
                        <span className="team">{game.home_team}</span>
                        {game.away_team && <span className="vs">vs</span>}
                        {game.away_team && <span className="team">{game.away_team}</span>}
                      </div>
                      <div className="admin-game-card__meta">
                        {game.game_date}
                        {game.game_time ? ` • ${formatTime(game.game_time)}` : ''}
                        {game.location ? ` • ${game.location}` : ' • TBD'}
                      </div>
                    </div>
                    <div className="admin-game-card__badges">
                      <AdminBadge variant="neutral">{game.status || 'Scheduled'}</AdminBadge>
                      <AdminBadge variant={game.is_visible === false ? 'warning' : 'success'}>
                        {game.is_visible === false ? 'Hidden' : 'Visible'}
                      </AdminBadge>
                    </div>
                  </div>

                  <div className="admin-game-card__body">
                    <div className="admin-game-card__row">
                      <span className="label">Type</span>
                      <span className="value">{game.team_type}</span>
                    </div>
                    <div className="admin-game-card__row">
                      <span className="label">Status</span>
                      <span className="value">{game.status || 'Scheduled'}</span>
                    </div>
                  </div>

                  <div className="admin-game-card__actions">
                    <label className="toggle-switch admin-toggle-compact">
                      <input
                        type="checkbox"
                        checked={game.is_visible !== false}
                        onChange={() => handleToggleGameVisibility(game.id, game.is_visible !== false)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <button className="admin-button admin-button--primary" onClick={() => handleEditGame(game)}>
                      Edit
                    </button>
                    <AdminActionsMenu label="Actions">
                      <button
                        type="button"
                        className="admin-actions-menu__item"
                        onClick={() => handleOpenGameStatus(game)}
                      >
                        Set Outcome
                      </button>
                    </AdminActionsMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed Games Section */}
          {completedGames.length > 0 && (
            <div className="admin-completed-section">
              <div className="admin-section-header admin-section-header--sticky admin-section-header--completed">
                <button
                  type="button"
                  className="admin-section-toggle"
                  onClick={() => setShowCompletedGames(!showCompletedGames)}
                >
                  <span>{showCompletedGames ? '▾' : '▸'} Completed Games</span>
                  <span className="count-badge">{completedGames.length}</span>
                </button>
                <label className={`admin-checkbox admin-checkbox--select-all ${!showCompletedGames ? 'is-disabled' : ''}`}>
                  <input
                    type="checkbox"
                    disabled={!showCompletedGames}
                    checked={isAllCompletedSelected}
                    onChange={(e) => setSelectedGames(completedIds, e.target.checked)}
                  />
                  <span>Select all</span>
                </label>
              </div>

              {showCompletedGames && (
                <div className="admin-completed-list">
                  {completedGames.map(game => (
                    <div key={game.id} className="admin-completed-row">
                      <label className="admin-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedGameIds.includes(game.id)}
                          onChange={() => toggleGameSelection(game.id)}
                        />
                        <span></span>
                      </label>
                      <div className="admin-completed-main">
                        <div className="admin-game-card__teams">
                          <span className="team">{game.home_team}</span>
                          {game.away_team && <span className="vs">vs</span>}
                          {game.away_team && <span className="team">{game.away_team}</span>}
                        </div>
                        <div className="admin-game-card__meta">
                          {game.game_date}
                          {game.game_time ? ` • ${formatTime(game.game_time)}` : ''}
                          {game.location ? ` • ${game.location}` : ' • TBD'}
                        </div>
                      </div>
                      <div className="admin-completed-winner">
                        {game.result ? `Winner: ${game.result}` : 'Winner: —'}
                      </div>
                      <div className="admin-game-card__badges">
                        <AdminBadge variant="neutral">Completed</AdminBadge>
                        <AdminBadge variant={game.is_visible === false ? 'warning' : 'success'}>
                          {game.is_visible === false ? 'Hidden' : 'Visible'}
                        </AdminBadge>
                      </div>
                      <div className="admin-game-card__actions admin-game-card__actions--compact">
                        <label className="toggle-switch admin-toggle-compact">
                          <input
                            type="checkbox"
                            checked={game.is_visible !== false}
                            onChange={() => handleToggleGameVisibility(game.id, game.is_visible !== false)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <button className="admin-button admin-button--primary" onClick={() => handleEditGame(game)}>
                          Edit
                        </button>
                        <AdminActionsMenu label="Actions">
                          <button
                            type="button"
                            className="admin-actions-menu__item admin-actions-menu__item--destructive"
                            onClick={() => handleDeleteGame(game.id)}
                          >
                            Delete
                          </button>
                        </AdminActionsMenu>
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
          <AdminCard className="admin-form-card">
            <h3 className="admin-section__title">{editingPropBet ? 'Edit Prop Pick' : 'Create Prop Pick'}</h3>
            {editingPropBet && (
              <div className="admin-alert">
                Editing: {editingPropBet.title}
              </div>
            )}
            <form onSubmit={editingPropBet ? handleUpdatePropBetDetails : handleCreatePropBet} className="game-form">
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
                  <p className="admin-help-text">
                    For parlays, use a single "YES" option. For regular props, add multiple options (e.g., "Team A wins", "Team B wins")
                  </p>

                  {propBetForm.options.map((option, index) => (
                    <div key={index} className="admin-option-row">
                      <div className="admin-option-field">
                        <label>Option {index + 1} Name *</label>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={index === 0 ? "e.g., Valiants win" : "e.g., Opponent wins"}
                          required
                        />
                      </div>
                      <div className="admin-option-field admin-option-field--odds">
                        <label>Odds *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={propBetForm.optionOdds[option] || ''}
                          onChange={(e) => handleOddsChange(option, e.target.value)}
                          placeholder="e.g., 1.75"
                        />
                      </div>
                      {propBetForm.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePropBetOption(index)}
                          className="admin-button admin-button--destructive admin-button--compact"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addPropBetOption}
                    className="admin-button admin-button--secondary admin-button--compact"
                  >
                    Add Option
                  </button>
                </div>
              </div>

              <button type="submit" className="admin-button admin-button--primary">
                {editingPropBet ? 'Update Prop Pick' : 'Create Prop Pick'}
              </button>
            </form>
          </AdminCard>

          <h3 className="admin-section__title">Active Prop Picks</h3>
          {propBets.length === 0 ? (
            <div className="admin-empty-state">No prop picks created yet</div>
          ) : (
            <AdminTable>
              <thead>
                <tr>
                  <th>Prop</th>
                  <th>Category</th>
                  <th>Options & Odds</th>
                  <th>Status</th>
                  <th>Visibility</th>
                  <th>Expires</th>
                  <th>Outcome</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {propBets.map(propBet => {
                  const statusVariant = propBet.status === 'active'
                    ? 'success'
                    : propBet.status === 'cancelled'
                      ? 'danger'
                      : 'neutral';

                  return (
                    <tr key={propBet.id}>
                      <td>
                        <div className="admin-card-title">{propBet.title}</div>
                        {propBet.description && <div className="admin-muted">{propBet.description}</div>}
                      </td>
                      <td>{propBet.team_type}</td>
                      <td>
                        <div className="admin-pill-group">
                          {propBet.options && propBet.options.length > 0 ? (
                            propBet.options.map((option, idx) => {
                              const odds = propBet.option_odds ? propBet.option_odds[option] : null;
                              return (
                                <span key={idx} className="admin-pill">
                                  {option}: {odds || propBet.yes_odds}x
                                </span>
                              );
                            })
                          ) : (
                            <>
                              <span className="admin-pill">YES: {propBet.yes_odds}x</span>
                              <span className="admin-pill">NO: {propBet.no_odds}x</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <AdminBadge variant={statusVariant}>{propBet.status}</AdminBadge>
                      </td>
                      <td>
                        <label className="toggle-switch admin-toggle-compact">
                          <input
                            type="checkbox"
                            checked={propBet.is_visible}
                            onChange={() => handleTogglePropVisibility(propBet.id)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </td>
                      <td>
                        {propBet.expires_at
                          ? new Date(propBet.expires_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })
                          : '—'}
                      </td>
                      <td>
                        {propBet.outcome ? (
                          <AdminBadge variant={propBet.outcome === 'yes' ? 'success' : 'danger'}>
                            {(propBet.options && propBet.options[propBet.outcome === 'yes' ? 0 : 1]) || propBet.outcome}
                          </AdminBadge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <div className="admin-actions-inline">
                          <button
                            className="admin-button admin-button--primary admin-button--compact"
                            onClick={() => handleEditPropBet(propBet)}
                          >
                            Edit
                          </button>
                          <AdminActionsMenu label="Actions">
                            {propBet.status === 'active' && (
                              propBet.options && propBet.options.length > 0 ? (
                                propBet.options.map((option, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    className="admin-actions-menu__item"
                                    onClick={() => handleUpdatePropBet(propBet.id, 'resolved', idx === 0 ? 'yes' : 'no')}
                                  >
                                    Resolve: {option}
                                  </button>
                                ))
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="admin-actions-menu__item"
                                    onClick={() => handleUpdatePropBet(propBet.id, 'resolved', 'yes')}
                                  >
                                    Resolve: YES
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-actions-menu__item"
                                    onClick={() => handleUpdatePropBet(propBet.id, 'resolved', 'no')}
                                  >
                                    Resolve: NO
                                  </button>
                                </>
                              )
                            )}
                            <button
                              type="button"
                              className="admin-actions-menu__item"
                              onClick={() => handleUpdatePropBet(propBet.id, 'cancelled', null)}
                            >
                              Cancel Prop
                            </button>
                            <button
                              type="button"
                              className="admin-actions-menu__item admin-actions-menu__item--destructive"
                              onClick={() => handleDeletePropBet(propBet.id)}
                            >
                              Delete
                            </button>
                          </AdminActionsMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </AdminTable>
          )}
        </div>
      )}

      {tab === 'bets' && (
        <>
          <div className="admin-card-grid admin-stats-grid">
            <AdminCard className="admin-stat-card">
              <div className="admin-stat-label">Total Picks</div>
              <div className="admin-stat-value">{allBets.length}</div>
            </AdminCard>
            <AdminCard className="admin-stat-card">
              <div className="admin-stat-label">Pending</div>
              <div className="admin-stat-value">{allBets.filter(b => b.status === 'pending').length}</div>
            </AdminCard>
            <AdminCard className="admin-stat-card">
              <div className="admin-stat-label">Won</div>
              <div className="admin-stat-value">{allBets.filter(b => b.outcome === 'won').length}</div>
            </AdminCard>
            <AdminCard className="admin-stat-card">
              <div className="admin-stat-label">Lost</div>
              <div className="admin-stat-value">{allBets.filter(b => b.outcome === 'lost').length}</div>
            </AdminCard>
          </div>

          <AdminCard>
            <h3 className="admin-section__title">All Picks</h3>
            <p className="admin-help-text">
              Picks are automatically completed when you set game outcomes or prop pick results. You can also manually resolve picks below.
            </p>
            <AdminTable>
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
                      <td>
                        {bet.games ? (
                          <div style={{fontSize: '0.9em'}}>
                            <div style={{fontWeight: '500'}}>{bet.games.home_team} vs {bet.games.away_team}</div>
                            <div style={{fontSize: '0.8em', color: '#66bb6a', marginTop: '3px', fontWeight: '600'}}>
                              {bet.games.team_type?.includes('Girls') ? '🏀 Girls' : '🏀 Boys'}
                            </div>
                          </div>
                        ) : bet.prop_bets ? (
                          <div style={{fontSize: '0.9em'}}>
                            <div style={{fontWeight: '500'}}>{bet.prop_bets.title}</div>
                            <div style={{fontSize: '0.8em', color: '#42a5f5', marginTop: '3px', fontWeight: '600'}}>
                              🎯 {bet.prop_bets.team_type || 'General'}
                            </div>
                          </div>
                        ) : (
                          'Unknown Bet'
                        )}
                      </td>
                      <td>{bet.selected_team}</td>
                      <td>{formatCurrency(bet.amount)}</td>
                      <td>{bet.odds}x</td>
                      <td>
                        <AdminBadge variant={bet.status === 'resolved' ? 'success' : 'warning'}>
                          {bet.status === 'resolved' ? 'Completed' : bet.status || 'pending'}
                        </AdminBadge>
                      </td>
                      <td>
                        {bet.outcome ? (
                          <AdminBadge variant={bet.outcome === 'won' ? 'success' : 'danger'}>
                            {bet.outcome}
                          </AdminBadge>
                        ) : '—'}
                      </td>
                      <td>
                        {bet.status !== 'resolved' && (
                          <button
                            className="admin-button admin-button--secondary admin-button--compact"
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
            </AdminTable>

            <div className="bets-mobile-list">
              {allBets.map(bet => (
                <div key={bet.id} className="bet-card">
                  <div className="bet-card-row">
                    <span className="bet-label">User</span>
                    <span className="bet-value">{bet.users?.username || bet.user_id}</span>
                  </div>
                  <div className="bet-card-row">
                    <span className="bet-label">Game / Prop</span>
                    <span className="bet-value">
                      {bet.games ? (
                        <div>
                          <div style={{fontWeight: '500'}}>{bet.games.home_team} vs {bet.games.away_team}</div>
                          <div style={{fontSize: '0.8em', color: '#66bb6a', marginTop: '3px', fontWeight: '600'}}>
                            {bet.games.team_type?.includes('Girls') ? '🏀 Girls' : '🏀 Boys'}
                          </div>
                        </div>
                      ) : bet.prop_bets ? (
                        <div>
                          <div style={{fontWeight: '500'}}>{bet.prop_bets.title}</div>
                          <div style={{fontSize: '0.8em', color: '#42a5f5', marginTop: '3px', fontWeight: '600'}}>
                            🎯 {bet.prop_bets.team_type || 'General'}
                          </div>
                        </div>
                      ) : (
                        'Unknown Bet'
                      )}
                    </span>
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
                      <AdminBadge variant={bet.status === 'resolved' ? 'success' : 'warning'}>
                        {bet.status === 'resolved' ? 'Completed' : bet.status || 'pending'}
                      </AdminBadge>
                    </div>
                    <div>
                      <span className="bet-label">Outcome</span>
                      {bet.outcome ? (
                        <AdminBadge variant={bet.outcome === 'won' ? 'success' : 'danger'}>
                          {bet.outcome}
                        </AdminBadge>
                      ) : (
                        <span className="admin-muted">—</span>
                      )}
                    </div>
                  </div>
                  {bet.status !== 'resolved' && (
                    <div className="bet-card-row" style={{marginTop: '1rem'}}>
                      <button
                        className="admin-button admin-button--secondary"
                        style={{width: '100%'}}
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
          </AdminCard>

          {editingBet && (
            <div className="modal-overlay" onClick={() => setEditingBet(null)}>
              <div className="modal-content admin-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Manage Pick #{editingBet.id}</h3>

                <div className="admin-modal__section">
                  <p><strong>User:</strong> {editingBet.user_id}</p>
                  <p><strong>Selection:</strong> {editingBet.selected_team}</p>
                  <p><strong>Stake:</strong> {formatCurrency(editingBet.amount)}</p>
                  <p><strong>Odds:</strong> {editingBet.odds}x</p>
                </div>

                <div className="admin-modal__section">
                  <label>Adjust Selection (Optional)</label>
                  <input
                    type="text"
                    placeholder="Enter team/option name"
                    value={editingBetTeam}
                    onChange={(e) => setEditingBetTeam(e.target.value)}
                    className="admin-input"
                  />
                </div>

                <div className="admin-modal__section">
                  <label>Pick Outcome</label>
                  <div className="admin-actions-inline">
                    <button
                      type="button"
                      className={`admin-button admin-button--secondary admin-button--toggle ${editingBetOutcome === 'won' ? 'is-active' : ''}`}
                      onClick={() => setEditingBetOutcome('won')}
                    >
                      Won
                    </button>
                    <button
                      type="button"
                      className={`admin-button admin-button--secondary admin-button--toggle ${editingBetOutcome === 'lost' ? 'is-active' : ''}`}
                      onClick={() => setEditingBetOutcome('lost')}
                    >
                      Lost
                    </button>
                  </div>
                </div>

                <div className="admin-modal__actions">
                  <button
                    type="button"
                    className="admin-button admin-button--primary"
                    onClick={() => handleUpdateBet(editingBet.id)}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="admin-button admin-button--secondary"
                    onClick={() => setEditingBet(null)}
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
        <div className="admin-section">
          <AdminCard>
            <h3 className="admin-section__title">User Management</h3>
            <div className="admin-card-grid admin-user-stats">
              <AdminCard className="admin-stat-card">
                <div className="admin-stat-label">Total Users</div>
                <div className="admin-stat-value">{users.length}</div>
              </AdminCard>
              <AdminCard className="admin-stat-card">
                <div className="admin-stat-label">Admins</div>
                <div className="admin-stat-value">{users.filter(u => u.is_admin).length}</div>
              </AdminCard>
              <AdminCard className="admin-stat-card">
                <div className="admin-stat-label">Total Balance</div>
                <div className="admin-stat-value">{formatCurrency(users.reduce((sum, u) => sum + (u.balance || 0), 0))}</div>
              </AdminCard>
            </div>

            <AdminToolbar
              left={
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="admin-search-input"
                />
              }
              right={
                userSearch ? (
                  <button
                    type="button"
                    className="admin-button admin-button--secondary"
                    onClick={() => setUserSearch('')}
                  >
                    Clear
                  </button>
                ) : null
              }
            />

            <AdminTable>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Balance</th>
                  <th>Role</th>
                  <th>Bets Placed</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(u =>
                    userSearch === '' ||
                    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.email.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map(u => {
                    const userBetsCount = allBets.filter(b => b.user_id === u.id).length;
                    const userWinnings = allBets
                      .filter(b => b.user_id === u.id && b.outcome === 'won')
                      .reduce((sum, b) => sum + (b.potential_win - b.amount), 0);

                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="admin-card-title">{u.is_admin && '👑 '}{u.username}</div>
                        </td>
                        <td className="admin-muted">{u.email}</td>
                        <td>{formatCurrency(u.balance)}</td>
                        <td>
                          <AdminBadge variant={u.is_admin ? 'info' : 'neutral'}>
                            {u.is_admin ? 'Admin' : 'User'}
                          </AdminBadge>
                        </td>
                        <td>
                          <div>{userBetsCount} bets</div>
                          <div className={userWinnings >= 0 ? 'admin-muted' : 'admin-muted'}>
                            {userWinnings >= 0 ? '+' : ''}{formatCurrency(userWinnings)}
                          </div>
                        </td>
                        <td className="admin-muted">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <AdminActionsMenu label="Actions">
                            <button
                              type="button"
                              className="admin-actions-menu__item"
                              onClick={() => {
                                setSelectedUser(u.id);
                                setNewBalance(u.balance.toString());
                              }}
                            >
                              User Options
                            </button>
                          </AdminActionsMenu>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </AdminTable>

          {/* Mobile Users List */}
            <div className="users-mobile-list">
            {users
              .filter(u => 
                userSearch === '' ||
                u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.email.toLowerCase().includes(userSearch.toLowerCase())
              )
              .map(u => {
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
                    <AdminBadge variant={u.is_admin ? 'info' : 'neutral'}>
                      {u.is_admin ? 'Admin' : 'User'}
                    </AdminBadge>
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
                      className="admin-button admin-button--secondary"
                      style={{flex: '1'}}
                      onClick={() => {
                        setSelectedUser(u.id);
                        setNewBalance(u.balance.toString());
                      }}
                    >
                      User Options
                    </button>
                  </div>
                </div>
              );
            })}
            </div>

          {selectedUser && (
            <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
              <div className="modal-content admin-modal user-options-modal" onClick={(e) => e.stopPropagation()}>
                <h3>User Options</h3>
                <div className="admin-modal__section admin-card">
                  <p>
                    <strong>Username:</strong> {users.find(u => u.id === selectedUser)?.username}
                  </p>
                  <p>
                    <strong>Current Balance:</strong> {formatCurrency(users.find(u => u.id === selectedUser)?.balance || 0)}
                  </p>
                  <p>
                    <strong>Status:</strong> {users.find(u => u.id === selectedUser)?.is_admin ? 'Admin' : 'User'}
                  </p>
                </div>

                <div className="form-group admin-modal__section">
                  <label htmlFor="balance">Update Balance</label>
                  <input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    className="admin-input"
                  />
                </div>

                <div className="form-group admin-modal__section">
                  <label className="mobile-checkbox-label">
                    <input
                      type="checkbox"
                      checked={users.find(u => u.id === selectedUser)?.is_admin || false}
                      onChange={() => handleToggleAdminStatus(selectedUser, users.find(u => u.id === selectedUser)?.is_admin || false)}
                      className="mobile-checkbox"
                    />
                    <span>Make Admin</span>
                  </label>
                </div>

                <div className="admin-modal__actions">
                  <button
                    className="admin-button admin-button--primary"
                    onClick={() => handleUpdateUserBalance(selectedUser)}
                  >
                    Save Balance
                  </button>
                  <button
                    className="admin-button admin-button--secondary"
                    onClick={() => handleResetPassword(selectedUser)}
                  >
                    Reset Password
                  </button>
                  <button
                    className="admin-button admin-button--secondary"
                    onClick={() => setSelectedUser(null)}
                  >
                    Close
                  </button>
                </div>

                <div className="admin-modal__section">
                  <button
                    className="admin-button admin-button--destructive"
                    onClick={() => handleDeleteUser(selectedUser)}
                  >
                    Delete Account Permanently
                  </button>
                  <p className="admin-muted">This action cannot be undone.</p>
                </div>

                {/* User Bets and Actions */}
                <div className="admin-modal__section">
                  <h4>Bets & Actions</h4>
                  {userHistoryLoading ? (
                    <div className="admin-muted">Loading bet and action history...</div>
                  ) : (
                    <>
                      <div style={{marginBottom: 16}}>
                        <strong>Bets:</strong>
                        <div className="admin-table-wrapper" style={{maxHeight: 180}}>
                          {userBets.length === 0 ? (
                            <div className="admin-muted">No bets found.</div>
                          ) : (
                            <table className="admin-table">
                              <thead>
                                <tr>
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
                        <div className="admin-table-wrapper" style={{maxHeight: 120}}>
                          {userTransactions.length === 0 ? (
                            <div className="admin-muted">No actions found.</div>
                          ) : (
                            <table className="admin-table">
                              <thead>
                                <tr>
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
          </AdminCard>
        </div>
      )}

      {tab === 'teams' && (
        <AdminTeams />
      )}

      {/* Game Status Management Modal */}
      {gameStatusModal && (
        <div className="modal-overlay" onClick={() => setGameStatusModal(null)}>
          <div className="modal-content admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Manage Game Status</h3>
            <p className="admin-muted">
              {gameStatusModal.homeTeam} vs {gameStatusModal.awayTeam}
            </p>

            <div className="form-group admin-modal__section">
              <label>Game Status</label>
              <select
                value={gameStatusModal.status}
                onChange={(e) => setGameStatusModal({ ...gameStatusModal, status: e.target.value })}
              >
                <option value="upcoming">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="admin-form-row">
              <div className="form-group">
                <label>{gameStatusModal.homeTeam} Score</label>
                <input
                  type="number"
                  value={gameStatusModal.homeScore}
                  onChange={(e) => setGameStatusModal({ ...gameStatusModal, homeScore: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>{gameStatusModal.awayTeam} Score</label>
                <input
                  type="number"
                  value={gameStatusModal.awayScore}
                  onChange={(e) => setGameStatusModal({ ...gameStatusModal, awayScore: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            {gameStatusModal.status === 'completed' && (
              <div className="form-group admin-modal__section">
                <label>Winner (resolves bets)</label>
                <select
                  value={gameStatusModal.winner}
                  onChange={(e) => setGameStatusModal({ ...gameStatusModal, winner: e.target.value })}
                >
                  <option value="">-- Select Winner --</option>
                  <option value={gameStatusModal.homeTeam}>{gameStatusModal.homeTeam} (Home)</option>
                  <option value={gameStatusModal.awayTeam}>{gameStatusModal.awayTeam} (Away)</option>
                </select>
              </div>
            )}

            <div className="admin-modal__actions">
              <button className="admin-button admin-button--primary" onClick={handleUpdateGameStatus}>
                Update Game
              </button>
              <button className="admin-button admin-button--secondary" onClick={() => setGameStatusModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email List Modal */}
      {showEmailList && (
        <div className="modal-overlay" onClick={() => setShowEmailList(false)}>
          <div className="modal-content admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>All User Emails</h3>
            <p className="admin-muted">
              {users.length} email{users.length !== 1 ? 's' : ''} ready to copy
            </p>

            <textarea
              readOnly
              value={users.map(u => u.email).join('\n')}
              className="admin-input"
              style={{ height: '300px', resize: 'none', fontFamily: 'monospace' }}
            />

            <div className="admin-modal__actions">
              <button
                className="admin-button admin-button--primary"
                onClick={() => {
                  const text = users.map(u => u.email).join('\n');
                  navigator.clipboard.writeText(text);
                  alert('Emails copied to clipboard!');
                }}
              >
                Copy All
              </button>
              <button
                className="admin-button admin-button--secondary"
                onClick={() => setShowEmailList(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminPanel;
