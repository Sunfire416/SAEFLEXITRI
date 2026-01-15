const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'flexitrip-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Initialisation Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables Supabase manquantes');
    process.exit(1);
}

const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
        auth: { persistSession: false },
        global: {
            headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
            }
        }
    }
);

/**
 * @route POST /api/auth/login
 * @desc Connexion utilisateur
 * @access Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Tentative de connexion pour:', email);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email et mot de passe requis'
            });
        }

        // Recherche de l'utilisateur
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !user) {
            console.log('❌ Utilisateur non trouvé:', email);
            return res.status(401).json({
                success: false,
                error: 'Identifiants incorrects'
            });
        }

        console.log('👤 Utilisateur trouvé:', user.user_id, user.role);

        // Vérification du mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('❌ Mot de passe incorrect pour:', email);
            return res.status(401).json({
                success: false,
                error: 'Identifiants incorrects'
            });
        }

        // Génération du token JWT
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

        console.log('✅ Connexion réussie pour:', email);

        // Retourner les informations utilisateur (sans le mot de passe)
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Connexion réussie',
            token,
            user: userWithoutPassword,
            expires_in: JWT_EXPIRES_IN
        });

    } catch (error) {
        console.error('❌ Erreur connexion:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la connexion'
        });
    }
});

/**
 * @route POST /api/auth/register
 * @desc Inscription utilisateur
 * @access Public
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
            pmr_profile = {}
        } = req.body;

        console.log('📝 Tentative d\'inscription pour:', email);

        // Validation des données
        if (!email || !password || !name || !surname) {
            return res.status(400).json({
                success: false,
                error: 'Email, mot de passe, nom et prénom sont requis'
            });
        }

        // Vérifier si l'utilisateur existe déjà
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('user_id')
            .eq('email', email.toLowerCase())
            .single();

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'Un utilisateur avec cet email existe déjà'
            });
        }

        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
        const newUser = {
            user_id: require('uuid').v4(),
            email: email.toLowerCase(),
            password: hashedPassword,
            name,
            surname,
            phone: phone || null,
            role,
            pmr_profile: role === 'PMR' ? pmr_profile : null,
            needs_assistance: role === 'PMR',
            solde: 100.00, // Solde initial
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: createdUser, error: insertError } = await supabaseAdmin
            .from('users')
            .insert([newUser])
            .select()
            .single();

        if (insertError) {
            console.error('❌ Erreur insertion utilisateur:', insertError);
            throw insertError;
        }

        // Générer le token JWT
        const token = jwt.sign(
            {
                user_id: createdUser.user_id,
                email: createdUser.email,
                role: createdUser.role,
                name: createdUser.name,
                surname: createdUser.surname
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        console.log('✅ Inscription réussie pour:', email);

        // Retourner les informations (sans le mot de passe)
        const { password: _, ...userWithoutPassword } = createdUser;

        res.status(201).json({
            success: true,
            message: 'Inscription réussie',
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('❌ Erreur inscription:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'inscription'
        });
    }
});

/**
 * @route POST /api/auth/refresh
 * @desc Rafraîchir le token JWT
 * @access Privé (mais route publique pour l'exemple)
 */
router.post('/refresh', async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                error: 'user_id requis'
            });
        }

        // Récupérer l'utilisateur
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('user_id, email, role, name, surname')
            .eq('user_id', user_id)
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        // Générer un nouveau token
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

        res.json({
            success: true,
            token,
            expires_in: JWT_EXPIRES_IN
        });

    } catch (error) {
        console.error('❌ Erreur refresh token:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du rafraîchissement du token'
        });
    }
});

/**
 * @route GET /api/auth/me
 * @desc Récupérer les informations de l'utilisateur connecté
 * @access Privé
 */
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token d\'authentification requis'
            });
        }

        const token = authHeader.split(' ')[1];

        // Vérifier le token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                error: 'Token invalide ou expiré'
            });
        }

        // Récupérer l'utilisateur
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('user_id', decoded.user_id)
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        // Retourner sans le mot de passe
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('❌ Erreur récupération profil:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du profil'
        });
    }
});

/**
 * @route POST /api/auth/logout
 * @desc Déconnexion (côté client seulement pour JWT)
 * @access Public
 */
router.post('/logout', (req, res) => {
    // Pour JWT stateless, la déconnexion se fait côté client
    // en supprimant le token du localStorage
    res.json({
        success: true,
        message: 'Déconnexion réussie (supprimez le token côté client)'
    });
});

module.exports = router;