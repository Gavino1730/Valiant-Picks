// Browser notification utility for Valiant Picks

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.enabled = this.loadPreference();
    this.checkPermission();
  }

  // Check current notification permission
  checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  // Request notification permission from user
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      this.enabled = true;
      this.savePreference(true);
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        this.enabled = true;
        this.savePreference(true);
        this.send('Notifications Enabled', {
          body: 'You will now receive updates about your bets and games!',
          icon: '/assets/logo.png',
          tag: 'welcome'
        });
        return true;
      }
    }

    return false;
  }

  // Send a browser notification
  send(title, options = {}) {
    if (!this.enabled || this.permission !== 'granted') {
      return null;
    }

    const defaultOptions = {
      icon: '/assets/logo.png',
      badge: '/assets/logo.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Auto-close after 10 seconds if not requiring interaction
      if (!defaultOptions.requireInteraction) {
        setTimeout(() => notification.close(), 10000);
      }

      return notification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return null;
    }
  }

  // Notification templates for common scenarios
  betResolved(betData) {
    const { outcome, team, amount, potentialWin } = betData;
    
    if (outcome === 'won') {
      this.send('Bet Won!', {
        body: `Congratulations! Your pick on ${team} won ${amount}!`,
        icon: '/assets/logo.png',
        tag: `bet-won-${Date.now()}`,
        data: { type: 'bet-resolved', outcome: 'won' }
      });
    } else {
      this.send('Bet Result', {
        body: `Your pick on ${team} didn't win this time. Better luck next game!`,
        icon: '/assets/logo.png',
        tag: `bet-lost-${Date.now()}`,
        data: { type: 'bet-resolved', outcome: 'lost' }
      });
    }
  }

  gameStartingSoon(gameData) {
    const { homeTeam, awayTeam, time } = gameData;
    this.send('Game Starting Soon', {
      body: `${homeTeam} vs ${awayTeam} starts in ${time}! Your pick is locked in.`,
      icon: '/assets/logo.png',
      tag: `game-start-${gameData.id}`,
      requireInteraction: false,
      data: { type: 'game-starting', gameId: gameData.id }
    });
  }

  newGamesAvailable(count) {
    this.send('New Games Available', {
      body: `${count} new game${count > 1 ? 's' : ''} available for betting! Place your picks now.`,
      icon: '/assets/logo.png',
      tag: 'new-games',
      data: { type: 'new-games', count }
    });
  }

  balanceUpdated(newBalance, change) {
    if (change > 0) {
      this.send('Balance Updated', {
        body: `You earned ${change} Valiant Bucks! New balance: ${newBalance}`,
        icon: '/assets/logo.png',
        tag: 'balance-update',
        data: { type: 'balance-update', amount: change }
      });
    }
  }

  achievementUnlocked(achievement) {
    this.send('Achievement Unlocked!', {
      body: `${achievement.icon} ${achievement.name} - ${achievement.description}`,
      icon: '/assets/logo.png',
      tag: `achievement-${achievement.id}`,
      requireInteraction: true,
      data: { type: 'achievement', id: achievement.id }
    });
  }

  // Save notification preference to localStorage
  savePreference(enabled) {
    try {
      localStorage.setItem('notificationsEnabled', JSON.stringify(enabled));
      this.enabled = enabled;
    } catch (error) {
      console.error('Failed to save notification preference:', error);
    }
  }

  // Load notification preference from localStorage
  loadPreference() {
    try {
      const stored = localStorage.getItem('notificationsEnabled');
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notification preference:', error);
    }
    return false;
  }

  // Toggle notifications on/off
  toggle() {
    if (!this.enabled) {
      return this.requestPermission();
    } else {
      this.enabled = false;
      this.savePreference(false);
      return Promise.resolve(false);
    }
  }

  // Check if notifications are enabled
  isEnabled() {
    return this.enabled && this.permission === 'granted';
  }

  // Get current status
  getStatus() {
    return {
      supported: 'Notification' in window,
      permission: this.permission,
      enabled: this.enabled
    };
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
