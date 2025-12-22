import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/axios';
import '../styles/AdminTeams.css';

function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [newPlayer, setNewPlayer] = useState({ number: '', name: '', position: '', grade: '', height: '', bio: '' });
  const [editingPlayer, setEditingPlayer] = useState(null);

  // Hardcoded fallback teams data
  const getHardcodedTeams = useCallback(() => {
    return [
      {
        id: 'boys',
        name: 'Valiants Boys Basketball',
        record_wins: 4,
        record_losses: 1,
        league_record: '0-0',
        ranking: 3,
        coach_name: 'Bryan Fraser',
        assistant_coach: 'John Efstathiou',
        coach_bio: 'Head Coach Bryan Fraser is an OG hooper out of Sacramento with 11 years on the sideline and zero tolerance for bad basketball.',
        description: 'Depth for days and pace that never slows.',
        team_motto: 'BTA',
        schedule: [],
        players: []
      },
      {
        id: 'girls',
        name: 'Valiants Girls Basketball',
        record_wins: 4,
        record_losses: 1,
        league_record: '0-0',
        ranking: 8,
        coach_name: 'Patrick Thomas',
        coach_bio: 'Head Coach Patrick Thomas is an English teacher who blends grammar, conditioning, and controlled insanity.',
        description: 'Pure pressure from the opening tip.',
        schedule: [],
        players: []
      }
    ];
  }, []);

  // Load teams on mount
  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/teams-admin', {
        timeout: 3000
      });
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Clean up ranking format for all teams
        const cleanedTeams = response.data.map(team => {
          let numericRanking = team.ranking;
          if (typeof numericRanking === 'string') {
            const match = numericRanking.match(/\d+/);
            numericRanking = match ? parseInt(match[0]) : numericRanking;
          }
          return { ...team, ranking: numericRanking };
        });
        
        setTeams(cleanedTeams);
        setSelectedTeam(cleanedTeams[0]);
        setFormData(cleanedTeams[0]);
      } else {
        // API returned empty, use hardcoded
        const hardcodedTeams = getHardcodedTeams();
        setTeams(hardcodedTeams);
        setSelectedTeam(hardcodedTeams[0]);
        setFormData(hardcodedTeams[0]);
      }
    } catch (err) {
      console.error('Failed to fetch teams from API:', err.message);
      const hardcodedTeams = getHardcodedTeams();
      setTeams(hardcodedTeams);
      setSelectedTeam(hardcodedTeams[0]);
      setFormData(hardcodedTeams[0]);
    } finally {
      setLoading(false);
    }
  }, [getHardcodedTeams]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleSelectTeam = (team) => {
    console.log('Selecting team:', team);
    console.log('Selected team ID:', team.id, 'Type:', typeof team.id);
    console.log('Current selected team ID:', selectedTeam?.id, 'Type:', typeof selectedTeam?.id);
    
    // Extract numeric ranking from "Rank #3" format
    let numericRanking = team.ranking;
    if (typeof numericRanking === 'string') {
      const match = numericRanking.match(/\d+/);
      numericRanking = match ? parseInt(match[0]) : numericRanking;
    }
    
    const cleanedTeam = {
      ...team,
      ranking: numericRanking
    };
    
    console.log('Setting selected team to:', cleanedTeam);
    setSelectedTeam(cleanedTeam);
    setFormData(cleanedTeam);
    setEditMode(false);
    setActiveTab('info');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveTeamInfo = async () => {
    try {
      setError('');
      
      // Parse ranking to extract just the number
      let rankingValue = formData.ranking;
      if (typeof rankingValue === 'string') {
        // Extract number from "Rank #3" format
        const match = rankingValue.match(/\d+/);
        rankingValue = match ? parseInt(match[0]) : parseInt(rankingValue);
      } else {
        rankingValue = parseInt(rankingValue);
      }

      const updates = {
        record_wins: parseInt(formData.record_wins) || 0,
        record_losses: parseInt(formData.record_losses) || 0,
        league_record: formData.league_record || '0-0',
        ranking: rankingValue,
        coach_name: formData.coach_name || '',
        assistant_coach: formData.assistant_coach || '',
        coach_bio: formData.coach_bio || '',
        description: formData.description || '',
        team_motto: formData.team_motto || ''
      };

      await apiClient.put(`/teams-admin/${selectedTeam.id}`, updates);

      // Update local state with numeric ranking
      const updatedTeam = { ...selectedTeam, ...updates };
      setSelectedTeam(updatedTeam);
      setFormData(updatedTeam);
      setEditMode(false);
      setError('✅ Team info updated successfully');
      
      // Refresh teams list
      fetchTeams();
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Failed to update team info');
    }
  };

  const handleAddPlayer = async () => {
    try {
      if (!newPlayer.number || !newPlayer.name || !newPlayer.position || !newPlayer.grade || !newPlayer.height || !newPlayer.bio) {
        setError('All player fields are required');
        return;
      }

      setError('');
      await apiClient.post(`/teams-admin/${selectedTeam.id}/players`, newPlayer);

      const updatedTeam = { ...selectedTeam };
      updatedTeam.players.push({ ...newPlayer, number: parseInt(newPlayer.number) });
      setSelectedTeam(updatedTeam);
      setNewPlayer({ number: '', name: '', position: '', grade: '', height: '', bio: '' });
      setError('Player added successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add player');
    }
  };

  const handleDeletePlayer = async (playerId) => {
    try {
      setError('');
      await apiClient.delete(`/teams-admin/${selectedTeam.id}/players/${playerId}`);

      const updatedTeam = { ...selectedTeam };
      updatedTeam.players = updatedTeam.players.filter(p => p.number !== playerId);
      setSelectedTeam(updatedTeam);
      setError('Player deleted successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete player');
    }
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer({ ...player, originalNumber: player.number });
  };

  const handleSaveEditPlayer = async () => {
    try {
      if (!editingPlayer.number || !editingPlayer.name || !editingPlayer.position || !editingPlayer.grade || !editingPlayer.height || !editingPlayer.bio) {
        setError('All player fields are required');
        return;
      }

      setError('');
      await apiClient.put(`/teams-admin/${selectedTeam.id}/players/${editingPlayer.originalNumber}`, editingPlayer);

      const updatedTeam = { ...selectedTeam };
      const playerIndex = updatedTeam.players.findIndex(p => p.number === editingPlayer.originalNumber);
      if (playerIndex !== -1) {
        updatedTeam.players[playerIndex] = { ...editingPlayer, number: parseInt(editingPlayer.number) };
      }
      setSelectedTeam(updatedTeam);
      setEditingPlayer(null);
      setError('Player updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update player');
    }
  };

  const handleCancelEditPlayer = () => {
    setEditingPlayer(null);
  };

  if (loading) return <div className="admin-teams"><p>Loading teams...</p></div>;
  
  // Ensure teams is always an array
  const teamsToDisplay = Array.isArray(teams) ? teams : [];
  
  if (!teamsToDisplay || teamsToDisplay.length === 0) {
    return <div className="admin-teams"><p>No teams available</p></div>;
  }

  return (
    <div className="admin-teams">
      <h2>Manage Basketball Teams</h2>

      <div className="teams-selector">
        <h3>Select Team</h3>
        <div style={{fontSize: '12px', color: '#ffd700', marginBottom: '10px'}}>
          Debug: Total teams: {teamsToDisplay.length}, Selected ID: {selectedTeam?.id} (type: {typeof selectedTeam?.id})
        </div>
        <div className="team-buttons">
          {teamsToDisplay.map(team => (
            <button
              key={team.id}
              className={`team-btn ${String(selectedTeam?.id) === String(team.id) ? 'active' : ''}`}
              onClick={() => handleSelectTeam(team)}
            >
              {team.name}
            </button>
          ))}
        </div>
      </div>

      {selectedTeam && (
        <div className="team-editor">
          <div className="editor-tabs">
            <button
              className={`editor-tab ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              Team Info
            </button>
            <button
              className={`editor-tab ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              Schedule
            </button>
            <button
              className={`editor-tab ${activeTab === 'roster' ? 'active' : ''}`}
              onClick={() => setActiveTab('roster')}
            >
              Roster
            </button>
          </div>

          {error && (
            <div className={`message ${error.includes('successfully') ? 'success' : 'error'}`}>
              {error}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="tab-content">
              <h3>Team Information</h3>
              {editMode ? (
                <form className="edit-form">
                  <div className="form-group">
                    <label>Record (Wins)</label>
                    <input
                      type="number"
                      name="record_wins"
                      value={formData.record_wins}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Record (Losses)</label>
                    <input
                      type="number"
                      name="record_losses"
                      value={formData.record_losses}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>League Record</label>
                    <input
                      type="text"
                      name="league_record"
                      value={formData.league_record}
                      onChange={handleFormChange}
                      placeholder="e.g., 0-0"
                    />
                  </div>
                  <div className="form-group">
                    <label>State Ranking</label>
                    <input
                      type="number"
                      name="ranking"
                      value={formData.ranking}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Head Coach</label>
                    <input
                      type="text"
                      name="coach_name"
                      value={formData.coach_name}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Assistant Coach</label>
                    <input
                      type="text"
                      name="assistant_coach"
                      value={formData.assistant_coach || ''}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Coach Biography</label>
                    <textarea
                      name="coach_bio"
                      value={formData.coach_bio}
                      onChange={handleFormChange}
                      rows="4"
                    />
                  </div>
                  <div className="form-group">
                    <label>Team Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      rows="4"
                    />
                  </div>
                  <div className="form-group">
                    <label>Team Motto</label>
                    <input
                      type="text"
                      name="team_motto"
                      value={formData.team_motto || ''}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-save" onClick={handleSaveTeamInfo}>
                      Save Changes
                    </button>
                    <button type="button" className="btn-cancel" onClick={() => {
                      setEditMode(false);
                      setFormData(selectedTeam);
                    }}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="team-info-display">
                  <p><strong>Record:</strong> {formData.record_wins}-{formData.record_losses}</p>
                  <p><strong>League Record:</strong> {formData.league_record}</p>
                  <p><strong>Ranking:</strong> #{formData.ranking}</p>
                  <p><strong>Head Coach:</strong> {formData.coach_name}</p>
                  {formData.assistant_coach && <p><strong>Assistant Coach:</strong> {formData.assistant_coach}</p>}
                  <p><strong>Coach Bio:</strong> {formData.coach_bio}</p>
                  <p><strong>Team Description:</strong> {formData.description}</p>
                  {formData.team_motto && <p><strong>Motto:</strong> {formData.team_motto}</p>}
                  <button className="btn-edit" onClick={() => setEditMode(true)}>
                    Edit Team Info
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="tab-content">
              <h3>Game Schedule (View Only)</h3>
              <div style={{background: 'rgba(33, 150, 243, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(33, 150, 243, 0.3)'}}>
                <p style={{margin: 0, color: '#64b5f6'}}>
                  📋 <strong>To manage games:</strong> Use the "Manage Games" tab to create, edit, and set betting odds for games.
                </p>
              </div>

              <div className="schedule-list">
                <h4>Games ({selectedTeam.schedule?.length || 0})</h4>
                {selectedTeam.schedule && selectedTeam.schedule.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Result</th>
                        <th>Score</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Opponent</th>
                        <th>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTeam.schedule.map((game, idx) => (
                        <tr key={idx}>
                          <td>{game.result}</td>
                          <td>{game.score}</td>
                          <td>{game.type}</td>
                          <td>{game.date}</td>
                          <td>{game.time}</td>
                          <td>{game.opponent}</td>
                          <td>{game.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No games scheduled</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'roster' && (
            <div className="tab-content">
              <h3>Player Roster</h3>
              <div className="add-player-form">
                <h4>Add New Player</h4>
                <div className="player-form-grid">
                  <input
                    type="number"
                    placeholder="Jersey #"
                    value={newPlayer.number}
                    onChange={(e) => setNewPlayer({ ...newPlayer, number: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Position"
                    value={newPlayer.position}
                    onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Grade"
                    value={newPlayer.grade}
                    onChange={(e) => setNewPlayer({ ...newPlayer, grade: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Height"
                    value={newPlayer.height}
                    onChange={(e) => setNewPlayer({ ...newPlayer, height: e.target.value })}
                  />
                  <textarea
                    placeholder="Player Bio"
                    value={newPlayer.bio}
                    onChange={(e) => setNewPlayer({ ...newPlayer, bio: e.target.value })}
                  />
                  <button className="btn-add" onClick={handleAddPlayer}>Add Player</button>
                </div>
              </div>

              <div className="roster-list">
                <h4>Roster ({selectedTeam.players?.length || 0})</h4>
                {selectedTeam.players && selectedTeam.players.length > 0 ? (
                  <div className="players-grid">
                    {selectedTeam.players.map(player => (
                      <div key={player.number} className="player-card">
                        {editingPlayer && editingPlayer.originalNumber === player.number ? (
                          <>
                            <div className="player-header">
                              <input type="number" value={editingPlayer.number} onChange={(e) => setEditingPlayer({ ...editingPlayer, number: e.target.value })} placeholder="Jersey #" style={{width: '60px'}} />
                              <input type="text" value={editingPlayer.name} onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })} placeholder="Name" style={{flex: 1}} />
                            </div>
                            <p><strong>Position:</strong> <input type="text" value={editingPlayer.position} onChange={(e) => setEditingPlayer({ ...editingPlayer, position: e.target.value })} /></p>
                            <p><strong>Grade:</strong> <input type="number" value={editingPlayer.grade} onChange={(e) => setEditingPlayer({ ...editingPlayer, grade: e.target.value })} /></p>
                            <p><strong>Height:</strong> <input type="text" value={editingPlayer.height} onChange={(e) => setEditingPlayer({ ...editingPlayer, height: e.target.value })} /></p>
                            <p><strong>Bio:</strong> <textarea value={editingPlayer.bio} onChange={(e) => setEditingPlayer({ ...editingPlayer, bio: e.target.value })} rows="3" style={{width: '100%'}} /></p>
                            <button className="btn-save" style={{marginRight: '5px', marginBottom: '5px'}} onClick={handleSaveEditPlayer}>Save</button>
                            <button className="btn-cancel" onClick={handleCancelEditPlayer}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <div className="player-header">
                              <span className="jersey">#{player.number}</span>
                              <h5>{player.name}</h5>
                            </div>
                            <p><strong>Position:</strong> {player.position}</p>
                            <p><strong>Grade:</strong> {player.grade}</p>
                            <p><strong>Height:</strong> {player.height}</p>
                            <p><strong>Bio:</strong> {player.bio}</p>
                            <button className="btn-edit" style={{marginRight: '5px', marginBottom: '5px'}} onClick={() => handleEditPlayer(player)}>Edit Player</button>
                            <button className="btn-delete-player" onClick={() => handleDeletePlayer(player.number)}>Remove Player</button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No players added yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminTeams;
