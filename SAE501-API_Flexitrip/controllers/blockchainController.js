const BlockchainService = require('../services/blockchainService');
const SupabaseService = require('../services/SupabaseService');

class BlockchainController {
    /**
     * Vérifier l'intégrité de la blockchain
     */
    async verifyChain(req, res) {
        try {
            const { user_id } = req.query;

            const result = await BlockchainService.verifyChain(user_id);

            res.json({
                success: true,
                ...result,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Erreur verifyChain:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Récupérer l'historique blockchain
     */
    async getHistory(req, res) {
        try {
            const user_id = req.user?.user_id;
            const { target_user_id } = req.query;

            // Vérifier les permissions
            const isAdmin = req.user?.role === 'admin';
            const isAgent = req.user?.role === 'Agent';

            let userIdToQuery = user_id;

            if (target_user_id && (isAdmin || isAgent)) {
                userIdToQuery = target_user_id;
            } else if (target_user_id && !isAdmin && !isAgent) {
                return res.status(403).json({
                    error: 'Non autorisé à voir l\'historique d\'autres utilisateurs'
                });
            }

            const result = await BlockchainService.getUserHistory(userIdToQuery);

            if (!result.success) {
                return res.status(500).json(result);
            }

            res.json({
                success: true,
                user_id: userIdToQuery,
                ...result,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Erreur getHistory:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Vérifier une transaction spécifique
     */
    async verifyTransaction(req, res) {
        try {
            const { transaction_id } = req.params;

            const { data: block, error } = await SupabaseService.client
                .from('blockchain')
                .select('*')
                .eq('transaction_id', transaction_id)
                .single();

            if (error || !block) {
                return res.status(404).json({
                    success: false,
                    error: 'Transaction non trouvée dans la blockchain'
                });
            }

            // Vérifier le hash
            const calculatedHash = BlockchainService.calculateHash(block);
            const hashValid = calculatedHash === block.hash;

            res.json({
                success: true,
                transaction: {
                    id: block.transaction_id,
                    user_id: block.user_id,
                    amount: block.amount,
                    type: block.transaction_type,
                    timestamp: block.timestamp
                },
                verification: {
                    hash_valid: hashValid,
                    calculated_hash: calculatedHash.substring(0, 10) + '...',
                    stored_hash: block.hash.substring(0, 10) + '...',
                    block_id: block.id
                },
                block: {
                    previous_hash: block.previous_hash.substring(0, 10) + '...',
                    position_in_chain: 'À calculer'
                }
            });

        } catch (error) {
            console.error('❌ Erreur verifyTransaction:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Vérifier le statut de transaction
     * (Utilisé après un paiement pour confirmer l'enregistrement)
     */
    async verifyTransactionStatus(req, res) {
        try {
            const { transaction_id } = req.body;

            if (!transaction_id) {
                return res.status(400).json({
                    success: false,
                    error: 'transaction_id requis'
                });
            }

            // Vérifier dans la table transactions
            const { data: transaction, error: transactionError } = await SupabaseService.client
                .from('transactions')
                .select('*')
                .eq('id', transaction_id)
                .single();

            if (transactionError || !transaction) {
                return res.status(404).json({
                    success: false,
                    error: 'Transaction non trouvée'
                });
            }

            // Vérifier dans la blockchain
            const { data: blockchainRecord, error: blockchainError } = await SupabaseService.client
                .from('blockchain')
                .select('*')
                .eq('transaction_id', transaction_id)
                .single();

            const isInBlockchain = !blockchainError && blockchainRecord;
            const isVerified = isInBlockchain &&
                blockchainRecord.hash === BlockchainService.calculateHash(blockchainRecord);

            res.json({
                success: true,
                transaction: {
                    id: transaction.id,
                    amount: transaction.amount,
                    type: transaction.type,
                    status: transaction.status,
                    created_at: transaction.created_at
                },
                blockchain: {
                    present: isInBlockchain,
                    verified: isVerified,
                    block_id: isInBlockchain ? blockchainRecord.id : null,
                    hash: isInBlockchain ? blockchainRecord.hash.substring(0, 10) + '...' : null,
                    created_at: isInBlockchain ? blockchainRecord.created_at : null
                },
                verification: {
                    status: isVerified ? 'VALIDATED' : 'PENDING',
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ Erreur verifyTransactionStatus:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Obtenir un résumé de la blockchain
     */
    async getSummary(req, res) {
        try {
            const user_id = req.user?.user_id;
            const isAdmin = req.user?.role === 'admin';
            const isAgent = req.user?.role === 'Agent';

            let query = SupabaseService.client
                .from('blockchain')
                .select('*', { count: 'exact' });

            if (!isAdmin && !isAgent) {
                query = query.eq('user_id', user_id);
            }

            const { data, count, error } = await query;

            if (error) {
                throw error;
            }

            // Statistiques par type
            const statsByType = data.reduce((acc, block) => {
                const type = block.transaction_type;
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {});

            // Derniers blocs
            const latestBlocks = data
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10)
                .map(block => ({
                    id: block.id.substring(0, 8),
                    transaction_id: block.transaction_id.substring(0, 8),
                    amount: block.amount,
                    type: block.transaction_type,
                    timestamp: block.created_at,
                    hash_preview: block.hash.substring(0, 10) + '...'
                }));

            res.json({
                success: true,
                summary: {
                    total_blocks: count || 0,
                    total_users: [...new Set(data.map(b => b.user_id))].length,
                    stats_by_type: statsByType,
                    latest_blocks: latestBlocks
                },
                integrity_check: await BlockchainService.verifyChain(),
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Erreur getSummary:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new BlockchainController();