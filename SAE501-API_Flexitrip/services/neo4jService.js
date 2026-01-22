const neo4j = require('neo4j-driver');

/**
 * ============================================================
 * 🧠 NEO4J SERVICE - FLEXITRIP (Lazy Loading)
 * ============================================================
 * Gère la connexion à la base de données orientée graphe.
 * Ne plante PAS si la configuration est absente.
 */
class Neo4jService {
    constructor() {
        this.driver = null;
        this.isConnected = false;
    }

    /**
     * Initialise la connexion (appelé à la demande ou au boot)
     * Ne throw PAS d'erreur bloquante si config manquante.
     */
    async init() {
        if (this.driver) return true; // Déjà init

        const uri = process.env.NEO4J_URL;
        const user = process.env.NEO4J_USER;
        const password = process.env.NEO4J_PASSWORD;

        if (!uri || !user || !password) {
            console.warn('⚠️ Neo4j configuration missing. Service will be disabled.');
            return false;
        }

        try {
            console.log(`🔗 Connecting to Neo4j on ${uri}...`);
            this.driver = neo4j.driver(
                uri,
                neo4j.auth.basic(user, password),
                {
                    maxConnectionLifetime: 3 * 60 * 60 * 1000,
                    maxConnectionPoolSize: 50,
                    connectionAcquisitionTimeout: 5000,
                    disableLosslessIntegers: true
                }
            );

            // Verify connectivity without throwing fatal
            await this.driver.verifyConnectivity();
            console.log('✅ Neo4j connected successfully!');
            this.isConnected = true;
            return true;

        } catch (error) {
            console.error(`⚠️ Neo4j connection failed: ${error.message}`);
            this.driver = null;
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Récupère le driver ou tente de l'initialiser
     */
    async getDriver() {
        if (!this.driver) {
            await this.init();
        }
        return this.driver;
    }

    /**
     * Ferme la connexion
     */
    async close() {
        if (this.driver) {
            await this.driver.close();
            this.driver = null;
            this.isConnected = false;
            console.log('🔌 Neo4j connection closed.');
        }
    }

    /**
     * Exemple : Récupérer une station par ID
     */
    async getStationById(stationId) {
        try {
            const driver = await this.getDriver();
            if (!driver) {
                console.warn('⚠️ Neo4j not available, skipping getStationById');
                return null;
            }

            const session = driver.session();
            try {
                const result = await session.run(`
                    MATCH (s:Station {id: $id})
                    RETURN s.id as id, s.name as name, s.lat as lat, s.lon as lon, s.accessible as accessible
                    LIMIT 1
                `, { id: stationId });

                if (result.records.length === 0) return null;
                const record = result.records[0];

                return {
                    id: record.get('id'),
                    name: record.get('name'),
                    lat: record.get('lat'),
                    lon: record.get('lon'),
                    accessible: record.get('accessible')
                };
            } finally {
                await session.close();
            }
        } catch (error) {
            console.error('❌ Neo4j error (getStationById):', error.message);
            return null; // Fail safe
        }
    }
}

// Export Singleton
module.exports = new Neo4jService();
