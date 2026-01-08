const express = require('express');
const router = express.Router();
const {
    createIncident,
    getActiveIncidents,
    getIncidentById,
    updateIncident,
    addRerouteOptions,
    deleteIncident
} = require('../controllers/incidentController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/incidents:
 *   post:
 *     summary: Créer un nouvel incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - severity
 *               - transportType
 *               - route
 *               - title
 *               - description
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [delay, cancellation, equipment_failure, accessibility_issue, other]
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               reservationId:
 *                 type: integer
 *               transportType:
 *                 type: string
 *               route:
 *                 type: object
 *                 properties:
 *                   departure: { type: string }
 *                   arrival: { type: string }
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               estimatedDelay:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Incident créé
 */
router.post('/', authenticateToken, createIncident);

/**
 * @swagger
 * /api/incidents/active:
 *   get:
 *     summary: Récupérer les incidents actifs
 *     tags: [Incidents]
 *     parameters:
 *       - in: query
 *         name: transportType
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des incidents actifs
 */
router.get('/active', getActiveIncidents);

/**
 * @swagger
 * /api/incidents/{incidentId}:
 *   get:
 *     summary: Récupérer un incident par ID
 *     tags: [Incidents]
 *     parameters:
 *       - in: path
 *         name: incidentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Incident récupéré
 *       404:
 *         description: Incident non trouvé
 */
router.get('/:incidentId', getIncidentById);

/**
 * @swagger
 * /api/incidents/{incidentId}:
 *   put:
 *     summary: Mettre à jour un incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incidentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Incident mis à jour
 */
router.put('/:incidentId', authenticateToken, updateIncident);

/**
 * @swagger
 * /api/incidents/{incidentId}/reroute:
 *   post:
 *     summary: Ajouter des options de réacheminement
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incidentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rerouteOptions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description: { type: string }
 *                     additionalCost: { type: number }
 *                     estimatedArrival: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Options ajoutées
 */
router.post('/:incidentId/reroute', authenticateToken, addRerouteOptions);

/**
 * @swagger
 * /api/incidents/{incidentId}:
 *   delete:
 *     summary: Supprimer un incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incidentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Incident supprimé
 */
router.delete('/:incidentId', authenticateToken, deleteIncident);

module.exports = router;
