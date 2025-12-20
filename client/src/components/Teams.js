import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Teams.css';

function Teams({ apiUrl }) {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get(`${apiUrl}/teams`);
        setTeams(response.data);
        setError('');
        if (response.data.length > 0) {
          setSelectedTeam(response.data[0]);
        }
      } catch (err) {
        setError('Failed to fetch teams');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [apiUrl]);

  if (loading) return <div className="card">Loading teams...</div>;

  return (
    <div className="teams-page">
      <h2>Basketball Teams</h2>
      
      {error && <div className="alert alert-error">{error}</div>}

      <div className="teams-container">
        <div className="teams-list">
          {teams.map(team => (
            <div 
              key={team.id} 
              className={`team-selector ${selectedTeam?.id === team.id ? 'active' : ''}`}
              onClick={() => setSelectedTeam(team)}
            >
              <h4>{team.name}</h4>
              <p>{team.record_wins}-{team.record_losses}</p>
              {team.ranking && <p className="ranking">Rank #{team.ranking}</p>}
            </div>
          ))}
        </div>

        {selectedTeam && (
          <div className="team-details">
            <h3>{selectedTeam.name}</h3>
            
            <div className="team-info">
              <div className="info-card">
                <h4>Record</h4>
                <p>{selectedTeam.record_wins} - {selectedTeam.record_losses}</p>
              </div>
              {selectedTeam.ranking && (
                <div className="info-card">
                  <h4>Ranking</h4>
                  <p>#{selectedTeam.ranking}</p>
                </div>
              )}
              {selectedTeam.coach_name && (
                <div className="info-card">
                  <h4>Head Coach</h4>
                  <p>{selectedTeam.coach_name}</p>
                </div>
              )}
            </div>

            {selectedTeam.description && (
              <div className="team-description">
                <h4>About the Team</h4>
                <p>{selectedTeam.description}</p>
              </div>
            )}

            <div className="roster">
              <h4>Roster</h4>
              {selectedTeam.players && selectedTeam.players.length > 0 ? (
                <div className="players-grid">
                  {selectedTeam.players.map(player => (
                    <div key={player.id} className="player-card">
                      <div className="player-number">{player.number}</div>
                      <h5>{player.name}</h5>
                      <p className="player-meta">{player.position} • Grade {player.grade}</p>
                      {player.height && <p className="player-height">{player.height}</p>}
                      {player.bio && <p className="player-bio">{player.bio}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No roster data available yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Teams;
