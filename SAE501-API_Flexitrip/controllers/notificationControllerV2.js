/**
 * Controller Notifications V2 - MongoDB (Point 4)
 * 
 * Ce controller utilise MongoDB au lieu de MySQL
 * Routes: /notifications/* (avec 's')
 */

const notificationService = require('../services/notificationService');
const Notification = require('../models/NotificationMongo'); // ✅ CORRIGÉ

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

    const notifications = await Notification.findUnreadByUser(user_id);
    const unread_count = await Notification.countUnreadByUser(user_id);

    res.json({ success: true, notifications, unread_count });
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

    const unread_count = await Notification.countUnreadByUser(user_id);
    res.json({ success: true, unread_count });
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
    const notification = await Notification.findOne({ notification_id: req.params.id });
    
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification introuvable' });
    }

    res.json({ success: true, notification });
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
    const notification = await Notification.findOne({ notification_id: req.params.id });
    
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification introuvable' });
    }
    
    await notification.markRead();
    res.json({ success: true, notification });
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
