const express = require('express');
const router = express.Router();
const uberController = require('../../controllers/UBER/Trajet_taxiController');

/**
 * @swagger
 * tags:
 *   name: Uber Simulation
 *   description: Gestion des trajets Uber
 */

/**
 * @swagger
 * /UBER/ride/getAll:
 *   get:
 *     summary: Récupérer tous les trajets Uber
 *     tags: [Uber Simulation]
 *     responses:
 *       200:
 *         description: Liste de tous les trajets Uber récupérée avec succès.
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
 *                   pickup:
 *                     type: string
 *                     example: "Paris"
 *                   dropoff:
 *                     type: string
 *                     example: "Versailles"
 *                   price:
 *                     type: number
 *                     example: 25.5
 */
router.get('/getAll', uberController.getAllTrajet);

/**
 * @swagger
 * /UBER/ride/get/{id}:
 *   get:
 *     summary: Récupérer un trajet Uber par ID
 *     tags: [Uber Simulation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du trajet Uber
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
 *                 pickup:
 *                   type: string
 *                   example: "Paris"
 *                 dropoff:
 *                   type: string
 *                   example: "Versailles"
 *                 price:
 *                   type: number
 *                   example: 25.5
 *       404:
 *         description: Trajet introuvable.
 */
router.get('/get/:id', uberController.getTrajetById);

/**
 * @swagger
 * /UBER/ride/insert:
 *   post:
 *     summary: Créer un nouveau trajet Uber
 *     tags: [Uber Simulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pickup:
 *                 type: string
 *                 example: "Paris"
 *               dropoff:
 *                 type: string
 *                 example: "Versailles"
 *               price:
 *                 type: number
 *                 example: 25.5
 *     responses:
 *       201:
 *         description: Trajet créé avec succès.
 *       400:
 *         description: Données de trajet invalides.
 */
router.post('/insert', uberController.createTrajet);

/**
 * @swagger
 * /UBER/ride/update/{id}:
 *   put:
 *     summary: Mettre à jour un trajet Uber
 *     tags: [Uber Simulation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du trajet à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pickup:
 *                 type: string
 *                 example: "Paris"
 *               dropoff:
 *                 type: string
 *                 example: "Versailles"
 *               price:
 *                 type: number
 *                 example: 30.0
 *     responses:
 *       200:
 *         description: Trajet mis à jour avec succès.
 *       404:
 *         description: Trajet introuvable.
 *       400:
 *         description: Données de trajet invalides.
 */
router.put('/update/:id', uberController.updateTrajet);

/**
 * @swagger
 * /UBER/ride/delete/{id}:
 *   delete:
 *     summary: Supprimer un trajet Uber
 *     tags: [Uber Simulation]
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
router.delete('/delete/:id', uberController.deleteTrajet);

module.exports = router;
