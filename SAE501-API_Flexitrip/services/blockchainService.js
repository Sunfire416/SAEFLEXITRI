const SupabaseService = require('./SupabaseService');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class BlockchainService {
    /**
     * Ajouter un bloc à la blockchain (pour usage manuel si nécessaire)
     * NOTE: Le trigger SQL fait normalement ce travail automatiquement
     */
    async addBlock(blockData) {
        try {
            // Validation
            if (!blockData.user_id || !blockData.transaction_id || !blockData.amount) {
                throw new Error('Données de bloc incomplètes');
            }

            // Normaliser le type pour respecter la contrainte CHECK
            const normalizedType = this.normalizeTransactionType(blockData.type);

            // Récupérer le dernier hash
            const previousHash = await this.getLastHash();

            // Créer le bloc
            const block = {
                id: uuidv4(),
                user_id: blockData.user_id,
                transaction_id: blockData.transaction_id,
                amount: blockData.amount,
                transaction_type: normalizedType, // Type normalisé
                balance_before: blockData.balance_before || 0,
                balance_after: blockData.balance_after || 0,
                previous_hash: previousHash,
                timestamp: new Date().toISOString(),
                metadata: {
                    ...blockData.metadata,
                    original_type: blockData.type, // Garder l'original dans metadata
                    source: 'manual_api_call',
                    normalized_to: normalizedType
                },
                hash: '', // Calculé plus bas
                nonce: Math.floor(Math.random() * 10000)
            };

            // Calculer le hash
            block.hash = this.calculateHash(block);

            // Insérer dans Supabase
            const { data, error } = await SupabaseService.client
                .from('blockchain')
                .insert([block])
                .select()
                .single();

            if (error) throw error;

            console.log(`✅ Bloc blockchain ajouté manuellement: ${block.hash.substring(0, 10)}...`);

            return {
                success: true,
                block: data,
                message: 'Transaction enregistrée dans la blockchain',
                warning: 'Note: Le trigger SQL fait normalement cela automatiquement'
            };

        } catch (error) {
            console.error('❌ Erreur addBlock:', error);
            return {
                success: false,
                error: error.message,
                suggestion: 'Vérifiez que le trigger SQL fonctionne correctement'
            };
        }
    }

    /**
     * Normaliser le type de transaction pour respecter la contrainte CHECK
     */
    normalizeTransactionType(type) {
        if (!type) return 'debit';

        const typeLower = type.toLowerCase();

        // Types qui doivent être convertis en 'debit'
        if (['debit', 'billet_voyage', 'duty_free', 'paiement', 'achat', 'payment'].includes(typeLower)) {
            return 'debit';
        }

        // Types qui doivent être convertis en 'credit'
        if (['credit', 'recharge', 'depot', 'deposit', 'refund', 'remboursement'].includes(typeLower)) {
            return 'credit';
        }

        // Par défaut, utiliser 'debit'
        return 'debit';
    }

    /**
     * Calculer le hash SHA-256 d'un bloc
     */
    calculateHash(block) {
        const blockString = JSON.stringify({
            id: block.id,
            user_id: block.user_id,
            transaction_id: block.transaction_id,
            amount: block.amount,
            transaction_type: block.transaction_type,
            previous_hash: block.previous_hash,
            timestamp: block.timestamp,
            nonce: block.nonce
        });

        return crypto
            .createHash('sha256')
            .update(blockString)
            .digest('hex');
    }

    /**
     * Récupérer le dernier hash de la blockchain
     */
    async getLastHash() {
        try {
            const { data, error } = await SupabaseService.client
                .from('blockchain')
                .select('hash')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) {
                return '0000000000000000000000000000000000000000000000000000000000000000';
            }

            return data.hash;

        } catch (error) {
            console.warn('⚠️ Erreur getLastHash:', error.message);
            return '0000000000000000000000000000000000000000000000000000000000000000';
        }
    }

    /**
     * Vérifier l'intégrité de la blockchain
     */
    async verifyChain(user_id = null) {
        try {
            let query = SupabaseService.client
                .from('blockchain')
                .select('*')
                .order('created_at', { ascending: true });

            if (user_id) {
                query = query.eq('user_id', user_id);
            }

            const { data: blocks, error } = await query;

            if (error) throw error;

            if (blocks.length === 0) {
                return {
                    valid: true,
                    message: 'Blockchain vide',
                    block_count: 0
                };
            }

            // Vérifier chaque bloc
            const invalidBlocks = [];

            for (let i = 0; i < blocks.length; i++) {
                const currentBlock = blocks[i];

                // Vérifier le hash du bloc actuel
                const calculatedHash = this.calculateHash(currentBlock);
                if (calculatedHash !== currentBlock.hash) {
                    invalidBlocks.push({
                        position: i,
                        block_id: currentBlock.id,
                        reason: 'hash_mismatch',
                        stored_hash: currentBlock.hash.substring(0, 10) + '...',
                        calculated_hash: calculatedHash.substring(0, 10) + '...'
                    });
                }

                // Vérifier le lien avec le bloc précédent (sauf pour le premier)
                if (i > 0) {
                    const previousBlock = blocks[i - 1];
                    if (currentBlock.previous_hash !== previousBlock.hash) {
                        invalidBlocks.push({
                            position: i,
                            block_id: currentBlock.id,
                            reason: 'chain_link_broken',
                            expected_previous_hash: previousBlock.hash.substring(0, 10) + '...',
                            actual_previous_hash: currentBlock.previous_hash.substring(0, 10) + '...'
                        });
                    }
                }

                // Vérifier le premier bloc (genesis)
                if (i === 0 && currentBlock.previous_hash !== '0000000000000000000000000000000000000000000000000000000000000000') {
                    invalidBlocks.push({
                        position: i,
                        block_id: currentBlock.id,
                        reason: 'invalid_genesis_previous_hash',
                        expected: '0000...0000',
                        actual: currentBlock.previous_hash.substring(0, 10) + '...'
                    });
                }
            }

            return {
                valid: invalidBlocks.length === 0,
                message: invalidBlocks.length === 0
                    ? `Blockchain valide (${blocks.length} blocs)`
                    : `Blockchain invalide - ${invalidBlocks.length} erreur(s) trouvée(s)`,
                block_count: blocks.length,
                invalid_blocks: invalidBlocks,
                first_block: blocks.length > 0 ? {
                    id: blocks[0].id,
                    hash: blocks[0].hash.substring(0, 10) + '...',
                    timestamp: blocks[0].created_at
                } : null,
                last_block: blocks.length > 0 ? {
                    id: blocks[blocks.length - 1].id,
                    hash: blocks[blocks.length - 1].hash.substring(0, 10) + '...',
                    timestamp: blocks[blocks.length - 1].created_at
                } : null
            };

        } catch (error) {
            console.error('❌ Erreur verifyChain:', error);
            return {
                valid: false,
                error: error.message,
                suggestion: 'Vérifiez la connexion à la base de données'
            };
        }
    }

    /**
     * Récupérer l'historique blockchain d'un utilisateur
     */
    async getUserHistory(user_id) {
        try {
            const { data, error } = await SupabaseService.client
                .from('blockchain')
                .select('*')
                .eq('user_id', user_id)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            // Formater les données pour l'affichage
            const formattedData = data.map(block => ({
                block_id: block.id.substring(0, 8),
                transaction_id: block.transaction_id,
                amount: block.amount,
                type: block.transaction_type,
                original_type: block.metadata?.original_type || block.transaction_type,
                balance_before: block.balance_before,
                balance_after: block.balance_after,
                timestamp: block.created_at,
                hash_preview: block.hash.substring(0, 10) + '...',
                metadata: block.metadata
            }));

            // Calculer les statistiques
            const stats = {
                total_transactions: data.length,
                total_debit: data.filter(b => b.transaction_type === 'debit')
                    .reduce((sum, b) => sum + b.amount, 0),
                total_credit: data.filter(b => b.transaction_type === 'credit')
                    .reduce((sum, b) => sum + b.amount, 0),
                first_transaction: data.length > 0 ? data[data.length - 1].created_at : null,
                last_transaction: data.length > 0 ? data[0].created_at : null
            };

            return {
                success: true,
                count: data.length,
                transactions: formattedData,
                statistics: stats,
                user_id: user_id
            };

        } catch (error) {
            console.error('❌ Erreur getUserHistory:', error);
            return {
                success: false,
                error: error.message,
                user_id: user_id
            };
        }
    }

    /**
     * Rechercher une transaction dans la blockchain
     */
    async findTransaction(transaction_id) {
        try {
            const { data, error } = await SupabaseService.client
                .from('blockchain')
                .select('*')
                .eq('transaction_id', transaction_id)
                .single();

            if (error || !data) {
                return {
                    found: false,
                    transaction_id: transaction_id
                };
            }

            // Vérifier l'intégrité de ce bloc spécifique
            const calculatedHash = this.calculateHash(data);
            const isVerified = calculatedHash === data.hash;

            return {
                found: true,
                is_verified: isVerified,
                block: {
                    id: data.id,
                    user_id: data.user_id,
                    amount: data.amount,
                    type: data.transaction_type,
                    original_type: data.metadata?.original_type,
                    timestamp: data.created_at,
                    hash: data.hash,
                    previous_hash: data.previous_hash,
                    metadata: data.metadata
                },
                verification: {
                    hash_valid: isVerified,
                    calculated_hash: calculatedHash,
                    position_in_chain: 'N/A' // Pourrait être calculé avec une requête supplémentaire
                }
            };

        } catch (error) {
            console.error('❌ Erreur findTransaction:', error);
            return {
                found: false,
                error: error.message,
                transaction_id: transaction_id
            };
        }
    }
}

module.exports = new BlockchainService();