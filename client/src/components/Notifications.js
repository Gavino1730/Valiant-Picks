import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../utils/axios';
import notificationService from '../utils/notifications';
import '../styles/Notifications.css';

function Notifications({ onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const previousNotificationIds = useRef(new Set());

  const updateUnreadCount = useCallback((newNotifications) => {
    if (onUnreadChange) {
      const count = newNotifications.filter(n => !n.is_read).length;
      onUnreadChange(count);
    }
  }, [onUnreadChange]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await apiClient.get('/notifications');
        const newNotifications = response.data;
        
        // Check for new unread notifications and send browser notifications
        if (previousNotificationIds.current.size > 0) {
          newNotifications.forEach(notification => {
            // If this is a new notification that wasn't in the previous set
            if (!previousNotificationIds.current.has(notification.id) && !notification.is_read) {
              // Send browser notification
              sendBrowserNotification(notification);
            }
          });
        }
        
        // Update the set of notification IDs
        previousNotificationIds.current = new Set(newNotifications.map(n => n.id));
        
        setNotifications(newNotifications);
        
        // Auto-mark unread notifications as read when viewing this page (prevent concurrent calls)
        const unreadNotifications = newNotifications.filter(n => !n.is_read);
        if (unreadNotifications.length > 0 && !isMarkingAsRead) {
          // Batch mark all unread as read
          setIsMarkingAsRead(true);
          try {
            await apiClient.put('/notifications/mark-all-read');
            // Update local state to reflect all as read
            const updated = newNotifications.map(n => ({ ...n, is_read: true }));
            setNotifications(updated);
            updateUnreadCount(updated);
          } catch (err) {
            // Auto-mark error handled silently
          } finally {
            setIsMarkingAsRead(false);
          }
        } else {
          // Even if no unread, update the unread count
          updateUnreadCount(newNotifications);
        }
      } catch (err) {
        // Fetch error handled silently
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Poll for new notifications every 15 seconds
    const pollInterval = setInterval(fetchNotifications, 15000);
    
    return () => clearInterval(pollInterval);
  }, [isMarkingAsRead, updateUnreadCount]);

  const sendBrowserNotification = (notification) => {
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
  };

  const markAsRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      const updated = notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      );
      setNotifications(updated);
      updateUnreadCount(updated);
    } catch (err) {
      // Mark as read error handled silently
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/mark-all-read');
      const updated = notifications.map(n => ({ ...n, is_read: true }));
      setNotifications(updated);
      updateUnreadCount(updated);
    } catch (err) {
      // Mark all error handled silently
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'bet_won': return '🎉';
      case 'bet_lost': return '😔';
      case 'bet_placed': return '✅';
      case 'balance_gift': return '🎁';
      case 'balance_pending': return '⏳';
      default: return '📢';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return <div className="card"><p>Loading notifications...</p></div>;
  }

  return (
    <div className="notifications-page ds-page">
      <div className="notifications-header page-header">
        <h2>🔔 Notifications</h2>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllAsRead}>
            Mark All Read ({unreadCount})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card">
          <p style={{textAlign: 'center', color: '#b8c5d6', padding: '2rem'}}>
            No notifications yet
          </p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-card ${notification.is_read ? 'read' : 'unread'}`}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="notification-time">{formatTime(notification.created_at)}</span>
              </div>
              {!notification.is_read && <div className="unread-dot"></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
