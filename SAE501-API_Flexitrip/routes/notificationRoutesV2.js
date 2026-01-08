/**
 * Routes Notifications V2 - MongoDB (Point 4)
 * Base path: /notifications (avec 's')
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationControllerV2');

/**
 * GET /notification
 * Récupérer toutes les notifications de l'utilisateur
 * Query params: user_id, limit, skip, unread_only, type
 */
router.get('/', notificationController.getNotifications);

/**
 * GET /notification/unread
 * Récupérer notifications non lues
 * Query params: user_id
 */
router.get('/unread', notificationController.getUnreadNotifications);

/**
 * GET /notification/count
 * Compter notifications non lues
 * Query params: user_id
 */
router.get('/count', notificationController.getUnreadCount);

/**
 * GET /notification/:id
 * Récupérer une notification par ID
 */
router.get('/:id', notificationController.getNotificationById);

/**
 * POST /notification
 * Créer une notification (admin/system)
 * Body: { user_id, type, title, message, data, agent_info, priority, icon }
 */
router.post('/', notificationController.createNotification);

/**
 * PATCH /notification/:id/read
 * Marquer notification comme lue
 */
router.patch('/:id/read', notificationController.markAsRead);

/**
 * PATCH /notification/mark-all-read
 * Marquer toutes les notifications comme lues
 * Body: { user_id }
 */
router.patch('/mark-all-read', notificationController.markAllAsRead);

/**
 * DELETE /notification/:id
 * Supprimer une notification
 */
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
