const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const SupabaseService = require('../services/SupabaseService');
const { v4: uuidv4 } = require('uuid');

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

/**
 * @route POST /api/transactions/pay
 * @desc Effectuer un paiement
 * @access Privé
 */
router.post('/pay', async (req, res) => {
    try {
        console.log('💰 [TRANSACTIONS] POST /pay - Début paiement');

        const { sender, receiver, amount, description = "Paiement" } = req.body;

        // Validation
        if (!sender || !receiver || !amount) {
            return res.status(400).json({
                success: false,
                error: 'sender, receiver et amount sont requis'
            });
        }

        const transactionAmount = parseFloat(amount);
        if (isNaN(transactionAmount) || transactionAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Montant invalide'
            });
        }

        // 1. Vérifier le solde de l'expéditeur
        const { data: senderData, error: senderError } = await SupabaseService.client
            .from('users')
            .select('solde, user_id')
            .eq('user_id', sender)
            .single();

        if (senderError || !senderData) {
            return res.status(404).json({
                success: false,
                error: 'Expéditeur non trouvé'
            });
        }

        if (senderData.solde < transactionAmount) {
            return res.status(400).json({
                success: false,
                error: `Solde insuffisant. Disponible: ${senderData.solde}€, Requis: ${transactionAmount}€`
            });
        }

        // 2. Créer la transaction (le trigger SQL s'occupera de la blockchain)
        const transactionId = uuidv4();
        const { error: transactionError } = await SupabaseService.client
            .from('transactions')
            .insert([{
                id: transactionId,
                user_id: sender,
                amount: transactionAmount,
                type: 'Billet_Voyage',
                description: description,
                payment_status: 'paid',
                status: 'completed',
                date_payement: new Date().toISOString()
            }]);

        if (transactionError) {
            console.error('❌ [TRANSACTIONS] Erreur création transaction:', transactionError);
            throw transactionError;
        }

        // 3. Créditer le destinataire (si différent)
        if (sender !== receiver) {
            const { error: receiverError } = await SupabaseService.client
                .from('transactions')
                .insert([{
                    id: uuidv4(),
                    user_id: receiver,
                    amount: transactionAmount,
                    type: 'credit',
                    description: `Réception paiement de ${sender}`,
                    payment_status: 'paid',
                    status: 'completed',
                    date_payement: new Date().toISOString()
                }]);

            if (receiverError) {
                console.warn('⚠️ [TRANSACTIONS] Erreur crédit destinataire:', receiverError);
            }
        }

        // 4. Récupérer le solde mis à jour
        const { data: updatedSender, error: updateError } = await SupabaseService.client
            .from('users')
            .select('solde')
            .eq('user_id', sender)
            .single();

        if (updateError) {
            console.warn('⚠️ [TRANSACTIONS] Erreur récupération solde:', updateError);
        }

        console.log('✅ [TRANSACTIONS] Paiement réussi');

        res.status(201).json({
            success: true,
            message: 'Paiement effectué avec succès',
            transaction: {
                id: transactionId,
                sender: sender,
                receiver: receiver,
                amount: transactionAmount,
                description: description,
                sender_new_balance: updatedSender?.solde || senderData.solde - transactionAmount
            },
            note: 'La transaction a été automatiquement enregistrée dans la blockchain via le trigger SQL'
        });

    } catch (error) {
        console.error('❌ [TRANSACTIONS] Erreur paiement:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du traitement du paiement',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
