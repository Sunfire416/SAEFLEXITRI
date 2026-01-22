// ======================================================================
// WALLET SERVICE - ÉTAPE 10
// ======================================================================
// Auto-déduction du wallet lors du booking
// Gestion du solde utilisateur et historique des transactions
// ======================================================================

const { User } = require('../models');
const SupabaseService = require('./SupabaseService');
const notificationService = require('./notificationService');

/**
 * ÉTAPE 10 : Vérifie si l'utilisateur a un solde suffisant
 * @param {number} user_id - ID de l'utilisateur
 * @param {number} amount - Montant à vérifier
 * @returns {Promise<{hasSufficient: boolean, currentBalance: number}>}
 */
async function checkSufficientBalance(user_id, amount) {
    try {
        const user = await User.findByPk(user_id);
        if (!user) {
            return { hasSufficient: false, currentBalance: 0 };
        }

        return {
            hasSufficient: user.solde >= amount,
            currentBalance: user.solde
        };
    } catch (error) {
        console.error('[walletService] Erreur vérification solde:', error);
        return { hasSufficient: false, currentBalance: 0 };
    }
}

/**
 * ÉTAPE 10 : Déduit automatiquement le montant du wallet de l'utilisateur
 * @param {Object} params - Paramètres de déduction
 * @param {number} params.user_id - ID de l'utilisateur
 * @param {number} params.amount - Montant à déduire
 * @param {string} params.booking_reference - Référence du booking
 * @param {string} params.description - Description de la transaction (optionnelle)
 * @param {string} params.voyage_id - ID du voyage MongoDB (optionnel)
 * @returns {Promise<Object>} - Résultat de la déduction avec transaction_id
 */
async function deductFromWallet(params) {
    const {
        user_id,
        amount,
        booking_reference,
        description = 'Paiement booking FlexiTrip',
        voyage_id = null
    } = params;

    try {
        // 1) Vérifier solde suffisant
        const balanceCheck = await checkSufficientBalance(user_id, amount);
        if (!balanceCheck.hasSufficient) {
            console.warn(`[walletService] Solde insuffisant pour user ${user_id} : ${balanceCheck.currentBalance} < ${amount}`);
            return {
                success: false,
                error: 'INSUFFICIENT_BALANCE',
                currentBalance: balanceCheck.currentBalance,
                required: amount
            };
        }

        // 2) Déduire du solde MySQL
        const user = await User.findByPk(user_id);
        const oldBalance = user.solde;
        const newBalance = oldBalance - amount;
        
        await user.update({ solde: newBalance });

        // 3) Créer transaction Supabase (historique)
        const { data: transaction, error: txError } = await SupabaseService.client
            .from('transactions')
            .insert({
                user_id: user_id,
                reservation_id: null,
                amount: amount,
                payment_status: 'paid',
                type: 'debit',
                date_payement: new Date().toISOString(),
                balance_after: newBalance,
                description: description
            })
            .select('*')
            .single();

        if (txError) {
            throw txError;
        }

        // 4) Envoyer notification de paiement réussi
        try {
            await notificationService.createNotification({
                user_id: user_id,
                type: 'PAYMENT_SUCCESS',
                title: 'Paiement effectué',
                message: `${amount} points déduits pour le booking ${booking_reference}`,
                data: {
                    transaction_id: transaction.id,
                    booking_reference: booking_reference,
                    amount: amount,
                    balance_after: newBalance
                },
                priority: 'normal',
                icon: '💳'
            });
        } catch (notifError) {
            console.error('[walletService] Erreur envoi notification paiement:', notifError);
            // Non-bloquant
        }

        console.log(`[walletService] ✅ Déduction réussie : ${amount} points (user ${user_id}) - Nouveau solde: ${newBalance}`);

        return {
            success: true,
            transaction_id: transaction.id,
            amount_deducted: amount,
            balance_before: oldBalance,
            balance_after: newBalance,
            booking_reference: booking_reference
        };

    } catch (error) {
        console.error('[walletService] Erreur déduction wallet:', error);
        
        // Notification d'erreur
        try {
            await notificationService.createNotification({
                user_id: user_id,
                type: 'PAYMENT_FAILURE',
                title: 'Échec du paiement',
                message: `Impossible de débiter ${amount} points pour le booking ${booking_reference}`,
                data: {
                    booking_reference: booking_reference,
                    amount: amount,
                    error: error.message
                },
                priority: 'high',
                icon: '❌'
            });
        } catch (notifError) {
            console.error('[walletService] Erreur envoi notification échec:', notifError);
        }

        return {
            success: false,
            error: 'DEDUCTION_FAILED',
            details: error.message
        };
    }
}

/**
 * ÉTAPE 10 : Crédite le wallet de l'utilisateur (remboursement)
 * @param {Object} params - Paramètres de crédit
 * @param {number} params.user_id - ID de l'utilisateur
 * @param {number} params.amount - Montant à créditer
 * @param {string} params.booking_reference - Référence du booking (optionnelle)
 * @param {string} params.reason - Raison du crédit
 * @returns {Promise<Object>} - Résultat du crédit
 */
async function creditToWallet(params) {
    const {
        user_id,
        amount,
        booking_reference = null,
        reason = 'Remboursement FlexiTrip'
    } = params;

    try {
        // 1) Créditer solde MySQL
        const user = await User.findByPk(user_id);
        if (!user) {
            console.error(`[walletService] Utilisateur ${user_id} introuvable pour crédit`);
            return {
                success: false,
                error: 'USER_NOT_FOUND'
            };
        }

        const oldBalance = user.solde;
        const newBalance = oldBalance + amount;
        
        await user.update({ solde: newBalance });

        // 2) Créer transaction Supabase (historique)
        const { data: transaction, error: txError } = await SupabaseService.client
            .from('transactions')
            .insert({
                user_id: user_id,
                reservation_id: null,
                amount: amount,
                payment_status: 'paid',
                type: 'credit',
                date_payement: new Date().toISOString(),
                balance_after: newBalance,
                description: reason
            })
            .select('*')
            .single();

        if (txError) {
            throw txError;
        }

        // 3) Envoyer notification de crédit
        try {
            await notificationService.createNotification({
                user_id: user_id,
                type: 'PAYMENT_SUCCESS',
                title: 'Remboursement effectué',
                message: `${amount} points crédités - ${reason}`,
                data: {
                    transaction_id: transaction.id,
                    booking_reference: booking_reference,
                    amount: amount,
                    balance_after: newBalance
                },
                priority: 'normal',
                icon: '💰'
            });
        } catch (notifError) {
            console.error('[walletService] Erreur envoi notification crédit:', notifError);
        }

        console.log(`[walletService] ✅ Crédit réussi : +${amount} points (user ${user_id}) - Nouveau solde: ${newBalance}`);

        return {
            success: true,
            transaction_id: transaction.id,
            amount_credited: amount,
            balance_before: oldBalance,
            balance_after: newBalance
        };

    } catch (error) {
        console.error('[walletService] Erreur crédit wallet:', error);
        return {
            success: false,
            error: 'CREDIT_FAILED',
            details: error.message
        };
    }
}

/**
 * ÉTAPE 10 : Récupère le solde actuel d'un utilisateur
 * @param {number} user_id - ID de l'utilisateur
 * @returns {Promise<number>} - Solde actuel
 */
async function getBalance(user_id) {
    try {
        const user = await User.findByPk(user_id);
        return user ? user.solde : 0;
    } catch (error) {
        console.error('[walletService] Erreur récupération solde:', error);
        return 0;
    }
}

/**
 * ÉTAPE 10 : Récupère l'historique des transactions d'un utilisateur
 * @param {number} user_id - ID de l'utilisateur
 * @param {number} limit - Nombre max de transactions (défaut 50)
 * @returns {Promise<Array>} - Liste des transactions
 */
async function getTransactionHistory(user_id, limit = 50) {
    try {
        const { data, error } = await SupabaseService.client
            .from('transactions')
            .select('*')
            .eq('user_id', user_id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('[walletService] Erreur récupération historique:', error);
        return [];
    }
}

/**
 * ÉTAPE 10 : Calcule le prix du booking selon le workflow
 * @param {string} workflow - Type de workflow (MINIMAL, LIGHT, MODERATE, FULL)
 * @param {Object} options - Options du booking (distance, pmrNeeds, etc.)
 * @returns {number} - Prix calculé en points
 */
function calculateBookingPrice(workflow, options = {}) {
    const { distance = 0, pmrNeeds = {} } = options;

    // Prix de base selon workflow
    const basePrices = {
        MINIMAL: 10,  // Bus local
        LIGHT: 25,    // Train régional
        MODERATE: 80, // Vol national
        FULL: 150     // Vol international
    };

    let price = basePrices[workflow] || 50;

    // Majoration selon distance (si applicable)
    if (distance > 0) {
        if (workflow === 'LIGHT' && distance > 100) {
            price += Math.floor(distance / 100) * 5;
        } else if (workflow === 'MODERATE' && distance > 500) {
            price += Math.floor(distance / 500) * 10;
        } else if (workflow === 'FULL' && distance > 1000) {
            price += Math.floor(distance / 1000) * 15;
        }
    }

    // Majoration PMR selon assistance
    if (pmrNeeds && pmrNeeds.assistance_level) {
        const assistanceCost = {
            'none': 0,
            'low': 5,
            'medium': 10,
            'high': 15
        };
        price += assistanceCost[pmrNeeds.assistance_level] || 0;
    }

    // Majoration aide à la mobilité
    if (pmrNeeds && pmrNeeds.mobility_aid) {
        price += 5;
    }

    return Math.round(price);
}

module.exports = {
    deductFromWallet,
    creditToWallet,
    checkSufficientBalance,
    getBalance,
    getTransactionHistory,
    calculateBookingPrice
};
