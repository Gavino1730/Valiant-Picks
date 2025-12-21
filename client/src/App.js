import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import BetList from './components/BetList';
import Leaderboard from './components/Leaderboard';
import Teams from './components/Teams';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const handleLogin = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setPage('dashboard');
  };

  if (!token) {
    return <Login onLogin={handleLogin} apiUrl={API_URL} />;
  }

  // Get user data from state or localStorage
  const currentUser = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <img src="/assets/logo.png" alt="Valiant Picks" className="logo-img" />
          <span>Valiant Picks</span>
        </div>
        <div className="nav-links">
          <button onClick={() => setPage('dashboard')} className={page === 'dashboard' ? 'active' : ''}>
            Dashboard
          </button>
          <button onClick={() => setPage('teams')} className={page === 'teams' ? 'active' : ''}>
            Teams
          </button>
          <button onClick={() => setPage('bets')} className={page === 'bets' ? 'active' : ''}>
            My Bets
          </button>
          <button onClick={() => setPage('leaderboard')} className={page === 'leaderboard' ? 'active' : ''}>
            Leaderboard
          </button>
          {user && (user.is_admin || user.isAdminUser) && (
            <button onClick={() => setPage('admin')} className={page === 'admin' ? 'active' : ''}>
              Admin
            </button>
          )}
          <div className="user-info">
            <span className="username">{currentUser?.username || 'User'}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="container">
        {page === 'dashboard' && <Dashboard user={user} apiUrl={API_URL} />}
        {page === 'teams' && <Teams apiUrl={API_URL} />}
        {page === 'bets' && <BetList apiUrl={API_URL} />}
        {page === 'leaderboard' && <Leaderboard apiUrl={API_URL} />}
        {page === 'admin' && user && user.is_admin && <AdminPanel apiUrl={API_URL} />}
      </div>
    </div>
  );
}

export default App;
