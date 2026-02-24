import React, { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import './styles/design-system.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import OnboardingModal from './components/OnboardingModal';
import RivalryWeekPopup from './components/RivalryWeekPopup';
import Footer from './components/Footer';
import { ToastProvider, useToast } from './components/ToastProvider';
import './styles/Toast.css';
import apiClient from './utils/axios';
import { formatCurrency } from './utils/currency';
import notificationService from './utils/notifications';

// Helper to handle chunk load errors - retry once then refresh
const lazyWithRetry = (componentImport) => {
  return lazy(() => 
    componentImport().catch((error) => {
      // Check if this is a chunk load error
      if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
        // Check if we already tried refreshing
        const lastRefresh = sessionStorage.getItem('lastChunkRefresh');
        const now = Date.now();
        
        // Only refresh if we haven't refreshed in the last 30 seconds
        if (!lastRefresh || (now - parseInt(lastRefresh)) > 30000) {
          sessionStorage.setItem('lastChunkRefresh', now.toString());
          window.location.reload();
          // Return a never-resolving promise to prevent error propagation during reload
          return new Promise(() => {});
        }
        // Already refreshed recently - return a fallback component instead of throwing
        return { default: () => {
          const React = require('react');
          return React.createElement('div', { 
            style: { padding: '2rem', textAlign: 'center', color: '#666' } 
          }, 
            React.createElement('p', null, 'This page failed to load. Please clear your browser cache and refresh.'),
            React.createElement('button', {
              onClick: () => { sessionStorage.removeItem('lastChunkRefresh'); window.location.reload(); },
              style: { marginTop: '1rem', padding: '8px 16px', backgroundColor: '#004f9e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }
            }, 'Refresh Now')
          );
        }};
      }
      throw error;
    })
  );
};

// Lazy load admin and less-frequently-used components with retry
const AdminPanel = lazyWithRetry(() => import('./components/AdminPanel'));
const BetList = lazyWithRetry(() => import('./components/BetList'));
const Leaderboard = lazyWithRetry(() => import('./components/Leaderboard'));
const Teams = lazyWithRetry(() => import('./components/Teams'));
const Games = lazyWithRetry(() => import('./components/Games'));
const Bracket = lazyWithRetry(() => import('./components/Bracket'));
const ActualBracket = lazyWithRetry(() => import('./components/ActualBracket'));
const BracketLeaderboard = lazyWithRetry(() => import('./components/BracketLeaderboard'));
const Notifications = lazyWithRetry(() => import('./components/Notifications'));
const HowToUse = lazyWithRetry(() => import('./components/HowToUse'));
const About = lazyWithRetry(() => import('./components/About'));
const Terms = lazyWithRetry(() => import('./components/Terms'));

// Simple loading fallback
const LoadingSpinner = () => (
  <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
    Loading...
  </div>
);

const NavLink = ({ label, pageKey, currentPage, onNavigate, className, activeFor }) => {
  const isActive = currentPage === pageKey || (activeFor && activeFor.includes(currentPage));
  return (
    <button
      type="button"
      onClick={() => onNavigate(pageKey)}
      className={`nav-link${isActive ? ' active' : ''}${className ? ` ${className}` : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </button>
  );
};

function GiftBalanceWatcher({ user, updateUser }) {
  const { showToast } = useToast();
  const checkIntervalRef = useRef(null);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const currentBalance = Number(user.balance ?? 0);
    
    // Clear any existing interval
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    // Only monitor if balance is 0
    if (currentBalance > 0) {
      return undefined;
    }

    // Check immediately and then every 30 seconds
    const checkGiftBalance = async () => {
      try {
        const response = await apiClient.post('/users/gift-balance');
        
        if (response.data?.user) {
          updateUser(response.data.user);
        }
        
        if (response.data?.gifted) {
          showToast(
            '🎁 Your 72-hour wait is complete! We\'ve added 500 Valiant Bucks to your account - spendable immediately!',
            'success',
            8000
          );
          // Clear interval since gift was received
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
        }
      } catch (err) {
        // Error handled silently
      }
    };

    // Check immediately
    checkGiftBalance();
    
    // Then check every 30 seconds while balance is 0
    checkIntervalRef.current = setInterval(checkGiftBalance, 30000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [user?.balance, user, showToast, updateUser]);

  return null;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const mobileMenuCloseRef = useRef(null);
  const mobileMenuToggleRef = useRef(null);
  const userMenuRef = useRef(null);
  const userMenuButtonRef = useRef(null);
  const navbarRef = useRef(null);
  const profilePollRef = useRef({ timeoutId: null, delay: 15000, inFlight: false });
  const previousNotificationIds = useRef(new Set());
  
  // Get page from URL path
  const page = location.pathname.slice(1) || 'dashboard';

  useEffect(() => {
    // Token is now handled by axios interceptor
    if (token && !user) {
      // Load user from localStorage if not in state
      const storedUser = localStorage.getItem('user');
      if (storedUser && storedUser !== 'undefined') {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          // Corrupted localStorage value - clean up
          localStorage.removeItem('user');
        }
      }
    }
  }, [token, user]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return undefined;
    }

    const menuElement = mobileMenuRef.current;
    if (!menuElement) {
      return undefined;
    }

    const previousActiveElement = document.activeElement;
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    const getFocusableElements = () => Array.from(
      menuElement.querySelectorAll(focusableSelectors.join(','))
    );

    const focusFirstElement = () => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileMenuOpen(false);
        if (mobileMenuToggleRef.current) {
          mobileMenuToggleRef.current.focus();
        }
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const isShift = event.shiftKey;

      if (isShift && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!isShift && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    setTimeout(focusFirstElement, 0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement && previousActiveElement.focus) {
        previousActiveElement.focus();
      }
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!userMenuOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      const menuElement = userMenuRef.current;
      const triggerElement = userMenuButtonRef.current;

      if (!menuElement || !triggerElement) {
        return;
      }

      if (!menuElement.contains(event.target) && !triggerElement.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        if (userMenuButtonRef.current) {
          userMenuButtonRef.current.focus();
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (err) {
      // Fail silently - unread count is not critical
    }
  }, []);

  const sendBrowserNotification = useCallback((notification) => {
    // Map notification types to browser notification messages
    const typeMessages = {
      'bet_won': { title: '🎉 Bet Won!', body: notification.message },
      'bet_lost': { title: '😔 Bet Lost', body: notification.message },
      'bet_placed': { title: '✅ Bet Placed', body: notification.message },
      'balance_gift': { title: '🎁 Balance Gift', body: notification.message },
      'balance_pending': { title: '⏳ Balance Pending', body: notification.message },
      'default': { title: notification.title || '📢 Notification', body: notification.message }
    };

    const messageData = typeMessages[notification.type] || typeMessages.default;
    
    notificationService.send(messageData.title, {
      body: messageData.body,
      tag: `notification-${notification.id}`,
      data: { notificationId: notification.id, type: notification.type }
    });
  }, []);

  const fetchAndCheckNotifications = useCallback(async () => {
    try {
      const response = await apiClient.get('/notifications');
      const notifications = response.data || [];
      
      // Check for new unread notifications and send browser notifications
      if (previousNotificationIds.current.size > 0) {
        notifications.forEach(notification => {
          // If this is a new notification that wasn't in the previous set and is unread
          if (!previousNotificationIds.current.has(notification.id) && !notification.is_read) {
            sendBrowserNotification(notification);
          }
        });
      }
      
      // Update the set of notification IDs we've seen
      previousNotificationIds.current = new Set(notifications.map(n => n.id));
    } catch (err) {
      // Fail silently - notifications are not critical
    }
  }, [sendBrowserNotification]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await apiClient.get('/users/profile');
      const updatedUser = response.data;
      if (updatedUser && updatedUser.id) {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return updatedUser;
    } catch (err) {
      // Fail silently - will retry
      return null;
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    fetchUnreadCount();
    fetchAndCheckNotifications(); // Initial fetch
    
    // Poll notifications every 20 seconds
    const notificationInterval = setInterval(() => {
      fetchUnreadCount();
      fetchAndCheckNotifications();
    }, 20000);
    
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
        pollRef.delay = 15000;
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
      pollRef.delay = 15000;
    };
  }, [token, fetchUnreadCount, fetchAndCheckNotifications, fetchUserProfile]);

  const updateUser = (userData) => {
    if (!userData) return;
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogin = (newToken, userData) => {
    if (!newToken || !userData) return;
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
    setUserMenuOpen(false);
  };

  useEffect(() => {
    if (!navbarRef.current) {
      return undefined;
    }

    const updateNavbarHeight = () => {
      if (!navbarRef.current) return;
      const height = navbarRef.current.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--navbar-height', `${height}px`);
    };

    updateNavbarHeight();

    const resizeObserver = new ResizeObserver(updateNavbarHeight);
    resizeObserver.observe(navbarRef.current);
    window.addEventListener('resize', updateNavbarHeight);
    window.addEventListener('orientationchange', updateNavbarHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateNavbarHeight);
      window.removeEventListener('orientationchange', updateNavbarHeight);
    };
  }, [token]);

  if (!token) {
    return (
      <ToastProvider>
        <Login onLogin={handleLogin} />
      </ToastProvider>
    );
  }

  // Get user data from state or localStorage
  let currentUser = user;
  if (!currentUser) {
    try {
      const stored = localStorage.getItem('user');
      if (stored && stored !== 'undefined') {
        currentUser = JSON.parse(stored);
      }
    } catch (e) {
      localStorage.removeItem('user');
    }
  }

  // Rivalry Week Configuration - Toggle enabled to true/false
  const rivalryWeekConfig = {
    enabled: false, // Set to false to disable
    gameInfo: {
      opponent: 'OES',
      date: 'This Tuesday!',
      time: '7:30 PM',
      location: 'Valiants Gym'
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

      <nav className="navbar" ref={navbarRef}>
        <div className="playoff-header-banner">
          <span className="phb-trophy">🏆</span>
          <span className="phb-title">It's Playoff Time!</span>
          <span className="phb-games">
            <span>Boys · Fri 6PM vs OES (#14) 🏠</span>
            <span className="phb-divider">|</span>
            <span>Girls · Sat 5PM vs Taft (#11) 🏠</span>
          </span>
        </div>
        <div className="nav-inner">
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
            <NavLink label="Dashboard" pageKey="dashboard" currentPage={page} onNavigate={handlePageChange} />
            <NavLink label="Place Picks" pageKey="games" currentPage={page} onNavigate={handlePageChange} />
            <NavLink label="Bracket" pageKey="bracket" currentPage={page} onNavigate={handlePageChange} activeFor={['boys-bracket', 'girls-bracket', 'bracket-leaderboard', 'actual-bracket', 'girls-actual-bracket', 'girls-bracket-leaderboard']} />
            <NavLink label="Teams" pageKey="teams" currentPage={page} onNavigate={handlePageChange} />
            <NavLink label="My Picks" pageKey="bets" currentPage={page} onNavigate={handlePageChange} />
            <NavLink label="Leaderboard" pageKey="leaderboard" currentPage={page} onNavigate={handlePageChange} />
            <NavLink label="How to Use" pageKey="howto" currentPage={page} onNavigate={handlePageChange} />
          </div>
          <div className="nav-right">
            <div className="balance-display balance-pill" aria-label="Account balance">
              <span className="balance-label">Balance</span>
              <span className="balance-amount">{formatCurrency(currentUser?.balance || 0)}</span>
            </div>
            <button 
              onClick={() => handlePageChange('notifications')} 
              className={`notification-icon-btn nav-icon-button${page === 'notifications' ? ' active' : ''}`}
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            >
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge" aria-hidden="true">{unreadCount}</span>
              )}
            </button>
            <div className="nav-user">
              <button
                type="button"
                className="nav-user-trigger"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                ref={userMenuButtonRef}
                title={currentUser?.username || 'User'}
              >
                <span className="nav-username">{currentUser?.username || 'User'}</span>
                <span className="nav-user-chevron" aria-hidden="true">▾</span>
              </button>
              <div
                className={`nav-user-menu${userMenuOpen ? ' open' : ''}`}
                role="menu"
                aria-hidden={!userMenuOpen}
                ref={userMenuRef}
              >
                {user && (user.is_admin || user.isAdminUser) && (
                  <button
                    type="button"
                    className="nav-user-item nav-user-item--muted"
                    role="menuitem"
                    onClick={() => handlePageChange('admin')}
                  >
                    Admin
                  </button>
                )}
                <button
                  type="button"
                  className="nav-user-item"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
            <div className="user-info" title={currentUser?.username || 'User'}>
              <span className="username">{currentUser?.username || 'User'}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn" aria-label="Log out">
              Logout
            </button>
          </div>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            ref={mobileMenuToggleRef}
          >
            <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span className="menu-text">Menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Slide-out Menu */}
      <div
        id="mobile-menu"
        className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}
        ref={mobileMenuRef}
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileMenuOpen}
      >
        <div className="mobile-menu-header">
          <div className="mobile-menu-brand">
            <img
              src="/assets/transparent.png"
              alt="Valiant Picks"
              className="mobile-menu-logo"
              width="24"
              height="24"
              loading="eager"
            />
            <span className="mobile-menu-title">Valiant Picks</span>
          </div>
          <button
            className="mobile-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            ref={mobileMenuCloseRef}
          >
            ✕
          </button>
        </div>

        {/* Navigation Menu */}
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
            Place Picks
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
            onClick={() => handlePageChange('bracket')} 
            className={['bracket','boys-bracket','girls-bracket','bracket-leaderboard','actual-bracket','girls-actual-bracket','girls-bracket-leaderboard'].includes(page) ? 'active' : ''}
          >
            <span className="menu-icon">🎯</span>
            Bracket
          </button>
          <button 
            onClick={() => handlePageChange('actual-bracket')} 
            className={['actual-bracket','girls-actual-bracket'].includes(page) ? 'active' : ''}
          >
            <span className="menu-icon">📋</span>
            Results
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

        {/* User Info and Logout Button at Bottom */}
        <div className="mobile-menu-footer">
          <div className="mobile-user-info">
            <div className="mobile-user-name">👤 {currentUser?.username || 'User'}</div>
            <div className="mobile-balance">💰 {formatCurrency(currentUser?.balance || 0)}</div>
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
            <Route path="/bracket" element={<Bracket updateUser={updateUser} />} />
            <Route path="/girls-bracket" element={<Bracket gender="girls" updateUser={updateUser} />} />
            <Route path="/actual-bracket" element={<ActualBracket />} />
            <Route path="/girls-actual-bracket" element={<ActualBracket gender="girls" />} />
            <Route path="/bracket-leaderboard" element={<BracketLeaderboard />} />
            <Route path="/girls-bracket-leaderboard" element={<BracketLeaderboard gender="girls" />} />
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
