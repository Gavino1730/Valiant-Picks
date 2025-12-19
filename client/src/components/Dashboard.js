import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';

function Dashboard({ user, apiUrl }) {
  const [balance, setBalance] = useState(user?.balance || 0);
  const [team, setTeam] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [odds, setOdds] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sports = [
    { id: 'mens-basketball', name: '🏀 VC Men\'s Basketball' },
    { id: 'womens-basketball', name: '🏀 VC Women\'s Basketball' },
  ];

  const handlePlaceBet = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const sportName = sports.find(s => s.id === team)?.name || 'VC';

    try {
      await axios.post(`${apiUrl}/bets`, {
        sport: team,
        team: sportName,
        eventDescription,
        amount: parseFloat(amount),
        odds: parseFloat(odds),
      });

      setMessage(`Bet placed successfully on ${sportName}! Potential win: ${(amount * odds).toFixed(2)} Valiant Bucks`);
      setTeam('');
      setEventDescription('');
      setAmount('');
      setOdds('');
      setBalance(balance - parseFloat(amount));
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error placing bet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="card">
        <h2>Welcome back!</h2>
        <p>Your current balance: <span className="balance">{balance.toFixed(2)} Valiant Bucks</span></p>
      </div>

      <div className="card">
        <h3>Place a Bet</h3>
        {message && (
          <div className={`alert ${message.includes('Error') || message.includes('error') ? 'alert-error' : 'alert-success'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handlePlaceBet}>
          <div className="form-group">
            <label htmlFor="team">Team</label>
            <select
              id="team"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              required
            >
              <option value="">Select a team...</option>
              {sports.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="event">Event Details (optional)</label>
            <input
              id="event"
              type="text"
              placeholder="e.g., Finals Game 3"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Bet Amount (Valiant Bucks)</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="odds">Odds</label>
            <input
              id="odds"
              type="number"
              step="0.01"
              value={odds}
              onChange={(e) => setOdds(e.target.value)}
              required
            />
          </div>

          {odds && amount && (
            <div className="potential-win">
              Potential win: {(parseFloat(amount) * parseFloat(odds)).toFixed(2)} Valiant Bucks
            </div>
          )}

          <button type="submit" className="btn" disabled={loading || !team || !amount || !odds}>
            {loading ? 'Processing...' : 'Place Bet'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Dashboard;
