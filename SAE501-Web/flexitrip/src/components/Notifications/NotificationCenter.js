/**
 * NotificationCenter
 * Page complète gestion notifications
 * /user/notifications
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refreshNotifications 
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' ou type spécifique

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Filtrer notifications
  const filteredNotifications = notifications.filter(notif => {
    // Filtre read/unread
    if (filter === 'unread' && notif.read) return false;
    if (filter === 'read' && !notif.read) return false;

    // Filtre par type
    if (typeFilter !== 'all' && notif.type !== typeFilter) return false;

    return true;
  });

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

  const getNotificationColor = (type) => {
    const colors = {
      'ENROLLMENT_SUCCESS': '#10b981',
      'CHECKIN_SUCCESS': '#3b82f6',
      'BOARDING_SUCCESS': '#8b5cf6',
      'DELAY': '#f59e0b',
      'GATE_CHANGE': '#ef4444',
      'AGENT_ASSIGNED': '#6366f1',
      'GENERAL': '#6b7280'
    };
    return colors[type] || '#6b7280';
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.notification_id);
    }

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleDelete = (e, notificationId) => {
    e.stopPropagation();
    if (window.confirm('Supprimer cette notification ?')) {
      deleteNotification(notificationId);
    }
  };

  const handleMarkAllRead = () => {
    if (window.confirm(`Marquer les ${unreadCount} notifications comme lues ?`)) {
      markAllAsRead();
    }
  };

  // Types uniques dans notifications
  const availableTypes = [...new Set(notifications.map(n => n.type))];

  return (
    <div className="notification-center-container">
      <div className="notification-center-header">
        <h1>📬 Centre de Notifications</h1>
        <p className="subtitle">
          {unreadCount > 0 
            ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
            : 'Toutes vos notifications sont lues'}
        </p>
      </div>

      {/* Filters */}
      <div className="notification-filters">
        <div className="filter-group">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Toutes ({notifications.length})
          </button>
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Non lues ({unreadCount})
          </button>
          <button
            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Lues ({notifications.length - unreadCount})
          </button>
        </div>

        {availableTypes.length > 1 && (
          <div className="filter-group">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="type-filter-select"
            >
              <option value="all">Tous les types</option>
              {availableTypes.map(type => (
                <option key={type} value={type}>
                  {getNotificationIcon(type)} {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        )}

        {unreadCount > 0 && (
          <button
            className="mark-all-read-btn"
            onClick={handleMarkAllRead}
          >
            ✓ Tout marquer lu
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="no-notifications-center">
            <span className="no-notif-icon-large">🔕</span>
            <h3>Aucune notification</h3>
            <p>
              {filter === 'unread' 
                ? 'Toutes vos notifications sont lues !'
                : 'Vous n\'avez pas encore de notifications.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification.notification_id}
              className={`notification-card ${notification.read ? 'read' : 'unread'}`}
              onClick={() => handleNotificationClick(notification)}
              style={{ 
                borderLeftColor: getNotificationColor(notification.type),
                borderLeftWidth: '4px',
                borderLeftStyle: 'solid'
              }}
            >
              <div className="notification-card-header">
                <div className="notification-card-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-card-meta">
                  <span className="notification-type-badge" style={{
                    background: getNotificationColor(notification.type) + '20',
                    color: getNotificationColor(notification.type)
                  }}>
                    {notification.type.replace(/_/g, ' ')}
                  </span>
                  <span className="notification-time">
                    {formatDateTime(notification.created_at)}
                  </span>
                </div>
                {!notification.read && (
                  <div className="unread-indicator" />
                )}
              </div>

              <div className="notification-card-body">
                <h3 className="notification-card-title">
                  {notification.title}
                </h3>
                <p className="notification-card-message">
                  {notification.message}
                </p>

                {notification.agent_info && (
                  <div className="notification-agent-info">
                    <strong>👤 Agent PMR :</strong> {notification.agent_info.name}
                    <br />
                    📞 {notification.agent_info.phone}
                    {notification.agent_info.location && (
                      <><br />📍 {notification.agent_info.location}</>
                    )}
                  </div>
                )}

                {notification.data && Object.keys(notification.data).length > 0 && (
                  <div className="notification-details">
                    {notification.data.flight_train && (
                      <span className="detail-tag">✈️ {notification.data.flight_train}</span>
                    )}
                    {notification.data.gate && (
                      <span className="detail-tag">🚪 Porte {notification.data.gate}</span>
                    )}
                    {notification.data.seat && (
                      <span className="detail-tag">💺 Siège {notification.data.seat}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="notification-card-actions">
                {notification.action_url && (
                  <button className="action-btn primary">
                    Voir détails →
                  </button>
                )}
                <button
                  className="action-btn delete"
                  onClick={(e) => handleDelete(e, notification.notification_id)}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
