import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/axios';
import '../styles/Bracket.css';

const CACHE_TTL_MS = 30_000;

function getCached(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) { sessionStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function setCache(key, data) {
  try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
}

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
  const priorLabel = getRoundLabel(round - 1, totalRounds);
  if (round === 1) return 'Game not scheduled';
  if (round === totalRounds) return `Awaiting ${priorLabel} Results`;
  return `Awaiting ${priorLabel}`;
};

function ActualBracket({ gender = 'boys' }) {
  const navigate = useNavigate();
  const [bracket, setBracket] = useState(null);
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userPicks, setUserPicks] = useState(null);
  const [hasEntry, setHasEntry] = useState(false);
  const [showMyPicks, setShowMyPicks] = useState(true);

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

  const sortedRounds = useMemo(() => {
    return Object.keys(gamesByRound).map(Number).sort((a, b) => a - b);
  }, [gamesByRound]);

  const totalRounds = sortedRounds.length;

  const loadBracket = async () => {
    const cacheKey = `bracket_actual_${gender}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setBracket(cached.bracket);
      setTeams(cached.teams);
      setGames(cached.games);
      setUserPicks(cached.userPicks);
      setHasEntry(cached.hasEntry || false);
      setLoading(false);
      // Still refresh in background (no loading flash)
    } else {
      setLoading(true);
    }

    try {
      // Single combined request: bracket + teams + games + user's entry
      const response = await apiClient.get(`/brackets/active?gender=${gender}&include=entry`);
      const payload = response.data;

      if (!payload?.bracket) {
        setBracket(null);
        setTeams([]);
        setGames([]);
        setUserPicks(null);
        setHasEntry(false);
        return;
      }

      setBracket(payload.bracket);
      setTeams(payload.teams || []);
      setGames(payload.games || []);
      const picks = payload.entry?.picks || null;
      const entryExists = !!payload.entry;
      setUserPicks(picks);
      setHasEntry(entryExists);

      setCache(cacheKey, {
        bracket: payload.bracket,
        teams: payload.teams || [],
        games: payload.games || [],
        userPicks: picks,
        hasEntry: entryExists
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load bracket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBracket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender]);

  const getTeamName = (teamId) => {
    const team = teamById[teamId];
    return team ? team.name : 'TBD';
  };

  const getTeamSeed = (teamId) => {
    const team = teamById[teamId];
    return team ? team.seed : '?';
  };

  const getGameLabel = (game) => {
    if (!game) return 'TBD';
    
    const team1 = teamById[game.team1_id];
    const team2 = teamById[game.team2_id];
    
    if (team1 && team2) {
      return `${team1.seed} vs ${team2.seed}`;
    }
    
    return 'TBD';
  };

  if (loading) {
    return (
      <div className={`bracket-page${gender === 'girls' ? ' bracket-page--girls' : ''}`}>
        <div className="bracket-tabs">
          <button className="bracket-tab" onClick={() => navigate('/bracket')}>Boys</button>
          <button className="bracket-tab" onClick={() => navigate('/girls-bracket')}>Girls</button>
          <button className="bracket-tab" onClick={() => navigate(gender === 'girls' ? '/girls-bracket-leaderboard' : '/bracket-leaderboard')}>Leaderboard</button>
          <button className="bracket-tab bracket-tab--active">Live</button>
        </div>
        <div className="bracket-sub-tabs">
          <button className={`bracket-sub-tab${gender !== 'girls' ? ' bracket-sub-tab--active' : ''}`} onClick={() => navigate('/actual-bracket')}>Boys</button>
          <button className={`bracket-sub-tab${gender === 'girls' ? ' bracket-sub-tab--active' : ''}`} onClick={() => navigate('/girls-actual-bracket')}>Girls</button>
        </div>
        <div className="bracket-header">
          <h1>Live {gender === 'girls' ? 'Girls' : 'Boys'} Bracket</h1>
        </div>
      </div>
    );
  }

  if (!bracket) {
    return (
      <div className={`bracket-page${gender === 'girls' ? ' bracket-page--girls' : ''}`}>
        <div className="bracket-tabs">
          <button className="bracket-tab" onClick={() => navigate('/bracket')}>Boys</button>
          <button className="bracket-tab" onClick={() => navigate('/girls-bracket')}>Girls</button>
          <button className="bracket-tab" onClick={() => navigate(gender === 'girls' ? '/girls-bracket-leaderboard' : '/bracket-leaderboard')}>Leaderboard</button>
          <button className="bracket-tab bracket-tab--active">Live</button>
        </div>
        <div className="bracket-sub-tabs">
          <button className={`bracket-sub-tab${gender !== 'girls' ? ' bracket-sub-tab--active' : ''}`} onClick={() => navigate('/actual-bracket')}>Boys</button>
          <button className={`bracket-sub-tab${gender === 'girls' ? ' bracket-sub-tab--active' : ''}`} onClick={() => navigate('/girls-actual-bracket')}>Girls</button>
        </div>
        <div className="bracket-header">
          <h1>Live {gender === 'girls' ? 'Girls' : 'Boys'} Bracket</h1>
          <p className="bracket-subtitle">No active bracket available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bracket-page actual-bracket-page${gender === 'girls' ? ' bracket-page--girls' : ''}`}>
      <div className="bracket-tabs">
        <button className="bracket-tab" onClick={() => navigate('/bracket')}>Boys</button>
        <button className="bracket-tab" onClick={() => navigate('/girls-bracket')}>Girls</button>
        <button className="bracket-tab" onClick={() => navigate(gender === 'girls' ? '/girls-bracket-leaderboard' : '/bracket-leaderboard')}>Leaderboard</button>
        <button className="bracket-tab bracket-tab--active">Live</button>
      </div>
      <div className="bracket-sub-tabs">
        <button className={`bracket-sub-tab${gender !== 'girls' ? ' bracket-sub-tab--active' : ''}`} onClick={() => navigate('/actual-bracket')}>Boys</button>
        <button className={`bracket-sub-tab${gender === 'girls' ? ' bracket-sub-tab--active' : ''}`} onClick={() => navigate('/girls-actual-bracket')}>Girls</button>
      </div>

      <div className="bracket-header">
        <div>
          <h1>Live {gender === 'girls' ? 'Girls' : 'Boys'} Bracket</h1>
        </div>
        {hasEntry && (
          <button
            className={`bracket-picks-toggle${showMyPicks ? ' bracket-picks-toggle--active' : ''}`}
            onClick={() => setShowMyPicks(v => !v)}
          >
            {showMyPicks ? '👁 Hide My Picks' : '👁 Show My Picks'}
          </button>
        )}
      </div>

      <div className="actual-bracket-info">
        <p>This bracket shows the <strong>actual results</strong> of games as they are completed. Winners are marked with a green checkmark (✓).</p>
      </div>

      {/* Legend */}
      <div className="actual-bracket-legend">
        <h3>Legend</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-box winner"></div>
            <span>Winner (confirmed result)</span>
          </div>
          <div className="legend-item">
            <div className="legend-box loser"></div>
            <span>Eliminated team</span>
          </div>
          <div className="legend-item">
            <div className="legend-box pending"></div>
            <span>Game result pending</span>
          </div>
          {userPicks && showMyPicks && (
            <>
              <div className="legend-item">
                <span style={{fontSize:'14px'}}>📌</span>
                <span>Your pick (pending)</span>
              </div>
              <div className="legend-item">
                <span style={{fontSize:'14px'}}>✅</span>
                <span>Your pick was correct</span>
              </div>
              <div className="legend-item">
                <span style={{fontSize:'14px'}}>❌</span>
                <span>Your pick was wrong</span>
              </div>
            </>
          )}
        </div>
      </div>

      {error && <div className="bracket-alert bracket-alert--error">{error}</div>}

      <div className="bracket-grid">
        {sortedRounds.map((round) => {
          const roundGames = (gamesByRound[round] || []).sort((a, b) => a.game_number - b.game_number);
          const isChampionshipRound = round === sortedRounds[sortedRounds.length - 1] && roundGames.length === 1;

          return (
            <div key={round} className={`bracket-round bracket-round--r${round}`}>
              <h2>{getRoundLabel(round, totalRounds)}</h2>
              <div className="bracket-games">
                {roundGames.map((game, idx) => {
                  const winner = game.winner_team_id;
                  const hasTeams = game.team1_id || game.team2_id;

                  return (
                    <div
                      key={game.id}
                      className={`bracket-game ${isChampionshipRound ? 'championship-game' : ''}`}
                      data-game-idx={idx}
                    >
                      {isChampionshipRound && <div className="championship-icon">🏆</div>}
                      <div className="game-label">{getGameLabel(game)}</div>
                      {!hasTeams && <div className="bracket-placeholder">{getRoundPlaceholder(round, totalRounds)}</div>}
                      {hasTeams && (
                        <>
                          {[game.team1_id, game.team2_id].filter(Boolean).map((teamId) => {
                            const myPick = showMyPicks && userPicks?.[`round${round}`]?.[`game${game.game_number}`] === teamId;
                            const correct = myPick && winner === teamId;
                            const wrong = myPick && winner && winner !== teamId;
                            return (
                              <div
                                key={teamId}
                                className={`team-display ${winner === teamId ? 'winner' : ''} ${winner && winner !== teamId ? 'loser' : ''} ${winner === teamId && isChampionshipRound ? 'champion' : ''} ${myPick ? 'my-pick' : ''} ${correct ? 'my-pick--correct' : ''} ${wrong ? 'my-pick--wrong' : ''}`}
                              >
                                <span className="team-seed">#{getTeamSeed(teamId)}</span>
                                <span className="team-name">{getTeamName(teamId)}</span>
                                {myPick && !winner && <span className="my-pick-badge">📌</span>}
                                {correct && <span className="my-pick-badge">✅</span>}
                                {wrong && <span className="my-pick-badge">❌</span>}
                                {winner === teamId && !myPick && <span className="winner-badge">✓</span>}
                                {winner === teamId && isChampionshipRound && <span className="champion-label">CHAMPION</span>}
                              </div>
                            );
                          })}
                        </>
                      )}
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

export default ActualBracket;
