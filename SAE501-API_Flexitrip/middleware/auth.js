const jwt = require('jsonwebtoken');
const SupabaseService = require('../services/SupabaseService');

const JWT_SECRET = process.env.JWT_SECRET || 'flexitrip-secret-key-2024';

/**
 * Middleware d'authentification JWT custom avec Supabase
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token d\'authentification requis'
            });
        }

        const token = authHeader.split(' ')[1];

        // Vérifier le JWT
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                error: 'Token invalide ou expiré'
            });
        }

        // Récupérer l'utilisateur depuis Supabase
        const user = await SupabaseService.getUserById(decoded.userId || decoded.user_id);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        // Attacher les infos utilisateur à la requête
        req.user = user;
        req.userId = user.user_id;
        req.userRole = user.role;

        next();
    } catch (error) {
        console.error('❌ Erreur authentification:', error);
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
            return res.status(403).json({
                success: false,
                error: 'Accès interdit - Permissions insuffisantes',
                required_roles: allowedRoles,
                current_role: req.userRole
            });
        }
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

module.exports = {
    authenticate,
    requireRole,
    requirePMR,
    requireAgent,
    requireAdmin
};
