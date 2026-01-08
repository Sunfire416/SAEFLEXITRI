const express = require('express');
const router = express.Router();
const { addBlock, getBlockchain, getUserBalance, getUserTransactions } = require('../controllers/BlockchainController');
const authenticateToken = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Blockchain
 *   description: Gestion de la blockchain des crédits
 */

/**
 * @swagger
 * /blockchain/addBlock:
 *   post:
 *     summary: Ajouter un nouveau bloc à la blockchain
 *     tags: [Blockchain]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sender:
 *                 type: string
 *               receiver:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Bloc ajouté avec succès.
 *       500:
 *         description: Erreur lors de l'ajout du bloc.
 */
router.post('/addBlock', authenticateToken, addBlock);

/**
 * @swagger
 * /blockchain:
 *   get:
 *     summary: Récupérer toute la blockchain
 *     tags: [Blockchain]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blockchain récupérée avec succès.
 *       500:
 *         description: Erreur lors de la récupération de la blockchain.
 */
router.get('/', authenticateToken, getBlockchain);


/**
 * @swagger
 * /blockchain/balance/{userId}:
 *   get:
 *     summary: Récupérer le solde d'un utilisateur
 *     tags: [Blockchain]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Solde récupéré avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Solde récupéré avec succès.
 *                 balance:
 *                   type: number
 *                   example: 100.50
 *       404:
 *         description: Utilisateur non trouvé.
 *       500:
 *         description: Erreur serveur.
 */
router.get('/balance/:userId', authenticateToken, getUserBalance);

/**
 * @swagger
 * /blockchain/historic/{user_id}:
 *   get:
 *     summary: Récupérer l'historique des transactions d'un utilisateur
 *     tags: [Blockchain]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Historique des transactions récupéré avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   sender:
 *                     type: string
 *                   receiver:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: user_id non fourni.
 *       500:
 *         description: Erreur lors de la récupération des transactions.
 */
router.get('/historic/:user_id', authenticateToken, getUserTransactions);

module.exports = router;
