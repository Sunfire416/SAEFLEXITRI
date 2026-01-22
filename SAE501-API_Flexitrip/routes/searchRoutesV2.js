/**
 * Routes pour recherche multimodale avancée
 */

const express = require('express');
const router = express.Router();
const searchControllerV2 = require('../controllers/searchControllerV2');

/**
 * @swagger
 * /api/search/autocomplete:
 *   get:
 *     summary: Autocomplétion d'adresses avec Google Places
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: input
 *         schema:
 *           type: string
 *         required: true
 *         description: Texte saisi par l'utilisateur (min 2 caractères)
 *         example: "Paris Gare de"
 *     responses:
 *       200:
 *         description: Liste de suggestions d'adresses
 */
router.get('/autocomplete', searchControllerV2.getAutocomplete);

/**
 * @swagger
 * /api/search/multimodal:
 *   post:
 *     summary: Recherche itinéraire multimodal avec filtres PMR
 *     tags: [Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *             properties:
 *               origin:
 *                 type: string
 *                 example: "Paris"
 *               destination:
 *                 type: string
 *                 example: "Lyon"
 *               date:
 *                 type: string
 *                 format: date-time
 *               pmr_needs:
 *                 type: object
 *                 properties:
 *                   mobility_aid:
 *                     type: string
 *                     enum: [wheelchair, cane, walker, none]
 *                   wheelchair_type:
 *                     type: string
 *                     enum: [manual, electric]
 *                   visual_impairment:
 *                     type: boolean
 *                   hearing_impairment:
 *                     type: boolean
 */
router.post('/multimodal', searchControllerV2.searchMultimodal);

/**
 * @swagger
 * /api/search/validate-booking-deadlines:
 *   post:
 *     summary: Valide les délais de réservation d'assistance
 *     tags: [Search]
 */
router.post('/validate-booking-deadlines', searchControllerV2.validateBookingDeadlines);

/**
 * @swagger
 * /api/search/define-workflow:
 *   post:
 *     summary: Définit le workflow PMR pour un voyage
 *     tags: [Search]
 */
router.post('/define-workflow', searchControllerV2.defineWorkflow);

module.exports = router;
