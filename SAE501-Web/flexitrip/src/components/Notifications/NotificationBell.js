/**
 * NotificationBell
 * Icône cloche en navbar avec badge count
 * Dropdown liste rapide
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationBell.css';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleNotificationClick = (notification) => {
    // Marquer comme lue
    if (!notification.read) {
      markAsRead(notification.notification_id);
    }

    // Fermer dropdown
    setDropdownOpen(false);

    // Rediriger si URL action
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleViewAll = () => {
    setDropdownOpen(false);
    navigate('/user/notifications');
  };

  // Récupérer icône selon type
  const getNotificationIcon = (type) => {
    const icons = {
      'ENROLLMENT_SUCCESS': '✅',
      'CHECKIN_SUCCESS': '🎫',
      'BOARDING_SUCCESS': '✈️',
      'DELAY': '⚠️',
      'GATE_CHANGE': '🚪',
      'AGENT_ASSIGNED': '👤',
      'GENERAL': '🔔'
    };
    return icons[type] || '🔔';
  };

  // Format date relative
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    return `Il y a ${Math.floor(seconds / 86400)}j`;
  };

  // Dernières 5 notifications
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="notification-bell-container">
      <button 
        className="notification-bell-button"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <>
          {/* Overlay */}
          <div 
            className="notification-overlay"
            onClick={() => setDropdownOpen(false)}
          />

          {/* Dropdown */}
          <div className="notification-dropdown">
            <div className="notification-dropdown-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <span className="unread-count-text">
                  {unreadCount} non {unreadCount > 1 ? 'lues' : 'lue'}
                </span>
              )}
            </div>

            <div className="notification-dropdown-body">
              {recentNotifications.length === 0 ? (
                <div className="no-notifications">
                  <span className="no-notif-icon">🔕</span>
                  <p>Aucune notification</p>
                </div>
              ) : (
                recentNotifications.map(notification => (
                  <div
                    key={notification.notification_id}
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-item-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="notification-item-content">
                      <div className="notification-item-title">
                        {notification.title}
                      </div>
                      <div className="notification-item-message">
                        {notification.message.length > 80
                          ? notification.message.substring(0, 80) + '...'
                          : notification.message}
                      </div>
                      <div className="notification-item-time">
                        {formatTimeAgo(notification.created_at)}
                      </div>
                    </div>

                    {!notification.read && (
                      <div className="notification-unread-dot" />
                    )}
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="notification-dropdown-footer">
                <button 
                  className="view-all-button"
                  onClick={handleViewAll}
                >
                  Voir toutes les notifications →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
