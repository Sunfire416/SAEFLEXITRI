const express = require('express');
const router = express.Router();
const intelligentAssignmentController = require('../controllers/intelligentAssignmentController');

// ==========================================
// ROUTES D'ASSIGNATION INTELLIGENTE
// ==========================================

/**
 * @swagger
 * /api/intelligent-assignment/assign:
 *   post:
 *     summary: Assigne automatiquement l'agent le plus approprié à une mission
 *     tags: [Intelligent Assignment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prise_en_charge_id
 *               - user_id
 *             properties:
 *               prise_en_charge_id:
 *                 type: integer
 *                 description: ID de la prise en charge
 *               reservation_id:
 *                 type: integer
 *                 description: ID de la réservation
 *               user_id:
 *                 type: integer
 *                 description: ID de l'utilisateur PMR
 *               voyage_id:
 *                 type: string
 *                 description: ID du voyage MongoDB
 *               location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               transport_type:
 *                 type: string
 *                 enum: [train, plane, bus, taxi]
 *               is_critical_connection:
 *                 type: boolean
 *               priority_level:
 *                 type: string
 *                 enum: [low, normal, high, urgent, critical]
 *     responses:
 *       200:
 *         description: Agent assigné avec succès
 *       404:
 *         description: Aucun agent disponible
 */
router.post('/assign', intelligentAssignmentController.assignAgent);

/**
 * @swagger
 * /api/intelligent-assignment/available-agents:
 *   get:
 *     summary: Récupère la liste des agents disponibles avec leurs scores
 *     tags: [Intelligent Assignment]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: location_lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: location_lng
 *         schema:
 *           type: number
 *       - in: query
 *         name: transport_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_critical_connection
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Liste des agents disponibles avec scores
 */
router.get('/available-agents', intelligentAssignmentController.getAvailableAgents);

/**
 * @swagger
 * /api/intelligent-assignment/reevaluate-priority:
 *   post:
 *     summary: Réévalue la priorité d'une mission
 *     tags: [Intelligent Assignment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prise_en_charge_id
 *             properties:
 *               prise_en_charge_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Priorité réévaluée
 */
router.post('/reevaluate-priority', intelligentAssignmentController.reevaluatePriority);

/**
 * @swagger
 * /api/intelligent-assignment/monitor:
 *   post:
 *     summary: Lance la surveillance de toutes les missions actives
 *     tags: [Intelligent Assignment]
 *     responses:
 *       200:
 *         description: Surveillance terminée avec résultats
 */
router.post('/monitor', intelligentAssignmentController.monitorMissions);

/**
 * @swagger
 * /api/intelligent-assignment/reassign:
 *   post:
 *     summary: Réassigne un agent à une mission
 *     tags: [Intelligent Assignment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prise_en_charge_id
 *             properties:
 *               prise_en_charge_id:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Agent réassigné avec succès
 */
router.post('/reassign', intelligentAssignmentController.reassignAgent);

// ==========================================
// ROUTES DE GESTION DES AGENTS
// ==========================================

/**
 * @swagger
 * /api/intelligent-assignment/agent-availability/{agent_id}:
 *   get:
 *     summary: Récupère la disponibilité d'un agent
 *     tags: [Agent Management]
 *     parameters:
 *       - in: path
 *         name: agent_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Disponibilité de l'agent
 */
router.get('/agent-availability/:agent_id', intelligentAssignmentController.getAgentAvailability);

/**
 * @swagger
 * /api/intelligent-assignment/agent-availability/{agent_id}:
 *   put:
 *     summary: Met à jour la disponibilité d'un agent
 *     tags: [Agent Management]
 *     parameters:
 *       - in: path
 *         name: agent_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [available, busy, on_mission, break, off_duty]
 *               current_location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *                   location_name:
 *                     type: string
 *               shift_start:
 *                 type: string
 *                 format: time
 *               shift_end:
 *                 type: string
 *                 format: time
 *     responses:
 *       200:
 *         description: Disponibilité mise à jour
 */
router.put('/agent-availability/:agent_id', intelligentAssignmentController.updateAgentAvailability);

/**
 * @swagger
 * /api/intelligent-assignment/agent-skills/{agent_id}:
 *   get:
 *     summary: Récupère les compétences d'un agent
 *     tags: [Agent Management]
 *     parameters:
 *       - in: path
 *         name: agent_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Compétences de l'agent
 */
router.get('/agent-skills/:agent_id', intelligentAssignmentController.getAgentSkills);

/**
 * @swagger
 * /api/intelligent-assignment/agent-skills/{agent_id}:
 *   put:
 *     summary: Met à jour les compétences d'un agent
 *     tags: [Agent Management]
 *     parameters:
 *       - in: path
 *         name: agent_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               disability_types:
 *                 type: array
 *                 items:
 *                   type: string
 *               certifications:
 *                 type: array
 *                 items:
 *                   type: string
 *               languages:
 *                 type: array
 *                 items:
 *                   type: string
 *               experience_level:
 *                 type: string
 *                 enum: [junior, intermediate, senior, expert]
 *               transport_modes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Compétences mises à jour
 */
router.put('/agent-skills/:agent_id', intelligentAssignmentController.updateAgentSkills);

/**
 * @swagger
 * /api/intelligent-assignment/statistics:
 *   get:
 *     summary: Récupère les statistiques d'assignation
 *     tags: [Intelligent Assignment]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 *     responses:
 *       200:
 *         description: Statistiques d'assignation
 */
router.get('/statistics', intelligentAssignmentController.getStatistics);

module.exports = router;
