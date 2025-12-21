import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import BetList from './components/BetList';
import Leaderboard from './components/Leaderboard';
import Teams from './components/Teams';
import Games from './components/Games';
import Notifications from './components/Notifications';
import apiClient from './utils/axios';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [page, setPage] = useState(localStorage.getItem('currentPage') || 'dashboard');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Token is now handled by axios interceptor
    if (token && !user) {
      // Load user from localStorage if not in state
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  }, [token, user]);

  useEffect(() => {
    if (token) {
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const handleLogin = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentPage');
    setPage('dashboard');
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    localStorage.setItem('currentPage', newPage);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  // Get user data from state or localStorage
  const currentUser = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US').format(amount || 0);
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <img src="/assets/transparent.png" alt="Valiant Picks" className="logo-img" />
          <span>Valiant Picks</span>
        </div>
        <div className="nav-center">
          <button onClick={() => handlePageChange('dashboard')} className={page === 'dashboard' ? 'active' : ''}>
            Dashboard
          </button>
          <button onClick={() => handlePageChange('games')} className={page === 'games' ? 'active' : ''}>
            Browse Bets
          </button>
          <button onClick={() => handlePageChange('teams')} className={page === 'teams' ? 'active' : ''}>
            Teams
          </button>
          <button onClick={() => handlePageChange('bets')} className={page === 'bets' ? 'active' : ''}>
            My Bets
          </button>
          <button onClick={() => handlePageChange('leaderboard')} className={page === 'leaderboard' ? 'active' : ''}>
            Leaderboard
          </button>
          {user && (user.is_admin || user.isAdminUser) && (
            <button onClick={() => handlePageChange('admin')} className={page === 'admin' ? 'active' : ''}>
              Admin
            </button>
          )}
        </div>
        <div className="nav-right">
          <button 
            onClick={() => handlePageChange('notifications')} 
            className={`notification-icon-btn ${page === 'notifications' ? 'active' : ''}`}
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          <div className="balance-display">
            <span className="balance-amount">{formatCurrency(currentUser?.balance)}</span>
          </div>
          <div className="user-info">
            <span className="username">{currentUser?.username || 'User'}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="container">
        {page === 'dashboard' && <Dashboard user={user} />}
        {page === 'games' && <Games />}
        {page === 'teams' && <Teams />}
        {page === 'bets' && <BetList />}
        {page === 'leaderboard' && <Leaderboard />}
        {page === 'notifications' && <Notifications />}
        {page === 'admin' && user && user.is_admin && <AdminPanel />}
      </div>

      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2026 Valiant Picks. All rights reserved.</p>
          <p className="footer-tagline">Bet Smart. Win Big. Valiant Style.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
