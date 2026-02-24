import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/axios';
import { formatCurrency } from '../utils/currency';
import '../styles/Bracket.css';

const makeGameKey = (gameNumber) => `game${gameNumber}`;

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

const getRoundPlaceholder = (round, totalRounds) => {
  const label = getRoundLabel(round - 1, totalRounds);
  if (round === 1) return '—';
  if (round === totalRounds) return `Awaiting ${label} results`;
  return `Awaiting ${label}`;
};

const normalizePicks = (picks) => ({
  round1: picks?.round1 || {},
  round2: picks?.round2 || {},
  round3: picks?.round3 || {},
  round4: picks?.round4 || {}
});

function Bracket({ updateUser, gender = 'boys' }) {
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
        const response = await apiClient.get(`/brackets/active?gender=${gender}`);
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
  }, [gender]);

  const getTeamName = (teamId) => {
    const team = teamById[teamId];
    return team ? team.name : 'TBD';
  };

  const sortedRounds = useMemo(() => {
    return Object.keys(gamesByRound)
      .map(Number)
      .sort((a, b) => a - b);
  }, [gamesByRound]);

  const totalRounds = sortedRounds.length;

  const requiredPickCounts = useMemo(() => {
    return sortedRounds.reduce((acc, round) => {
      acc[round] = (gamesByRound[round] || []).length;
      return acc;
    }, {});
  }, [gamesByRound, sortedRounds]);

  const getGameLabel = (game) => {
    if (!game) return 'TBD';
    
    const team1 = teamById[game.team1_id];
    const team2 = teamById[game.team2_id];
    
    if (team1 && team2) {
      return `${team1.seed} vs ${team2.seed}`;
    }
    
    return 'TBD';
  };

  const applyPick = (round, gameNumber, teamId) => {
    setPicks((prev) => {
      const next = {
        ...prev,
        [`round${round}`]: {
          ...(prev[`round${round}`] || {}),
          [makeGameKey(gameNumber)]: teamId
        }
      };

      sortedRounds
        .filter((roundNumber) => roundNumber > round)
        .forEach((roundNumber) => {
          next[`round${roundNumber}`] = {};
        });

      return next;
    });
  };

  const getOptionsForRoundGame = (round, gameNumber) => {
    const game = (gamesByRound[round] || []).find((item) => item.game_number === gameNumber);
    if (!game) return [];

    if (round === sortedRounds[0]) {
      return [game.team1_id, game.team2_id].filter(Boolean);
    }

    const currentRoundIndex = sortedRounds.indexOf(round);
    const prevRound = sortedRounds[currentRoundIndex - 1];
    if (!prevRound) return [];

    const prevRoundGames = (gamesByRound[prevRound] || []).sort((a, b) => a.game_number - b.game_number);
    const prevGame1 = prevRoundGames[(gameNumber - 1) * 2];
    const prevGame2 = prevRoundGames[(gameNumber - 1) * 2 + 1];

    return [prevGame1, prevGame2]
      .filter(Boolean)
      .map((prevGame) => picks[`round${prevRound}`]?.[makeGameKey(prevGame.game_number)])
      .filter(Boolean);
  };

  const canSubmit = useMemo(() => {
    if (sortedRounds.length === 0) return false;

    return sortedRounds.every((round) => {
      const roundKey = `round${round}`;
      const currentCount = Object.keys(picks[roundKey] || {}).length;
      return currentCount === (requiredPickCounts[round] || 0);
    });
  }, [picks, requiredPickCounts, sortedRounds]);

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
      
      // Fetch updated user profile (balance may have changed due to entry fee)
      if (updateUser) {
        try {
          const response = await apiClient.get('/users/profile');
          updateUser(response.data);
        } catch (err) {
          console.error('Failed to fetch updated user profile:', err);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit bracket');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bracket-page${gender === 'girls' ? ' bracket-page--girls' : ''}`}>
        <div className="bracket-tabs">
          <button className={`bracket-tab${gender !== 'girls' ? ' bracket-tab--active' : ''}`} onClick={() => navigate('/bracket')}>🏀 Boys</button>
          <button className={`bracket-tab${gender === 'girls' ? ' bracket-tab--active' : ''}`} onClick={() => navigate('/girls-bracket')}>🎀 Girls</button>
          <button className="bracket-tab" onClick={() => navigate(gender === 'girls' ? '/girls-bracket-leaderboard' : '/bracket-leaderboard')}>📊 Leaderboard</button>
          <button className="bracket-tab" onClick={() => navigate(gender === 'girls' ? '/girls-actual-bracket' : '/actual-bracket')}>📺 Live</button>
        </div>
        <div className="bracket-header">
          <h1>{gender === 'girls' ? 'Girls Bracket' : 'Boys Bracket'}</h1>
        </div>
        <p>Loading bracket...</p>
      </div>
    );
  }

  if (!bracket) {
    return (
      <div className={`bracket-page${gender === 'girls' ? ' bracket-page--girls' : ''}`}>
        <div className="bracket-tabs">
          <button className={`bracket-tab${gender !== 'girls' ? ' bracket-tab--active' : ''}`} onClick={() => navigate('/bracket')}>🏀 Boys</button>
          <button className={`bracket-tab${gender === 'girls' ? ' bracket-tab--active' : ''}`} onClick={() => navigate('/girls-bracket')}>🎀 Girls</button>
          <button className="bracket-tab" onClick={() => navigate(gender === 'girls' ? '/girls-bracket-leaderboard' : '/bracket-leaderboard')}>📊 Leaderboard</button>
          <button className="bracket-tab" onClick={() => navigate(gender === 'girls' ? '/girls-actual-bracket' : '/actual-bracket')}>📺 Live</button>
        </div>
        <div className="bracket-header">
          <h1>{gender === 'girls' ? 'Girls Bracket' : 'Boys Bracket'}</h1>
        </div>
      </div>
    );
  }

  const bracketLocked = bracket.status !== 'open';

  return (
    <div className={`bracket-page${gender === 'girls' ? ' bracket-page--girls' : ''}`}>
      <div className="bracket-tabs">
        <button className={`bracket-tab${gender !== 'girls' ? ' bracket-tab--active' : ''}`} onClick={() => navigate('/bracket')}>🏀 Boys</button>
        <button className={`bracket-tab${gender === 'girls' ? ' bracket-tab--active' : ''}`} onClick={() => navigate('/girls-bracket')}>🎀 Girls</button>
        <button className="bracket-tab" onClick={() => navigate(gender === 'girls' ? '/girls-bracket-leaderboard' : '/bracket-leaderboard')}>📊 Leaderboard</button>
        <button className="bracket-tab" onClick={() => navigate(gender === 'girls' ? '/girls-actual-bracket' : '/actual-bracket')}>📺 Live</button>
      </div>

      <div className="bracket-header">
        <div>
          <h1>{gender === 'girls' ? 'Girls Bracket' : 'Boys Bracket'}</h1>
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

      <div className="bracket-device-notice">
        💻 <strong>Best experienced on a laptop or desktop!</strong> The bracket can be tricky to navigate on a phone — for the smoothest experience, open <strong>valiantpicks.com</strong> on your computer.
      </div>

      {entry && (
        <div className="bracket-entry-summary">
          <span>Your points: {entry.points}</span>
          <span>Payout: {formatCurrency(Number(entry.payout || 0))}</span>
        </div>
      )}

      {!entry && !bracketLocked && (
        <div className="bracket-cta-banner">
          <div className="bracket-cta-banner__text">
            <span className="bracket-cta-banner__icon">🏆</span>
            <div>
              <strong>You haven't entered yet!</strong>
              <span> Make your picks below and click <em>Create Bracket</em> to lock them in.</span>
            </div>
          </div>
        </div>
      )}

      {error && <div className="bracket-alert bracket-alert--error">{error}</div>}
      {message && <div className="bracket-alert bracket-alert--success">{message}</div>}

      {bracketLocked && !entry && (
        <div className="bracket-alert bracket-alert--info">Bracket entries are locked.</div>
      )}

      {/* Instructions Section */}
      {!entry && !bracketLocked && (
        <div className="bracket-instructions">
          <div className="instructions-steps">
            <div className="instructions-step"><span className="instructions-step__num">1</span><span>Pick a winner for each game</span></div>
            <div className="instructions-step__divider">→</div>
            <div className="instructions-step"><span className="instructions-step__num">2</span><span>Your picks carry into later rounds</span></div>
            <div className="instructions-step__divider">→</div>
            <div className="instructions-step"><span className="instructions-step__num">3</span><span>Fill all rounds, then submit</span></div>
          </div>
        </div>
      )}

      <div className="bracket-grid">
        {sortedRounds.map((round) => {
          const roundGames = (gamesByRound[round] || []).sort((a, b) => a.game_number - b.game_number);
          const roundKey = `round${round}`;
          const isChampionshipRound = round === sortedRounds[sortedRounds.length - 1] && roundGames.length === 1;

          return (
            <div key={round} className={`bracket-round bracket-round--r${round}`}>
              <h2>{getRoundLabel(round, totalRounds)}</h2>
              <div className="bracket-games">
                {roundGames.map((game, idx) => {
                  const winner = game.winner_team_id;
                  const selected = picks[roundKey]?.[makeGameKey(game.game_number)];
                  const options = getOptionsForRoundGame(round, game.game_number);

                  return (
                    <div
                      key={game.id}
                      className={`bracket-game ${isChampionshipRound ? 'championship-game' : ''}`}
                      data-game-idx={idx}
                    >
                      {isChampionshipRound && <div className="championship-icon">🏆</div>}
                      <div className="game-label">{getGameLabel(game)}</div>
                      {options.length === 0 && (
                        <div className="bracket-placeholder">{getRoundPlaceholder(round, totalRounds)}</div>
                      )}
                      {options.map((teamId) => (
                        <button
                          key={teamId}
                          className={`team-btn ${selected === teamId ? 'selected' : ''}`}
                          onClick={() => applyPick(round, game.game_number, teamId)}
                          disabled={bracketLocked || !!entry}
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
          );
        })}
      </div>

      {/* Progress Indicator */}
      {!entry && (
        <div className="bracket-progress">
          {sortedRounds.map((round) => {
            const roundKey = `round${round}`;
            const currentCount = Object.keys(picks[roundKey] || {}).length;
            const requiredCount = requiredPickCounts[round] || 0;

            return (
              <div key={round} className="progress-item">
                <span className="progress-label">{getRoundLabel(round, totalRounds)}</span>
                <span className={`progress-count ${currentCount === requiredCount ? 'complete' : ''}`}>
                  {currentCount}/{requiredCount}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {!entry && (
        <div className="bracket-submit">
          <button
            type="button"
            className="bracket-submit-btn"
            onClick={handleSubmit}
            disabled={!canSubmit || submitLoading || bracketLocked}
          >
            {submitLoading ? 'Submitting...' : 'Create Bracket'}
          </button>
          {!canSubmit && (
            <p className="submit-hint">Complete all picks to submit your bracket</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Bracket;
