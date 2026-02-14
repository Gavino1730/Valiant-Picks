import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/axios';
import { formatCurrency } from '../utils/currency';
import '../styles/Bracket.css';


const ROUND_LABELS = {
  1: 'Round 1',
  2: 'Quarterfinals',
  3: 'Semifinals',
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

  useEffect(() => {
    loadBracket();
  }, []);

  const getTeamName = (teamId) => {
    const team = teamById[teamId];
    return team ? team.name : 'TBD';
  };

  const isPickCorrect = (round, gameNumber, pickTeamId) => {
    if (!entry || !entry.picks) return null;
    
    const game = gamesByRound[round]?.find((g) => g.game_number === gameNumber);
    if (!game || !game.winner_team_id) return null;
    
    return game.winner_team_id === pickTeamId;
  };

  const getPickStatusClass = (round, gameNumber, teamId) => {
    if (!entry) return '';
    
    const isCorrect = isPickCorrect(round, gameNumber, teamId);
    if (isCorrect === true) return 'correct';
    if (isCorrect === false) return 'incorrect';
    return '';
  };

  const getActualWinner = (round, gameNumber) => {
    const game = gamesByRound[round]?.find((g) => g.game_number === gameNumber);
    if (!game || !game.winner_team_id) return null;
    return game.winner_team_id;
  };

  const getGameLabel = (game, round) => {
    if (!game) return 'TBD';
    
    const team1 = teamById[game.team1_id];
    const team2 = teamById[game.team2_id];
    
    if (team1 && team2) {
      return `${team1.seed} vs ${team2.seed}`;
    }
    
    return 'TBD';
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

      setMessage('Bracket submitted successfully!');
      
      // Refresh bracket data to show the submission
      await loadBracket();
      
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
      <div className="bracket-page">
        <div className="bracket-header">
          <h1>Championship Bracket</h1>
          <p>Loading bracket...</p>
        </div>
        <div className="bracket-actions">
          <button
            type="button"
            className="bracket-link"
            onClick={() => navigate('/actual-bracket')}
          >
            View Results
          </button>
          <button
            type="button"
            className="bracket-link"
            onClick={() => navigate('/bracket-leaderboard')}
          >
            View Leaderboard
          </button>
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
        <div className="bracket-actions">
          <button
            type="button"
            className="bracket-link"
            onClick={() => navigate('/actual-bracket')}
          >
            View Results
          </button>
          <button
            type="button"
            className="bracket-link"
            onClick={() => navigate('/bracket-leaderboard')}
          >
            View Leaderboard
          </button>
        </div>
      </div>
    );
  }

  const bracketLocked = bracket.status !== 'open';

  return (
    <div className="bracket-page">
      <div className="bracket-header">
        <div>
          <h1>Championship Bracket</h1>
          <p className="bracket-subtitle">3A Mens Basketball Tournament</p>
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

      <div className="beta-warning">
        <div className="beta-warning-content">
          <span className="beta-icon">⚠️</span>
          <div className="beta-text">
            <strong>Feature in Development</strong>
            <p>This bracket feature is not yet in production. Brackets created here will not be saved or scored. This is a preview of the upcoming feature.</p>
          </div>
        </div>
      </div>

      <div className="bracket-actions">
        <button
          type="button"
          className="bracket-link"
          onClick={() => navigate('/actual-bracket')}
        >
          View Results
        </button>
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

      {/* Instructions Section */}
      {!entry && !bracketLocked && (
        <div className="bracket-instructions">
          <div className="instructions-header">
            <h3>How to Use This Bracket</h3>
            <p className="instructions-intro">Make your tournament predictions by selecting teams to advance through each round.</p>
          </div>
          
          <div className="instructions-grid">
            <div className="instruction-card">
              <div className="instruction-number">1</div>
              <h4>Select Teams in Round 1</h4>
              <p>Click on any team name in the first column to select your pick. Only teams you pick will be eligible to advance.</p>
            </div>
            
            <div className="instruction-card">
              <div className="instruction-number">2</div>
              <h4>Watch Picks Cascade</h4>
              <p>As you make picks in Round 1, your selected teams will automatically appear as options in the Quarterfinals.</p>
            </div>
            
            <div className="instruction-card">
              <div className="instruction-number">3</div>
              <h4>Complete All Rounds</h4>
              <p>Continue making picks through each round. You must complete all 8 Round 1 picks, 4 Quarterfinal picks, 2 Semifinal picks, and 1 Championship pick.</p>
            </div>
            
            <div className="instruction-card">
              <div className="instruction-number">4</div>
              <h4>Submit Your Bracket</h4>
              <p>Once all picks are complete, click "Submit Bracket" at the bottom. Your picks are locked and cannot be changed.</p>
            </div>
          </div>

          <div className="bracket-tips">
            <h4>💡 Tips</h4>
            <ul>
              <li><strong>Team Seeds:</strong> Lower numbers (1-4) are stronger teams, higher numbers (13-16) are underdogs</li>
              <li><strong>Balance Your Picks:</strong> Mix upsets with safer choices to maximize points</li>
              <li><strong>Check the Leaderboard:</strong> See other players' scores and learn from top performers</li>
              <li><strong>Blue Highlights:</strong> Selected teams show in blue so you can easily track your picks</li>
            </ul>
          </div>
        </div>
      )}

      <div className="bracket-grid">
        {/* Round 1 - 8 games */}
        <div className="bracket-round bracket-round--r1">
          <h2>{ROUND_LABELS[1]}</h2>
          <div className="bracket-games">
            {getR1Games().map((game, idx) => {
              const winner = game.winner_team_id;
              const selected = picks.round1[makeGameKey(game.game_number)];
              return (
                <div key={game.id} className="bracket-game" data-game-idx={idx}>
                  <div className="game-label">{getGameLabel(game, 1)}</div>
                  {[game.team1_id, game.team2_id].map((teamId, tidx) => (
                    <button
                      key={teamId || tidx}
                      className={`team-btn ${selected === teamId ? 'selected' : ''} ${getPickStatusClass(1, game.game_number, teamId)}`}
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

        {/* Round 2 - 4 games */}
        <div className="bracket-round bracket-round--r2">
          <h2>{ROUND_LABELS[2]}</h2>
          <div className="bracket-games">
            {[1, 2, 3, 4].map((gameNum) => {
              const options = getR2Options(gameNum);
              const game = gamesByRound[2]?.find((g) => g.game_number === gameNum);
              const winner = game?.winner_team_id;
              const selected = picks.round2[makeGameKey(gameNum)];
              const actualWinner = getActualWinner(2, gameNum);
              const showActualWinner = entry && actualWinner && selected && selected !== actualWinner;

              return (
                <div key={gameNum} className="bracket-game" data-game-idx={gameNum - 1}>
                  <div className="game-label">{getGameLabel(game, 2)}</div>
                  {options.length === 0 && <div className="bracket-placeholder">—</div>}
                  {options.map((teamId) => (
                    <button
                      key={teamId}
                      className={`team-btn ${selected === teamId ? 'selected' : ''} ${getPickStatusClass(2, gameNum, teamId)}`}
                      onClick={() => applyRound2Pick(gameNum, teamId)}
                      disabled={bracketLocked || !!entry}
                    >
                      <span className="team-name">{getTeamName(teamId)}</span>
                      {winner === teamId && <span className="winner-badge">✓</span>}
                    </button>
                  ))}
                  {showActualWinner && (
                    <div className="actual-winner-display">
                      <span className="actual-winner-label">Actual Winner:</span>
                      <span className="actual-winner-name">{getTeamName(actualWinner)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Round 3 - 2 games (Semifinals) */}
        <div className="bracket-round bracket-round--r3">
          <h2>{ROUND_LABELS[3]}</h2>
          <div className="bracket-games">
            {[1, 2].map((gameNum) => {
              const options = getR3Options(gameNum);
              const game = gamesByRound[3]?.find((g) => g.game_number === gameNum);
              const winner = game?.winner_team_id;
              const selected = picks.round3[makeGameKey(gameNum)];
              const actualWinner = getActualWinner(3, gameNum);
              const showActualWinner = entry && actualWinner && selected && selected !== actualWinner;

              return (
                <div key={gameNum} className="bracket-game" data-game-idx={gameNum - 1}>
                  <div className="game-label">{getGameLabel(game, 3)}</div>
                  {options.length === 0 && <div className="bracket-placeholder">—</div>}
                  {options.map((teamId) => (
                    <button
                      key={teamId}
                      className={`team-btn ${selected === teamId ? 'selected' : ''} ${getPickStatusClass(3, gameNum, teamId)}`}
                      onClick={() => applyRound3Pick(gameNum, teamId)}
                      disabled={bracketLocked || !!entry}
                    >
                      <span className="team-name">{getTeamName(teamId)}</span>
                      {winner === teamId && <span className="winner-badge">✓</span>}
                    </button>
                  ))}
                  {showActualWinner && (
                    <div className="actual-winner-display">
                      <span className="actual-winner-label">Actual Winner:</span>
                      <span className="actual-winner-name">{getTeamName(actualWinner)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Round 4 (Championship) */}
        <div className="bracket-round bracket-round--r4">
          <h2>{ROUND_LABELS[4]}</h2>
          <div className="bracket-games">
            {(() => {
              const options = getR4Options();
              const game = gamesByRound[4]?.[0];
              const winner = game?.winner_team_id;
              const selected = picks.round4.game1;
              const actualWinner = getActualWinner(4, 1);
              const showActualWinner = entry && actualWinner && selected && selected !== actualWinner;

              return (
                <div className="bracket-game championship-game">
                  <div className="championship-icon">🏆</div>
                  {options.length === 0 && <div className="bracket-placeholder">—</div>}
                  {options.map((teamId) => (
                    <button
                      key={teamId}
                      className={`team-btn ${selected === teamId ? 'selected' : ''} ${getPickStatusClass(4, 1, teamId)}`}
                      onClick={() => applyRound4Pick(teamId)}
                      disabled={bracketLocked || !!entry}
                    >
                      <span className="team-name">{getTeamName(teamId)}</span>
                      {winner === teamId && <span className="winner-badge">✓</span>}
                    </button>
                  ))}
                  {showActualWinner && (
                    <div className="actual-winner-display championship-winner">
                      <span className="actual-winner-label">Actual Champion:</span>
                      <span className="actual-winner-name">{getTeamName(actualWinner)}</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      {!entry && (
        <div className="bracket-progress">
          <div className="progress-item">
            <span className="progress-label">Round 1</span>
            <span className={`progress-count ${Object.keys(picks.round1).length === 8 ? 'complete' : ''}`}>
              {Object.keys(picks.round1).length}/8
            </span>
          </div>
          <div className="progress-item">
            <span className="progress-label">Quarterfinals</span>
            <span className={`progress-count ${Object.keys(picks.round2).length === 4 ? 'complete' : ''}`}>
              {Object.keys(picks.round2).length}/4
            </span>
          </div>
          <div className="progress-item">
            <span className="progress-label">Semifinals</span>
            <span className={`progress-count ${Object.keys(picks.round3).length === 2 ? 'complete' : ''}`}>
              {Object.keys(picks.round3).length}/2
            </span>
          </div>
          <div className="progress-item">
            <span className="progress-label">Championship</span>
            <span className={`progress-count ${picks.round4.game1 !== undefined ? 'complete' : ''}`}>
              {picks.round4.game1 !== undefined ? '1' : '0'}/1
            </span>
          </div>
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
            {submitLoading ? 'Submitting...' : 'Submit Bracket'}
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
