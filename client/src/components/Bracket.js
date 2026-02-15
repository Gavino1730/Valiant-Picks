import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const [entryStats, setEntryStats] = useState(null);
  const [entryStatsError, setEntryStatsError] = useState('');
  const [recentAdvance, setRecentAdvance] = useState(null);

  const bracketScrollRef = useRef(null);
  const bracketGridRef = useRef(null);
  const roundRefs = useRef({});

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

  useEffect(() => {
    if (!recentAdvance) return;

    const timer = setTimeout(() => {
      setRecentAdvance(null);
    }, 700);

    return () => clearTimeout(timer);
  }, [recentAdvance]);

  useEffect(() => {
    if (!bracket?.id || entry) return;

    const loadEntryStats = async () => {
      try {
        setEntryStatsError('');
        const response = await apiClient.get(`/brackets/${bracket.id}/entry-stats`);
        setEntryStats(response.data || null);
        setEntryStatsError('');
      } catch (err) {
        setEntryStatsError('Stats unavailable');
      }
    };

    loadEntryStats();
  }, [bracket?.id, entry]);

  const isPickCorrect = (round, gameNumber, pickTeamId) => {
    if (!entry || !entry.picks) return null;
    
    const game = gamesByRound[round]?.find((g) => g.game_number === gameNumber);
    if (!game || !game.winner_team_id) return null;
    
    return game.winner_team_id === pickTeamId;
  };

  const getTeamName = (teamId) => {
    const team = teamById[teamId];
    return team ? team.name : 'TBD';
  };

  const getTeamSeed = (teamId) => {
    const team = teamById[teamId];
    return team ? team.seed : '?';
  };

  const getRoundPick = (round, gameNumber) => {
    return picks[`round${round}`]?.[makeGameKey(gameNumber)];
  };

  const getDerivedTeamIds = (round, gameNumber, game) => {
    if (round === 1) return [game.team1_id, game.team2_id];

    const prevRound = round - 1;
    const prevGame1 = (gameNumber * 2) - 1;
    const prevGame2 = gameNumber * 2;
    const team1Id = getRoundPick(prevRound, prevGame1) || null;
    const team2Id = getRoundPick(prevRound, prevGame2) || null;

    if (team1Id || team2Id) return [team1Id, team2Id];
    return [game.team1_id, game.team2_id];
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

  const scrollToRound = (round) => {
    const node = roundRefs.current[round];
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  const scrollToBracket = () => {
    if (!bracketGridRef.current) return;
    bracketGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const triggerAdvance = (round, gameNumber, teamId) => {
    const nextRound = round + 1;
    if (nextRound > 4) return;

    const nextGameNumber = Math.ceil(gameNumber / 2);
    setRecentAdvance({ round: nextRound, gameNumber: nextGameNumber, teamId });

    setTimeout(() => {
      scrollToRound(nextRound);
    }, 140);
  };

  const chooseWinner = (team1Id, team2Id, mode) => {
    if (!team1Id || !team2Id) return team1Id || team2Id || null;

    if (mode === 'random') {
      return Math.random() > 0.5 ? team1Id : team2Id;
    }

    const seed1 = Number(teamById[team1Id]?.seed ?? 99);
    const seed2 = Number(teamById[team2Id]?.seed ?? 99);

    if (mode === 'favorites') {
      return seed1 <= seed2 ? team1Id : team2Id;
    }

    return seed1 >= seed2 ? team1Id : team2Id;
  };

  const buildAutoPicks = (mode) => {
    const round1Games = (gamesByRound[1] || []).sort((a, b) => a.game_number - b.game_number);
    const round2Games = (gamesByRound[2] || []).sort((a, b) => a.game_number - b.game_number);
    const round3Games = (gamesByRound[3] || []).sort((a, b) => a.game_number - b.game_number);
    const round4Games = (gamesByRound[4] || []).sort((a, b) => a.game_number - b.game_number);

    const round1 = {};
    const round2 = {};
    const round3 = {};
    const round4 = {};

    round1Games.forEach((game) => {
      const winner = chooseWinner(game.team1_id, game.team2_id, mode);
      if (winner) {
        round1[makeGameKey(game.game_number)] = winner;
      }
    });

    round2Games.forEach((game) => {
      const team1Id = round1[makeGameKey((game.game_number * 2) - 1)];
      const team2Id = round1[makeGameKey(game.game_number * 2)];
      const winner = chooseWinner(team1Id, team2Id, mode);
      if (winner) {
        round2[makeGameKey(game.game_number)] = winner;
      }
    });

    round3Games.forEach((game) => {
      const team1Id = round2[makeGameKey((game.game_number * 2) - 1)];
      const team2Id = round2[makeGameKey(game.game_number * 2)];
      const winner = chooseWinner(team1Id, team2Id, mode);
      if (winner) {
        round3[makeGameKey(game.game_number)] = winner;
      }
    });

    round4Games.forEach((game) => {
      const team1Id = round3[makeGameKey((game.game_number * 2) - 1)];
      const team2Id = round3[makeGameKey(game.game_number * 2)];
      const winner = chooseWinner(team1Id, team2Id, mode);
      if (winner) {
        round4[makeGameKey(game.game_number)] = winner;
      }
    });

    if (round4Games.length === 0) {
      const team1Id = round3[makeGameKey(1)];
      const team2Id = round3[makeGameKey(2)];
      const winner = chooseWinner(team1Id, team2Id, mode);
      if (winner) {
        round4.game1 = winner;
      }
    }

    return { round1, round2, round3, round4 };
  };

  const handleAutoPick = (mode) => {
    if (bracketLocked || entry) return;
    setError('');
    setMessage('');
    setPicks(buildAutoPicks(mode));
  };

  const placeholderByRound = {
    2: 'Finish Round 1 to unlock',
    3: 'Finish Quarterfinals to unlock',
    4: 'Finish Semifinals to unlock'
  };

  const renderGame = (game, round) => {
    if (!game) return null;

    const gameNumber = game.game_number;
    const bracketLocked = bracket?.status !== 'open';
    const isDisabled = bracketLocked || !!entry;
    const roundKey = `round${round}`;
    const pickKey = makeGameKey(gameNumber);
    const selectedTeamId = picks[roundKey]?.[pickKey];
    const teamIds = getDerivedTeamIds(round, gameNumber, game);
    const hasTeams = teamIds.every(Boolean);

    const handleTeamClick = (teamId) => {
      if (isDisabled || !teamId) return;

      if (round === 1) {
        applyRound1Pick(gameNumber, teamId);
      } else if (round === 2) {
        applyRound2Pick(gameNumber, teamId);
      } else if (round === 3) {
        applyRound3Pick(gameNumber, teamId);
      } else if (round === 4) {
        applyRound4Pick(teamId);
      }

      triggerAdvance(round, gameNumber, teamId);
    };

    const getPickStatus = (teamId) => {
      if (!entry || !teamId) return '';
      const isCorrect = isPickCorrect(round, gameNumber, teamId);
      if (isCorrect === true) return 'correct';
      if (isCorrect === false) return 'incorrect';
      return '';
    };

    return (
      <div key={game.id} className={`bracket-game ${round === 4 ? 'championship-game' : ''}`}>
        {round === 4 && <div className="championship-icon">🏆</div>}
        <div className="game-label">Game {gameNumber}</div>
        {round === 1 && !selectedTeamId && !isDisabled && (
          <div className="bracket-ghost-hint">Click a team to advance</div>
        )}
        {!hasTeams && (
          <div className="bracket-placeholder">{placeholderByRound[round] || 'Awaiting teams'}</div>
        )}
        {hasTeams &&
          teamIds.map((teamId, idx) => {
            const isSelected = selectedTeamId === teamId;
            const pickStatus = getPickStatus(teamId);
            const isWinner = game.winner_team_id === teamId;
            const shouldAdvance =
              recentAdvance &&
              recentAdvance.round === round &&
              recentAdvance.gameNumber === gameNumber &&
              recentAdvance.teamId === teamId;

            return (
              <button
                key={teamId || idx}
                className={`team-btn ${isSelected ? 'selected' : ''} ${pickStatus} ${shouldAdvance ? 'just-advanced' : ''}`}
                onClick={() => handleTeamClick(teamId)}
                disabled={isDisabled || !teamId}
              >
                <span className="team-seed">#{getTeamSeed(teamId)}</span>
                <span className="team-name">{getTeamName(teamId)}</span>
                {isWinner && <span className="winner-badge">✓</span>}
              </button>
            );
          })}
      </div>
    );
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
            View Live Bracket
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
  const roundTargets = { 1: 8, 2: 4, 3: 2, 4: 1 };
  const roundCounts = {
    1: Object.keys(picks.round1).length,
    2: Object.keys(picks.round2).length,
    3: Object.keys(picks.round3).length,
    4: picks.round4.game1 !== undefined ? 1 : 0
  };
  const round1Complete = roundCounts[1] === roundTargets[1];
  const round1Started = roundCounts[1] > 0 && !round1Complete;
  const showQuickPicks = !entry && !bracketLocked;

  return (
    <div className="bracket-page">
      {!entry && !bracketLocked && (
        <div className="bracket-start-cta">
          <button type="button" className="bracket-start-button" onClick={scrollToBracket}>
            Start My Bracket
          </button>
          <p className="bracket-start-subtext">Takes about 2 minutes. No money. Just for fun.</p>
        </div>
      )}
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
          View Live Bracket
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

      {showQuickPicks && (
        <div className="bracket-quick-picks">
          <span className="quick-picks-label">Quick Pick</span>
          <button
            type="button"
            className="quick-pick-btn"
            onClick={() => handleAutoPick('favorites')}
            disabled={bracketLocked || entry}
          >
            Auto fill favorites
          </button>
          <button
            type="button"
            className="quick-pick-btn"
            onClick={() => handleAutoPick('random')}
            disabled={bracketLocked || entry}
          >
            Auto fill random
          </button>
          <button
            type="button"
            className="quick-pick-btn"
            onClick={() => handleAutoPick('higher-seeds')}
            disabled={bracketLocked || entry}
          >
            Auto fill higher seeds
          </button>
        </div>
      )}

      {error && <div className="bracket-alert bracket-alert--error">{error}</div>}
      {message && <div className="bracket-alert bracket-alert--success">{message}</div>}

      {entry && (
        <div className="bracket-success">
          <div className="bracket-success__header">
            <h3>Bracket submitted!</h3>
            <p>Your picks are locked in. Good luck.</p>
          </div>
          <div className="bracket-snapshot">
            <div className="snapshot-item">
              <span className="snapshot-label">Champion</span>
              <span className="snapshot-value">{getTeamName(picks.round4.game1)}</span>
            </div>
            <div className="snapshot-item">
              <span className="snapshot-label">Round 1 picks</span>
              <span className="snapshot-value">{roundCounts[1]} locked</span>
            </div>
            <div className="snapshot-item">
              <span className="snapshot-label">Final four</span>
              <span className="snapshot-value">{roundCounts[3]} picks</span>
            </div>
          </div>
          <div className="bracket-success__actions">
            <button type="button" className="bracket-link" onClick={() => navigate('/bracket-leaderboard')}>
              View Leaderboard
            </button>
            <button type="button" className="bracket-link" onClick={() => navigate('/actual-bracket')}>
              View Live Bracket
            </button>
          </div>
        </div>
      )}

      {bracketLocked && !entry && (
        <div className="bracket-alert bracket-alert--info">Bracket entries are locked.</div>
      )}

      {/* Instructions Section */}
      {!entry && !bracketLocked && (
        <div className="bracket-instructions">
          <div className="instructions-header">
            <h3>How to Pick Your Bracket</h3>
            <p className="instructions-intro">Pick the teams you think will win each game. Correct picks earn you points and Valiant Bucks!</p>
          </div>
          
          <div className="instructions-grid">
            <div className="instruction-card">
              <div className="instruction-number">1</div>
              <h4>Click a Team to Pick It</h4>
              <p>Click on the team name you want to advance. You'll pick winners for all 8 games in Round 1 first. Your picks turn blue when selected.</p>
            </div>
            
            <div className="instruction-card">
              <div className="instruction-number">2</div>
              <h4>Move to Next Rounds</h4>
              <p>After picking all Round 1 winners, those teams appear in Quarterfinals. Keep picking until all 4 rounds are done. You need 15 total picks.</p>
            </div>
            
            <div className="instruction-card">
              <div className="instruction-number">3</div>
              <h4>How You Get Paid</h4>
              <p><strong>Each correct pick earns:</strong> Round 1: 5 pts • Quarterfinals: 10 pts • Semifinals: 20 pts • Championship: 40 pts
              <br/><strong>Example:</strong> 10 correct picks = 100 points × ${bracket?.payout_per_point || 0} per point = ${10 * (bracket?.payout_per_point || 0)} Valiant Bucks
              <br/><strong>Max possible:</strong> All 15 picks correct = 160 points × ${bracket?.payout_per_point || 0} per point = ${160 * (bracket?.payout_per_point || 0)} Valiant Bucks</p>
            </div>
            
            <div className="instruction-card">
              <div className="instruction-number">4</div>
              <h4>Submit When Done</h4>
              <p>When all 15 picks are complete, click "Submit Bracket". Once you submit, you can't change your picks. The payout is based on how many you get right!</p>
            </div>
          </div>

          <div className="bracket-tips">
            <h4>💡 Quick Tips</h4>
            <ul>
              <li><strong>Balance Risk:</strong> Mix safe teams (seed 1-4) with some upsets to score big</li>
              <li><strong>Higher seeds beat lower seeds more:</strong> Seed 1 usually beats seed 16, but upsets happen!</li>
              <li><strong>Check the Leaderboard:</strong> See how other players picked - learn from the top scorers</li>
              <li><strong>Entry fee:</strong> Make sure you have enough Valiant Bucks for the entry fee shown above</li>
            </ul>
          </div>
        </div>
      )}

      {!entry && !bracketLocked && entryStats?.totalEntries > 0 && (
        <div className="bracket-leaderboard-tease">
          <h4>What other players picked</h4>
          <div className="tease-items">
            {entryStats.topChampionPick && (
              <p>
                {entryStats.topChampionPick.count} people picked {entryStats.topChampionPick.teamName} to win.
              </p>
            )}
            {entryStats.rareUpset && (
              <p>
                Only {entryStats.rareUpset.percent}% picked {entryStats.rareUpset.teamName} as an upset.
              </p>
            )}
          </div>
        </div>
      )}
      {!entry && !bracketLocked && entryStatsError && (
        <div className="bracket-alert bracket-alert--info">Leaderboard stats are warming up.</div>
      )}

      <div className="bracket-scroll" ref={bracketScrollRef}>
        <div className="bracket-grid" ref={bracketGridRef}>
          {[1, 2, 3, 4].map((round) => (
            <div
              key={round}
              ref={(node) => {
                if (node) roundRefs.current[round] = node;
              }}
              data-round={ROUND_LABELS[round]}
              className={`bracket-round bracket-round--r${round}`}
            >
              <div className="round-header">
                <h2>{ROUND_LABELS[round]}</h2>
                <span
                  className={`round-point-tag round-point-tag--r${round}`}
                  title={round === 1 ? 'Low points' : 'Worth more points'}
                >
                  {round === 1 && 'Low points'}
                  {round === 4 && 'Big points'}
                  {round === 2 && 'More points'}
                  {round === 3 && 'More points'}
                </span>
              </div>
              {round === 1 && round1Started && (
                <div className="round-hint">Nice. Keep going.</div>
              )}
            <div className="bracket-games">
              {(gamesByRound[round] || [])
                .sort((a, b) => a.game_number - b.game_number)
                .map((game) => renderGame(game, round))}
            </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Indicator */}
      {!entry && (
        <div className="bracket-progress">
          <div className="progress-item">
            <span className="progress-label">Round 1</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min((roundCounts[1] / roundTargets[1]) * 100, 100)}%` }}
              />
            </div>
            <span className={`progress-count ${roundCounts[1] === roundTargets[1] ? 'complete' : ''}`}>
              {roundCounts[1]}/{roundTargets[1]}
            </span>
          </div>
          <div className="progress-item">
            <span className="progress-label">Quarterfinals</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min((roundCounts[2] / roundTargets[2]) * 100, 100)}%` }}
              />
            </div>
            <span className={`progress-count ${roundCounts[2] === roundTargets[2] ? 'complete' : ''}`}>
              {roundCounts[2]}/{roundTargets[2]}
            </span>
          </div>
          <div className="progress-item">
            <span className="progress-label">Semifinals</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min((roundCounts[3] / roundTargets[3]) * 100, 100)}%` }}
              />
            </div>
            <span className={`progress-count ${roundCounts[3] === roundTargets[3] ? 'complete' : ''}`}>
              {roundCounts[3]}/{roundTargets[3]}
            </span>
          </div>
          <div className="progress-item">
            <span className="progress-label">Championship</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min((roundCounts[4] / roundTargets[4]) * 100, 100)}%` }}
              />
            </div>
            <span className={`progress-count ${roundCounts[4] === roundTargets[4] ? 'complete' : ''}`}>
              {roundCounts[4]}/{roundTargets[4]}
            </span>
          </div>
          {round1Complete && (
            <div className="round-complete">Round 1 complete, 8 picks locked.</div>
          )}
        </div>
      )}

      {!entry && (
        <div className="bracket-submit">
          <div className="bracket-confirm">
            <h4>Before you submit</h4>
            <ul>
              <li>You can’t edit after submitting</li>
              <li>This is just for fun</li>
              <li>Leaderboard updates after games start</li>
            </ul>
          </div>
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
