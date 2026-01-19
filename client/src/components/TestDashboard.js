import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/axios';
import '../styles/TestDashboard.css';
import '../styles/Skeleton.css';
import '../styles/Confetti.css';
import { formatCurrency } from '../utils/currency';
import Confetti from './Confetti';
import { UpcomingGameSkeleton } from './Skeleton';
import notificationService from '../utils/notifications';

function TestDashboard({ user, onNavigate, updateUser, fetchUserProfile }) {
  const [balance, setBalance] = useState(user?.balance || 0);

  // Sync balance immediately when user prop changes
  useEffect(() => {
    if (user?.balance !== undefined) {
      setBalance(user.balance);
    }
  }, [user?.balance]);
  const [games, setGames] = useState([]);
  const [bets, setBets] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [winNotification, setWinNotification] = useState(null);
  const [lossNotification, setLossNotification] = useState(null);
  const [previousBets, setPreviousBets] = useState([]);
  const [recentWinners, setRecentWinners] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(notificationService.isEnabled());
  const [stats, setStats] = useState({
    totalBets: 0,
    activeBets: 0,
    wonBets: 0,
    lostBets: 0,
    winRate: 0,
    totalWinnings: 0
  });

  // Spirit Week Data - Broadway Theme - NOW VISIBLE
  const [spiritWeekData] = useState({
    theme: "Broadway Bonanza",
    weekOf: "February 3-7, 2026",
    description: "Each grade decorates their hallway to their musical theme. Judges rank hallways for points. Daily dress-up themes earn participation points. Check in teachers for your grade to get DOUBLE points!",
    events: [
      { day: "Monday-Thursday", event: "Daily Dress-Up Themes (TBD)" },
      { day: "Tuesday", event: "🎯 Tug of War Competition" },
      { day: "Friday", event: "🎤 Lip Sync Battle Finals" },
      { day: "Saturday", event: "💃 Sadie Hawkins Dance (Theme TBD)" }
    ],
    grades: [
      {
        grade: "Freshmen",
        subtheme: "Wicked",
        color: "#00C853",
        icon: "🧙‍♀️",
        points: 245
      },
      {
        grade: "Sophomores",
        subtheme: "Lion King",
        color: "#FF9800",
        icon: "🦁",
        points: 312
      },
      {
        grade: "Juniors",
        subtheme: "Grease",
        color: "#E91E63",
        icon: "🎸",
        points: 298
      },
      {
        grade: "Seniors",
        subtheme: "Hamilton",
        color: "#1976D2",
        icon: "🎩",
        points: 367
      }
    ]
  });

  // School Events Data - NOW VISIBLE
  const [schoolEvents] = useState([
    {
      id: 1,
      title: "Spirit Week - Broadway Bonanza",
      date: "February 3-7, 2026",
      time: "All Week",
      location: "Campus Wide",
      type: "spirit",
      description: "Show your class pride with Broadway-themed activities!"
    },
    {
      id: 2,
      title: "Boys Basketball vs Highland",
      date: "February 10, 2026",
      time: "7:00 PM",
      location: "Valiant Arena",
      type: "sports"
    },
    {
      id: 3,
      title: "Girls Basketball vs Skyview",
      date: "February 12, 2026",
      time: "6:30 PM",
      location: "Valiant Arena",
      type: "sports"
    },
    {
      id: 4,
      title: "College Fair",
      date: "February 15, 2026",
      time: "10:00 AM - 2:00 PM",
      location: "Main Gymnasium",
      type: "academic"
    },
    {
      id: 5,
      title: "Winter Dance: Enchanted Evening",
      date: "February 21, 2026",
      time: "7:00 PM - 10:00 PM",
      location: "Cafeteria",
      type: "social"
    }
  ]);

  // School Alerts Data - NOW VISIBLE
  const [schoolAlerts] = useState([
    {
      id: 1,
      type: "info",
      message: "Spirit Week voting opens Monday! Support your class!",
      date: "February 1, 2026"
    },
    {
      id: 2,
      type: "warning",
      message: "Early dismissal on Friday, February 7th at 1:00 PM for pep rally",
      date: "February 1, 2026"
    },
    {
      id: 3,
      type: "success",
      message: "Valiant Picks now live! Place your picks on Place Picks page!",
      date: "January 20, 2026"
    }
  ]);

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
      
      // Calculate stats
      const totalBets = userBets.length;
      const activeBets = userBets.filter(b => b.status === 'pending').length;
      const wonBets = userBets.filter(b => b.outcome === 'won').length;
      const lostBets = userBets.filter(b => b.outcome === 'lost').length;
      const winRate = totalBets > 0 ? Math.round((wonBets / (wonBets + lostBets)) * 100) || 0 : 0;
      const totalWinnings = userBets
        .filter(b => b.outcome === 'won')
        .reduce((sum, b) => sum + (b.potential_win - b.amount), 0);
      
      setStats({
        totalBets,
        activeBets,
        wonBets,
        lostBets,
        winRate,
        totalWinnings
      });
    } catch (err) {
      console.error('Error fetching bets:', err);
    }
  }, [previousBets]);

  const fetchRecentWinners = useCallback(async () => {
    try {
      const response = await apiClient.get('/bets/recent-winners?limit=15');
      setRecentWinners(response.data || []);
    } catch (err) {
      console.error('Error fetching recent winners:', err);
      setRecentWinners([]);
    }
  }, []);

  useEffect(() => {
    // Fetch all data in parallel for faster initial load
    Promise.all([
      fetchGames(),
      fetchBets(),
      fetchRecentWinners()
    ]);
    
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
    
    // Poll recent winners every 30 seconds
    const winnersInterval = setInterval(async () => {
      if (isActive && isPageVisible) {
        try {
          await fetchRecentWinners();
        } catch (err) {
          // Polling error - will retry
        }
      }
    }, 30000);
    
    return () => {
      isActive = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(betsInterval);
      clearInterval(gamesInterval);
      clearInterval(winnersInterval);
    };
  }, [fetchGames, fetchBets, fetchRecentWinners]);

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

  // Calculate spirit week leader
  const spiritLeader = React.useMemo(() => {
    const sorted = [...spiritWeekData.grades].sort((a, b) => b.points - a.points);
    return sorted[0];
  }, [spiritWeekData]);

  return (
    <div className="test-dashboard school-dashboard">
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {/* TEST MODE BANNER */}
      <div className="test-mode-banner">
        <div className="test-banner-icon">🧪</div>
        <div className="test-banner-content">
          <strong>TEST DASHBOARD MODE</strong>
          <p>All features are visible including Spirit Week and School Events!</p>
        </div>
      </div>
      
      {/* Notification Permission Banner */}
      {!notificationsEnabled && (
        <div className="notification-banner">
          <div className="notification-banner-icon">🔔</div>
          <div className="notification-banner-content">
            <strong>Enable Notifications</strong>
            <p>Get instant updates when your bets are resolved, new games are available, and more!</p>
          </div>
          <button className="notification-banner-btn" onClick={handleNotificationToggle}>
            Enable Notifications
          </button>
          <button className="notification-banner-close" onClick={() => setNotificationsEnabled(null)} title="Don't show again">
            ✕
          </button>
        </div>
      )}
      
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="banner-icon">🏫</div>
        <div className="banner-content">
          <h2>Welcome to Valiant Picks, {user?.username || 'Student'}!</h2>
        </div>
      </div>
      
      {/* Win/Loss Notifications */}
      <div style={{minHeight: winNotification || lossNotification ? 'auto' : '0px', marginBottom: winNotification || lossNotification ? '1rem' : '0'}}>
        {winNotification && (
          <div className="win-notification">
            <span className="win-notification-emoji">🎉</span>
            <div>You Won!</div>
            <div className="win-notification-amount">+{formatCurrency(winNotification.amount)}</div>
            <div style={{fontSize: '1.2rem', marginTop: '0.5rem'}}>{winNotification.team}</div>
          </div>
        )}
        
        {lossNotification && (
          <div className="loss-notification">
            <span className="loss-notification-emoji">😔</span>
            <div>Better luck next time!</div>
            <div style={{fontSize: '1rem', marginTop: '0.5rem', opacity: 0.9}}>-{formatCurrency(lossNotification.amount)}</div>
          </div>
        )}
      </div>

      {/* Recent Winners Section */}
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

      {/* School Alerts - NOW VISIBLE */}
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

      {/* Stats Overview - Compact */}
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

      {/* Main Grid Layout */}
      <div className="dashboard-grid school-grid">
        {/* Left Column */}
        <div className="dashboard-main-column">
          {/* Place a Pick CTA */}
          <div className="card pick-cta-card">
            <h3>🎲 Ready to Make Your Picks?</h3>
            <p>Head over to the Place Picks page to place your predictions on upcoming Valiant games!</p>
            <button 
              className="btn btn-primary btn-large"
              onClick={() => onNavigate && onNavigate('games')}
              style={{ marginTop: '1rem', width: '100%' }}
            >
              🏀 Go to Place Picks
            </button>
            <div className="balance-display">
              <span className="balance-label">Your Balance:</span>
              <span className="balance-amount">{formatCurrency(balance)}</span>
            </div>
          </div>

          {/* Spirit Week Tracker - NOW VISIBLE */}
          <div className="card spirit-week-card">
            <div className="spirit-week-header">
              <h3>🎭 Spirit Week: {spiritWeekData.theme}</h3>
              <span className="spirit-week-date">{spiritWeekData.weekOf}</span>
            </div>
            <p className="spirit-week-description">
              {spiritWeekData.description}
            </p>
            
            {/* Spirit Week Events */}
            <div className="spirit-week-events">
              <h4>📅 Week Schedule</h4>
              <div className="events-timeline">
                {spiritWeekData.events.map((event, idx) => (
                  <div key={idx} className="timeline-item">
                    <span className="timeline-day">{event.day}</span>
                    <span className="timeline-event">{event.event}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Current Leader Banner */}
            <div className="spirit-leader-banner" style={{borderColor: spiritLeader.color}}>
              <span className="leader-icon" style={{fontSize: '2.5rem'}}>{spiritLeader.icon}</span>
              <div className="leader-info">
                <div className="leader-label">Current Leader</div>
                <div className="leader-grade" style={{color: spiritLeader.color}}>{spiritLeader.grade}</div>
                <div className="leader-subtheme">{spiritLeader.subtheme}</div>
              </div>
              <div className="leader-points">{spiritLeader.points} pts</div>
            </div>

            {/* All Grades - Points Leaderboard */}
            <div className="spirit-leaderboard">
              <h4>🏆 Grade Rankings</h4>
              {[...spiritWeekData.grades]
                .sort((a, b) => b.points - a.points)
                .map((grade, index) => {
                  const maxPoints = Math.max(...spiritWeekData.grades.map(g => g.points));
                  const percentage = (grade.points / maxPoints) * 100;
                  return (
                    <div key={index} className="grade-bar-item">
                      <div className="grade-bar-header">
                        <div className="grade-bar-info">
                          <span className="grade-bar-icon">{grade.icon}</span>
                          <div className="grade-bar-text">
                            <span className="grade-bar-name" style={{color: grade.color}}>{grade.grade}</span>
                            <span className="grade-bar-theme">{grade.subtheme}</span>
                          </div>
                        </div>
                        <span className="grade-bar-points" style={{color: grade.color}}>{grade.points} pts</span>
                      </div>
                      <div className="grade-bar-container">
                        <div 
                          className="grade-bar-fill" 
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: grade.color,
                            boxShadow: `0 2px 8px ${grade.color}40`
                          }}
                        >
                          <span className="grade-bar-percentage">{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Upcoming School Events - NOW VISIBLE */}
          <div className="card school-events-card">
            <h3>📅 Upcoming School Events</h3>
            {schoolEvents.length > 0 ? (
              <div className="events-list">
                {schoolEvents.map(event => (
                  <div key={event.id} className={`event-item event-${event.type}`}>
                    <div className="event-icon">
                      {event.type === 'sports' && '🏀'}
                      {event.type === 'spirit' && '🎭'}
                      {event.type === 'academic' && '📚'}
                      {event.type === 'social' && '🎉'}
                    </div>
                    <div className="event-details">
                      <h4>{event.title}</h4>
                      <div className="event-meta">
                        <span>📅 {event.date}</span>
                        <span>🕐 {event.time}</span>
                        <span>📍 {event.location}</span>
                      </div>
                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">No upcoming events</p>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="dashboard-sidebar">
          {/* Upcoming Games */}
          <div className="card">
            <h3>🏀 Upcoming Games</h3>
            {gamesLoading ? (
              <div>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <UpcomingGameSkeleton key={idx} />
                ))}
              </div>
            ) : upcomingGames.length > 0 ? (
              <div className="upcoming-games-list">
                {upcomingGames.map(game => (
                  <div key={game.id} className="upcoming-game-item">
                    <div className="game-teams">
                      <span>{game.home_team}</span>
                      <span className="vs-small">vs</span>
                      <span>{game.away_team}</span>
                    </div>
                    <div className="game-meta">
                      <span className={`game-type-badge ${game.team_type?.toLowerCase().includes('boys') ? 'boys' : game.team_type?.toLowerCase().includes('girls') ? 'girls' : ''}`}>
                        {game.team_type?.toLowerCase().includes('boys') ? '🏀 ' : game.team_type?.toLowerCase().includes('girls') ? '🏀 ' : ''}{game.team_type?.replace(' Basketball', '')}
                      </span>
                      <span>{parseLocalDateOnly(game.game_date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'TBD'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">No upcoming games</p>
            )}
            <button 
              className="btn btn-secondary btn-small"
              onClick={() => onNavigate && onNavigate('games')}
              style={{ marginTop: '1rem', width: '100%' }}
            >
              View All & Make Picks
            </button>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3>📝 Recent Picks</h3>
            {recentActivity.length > 0 ? (
              <div className="recent-bets-list">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="recent-bet-item">
                    <div className="bet-info">
                      <div className="bet-team">{activity.selected_team}</div>
                      <div className="bet-amount">{formatCurrency(activity.amount)}</div>
                    </div>
                    <div className="bet-status">
                      <span className={`status-badge status-${activity.status === 'pending' ? 'pending' : activity.outcome}`}>
                        {activity.status === 'pending'
                          ? '⏳ Pending'
                          : activity.outcome === 'won'
                          ? '✅ Won'
                          : '❌ Lost'}
                      </span>
                      {activity.outcome === 'won' && (
                        <span className="bet-win">+{formatCurrency(activity.potential_win - activity.amount)}</span>
                      )}
                      {activity.status === 'pending' && (
                        <span className="bet-win" style={{ color: '#1f4e99' }}>
                          Possible: {formatCurrency(activity.potential_win - activity.amount)}
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

          {/* Quick Links */}
          <div className="card quick-links-card">
            <h3>🔗 Quick Links</h3>
            <div className="quick-links">
              <button 
                className="quick-link-btn"
                onClick={() => onNavigate && onNavigate('games')}
              >
                🏀 Place Picks
              </button>
              <button 
                className="quick-link-btn"
                onClick={() => onNavigate && onNavigate('teams')}
              >
                👥 Team Rosters
              </button>
              <button 
                className="quick-link-btn"
                onClick={() => onNavigate && onNavigate('leaderboard')}
              >
                🏆 Leaderboard
              </button>
              <button 
                className="quick-link-btn"
                onClick={() => onNavigate && onNavigate('about')}
              >
                ℹ️ About
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestDashboard;
