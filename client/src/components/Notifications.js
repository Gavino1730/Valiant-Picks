import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import '../styles/Notifications.css';

function Notifications({ onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 20 seconds
    const pollInterval = setInterval(fetchNotifications, 20000);
    
    return () => clearInterval(pollInterval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUnreadCount = (newNotifications) => {
    if (onUnreadChange) {
      const count = newNotifications.filter(n => !n.is_read).length;
      onUnreadChange(count);
    }
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
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/mark-all-read');
      const updated = notifications.map(n => ({ ...n, is_read: true }));
      setNotifications(updated);
      updateUnreadCount(updated);
    } catch (err) {
      console.error('Error marking all as read:', err);
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
    <div className="notifications-page">
      <div className="notifications-header">
        <h2>🔔 Notifications</h2>
        {unreadCount > 0 && (
          <button className="btn" onClick={markAllAsRead} style={{fontSize: '0.9em', padding: '8px 16px'}}>
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
