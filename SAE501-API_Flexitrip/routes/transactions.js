const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Note: L'authentification est déjà appliquée globalement dans app.js
// via authMiddleware.authenticate avant le montage de ces routes

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get user transactions
 *     tags: [Transactions]
 */
router.get('/', (req, res) => transactionController.getUserTransactions(req, res));

/**
 * @swagger
 * /api/transactions/wallet:
 *   get:
 *     summary: Get user wallet balance
 *     tags: [Transactions]
 */
router.get('/wallet', (req, res) => transactionController.getUserWallet(req, res));

/**
 * @swagger
 * /api/transactions/wallet/history:
 *   get:
 *     summary: Get wallet transaction history
 *     tags: [Transactions]
 */
router.get('/wallet/history', (req, res) => transactionController.getWalletHistory(req, res));

/**
 * @swagger
 * /api/transactions/wallet/credit:
 *   post:
 *     summary: Credit wallet (admin or recharge)
 *     tags: [Transactions]
 */
router.post('/wallet/credit', (req, res) => transactionController.creditWallet(req, res));

module.exports = router;
