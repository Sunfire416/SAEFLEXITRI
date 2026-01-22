const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const SupabaseService = require('../services/SupabaseService');

const JWT_SECRET = process.env.JWT_SECRET || 'flexitrip-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class UserController {
    async loginUser(req, res) {
        try {
            const email = (req.body.email || req.query.email || '').toLowerCase().trim();
            const password = req.body.password || req.query.password;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email et mot de passe requis'
                });
            }

            const user = await SupabaseService.getUserByEmail(email);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Identifiants incorrects'
                });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password || '');
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Identifiants incorrects'
                });
            }

            const token = jwt.sign(
                {
                    user_id: user.user_id,
                    email: user.email,
                    role: user.role,
                    name: user.name,
                    surname: user.surname
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            const { password: _, ...userWithoutPassword } = user;

            res.json({
                success: true,
                message: 'Connexion réussie',
                token,
                user: userWithoutPassword,
                expires_in: JWT_EXPIRES_IN
            });
        } catch (error) {
            console.error('❌ UserController.loginUser error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la connexion'
            });
        }
    }

    async logoutUser(req, res) {
        res.json({
            success: true,
            message: 'Déconnexion réussie'
        });
    }

    async getMe(req, res) {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Non authentifié'
            });
        }

        const { password: _, ...userWithoutPassword } = req.user;

        res.json({
            success: true,
            user: userWithoutPassword
        });
    }

    async getMyAgentQr(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Non authentifié'
                });
            }

            if (req.user.role !== 'Agent' && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Accès réservé aux agents'
                });
            }

            const existingQr = req.user.agent_qr_public_id;
            if (existingQr) {
                return res.json({
                    success: true,
                    agent_qr_public_id: existingQr
                });
            }

            const newQr = uuidv4();

            const { data, error } = await SupabaseService.client
                .from('users')
                .update({ agent_qr_public_id: newQr })
                .eq('user_id', req.user.user_id)
                .select('agent_qr_public_id')
                .single();

            if (error) throw error;

            res.json({
                success: true,
                agent_qr_public_id: data.agent_qr_public_id
            });
        } catch (error) {
            console.error('❌ UserController.getMyAgentQr error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération du QR agent'
            });
        }
    }

    async getMyAgentAssignments(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Non authentifié'
                });
            }

            if (req.user.role !== 'Agent' && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Accès réservé aux agents'
                });
            }

            const { data, error } = await SupabaseService.client
                .from('pmr_missions')
                .select('*, reservation:reservations(*)')
                .eq('agent_id', req.user.user_id)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            res.json({
                success: true,
                count: data.length,
                assignments: data
            });
        } catch (error) {
            console.error('❌ UserController.getMyAgentAssignments error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des prises en charge'
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;

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

    async update(req, res) {
        try {
            const { id } = req.params;

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
                .range(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10) - 1);

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
