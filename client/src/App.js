import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import OnboardingModal from './components/OnboardingModal';
import RivalryWeekPopup from './components/RivalryWeekPopup';
import Footer from './components/Footer';
import { ToastProvider, useToast } from './components/ToastProvider';
import './styles/Toast.css';
import apiClient from './utils/axios';
import { formatCurrency } from './utils/currency';

// Lazy load admin and less-frequently-used components
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const BetList = lazy(() => import('./components/BetList'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const Teams = lazy(() => import('./components/Teams'));
const Games = lazy(() => import('./components/Games'));
const Notifications = lazy(() => import('./components/Notifications'));
const HowToUse = lazy(() => import('./components/HowToUse'));
const About = lazy(() => import('./components/About'));
const Terms = lazy(() => import('./components/Terms'));

// Simple loading fallback
const LoadingSpinner = () => (
  <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
    Loading...
  </div>
);

function GiftBalanceWatcher({ user, updateUser }) {
  const { showToast } = useToast();
  const giftRequestRef = useRef(false);
  const lastUserBalanceRef = useRef(null);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const currentBalance = Number(user.balance ?? 0);
    
    // Only trigger if balance just hit 0 (changed from > 0 to 0)
    // Prevents spam when balance stays at 0
    if (currentBalance > 0) {
      lastUserBalanceRef.current = currentBalance;
      return undefined;
    }
    
    // Check if this is the first time we're seeing balance = 0
    const balanceJustHitZero = lastUserBalanceRef.current !== null && lastUserBalanceRef.current > 0;
    lastUserBalanceRef.current = currentBalance;
    
    // Only call gift-balance if balance just hit 0, or if we have a pending refill to check
    if (!balanceJustHitZero && giftRequestRef.current) {
      return undefined;
    }
    
    if (giftRequestRef.current && !balanceJustHitZero) {
      // Don't spam - only check if balance just hit zero or was already at 0 and hasn't been checked
      return undefined;
    }

    let isMounted = true;
    giftRequestRef.current = true;

    const grantGift = async () => {
      try {
        const response = await apiClient.post('/users/gift-balance');
        if (!isMounted) {
          return;
        }
        if (response.data?.user) {
          updateUser(response.data.user);
        }
        if (response.data?.gifted) {
          showToast(
            '🎁 Your 72-hour wait is complete! We\'ve added 500 Valiant Bucks to your account - spendable immediately!',
            'success',
            8000
          );
        } else if (response.data?.pending) {
          if (response.data.hoursRemaining === 72) {
            showToast(
              '⏳ Your balance hit $0.00. You will receive 500 Valiant Bucks in 72 hours. Check your notifications for details.',
              'info',
              7000
            );
          } else {
            showToast(
              `⏳ Your refill will be available in ${response.data.hoursRemaining} hours.`,
              'info',
              6000
            );
          }
        }
      } catch (err) {
        console.error('Error gifting balance:', err);
      } finally {
        if (isMounted) {
          giftRequestRef.current = false;
        }
      }
    };

    grantGift();

    return () => {
      isMounted = false;
    };
  }, [user?.balance, showToast, updateUser]);

  return null;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profilePollRef = useRef({ timeoutId: null, delay: 5000, inFlight: false });
  
  // Get page from URL path
  const page = location.pathname.slice(1) || 'dashboard';

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
    if (!token) return;
    
    fetchUnreadCount();
    // Poll notifications every 10 seconds for faster updates
    const notificationInterval = setInterval(fetchUnreadCount, 10000);
    let isMounted = true;
    // Copy ref to local variable at effect start for cleanup
    const pollRef = profilePollRef.current;

    const scheduleNextProfileFetch = (delay) => {
      if (!isMounted) return;
      pollRef.timeoutId = setTimeout(runProfileFetch, delay);
    };

    const runProfileFetch = async () => {
      if (!isMounted) return;
      if (pollRef.inFlight) {
        scheduleNextProfileFetch(pollRef.delay);
        return;
      }

      pollRef.inFlight = true;
      const updatedUser = await fetchUserProfile();

      if (updatedUser) {
        pollRef.delay = 5000;
      } else {
        pollRef.delay = Math.min(pollRef.delay * 2, 60000);
      }

      pollRef.inFlight = false;
      scheduleNextProfileFetch(pollRef.delay);
    };

    runProfileFetch();

    return () => {
      isMounted = false;
      clearInterval(notificationInterval);
      if (pollRef.timeoutId) {
        clearTimeout(pollRef.timeoutId);
      }
      pollRef.inFlight = false;
      pollRef.delay = 5000;
    };
  }, [token]);

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.get('/users/profile');
      const updatedUser = response.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
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
    localStorage.removeItem('hasSeenOnboarding');
    navigate('/dashboard');
  };

  const handlePageChange = (newPage) => {
    navigate(`/${newPage}`);
    setMobileMenuOpen(false); // Close mobile menu on navigation
  };

  if (!token) {
    return (
      <ToastProvider>
        <Login onLogin={handleLogin} />
      </ToastProvider>
    );
  }

  // Get user data from state or localStorage
  const currentUser = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);

  // Rivalry Week Configuration - Toggle enabled to true/false
  const rivalryWeekConfig = {
    enabled: false, // Set to false to disable
    gameInfo: {
      opponent: 'WESTSIDE CHRISTIAN',
      date: 'Thursday, January 9',
      time: '7:30 PM',
      location: 'Home Court'
    }
  };

  return (
    <ToastProvider>
    <div className="app">
      <GiftBalanceWatcher user={currentUser} updateUser={updateUser} />
      {/* Rivalry Week Popup */}
      <RivalryWeekPopup 
        enabled={rivalryWeekConfig.enabled}
        gameInfo={rivalryWeekConfig.gameInfo}
      />

      <nav className="navbar">
        <div className="nav-brand" onClick={() => handlePageChange('dashboard')} style={{ cursor: 'pointer' }}>
          <img 
            src="/assets/transparent.png" 
            alt="Valiant Picks" 
            className="logo-img"
            width="48"
            height="48"
            loading="eager"
          />
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
          <button onClick={() => handlePageChange('howto')} className={page === 'howto' ? 'active' : ''}>
            How to Use
          </button>
          {user && (user.is_admin || user.isAdminUser) && (
            <button onClick={() => handlePageChange('admin')} className={page === 'admin' ? 'active' : ''}>
              Admin
            </button>
          )}
        </div>
        <div className="nav-right">
          <div className="balance-display">
            <span className="balance-label">Balance:</span>
            <span className="balance-amount">{formatCurrency(currentUser?.balance || 0)}</span>
          </div>
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
          <span className="menu-text">MENU</span>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Slide-out Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
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
            onClick={() => handlePageChange('howto')} 
            className={page === 'howto' ? 'active' : ''}
          >
            <span className="menu-icon">❓</span>
            How to Use
          </button>
          <button 
            onClick={() => handlePageChange('about')} 
            className={page === 'about' ? 'active' : ''}
          >
            <span className="menu-icon">ℹ️</span>
            About
          </button>
          <button 
            onClick={() => handlePageChange('terms')} 
            className={page === 'terms' ? 'active' : ''}
          >
            <span className="menu-icon">⚖️</span>
            Terms
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
          <div className="mobile-menu-header">
            <div className="mobile-user-info">
              <div className="mobile-user-name">👤 {currentUser?.username || 'User'}</div>
              <div className="mobile-balance">💰 {formatCurrency(currentUser?.balance || 0)}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="mobile-logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="container">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard user={user} onNavigate={handlePageChange} updateUser={updateUser} fetchUserProfile={fetchUserProfile} />} />
            <Route path="/games" element={<Games user={currentUser} updateUser={updateUser} />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/bets" element={<BetList />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/howto" element={<HowToUse onNavigate={handlePageChange} />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            {currentUser && currentUser.is_admin && (
              <Route path="/admin" element={<AdminPanel />} />
            )}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </div>

      {token && <Footer onNavigate={handlePageChange} />}
      
      {token && <OnboardingModal />}
    </div>
    </ToastProvider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
