const express = require('express');
const router = express.Router();
const SupabaseService = require('../services/SupabaseService');
const { requireRole, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Liste des utilisateurs (admin)
 *     tags: [Users]
 */
router.get('/', requireAdmin, async (req, res) => {
    try {
        const { role, limit = 50, offset = 0 } = req.query;

        let query = SupabaseService.client
            .from('users')
            .select('user_id, name, surname, email, phone, role, solde, needs_assistance, created_at')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

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
        console.error('❌ Erreur liste users:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des utilisateurs'
        });
    }
});

/**
 * @swagger
 * /api/users/:id:
 *   get:
 *     summary: Détails d'un utilisateur
 *     tags: [Users]
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier que l'utilisateur accède à son propre profil ou est admin
        if (req.userId !== id && req.userRole !== 'admin' && req.userRole !== 'Agent') {
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
        console.error('❌ Erreur get user:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération de l\'utilisateur'
        });
    }
});

/**
 * @swagger
 * /api/users/:id:
 *   put:
 *     summary: Mise à jour profil utilisateur
 *     tags: [Users]
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier les droits
        if (req.userId !== id && req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Accès non autorisé'
            });
        }

        const allowedFields = ['name', 'surname', 'phone', 'address', 'pmr_profile', 'needs_assistance', 'besoins_specifiques'];
        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Aucune donnée à mettre à jour'
            });
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
            message: 'Profil mis à jour',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('❌ Erreur update user:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour'
        });
    }
});

/**
 * @swagger
 * /api/users/:id/wallet:
 *   get:
 *     summary: Solde du wallet
 *     tags: [Users]
 */
router.get('/:id/wallet', async (req, res) => {
    try {
        const { id } = req.params;

        if (req.userId !== id && req.userRole !== 'admin') {
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
        console.error('❌ Erreur wallet:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du solde'
        });
    }
});

/**
 * @swagger
 * /api/users/:id/pmr-profile:
 *   put:
 *     summary: Mise à jour profil PMR
 *     tags: [Users]
 */
router.put('/:id/pmr-profile', async (req, res) => {
    try {
        const { id } = req.params;

        if (req.userId !== id && req.userRole !== 'admin') {
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
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Profil PMR mis à jour',
            pmr_profile: data.pmr_profile,
            needs_assistance: data.needs_assistance
        });

    } catch (error) {
        console.error('❌ Erreur update PMR profile:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour du profil PMR'
        });
    }
});

module.exports = router;
