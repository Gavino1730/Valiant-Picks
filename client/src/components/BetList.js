import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import '../styles/BetList.css';
import { formatCurrency } from '../utils/currency';

function BetList() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBets = async () => {
    try {
      const response = await apiClient.get('/bets');
      setBets(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch bets');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="bet-list">
      <h2>Your Bets</h2>
      
      {error && <div className="alert alert-error">{error}</div>}

      {bets.length === 0 ? (
        <div className="card">No bets yet. Start by placing a bet!</div>
      ) : (
        <div className="bets-grid">
          {bets.map(bet => (
            <div key={bet.id} className="card bet-card">
              <div className="bet-header">
                <div>
                  <h4>{bet.sport} - {bet.team}</h4>
                  {bet.event_description && <p className="event-desc">{bet.event_description}</p>}
                </div>
                <span className={`status status-${bet.status}`}>{bet.status.toUpperCase()}</span>
              </div>
              <div className="bet-details">
                <div className="detail-item">
                  <span className="detail-label">Amount</span>
                  <span className="detail-value">{formatCurrency(bet.amount)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Odds</span>
                  <span className="detail-value">{bet.odds}x</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Potential Win</span>
                  <span className="detail-value">{formatCurrency(bet.potential_win)}</span>
                </div>
                {bet.outcome && (
                  <div className="detail-item">
                    <span className="detail-label">Outcome</span>
                    <span className={`detail-value outcome-${bet.outcome}`}>{bet.outcome.toUpperCase()}</span>
                  </div>
                )}
              </div>
              <small className="bet-date">{new Date(bet.created_at).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BetList;
