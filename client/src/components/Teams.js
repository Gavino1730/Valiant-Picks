import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/axios';
import '../styles/Teams.css';

function Teams() {
  const [activeTab, setActiveTab] = useState('boys');
  const [contentTab, setContentTab] = useState('roster'); // 'schedule' or 'roster'
  const [rosterExpanded, setRosterExpanded] = useState(true);
  const [teams, setTeams] = useState(null);
  const [loading, setLoading] = useState(true);

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
        schedule: [
          { result: 'W', score: '83-58', type: 'Non League', date: '12/3/25', time: '7:30 pm', opponent: 'Knappa', location: 'Away' },
          { result: 'W', score: '88-41', type: 'Non League', date: '12/5/25', time: '7:30 pm', opponent: 'Gladstone', location: 'Home' },
          { result: 'L', score: '69-90', type: 'Non League', date: '12/9/25', time: '7:00 pm', opponent: 'Scappoose', location: 'Away' },
          { result: 'W', score: '73-45', type: 'Non League', date: '12/12/25', time: '6:00 pm', opponent: 'Pleasant Hill', location: 'Home' },
          { result: 'W', score: '87-65', type: 'Non League', date: '12/15/25', time: '7:30 pm', opponent: 'Banks', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Non League', date: '12/22/25', time: '2:30 pm', opponent: 'Tillamook', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/28/25', time: '12:30 pm', opponent: 'Jefferson', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/29/25', time: '11:45 am', opponent: 'Mid Pacific, HI', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/30/25', time: '6:45 pm', opponent: 'Regis', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Non League', date: '1/3/26', time: '3:00 pm', opponent: 'Western Christian', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/6/26', time: '7:30 pm', opponent: 'Horizon Christian, Tualatin', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/8/26', time: '7:30 pm', opponent: 'Westside Christian', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/10/26', time: '6:30 pm', opponent: 'De La Salle North Catholic', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/13/26', time: '7:30 pm', opponent: 'Oregon Episcopal', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/16/26', time: '7:30 pm', opponent: 'Catlin Gabel', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/20/26', time: '7:30 pm', opponent: 'Riverside, WLWV', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/22/26', time: '7:30 pm', opponent: 'Portland Adventist Academy', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/24/26', time: '6:30 pm', opponent: 'Horizon Christian, Tualatin', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/27/26', time: '7:30 pm', opponent: 'Westside Christian', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/30/26', time: '7:30 pm', opponent: 'De La Salle North Catholic', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '2/3/26', time: '7:30 pm', opponent: 'Oregon Episcopal', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '2/6/26', time: '7:30 pm', opponent: 'Catlin Gabel', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '2/10/26', time: '6:00 pm', opponent: 'Riverside, WLWV', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '2/12/26', time: '7:30 pm', opponent: 'Portland Adventist Academy', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Non League', date: '2/14/26', time: 'Noon', opponent: 'Neah Kah Nie', location: 'Home' }
        ],
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
        schedule: [
          { result: 'W', score: '44-31', type: 'Non League', date: '12/3/25', time: '6:00 pm', opponent: 'Knappa', location: 'Away' },
          { result: 'W', score: '56-7', type: 'Non League', date: '12/5/25', time: '6:00 pm', opponent: 'Gladstone', location: 'Home' },
          { result: 'W', score: '44-16', type: 'Non League', date: '12/9/25', time: '5:30 pm', opponent: 'Scappoose', location: 'Away' },
          { result: 'W', score: '57-28', type: 'Non League', date: '12/12/25', time: '7:30 pm', opponent: 'Pleasant Hill', location: 'Home' },
          { result: 'L', score: '25-46', type: 'Non League', date: '12/15/25', time: '6:00 pm', opponent: 'Banks', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Non League', date: '12/22/25', time: '5:00 pm', opponent: 'Santiam Christian', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/28/25', time: '7:30 pm', opponent: 'Regis', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/29/25', time: '3:15 pm', opponent: 'Jefferson', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/30/25', time: '3:15 pm', opponent: 'Sutherlin', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Non League', date: '1/2/26', time: '5:30 pm', opponent: 'Seaside', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/6/26', time: '6:00 pm', opponent: 'Horizon Christian, Tualatin', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/8/26', time: '6:00 pm', opponent: 'Westside Christian', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/10/26', time: '5:00 pm', opponent: 'De La Salle North Catholic', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/13/26', time: '6:00 pm', opponent: 'Oregon Episcopal', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/16/26', time: '6:00 pm', opponent: 'Catlin Gabel', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Non League', date: '1/19/26', time: '6:00 pm', opponent: 'Country Christian', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/22/26', time: '6:00 pm', opponent: 'Portland Adventist Academy', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/24/26', time: '5:00 pm', opponent: 'Horizon Christian, Tualatin', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/27/26', time: '6:00 pm', opponent: 'Westside Christian', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/30/26', time: '6:00 pm', opponent: 'De La Salle North Catholic', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '2/3/26', time: '6:00 pm', opponent: 'Oregon Episcopal', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '2/6/26', time: '6:00 pm', opponent: 'Catlin Gabel', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'Non League', date: '2/9/26', time: '7:00 pm', opponent: 'Prairie, WA', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '2/12/26', time: '6:00 pm', opponent: 'Portland Adventist Academy', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Non League', date: '2/14/26', time: '10:30 am', opponent: 'Neah Kah Nie', location: 'Home' }
        ],
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

  const TeamSection = ({ team }) => (
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
        <button 
          className="expand-roster-btn"
          onClick={() => setRosterExpanded(!rosterExpanded)}
        >
          {rosterExpanded ? '▼' : '▶'} Varsity Roster
        </button>
        {rosterExpanded && (
          <div className="roster-table">
            {(team.players || []).map(player => (
              <div key={player.number} className="player-row">
                <div className="player-header">
                  <span className="player-number">#{player.number}</span>
                  <span className="player-name">{player.name}</span>
                  <span className="player-grade">Grade {player.grade}</span>
                  <span className="player-height">{player.height}</span>
                </div>
                <div className="player-bio">
                  {player.bio}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {contentTab === 'roster' && (
        <div className="roster-section mobile-roster">
          <h3>Varsity Roster</h3>
          <div className="roster-table">
            {(team.players || []).map(player => (
              <div key={player.number} className="player-row">
                <div className="player-header">
                  <span className="player-number">#{player.number}</span>
                  <span className="player-name">{player.name}</span>
                  <span className="player-grade">Grade {player.grade}</span>
                  <span className="player-height">{player.height}</span>
                </div>
                <div className="player-bio">
                  {player.bio}
                </div>
              </div>
            ))}
          </div>
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
            {(team.schedule || []).map((game, idx) => {
              const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const parts = dateStr.split('/');
                if (parts.length !== 3) return dateStr;
                const [m, d, y] = parts;
                return `${(m || '').padStart(2, '0')}/${(d || '').padStart(2, '0')}/${y}`;
              };
              return (
              <div key={idx} className={`schedule-row ${game.result === 'W' ? 'win' : game.result === 'L' ? 'loss' : 'scheduled'}`}>
                <div className="result">{game.result}</div>
                <div className="mobile-content">
                  <div className="opponent-main">vs. {game.opponent}</div>
                  <div className="game-date">{formatDate(game.date)}</div>
                </div>
                <div className="location-badge">{game.location}</div>
                <div className="desktop-only">{game.score}</div>
                <div className="desktop-only">{game.type}</div>
                <div className="desktop-only">{game.time}</div>
              </div>
            );
            })}
          </div>
        </div>
      )}
    </div>
  );

  if (loading) return <div className="teams-page"><p>Loading teams...</p></div>;
  if (!Array.isArray(teams) || teams.length === 0) {
    return <div className="teams-page"><p>No teams available</p></div>;
  }

  const selectedTeam = teams.find(t => t.id === activeTab) || teams[0];

  return (
    <div className="teams-page">
      <h1>Valiant Basketball</h1>
      
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
