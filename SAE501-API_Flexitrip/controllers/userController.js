const SupabaseService = require('../services/SupabaseService');

/**
 * User Controller - Uses Supabase for user operations
 */
class UserController {

    /**
     * Récupérer un utilisateur par ID
     */
    async getById(req, res) {
        try {
            const { id } = req.params;

            // Vérifier les droits
            if (id !== req.userId && req.userRole !== 'admin' && req.userRole !== 'Agent') {
                return res.status(403).json({
                    success: false,
                    error: 'Accès non autorisé'
                });
            }

            const user = await SupabaseService.getUserById(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Utilisateur non trouvé'
                });
            }

            const { password: _, ...userWithoutPassword } = user;

            res.json({
                success: true,
                user: userWithoutPassword
            });

        } catch (error) {
            console.error('❌ UserController.getById error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération'
            });
        }
    }

    /**
     * Mettre à jour un utilisateur
     */
    async update(req, res) {
        try {
            const { id } = req.params;

            // Vérifier les droits
            if (id !== req.userId && req.userRole !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Accès non autorisé'
                });
            }

            const allowedFields = [
                'name', 'surname', 'phone', 'address',
                'pmr_profile', 'needs_assistance', 'besoins_specifiques'
            ];

            const updates = {};
            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            }

            const { data, error } = await SupabaseService.client
                .from('users')
                .update(updates)
                .eq('user_id', id)
                .select()
                .single();

            if (error) throw error;

            const { password: _, ...userWithoutPassword } = data;

            res.json({
                success: true,
                message: 'Utilisateur mis à jour',
                user: userWithoutPassword
            });

        } catch (error) {
            console.error('❌ UserController.update error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la mise à jour'
            });
        }
    }

    /**
     * Lister les utilisateurs (admin)
     */
    async list(req, res) {
        try {
            if (req.userRole !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Accès réservé aux administrateurs'
                });
            }

            const { role, limit = 50, offset = 0 } = req.query;

            let query = SupabaseService.client
                .from('users')
                .select('user_id, name, surname, email, phone, role, solde, needs_assistance, created_at')
                .order('created_at', { ascending: false })
                .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

            if (role) {
                query = query.eq('role', role);
            }

            const { data, error } = await query;

            if (error) throw error;

            res.json({
                success: true,
                count: data.length,
                users: data
            });

        } catch (error) {
            console.error('❌ UserController.list error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération'
            });
        }
    }

    /**
     * Récupérer le solde wallet
     */
    async getWallet(req, res) {
        try {
            const { id } = req.params;

            if (id !== req.userId && req.userRole !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Accès non autorisé'
                });
            }

            const { data, error } = await SupabaseService.client
                .from('users')
                .select('solde')
                .eq('user_id', id)
                .single();

            if (error) throw error;

            res.json({
                success: true,
                wallet: {
                    balance: parseFloat(data.solde),
                    currency: 'EUR'
                }
            });

        } catch (error) {
            console.error('❌ UserController.getWallet error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération du solde'
            });
        }
    }

    /**
     * Mettre à jour le profil PMR
     */
    async updatePmrProfile(req, res) {
        try {
            const { id } = req.params;

            if (id !== req.userId && req.userRole !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Accès non autorisé'
                });
            }

            const { pmr_profile, needs_assistance } = req.body;
            const updates = {};

            if (pmr_profile) updates.pmr_profile = pmr_profile;
            if (needs_assistance !== undefined) updates.needs_assistance = needs_assistance;

            const { data, error } = await SupabaseService.client
                .from('users')
                .update(updates)
                .eq('user_id', id)
                .select('pmr_profile, needs_assistance')
                .single();

            if (error) throw error;

            res.json({
                success: true,
                message: 'Profil PMR mis à jour',
                pmr_profile: data.pmr_profile,
                needs_assistance: data.needs_assistance
            });

        } catch (error) {
            console.error('❌ UserController.updatePmrProfile error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la mise à jour'
            });
        }
    }
}

module.exports = new UserController();
