import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/axios';
import { formatCurrency } from '../utils/currency';
import '../styles/BracketLeaderboard.css';

function BracketLeaderboard({ gender = 'boys' }) {
  const navigate = useNavigate();
  const [bracket, setBracket] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/brackets/active?gender=${gender}`);
      if (!response.data?.bracket) {
        setBracket(null);
        setEntries([]);
        return;
      }

      setBracket(response.data.bracket);
      const leaderboardRes = await apiClient.get(`/brackets/${response.data.bracket.id}/leaderboard`);
      setEntries(leaderboardRes.data || []);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load bracket leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
    
    // Auto-refresh leaderboard every 10 seconds
    const interval = setInterval(loadLeaderboard, 10000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rankedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return Number(b.payout || 0) - Number(a.payout || 0);
    });
  }, [entries]);

  if (loading) {
    return (
      <div className="bracket-leaderboard">
        <div className="bracket-tabs">
          <button className="bracket-tab" onClick={() => navigate('/bracket')}>🏀 Boys</button>
          <button className="bracket-tab" onClick={() => navigate('/girls-bracket')}>🎀 Girls</button>
          <button className="bracket-tab bracket-tab--active">📊 Leaderboard</button>
        </div>
        <h1>Bracket Leaderboard</h1>
        <p>Loading bracket standings...</p>
      </div>
    );
  }

  if (!bracket) {
    return (
      <div className="bracket-leaderboard">
        <div className="bracket-tabs">
          <button className="bracket-tab" onClick={() => navigate('/bracket')}>🏀 Boys</button>
          <button className="bracket-tab" onClick={() => navigate('/girls-bracket')}>🎀 Girls</button>
          <button className="bracket-tab bracket-tab--active">📊 Leaderboard</button>
        </div>
        <h1>Bracket Leaderboard</h1>
        <p>No active bracket yet.</p>
      </div>
    );
  }

  return (
    <div className="bracket-leaderboard">
      <div className="bracket-tabs">
        <button className="bracket-tab" onClick={() => navigate('/bracket')}>🏀 Boys</button>
        <button className="bracket-tab" onClick={() => navigate('/girls-bracket')}>🎀 Girls</button>
        <button className="bracket-tab bracket-tab--active">📊 Leaderboard</button>
      </div>

      <div className="leaderboard-header">
        <div>
          <h1>{bracket.name} Leaderboard</h1>
          <p className="subtitle">Points and payouts for submitted brackets</p>
          <p className="subtitle subtitle--deadline">⏰ Picks must be submitted by February 28 at 5pm Pacific</p>
          {lastRefresh && <p className="subtitle subtitle--small">Last updated: {lastRefresh}</p>}
        </div>
        <div className="leaderboard-actions">
          <button
            type="button"
            className="bracket-link"
            onClick={loadLeaderboard}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            type="button"
            className="bracket-link"
            onClick={() => navigate(gender === 'girls' ? '/girls-actual-bracket' : '/actual-bracket')}
          >
            View Results
          </button>
        </div>
      </div>

      {error && <div className="bracket-alert bracket-alert--error">{error}</div>}

      <div className="leaderboard-table">
        <div className="leaderboard-row leaderboard-row--header">
          <span>Rank</span>
          <span>Player</span>
          <span className="align-right">Points</span>
          <span className="align-right">Payout</span>
        </div>
        {rankedEntries.length === 0 && (
          <div className="leaderboard-row leaderboard-row--empty">No brackets submitted yet.</div>
        )}
        {rankedEntries.map((entry, index) => (
          <div className="leaderboard-row" key={entry.id}>
            <span>{index + 1}</span>
            <span>{entry.users?.username || 'Player'}</span>
            <span className="align-right">{entry.points}</span>
            <span className="align-right">{formatCurrency(Number(entry.payout || 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BracketLeaderboard;
