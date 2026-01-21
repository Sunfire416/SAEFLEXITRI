const express = require('express');
const router = express.Router();
const BlockchainController = require('../controllers/blockchainController');
const authMiddleware = require('../middleware/auth');

// Middleware de debug
router.use((req, res, next) => {
    console.log(`🔗 [BLOCKCHAIN] ${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Toutes les routes blockchain nécessitent une authentification
router.use(authMiddleware.authenticate);

/**
 * @route GET /api/blockchain/history
 * @desc Récupérer l'historique blockchain
 */
router.get('/history', (req, res) => BlockchainController.getHistory(req, res));

/**
 * @route GET /api/blockchain/verify
 * @desc Vérifier l'intégrité de la blockchain
 */
router.get('/verify', (req, res) => BlockchainController.verifyChain(req, res));

/**
 * @route GET /api/blockchain/transaction/:transaction_id
 * @desc Vérifier une transaction spécifique
 */
router.get('/transaction/:transaction_id', (req, res) => BlockchainController.verifyTransaction(req, res));

/**
 * @route POST /api/blockchain/verify-status
 * @desc Vérifier le statut d'une transaction
 */
router.post('/verify-status', (req, res) => BlockchainController.verifyTransactionStatus(req, res));

/**
 * @route GET /api/blockchain/summary
 * @desc Obtenir un résumé de la blockchain
 */
router.get('/summary', (req, res) => BlockchainController.getSummary(req, res));

/**
 * @route GET /api/blockchain/balance
 * @desc Récupérer le solde et l'historique de l'utilisateur connecté
 */
router.get('/balance', async (req, res) => {
    try {
        const user_id = req.user.user_id;

        const SupabaseService = require('../services/SupabaseService');

        const { data: user, error: userError } = await SupabaseService.client
            .from('users')
            .select('solde')
            .eq('user_id', user_id)
            .single();

        if (userError || !user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        // Récupérer l'historique
        const BlockchainService = require('../services/blockchainService');
        const result = await BlockchainService.getUserHistory(user_id);

        res.json({
            success: true,
            balance: parseFloat(user.solde) || 0, // Force la conversion en nombre
            currency: 'EUR',
            history: result.success ? result.transactions : [],
            last_updated: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erreur récupération balance:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du solde'
        });
    }
});

module.exports = router;