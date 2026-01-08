const express = require('express');
const router = express.Router();
const trajetController = require('../../controllers/SNCF/TrajetController');

/**
 * @swagger
 * tags:
 *   name: SNCF Simulation
 *   description: Gestion des trajet
 */

/**
 * @swagger
 * /SNCF/trajetSNCF/getAll:
 *   get:
 *     summary: Récupérer tous les trajets SNCF
 *     tags: [SNCF Simulation]
 *     responses:
 *       200:
 *         description: Liste de tous les trajets récupérée avec succès.
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
router.get('/getAll', trajetController.getAllTrajet);

/**
 * @swagger
 * /SNCF/trajetSNCF/get/{id}:
 *   get:
 *     summary: Récupérer un trajet SNCF par ID
 *     tags: [SNCF Simulation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du trajetSNCF
 *     responses:
 *       200:
 *         description: trajet récupéré avec succès.
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
router.get('/get/:id', trajetController.getTrajetById);

/**
 * @swagger
 * /SNCF/trajetSNCF/insert:
 *   post:
 *     summary: Créer un nouveau trajet SNCF
 *     tags: [SNCF Simulation]
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
 *       201:
 *         description: Trajet créé avec succès.
 *       400:
 *         description: Données de trajet invalides.
 */
router.post('/insert', trajetController.createTrajetSNCF);

/**
 * @swagger
 * /SNCF/trajetSNCF/update/{id}:
 *   put:
 *     summary: Mettre à jour un trajet SNCF
 *     tags: [SNCF Simulation]
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
 *         description: Trajet mis à jour avec succès.
 *       404:
 *         description: Trajet introuvable.
 *       400:
 *         description: Données de trajet invalides.
 */
router.put('/update/:id', trajetController.updateTrajet);

/**
 * @swagger
 * /SNCF/trajetSNCF/delete/{id}:
 *   delete:
 *     summary: Supprimer un trajet SNCF
 *     tags: [SNCF Simulation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du trajet à supprimer
 *     responses:
 *       200:
 *         description: Trajet supprimé avec succès.
 *       404:
 *         description: Trajet introuvable.
 */
router.delete('/delete/:id', trajetController.deleteTrajet);

/**
 * @swagger
 * /SNCF/trajetSNCF/flight-offers:
 *   get:
 *     summary: Récupérer les trajets SNCF sous forme d'offres Amadeus
 *     tags: [SNCF Simulation]
 *     description: Renvoie les trajets formatés selon le modèle Amadeus.
 *     responses:
 *       200:
 *         description: Offres de trajets SNCF récupérées avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   trajet_id:
 *                     type: string
 *                     example: "1"
 *                   Company:
 *                     type: string
 *                     example: "SNCF"
 *                   price:
 *                     type: number
 *                     example: 450.5
 */
router.get('/trajetSNCF-offers', trajetController.getAllTrajetAmadeusModel);

/**
 * @swagger
 * /SNCF/trajetSNCF/getByGare/{departure_gare_id}/{arrival_gare_id}:
 *   get:
 *     summary: Récupérer un trajet SNCF par les ID des gares de départ et d'arrivée
 *     tags: [SNCF Simulation]
 *     parameters:
 *       - in: path
 *         name: departure_gare_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la gare de départ
 *       - in: path
 *         name: arrival_gare_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la gare d'arrivée
 *     responses:
 *       200:
 *         description: Trajet récupéré avec succès.
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
 *         description: Trajet introuvable.
 */
router.get('/getByGare/:departure_gare_id/:arrival_gare_id', trajetController.getTrajetByGareId);

module.exports = router;