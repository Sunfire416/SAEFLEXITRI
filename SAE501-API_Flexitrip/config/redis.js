const Redis = require('ioredis');

// Configuration de Redis
const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'redis', // nom du service Docker
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined, // facultatif
});

redisClient.on('connect', () => {
    console.log('Connecté à Redis avec succès !');
});

redisClient.on('error', (err) => {
    console.error('Erreur Redis :', err);
});

module.exports = redisClient;
