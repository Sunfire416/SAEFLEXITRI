const session = require('express-session');
const RedisStore = require('connect-redis').default; // Utilisez `.default` pour importer le store correctement
const redisClient = require('../config/redis'); // Votre configuration Redis

const sessionMiddleware = session({
    store: new RedisStore({ client: redisClient }), // Nouvelle API pour passer le client Redis
    secret: process.env.SESSION_SECRET || 'dev-session-secret', // Fallback to avoid crash when env not set
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS en production
        httpOnly: true,
        maxAge: 3600000, // Durée de vie : 1 heure
    },
});

module.exports = sessionMiddleware;
