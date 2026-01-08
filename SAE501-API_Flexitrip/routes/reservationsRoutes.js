const express = require('express');
const router = express.Router();
const reservationsController = require('../controllers/ReservationsController');
const authenticateToken = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Gestion des réservations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Reservation:
 *       type: object
 *       required:
 *         - user_id
 *         - price
 *       properties:
 *         reservation_id:
 *           type: integer
 *           description: ID unique de la réservation
 *         user_id:
 *           type: integer
 *           description: ID de l'utilisateur ayant effectué la réservation
 *         price:
 *           type: number
 *           format: float
 *           description: Prix total de la réservation
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Date de création de la réservation
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Date de mise à jour de la réservation
 *       example:
 *         reservation_id: 1
 *         user_id: 42
 *         price: 150.50
 *         created_at: "2024-11-01T12:00:00Z"
 *         updated_at: "2024-11-02T14:30:00Z"
 */

/**
 * @swagger
 * /reservations/insert:
 *   post:
 *     summary: Créer une réservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur effectuant la réservation.
 *         example: 1
 *       - in: query
 *         name: id_voyage
 *         schema:
 *           type: string
 *         description: ID du voyage à réserver .
 *         example: "4"
 *       - in: query
 *         name: assistanceBesoin
 *         schema:
 *           type: boolean
 *         description: Indique si une assistance PMR est nécessaire.
 *         example: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: ID de l'utilisateur effectuant la réservation.
 *                 example: 1
 *               id_voyage:
 *                 type: string
 *                 description: ID du voyage à réserver (ici sous forme de chaîne).
 *                 example: "4"
 *               assistanceBesoin:
 *                 type: boolean
 *                 description: Indique si une assistance PMR est nécessaire.
 *                 example: true
 *     responses:
 *       201:
 *         description: Réservation créée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Réservation créée avec succès."
 *       400:
 *         description: Données manquantes ou invalides.
 *       404:
 *         description: Ressource introuvable (utilisateur ou voyage).
 *       500:
 *         description: Erreur lors de la création de la réservation.
 *     example:
 *       value: |
 *         {
 *           "user_id": 1,
 *           "id_voyage": "4",
 *           "assistanceBesoin": true
 *         }
 */
router.post('/insert', reservationsController.doReservationOfTravel);

/**
 * @swagger
 * /reservations/getAll:
 *   get:
 *     summary: Récupérer toutes les réservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de toutes les réservations.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 *       500:
 *         description: Erreur lors de la récupération des réservations.
 */
router.get('/getAll', reservationsController.getAllReservations);

/**
 * @swagger
 * /reservations/getByUser/{id_user}:
 *   get:
 *     summary: Récupérer une réservation par user_id
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_user
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur pour lequel on veut récupérer la réservation
 *     responses:
 *       200:
 *         description: Réservation récupérée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       404:
 *         description: Réservation non trouvée.
 *       500:
 *         description: Erreur lors de la récupération de la réservation.
 */
router.get('/getByUser/:id_user', reservationsController.getReservationByUserId);

/**
 * @swagger
 * /reservations/get/{id}:
 *   get:
 *     summary: Récupérer une réservation par ID
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la réservation
 *     responses:
 *       200:
 *         description: Réservation récupérée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       404:
 *         description: Réservation non trouvée.
 *       500:
 *         description: Erreur lors de la récupération de la réservation.
 */
router.get('/get/:id', reservationsController.getReservationById);

/**
 * @swagger
 * /reservations/update/{id}:
 *   put:
 *     summary: Mettre à jour une réservation par ID
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la réservation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reservation'
 *     responses:
 *       200:
 *         description: Réservation mise à jour avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       404:
 *         description: Réservation non trouvée.
 *       500:
 *         description: Erreur lors de la mise à jour de la réservation.
 */
router.put('/update/:id', authenticateToken, reservationsController.updateReservation);

/**
 * @swagger
 * /reservations/delete/{id}:
 *   delete:
 *     summary: Supprimer une réservation par ID
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la réservation
 *     responses:
 *       200:
 *         description: Réservation supprimée avec succès.
 *       404:
 *         description: Réservation non trouvée.
 *       500:
 *         description: Erreur lors de la suppression de la réservation.
 */
router.delete('/delete/:id', authenticateToken, reservationsController.deleteReservation);

/**
 * @swagger
 * /reservations/voyage-of-reservation/{reservationId}:
 *   get:
 *     summary: Récupérer les détails d'un voyage associé à une réservation
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: L'ID de la réservation
 *     responses:
 *       200:
 *         description: Détails du voyage récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lieu_depart:
 *                   type: object
 *                   properties:
 *                     locomotion:
 *                       type: string
 *                       example: "avion"
 *                     id:
 *                       type: string
 *                       example: "1"
 *                 lieu_arrive:
 *                   type: object
 *                   properties:
 *                     locomotion:
 *                       type: string
 *                       example: "taxi"
 *                     id:
 *                       type: string
 *                       example: "3 rue Albert Mallet"
 *                 _id:
 *                   type: string
 *                   example: "6790cc76964f0a4e890e5f44"
 *                 pmrid:
 *                   type: integer
 *                   example: 1
 *                 accompagnant_id:
 *                   type: integer
 *                   example: 1
 *                 date_debut:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-12-02T10:00:00.000Z"
 *                 date_fin:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *                 bagage:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       poid:
 *                         type: number
 *                         example: 10
 *                       descriptif:
 *                         type: string
 *                         example: "rouge"
 *                 etapes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "FL12345"
 *                       type:
 *                         type: string
 *                         example: "avion"
 *                       compagnie:
 *                         type: string
 *                         example: "Air France"
 *                       adresse_1:
 *                         type: string
 *                         example: ""
 *                       adresse_2:
 *                         type: string
 *                         example: ""
 *                 prix_total:
 *                   type: number
 *                   example: 971.25
 *                 id_voyage:
 *                   type: integer
 *                   example: 4
 *       404:
 *         description: Réservation ou voyage non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Réservation ou voyage non trouvé"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erreur lors de la récupération des détails du voyage"
 */
router.get('/voyage-of-reservation/:reservationId', reservationsController.getVoyageObjectOfReservations);


/**
 * @swagger
 * /reservations/RegisterByVoyageID:
 *   post:
 *     summary: Met à jour l'état d'un voyage
 *     tags: [Reservations]
 *     parameters:
 *       - in: query
 *         name: id_voyage
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du voyage pour lequel récupérer les réservations.
 *       - in: query
 *         name: etat
 *         schema:
 *           type: boolean
 *         required: true
 *         description: Modifier l'état de la reservation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_voyage
 *               - etat
 *             properties:
 *               id_voyage:
 *                 type: integer
 *                 description: ID du voyage.
 *                 example: 1
 *               état:
 *                 type: boolean
 *                 description: État du voyage (actif ou non).
 *                 example: true
 *     responses:
 *       200:
 *         description: État du voyage mis à jour avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "État du voyage mis à jour avec succès."
 *       400:
 *         description: Données manquantes ou invalides.
 *       500:
 *         description: Erreur lors de la mise à jour de l'état du voyage.
 */
router.post('/RegisterByVoyageID', reservationsController.updateEnregistreByVoyageId);

/**
 * @swagger
 * /reservations/getByUser/{id_user}:
 *   get:
 *     summary: Récupérer une réservation par user_id
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_user
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur pour lequel on veut récupérer la réservation
 *     responses:
 *       200:
 *         description: Réservation récupérée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       404:
 *         description: Réservation non trouvée.
 *       500:
 *         description: Erreur lors de la récupération de la réservation.
 */
router.get('/getEnregistrerReservationByUser/:id_user', reservationsController.getReservationByUserId);

module.exports = router;
