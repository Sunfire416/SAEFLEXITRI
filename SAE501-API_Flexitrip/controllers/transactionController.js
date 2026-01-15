const SupabaseService = require('../services/SupabaseService');

class TransactionController {
    /**
     * Récupérer les transactions de l'utilisateur
     */
    async getUserTransactions(req, res) {
        try {
            // CORRECTION ICI : utiliser req.user.user_id
            const userId = req.user.user_id;
            const { limit = 50, type } = req.query;

            let query = SupabaseService.client
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(parseInt(limit));

            if (type) {
                query = query.eq('type', type);
            }

            const { data, error } = await query;

            if (error) throw error;

            res.json({
                success: true,
                count: data.length,
                transactions: data
            });

        } catch (error) {
            console.error('❌ TransactionController.getUserTransactions error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des transactions'
            });
        }
    }

    /**
     * Récupérer le solde du wallet
     */
    async getUserWallet(req, res) {
        try {
            // CORRECTION ICI
            const userId = req.user.user_id;

            const { data, error } = await SupabaseService.client
                .from('users')
                .select('solde')
                .eq('user_id', userId)
                .single();

            if (error) throw error;

            res.json({
                success: true,
                wallet: {
                    balance: parseFloat(data.solde),
                    currency: 'EUR',
                    user_id: userId
                }
            });

        } catch (error) {
            console.error('❌ TransactionController.getUserWallet error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération du solde'
            });
        }
    }

    /**
     * Historique du wallet avec détails
     */
    async getWalletHistory(req, res) {
        try {
            // CORRECTION ICI
            const userId = req.user.user_id;
            const { days = 30 } = req.query;

            const since = new Date();
            since.setDate(since.getDate() - parseInt(days));

            const { data: transactions, error } = await SupabaseService.client
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .gte('created_at', since.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Calculer les stats
            const stats = {
                total_debits: 0,
                total_credits: 0,
                transaction_count: transactions.length
            };

            for (const t of transactions) {
                if (['debit', 'Billet_Voyage', 'Duty_Free'].includes(t.type)) {
                    stats.total_debits += parseFloat(t.amount);
                } else {
                    stats.total_credits += parseFloat(t.amount);
                }
            }

            // Récupérer le solde actuel
            const { data: user } = await SupabaseService.client
                .from('users')
                .select('solde')
                .eq('user_id', userId)
                .single();

            res.json({
                success: true,
                current_balance: parseFloat(user?.solde || 0),
                period_days: parseInt(days),
                stats,
                transactions
            });

        } catch (error) {
            console.error('❌ TransactionController.getWalletHistory error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération de l\'historique'
            });
        }
    }

    /**
     * Créditer le wallet (admin ou recharge)
     */
    async creditWallet(req, res) {
        try {
            const { amount, description = 'Rechargement wallet' } = req.body;
            // CORRECTION ICI : utiliser req.user.user_id et req.user.role
            const userId = req.body.user_id || req.user.user_id;
            const userRole = req.user.role;

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Montant invalide'
                });
            }

            // Vérifier les droits si crédit pour un autre utilisateur
            if (userId !== req.user.user_id && userRole !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Non autorisé'
                });
            }

            // Créer la transaction (le trigger met à jour le solde)
            const { data: transaction, error: transactionError } = await SupabaseService.client
                .from('transactions')
                .insert([{
                    user_id: userId,
                    amount: parseFloat(amount),
                    type: 'credit',
                    description: description,
                    payment_status: 'paid',
                    status: 'completed',
                    date_payement: new Date().toISOString()
                }])
                .select()
                .single();

            if (transactionError) throw transactionError;

            // Récupérer le nouveau solde
            const { data: user } = await SupabaseService.client
                .from('users')
                .select('solde')
                .eq('user_id', userId)
                .single();

            res.json({
                success: true,
                message: 'Wallet crédité',
                transaction,
                new_balance: parseFloat(user?.solde || 0)
            });

        } catch (error) {
            console.error('❌ TransactionController.creditWallet error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors du crédit'
            });
        }
    }
}

module.exports = new TransactionController();