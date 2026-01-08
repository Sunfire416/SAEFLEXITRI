const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Sequelize
const {sequelize} = require('./config/database');

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swaggerConfig');

//Auth
const AuthRoutes = require('./routes/AuthRoutes');

// MySQL
const reservationsRoutes = require('./routes/reservationsRoutes');
const FacturationRoutes = require('./routes/FacturationRoutes');
const userRoutes = require('./routes/userRoutes');
const agentRoutes = require('./routes/AgentRoutes3');
const contactRoutes = require('./routes/ContactRoutes');

// AF
const AirportsRoutes = require('./routes/AF/AirportsRoutes');
const volRoutes = require('./routes/AF/volRoutes');

// SNCF
const GareRoutes = require('./routes/SNCF/GareRoutes');
const TrajetSNCFRoutes = require('./routes/SNCF/TrajetRoutes');

// UBER 
const TrajetTaxiUBERRoutes = require('./routes/UBER/TrajetTaxiRoutes');

// MongoDB
const voyageRoutesOLD = require('./routes/voyageRoutes'); // Point 2 ancien
const biometricRoutes = require('./routes/biometricRoutes');
const notificationRoutesOLD = require('./routes/notificationRoutes'); // Ancien MySQL
const blockchainRoutes = require('./routes/blockchainRoutes');

// ==========================================
// 🆕 POINT 2 - NOUVEAUX IMPORTS
// ==========================================
const searchRoutes = require('./routes/searchRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

// ==========================================
// 🆕 POINT 3 - NOUVEAUX IMPORTS
// ==========================================
const checkinRoutes = require('./routes/checkinRoutes');
const boardingRoutes = require('./routes/boardingRoutes');

// ==========================================
// 🆕 POINT 4 & 5 - NOUVELLES ROUTES
// ==========================================
const notificationRoutesV2 = require('./routes/notificationRoutesV2'); // MongoDB Point 4
const voyageHistoryRoutes = require('./routes/voyageHistoryRoutes'); // Point 5

// ==========================================
// 🆕 POINT 6 & 7 - NOUVELLES ROUTES PMR MULTIMODAL
// ==========================================
const searchRoutesV2 = require('./routes/searchRoutesV2'); // Recherche multimodale avancée
const assistanceRoutes = require('./routes/assistanceRoutes'); // Gestion assistances PMR

// ==========================================
// 🆕 POINT 8 - RÉSERVATION ADAPTATIVE
// ==========================================
const bookingRoutes = require('./routes/bookingRoutes');

// ==========================================
// 🆕 POINT 9 - SYSTÈME DE FEEDBACK/AVIS
// ==========================================
const reviewRoutes = require('./routes/reviewRoutes');

// ==========================================
// 🆕 POINT 10 - GESTION INCIDENTS
// ==========================================
const incidentRoutes = require('./routes/incidentRoutes');

// HUB AMQP (KAFKA)
const kafkaRoutes = require('./routes/kafkaRoutes');
const { connectProducer } = require('./models/Kafka');
// Connexion du producteur Kafka
connectProducer();

const { consumeMessages } = require('./models/kafkaConsumer');
// Lancer le consommateur Kafka
consumeMessages().catch((err) => {
    console.error('Erreur lors du démarrage du consommateur Kafka:', err);
  });


// Gestion d'erreurs
const errorHandler = require('./middleware/errorHandler');

// Redis
const sessionMiddleware = require('./middleware/sessionMiddleware');

const app = express();

app.use(express.json({ limit: '10mb' }));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(bodyParser.json());

// Middleware pour les sessions
app.use(sessionMiddleware);

// Documentation Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//Auth
app.use('/auth', AuthRoutes);

// Routes SQL
app.use('/reservations', reservationsRoutes);
app.use('/facturation', FacturationRoutes);
app.use('/users', userRoutes);
app.use('/agent', agentRoutes);

// AF
app.use('/AF/airports', AirportsRoutes);
app.use('/AF/flights', volRoutes);

// SNCF
app.use('/SNCF/gare', GareRoutes);
app.use('/SNCF/trajet', TrajetSNCFRoutes);
app.use('/SNCF/trajetSNCF', TrajetSNCFRoutes);

// UBER
app.use('/UBER/ride', TrajetTaxiUBERRoutes);

// Routes NoSQL
app.use('/voyage', voyageRoutesOLD); // Point 2 ancien /voyage/insert
app.use('/biometric', biometricRoutes);
app.use('/notification', notificationRoutesOLD); // Ancien MySQL
app.use('/blockchain', blockchainRoutes);
app.use('/contact', contactRoutes);

// ==========================================
// 🆕 POINT 2 - NOUVELLES ROUTES
// ==========================================
app.use('/search', searchRoutes);
app.use('/tickets', ticketRoutes);

// ==========================================
// 🆕 POINT 3 - NOUVELLES ROUTES
// ==========================================
app.use('/checkin', checkinRoutes);
app.use('/boarding', boardingRoutes);

// ==========================================
// 🆕 POINT 4 & 5 - NOUVELLES ROUTES
// ==========================================
app.use('/notifications', notificationRoutesV2); // Point 4 MongoDB /notifications/*
app.use('/voyages', voyageHistoryRoutes); // Point 5 /voyages/* (avec 's')

// ==========================================
// 🆕 POINT 6 & 7 - NOUVELLES ROUTES PMR MULTIMODAL
// ==========================================
app.use('/api/search', searchRoutesV2); // Recherche multimodale avancée
app.use('/api/assistance', assistanceRoutes); // Gestion assistances PMR

// ==========================================
// 🆕 POINT 8 - RÉSERVATION ADAPTATIVE
// ==========================================
app.use('/api/booking', bookingRoutes); // Réservation avec workflow adaptatif

// ==========================================
// 🆕 POINT 9 - SYSTÈME DE FEEDBACK/AVIS
// ==========================================
app.use('/api/review', reviewRoutes); // Avis et évaluations PMR

// ==========================================
// 🆕 POINT 10 - GESTION INCIDENTS
// ==========================================
app.use('/api/incidents', incidentRoutes); // Incidents et perturbations

// Routes HUB
app.use('/kafka', kafkaRoutes);

// Middleware de gestion des erreurs
app.use(errorHandler);

// Initialisation des utilisateurs par défaut
const { initDefaultUsers } = require('./scripts/initUsers');

// ==========================================
// 🆕 POINT 4 - SERVICE AGENTS
// ==========================================
const agentService = require('./services/agentService');

// Démarrer le serveur
const PORT = process.env.PORT || 17777;
app.listen(PORT, async () => {
    console.log(`✅ Server is running on port ${PORT}`);
    try {
        // Synchroniser la base principale
        await sequelize.sync({ alter: true });
        console.log('✅ Base de données SAE_Multi synchronisée');
        
        // ==========================================
        // 🆕 SYNCHRONISER LES BASES AF/SNCF/UBER
        // ==========================================
        const sequelizeAF = require('./config/databaseAF');
        const sequelizeSNCF = require('./config/databaseSNCF');
        const sequelizeUBER = require('./config/databaseUBER');
        
        await sequelizeAF.sync({ alter: true });
        console.log('✅ Base AF_Database synchronisée');
        
        await sequelizeSNCF.sync({ alter: true });
        console.log('✅ Base SNCF_Database synchronisée');
        
        await sequelizeUBER.sync({ alter: true });
        console.log('✅ Base UBER_Database synchronisée');
        
        // Initialiser les utilisateurs par défaut
        await initDefaultUsers();
        
        // ==========================================
        // 🆕 POINT 2 - SEED AUTOMATIQUE DES TRANSPORTS
        // ==========================================
        try {
            const { seedFlights, seedTrains, seedRides } = require('./scripts/seedTransports');
            const { Vol } = require('./models/AF');
            
            // Vérifier si les tables sont vides
            const volCount = await Vol.count();
            
            if (volCount === 0) {
                console.log('🌱 Tables de transport vides détectées, insertion des données...');
                await seedFlights();
                await seedTrains();
                await seedRides();
                console.log('✅ 45 données de transport insérées automatiquement');
            } else {
                console.log(`ℹ️ ${volCount} vols déjà en base, seed des transports ignoré`);
            }
        } catch (seedError) {
            console.error('⚠️ Erreur lors du seed automatique des transports:', seedError.message);
            console.log('💡 Vous pouvez exécuter manuellement: docker exec -it flexitrip_api node scripts/seedTransports.js');
        }
        
        // ==========================================
        // 🆕 POINT 4 - POPULATE AGENTS PMR
        // ==========================================
        try {
            await agentService.populateAgentsDB();
            console.log('✅ Agents PMR initialisés');
        } catch (agentError) {
            console.warn('⚠️ Erreur init agents (non bloquant):', agentError.message);
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du démarrage de l\'application:', error);
    }
});

module.exports = app;
