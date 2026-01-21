/**
 * NotificationContext
 * Gestion état notifications + polling automatique
 * 
 * Features:
 * - Polling toutes les 10 secondes
 * - Count notifications non lues
 * - Marquer comme lu
 * - État global partagé
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Récupérer notifications depuis API
   */
  const fetchNotifications = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: {
          user_id: user.user_id,
          limit: 50
        }
      });

      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unread_count);
        setError(null);
      }

    } catch (err) {
      console.error('❌ Erreur fetch notifications:', err);
      setError('Impossible de charger les notifications');
    }
  }, [user]);

  /**
   * Récupérer count uniquement (plus rapide)
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/count`, {
        params: { user_id: user.user_id }
      });

      if (response.data.success) {
        setUnreadCount(response.data.unread_count);
      }

    } catch (err) {
      console.error('❌ Erreur fetch count:', err);
    }
  }, [user]);

  /**
   * Marquer notification comme lue
   */
  const markAsRead = async (notificationId) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}/read`
      );

      if (response.data.success) {
        // Mettre à jour état local
        setNotifications(prev =>
          prev.map(notif =>
            notif.notification_id === notificationId
              ? { ...notif, read: true, read_at: new Date() }
              : notif
          )
        );

        setUnreadCount(prev => Math.max(0, prev - 1));
      }

    } catch (err) {
      console.error('❌ Erreur mark read:', err);
    }
  };

  /**
   * Marquer toutes comme lues
   */
  const markAllAsRead = async () => {
    if (!user?.user_id) return;

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/mark-all-read`,
        { user_id: user.user_id }
      );

      if (response.data.success) {
        // Mettre à jour état local
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, read: true, read_at: new Date() }))
        );

        setUnreadCount(0);
      }

    } catch (err) {
      console.error('❌ Erreur mark all read:', err);
    }
  };

  /**
   * Supprimer notification
   */
  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`);

      // Retirer de l'état local
      setNotifications(prev =>
        prev.filter(notif => notif.notification_id !== notificationId)
      );

      // Mettre à jour count si non lue
      const notif = notifications.find(n => n.notification_id === notificationId);
      if (notif && !notif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

    } catch (err) {
      console.error('❌ Erreur suppression notification:', err);
    }
  };

  /**
   * Forcer refresh notifications
   */
  const refreshNotifications = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Polling automatique toutes les 10 secondes
  useEffect(() => {
    if (!user?.user_id) return;

    // Premier chargement
    fetchNotifications();

    // Polling count seulement (plus léger)
    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, 10000); // 10 secondes

    return () => clearInterval(intervalId);
  }, [user, fetchNotifications, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook personnalisé
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
