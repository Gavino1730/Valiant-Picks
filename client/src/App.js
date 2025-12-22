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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      // Lighten load: poll notifications every 2 minutes instead of 30s
      const interval = setInterval(fetchUnreadCount, 120000);
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
    setMobileMenuOpen(false); // Close mobile menu on navigation
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  // Get user data from state or localStorage
  const currentUser = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);

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
            Browse Picks
          </button>
          <button onClick={() => handlePageChange('teams')} className={page === 'teams' ? 'active' : ''}>
            Teams
          </button>
          <button onClick={() => handlePageChange('bets')} className={page === 'bets' ? 'active' : ''}>
            My Picks
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
          <div className="user-info">
            <span className="username">{currentUser?.username || 'User'}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
        
        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Slide-out Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <div className="mobile-user-info">
            <div className="mobile-user-name">👤 {currentUser?.username || 'User'}</div>
          </div>
          <button
            className="mobile-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        
        <div className="mobile-menu-nav">
          <button 
            onClick={() => handlePageChange('dashboard')} 
            className={page === 'dashboard' ? 'active' : ''}
          >
            <span className="menu-icon">📊</span>
            Dashboard
          </button>
          <button 
            onClick={() => handlePageChange('games')} 
            className={page === 'games' ? 'active' : ''}
          >
            <span className="menu-icon">🎲</span>
            Browse Picks
          </button>
          <button 
            onClick={() => handlePageChange('teams')} 
            className={page === 'teams' ? 'active' : ''}
          >
            <span className="menu-icon">🏀</span>
            Teams
          </button>
          <button 
            onClick={() => handlePageChange('bets')} 
            className={page === 'bets' ? 'active' : ''}
          >
            <span className="menu-icon">📝</span>
            My Picks
          </button>
          <button 
            onClick={() => handlePageChange('leaderboard')} 
            className={page === 'leaderboard' ? 'active' : ''}
          >
            <span className="menu-icon">🏆</span>
            Leaderboard
          </button>
          <button 
            onClick={() => handlePageChange('notifications')} 
            className={page === 'notifications' ? 'active' : ''}
          >
            <span className="menu-icon">🔔</span>
            Notifications
            {unreadCount > 0 && (
              <span className="mobile-badge">{unreadCount}</span>
            )}
          </button>
          {user && (user.is_admin || user.isAdminUser) && (
            <button 
              onClick={() => handlePageChange('admin')} 
              className={page === 'admin' ? 'active' : ''}
            >
              <span className="menu-icon">⚙️</span>
              Admin Panel
            </button>
          )}
        </div>

        <div className="mobile-menu-footer">
          <button onClick={handleLogout} className="mobile-logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>

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
          <p className="footer-tagline">Pick Smart. Win Big. Valiant Style.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
