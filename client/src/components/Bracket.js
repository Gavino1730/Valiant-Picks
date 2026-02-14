import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/axios';
import { formatCurrency } from '../utils/currency';
import '../styles/Bracket.css';


const ROUND_LABELS = {
  1: 'Round 1',
  2: 'Round 2',
  3: 'Round 3',
  4: 'Championship'
};

const makeGameKey = (gameNumber) => `game${gameNumber}`;

const normalizePicks = (picks) => ({
  round1: picks?.round1 || {},
  round2: picks?.round2 || {},
  round3: picks?.round3 || {},
  round4: picks?.round4 || {}
});

function Bracket({ updateUser }) {
  const navigate = useNavigate();
  const [bracket, setBracket] = useState(null);
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [entry, setEntry] = useState(null);
  const [picks, setPicks] = useState({ round1: {}, round2: {}, round3: {}, round4: {} });
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const teamById = useMemo(() => {
    return teams.reduce((acc, team) => {
      acc[team.id] = team;
      return acc;
    }, {});
  }, [teams]);

  const gamesByRound = useMemo(() => {
    return games.reduce((acc, game) => {
      if (!acc[game.round]) acc[game.round] = [];
      acc[game.round].push(game);
      return acc;
    }, {});
  }, [games]);

  useEffect(() => {
    const loadBracket = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/brackets/active');
        const payload = response.data;

        if (!payload?.bracket) {
          setBracket(null);
          setTeams([]);
          setGames([]);
          return;
        }

        setBracket(payload.bracket);
        setTeams(payload.teams || []);
        setGames(payload.games || []);

        if (payload.bracket?.id) {
          try {
            const entryRes = await apiClient.get(`/brackets/${payload.bracket.id}/entries/me`);
            if (entryRes.data) {
              const normalized = normalizePicks(entryRes.data.picks);
              setEntry(entryRes.data);
              setPicks(normalized);
            } else {
              setEntry(null);
            }
          } catch (err) {
            setEntry(null);
          }
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load bracket');
      } finally {
        setLoading(false);
      }
    };

    loadBracket();
  }, []);

  const getTeamName = (teamId) => {
    const team = teamById[teamId];
    return team ? team.name : 'TBD';
  };

  const applyRound1Pick = (gameNumber, teamId) => {
    setPicks((prev) => ({
      ...prev,
      round1: {
        ...prev.round1,
        [makeGameKey(gameNumber)]: teamId
      },
      round2: {},
      round3: {},
      round4: {}
    }));
  };

  const applyRound2Pick = (gameNumber, teamId) => {
    setPicks((prev) => ({
      ...prev,
      round2: {
        ...prev.round2,
        [makeGameKey(gameNumber)]: teamId
      },
      round3: {},
      round4: {}
    }));
  };

  const applyRound3Pick = (gameNumber, teamId) => {
    setPicks((prev) => ({
      ...prev,
      round3: {
        ...prev.round3,
        [makeGameKey(gameNumber)]: teamId
      },
      round4: {}
    }));
  };

  const applyRound4Pick = (teamId) => {
    setPicks((prev) => ({
      ...prev,
      round4: {
        game1: teamId
      }
    }));
  };

  // Get available options for each round based on previous picks
  const getR1Games = () => gamesByRound[1]?.sort((a, b) => a.game_number - b.game_number) || [];

  const getR2Options = (gameNumber) => {
    // Round 2 Game 1: from R1 games 1-2 winners
    // Round 2 Game 2: from R1 games 3-4 winners
    // Round 2 Game 3: from R1 games 5-6 winners
    // Round 2 Game 4: from R1 games 7-8 winners
    const mappings = {
      1: [1, 2],
      2: [3, 4],
      3: [5, 6],
      4: [7, 8]
    };
    const gameNums = mappings[gameNumber] || [];
    return gameNums.map((gNum) => picks.round1[makeGameKey(gNum)]).filter(Boolean);
  };

  const getR3Options = (gameNumber) => {
    // Round 3 Game 1: from R2 games 1-2 winners
    // Round 3 Game 2: from R2 games 3-4 winners
    const mappings = {
      1: [1, 2],
      2: [3, 4]
    };
    const gameNums = mappings[gameNumber] || [];
    return gameNums.map((gNum) => picks.round2[makeGameKey(gNum)]).filter(Boolean);
  };

  const getR4Options = () => {
    // Championship: from R3 games 1-2 winners
    return [picks.round3[makeGameKey(1)], picks.round3[makeGameKey(2)]].filter(Boolean);
  };

  const canSubmit = useMemo(() => {
    return (
      Object.keys(picks.round1).length === 8 &&
      Object.keys(picks.round2).length === 4 &&
      Object.keys(picks.round3).length === 2 &&
      picks.round4.game1 !== undefined
    );
  }, [picks]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Complete all picks before submitting');
      return;
    }

    try {
      setSubmitLoading(true);
      setError('');
      setMessage('');

      await apiClient.post(`/brackets/${bracket.id}/entries`, { picks });

      setEntry({ ...entry, picks });
      setMessage('Bracket submitted successfully!');
      if (updateUser) updateUser();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit bracket');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bracket-page">
        <div className="bracket-header">
          <h1>Championship Bracket</h1>
          <p>Loading bracket...</p>
        </div>
      </div>
    );
  }

  if (!bracket) {
    return (
      <div className="bracket-page">
        <div className="bracket-header">
          <h1>Championship Bracket</h1>
          <p className="bracket-subtitle">Bracket coming soon.</p>
        </div>
      </div>
    );
  }

  const bracketLocked = bracket.status !== 'open';

  return (
    <div className="bracket-page">
      <div className="bracket-header">
        <div>
          <h1>{bracket.name}</h1>
          <p className="bracket-subtitle">{bracket.season || 'Championship Tournament'}</p>
        </div>
        <div className="bracket-meta">
          <div className="bracket-meta__item">
            <span className="label">Entry Fee</span>
            <span className="value">{formatCurrency(Number(bracket.entry_fee || 0))}</span>
          </div>
          <div className="bracket-meta__item">
            <span className="label">Payout</span>
            <span className="value">{formatCurrency(Number(bracket.payout_per_point || 0))} per point</span>
          </div>
        </div>
      </div>

      <div className="bracket-actions">
        <button
          type="button"
          className="bracket-link"
          onClick={() => navigate('/bracket-leaderboard')}
        >
          View Leaderboard
        </button>
        {entry && (
          <div className="bracket-entry-summary">
            <span>Your points: {entry.points}</span>
            <span>Payout: {formatCurrency(Number(entry.payout || 0))}</span>
          </div>
        )}
      </div>

      {error && <div className="bracket-alert bracket-alert--error">{error}</div>}
      {message && <div className="bracket-alert bracket-alert--success">{message}</div>}

      {bracketLocked && !entry && (
        <div className="bracket-alert bracket-alert--info">Bracket entries are locked.</div>
      )}

      <div className="bracket-grid">
        {/* Round 1 */}
        <div className="bracket-round">
          <h2>{ROUND_LABELS[1]}</h2>
          <div className="bracket-games">
            {getR1Games().map((game) => {
              const winner = game.winner_team_id;
              const selected = picks.round1[makeGameKey(game.game_number)];
              return (
                <div key={game.id} className="bracket-game">
                  <div className="game-label">G{game.game_number}</div>
                  {[game.team1_id, game.team2_id].map((teamId, idx) => (
                    <button
                      key={teamId || idx}
                      className={`team-btn ${selected === teamId ? 'selected' : ''}`}
                      onClick={() => applyRound1Pick(game.game_number, teamId)}
                      disabled={!teamId || bracketLocked || !!entry}
                    >
                      <span className="team-seed">#{teamById[teamId]?.seed || '?'}</span>
                      <span className="team-name">{getTeamName(teamId)}</span>
                      {winner === teamId && <span className="winner-badge">✓</span>}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Round 2 */}
        <div className="bracket-round">
          <h2>{ROUND_LABELS[2]}</h2>
          <div className="bracket-games">
            {[1, 2, 3, 4].map((gameNum) => {
              const options = getR2Options(gameNum);
              const game = gamesByRound[2]?.find((g) => g.game_number === gameNum);
              const winner = game?.winner_team_id;
              const selected = picks.round2[makeGameKey(gameNum)];

              return (
                <div key={gameNum} className="bracket-game">
                  <div className="game-label">G{gameNum}</div>
                  {options.length === 0 && <div className="bracket-placeholder">—</div>}
                  {options.map((teamId) => (
                    <button
                      key={teamId}
                      className={`team-btn ${selected === teamId ? 'selected' : ''}`}
                      onClick={() => applyRound2Pick(gameNum, teamId)}
                      disabled={bracketLocked || !!entry}
                    >
                      <span className="team-name">{getTeamName(teamId)}</span>
                      {winner === teamId && <span className="winner-badge">✓</span>}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Round 3 */}
        <div className="bracket-round">
          <h2>{ROUND_LABELS[3]}</h2>
          <div className="bracket-games">
            {[1, 2].map((gameNum) => {
              const options = getR3Options(gameNum);
              const game = gamesByRound[3]?.find((g) => g.game_number === gameNum);
              const winner = game?.winner_team_id;
              const selected = picks.round3[makeGameKey(gameNum)];

              return (
                <div key={gameNum} className="bracket-game">
                  <div className="game-label">G{gameNum}</div>
                  {options.length === 0 && <div className="bracket-placeholder">—</div>}
                  {options.map((teamId) => (
                    <button
                      key={teamId}
                      className={`team-btn ${selected === teamId ? 'selected' : ''}`}
                      onClick={() => applyRound3Pick(gameNum, teamId)}
                      disabled={bracketLocked || !!entry}
                    >
                      <span className="team-name">{getTeamName(teamId)}</span>
                      {winner === teamId && <span className="winner-badge">✓</span>}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Round 4 (Championship) */}
        <div className="bracket-round">
          <h2>{ROUND_LABELS[4]}</h2>
          <div className="bracket-games">
            {(() => {
              const options = getR4Options();
              const game = gamesByRound[4]?.[0];
              const winner = game?.winner_team_id;
              const selected = picks.round4.game1;

              return (
                <div className="bracket-game">
                  <div className="game-label">Championship</div>
                  {options.length === 0 && <div className="bracket-placeholder">—</div>}
                  {options.map((teamId) => (
                    <button
                      key={teamId}
                      className={`team-btn ${selected === teamId ? 'selected' : ''}`}
                      onClick={() => applyRound4Pick(teamId)}
                      disabled={bracketLocked || !!entry}
                    >
                      <span className="team-name">{getTeamName(teamId)}</span>
                      {winner === teamId && <span className="winner-badge">✓</span>}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {!entry && (
        <div className="bracket-submit">
          <button
            type="button"
            className="bracket-submit-btn"
            onClick={handleSubmit}
            disabled={!canSubmit || submitLoading || bracketLocked}
          >
            {submitLoading ? 'Submitting...' : 'Submit Bracket'}
          </button>
        </div>
      )}
    </div>
  );
}

export default Bracket;
