/**
 * Routes Notifications V2 - Supabase
 * Base path dans app.js: /api/notification (singulier)
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationControllerV2');

// NOTE: app.js monte ce router sur /api/notification
// Donc ici les chemins sont relatifs.

/**
 * GET /api/notification
 * Récupérer toutes les notifications de l'utilisateur
 * Query params: user_id, limit, skip, unread_only, type
 */
router.get('/', notificationController.getNotifications);

/**
 * GET /api/notification/unread
 * Récupérer notifications non lues
 * Query params: user_id
 */
router.get('/unread', notificationController.getUnreadNotifications);

/**
 * GET /api/notification/count
 * Compter notifications non lues
 * Query params: user_id
 */
router.get('/count', notificationController.getUnreadCount);

/**
 * POST /api/notification
 * Créer une notification (admin/system)
 * Body: { user_id, type, title, message, data, agent_info, priority, icon }
 */
router.post('/', notificationController.createNotification);

/**
 * PATCH /api/notification/mark-all-read
 * Marquer toutes les notifications comme lues
 * Body: { user_id }
 */
router.patch('/mark-all-read', notificationController.markAllAsRead);

/**
 * GET /api/notification/:id
 * Récupérer une notification par ID
 */
router.get('/:id', notificationController.getNotificationById);

/**
 * PATCH /api/notification/:id/read
 * Marquer une notification comme lue
 */
router.patch('/:id/read', notificationController.markAsRead);

/**
 * DELETE /api/notification/:id
 * Supprimer une notification
 */
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
