const express = require('express');
const router = express.Router();
const garecontroller = require('../../controllers/SNCF/GareController');

/**
 * @swagger
 * tags:
 *   name: SNCF Simulation
 *   description: Gestion des gares pour la simulation.
 */


/**
 * @swagger
 * /SNCF/gare/getAll:
 *   get:
 *     summary: Récupérer tous les gares
 *     tags: [SNCF Simulation]
 *     description: Renvoie une liste de tous les gares.
 *     responses:
 *       200:
 *         description: Liste des gares récupérée avec succès.
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
 *                     example: "Gare du Nord"
 *                   location:
 *                     type: string
 *                     example: "Paris, France"
 */
router.get('/getAll', garecontroller.getAllGare);

/**
 * @swagger
 * /SNCF/gare/get/{id}:
 *   get:
 *     summary: Récupérer une gare par son ID
 *     tags: [SNCF Simulation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la gare
 *     responses:
 *       200:
 *         description: Gare récupéré avec succès.
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
 *                   example: "Gare du Nord"
 *                 location:
 *                   type: string
 *                   example: "Paris, France"
 *       404:
 *         description: Aéroport introuvable.
 */
router.get('/get/:id', garecontroller.getGareById);

/**
 * @swagger
 * /SNCF/gare/insert:
 *   post:
 *     summary: Créer une nouvelle gare
 *     tags: [SNCF Simulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Gare du Nord"
 *               city:
 *                 type: string
 *                 example: "Paris"
 *               country:
 *                 type: string
 *                 example: "France"
 *               iata_code:
 *                 type: string
 *                 example: "GDN"
 *               icao_code:
 *                 type: string
 *                 example: "FRGDN"
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: 48.8808
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: 2.3559
 *     responses:
 *       201:
 *         description: Gare créée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gare_id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Gare du Nord"
 *                 city:
 *                   type: string
 *                   example: "Paris"
 *                 country:
 *                   type: string
 *                   example: "France"
 *                 iata_code:
 *                   type: string
 *                   example: "GDN"
 *                 icao_code:
 *                   type: string
 *                   example: "FRGDN"
 *                 latitude:
 *                   type: number
 *                   format: float
 *                   example: 48.8808
 *                 longitude:
 *                   type: number
 *                   format: float
 *                   example: 2.3559
 *       400:
 *         description: Erreur dans les données envoyées.
 */
router.post('/insert', garecontroller.createGare);

/**
 * @swagger
 * /SNCF/gare/update/{id}:
 *   put:
 *     summary: Mettre à jour une gare existante
 *     tags: [SNCF Simulation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la gare à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Gare du nord"
 *               location:
 *                 type: string
 *                 example: "Paris, France"
 *     responses:
 *       200:
 *         description: Gare mis à jour avec succès.
 *       404:
 *         description: Gare introuvable.
 *       400:
 *         description: Erreur dans les données envoyées.
 */
router.put('/update/:id', garecontroller.updateAirport);

/**
 * @swagger
 * /SNCF/gare/delete/{id}:
 *   delete:
 *     summary: Supprimer une gare
 *     tags: [SNCF Simulation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la gare à supprimer
 *     responses:
 *       200:
 *         description: Gare supprimé avec succès.
 *       404:
 *         description: Gare introuvable.
 */
router.delete('/delete/:id', garecontroller.deleteGare);

module.exports = router;