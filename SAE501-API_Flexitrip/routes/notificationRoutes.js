const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

/**
 * @swagger
 * tags:
 *   name: Notification
 *   description: API pour gérer les notifications
 */

/**
 * @swagger
 * /notification:
 *   post:
 *     summary: Créer une nouvelle notification
 *     tags: [Notification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               
 *     responses:
 *       201:
 *         description: Notification créée avec succès
 *       500:
 *         description: Erreur lors de la création de la notification
 */
router.post('/', notificationController.createNotification);

/**
 * @swagger
 * /notification:
 *   get:
 *     summary: Récupérer toutes les notifications
 *     tags: [Notification]
 *     responses:
 *       200:
 *         description: Liste de toutes les notifications
 *       500:
 *         description: Erreur lors de la récupération des notifications
 */
router.get('/', notificationController.getNotifications);

/**
 * @swagger
 * /notification/{id}:
 *   get:
 *     summary: Récupérer une notification par ID
 *     tags: [Notification]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la notification à récupérer
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification récupérée avec succès
 *       404:
 *         description: Notification non trouvée
 *       500:
 *         description: Erreur lors de la récupération de la notification
 */
router.get('/:id', notificationController.getNotificationById);

/**
 * @swagger
 * /notification/{id}:
 *   put:
 *     summary: Mettre à jour une notification
 *     tags: [Notification]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la notification à mettre à jour
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               
 *     responses:
 *       200:
 *         description: Notification mise à jour avec succès
 *       404:
 *         description: Notification non trouvée
 *       500:
 *         description: Erreur lors de la mise à jour de la notification
 */
router.put('/:id', notificationController.updateNotification);

/**
 * @swagger
 * /notification/{id}:
 *   delete:
 *     summary: Supprimer une notification
 *     tags: [Notification]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la notification à supprimer
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Notification supprimée avec succès
 *       404:
 *         description: Notification non trouvée
 *       500:
 *         description: Erreur lors de la suppression de la notification
 */
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
