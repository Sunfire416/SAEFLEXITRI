/**
 * Controller Notifications - MongoDB Unifié
 * 
 * ✅ SYSTÈME UNIFIÉ : MongoDB uniquement
 * Ce controller remplace l'ancien système MySQL
 * Routes: /notifications/*
 */

const notificationService = require('../services/notificationService');
const SupabaseService = require('../services/SupabaseService');

/**
 * GET /notifications?user_id=4&limit=50&skip=0&unread_only=false&type=null
 * Récupérer toutes les notifications d'un utilisateur
 */
exports.getNotifications = async (req, res) => {
  try {
    const user_id = req.user?.user_id || req.query.user_id;
    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id requis' });
    }

    const { limit = 50, skip = 0, unread_only = false, type = null } = req.query;

    const result = await notificationService.getUserNotifications(user_id, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      unread_only: unread_only === 'true',
      type
    });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('❌ Erreur getNotifications:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur', details: error.message });
  }
};

/**
 * GET /notifications/unread?user_id=4
 * Récupérer notifications non lues
 */
exports.getUnreadNotifications = async (req, res) => {
  try {
    const user_id = req.user?.user_id || req.query.user_id;
    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id requis' });
    }

    const { data, error } = await SupabaseService.client
      .from('notifications')
      .select('*')
      .eq('user_id', user_id)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, notifications: data || [], unread_count: (data || []).length });
  } catch (error) {
    console.error('❌ Erreur getUnreadNotifications:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur', details: error.message });
  }
};

/**
 * GET /notifications/count?user_id=4
 * Compter notifications non lues
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const user_id = req.user?.user_id || req.query.user_id;
    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id requis' });
    }

    const { count, error } = await SupabaseService.client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('read', false);

    if (error) throw error;
    res.json({ success: true, unread_count: count || 0 });
  } catch (error) {
    console.error('❌ Erreur getUnreadCount:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur', details: error.message });
  }
};

/**
 * GET /notifications/:id
 * Récupérer une notification par ID
 */
exports.getNotificationById = async (req, res) => {
  try {
    const { data, error } = await SupabaseService.client
      .from('notifications')
      .select('*')
      .eq('notification_id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Notification introuvable' });
    }

    res.json({ success: true, notification: data });
  } catch (error) {
    console.error('❌ Erreur getNotificationById:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur', details: error.message });
  }
};

/**
 * POST /notifications
 * Créer une notification (admin/system)
 */
exports.createNotification = async (req, res) => {
  try {
    const notification = await notificationService.createNotification(req.body);
    res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error('❌ Erreur createNotification:', error);
    res.status(500).json({ success: false, error: 'Erreur création', details: error.message });
  }
};

/**
 * PATCH /notifications/:id/read
 * Marquer notification comme lue
 */
exports.markAsRead = async (req, res) => {
  try {
    const { data, error } = await SupabaseService.client
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('notification_id', req.params.id)
      .select('*')
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Notification introuvable' });
    }

    res.json({ success: true, notification: data });
  } catch (error) {
    console.error('❌ Erreur markAsRead:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur', details: error.message });
  }
};

/**
 * PATCH /notifications/mark-all-read
 * Marquer toutes comme lues
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const user_id = req.user?.user_id || req.body.user_id;
    
    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id requis' });
    }

    const result = await notificationService.markAllAsRead(user_id);
    res.json({ success: true, modified_count: result.modifiedCount });
  } catch (error) {
    console.error('❌ Erreur markAllAsRead:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur', details: error.message });
  }
};

/**
 * DELETE /notifications/:id
 * Supprimer notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const result = await notificationService.deleteNotification(req.params.id);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Notification introuvable' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('❌ Erreur deleteNotification:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur', details: error.message });
  }
};

module.exports = exports;
