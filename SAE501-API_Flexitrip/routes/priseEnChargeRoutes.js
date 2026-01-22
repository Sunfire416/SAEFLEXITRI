const express = require('express');
const router = express.Router();
const priseEnChargeController = require('../controllers/priseEnChargeController');

// ==========================================
// ROUTES PUBLIQUES (pas de middleware auth)
// ==========================================

/**
 * @swagger
 * /prise-en-charge/{token}:
 *   get:
 *     summary: Récupérer détails prise en charge par token (PUBLIC)
 *     tags: [Prise en Charge]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de validation unique
 *     responses:
 *       200:
 *         description: Détails de la prise en charge
 *       404:
 *         description: Prise en charge introuvable
 */
router.get('/:token', priseEnChargeController.getByToken);

/**
 * @swagger
 * /prise-en-charge/{token}/validate:
 *   post:
 *     summary: Valider prise en charge (PUBLIC)
 *     tags: [Prise en Charge]
 *     parameters:
 *       - in: path
 *         name: token
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
 *               validated_by:
 *                 type: string
 *                 example: "Jean Dupont - Agent SNCF"
 *     responses:
 *       200:
 *         description: Prise en charge validée avec succès
 *       400:
 *         description: Déjà validée ou paramètres invalides
 *       404:
 *         description: Prise en charge introuvable
 */
router.post('/:token/validate', priseEnChargeController.validate);

/**
 * @swagger
 * /prise-en-charge/reservation/{reservation_id}:
 *   get:
 *     summary: Récupérer prises en charge d'une réservation
 *     tags: [Prise en Charge]
 *     parameters:
 *       - in: path
 *         name: reservation_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des prises en charge
 */
router.get('/reservation/:reservation_id', priseEnChargeController.getByReservation);

/**
 * @swagger
 * /prise-en-charge/agent/{agent_id}:
 *   get:
 *     summary: Récupérer prises en charge d'un agent
 *     tags: [Prise en Charge]
 *     parameters:
 *       - in: path
 *         name: agent_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, validated, cancelled]
 *         description: Filtrer par statut
 *     responses:
 *       200:
 *         description: Liste des prises en charge de l'agent
 */
router.get('/agent/:agent_id', priseEnChargeController.getByAgent);

module.exports = router;
