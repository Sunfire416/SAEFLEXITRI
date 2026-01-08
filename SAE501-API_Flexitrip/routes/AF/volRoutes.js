const express = require('express');
const router = express.Router();
const flightController = require('../../controllers/AF/volController');

/**
 * @swagger
 * tags:
 *   name: AF Simulation
 *   description: Gestion des vols
 */

/**
 * @swagger
 * /AF/flights/getAll:
 *   get:
 *     summary: Récupérer tous les vols
 *     tags: [AF Simulation]
 *     responses:
 *       200:
 *         description: Liste de tous les vols récupérée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "1"
 *                   departure:
 *                     type: string
 *                     example: "Paris"
 *                   destination:
 *                     type: string
 *                     example: "New York"
 *                   price:
 *                     type: number
 *                     example: 450.5
 */
router.get('/getAll', flightController.getAllFlights);

/**
 * @swagger
 * /AF/flights/get/{id}:
 *   get:
 *     summary: Récupérer un vol par ID
 *     tags: [AF Simulation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du vol
 *     responses:
 *       200:
 *         description: Vol récupéré avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "1"
 *                 departure:
 *                   type: string
 *                   example: "Paris"
 *                 destination:
 *                   type: string
 *                   example: "New York"
 *                 price:
 *                   type: number
 *                   example: 450.5
 *       404:
 *         description: Vol introuvable.
 */
router.get('/get/:id', flightController.getFlightById);

/**
 * @swagger
 * /AF/flights/insert:
 *   post:
 *     summary: Créer un nouveau vol
 *     tags: [AF Simulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - flight_id
 *               - company
 *               - available_seats
 *               - price
 *               - max_weight_suitcase
 *               - departure_airport_id
 *               - arrival_airport_id
 *               - departure_time
 *               - arrival_time
 *               - status
 *             properties:
 *               flight_id:
 *                 type: string
 *                 description: "Identifiant unique du vol"
 *               company:
 *                 type: string
 *                 description: "Nom de la compagnie aérienne"
 *               available_seats:
 *                 type: integer
 *                 description: "Nombre de sièges disponibles"
 *               price:
 *                 type: number
 *                 description: "Prix du vol"
 *               max_weight_suitcase:
 *                 type: number
 *                 description: "Poids maximum autorisé pour les bagages"
 *               departure_airport_id:
 *                 type: string
 *                 description: "Identifiant de l'aéroport de départ"
 *               arrival_airport_id:
 *                 type: string
 *                 description: "Identifiant de l'aéroport d'arrivée"
 *               departure_time:
 *                 type: string
 *                 format: date-time
 *                 description: "Date et heure de départ (format ISO 8601)"
 *               arrival_time:
 *                 type: string
 *                 format: date-time
 *                 description: "Date et heure d'arrivée (format ISO 8601)"
 *               status:
 *                 type: string
 *                 description: "Statut du vol (par exemple, 'Scheduled', 'Cancelled')"
 *     responses:
 *       201:
 *         description: Vol créé avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 flight_id:
 *                   type: string
 *                   description: "Identifiant unique du vol."
 *                   example: "AF123"
 *                 company:
 *                   type: string
 *                   description: "Nom de la compagnie aérienne."
 *                   example: "Air France"
 *                 available_seats:
 *                   type: integer
 *                   description: "Nombre de sièges disponibles."
 *                   example: 150
 *                 price:
 *                   type: number
 *                   description: "Prix du vol."
 *                   example: 450.5
 *                 max_weight_suitcase:
 *                   type: number
 *                   description: "Poids maximum autorisé pour les bagages."
 *                   example: 23
 *                 departure_airport_id:
 *                   type: string
 *                   description: "Identifiant de l'aéroport de départ."
 *                   example: "CDG"
 *                 arrival_airport_id:
 *                   type: string
 *                   description: "Identifiant de l'aéroport d'arrivée."
 *                   example: "JFK"
 *                 departure_time:
 *                   type: string
 *                   format: date-time
 *                   description: "Date et heure de départ (format ISO 8601)."
 *                   example: "2025-01-27T10:30:00Z"
 *                 arrival_time:
 *                   type: string
 *                   format: date-time
 *                   description: "Date et heure d'arrivée (format ISO 8601)."
 *                   example: "2025-01-27T14:30:00Z"
 *                 status:
 *                   type: string
 *                   description: "Statut du vol."
 *                   example: "Scheduled"
 *       400:
 *         description: Données de vol invalides.
 *       500:
 *         description: Erreur serveur lors de la création du vol.
 */
router.post('/insert', flightController.createFlight);

/**
 * @swagger
 * /AF/flights/update/{id}:
 *   put:
 *     summary: Mettre à jour un vol
 *     tags: [AF Simulation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du vol à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               departure:
 *                 type: string
 *                 example: "Paris"
 *               destination:
 *                 type: string
 *                 example: "New York"
 *               price:
 *                 type: number
 *                 example: 450.5
 *     responses:
 *       200:
 *         description: Vol mis à jour avec succès.
 *       404:
 *         description: Vol introuvable.
 *       400:
 *         description: Données de vol invalides.
 */
router.put('/update/:id', flightController.updateFlight);

/**
 * @swagger
 * /AF/flights/delete/{id}:
 *   delete:
 *     summary: Supprimer un vol
 *     tags: [AF Simulation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du vol à supprimer
 *     responses:
 *       200:
 *         description: Vol supprimé avec succès.
 *       404:
 *         description: Vol introuvable.
 */
router.delete('/delete/:id', flightController.deleteFlight);

/**
 * @swagger
 * /AF/flights/flight-offers:
 *   get:
 *     summary: Récupérer les vols sous forme d'offres Amadeus
 *     tags: [AF Simulation]
 *     description: Renvoie les vols formatés selon le modèle Amadeus.
 *     responses:
 *       200:
 *         description: Offres de vols récupérées avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   flight_id:
 *                     type: string
 *                     example: "1"
 *                   airline:
 *                     type: string
 *                     example: "Air France"
 *                   price:
 *                     type: number
 *                     example: 450.5
 */
router.get('/flight-offers', flightController.getAllFlightsAmadeusModel);

/**
 * @swagger
 * /AF/flights/getByAirports/{departure_airport_id}/{arrival_airport_id}:
 *   get:
 *     summary: Récupérer un vol par l'ID des aéroports de départ et d'arrivée
 *     tags: [AF Simulation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departure_airport_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'aéroport de départ
 *       - in: path
 *         name: arrival_airport_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'aéroport d'arrivée
 *     responses:
 *       200:
 *         description: Vol récupéré avec succès.
 *         content:
 *           application/json:
 *              schema:
 *               type: object
 *               properties:
 *                 flight_id:
 *                   type: string
 *                   description: "Identifiant unique du vol."
 *                   example: "AF123"
 *                 company:
 *                   type: string
 *                   description: "Nom de la compagnie aérienne."
 *                   example: "Air France"
 *                 available_seats:
 *                   type: integer
 *                   description: "Nombre de sièges disponibles."
 *                   example: 150
 *                 price:
 *                   type: number
 *                   description: "Prix du vol."
 *                   example: 450.5
 *                 max_weight_suitcase:
 *                   type: number
 *                   description: "Poids maximum autorisé pour les bagages."
 *                   example: 23
 *                 departure_airport_id:
 *                   type: string
 *                   description: "Identifiant de l'aéroport de départ."
 *                   example: "CDG"
 *                 arrival_airport_id:
 *                   type: string
 *                   description: "Identifiant de l'aéroport d'arrivée."
 *                   example: "JFK"
 *                 departure_time:
 *                   type: string
 *                   format: date-time
 *                   description: "Date et heure de départ (format ISO 8601)."
 *                   example: "2025-01-27T10:30:00Z"
 *                 arrival_time:
 *                   type: string
 *                   format: date-time
 *                   description: "Date et heure d'arrivée (format ISO 8601)."
 *                   example: "2025-01-27T14:30:00Z"
 *                 status:
 *                   type: string
 *                   description: "Statut du vol."
 *                   example: "Scheduled"
 *       404:
 *         description: Vol non trouvé.
 *       500:
 *         description: Erreur lors de la récupération du vol.
 */
router.get('/getByAirports/:departure_airport_id/:arrival_airport_id', flightController.getFlightByAirportId);

module.exports = router;
