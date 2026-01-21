const neo4j = require('neo4j-driver');

/**
 * ============================================================
 * 🧠 NEO4J SERVICE - FLEXITRIP
 * ============================================================
 * Ce service gère la connexion à la base de données orientée graphe.
 * Il inclut une logique de reconnexion automatique pour Docker.
 */
class Neo4jService {
    constructor() {
        this.driver = null;
    }

    /**
     * Initialise la connexion avec un système de tentatives (Retry)
     * @param {number} maxRetries - Nombre d'essais avant de couper l'API
     */
    async init(maxRetries = 20) {
        // Éviter une double initialisation
        if (this.driver) return;

        // Récupération des variables d'environnement
        const uri = process.env.NEO4J_URL || 'bolt://neo4j:7687';
        const user = process.env.NEO4J_USER || 'neo4j';
        const password = process.env.NEO4J_PASSWORD || 'password';

        for (let i = 1; i <= maxRetries; i++) {
            try {
                console.log(`🔗 [Tentative ${i}/${maxRetries}] Connexion à Neo4j sur ${uri}...`);

                this.driver = neo4j.driver(
                    uri,
                    neo4j.auth.basic(user, password),
                    {
                        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 heures
                        maxConnectionPoolSize: 50,
                        connectionAcquisitionTimeout: 5000, // 5 secondes
                        disableLosslessIntegers: true
                    }
                );

                // Vérification réelle de la connectivité
                await this.driver.verifyConnectivity();

                console.log('✅ Neo4j est prêt et connecté avec succès !');
                return true;

            } catch (error) {
                this.driver = null;
                console.error(`⚠️ Échec de la tentative ${i}: ${error.message}`);

                if (i === maxRetries) {
                    console.error('❌ ERREUR FATALE: Neo4j est injoignable après plusieurs tentatives.');
                    throw error; // L'API s'arrêtera ici comme tu le souhaites
                }

                // Délai d'attente avant la prochaine tentative (laisse le temps à Neo4j de chauffer)
                const delay = 5000;
                console.log(`⏳ Attente de ${delay / 1000}s avant le prochain essai...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    /**
     * Vérifie si le driver est disponible avant d'exécuter une requête
     */
    ensureDriver() {
        if (!this.driver) {
            throw new Error("Le service Neo4j n'est pas initialisé ou est déconnecté.");
        }
    }

    /**
     * Ferme proprement la connexion
     */
    async close() {
        if (this.driver) {
            await this.driver.close();
            this.driver = null;
            console.log('🔌 Connexion Neo4j fermée.');
        }
    }

    /**
     * Exemple de méthode pour récupérer une station
     */
    async getStationById(stationId) {
        try {
            this.ensureDriver();
            const session = this.driver.session();
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
            console.error('❌ Erreur Neo4j (getStationById):', error.message);
            throw error;
        }
    }
}

// Exportation en tant que Singleton
module.exports = new Neo4jService();