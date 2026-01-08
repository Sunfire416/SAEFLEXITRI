const express = require('express');
const router = express.Router();
const voyageController = require('../controllers/voyageController');

/**
 * @swagger
 * tags:
 *   name: Voyage
 *   description: API pour gérer les voyages
 */

/**
 * @swagger
 * /voyage/insert:
 *   post:
 *     summary: "Créer un nouveau voyage"
 *     tags: [Voyage]
 *     parameters:
 *       - in: query
 *         name: id_pmr
 *         type: integer
 *         required: true
 *         description: "Identifiant du PMR (Personne à Mobilité Réduite)"
 *       - in: query
 *         name: id_accompagnant
 *         type: integer
 *         description: "Identifiant de l'accompagnant"
 *       - in: query
 *         name: prix_total
 *         type: number
 *         format: float
 *         required: true
 *         description: "Prix total du voyage"
 *       - in: body
 *         name: bagage
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: "Identifiant du bagage"
 *             poid:
 *               type: string
 *               description: "Poids du bagage (ex: '10kg')"
 *             descriptif:
 *               type: string
 *               description: "Description du bagage"
 *       - in: body
 *         name: etapes
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [avion, train, taxi]
 *               description: "Type d'étape (avion, train, taxi)"
 *             id:
 *               type: string
 *               description: "Identifiant de l'étape (par exemple, un vol ID, un trajet ID)"
 *             adresse_1:
 *               type: string
 *               description: "Adresse de départ (pour un taxi)"
 *             adresse_2:
 *               type: string
 *               description: "Adresse d'arrivée (pour un taxi)"
 *             departure_time:
 *               type: string
 *               format: date-time
 *               description: "Heure de départ (pour un taxi)"
 *             arrival_time:
 *               type: string
 *               format: date-time
 *               description: "Heure d'arrivée (pour un taxi)"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_pmr:
 *                 type: integer
 *                 description: "Identifiant du PMR (Personne à Mobilité Réduite)"
 *               id_accompagnant:
 *                 type: integer
 *                 description: "Identifiant de l'accompagnant"
 *               prix_total:
 *                 type: number
 *                 format: float
 *                 description: "Prix total du voyage"
 *               bagage:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: "Identifiant du bagage"
 *                     poid:
 *                       type: string
 *                       description: "Poids du bagage (ex: '10kg')"
 *                     descriptif:
 *                       type: string
 *                       description: "Description du bagage"
 *               etapes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [avion, train, taxi]
 *                       description: "Type d'étape (avion, train, taxi)"
 *                     id:
 *                       type: string
 *                       description: "Identifiant de l'étape (par exemple, un vol ID, un trajet ID)"
 *                     adresse_1:
 *                       type: string
 *                       description: "Adresse de départ (pour un taxi)"
 *                     adresse_2:
 *                       type: string
 *                       description: "Adresse d'arrivée (pour un taxi)"
 *                     departure_time:
 *                       type: string
 *                       format: date-time
 *                       description: "Heure de départ (pour un taxi)"
 *                     arrival_time:
 *                       type: string
 *                       format: date-time
 *                       description: "Heure d'arrivée (pour un taxi)"
 *     responses:
 *       201:
 *         description: "Voyage créé avec succès"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pmrid:
 *                   type: integer
 *                   description: "Identifiant du PMR"
 *                 accompagnant_id:
 *                   type: integer
 *                   description: "Identifiant de l'accompagnant"
 *                 date_debut:
 *                   type: string
 *                   format: date-time
 *                   description: "Date de début du voyage"
 *                 date_fin:
 *                   type: string
 *                   format: date-time
 *                   description: "Date de fin du voyage"
 *                 lieu_depart:
 *                   type: object
 *                   properties:
 *                     locomotion:
 *                       type: string
 *                       description: "Type de locomotion (train, avion, taxi)"
 *                     id:
 *                       type: integer
 *                       description: "Identifiant du lieu de départ"
 *                 lieu_arrive:
 *                   type: object
 *                   properties:
 *                     locomotion:
 *                       type: string
 *                       description: "Type de locomotion (train, avion, taxi)"
 *                     id:
 *                       type: integer
 *                       description: "Identifiant du lieu d'arrivée"
 *                 bagage:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: "Identifiant du bagage"
 *                       poid:
 *                         type: number
 *                         description: "Poids du bagage"
 *                       descriptif:
 *                         type: string
 *                         description: "Description du bagage"
 *                 etapes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: "Identifiant de l'étape (vol, trajet, taxi)"
 *                       type:
 *                         type: string
 *                         enum: [avion, train, taxi]
 *                         description: "Type d'étape"
 *                       compagnie:
 *                         type: string
 *                         description: "Compagnie de transport"
 *                       adresse_1:
 *                         type: string
 *                         description: "Adresse de départ (pour un taxi)"
 *                       adresse_2:
 *                         type: string
 *                         description: "Adresse d'arrivée (pour un taxi)"
 *                 prix_total:
 *                   type: number
 *                   format: float
 *                   description: "Prix total du voyage"
 *       500:
 *         description: "Erreur lors de la création du voyage"
 */
router.post('/insert', voyageController.createVoyage);



/**
 * @swagger
 * /voyage/getAll:
 *   get:
 *     summary: Récupérer tous les voyages
 *     tags: [Voyage]
 *     responses:
 *       200:
 *         description: Liste de tous les voyages
 *       500:
 *         description: Erreur lors de la récupération des voyages
 */
router.get('/getAll', voyageController.getVoyages);

/**
 * @swagger
 * /voyage/get/{id}:
 *   get:
 *     summary: Récupérer un voyage par ID
 *     tags: [Voyage]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID du voyage à récupérer
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Voyage récupéré avec succès
 *       404:
 *         description: Voyage non trouvé
 *       500:
 *         description: Erreur lors de la récupération du voyage
 */
router.get('/get/:id', voyageController.getVoyageById);

/**
 * @swagger
 * /voyage/update/{id}:
 *   put:
 *     summary: Mettre à jour un voyage
 *     tags: [Voyage]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID du voyage à mettre à jour
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               
 *     responses:
 *       200:
 *         description: Voyage mis à jour avec succès
 *       404:
 *         description: Voyage non trouvé
 *       500:
 *         description: Erreur lors de la mise à jour du voyage
 */
router.put('/update/:id', voyageController.updateVoyage);

/**
 * @swagger
 * /voyage/delete/{id}:
 *   delete:
 *     summary: Supprimer un voyage
 *     tags: [Voyage]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID du voyage à supprimer
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Voyage supprimé avec succès
 *       404:
 *         description: Voyage non trouvé
 *       500:
 *         description: Erreur lors de la suppression du voyage
 */
router.delete('/delete/:id', voyageController.deleteVoyage);

module.exports = router;
