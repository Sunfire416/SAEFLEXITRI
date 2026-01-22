const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const JWT_SECRET = process.env.JWT_SECRET || 'flexitrip-secret-key-2024';

/**
 * Middleware d'authentification JWT custom avec Supabase
 */
const authenticate = async (req, res, next) => {
    try {
        console.log('🔐 [MIDDLEWARE AUTH] Début authentification pour:', req.method, req.path);

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ [MIDDLEWARE AUTH] Header Authorization manquant');
            return res.status(401).json({
                success: false,
                error: 'Token d\'authentification requis'
            });
        }

        const token = authHeader.split(' ')[1];
        console.log('🔐 [MIDDLEWARE AUTH] Token extrait, longueur:', token.length);

        // Vérifier le JWT
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
            console.log('✅ [MIDDLEWARE AUTH] Token JWT valide:', {
                user_id: decoded.user_id,
                email: decoded.email,
                role: decoded.role
            });
        } catch (jwtError) {
            console.log('❌ [MIDDLEWARE AUTH] Token JWT invalide:', jwtError.message);
            return res.status(401).json({
                success: false,
                error: 'Token invalide ou expiré'
            });
        }

        // Créer un client admin pour récupérer l'utilisateur
        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: { persistSession: false },
                global: {
                    headers: {
                        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
                    }
                }
            }
        );

        // Récupérer l'utilisateur avec client admin
        console.log(`🔍 [MIDDLEWARE AUTH] Récupération utilisateur: ${decoded.user_id}`);
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('user_id', decoded.user_id)
            .single();

        if (error || !user) {
            console.log('❌ [MIDDLEWARE AUTH] Utilisateur non trouvé en base:', error?.message);
            return res.status(401).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        console.log(`✅ [MIDDLEWARE AUTH] Authentification réussie pour: ${user.email} (${user.role})`);

        // Attacher les infos utilisateur à la requête
        req.user = user;
        req.userId = user.user_id;
        req.userRole = user.role;
        req.token = token;

        next();
    } catch (error) {
        console.error('❌ [MIDDLEWARE AUTH] Erreur authentification:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur d\'authentification'
        });
    }
};

/**
 * Middleware de vérification de rôle
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.userRole || !allowedRoles.includes(req.userRole)) {
            console.log('❌ [MIDDLEWARE AUTH] Accès refusé. Rôle requis:', allowedRoles, 'Rôle actuel:', req.userRole);
            return res.status(403).json({
                success: false,
                error: 'Accès interdit - Permissions insuffisantes',
                required_roles: allowedRoles,
                current_role: req.userRole
            });
        }
        console.log(`✅ [MIDDLEWARE AUTH] Autorisation rôle OK: ${req.userRole}`);
        next();
    };
};

/**
 * Raccouci pour PMR et Accompagnant
 */
const requirePMR = requireRole(['PMR', 'Accompagnant', 'admin']);

/**
 * Raccourci pour Agents
 */
const requireAgent = requireRole(['Agent', 'admin']);

/**
 * Raccourci pour Admin
 */
const requireAdmin = requireRole(['admin']);

/**
 * Middleware optionnel - Authentification seulement si token présent
 */
const optional = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Pas de token, continuer sans authentification
        req.user = null;
        req.userId = null;
        req.userRole = null;
        console.log('🔐 [MIDDLEWARE AUTH] Optional: pas de token, continuation sans auth');
        return next();
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        // Créer un client admin
        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: { persistSession: false },
                global: {
                    headers: {
                        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
                    }
                }
            }
        );

        // Récupérer l'utilisateur
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('user_id', decoded.user_id)
            .single();

        if (user && !error) {
            req.user = user;
            req.userId = user.user_id;
            req.userRole = user.role;
            console.log(`🔐 [MIDDLEWARE AUTH] Optional: utilisateur authentifié: ${user.email}`);
        } else {
            req.user = null;
            req.userId = null;
            req.userRole = null;
            console.log('🔐 [MIDDLEWARE AUTH] Optional: utilisateur non trouvé');
        }
    } catch (error) {
        // Token invalide, continuer sans authentification
        req.user = null;
        req.userId = null;
        req.userRole = null;
        console.log('🔐 [MIDDLEWARE AUTH] Optional: token invalide, continuation sans auth');
    }

    next();
};

/**
 * Middleware pour vérifier si l'utilisateur est admin ou agent
 */
const requireAdminOrAgent = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Non authentifié' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'Agent') {
        return res.status(403).json({
            error: 'Accès refusé. Rôle admin ou agent requis'
        });
    }

    next();
};

module.exports = {
    authenticate,
    requireRole,
    requirePMR,
    requireAgent,
    requireAdmin,
    requireAdminOrAgent,
    optional
};
