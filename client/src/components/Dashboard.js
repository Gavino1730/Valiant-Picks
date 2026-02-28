import React, { useState, useEffect, useCallback } from 'react';
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
  // TEMPORARILY DISABLED - balance state (used in commented-out CTA section)
  // const [balance, setBalance] = useState(user?.balance || 0);

  // Sync balance immediately when user prop changes
  // useEffect(() => {
  //   if (user?.balance !== undefined) {
  //     setBalance(user.balance);
  //   }
  // }, [user?.balance]);

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
  const [previousBets, setPreviousBets] = useState([]);
  // const [recentWinners, setRecentWinners] = useState([]); // TEMPORARILY DISABLED
  const [notificationsEnabled, setNotificationsEnabled] = useState(notificationService.isEnabled());
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [hasCheckedSpinWheel, setHasCheckedSpinWheel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // TEMPORARILY DISABLED - stats state (used in commented-out stats overview section)
  // const [stats, setStats] = useState({
  //   totalBets: 0,
  //   activeBets: 0,
  //   wonBets: 0,
  //   lostBets: 0,
  //   winRate: 0,
  //   totalWinnings: 0
  // });

  // Flex Schedule - HIDDEN FOR NOW
  /* const [flexSchedule] = useState({
    currentWeek: "5, 6, 7",
    note: "Flex schedule rotates weekly"
  }); */

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
              
              const winTimeout = setTimeout(() => {
                setWinNotification(null);
                setShowConfetti(false);
              }, 3000);
              // Store timeout for cleanup
              return () => clearTimeout(winTimeout);
            } else if (newBet.outcome === 'lost') {
              setLossNotification({ team: newBet.selected_team, amount: newBet.amount });
              
              // Send browser notification
              notificationService.betResolved({
                outcome: 'lost',
                team: newBet.selected_team,
                amount: formatCurrency(newBet.amount),
                potentialWin: 0
              });
              
              const lossTimeout = setTimeout(() => {
                setLossNotification(null);
              }, 2500);
              // Store timeout for cleanup
              return () => clearTimeout(lossTimeout);
            }
          }
        });
      }

      setPreviousBets(userBets);
      setBets(userBets);
      
      // TEMPORARILY DISABLED - Calculate stats (stats state is disabled)
      // const totalBets = userBets.length;
      // const activeBets = userBets.filter(b => b.status === 'pending').length;
      // const wonBets = userBets.filter(b => b.outcome === 'won').length;
      // const lostBets = userBets.filter(b => b.outcome === 'lost').length;
      // const winRate = totalBets > 0 ? Math.round((wonBets / (wonBets + lostBets)) * 100) || 0 : 0;
      // const totalWinnings = userBets
      //   .filter(b => b.outcome === 'won')
      //   .reduce((sum, b) => sum + (b.potential_win - b.amount), 0);
      
      // TEMPORARILY DISABLED - setStats (stats state is disabled)
      // setStats({
      //   totalBets,
      //   activeBets,
      //   wonBets,
      //   lostBets,
      //   winRate,
      //   totalWinnings
      // });
    } catch (err) {
      console.error('Error fetching bets:', err);
    }
  }, [previousBets]);

  // TEMPORARILY DISABLED - Recent Winners Feature
  // const fetchRecentWinners = useCallback(async () => {
  //   try {
  //     const response = await apiClient.get('/bets/recent-winners?limit=15');
  //     setRecentWinners(response.data || []);
  //   } catch (err) {
  //     console.error('Error fetching recent winners:', err);
  //     setRecentWinners([]);
  //   }
  // }, []);

  useEffect(() => {
    // Fetch all data in parallel for faster initial load
    Promise.all([
      fetchGames(),
      fetchBets()
      // fetchRecentWinners() // TEMPORARILY DISABLED
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
    
    // Poll recent winners every 30 seconds - TEMPORARILY DISABLED
    // const winnersInterval = setInterval(async () => {
    //   if (isActive && isPageVisible) {
    //     try {
    //       await fetchRecentWinners();
    //     } catch (err) {
    //       // Polling error - will retry
    //     }
    //   }
    // }, 30000);
    
    return () => {
      isActive = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(betsInterval);
      clearInterval(gamesInterval);
      // clearInterval(winnersInterval); // TEMPORARILY DISABLED
    };
  }, [fetchGames, fetchBets, hasCheckedSpinWheel, user]); // fetchRecentWinners TEMPORARILY DISABLED

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
    // TEMPORARILY DISABLED - setBalance (balance state is disabled)
    // setBalance(newBalance);
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
    // TEMPORARILY DISABLED - setBalance (balance state is disabled)
    // setBalance(newBalance);
    if (fetchUserProfile) {
      await fetchUserProfile();
    }
  };

  // Handle achievement claimed
  const handleAchievementClaimed = async (amount, newBalance) => {
    // TEMPORARILY DISABLED - setBalance (balance state is disabled)
    // setBalance(newBalance);
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

      {/* Bracket Advertisement */}
      <div className="bracket-ad-section">
        <div className="bracket-ad-free-badge">FREE TO PLAY</div>
        <div className="bracket-ad-inner">
          <div className="bracket-ad-left">
            <div className="bracket-ad-eyebrow">🏀 3A STATE PLAYOFFS</div>
            <h2 className="bracket-ad-headline">🆕 Both Brackets<br/>Are Now Open!<br/><span className="bracket-ad-highlight">Make Your Picks!</span></h2>
            <p className="bracket-ad-sub">The Boys & Girls 3A State Brackets are live — fill out your picks now before the next round starts!</p>
            <div className="bracket-ad-perks">
              <span className="bracket-perk">🎯 Pick every round</span>
              <span className="bracket-perk">💰 Win Valiant Bucks</span>
              <span className="bracket-perk">🏆 Top the leaderboard</span>
            </div>
          </div>
          <div className="bracket-ad-right">
            <div className="bracket-ad-bracket-visual">
              <div className="bv-line"><span className="bv-team gold">Valiant</span><span className="bv-win">→</span></div>
              <div className="bv-line"><span className="bv-team">OES</span></div>
              <div className="bv-divider"/>
              <div className="bv-line"><span className="bv-team">?</span><span className="bv-win">→</span></div>
              <div className="bv-line"><span className="bv-team">?</span></div>
              <div className="bv-champ">🏆 Champion?</div>
            </div>
            <div className="bracket-ad-buttons">
              <button className="bracket-ad-btn girls-btn" onClick={() => onNavigate && onNavigate('girls-bracket')}>Girls Bracket →</button>
            </div>
          </div>
        </div>
      </div>
      
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
      <div style={{minHeight: winNotification || lossNotification ? 'auto' : '0px', marginBottom: winNotification || lossNotification ? '1rem' : '0'}}>
        {winNotification && (
          <div className="win-notification">
            <span className="win-notification-emoji">🎉</span>
            <div className="win-notification-title">You Won!</div>
            <div className="win-notification-amount status--won u-num">+{formatCurrency(winNotification.amount)}</div>
            <div className="win-notification-team">{winNotification.team}</div>
          </div>
        )}
        
        {lossNotification && (
          <div className="loss-notification">
            <span className="loss-notification-emoji">😢</span>
            <div className="loss-notification-title">Loss</div>
            <div className="loss-notification-amount status--lost u-num">-{formatCurrency(lossNotification.amount)}</div>
            <div className="loss-notification-team">{lossNotification.team}</div>
          </div>
        )}
      </div>


      {/* Recent Winners Section - TEMPORARILY HIDDEN
      {recentWinners.length > 0 && (
        <div className="recent-winners-banner">
          <div className="recent-winners-header">
            <span className="recent-winners-icon">🏆</span>
            <h3>Recent Winners</h3>
            <span className="recent-winners-pulse">🔴 LIVE</span>
          </div>
          <div className="recent-winners-carousel">
            <div className="winners-scroll">
              {recentWinners.concat(recentWinners).map((winner, index) => {
                const profit = winner.potential_win - winner.amount;
                return (
                  <div key={`${winner.id}-${index}`} className="winner-card">
                    <div className="winner-avatar">{winner.users?.username?.charAt(0).toUpperCase() || '?'}</div>
                    <div className="winner-info">
                      <div className="winner-username">{winner.users?.username || 'Anonymous'}</div>
                      <div className="winner-details">
                        <span className="winner-team">{winner.selected_team}</span>
                        <span className="winner-multiplier">{winner.odds}x</span>
                      </div>
                    </div>
                    <div className="winner-amount">
                      <span className="winner-won-label">WON</span>
                      <span className="winner-won-value">+{formatCurrency(profit)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      */}

      {/* School Alerts - TEMPORARILY HIDDEN
      {schoolAlerts.length > 0 && (
        <div className="school-alerts">
          {schoolAlerts.map(alert => (
            <div key={alert.id} className={`alert-banner alert-${alert.type}`}>
              <span className="alert-icon">
                {alert.type === 'warning' && '⚠️'}
                {alert.type === 'info' && 'ℹ️'}
                {alert.type === 'success' && '✅'}
              </span>
              <span className="alert-message">{alert.message}</span>
            </div>
          ))}
        </div>
      )}
      */}

      {/* Stats Overview - Compact - TEMPORARILY HIDDEN
      <div className="dashboard-stats-compact">
        <div className="stat-compact">
          <span className="stat-compact-value">{stats.totalBets}</span>
          <span className="stat-compact-label">Total Picks</span>
        </div>
        <div className="stat-compact pending">
          <span className="stat-compact-value">{stats.activeBets}</span>
          <span className="stat-compact-label">Pending</span>
        </div>
        <div className="stat-compact won">
          <span className="stat-compact-value">{stats.wonBets}</span>
          <span className="stat-compact-label">Won</span>
        </div>
        <div className="stat-compact lost">
          <span className="stat-compact-value">{stats.lostBets}</span>
          <span className="stat-compact-label">Lost</span>
        </div>
        <div className="stat-compact profit" style={{borderColor: stats.totalWinnings >= 0 ? '#66bb6a' : '#ef5350'}}>
          <span className="stat-compact-value" style={{color: stats.totalWinnings >= 0 ? '#81c784' : '#ef5350'}}>
            {stats.totalWinnings >= 0 ? '+' : ''}{formatCurrency(stats.totalWinnings)}
          </span>
          <span className="stat-compact-label">Profit</span>
        </div>
      </div>
      */}

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
                {upcomingGames.map(game => (
                  <div key={game.id} className="upcoming-game-card">
                    <div className="game-matchup-display">
                      <span className="team-name">{game.home_team}</span>
                      <span className="vs-divider">vs</span>
                      <span className="team-name">{game.away_team}</span>
                    </div>
                    <div className="game-details-row">
                      <span className="game-date-display">
                        {parseLocalDateOnly(game.game_date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'TBD'}
                      </span>
                    </div>
                  </div>
                ))}
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
                {recentActivity.map(activity => (
                  <div key={activity.id} className="activity-card">
                    <div className="activity-header">
                      <span className="activity-team">{activity.selected_team}</span>
                      <span className="activity-bet-amount">{formatCurrency(activity.amount)}</span>
                    </div>
                    <div className="activity-footer">
                      <span className={`activity-status status-${activity.status === 'pending' ? 'pending' : activity.outcome}`}>
                        {activity.status === 'pending'
                          ? '⏳ Pending'
                          : activity.outcome === 'won'
                          ? '✅ Won'
                          : '❌ Lost'}
                      </span>
                      {activity.outcome === 'won' && (
                        <span className="activity-profit won">+{formatCurrency(activity.potential_win - activity.amount)}</span>
                      )}
                      {activity.outcome === 'lost' && (
                        <span className="activity-profit lost">-{formatCurrency(activity.amount)}</span>
                      )}
                      {activity.status === 'pending' && (
                        <span className="activity-potential">
                          Potential: +{formatCurrency(activity.potential_win - activity.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
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
