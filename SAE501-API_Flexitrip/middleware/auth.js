const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';

// Middleware pour vérifier le token
const authenticateToken = (req, res, next) => {
    // Allow CORS preflight requests (OPTIONS) to pass through
    if (req.method === 'OPTIONS') {
        return next();
    }

    // Récupération du token dans les en-têtes de la requête
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Token manquant" }); // Unauthorized
    }

    // Vérification du token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            // En cas d'erreur, retourne une réponse plus descriptive
            return res.status(403).json({ error: "Token invalide ou expiré" }); // Forbidden
        }
        
        // Ajoute l'utilisateur décodé dans la requête pour une utilisation future
        req.user = decoded;
        next();
    });
};

module.exports = authenticateToken;
