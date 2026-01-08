const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authenticateToken = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Gestion des billets multimodaux
 */

/**
 * @swagger
 * /tickets/generate:
 *   post:
 *     summary: Générer un billet multimodal unique
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_voyage
 *               - user_id
 *             properties:
 *               id_voyage:
 *                 type: integer
 *                 description: ID du voyage MongoDB
 *                 example: 1
 *               user_id:
 *                 type: integer
 *                 description: ID de l'utilisateur
 *                 example: 42
 *     responses:
 *       201:
 *         description: Billet généré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 ticket:
 *                   type: object
 *                   properties:
 *                     ticket_id:
 *                       type: string
 *                     num_reza_mmt:
 *                       type: string
 *                     qr_code:
 *                       type: string
 *                       description: QR code en base64 (data URL)
 *                     qr_code_string:
 *                       type: string
 *                       description: Données JSON du QR code
 *       400:
 *         description: Paramètres manquants
 *       404:
 *         description: Voyage ou réservations introuvables
 *       500:
 *         description: Erreur serveur
 */
router.post('/generate', authenticateToken, ticketController.generateMultimodalTicket);

/**
 * @swagger
 * /tickets/user/{user_id}:
 *   get:
 *     summary: Récupérer tous les billets d'un utilisateur
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Liste des billets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tickets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_voyage:
 *                         type: integer
 *                       num_reza_mmt:
 *                         type: string
 *                       ticket_status:
 *                         type: string
 *                       ticket_generated_at:
 *                         type: string
 *                         format: date-time
 *                       qr_code_string:
 *                         type: string
 *                       voyage_info:
 *                         type: object
 *                       segments:
 *                         type: array
 *       500:
 *         description: Erreur serveur
 */
router.get('/user/:user_id', authenticateToken, ticketController.getUserTickets);

/**
 * @swagger
 * /tickets/voyage/{id_voyage}:
 *   get:
 *     summary: Récupérer un billet spécifique par ID de voyage
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_voyage
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du voyage
 *     responses:
 *       200:
 *         description: Détails du billet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_voyage:
 *                   type: integer
 *                 num_reza_mmt:
 *                   type: string
 *                 ticket_status:
 *                   type: string
 *                 qr_code:
 *                   type: string
 *                   description: QR code en base64
 *                 qr_code_string:
 *                   type: string
 *                 voyage_info:
 *                   type: object
 *                 segments:
 *                   type: array
 *       404:
 *         description: Billet introuvable
 *       500:
 *         description: Erreur serveur
 */
router.get('/voyage/:id_voyage', authenticateToken, ticketController.getTicketByVoyageId);

/**
 * @swagger
 * /tickets/cancel/{id_voyage}:
 *   put:
 *     summary: Annuler un billet
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_voyage
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du voyage à annuler
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Billet annulé avec succès
 *       404:
 *         description: Réservations introuvables
 *       500:
 *         description: Erreur serveur
 */
router.put('/cancel/:id_voyage', authenticateToken, ticketController.cancelTicket);

/**
 * @swagger
 * /tickets/verify:
 *   post:
 *     summary: Vérifier la validité d'un QR code
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qr_code
 *             properties:
 *               qr_code:
 *                 type: string
 *                 description: Données JSON du QR code
 *     responses:
 *       200:
 *         description: Résultat de la vérification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 ticket_status:
 *                   type: string
 *                 ticket_data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: QR code invalide
 *       404:
 *         description: Réservation introuvable
 *       500:
 *         description: Erreur serveur
 */
router.post('/verify', ticketController.verifyTicket);

module.exports = router;
