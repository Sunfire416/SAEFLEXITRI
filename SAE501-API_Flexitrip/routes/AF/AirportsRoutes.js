const express = require('express');
const router = express.Router();
const airportController = require('../../controllers/AF/AirportsController');

/**
 * @swagger
 * tags:
 *   name: AF Simulation
 *   description: Gestion des aéroports pour la simulation.
 */


/**
 * @swagger
 * /AF/airports/getAll:
 *   get:
 *     summary: Récupérer tous les aéroports
 *     tags: [AF Simulation]
 *     description: Renvoie une liste de tous les aéroports.
 *     responses:
 *       200:
 *         description: Liste des aéroports récupérée avec succès.
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
 *                   name:
 *                     type: string
 *                     example: "Charles de Gaulle"
 *                   location:
 *                     type: string
 *                     example: "Paris, France"
 */
router.get('/getAll', airportController.getAllAirports);

/**
 * @swagger
 * /AF/airports/get/{id}:
 *   get:
 *     summary: Récupérer un aéroport par son ID
 *     tags: [AF Simulation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'aéroport
 *     responses:
 *       200:
 *         description: Aéroport récupéré avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "1"
 *                 name:
 *                   type: string
 *                   example: "Charles de Gaulle"
 *                 location:
 *                   type: string
 *                   example: "Paris, France"
 *       404:
 *         description: Aéroport introuvable.
 */
router.get('/get/:id', airportController.getAirportById);

/**
 * @swagger
 * /AF/airports/insert:
 *   post:
 *     summary: "Créer un nouvel aéroport"
 *     tags: [AF Simulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - city
 *               - country
 *               - iata_code
 *               - icao_code
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *                 description: "Nom de l'aéroport"
 *               city:
 *                 type: string
 *                 description: "Ville où se situe l'aéroport"
 *               country:
 *                 type: string
 *                 description: "Pays où se situe l'aéroport"
 *               iata_code:
 *                 type: string
 *                 description: "Code IATA de l'aéroport"
 *               icao_code:
 *                 type: string
 *                 description: "Code OACI de l'aéroport"
 *               latitude:
 *                 type: number
 *                 description: "Latitude de l'aéroport"
 *               longitude:
 *                 type: number
 *                 description: "Longitude de l'aéroport"
 *     responses:
 *       201:
 *         description: Aéroport créé avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: Identifiant unique de l'aéroport.
 *                   example: 1
 *                 name:
 *                   type: string
 *                   description: Nom de l'aéroport.
 *                   example: "Charles de Gaulle"
 *                 city:
 *                   type: string
 *                   description: Ville où se situe l'aéroport.
 *                   example: "Paris"
 *                 country:
 *                   type: string
 *                   description: Pays où se situe l'aéroport.
 *                   example: "France"
 *                 iata_code:
 *                   type: string
 *                   description: Code IATA de l'aéroport.
 *                   example: "CDG"
 *                 icao_code:
 *                   type: string
 *                   description: Code OACI de l'aéroport.
 *                   example: "LFPG"
 *                 latitude:
 *                   type: number
 *                   description: Latitude de l'aéroport.
 *                   example: 49.0097
 *                 longitude:
 *                   type: number
 *                   description: Longitude de l'aéroport.
 *                   example: 2.5479
 *       400:
 *         description: Erreur dans les données envoyées.
 *       500:
 *         description: Erreur serveur lors de la création de l'aéroport.
 */
router.post('/insert', airportController.createAirport);

/**
 * @swagger
 * /AF/airports/update/{id}:
 *   put:
 *     summary: Mettre à jour un aéroport existant
 *     tags: [AF Simulation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'aéroport à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Charles de Gaulle"
 *               location:
 *                 type: string
 *                 example: "Paris, France"
 *     responses:
 *       200:
 *         description: Aéroport mis à jour avec succès.
 *       404:
 *         description: Aéroport introuvable.
 *       400:
 *         description: Erreur dans les données envoyées.
 */
router.put('/update/:id', airportController.updateAirport);

/**
 * @swagger
 * /AF/airports/delete/{id}:
 *   delete:
 *     summary: Supprimer un aéroport
 *     tags: [AF Simulation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'aéroport à supprimer
 *     responses:
 *       200:
 *         description: Aéroport supprimé avec succès.
 *       404:
 *         description: Aéroport introuvable.
 */
router.delete('/delete/:id', airportController.deleteAirport);

module.exports = router;
