import React, { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../../utils/axios';
import AdminCard from './AdminCard';
import AdminToolbar from './AdminToolbar';
import '../../styles/AdminDesignSystem.css';

const getRoundLabel = (round, totalRounds) => {
  if (totalRounds === 3) {
    if (round === 1) return 'Quarterfinals';
    if (round === 2) return 'Semifinals';
    if (round === 3) return 'Championship';
  }

  if (totalRounds === 4) {
    if (round === 1) return 'Round 1';
    if (round === 2) return 'Quarterfinals';
    if (round === 3) return 'Semifinals';
    if (round === 4) return 'Championship';
  }

  return `Round ${round}`;
};

const makeSeedDefaults = (teamCount = 16) => {
  return Array.from({ length: teamCount }).map((_, index) => ({
    seed: index + 1,
    name: '',
    id: null
  }));
};

function AdminBrackets() {
  const [brackets, setBrackets] = useState([]);
  const [selectedBracketId, setSelectedBracketId] = useState('');
  const [bracket, setBracket] = useState(null);
  const [teams, setTeams] = useState(makeSeedDefaults(16));
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '3A State Bracket',
    season: '2026',
    entryFee: 0,
    payoutPerPoint: 1000,
    status: 'open',
    bracketSize: 16
  });
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    season: '',
    entryFee: 0,
    payoutPerPoint: 1000,
    status: 'open',
    bracketSize: 16
  });

  const sortedRounds = useMemo(() => {
    return Object.keys(gamesByRound).map(Number).sort((a, b) => a - b);
  }, [gamesByRound]);

  const resizeTeams = useCallback((nextCount) => {
    setTeams((prev) => {
      const next = makeSeedDefaults(nextCount);
      return next.map((slot) => {
        const existing = prev.find((team) => team.seed === slot.seed);
        return existing ? { ...slot, ...existing } : slot;
      });
    });
  }, []);

  const gamesByRound = useMemo(() => {
    return games.reduce((acc, game) => {
      if (!acc[game.round]) acc[game.round] = [];
      acc[game.round].push(game);
      return acc;
    }, {});
  }, [games]);

  const fetchBracketDetails = useCallback(async (id) => {
    if (!id) return;
    try {
      const response = await apiClient.get(`/brackets/${id}`);
      setBracket(response.data.bracket);
      const incomingTeams = response.data.teams || [];
      const teamCount = incomingTeams.length === 8 || incomingTeams.length === 16
        ? incomingTeams.length
        : 16;
      const seededTeams = makeSeedDefaults(teamCount).map((seed) => {
        const existing = incomingTeams.find((team) => team.seed === seed.seed);
        return {
          seed: seed.seed,
          name: existing?.name || '',
          id: existing?.id || null
        };
      });
      setTeams(seededTeams);
      setGames(response.data.games || []);
      setSettingsForm({
        name: response.data.bracket.name || '',
        season: response.data.bracket.season || '',
        entryFee: response.data.bracket.entry_fee || 0,
        payoutPerPoint: response.data.bracket.payout_per_point || 1000,
        status: response.data.bracket.status || 'open',
        bracketSize: teamCount
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load bracket details');
    }
  }, []);

  const fetchBrackets = useCallback(async () => {
    try {
      const response = await apiClient.get('/brackets/admin');
      const list = response.data || [];
      setBrackets(list);
      if (!selectedBracketId && list.length > 0) {
        setSelectedBracketId(list[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load brackets');
    }
  }, [selectedBracketId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchBrackets();
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedBracketId) {
      fetchBracketDetails(selectedBracketId);
    }
  }, [selectedBracketId, fetchBracketDetails]);

  const handleCreateBracket = async (event) => {
    event.preventDefault();
    try {
      const response = await apiClient.post('/brackets', createForm);
      setMessage('Bracket created');
      setError('');
      await fetchBrackets();
      setSelectedBracketId(response.data.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create bracket');
    }
  };

  const handleUpdateSettings = async (event) => {
    event.preventDefault();
    if (!selectedBracketId) return;
    try {
      await apiClient.put(`/brackets/${selectedBracketId}`, settingsForm);
      setMessage('Bracket settings updated');
      setError('');
      await fetchBracketDetails(selectedBracketId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update settings');
    }
  };

  const handleTeamChange = (seed, value) => {
    setTeams((prev) => prev.map((team) => (
      team.seed === seed ? { ...team, name: value } : team
    )));
  };

  const handleSaveTeams = async () => {
    if (!selectedBracketId) return;
    try {
      const teamCount = Number(settingsForm.bracketSize || 16);
      const payload = teams
        .slice(0, teamCount)
        .map((team) => ({
          seed: team.seed,
          name: team.name,
          id: team.id
        }));

      await apiClient.put(`/brackets/${selectedBracketId}/teams`, { teams: payload });
      setMessage('Teams saved');
      setError('');
      await fetchBracketDetails(selectedBracketId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save teams');
    }
  };

  const handleSeedGames = async () => {
    if (!selectedBracketId) return;
    try {
      await apiClient.post(`/brackets/${selectedBracketId}/seed`);
      setMessage('Games seeded');
      setError('');
      await fetchBracketDetails(selectedBracketId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to seed games');
    }
  };

  const handleWinnerChange = async (gameId, winnerTeamId) => {
    if (!selectedBracketId) return;
    try {
      await apiClient.put(`/brackets/${selectedBracketId}/games/${gameId}/winner`, {
        winnerTeamId: winnerTeamId || null
      });
      setMessage('Winner updated');
      setError('');
      await fetchBracketDetails(selectedBracketId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update winner');
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading brackets...</div>;
  }

  return (
    <div className="admin-brackets">
      {error && <div className="admin-alert admin-alert--error">{error}</div>}
      {message && <div className="admin-alert admin-alert--success">{message}</div>}

      <AdminCard className="admin-section">
        <h3 className="admin-section__title">Bracket Library</h3>
        <div className="admin-form-row">
          <label htmlFor="bracket-select">Select Bracket</label>
          <select
            id="bracket-select"
            value={selectedBracketId}
            onChange={(event) => setSelectedBracketId(event.target.value)}
          >
            <option value="">Select</option>
            {brackets.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
      </AdminCard>

      <AdminCard className="admin-section">
        <h3 className="admin-section__title">Create New Bracket</h3>
        <form onSubmit={handleCreateBracket} className="admin-form">
          <div className="admin-form-row">
            <label htmlFor="bracket-name">Name</label>
            <input
              id="bracket-name"
              type="text"
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className="admin-form-row">
            <label htmlFor="bracket-season">Season</label>
            <input
              id="bracket-season"
              type="text"
              value={createForm.season}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, season: event.target.value }))}
            />
          </div>
          <div className="admin-form-row">
            <label htmlFor="bracket-entry">Entry Fee</label>
            <input
              id="bracket-entry"
              type="number"
              value={createForm.entryFee}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, entryFee: Number(event.target.value) }))}
            />
          </div>
          <div className="admin-form-row">
            <label htmlFor="bracket-payout">Payout per Point</label>
            <input
              id="bracket-payout"
              type="number"
              value={createForm.payoutPerPoint}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, payoutPerPoint: Number(event.target.value) }))}
            />
          </div>
          <div className="admin-form-row">
            <label htmlFor="bracket-status">Status</label>
            <select
              id="bracket-status"
              value={createForm.status}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="open">Open</option>
              <option value="locked">Locked</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="admin-form-row">
            <label htmlFor="bracket-size">Bracket Size</label>
            <select
              id="bracket-size"
              value={createForm.bracketSize}
              onChange={(event) => {
                const bracketSize = Number(event.target.value);
                setCreateForm((prev) => ({ ...prev, bracketSize }));
              }}
            >
              <option value={8}>8 Teams</option>
              <option value={16}>16 Teams</option>
            </select>
          </div>
          <button type="submit" className="admin-button admin-button--primary">Create Bracket</button>
        </form>
      </AdminCard>

      {bracket && (
        <>
          <AdminCard className="admin-section">
            <h3 className="admin-section__title">Bracket Settings</h3>
            <form onSubmit={handleUpdateSettings} className="admin-form">
              <div className="admin-form-row">
                <label htmlFor="settings-name">Name</label>
                <input
                  id="settings-name"
                  type="text"
                  value={settingsForm.name}
                  onChange={(event) => setSettingsForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>
              <div className="admin-form-row">
                <label htmlFor="settings-season">Season</label>
                <input
                  id="settings-season"
                  type="text"
                  value={settingsForm.season}
                  onChange={(event) => setSettingsForm((prev) => ({ ...prev, season: event.target.value }))}
                />
              </div>
              <div className="admin-form-row">
                <label htmlFor="settings-entry">Entry Fee</label>
                <input
                  id="settings-entry"
                  type="number"
                  value={settingsForm.entryFee}
                  onChange={(event) => setSettingsForm((prev) => ({ ...prev, entryFee: Number(event.target.value) }))}
                />
              </div>
              <div className="admin-form-row">
                <label htmlFor="settings-payout">Payout per Point</label>
                <input
                  id="settings-payout"
                  type="number"
                  value={settingsForm.payoutPerPoint}
                  onChange={(event) => setSettingsForm((prev) => ({ ...prev, payoutPerPoint: Number(event.target.value) }))}
                />
              </div>
              <div className="admin-form-row">
                <label htmlFor="settings-status">Status</label>
                <select
                  id="settings-status"
                  value={settingsForm.status}
                  onChange={(event) => setSettingsForm((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="open">Open</option>
                  <option value="locked">Locked</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="admin-form-row">
                <label htmlFor="settings-size">Bracket Size</label>
                <select
                  id="settings-size"
                  value={settingsForm.bracketSize}
                  onChange={(event) => {
                    const bracketSize = Number(event.target.value);
                    setSettingsForm((prev) => ({ ...prev, bracketSize }));
                    resizeTeams(bracketSize);
                  }}
                >
                  <option value={8}>8 Teams</option>
                  <option value={16}>16 Teams</option>
                </select>
              </div>
              <button type="submit" className="admin-button admin-button--primary">Save Settings</button>
            </form>
          </AdminCard>

          <AdminCard className="admin-section">
            <h3 className="admin-section__title">Teams & Seeding</h3>
            <div className="admin-form grid">
              {teams.slice(0, Number(settingsForm.bracketSize || 16)).map((team) => (
                <div key={team.seed} className="admin-form-row">
                  <label htmlFor={`seed-${team.seed}`}>Seed {team.seed}</label>
                  <input
                    id={`seed-${team.seed}`}
                    type="text"
                    value={team.name}
                    onChange={(event) => handleTeamChange(team.seed, event.target.value)}
                    placeholder={`Seed ${team.seed} team`}
                  />
                </div>
              ))}
            </div>
            <AdminToolbar
              right={
                <>
                  <button type="button" className="admin-button admin-button--secondary" onClick={handleSaveTeams}>
                    Save Teams
                  </button>
                  <button type="button" className="admin-button admin-button--secondary" onClick={handleSeedGames}>
                    Seed Games
                  </button>
                </>
              }
            />
          </AdminCard>

          <AdminCard className="admin-section">
            <h3 className="admin-section__title">Results & Advancement</h3>
            {sortedRounds.map((round) => (
              <div key={round} className="admin-bracket-round">
                <h4>{getRoundLabel(round, sortedRounds.length)}</h4>
                {(gamesByRound[round] || []).map((game) => (
                  <div key={game.id} className="admin-bracket-game">
                    <div className="admin-bracket-game__info">
                      <span>Game {game.game_number}</span>
                      <span>
                        {game.team1_id ? teams.find((t) => t.id === game.team1_id)?.name : 'TBD'}
                        {' vs '}
                        {game.team2_id ? teams.find((t) => t.id === game.team2_id)?.name : 'TBD'}
                      </span>
                    </div>
                    <select
                      value={game.winner_team_id || ''}
                      onChange={(event) => handleWinnerChange(game.id, event.target.value)}
                    >
                      <option value="">Set winner</option>
                      {game.team1_id && (
                        <option value={game.team1_id}>
                          {teams.find((t) => t.id === game.team1_id)?.name || 'Team 1'}
                        </option>
                      )}
                      {game.team2_id && (
                        <option value={game.team2_id}>
                          {teams.find((t) => t.id === game.team2_id)?.name || 'Team 2'}
                        </option>
                      )}
                    </select>
                  </div>
                ))}
              </div>
            ))}
          </AdminCard>
        </>
      )}
    </div>
  );
}

export default AdminBrackets;
