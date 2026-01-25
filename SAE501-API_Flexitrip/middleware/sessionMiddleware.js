const session = require('express-session');

// TODO DEMO: Redis supprimé - Sessions en mémoire (MemoryStore)
// Pour production : utiliser connect-pg-simple avec Supabase PostgreSQL
// Exemple : https://www.npmjs.com/package/connect-pg-simple

const sessionMiddleware = session({
    // MemoryStore par défaut (pas de 'store' spécifié)
    // ⚠️ ATTENTION: Les sessions sont perdues au redémarrage du serveur
    // ⚠️ Ne pas utiliser en production avec plusieurs instances
    secret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS en production
        httpOnly: true,
        maxAge: 3600000, // Durée de vie : 1 heure
    },
});

module.exports = sessionMiddleware;
