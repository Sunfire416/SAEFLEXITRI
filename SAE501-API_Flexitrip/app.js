const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Services
const Neo4jService = require('./services/neo4jService');
const SupabaseService = require('./services/SupabaseService');

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swaggerConfig');

// Middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// ==========================================
// ROUTES SUPABASE (architecture principale)
// ==========================================

// Routes d'authentification et utilisateurs
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

// Routes métier
const voyageRoutes = require('./routes/voyages');
const voyageHistoryRoutes = require('./routes/voyageHistoryRoutes');
const boardingRoutes = require('./routes/boardingRoutes');
const reservationRoutes = require('./routes/reservations');
const transactionRoutes = require('./routes/transactions');
const stationRoutes = require('./routes/stations');
const blockchainRoutes = require('./routes/blockchain');

// Routes spécifiques PMR
const assistanceRoutes = require('./routes/assistance');
const bookingRoutes = require('./routes/booking');
const notificationRoutes = require('./routes/notificationRoutesV2');

// ==========================================
// INITIALISATION EXPRESS
// ==========================================

const app = express();

// ✅ Sécurité
app.use(helmet());

// ✅ CORS (fix login React localhost:3000 -> API localhost:17777)
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(
        ...process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
    );
}

app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

// ✅ Gérer le preflight (OPTIONS) partout
app.options('*', cors());

// ✅ Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// ==========================================
// ENDPOINTS DE SANTÉ ET DIAGNOSTIC
// ==========================================

app.get('/api/health', async (req, res) => {
    try {
        const { error: supabaseError } = await SupabaseService.client
            .from('users')
            .select('count', { count: 'exact' })
            .limit(1);

        const neo4jHealth = await Neo4jService.testConnection();

        const services = {
            supabase: supabaseError ? 'ERROR' : 'OK',
            neo4j: neo4jHealth ? 'OK' : 'ERROR',
            api: 'RUNNING'
        };

        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            architecture: 'Supabase PostgreSQL + Neo4j',
            services
        });

    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Documentation Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==========================================
// ROUTES PUBLIQUES (pas d'authentification requise)
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);

// ==========================================
// ROUTES PROTÉGÉES (authentification requise)
// ==========================================

app.use(authMiddleware.authenticate);

app.use('/api/users', userRoutes);
app.use('/api/voyages', voyageRoutes);
app.use('/api/voyages', voyageHistoryRoutes);
app.use('/api/boarding', boardingRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/assistance', assistanceRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/blockchain', blockchainRoutes); // ✅ CORRECT

// ==========================================
// ENDPOINTS SPÉCIAUX POUR INTÉGRATION
// ==========================================

app.post('/api/routes/find-accessible', authMiddleware.authenticate, async (req, res) => {
    try {
        const {
            start_lat, start_lon, end_lat, end_lon,
            max_distance_km = 2,
            require_accessibility = true
        } = req.body;

        if (!start_lat || !start_lon || !end_lat || !end_lon) {
            return res.status(400).json({
                error: 'Coordonnées de départ et d\'arrivée requises'
            });
        }

        const startStations = await Neo4jService.findAccessibleStations(
            parseFloat(start_lat),
            parseFloat(start_lon),
            max_distance_km * 1000
        );

        const endStations = await Neo4jService.findAccessibleStations(
            parseFloat(end_lat),
            parseFloat(end_lon),
            max_distance_km * 1000
        );

        if (startStations.length === 0 || endStations.length === 0) {
            return res.status(404).json({
                error: 'Aucune station accessible trouvée près des points de départ/arrivée',
                suggestions: {
                    start_has_accessible: startStations.length > 0,
                    end_has_accessible: endStations.length > 0,
                    try_increase_radius: true
                }
            });
        }

        const routes = [];
        const MAX_COMBINATIONS = 3;

        for (let i = 0; i < Math.min(startStations.length, MAX_COMBINATIONS); i++) {
            for (let j = 0; j < Math.min(endStations.length, MAX_COMBINATIONS); j++) {
                const route = await Neo4jService.findOptimalRoute(
                    startStations[i].id,
                    endStations[j].id,
                    { requireAccessibility: require_accessibility }
                );

                if (route) {
                    routes.push({
                        start_station: startStations[i],
                        end_station: endStations[j],
                        route,
                        total_score: calculateRouteScore(route, startStations[i], endStations[j])
                    });
                }
            }
        }

        routes.sort((a, b) => b.total_score - a.total_score);

        res.json({
            success: true,
            count: routes.length,
            routes: routes.slice(0, 3),
            metadata: {
                start_location: { lat: start_lat, lon: start_lon },
                end_location: { lat: end_lat, lon: end_lon },
                accessibility_required: require_accessibility,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Erreur recherche itinéraire:', error);
        res.status(500).json({
            error: 'Erreur lors de la recherche d\'itinéraire',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

function calculateRouteScore(route, startStation, endStation) {
    let score = 0;

    if (route.total_duration) {
        score += Math.max(0, 100 - route.total_duration);
    }

    if (route.stations) {
        const accessibleCount = route.stations.filter(s => s.accessible).length;
        const totalCount = route.stations.length;
        score += (accessibleCount / totalCount) * 50;
    }

    if (startStation.distance && endStation.distance) {
        const walkDistance = startStation.distance + endStation.distance;
        score += Math.max(0, 50 - (walkDistance / 100));
    }

    return score;
}

// ==========================================
// ENDPOINTS DE TEST (dev uniquement)
// ==========================================

if (process.env.NODE_ENV === 'development') {
    // ✅ Route pour tester les transactions (utilise le système transaction existant)
    app.post('/api/test/wallet-debit', authMiddleware.authenticate, async (req, res) => {
        try {
            const { user_id, amount } = req.body;

            const result = await SupabaseService.updateUserWallet(
                user_id || req.user.user_id,
                amount || 10,
                'debit'
            );

            res.json({
                success: true,
                message: 'Test de débit effectué',
                result
            });

        } catch (error) {
            console.error('❌ Test wallet error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/dev/init-test-data', async (req, res) => {
        try {
            const { data: existingUsers } = await SupabaseService.client
                .from('users')
                .select('user_id')
                .limit(1);

            if (existingUsers && existingUsers.length > 0) {
                return res.status(400).json({
                    message: 'La base contient déjà des données',
                    existing_users: existingUsers.length
                });
            }

            const testUsers = [
                {
                    user_id: require('uuid').v4(),
                    name: 'Jean',
                    surname: 'Dupont',
                    email: 'pmr@flexitrip.fr',
                    phone: '+33612345678',
                    role: 'PMR',
                    password: '$2b$10$h9JqoBZz3T6w7Y8u9i0vR.LkMnOpQrStUvWxYzAbCdEfGhIjKlMnO',
                    pmr_profile: {
                        mobility_aid: 'wheelchair',
                        wheelchair_type: 'electric',
                        visual_impairment: false,
                        hearing_impairment: true,
                        preferred_seat: 'aisle',
                        assistance_level: 'full'
                    },
                    needs_assistance: true,
                    solde: 700.00
                },
                {
                    user_id: require('uuid').v4(),
                    name: 'Marie',
                    surname: 'Martin',
                    email: 'accompagnant@flexitrip.fr',
                    phone: '+33687654321',
                    role: 'Accompagnant',
                    password: '$2b$10$pQrStUvWxYzAbCdEfGhIjK.LkMnOpQrStUvWxYzAbCdEfGhIjKlMnO',
                    solde: 500.00
                },
                {
                    user_id: require('uuid').v4(),
                    name: 'Agent',
                    surname: 'Gare Lyon',
                    email: 'agent@flexitrip.fr',
                    phone: '+33123456789',
                    role: 'Agent',
                    password: '$2b$10$AbCdEfGhIjKlMnOpQrStUv.WxYzAbCdEfGhIjKlMnOpQrStUvWxYz',
                    solde: 1000.00
                }
            ];

            const { error: usersError } = await SupabaseService.client
                .from('users')
                .insert(testUsers);

            if (usersError) throw usersError;

            res.json({
                success: true,
                message: 'Données de test créées avec succès',
                users_created: testUsers.length,
                test_credentials: {
                    pmr: { email: 'pmr@flexitrip.fr', password: 'pmr' },
                    accompagnant: { email: 'accompagnant@flexitrip.fr', password: 'accompagnant' },
                    agent: { email: 'agent@flexitrip.fr', password: 'agent' }
                }
            });

        } catch (error) {
            console.error('Erreur initialisation données test:', error);
            res.status(500).json({
                error: 'Erreur lors de l\'initialisation',
                details: error.message
            });
        }
    });
}

// ==========================================
// GESTION DES ERREURS ET 404
// ==========================================

app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Route API non trouvée',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

app.use(errorHandler);

// ==========================================
// DÉMARRAGE DU SERVEUR
// ==========================================

const PORT = process.env.PORT || 17777;

const startServer = async () => {
    try {
        console.log('🔄 Vérification des connexions...');

        await SupabaseService.client
            .from('users')
            .select('count', { count: 'exact' })
            .limit(1);
        console.log('✅ Supabase connecté');

        await Neo4jService.init();
        console.log('✅ Neo4j connecté');

        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(50));
            console.log('🚀 FlexiTrip API démarrée avec succès');
            console.log('='.repeat(50));
            console.log(`📍 Port: ${PORT}`);
            console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🗄️  Base de données: Supabase PostgreSQL`);
            console.log(`🗺️  Géographie: Neo4j`);
            console.log(`🔐 Authentification: JWT custom`);
            console.log('='.repeat(50));
            console.log('\n📋 Endpoints disponibles:');
            console.log(`  • GET    http://localhost:${PORT}/api/health`);
            console.log(`  • POST   http://localhost:${PORT}/api/auth/login`);
            console.log(`  • GET    http://localhost:${PORT}/api/stations/search?query=nation`);
            console.log(`  • POST   http://localhost:${PORT}/api/routes/find-accessible`);
            console.log(`  • GET    http://localhost:${PORT}/api/docs (Documentation)`);
            console.log(`  • GET    http://localhost:${PORT}/api/blockchain/history (Blockchain)`);
            console.log(`  • GET    http://localhost:${PORT}/api/blockchain/balance (Solde)`);
            console.log(`  • POST   http://localhost:${PORT}/api/transactions/pay (Paiement)`);
            console.log('\n✅ Prêt à recevoir des requêtes');
        });

    } catch (error) {
        console.error('❌ Erreur démarrage serveur:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', async () => {
    console.log('🛑 Signal SIGTERM reçu, arrêt gracieux...');
    await Neo4jService.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 Signal SIGINT reçu, arrêt gracieux...');
    await Neo4jService.close();
    process.exit(0);
});

startServer();

module.exports = app;