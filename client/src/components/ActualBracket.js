import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/axios';
import '../styles/Bracket.css';

const ROUND_LABELS = {
  1: 'Round 1',
  2: 'Quarterfinals',
  3: 'Semifinals',
  4: 'Championship'
};

function ActualBracket() {
  const navigate = useNavigate();
  const [bracket, setBracket] = useState(null);
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="bracket-page">
        <div className="bracket-header">
          <h1>Actual Bracket Results</h1>
          <p>Loading bracket...</p>
        </div>
      </div>
    );
  }

  if (!bracket) {
    return (
      <div className="bracket-page">
        <div className="bracket-header">
          <h1>Actual Bracket Results</h1>
          <p className="bracket-subtitle">No active bracket available.</p>
        </div>
      </div>
    );
  }

  const getR1Games = () => gamesByRound[1]?.sort((a, b) => a.game_number - b.game_number) || [];

  return (
    <div className="bracket-page actual-bracket-page">
      <div className="bracket-header">
        <div>
          <h1>Actual Bracket Results</h1>
          <p className="bracket-subtitle">3A Mens Basketball Tournament - True Outcomes</p>
        </div>
      </div>

      <div className="actual-bracket-info">
        <p>This bracket shows the <strong>actual results</strong> of games as they are completed. Winners are marked with a green checkmark (✓).</p>
      </div>

      <div className="bracket-actions">
        <button
          type="button"
          className="bracket-link"
          onClick={() => navigate('/bracket')}
        >
          View My Bracket
        </button>
        <button
          type="button"
          className="bracket-link"
          onClick={() => navigate('/bracket-leaderboard')}
        >
          View Leaderboard
        </button>
      </div>

      {error && <div className="bracket-alert bracket-alert--error">{error}</div>}

      <div className="bracket-grid">
        {/* Round 1 - 8 games */}
        <div className="bracket-round bracket-round--r1">
          <h2>{ROUND_LABELS[1]}</h2>
          <div className="bracket-games">
            {getR1Games().map((game, idx) => {
              const winner = game.winner_team_id;
              return (
                <div key={game.id} className="bracket-game" data-game-idx={idx}>
                  <div className="game-label">{getGameLabel(game)}</div>
                  {[game.team1_id, game.team2_id].map((teamId, tidx) => (
                    <div
                      key={teamId || tidx}
                      className={`team-display ${winner === teamId ? 'winner' : ''} ${winner && winner !== teamId ? 'loser' : ''}`}
                    >
                      <span className="team-seed">#{getTeamSeed(teamId)}</span>
                      <span className="team-name">{getTeamName(teamId)}</span>
                      {winner === teamId && <span className="winner-badge">✓</span>}
                    </div>
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
            {(gamesByRound[2] || []).sort((a, b) => a.game_number - b.game_number).map((game, idx) => {
              const winner = game.winner_team_id;
              const hasTeams = game.team1_id || game.team2_id;
              
              return (
                <div key={game.id} className="bracket-game" data-game-idx={idx}>
                  <div className="game-label">{getGameLabel(game)}</div>
                  {!hasTeams && <div className="bracket-placeholder">Awaiting Round 1 Results</div>}
                  {hasTeams && (
                    <>
                      {[game.team1_id, game.team2_id].filter(Boolean).map((teamId) => (
                        <div
                          key={teamId}
                          className={`team-display ${winner === teamId ? 'winner' : ''} ${winner && winner !== teamId ? 'loser' : ''}`}
                        >
                          <span className="team-seed">#{getTeamSeed(teamId)}</span>
                          <span className="team-name">{getTeamName(teamId)}</span>
                          {winner === teamId && <span className="winner-badge">✓</span>}
                        </div>
                      ))}
                    </>
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
            {(gamesByRound[3] || []).sort((a, b) => a.game_number - b.game_number).map((game, idx) => {
              const winner = game.winner_team_id;
              const hasTeams = game.team1_id || game.team2_id;
              
              return (
                <div key={game.id} className="bracket-game" data-game-idx={idx}>
                  <div className="game-label">{getGameLabel(game)}</div>
                  {!hasTeams && <div className="bracket-placeholder">Awaiting Quarterfinal Results</div>}
                  {hasTeams && (
                    <>
                      {[game.team1_id, game.team2_id].filter(Boolean).map((teamId) => (
                        <div
                          key={teamId}
                          className={`team-display ${winner === teamId ? 'winner' : ''} ${winner && winner !== teamId ? 'loser' : ''}`}
                        >
                          <span className="team-seed">#{getTeamSeed(teamId)}</span>
                          <span className="team-name">{getTeamName(teamId)}</span>
                          {winner === teamId && <span className="winner-badge">✓</span>}
                        </div>
                      ))}
                    </>
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
              const game = gamesByRound[4]?.[0];
              if (!game) return <div className="bracket-placeholder">Championship game not scheduled</div>;
              
              const winner = game.winner_team_id;
              const hasTeams = game.team1_id || game.team2_id;

              return (
                <div className="bracket-game championship-game">
                  <div className="championship-icon">🏆</div>
                  {!hasTeams && <div className="bracket-placeholder">Awaiting Semifinal Results</div>}
                  {hasTeams && (
                    <>
                      {[game.team1_id, game.team2_id].filter(Boolean).map((teamId) => (
                        <div
                          key={teamId}
                          className={`team-display ${winner === teamId ? 'winner champion' : ''} ${winner && winner !== teamId ? 'loser' : ''}`}
                        >
                          <span className="team-seed">#{getTeamSeed(teamId)}</span>
                          <span className="team-name">{getTeamName(teamId)}</span>
                          {winner === teamId && (
                            <>
                              <span className="winner-badge">✓</span>
                              <span className="champion-label">CHAMPION</span>
                            </>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
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
        </div>
      </div>
    </div>
  );
}

export default ActualBracket;
