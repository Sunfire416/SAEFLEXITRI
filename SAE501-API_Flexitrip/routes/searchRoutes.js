const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const authenticateToken = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Recherche multimodale de voyages
 */

/**
 * @swagger
 * /search/multimodal:
 *   get:
 *     summary: Recherche multimodale combinant avion, train et bus
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: departure
 *         schema:
 *           type: string
 *         required: true
 *         description: Ville de départ
 *         example: Paris
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         required: true
 *         description: Ville de destination
 *         example: Barcelone
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date du voyage (YYYY-MM-DD)
 *         example: 2026-01-20
 *       - in: query
 *         name: pmr_required
 *         schema:
 *           type: boolean
 *         description: Filtrer uniquement les trajets accessibles PMR
 *         example: true
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Prix maximum total du voyage
 *         example: 500
 *       - in: query
 *         name: max_transfers
 *         schema:
 *           type: integer
 *         description: Nombre maximum de correspondances
 *         example: 2
 *     responses:
 *       200:
 *         description: Liste des itinéraires disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: object
 *                   properties:
 *                     departure:
 *                       type: string
 *                     destination:
 *                       type: string
 *                     date:
 *                       type: string
 *                     pmr_required:
 *                       type: boolean
 *                 results:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     direct:
 *                       type: integer
 *                     with_transfers:
 *                       type: integer
 *                 trips:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       trip_id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [direct, avec_correspondance]
 *                       segments:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               enum: [avion, train, taxi]
 *                             id:
 *                               type: string
 *                             company:
 *                               type: string
 *                             departure:
 *                               type: string
 *                             arrival:
 *                               type: string
 *                             departure_time:
 *                               type: string
 *                               format: date-time
 *                             arrival_time:
 *                               type: string
 *                               format: date-time
 *                             duration:
 *                               type: string
 *                             price:
 *                               type: number
 *                             pmr_compatible:
 *                               type: boolean
 *                             pmr_services:
 *                               type: object
 *                       total_duration:
 *                         type: string
 *                       total_price:
 *                         type: number
 *                       pmr_compatible:
 *                         type: boolean
 *                       number_of_transfers:
 *                         type: integer
 *       400:
 *         description: Paramètres manquants
 *       500:
 *         description: Erreur serveur
 */
router.get('/multimodal', searchController.searchMultimodalTrips);

/**
 * @swagger
 * /search/taxis:
 *   get:
 *     summary: Recherche de taxis/navettes disponibles
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         required: true
 *         description: Adresse de départ
 *         example: Aéroport Paris Charles de Gaulle
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         required: true
 *         description: Adresse d'arrivée
 *         example: Gare de Lyon, Paris
 *       - in: query
 *         name: pmr_required
 *         schema:
 *           type: boolean
 *         description: Véhicule PMR requis
 *         example: true
 *     responses:
 *       200:
 *         description: Liste des taxis disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: object
 *                 results:
 *                   type: integer
 *                 rides:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ride_id:
 *                         type: integer
 *                       company:
 *                         type: string
 *                       from:
 *                         type: string
 *                       to:
 *                         type: string
 *                       duration:
 *                         type: string
 *                       price:
 *                         type: number
 *                       pmr_compatible:
 *                         type: boolean
 *                       vehicle_type:
 *                         type: string
 *       400:
 *         description: Paramètres manquants
 *       500:
 *         description: Erreur serveur
 */
router.get('/taxis', searchController.searchTaxis);

module.exports = router;
