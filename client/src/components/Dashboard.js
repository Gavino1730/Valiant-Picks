import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../utils/axios';
import '../styles/Dashboard.css';
import '../styles/Skeleton.css';
import '../styles/Confetti.css';
import { formatCurrency } from '../utils/currency';
import Confetti from './Confetti';
import { UpcomingGameSkeleton } from './Skeleton';
import notificationService from '../utils/notifications';
import DailyReward from './DailyReward';
import SpinWheel from './SpinWheel';
import Achievements from './Achievements';
import popupQueue from '../utils/popupQueue';

function Dashboard({ user, onNavigate, updateUser, fetchUserProfile }) {
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [games, setGames] = useState([]);
  const [bets, setBets] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [winNotification, setWinNotification] = useState(null);
  const [lossNotification, setLossNotification] = useState(null);
  const winTimeoutRef = useRef(null);
  const lossTimeoutRef = useRef(null);
  const [previousBets, setPreviousBets] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(notificationService.isEnabled());
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [hasCheckedSpinWheel, setHasCheckedSpinWheel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const parseLocalDateOnly = (dateStr) => {
    const [year, month, day] = (dateStr || '').split('-').map(Number);
    if (Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)) {
      return new Date(year, month - 1, day);
    }
    const parsed = new Date(dateStr);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const fetchGames = useCallback(async () => {
    try {
      const response = await apiClient.get('/games');
      // Sort games by date (earliest first)
      const sortedGames = (response.data || []).sort((a, b) => {
        return new Date(a.game_date) - new Date(b.game_date);
      });
      setGames(sortedGames);
    } catch (err) {
      console.error('Error fetching games:', err.message || err);
      setGames(prevGames => {
        return prevGames.length === 0 ? [] : prevGames;
      });
    } finally {
      setGamesLoading(false);
    }
  }, []);

  const fetchBets = useCallback(async () => {
    try {
      // Only fetch recent bets for dashboard (last 50) for better performance
      const response = await apiClient.get('/bets?limit=50');
      const userBets = response.data || [];

      // Check for newly resolved bets
      if (previousBets.length > 0) {
        userBets.forEach(newBet => {
          const oldBet = previousBets.find(b => b.id === newBet.id);
          if (oldBet && oldBet.status === 'pending' && newBet.status === 'resolved') {
            // Bet was just resolved
            if (newBet.outcome === 'won') {
              const profit = newBet.potential_win ? (parseFloat(newBet.potential_win) - parseFloat(newBet.amount)) : 0;
              setWinNotification({ team: newBet.selected_team, amount: profit });
              setShowConfetti(true);
              
              // Send browser notification
              notificationService.betResolved({
                outcome: 'won',
                team: newBet.selected_team,
                amount: formatCurrency(profit),
                potentialWin: newBet.potential_win
              });
              
              if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
              winTimeoutRef.current = setTimeout(() => {
                setWinNotification(null);
                setShowConfetti(false);
              }, 1500);
            } else if (newBet.outcome === 'lost') {
              setLossNotification({ team: newBet.selected_team, amount: newBet.amount });
              
              // Send browser notification
              notificationService.betResolved({
                outcome: 'lost',
                team: newBet.selected_team,
                amount: formatCurrency(newBet.amount),
                potentialWin: 0
              });
              
              if (lossTimeoutRef.current) clearTimeout(lossTimeoutRef.current);
              lossTimeoutRef.current = setTimeout(() => {
                setLossNotification(null);
              }, 1500);
            }
          }
        });
      }

      setPreviousBets(userBets);
      setBets(userBets);
    } catch (err) {
      console.error('Error fetching bets:', err);
    }
  }, [previousBets]);

  useEffect(() => {
    // Fetch all data in parallel for faster initial load
    Promise.all([
      fetchGames(),
      fetchBets()
    ]);
    
    // Check if user should see spin wheel automatically
    const checkAutoOpenSpinWheel = async () => {
      if (hasCheckedSpinWheel) return;
      // Only check for authenticated users
      if (!user) {
        setHasCheckedSpinWheel(true);
        return;
      }
      
      try {
        const response = await apiClient.get('/wheel/can-spin');
        const today = new Date().toDateString();
        const lastShown = localStorage.getItem('lastSpinWheelShown');
        
        // Auto-open if user has spins and hasn't seen it today
        if (response.data.canSpin && lastShown !== today) {
          // Add to popup queue with priority 3 (show third, after daily reward)
          popupQueue.enqueue(
            'spinWheel',
            () => {
              setShowSpinWheel(true);
              localStorage.setItem('lastSpinWheelShown', today);
            },
            3, // Priority: 3 (show last)
            0 // No initial delay (queue handles timing)
          );
        }
        setHasCheckedSpinWheel(true);
      } catch (error) {
        console.error('Error checking spin wheel availability:', error);
        // Mark as checked even on error to prevent infinite retries
        setHasCheckedSpinWheel(true);
      }
    };
    
    checkAutoOpenSpinWheel();
    
    // Create abort controller to handle unmounting gracefully
    let isActive = true;
    let isPageVisible = true;
    
    // Track page visibility to pause polling when tab is not in focus
    const handleVisibilityChange = () => {
      isPageVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Poll with proper cleanup: bets every 15 seconds, games every 60 seconds
    const betsInterval = setInterval(async () => {
      if (isActive && isPageVisible) {
        try {
          await fetchBets();
        } catch (err) {
          // Polling error - will retry
        }
      }
    }, 15000);
    
    const gamesInterval = setInterval(async () => {
      if (isActive && isPageVisible) {
        try {
          await fetchGames();
        } catch (err) {
          // Polling error - will retry
        }
      }
    }, 60000);
    
    return () => {
      isActive = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(betsInterval);
      clearInterval(gamesInterval);
    };
  }, [fetchGames, fetchBets, hasCheckedSpinWheel, user]);

  const upcomingGames = React.useMemo(() => games.slice(0, 5), [games]);
  const recentActivity = React.useMemo(
    () => [...bets].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6),
    [bets]
  );

  // Handle notification toggle
  const handleNotificationToggle = async () => {
    const result = await notificationService.toggle();
    setNotificationsEnabled(result);
  };

  // Handle notification banner dismiss
  const handleNotificationBannerDismiss = () => {
    notificationService.dismissBanner();
    setNotificationsEnabled(true); // Hide banner by setting to truthy value
  };

  // Handle daily reward claimed
  const handleDailyRewardClaimed = async (amount, newBalance, streak) => {
    if (fetchUserProfile) {
      await fetchUserProfile();
    }
    
    // Check for streak achievements
    try {
      await apiClient.post('/achievements/check-all-games');
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  // Handle spin wheel prize
  const handleSpinWheelPrize = async (amount, newBalance) => {
    if (fetchUserProfile) {
      await fetchUserProfile();
    }
  };

  // Handle achievement claimed
  const handleAchievementClaimed = async (amount, newBalance) => {
    if (fetchUserProfile) {
      await fetchUserProfile();
    }
  };
  
  return (
    <div className="dashboard school-dashboard ds-page">
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {/* Daily Reward Modal */}
      <DailyReward onRewardClaimed={handleDailyRewardClaimed} user={user} />
      
      {/* Achievements Popup */}
      <Achievements onAchievementClaimed={handleAchievementClaimed} user={user} />

      {/* Notification Permission Banner */}
      {!notificationsEnabled && !isMobile && !notificationService.isBannerDismissed() && (
        <div className="notification-banner">
          <div className="notification-banner-icon">🔔</div>
          <div className="notification-banner-content">
            <strong>Enable Notifications</strong>
            <p>Get instant updates when your bets are resolved, new games are available, and more!</p>
          </div>
          <button className="notification-banner-btn" onClick={handleNotificationToggle}>
            Enable Notifications
          </button>
          <button className="notification-banner-close" onClick={handleNotificationBannerDismiss} title="Don't show again">
            ✕
          </button>
        </div>
      )}
      
      {/* Win/Loss Notifications */}
      {winNotification && (
        <div className="notification-dismiss-overlay" onClick={() => { clearTimeout(winTimeoutRef.current); setWinNotification(null); setShowConfetti(false); }}>
          <div className="win-notification" onClick={(e) => e.stopPropagation()}>
            <span className="win-notification-emoji">🎉</span>
            <div className="win-notification-title">You Won!</div>
            <div className="win-notification-amount status--won u-num">+{formatCurrency(winNotification.amount)}</div>
            <div className="win-notification-team">{winNotification.team}</div>
          </div>
        </div>
      )}

      {lossNotification && (
        <div className="notification-dismiss-overlay" onClick={() => { clearTimeout(lossTimeoutRef.current); setLossNotification(null); }}>
          <div className="loss-notification" onClick={(e) => e.stopPropagation()}>
            <span className="loss-notification-emoji">😢</span>
            <div className="loss-notification-title">Loss</div>
            <div className="loss-notification-amount status--lost u-num">-{formatCurrency(lossNotification.amount)}</div>
            <div className="loss-notification-team">{lossNotification.team}</div>
          </div>
        </div>
      )}


      {/* Back to the Bay - State Playoffs Banner */}
      <div className="back-to-bay-banner">
        <div className="bay-banner-glow"></div>
        <div className="bay-banner-top-badge">🏆 STATE PLAYOFFS — FINAL 8 🏆</div>
        <div className="bay-banner-content">
          <div className="bay-banner-trophy">🏀</div>
          <div className="bay-banner-text">
            <div className="bay-banner-headline">WE&rsquo;RE GOING TO COOS BAY!</div>
            <div className="bay-banner-sub">Both programs in the Final 8 &mdash; biggest moment in years</div>
          </div>
          <div className="bay-banner-trophy">🏀</div>
        </div>
        <div className="bay-banner-teams-row">
          <div className="bay-team-card boys">
            <span className="bay-team-label">🔥 BOYS</span>
            <span className="bay-team-status">STATE TITLE CONTENDERS</span>
            <span className="bay-team-note">Strong chance to bring it home</span>
          </div>
          <div className="bay-team-card girls">
            <span className="bay-team-label">⭐ GIRLS</span>
            <span className="bay-team-status">HISTORIC APPEARANCE</span>
            <span className="bay-team-note">First time in years &mdash; making history</span>
          </div>
        </div>
        <div className="bay-banner-wave">🚌 Booster Buses Heading to Coos Bay &mdash; Come Cheer &rsquo;Em On! 🌊</div>
      </div>

      {/* Main Grid Layout */}
      <div className="dashboard-grid school-grid">
        {/* Left Column */}
        <div className="dashboard-main-column">
          {/* Welcome Section with Balance - PRIMARY CTA */}
          <div className="card welcome-card-primary">
            <div className="welcome-header">
              <h2>Welcome back, {user?.username || 'Bettor'}!</h2>
              <div className="balance-display-large">
                <span className="balance-label">Your Balance</span>
                <span className="balance-amount">{formatCurrency(user?.balance ?? 0)}</span>
              </div>
            </div>
            <button 
              className="btn btn-primary btn-cta-large"
              onClick={() => onNavigate && onNavigate('games')}
            >
              🏀 Place Your Picks Now
            </button>
          </div>

          {/* Upcoming Games Section */}
          <div className="card upcoming-section">
            <h3>🏀 Upcoming Games</h3>
            {gamesLoading ? (
              <div>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <UpcomingGameSkeleton key={idx} />
                ))}
              </div>
            ) : upcomingGames.length > 0 ? (
              <div className="upcoming-games-grid">
                {upcomingGames.map(game => {
                  const isGirls = game.team_type === 'Girls Basketball';
                  const isBoys = game.team_type === 'Boys Basketball';
                  return (
                    <div key={game.id} className={`upcoming-game-card${isGirls ? ' girls-game' : isBoys ? ' boys-game' : ''}`}>
                      <div className="game-matchup-display">
                        <span className="team-name">{game.home_team}</span>
                        <span className="vs-divider">vs</span>
                        <span className="team-name">{game.away_team}</span>
                      </div>
                      <div className="game-details-row">
                        <span className="game-date-display">
                          {parseLocalDateOnly(game.game_date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'TBD'}
                        </span>
                        {game.team_type && (
                          <span className={`gender-badge ${isGirls ? 'gender-badge-girls' : 'gender-badge-boys'}`}>
                            {isGirls ? '♀ Girls' : '♂ Boys'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="empty-text">No upcoming games</p>
            )}
            <button 
              className="btn btn-secondary btn-full-width"
              onClick={() => onNavigate && onNavigate('games')}
            >
              View All Games
            </button>
          </div>

          {/* Recent Activity Section */}
          <div className="card recent-activity-section">
            <h3>📊 Recent Picks</h3>
            {recentActivity.length > 0 ? (
              <div className="recent-activity-grid">
                {recentActivity.map(activity => {
                  const game = activity.games || {};
                  const outcomeKey = activity.status === 'pending' ? 'pending' : activity.outcome;
                  const confidenceLabel = activity.bet_type === 'high' ? 'High' : activity.bet_type === 'medium' ? 'Med' : 'Low';
                  const oddsLabel = `${activity.odds}x`;
                  const isGirls = game.team_type === 'Girls Basketball';
                  const gameDate = game.game_date
                    ? parseLocalDateOnly(game.game_date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : null;
                  return (
                    <div key={activity.id} className={`activity-card outcome-${outcomeKey}`}>
                      {/* Top row: matchup + date + gender */}
                      <div className="activity-matchup-row">
                        <div className="activity-matchup-teams">
                          {game.home_team && game.away_team ? (
                            <span className="activity-matchup-text">{game.home_team} <span className="activity-vs">vs</span> {game.away_team}</span>
                          ) : (
                            <span className="activity-matchup-text">{activity.selected_team}</span>
                          )}
                        </div>
                        <div className="activity-matchup-meta">
                          {game.team_type && (
                            <span className={`activity-gender-badge ${isGirls ? 'girls' : 'boys'}`}>
                              {isGirls ? '♀ Girls' : '♂ Boys'}
                            </span>
                          )}
                          {gameDate && <span className="activity-game-date">{gameDate}</span>}
                        </div>
                      </div>
                      {/* Bottom row: picked team + confidence + amount + result */}
                      <div className="activity-details-row">
                        <div className="activity-pick-info">
                          <span className="activity-pick-label">Pick:</span>
                          <span className="activity-team">{activity.selected_team}</span>
                          <span className={`activity-confidence confidence-${activity.bet_type}`}>{confidenceLabel} {oddsLabel}</span>
                        </div>
                        <div className="activity-result-info">
                          <span className={`activity-status status-${outcomeKey}`}>
                            {activity.status === 'pending' ? '⏳ Pending' : activity.outcome === 'won' ? '✅ Won' : '❌ Lost'}
                          </span>
                          <div className="activity-amounts">
                            <span className="activity-bet-amount">{formatCurrency(activity.amount)}</span>
                            {activity.outcome === 'won' && (
                              <span className="activity-profit won">+{formatCurrency(activity.potential_win - activity.amount)}</span>
                            )}
                            {activity.outcome === 'lost' && (
                              <span className="activity-profit lost">-{formatCurrency(activity.amount)}</span>
                            )}
                            {activity.status === 'pending' && (
                              <span className="activity-potential">→ {formatCurrency(activity.potential_win)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="empty-text">No recent picks</p>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="dashboard-sidebar">
          {/* Spin Wheel CTA - Secondary */}
          <div className="card spin-wheel-card">
            <h3>🎰 Daily Spin Wheel</h3>
            <p>Spin once per day for bonus Valiant Bucks!</p>
            <button 
              className="btn btn-spin-wheel"
              onClick={() => setShowSpinWheel(true)}
            >
              Spin to Win!
            </button>
          </div>

          {/* Quick Links - Minimal */}
          <div className="card quick-links-minimal">
            <h4>Quick Links</h4>
            <div className="quick-links-list">
              <button 
                className="quick-link-item"
                onClick={() => onNavigate && onNavigate('teams')}
              >
                Teams
              </button>
              <button 
                className="quick-link-item"
                onClick={() => onNavigate && onNavigate('leaderboard')}
              >
                Leaderboard
              </button>
              <button 
                className="quick-link-item"
                onClick={() => onNavigate && onNavigate('about')}
              >
                About
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spin Wheel Modal */}
      <SpinWheel 
        isOpen={showSpinWheel} 
        onClose={() => setShowSpinWheel(false)}
        onPrizeWon={handleSpinWheelPrize} 
      />
    </div>
  );
}

export default Dashboard;
