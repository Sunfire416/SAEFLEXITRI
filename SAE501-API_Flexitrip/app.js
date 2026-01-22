const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
require('dotenv').config();

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
const blockchainRoutes = require('./routes/blockchain');
const bookingRoutes = require('./routes/booking');
const checkinRoutes = require('./routes/checkinRoutes');
const notificationRoutes = require('./routes/notificationRoutesV2');
const assistanceRoutes = require('./routes/assistance');
const priseEnChargeRoutes = require('./routes/priseEnChargeRoutes');
const intelligentAssignmentRoutes = require('./routes/intelligentAssignmentRoutes');
// const incidentRoutes = require('./routes/incidentRoutes'); // TEMPORAIREMENT DÉSACTIVÉ
// const reviewRoutes = require('./routes/reviewRoutes'); // TEMPORAIREMENT DÉSACTIVÉ

// ==========================================
// INITIALISATION EXPRESS
// ==========================================

const app = express();

// ✅ Sécurité
app.use(helmet());

// ✅ CORS (fix login React localhost:3000 -> API localhost:17777)
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
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
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                api: 'running',
                supabase: 'unknown'
            }
        };

        try {
            await SupabaseService.client.from('users').select('count', { count: 'exact' }).limit(1);
            health.services.supabase = 'connected';
        } catch (e) {
            health.services.supabase = 'error: ' + e.message;
        }

        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// ==========================================
// SWAGGER DOCUMENTATION
// ==========================================
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==========================================
// ROUTES PUBLIQUES (sans authentification)
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/prise-en-charge', priseEnChargeRoutes);

// Route d'inscription publique (sans authentification)
const bcrypt = require('bcrypt');
app.post('/api/users/insert', async (req, res) => {
    try {
        const { name, surname, email, password, phone, role = 'Passager', needs_assistance = false } = req.body;

        if (!name || !surname || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Champs requis: name, surname, email, password'
            });
        }

        // Vérifier si l'email existe déjà
        const { data: existing } = await SupabaseService.client
            .from('users')
            .select('user_id')
            .eq('email', email.toLowerCase())
            .single();

        if (existing) {
            return res.status(409).json({
                success: false,
                error: 'Un compte avec cet email existe déjà'
            });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
        const { data: newUser, error } = await SupabaseService.client
            .from('users')
            .insert([{
                name,
                surname,
                email: email.toLowerCase(),
                password: hashedPassword,
                phone: phone || null,
                role: role,
                needs_assistance: needs_assistance,
                solde: 0,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        const { password: _, ...userWithoutPassword } = newUser;

        console.log('✅ Nouvel utilisateur créé:', userWithoutPassword.email);

        res.status(201).json({
            success: true,
            message: 'Compte créé avec succès',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('❌ Erreur création compte:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la création du compte'
        });
    }
});

// ==========================================
// ROUTES PROTÉGÉES (authentification requise)
// ==========================================

app.use(authMiddleware.authenticate);

app.use('/api/users', userRoutes);
app.use('/api/voyages', voyageRoutes);
app.use('/api/voyages', voyageHistoryRoutes);
app.use('/api/boarding', boardingRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/assistance', assistanceRoutes);
app.use('/api/prise-en-charge', priseEnChargeRoutes);
app.use('/api/intelligent-assignment', intelligentAssignmentRoutes);
// app.use('/api/incidents', incidentRoutes); // TEMPORAIREMENT DÉSACTIVÉ
// app.use('/api/review', reviewRoutes); // TEMPORAIREMENT DÉSACTIVÉ

// ==========================================
// ENDPOINTS DE TEST (dev uniquement)
// ==========================================

if (process.env.NODE_ENV === 'development') {
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

        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(50));
            console.log('🚀 FlexiTrip API démarrée avec succès');
            console.log('='.repeat(50));
            console.log(`📍 Port: ${PORT}`);
            console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🗄️  Base de données: Supabase PostgreSQL`);
            console.log(`🔐 Authentification: JWT custom`);
            console.log('='.repeat(50));
            console.log('\n📋 Endpoints disponibles:');
            console.log(`  • GET    http://localhost:${PORT}/api/health`);
            console.log(`  • POST   http://localhost:${PORT}/api/auth/login`);
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

process.on('SIGTERM', () => {
    console.log('🛑 Signal SIGTERM reçu, arrêt gracieux...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Signal SIGINT reçu, arrêt gracieux...');
    process.exit(0);
});

startServer();

module.exports = app;