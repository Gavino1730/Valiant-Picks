import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/axios';
import '../styles/Teams.css';

function Teams() {
  const [activeTab, setActiveTab] = useState('boys');
  const [contentTab, setContentTab] = useState('roster'); // 'schedule' or 'roster'
  const [teams, setTeams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scheduleGames, setScheduleGames] = useState([]);

  const getHardcodedTeams = useCallback(() => {
    return [
      {
        id: 'boys',
        name: 'Valiants Boys Basketball',
        type: 'Boys Basketball',
        record_wins: 4,
        record_losses: 1,
        league_record: '0-0',
        ranking: 3,
        coach_name: 'Bryan Fraser',
        coach_bio: 'Head Coach Bryan Fraser brings 11 seasons of experience with a disciplined, defense-first approach.',
        description: 'A balanced roster that values spacing, tempo, and connected team defense. The focus is on efficient possessions and consistent execution.',
        schedule: [],
        players: [
          { number: 1, name: 'Cooper Bonnett', position: 'G', grade: '12', height: '5\'10"', bio: 'Senior guard and primary ball-handler who sets the pace and creates looks for teammates.' },
          { number: 2, name: 'Alex Post', position: 'G', grade: '11', height: '6\'1"', bio: 'Scoring guard with range and touch, reliable in late-clock situations.' },
          { number: 3, name: 'Gavin Galan', position: 'F', grade: '12', height: '6\'2"', bio: 'Physical forward who rebounds and defends multiple spots.' },
          { number: 4, name: 'Kye Fixter', position: 'F', grade: '11', height: '6\'0"', bio: 'Wing scorer with a quick first step and a steady mid-range game.' },
          { number: 5, name: 'Marcos Mueller', position: 'G', grade: '12', height: '6\'3"', bio: 'Combo guard who defends hard and can stretch the floor.' },
          { number: 10, name: 'Matthew Gunther', position: 'G', grade: '12', height: '5\'9"', bio: 'Steady point guard who organizes the offense and values the ball.' },
          { number: 11, name: 'Tyler Eddy', position: 'G', grade: '10', height: '6\'0"', bio: 'Athletic guard with aggressive drives and energy in transition.' },
          { number: 15, name: 'Elijah Schaal', position: 'G', grade: '12', height: '6\'0"', bio: 'High-motor guard who rebounds and makes smart reads.' },
          { number: 20, name: 'Hank Lomber', position: 'F', grade: '11', height: '6\'3"', bio: 'Versatile forward who hits open threes and crashes the glass.' },
          { number: 22, name: 'Sam Robbins', position: 'F', grade: '10', height: '6\'7"', bio: 'Tall forward with touch around the rim and strong positioning.' },
          { number: 23, name: 'Garrett Frank', position: 'G', grade: '11', height: '5\'11"', bio: 'Explosive guard who attacks the rim and pressures the ball.' },
          { number: 24, name: 'Michael Mehta', position: 'G', grade: '12', height: '6\'1"', bio: 'Sharpshooter with quick release and smart spacing instincts.' },
          { number: 44, name: 'Liam Plep', position: 'C', grade: '12', height: '6\'8"', bio: 'Rim-protecting center who sets solid screens and finishes inside.' }
        ]
      },
      {
        id: 'girls',
        name: 'Valiants Girls Basketball',
        type: 'Girls Basketball',
        record_wins: 4,
        record_losses: 1,
        league_record: '0-0',
        ranking: 8,
        coach_name: 'Patrick Thomas',
        coach_bio: 'Head Coach Patrick Thomas emphasizes conditioning, communication, and disciplined execution.',
        description: 'An up-tempo team that values pressure defense, ball movement, and depth. The approach is consistent energy with smart rotations.',
        schedule: [],
        players: [
          { number: 2, name: 'Brooke Wilson', position: 'G', grade: '12', height: '5\'6"', bio: 'Senior guard and spot-up shooter with consistent range.' },
          { number: 4, name: 'Rachel Pippin', position: 'G', grade: '9', height: '5\'3"', bio: 'Young guard with strong handle and on-ball defense.' },
          { number: 5, name: 'Ava Henry', position: 'F', grade: '12', height: '5\'7"', bio: 'Two-way wing who brings steady effort and rebounding.' },
          { number: 12, name: 'Katelyn Sheridan', position: 'F', grade: '11', height: '5\'10"', bio: 'Forward with length who defends the paint and finishes inside.' },
          { number: 14, name: 'Calista Everson', position: 'G', grade: '12', height: '5\'7"', bio: 'Aggressive guard who pressures the ball and attacks gaps.' },
          { number: 15, name: 'Allison Jacobs', position: 'F', grade: '11', height: '5\'7"', bio: 'Physical forward who rebounds and plays through contact.' },
          { number: 22, name: 'Maya Taha', position: 'P', grade: '10', height: '5\'8"', bio: 'Calm point guard who keeps tempo and makes safe passes.' },
          { number: 23, name: 'Mia Verzani', position: 'G', grade: '11', height: '5\'5"', bio: 'High-energy guard who creates pressure and pushes pace.' },
          { number: 24, name: 'Emmee Kinder', position: 'P', grade: '12', height: '5\'10"', bio: 'Post player who anchors the paint and boxes out.' },
          { number: 31, name: 'Scarlett Thomson', position: 'G', grade: '10', height: '5\'7"', bio: 'Hustle guard who provides defense and transition speed.' },
          { number: 33, name: 'Nicole Arbaugh', position: 'G', grade: '11', height: '5\'5"', bio: 'Gritty guard who competes on defense and battles for loose balls.' },
          { number: 34, name: 'Ava Marshall Thansophon', position: 'G', grade: '10', height: '5\'9"', bio: 'Versatile guard who supports the rotation and brings energy.' }
        ]
      }
    ];
  }, []);

  const fetchTeams = useCallback(async () => {
    const hardcodedData = getHardcodedTeams();
    try {
      setLoading(true);
      const response = await apiClient.get('/teams', {
        timeout: 5000
      });
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Map API data and add IDs for tab selection
        const teamsData = response.data.map(team => ({
          ...team,
          id: team.type && team.type.toLowerCase().includes('boy') ? 'boys' : 'girls',
          // Parse schedule JSON if it's a string, fallback to empty array if null
          schedule: team.schedule 
            ? (typeof team.schedule === 'string' ? JSON.parse(team.schedule) : team.schedule)
            : [],
          // Parse players JSON if it's a string, fallback to empty array if null
          players: team.players
            ? (typeof team.players === 'string' ? JSON.parse(team.players) : team.players)
            : []
        }));
        setTeams(teamsData);
      } else {
        setTeams(hardcodedData);
      }
    } catch (err) {
      setTeams(hardcodedData);
    } finally {
      setLoading(false);
    }
  }, [getHardcodedTeams]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    apiClient.get('/games/schedule')
      .then(res => setScheduleGames(Array.isArray(res.data) ? res.data : []))
      .catch(() => setScheduleGames([]));
  }, []);

  const TeamSection = ({ team }) => {
    const rosterStorageKey = `teamsRosterExpanded:${team.id}`;
    const [searchTerm, setSearchTerm] = useState('');
    const [gradeFilter, setGradeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('number');
    const [expandedPlayers, setExpandedPlayers] = useState(() => {
      try {
        const stored = sessionStorage.getItem(rosterStorageKey);
        return stored ? JSON.parse(stored) : {};
      } catch (err) {
        return {};
      }
    });

    useEffect(() => {
      try {
        const stored = sessionStorage.getItem(rosterStorageKey);
        setExpandedPlayers(stored ? JSON.parse(stored) : {});
      } catch (err) {
        setExpandedPlayers({});
      }
    }, [rosterStorageKey]);

    useEffect(() => {
      try {
        sessionStorage.setItem(rosterStorageKey, JSON.stringify(expandedPlayers));
      } catch (err) {
        // ignore session storage errors
      }
    }, [expandedPlayers, rosterStorageKey]);

    const players = Array.isArray(team.players) ? team.players : [];
    const grades = Array.from(new Set(players.map(player => player.grade))).sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
      return String(a).localeCompare(String(b));
    });

    const filteredPlayers = players
      .filter(player => {
        const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
        const matchesGrade = gradeFilter === 'all' || String(player.grade) === String(gradeFilter);
        return matchesSearch && matchesGrade;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return Number(a.number) - Number(b.number);
      });

    const toggleExpanded = (playerKey) => {
      setExpandedPlayers(prev => ({
        ...prev,
        [playerKey]: !prev[playerKey]
      }));
    };

    const expandAll = () => {
      const next = {};
      filteredPlayers.forEach(player => {
        const key = `${player.number}-${player.name}`;
        next[key] = true;
      });
      setExpandedPlayers(next);
    };

    const collapseAll = () => {
      setExpandedPlayers({});
    };

    const renderRoster = () => (
      <div className="roster-section">
        <h3>Varsity Roster</h3>
        <div className="roster-controls">
          <div className="roster-controls-inputs">
            <label className="roster-control">
              <span>Search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by player name"
              />
            </label>
            <label className="roster-control">
              <span>Grade</span>
              <select
                value={gradeFilter}
                onChange={(event) => setGradeFilter(event.target.value)}
              >
                <option value="all">All</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </label>
            <label className="roster-control">
              <span>Sort</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="number">Jersey #</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>
          <div className="roster-controls-actions">
            <div className="roster-count">{filteredPlayers.length} result{filteredPlayers.length === 1 ? '' : 's'}</div>
            <div className="roster-buttons">
              <button type="button" onClick={expandAll}>Expand all</button>
              <button type="button" onClick={collapseAll}>Collapse all</button>
            </div>
          </div>
        </div>

        <div className="roster-table">
          <div className="roster-header">
            <div className="roster-col-number">#</div>
            <div className="roster-col-name">Player</div>
            <div className="roster-col-grade">Grade</div>
            <div className="roster-col-preview">Description</div>
            <div className="roster-col-expand">Details</div>
          </div>
          <div className="roster-rows">
            {filteredPlayers.map(player => {
              const playerKey = `${player.number}-${player.name}`;
              const isExpanded = Boolean(expandedPlayers[playerKey]);
              return (
                <div
                  key={playerKey}
                  className={`roster-row ${isExpanded ? 'expanded' : ''}`}
                >
                  <div
                    className="roster-row-main"
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onClick={() => toggleExpanded(playerKey)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggleExpanded(playerKey);
                      }
                    }}
                  >
                    <span className="player-number">#{player.number}</span>
                    <span className="player-name">{player.name}</span>
                    <span className="player-grade">Grade {player.grade}</span>
                    <span className="player-preview">{player.bio}</span>
                    <span className="player-expand" aria-hidden="true">{isExpanded ? '−' : '+'}</span>
                  </div>
                  <div className="roster-row-details" aria-hidden={!isExpanded}>
                    <p className="player-bio">{player.bio}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );

    return (
      <div className="team-section">
        <div className="team-header">
          <h2>{team.name}</h2>
          <div className="team-stats">
            <div className="stat">
              <span className="label">Overall Record</span>
              <span className="value">{team.record_wins}-{team.record_losses}</span>
            </div>
            <div className="stat">
              <span className="label">League Record</span>
              <span className="value">{team.league_record}</span>
            </div>
            <div className="stat">
              <span className="label">Rank</span>
              <span className="value">#{team.ranking}</span>
            </div>
          </div>
        </div>

        <div className="team-info-section">
          <div className="coaching-staff">
            <h3>Head Coach</h3>
            <div className="coach-info">
              <div className="coach">
                <strong>{team.coach_name}</strong>
              </div>
            </div>
            {team.coach_bio && (
              <p className="coach-bio">{team.coach_bio}</p>
            )}
          </div>

          <div className="team-description">
            <h3>About the Team</h3>
            <p>{team.description}</p>
          </div>
        </div>

        <div className="content-tabs">
          <button 
            className={`content-tab-btn ${contentTab === 'roster' ? 'active' : ''}`}
            onClick={() => setContentTab('roster')}
          >
            👥 Roster
          </button>
          <button 
            className={`content-tab-btn ${contentTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setContentTab('schedule')}
          >
            📅 Schedule
          </button>
        </div>

        <div className="desktop-roster-section">
          {renderRoster()}
        </div>

        {contentTab === 'roster' && (
          <div className="mobile-roster">
            {renderRoster()}
          </div>
        )}

        {contentTab === 'schedule' && (
          <div className="schedule-section">
            <h3>Varsity Schedule</h3>
            <div className="schedule-table">
              <div className="schedule-header">
                <div>Result</div>
                <div>Score</div>
                <div>Type</div>
                <div>Date</div>
                <div>Time</div>
                <div>Opponent</div>
                <div>Location</div>
              </div>
              {(() => {
                // Fuzzy match: handles 'Boys Basketball' === 'Boys Basketball',
                // or mismatches like 'Boys' vs 'Boys Basketball'
                const tt = (team.type || '').toLowerCase();
                const teamGames = scheduleGames.filter(g => {
                  const gt = (g.team_type || '').toLowerCase();
                  return gt === tt || gt.includes(tt) || tt.includes(gt);
                });

                const formatDate = (dateStr) => {
                  if (!dateStr) return '';
                  const parts = dateStr.split('-');
                  if (parts.length !== 3) return dateStr;
                  const [y, m, d] = parts;
                  return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y.slice(2)}`;
                };

                const formatTime = (timeStr) => {
                  if (!timeStr) return '';
                  const [h, m] = timeStr.split(':');
                  const hour = parseInt(h, 10);
                  const min = m || '00';
                  const ampm = hour >= 12 ? 'pm' : 'am';
                  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                  return `${displayHour}:${min} ${ampm}`;
                };

                if (teamGames.length === 0) {
                  return (
                    <div className="schedule-row scheduled" style={{ padding: '1rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                      No games scheduled yet.
                    </div>
                  );
                }

                return teamGames.map((game) => {
                  const isValiantsHome = game.home_team && game.home_team.toLowerCase().includes('valiant');
                  const isValiantsAway = game.away_team && game.away_team.toLowerCase().includes('valiant');
                  const opponent = isValiantsHome
                    ? (game.away_team || 'TBD')
                    : isValiantsAway
                      ? (game.home_team || 'TBD')
                      : (game.away_team || 'TBD');

                  const valiantsScore = isValiantsHome ? game.home_score : game.away_score;
                  const opponentScore = isValiantsHome ? game.away_score : game.home_score;

                  let result = 'Scheduled';
                  let score = '-';

                  if (game.status === 'completed' && game.result) {
                    const valiWon = game.result.toLowerCase().includes('valiant');
                    result = valiWon ? 'W' : 'L';
                  } else if (game.status === 'in-progress') {
                    result = 'Live';
                  }

                  if (valiantsScore != null && opponentScore != null && game.status === 'completed') {
                    score = `${valiantsScore}-${opponentScore}`;
                  }

                  return (
                    <div key={game.id} className={`schedule-row ${result === 'W' ? 'win' : result === 'L' ? 'loss' : 'scheduled'}`}>
                      <div className="result">{result}</div>
                      <div className="mobile-content">
                        <div className="opponent-main">vs. {opponent}</div>
                        <div className="game-date">{formatDate(game.game_date)}</div>
                      </div>
                      <div className="location-badge">{game.location || ''}</div>
                      <div className="desktop-only">{score}</div>
                      <div className="desktop-only">{game.type || ''}</div>
                      <div className="desktop-only">{formatTime(game.game_time)}</div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="teams-page"><p>Loading teams...</p></div>;
  if (!Array.isArray(teams) || teams.length === 0) {
    return <div className="teams-page"><p>No teams available</p></div>;
  }

  const selectedTeam = teams.find(t => t.id === activeTab) || teams[0];

  return (
    <div className="teams-page ds-page">
      <div className="page-header">
        <h1>Valiant Basketball</h1>
      </div>
      
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'boys' ? 'active' : ''}`}
          onClick={() => setActiveTab('boys')}
        >
          Boys Basketball
        </button>
        <button 
          className={`tab-button ${activeTab === 'girls' ? 'active' : ''}`}
          onClick={() => setActiveTab('girls')}
        >
          Girls Basketball
        </button>
      </div>

      {selectedTeam ? <TeamSection team={selectedTeam} /> : <p>Team data loading...</p>}
    </div>
  );
}

export default Teams;
