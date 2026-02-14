import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/axios';
import { formatCurrency } from '../utils/currency';
import '../styles/Bracket.css';

const roundLabels = {
  1: 'Quarterfinals',
  2: 'Semifinals',
  3: 'Final'
};

const round1SeedPairs = [
  [1, 8],
  [4, 5],
  [2, 7],
  [3, 6]
];

const makeGameKey = (gameNumber) => `game${gameNumber}`;

const normalizePicks = (picks) => ({
  round1: picks?.round1 || {},
  round2: picks?.round2 || {},
  round3: picks?.round3 || {}
});

function Bracket({ updateUser }) {
  const navigate = useNavigate();
  const [bracket, setBracket] = useState(null);
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [entry, setEntry] = useState(null);
  const [picks, setPicks] = useState({ round1: {}, round2: {}, round3: {} });
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const teamsBySeed = useMemo(() => {
    return teams.reduce((acc, team) => {
      acc[team.seed] = team;
      return acc;
    }, {});
  }, [teams]);

  const gamesByRound = useMemo(() => {
    return games.reduce((acc, game) => {
      if (!acc[game.round]) acc[game.round] = {};
      acc[game.round][game.game_number] = game;
      return acc;
    }, {});
  }, [games]);

  const round1Matchups = useMemo(() => {
    return round1SeedPairs.map(([seed1, seed2], index) => ({
      gameNumber: index + 1,
      team1: teamsBySeed[seed1],
      team2: teamsBySeed[seed2]
    }));
  }, [teamsBySeed]);

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
          const entryRes = await apiClient.get(`/brackets/${payload.bracket.id}/entries/me`);
          if (entryRes.data) {
            const normalized = normalizePicks(entryRes.data.picks);
            setEntry(entryRes.data);
            setPicks(normalized);
          } else {
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

  const applyRound1Pick = (gameNumber, teamId) => {
    setPicks((prev) => {
      const next = normalizePicks(prev);
      next.round1[makeGameKey(gameNumber)] = teamId;

      const semi1Teams = [next.round1.game1, next.round1.game2].filter(Boolean);
      const semi2Teams = [next.round1.game3, next.round1.game4].filter(Boolean);

      if (next.round2.game1 && !semi1Teams.includes(next.round2.game1)) {
        next.round2.game1 = undefined;
      }
      if (next.round2.game2 && !semi2Teams.includes(next.round2.game2)) {
        next.round2.game2 = undefined;
      }

      const finalTeams = [next.round2.game1, next.round2.game2].filter(Boolean);
      if (next.round3.game1 && !finalTeams.includes(next.round3.game1)) {
        next.round3.game1 = undefined;
      }

      return { ...next };
    });
  };

  const applyRound2Pick = (gameNumber, teamId) => {
    setPicks((prev) => {
      const next = normalizePicks(prev);
      next.round2[makeGameKey(gameNumber)] = teamId;

      const finalTeams = [next.round2.game1, next.round2.game2].filter(Boolean);
      if (next.round3.game1 && !finalTeams.includes(next.round3.game1)) {
        next.round3.game1 = undefined;
      }

      return { ...next };
    });
  };

  const applyRound3Pick = (teamId) => {
    setPicks((prev) => {
      const next = normalizePicks(prev);
      next.round3.game1 = teamId;
      return { ...next };
    });
  };

  const getTeamName = (teamId) => {
    const match = teams.find((team) => team.id === teamId);
    return match?.name || 'TBD';
  };

  const round2Options = useMemo(() => {
    return {
      game1: [picks.round1.game1, picks.round1.game2].filter(Boolean),
      game2: [picks.round1.game3, picks.round1.game4].filter(Boolean)
    };
  }, [picks.round1]);

  const finalOptions = useMemo(() => {
    return [picks.round2.game1, picks.round2.game2].filter(Boolean);
  }, [picks.round2]);

  const canSubmit = useMemo(() => {
    return (
      picks.round1.game1 &&
      picks.round1.game2 &&
      picks.round1.game3 &&
      picks.round1.game4 &&
      picks.round2.game1 &&
      picks.round2.game2 &&
      picks.round3.game1
    );
  }, [picks]);

  const handleSubmit = async () => {
    if (!bracket) return;
    if (!canSubmit) {
      setError('Complete all picks before submitting.');
      return;
    }

    try {
      setSubmitLoading(true);
      setError('');
      setMessage('');

      const response = await apiClient.post(`/brackets/${bracket.id}/entries`, { picks });
      setEntry(response.data);
      setMessage('Bracket submitted!');

      if (updateUser) {
        const profileRes = await apiClient.get('/users/profile');
        updateUser(profileRes.data);
      }
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
          <h1>3A State Bracket</h1>
          <p>Loading bracket...</p>
        </div>
      </div>
    );
  }

  if (!bracket) {
    return (
      <div className="bracket-page">
        <div className="bracket-header">
          <h1>3A State Bracket</h1>
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
          <p className="bracket-subtitle">{bracket.season || '3A State Basketball'}</p>
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
          View Bracket Leaderboard
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

      <div style={{ position: 'relative' }}>
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0
          }}
        >
          {/* Round 1 to Round 2 connectors */}
          <g stroke="rgba(86, 177, 255, 0.3)" strokeWidth="2" fill="none">
            {/* Game 1-2 to Semifinal 1 */}
            <path d="M 295 80 L 340 150 L 340 160" />
            <path d="M 295 200 L 340 150 L 340 160" />
            {/* Game 3-4 to Semifinal 2 */}
            <path d="M 295 310 L 340 340 L 340 350" />
            <path d="M 295 440 L 340 340 L 340 350" />
          </g>

          {/* Round 2 to Round 3 connectors */}
          <g stroke="rgba(86, 177, 255, 0.3)" strokeWidth="2" fill="none">
            {/* Semifinal 1 to Finals */}
            <path d="M 550 180 L 590 220 L 590 235" />
            {/* Semifinal 2 to Finals */}
            <path d="M 550 370 L 590 220 L 590 235" />
          </g>
        </svg>

        <div className="bracket-grid" style={{ position: 'relative', zIndex: 1 }}>
        <div className="bracket-round">
          <h2>{roundLabels[1]}</h2>
          {round1Matchups.map((matchup) => {
            const winner = gamesByRound[1]?.[matchup.gameNumber]?.winner_team_id || null;
            const selected = picks.round1[makeGameKey(matchup.gameNumber)];
            return (
              <div key={matchup.gameNumber} className="bracket-matchup">
                <div className="bracket-matchup__label">Game {matchup.gameNumber}</div>
                {[matchup.team1, matchup.team2].map((team) => (
                  <button
                    key={team?.id || `${matchup.gameNumber}-tbd-${team?.seed}`}
                    type="button"
                    className={`bracket-team ${selected === team?.id ? 'selected' : ''}`}
                    onClick={() => applyRound1Pick(matchup.gameNumber, team?.id)}
                    disabled={!team || bracketLocked || !!entry}
                  >
                    <span className="seed">#{team?.seed || '-'}</span>
                    <span className="name">{team?.name || 'TBD'}</span>
                    {winner === team?.id && <span className="winner-badge">W</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        <div className="bracket-round">
          <h2>{roundLabels[2]}</h2>
          {[1, 2].map((gameNumber) => {
            const options = round2Options[makeGameKey(gameNumber)] || [];
            const winner = gamesByRound[2]?.[gameNumber]?.winner_team_id || null;
            const selected = picks.round2[makeGameKey(gameNumber)];
            return (
              <div key={gameNumber} className="bracket-matchup">
                <div className="bracket-matchup__label">Game {gameNumber}</div>
                {options.length === 0 && <div className="bracket-placeholder">Pick quarterfinal winners</div>}
                {options.map((teamId) => (
                  <button
                    key={teamId}
                    type="button"
                    className={`bracket-team ${selected === teamId ? 'selected' : ''}`}
                    onClick={() => applyRound2Pick(gameNumber, teamId)}
                    disabled={bracketLocked || !!entry}
                  >
                    <span className="name">{getTeamName(teamId)}</span>
                    {winner === teamId && <span className="winner-badge">W</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        <div className="bracket-round">
          <h2>{roundLabels[3]}</h2>
          <div className="bracket-matchup">
            <div className="bracket-matchup__label">Championship</div>
            {finalOptions.length === 0 && <div className="bracket-placeholder">Pick semifinal winners</div>}
            {finalOptions.map((teamId) => (
              <button
                key={teamId}
                type="button"
                className={`bracket-team ${picks.round3.game1 === teamId ? 'selected' : ''}`}
                onClick={() => applyRound3Pick(teamId)}
                disabled={bracketLocked || !!entry}
              >
                <span className="name">{getTeamName(teamId)}</span>
                {gamesByRound[3]?.[1]?.winner_team_id === teamId && <span className="winner-badge">W</span>}
              </button>
            ))}
          </div>
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
