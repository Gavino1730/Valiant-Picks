import React, { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../../utils/axios';
import '../../styles/AdminBrackets.css';

const ROUND_LABELS = {
  4: { 1: 'Round 1', 2: 'Quarterfinals', 3: 'Semifinals', 4: 'Championship' },
  3: { 1: 'Quarterfinals', 2: 'Semifinals', 3: 'Championship' }
};

const getRoundLabel = (round, totalRounds) =>
  ROUND_LABELS[totalRounds]?.[round] || `Round ${round}`;

const STATUS_OPTIONS = [
  { value: 'open',        label: 'Open',        color: '#22c55e' },
  { value: 'locked',      label: 'Locked',      color: '#f59e0b' },
  { value: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'completed',   label: 'Completed',   color: '#6b7280' }
];

function AdminBrackets() {
  const [gender, setGender] = useState('boys');
  const [bracket, setBracket] = useState(null);
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const teamById = useMemo(() => {
    return teams.reduce((acc, t) => { acc[t.id] = t; return acc; }, {});
  }, [teams]);

  const gamesByRound = useMemo(() => {
    return games.reduce((acc, g) => {
      if (!acc[g.round]) acc[g.round] = [];
      acc[g.round].push(g);
      return acc;
    }, {});
  }, [games]);

  const sortedRounds = useMemo(() =>
    Object.keys(gamesByRound).map(Number).sort((a, b) => a - b),
    [gamesByRound]
  );

  const totalRounds = sortedRounds.length;

  const fetchBracket = useCallback(async (selectedGender) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const res = await apiClient.get(`/brackets/active?gender=${selectedGender}`);
      if (!res.data?.bracket) {
        setBracket(null);
        setTeams([]);
        setGames([]);
        return;
      }
      setBracket(res.data.bracket);
      setTeams(res.data.teams || []);
      setGames(res.data.games || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load bracket');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBracket(gender);
  }, [gender, fetchBracket]);

  const handleWinnerClick = async (game, winnerTeamId) => {
    if (!bracket) return;
    const newWinner = game.winner_team_id === winnerTeamId ? null : winnerTeamId;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await apiClient.put(`/brackets/${bracket.id}/games/${game.id}/winner`, {
        winnerTeamId: newWinner
      });
      await fetchBracket(gender);
      setMessage('Saved ✓');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save winner');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!bracket) return;
    setSaving(true);
    setError('');
    try {
      await apiClient.put(`/brackets/${bracket.id}`, { status: newStatus });
      await fetchBracket(gender);
      setMessage(`Status set to "${newStatus}"`);
      setTimeout(() => setMessage(''), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const getTeamName = (teamId) => teamById[teamId]?.name || 'TBD';
  const getTeamSeed = (teamId) => teamById[teamId]?.seed || '?';

  if (loading) {
    return <div className="ab-loading">Loading bracket...</div>;
  }

  return (
    <div className="ab-container">
      {error && <div className="ab-alert ab-alert--error">{error}</div>}
      {message && <div className="ab-alert ab-alert--success">{message}</div>}

      {/* Gender Switcher */}
      <div className="ab-gender-switch">
        <button
          className={`ab-gender-btn ${gender === 'boys' ? 'active boys' : ''}`}
          onClick={() => setGender('boys')}
        >
          🏀 Boys Bracket
        </button>
        <button
          className={`ab-gender-btn ${gender === 'girls' ? 'active girls' : ''}`}
          onClick={() => setGender('girls')}
        >
          🎀 Girls Bracket
        </button>
      </div>

      {!bracket ? (
        <div className="ab-empty">
          No {gender === 'girls' ? 'girls' : 'boys'} bracket found. Run the SQL setup script to create one.
        </div>
      ) : (
        <>
          {/* Status Bar */}
          <div className="ab-status-bar">
            <span className="ab-status-label">Status:</span>
            <div className="ab-status-buttons">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`ab-status-btn ${bracket.status === opt.value ? 'active' : ''}`}
                  style={bracket.status === opt.value
                    ? { background: opt.color, color: '#fff', borderColor: opt.color }
                    : { borderColor: opt.color, color: opt.color }
                  }
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={saving}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="ab-bracket-name">{bracket.name}</span>
            {saving && <span className="ab-saving">Saving…</span>}
          </div>

          {/* Instructions */}
          <div className="ab-instructions">
            <strong>Click a team</strong> to mark them as the winner — they'll advance automatically. Click again to undo.
          </div>

          {/* Visual Bracket */}
          <div className="ab-bracket-grid">
            {sortedRounds.map((round) => {
              const roundGames = (gamesByRound[round] || []).sort((a, b) => a.game_number - b.game_number);
              const isChamp = round === sortedRounds[sortedRounds.length - 1] && roundGames.length === 1;

              return (
                <div key={round} className={`ab-round ${isChamp ? 'ab-round--champ' : ''}`}>
                  <div className="ab-round-label">{getRoundLabel(round, totalRounds)}</div>
                  <div className="ab-games">
                    {roundGames.map((game) => {
                      const hasTeam1 = !!game.team1_id;
                      const hasTeam2 = !!game.team2_id;
                      const winner = game.winner_team_id;

                      return (
                        <div key={game.id} className={`ab-game ${isChamp ? 'ab-game--champ' : ''}`}>
                          {isChamp && <div className="ab-champ-icon">🏆</div>}

                          {/* Team 1 */}
                          <button
                            className={[
                              'ab-team-btn',
                              !hasTeam1 ? 'ab-team-btn--tbd' : '',
                              winner === game.team1_id ? 'ab-team-btn--winner' : '',
                              winner && winner !== game.team1_id ? 'ab-team-btn--loser' : ''
                            ].join(' ')}
                            onClick={() => hasTeam1 && handleWinnerClick(game, game.team1_id)}
                            disabled={!hasTeam1 || saving}
                          >
                            {hasTeam1 ? (
                              <>
                                <span className="ab-seed">#{getTeamSeed(game.team1_id)}</span>
                                <span className="ab-name">{getTeamName(game.team1_id)}</span>
                                {winner === game.team1_id && <span className="ab-winner-badge">✓</span>}
                              </>
                            ) : (
                              <span className="ab-tbd">TBD</span>
                            )}
                          </button>

                          <div className="ab-vs">vs</div>

                          {/* Team 2 */}
                          <button
                            className={[
                              'ab-team-btn',
                              !hasTeam2 ? 'ab-team-btn--tbd' : '',
                              winner === game.team2_id ? 'ab-team-btn--winner' : '',
                              winner && winner !== game.team2_id ? 'ab-team-btn--loser' : ''
                            ].join(' ')}
                            onClick={() => hasTeam2 && handleWinnerClick(game, game.team2_id)}
                            disabled={!hasTeam2 || saving}
                          >
                            {hasTeam2 ? (
                              <>
                                <span className="ab-seed">#{getTeamSeed(game.team2_id)}</span>
                                <span className="ab-name">{getTeamName(game.team2_id)}</span>
                                {winner === game.team2_id && <span className="ab-winner-badge">✓</span>}
                              </>
                            ) : (
                              <span className="ab-tbd">TBD</span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
    </div>
  );
}

export default AdminBrackets;
