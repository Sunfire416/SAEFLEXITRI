// ======================================================================
// WALLET SERVICE - ÉTAPE 10 (MIGRATED SUPABASE)
// ======================================================================
// Auto-déduction du wallet via Supabase
// Gestion du solde utilisateur et historique des transactions
// ======================================================================

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
        const user = await SupabaseService.getUserById(user_id);
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

        // 2) Insérer transaction via SupabaseService (le trigger Supabase maj le solde)
        const transaction = await SupabaseService.createTransaction({
            user_id: user_id,
            amount: amount,
            type: 'debit',
            payment_status: 'paid',
            description: description,
            date_payement: new Date().toISOString()
            // Optionnel: si la table transactions a voyage_id
            // voyage_id: voyage_id 
        });

        // 3) Récupérer le solde à jour pour le retour
        const updatedUser = await SupabaseService.getUserById(user_id);
        const newBalance = updatedUser ? updatedUser.solde : balanceCheck.currentBalance;

        // 4) Envoyer notification
        try {
            await notificationService.createNotification({
                user_id: user_id,
                type: 'PAYMENT_SUCCESS',
                title: 'Paiement effectué',
                message: `${amount} points déduits pour le booking ${booking_reference || ''}`,
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
        }

        console.log(`[walletService] ✅ Déduction réussie : ${amount} points (user ${user_id}) - Solde: ${newBalance}`);

        return {
            success: true,
            transaction_id: transaction.id || transaction.transaction_id,
            amount_deducted: amount,
            balance_before: balanceCheck.currentBalance,
            balance_after: newBalance,
            booking_reference: booking_reference
        };

    } catch (error) {
        console.error('[walletService] Erreur déduction wallet:', error);
        return {
            success: false,
            error: 'DEDUCTION_FAILED',
            details: error.message
        };
    }
}

/**
 * ÉTAPE 10 : Crédite le wallet de l'utilisateur (remboursement)
 */
async function creditToWallet(params) {
    const {
        user_id,
        amount,
        booking_reference = null,
        reason = 'Remboursement FlexiTrip'
    } = params;

    try {
        const user = await SupabaseService.getUserById(user_id);
        if (!user) {
            return { success: false, error: 'USER_NOT_FOUND' };
        }
        const oldBalance = user.solde;

        // 2) Créer transaction Supabase (historique + trigger)
        const transaction = await SupabaseService.createTransaction({
            user_id: user_id,
            amount: amount,
            type: 'credit',
            payment_status: 'paid',
            description: reason,
            date_payement: new Date().toISOString()
        });

        // 3) Récupérer le solde à jour
        const updatedUser = await SupabaseService.getUserById(user_id);
        const newBalance = updatedUser ? updatedUser.solde : oldBalance;

        // 4) Envoyer notification
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

        return {
            success: true,
            transaction_id: transaction.id || transaction.transaction_id,
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
 */
async function getBalance(user_id) {
    try {
        const user = await SupabaseService.getUserById(user_id);
        return user ? user.solde : 0;
    } catch (error) {
        console.error('[walletService] Erreur récupération solde:', error);
        return 0;
    }
}

/**
 * ÉTAPE 10 : Récupère l'historique des transactions d'un utilisateur
 */
async function getTransactionHistory(user_id, limit = 50) {
    return SupabaseService.getUserTransactions(user_id); // Déjà implémenté dans SupabaseService
}

/**
 * ÉTAPE 10 : Calcule le prix du booking selon le workflow
 */
function calculateBookingPrice(workflow, options = {}) {
    const { distance = 0, pmrNeeds = {} } = options;

    const basePrices = {
        MINIMAL: 10,
        LIGHT: 25,
        MODERATE: 80,
        FULL: 150
    };

    let price = basePrices[workflow] || 50;

    if (distance > 0) {
        if (workflow === 'LIGHT' && distance > 100) {
            price += Math.floor(distance / 100) * 5;
        } else if (workflow === 'MODERATE' && distance > 500) {
            price += Math.floor(distance / 500) * 10;
        } else if (workflow === 'FULL' && distance > 1000) {
            price += Math.floor(distance / 1000) * 15;
        }
    }

    if (pmrNeeds && pmrNeeds.assistance_level) {
        const assistanceCost = {
            'none': 0,
            'low': 5,
            'medium': 10,
            'high': 15
        };
        price += assistanceCost[pmrNeeds.assistance_level] || 0;
    }

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
