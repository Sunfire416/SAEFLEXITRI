const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const SupabaseService = require('../services/SupabaseService');

const JWT_SECRET = process.env.JWT_SECRET || 'flexitrip-secret-key-2024';
const JWT_EXPIRES_IN = '24h';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Auth]
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email et mot de passe requis'
            });
        }

        // Rechercher l'utilisateur
        const { data: user, error } = await SupabaseService.client
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: 'Identifiants invalides'
            });
        }

        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Identifiants invalides'
            });
        }

        // Générer le JWT
        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Retourner les infos (sans le mot de passe)
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            token,
            user: userWithoutPassword,
            expires_in: JWT_EXPIRES_IN
        });

    } catch (error) {
        console.error('❌ Erreur login:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la connexion'
        });
    }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription utilisateur
 *     tags: [Auth]
 */
router.post('/register', async (req, res) => {
    try {
        const {
            email,
            password,
            name,
            surname,
            phone,
            role = 'PMR',
            pmr_profile = {},
            needs_assistance = false
        } = req.body;

        // Validation
        if (!email || !password || !name || !surname || !phone) {
            return res.status(400).json({
                success: false,
                error: 'Tous les champs obligatoires doivent être remplis'
            });
        }

        // Vérifier si l'email existe déjà
        const { data: existingUser } = await SupabaseService.client
            .from('users')
            .select('user_id')
            .eq('email', email.toLowerCase())
            .single();

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'Cet email est déjà utilisé'
            });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
        const newUser = {
            user_id: uuidv4(),
            email: email.toLowerCase(),
            password: hashedPassword,
            name,
            surname,
            phone,
            role,
            pmr_profile,
            needs_assistance,
            solde: 700.00 // Solde initial
        };

        const { data: createdUser, error } = await SupabaseService.client
            .from('users')
            .insert([newUser])
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Générer le token
        const token = jwt.sign(
            {
                user_id: createdUser.user_id,
                email: createdUser.email,
                role: createdUser.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const { password: _, ...userWithoutPassword } = createdUser;

        res.status(201).json({
            success: true,
            message: 'Compte créé avec succès',
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('❌ Erreur register:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'inscription'
        });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Profil utilisateur actuel
 *     tags: [Auth]
 */
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token requis'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await SupabaseService.getUserById(decoded.user_id);

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
        console.error('❌ Erreur me:', error);
        res.status(401).json({
            success: false,
            error: 'Token invalide'
        });
    }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Déconnexion
 *     tags: [Auth]
 */
router.post('/logout', (req, res) => {
    // Avec JWT stateless, on ne peut pas vraiment invalider le token côté serveur
    // Le client doit supprimer le token de son côté
    res.json({
        success: true,
        message: 'Déconnexion réussie'
    });
});

module.exports = router;
