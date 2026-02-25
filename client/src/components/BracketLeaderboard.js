import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/axios';
import { formatCurrency } from '../utils/currency';
import '../styles/BracketLeaderboard.css';

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

function BracketLeaderboard({ gender = 'boys' }) {
  const navigate = useNavigate();
  const [bracket, setBracket] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadLeaderboard = async (isRefresh = false) => {
    const cacheKey = `bracket_lb_${gender}`;
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        // Show cached data instantly while fetching fresh data
        const cached = getCached(cacheKey);
        if (cached) {
          setBracket(cached.bracket);
          setEntries(cached.entries);
          setLoading(false);
        } else {
          setLoading(true);
        }
      }
      setError('');
      // Single request — combined bracket + leaderboard
      const response = await apiClient.get(`/brackets/active?gender=${gender}&include=leaderboard`);
      if (!response.data?.bracket) {
        setBracket(null);
        setEntries([]);
        setCache(cacheKey, { bracket: null, entries: [] });
        return;
      }

      const freshEntries = response.data.leaderboard || [];
      setBracket(response.data.bracket);
      setEntries(freshEntries);
      setLastRefresh(new Date().toLocaleTimeString());
      setCache(cacheKey, { bracket: response.data.bracket, entries: freshEntries });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load bracket leaderboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard(false);
    
    // Auto-refresh leaderboard every 15 seconds (silent refresh, no loading flash)
    const interval = setInterval(() => loadLeaderboard(true), 15000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender]);

  const rankedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return Number(b.payout || 0) - Number(a.payout || 0);
    });
  }, [entries]);

  if (loading) {
    return (
      <div className={`bracket-leaderboard${gender === 'girls' ? ' bracket-leaderboard--girls' : ''}`}>
        <div className="bracket-tabs">
          <button className="bracket-tab" onClick={() => navigate('/bracket')}>Boys Bracket</button>
          <button className="bracket-tab" onClick={() => navigate('/girls-bracket')}>Girls Bracket</button>
          <button className="bracket-tab bracket-tab--active">Leaderboard</button>
          <button className="bracket-tab" onClick={() => navigate(gender === 'girls' ? '/girls-actual-bracket' : '/actual-bracket')}>Live</button>
        </div>
        <div className="bracket-sub-tabs">
          <button className={`bracket-sub-tab${gender !== 'girls' ? ' bracket-sub-tab--active' : ''}`} onClick={() => navigate('/bracket-leaderboard')}>Boys</button>
          <button className={`bracket-sub-tab${gender === 'girls' ? ' bracket-sub-tab--active' : ''}`} onClick={() => navigate('/girls-bracket-leaderboard')}>Girls</button>
        </div>
        <h1>{gender === 'girls' ? 'Girls' : 'Boys'} Bracket Leaderboard</h1>
      </div>
    );
  }

  if (!bracket) {
    return (
      <div className={`bracket-leaderboard${gender === 'girls' ? ' bracket-leaderboard--girls' : ''}`}>
        <div className="bracket-tabs">
          <button className="bracket-tab" onClick={() => navigate('/bracket')}>Boys Bracket</button>
          <button className="bracket-tab" onClick={() => navigate('/girls-bracket')}>Girls Bracket</button>
          <button className="bracket-tab bracket-tab--active">Leaderboard</button>
          <button className="bracket-tab" onClick={() => navigate(gender === 'girls' ? '/girls-actual-bracket' : '/actual-bracket')}>Live</button>
        </div>
        <div className="bracket-sub-tabs">
          <button className={`bracket-sub-tab${gender !== 'girls' ? ' bracket-sub-tab--active' : ''}`} onClick={() => navigate('/bracket-leaderboard')}>Boys</button>
          <button className={`bracket-sub-tab${gender === 'girls' ? ' bracket-sub-tab--active' : ''}`} onClick={() => navigate('/girls-bracket-leaderboard')}>Girls</button>
        </div>
        <h1>{gender === 'girls' ? 'Girls' : 'Boys'} Bracket Leaderboard</h1>
        <p>No active bracket yet.</p>
      </div>
    );
  }

  return (
    <div className={`bracket-leaderboard${gender === 'girls' ? ' bracket-leaderboard--girls' : ''}`}>
      <div className="bracket-tabs">
        <button className="bracket-tab" onClick={() => navigate('/bracket')}>Boys Bracket</button>
        <button className="bracket-tab" onClick={() => navigate('/girls-bracket')}>Girls Bracket</button>
        <button className="bracket-tab bracket-tab--active">Leaderboard</button>
        <button className="bracket-tab" onClick={() => navigate(gender === 'girls' ? '/girls-actual-bracket' : '/actual-bracket')}>Live</button>
      </div>
      <div className="bracket-sub-tabs">
        <button className={`bracket-sub-tab${gender !== 'girls' ? ' bracket-sub-tab--active' : ''}`} onClick={() => navigate('/bracket-leaderboard')}>Boys</button>
        <button className={`bracket-sub-tab${gender === 'girls' ? ' bracket-sub-tab--active' : ''}`} onClick={() => navigate('/girls-bracket-leaderboard')}>Girls</button>
      </div>

      <div className="leaderboard-header">
        <div>
          <h1>{gender === 'girls' ? 'Girls' : 'Boys'} Bracket Leaderboard</h1>
          <p className="subtitle">Points and payouts for submitted brackets</p>
          <p className="subtitle subtitle--deadline">⏰ Picks must be submitted by February 28 at 5pm Pacific</p>
          {lastRefresh && <p className="subtitle subtitle--small">Last updated: {lastRefresh}</p>}
        </div>
        <div className="leaderboard-actions">
          <button
            type="button"
            className="bracket-link"
            onClick={() => loadLeaderboard(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
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
          <span className="align-right">Accuracy</span>
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
            <span className="align-right">
              {entry.total_completed > 0
                ? `${Math.round((entry.correct_picks / entry.total_completed) * 100)}%`
                : '—'}
            </span>
            <span className="align-right">{formatCurrency(Number(entry.payout || 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BracketLeaderboard;
