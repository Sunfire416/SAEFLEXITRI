const neo4j = require('neo4j-driver');

class Neo4jService {
    constructor() {
        this.driver = null;
        this.init();
    }

    async init() {
        try {
            this.driver = neo4j.driver(
                process.env.NEO4J_URI || 'bolt://localhost:7687',
                neo4j.auth.basic(
                    process.env.NEO4J_USER || 'neo4j',
                    process.env.NEO4J_PASSWORD || 'password'
                ),
                {
                    maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
                    maxConnectionPoolSize: 50,
                    connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
                    disableLosslessIntegers: true
                }
            );

            // Test connection
            await this.driver.verifyConnectivity();
            console.log('✅ Connexion Neo4j établie avec succès');

        } catch (error) {
            console.error('❌ Erreur connexion Neo4j:', error);
            throw error;
        }
    }

    async close() {
        if (this.driver) {
            await this.driver.close();
        }
    }

    /**
     * Récupère une station par son ID
     */
    async getStationById(stationId) {
        const session = this.driver.session();
        try {
            const result = await session.run(`
                MATCH (s:Station {id: $id})
                OPTIONAL MATCH (s)-[:SERVES]->(l:Line)
                RETURN s.id as id, 
                       s.name as name, 
                       s.lat as lat, 
                       s.lon as lon,
                       s.accessible as accessible,
                       s.zone as zone,
                       s.type as type,
                       collect(DISTINCT l.name) as lines
                LIMIT 1
            `, { id: stationId });

            if (result.records.length === 0) return null;

            const record = result.records[0];
            return {
                id: record.get('id'),
                name: record.get('name'),
                lat: parseFloat(record.get('lat')),
                lon: parseFloat(record.get('lon')),
                accessible: record.get('accessible') === true || record.get('accessible') === 'true',
                zone: parseInt(record.get('zone')) || 1,
                type: record.get('type') || 'metro',
                lines: record.get('lines') || []
            };
        } catch (error) {
            console.error('❌ Neo4j getStationById error:', error);
            return null;
        } finally {
            await session.close();
        }
    }

    /**
     * Trouve les stations proches d'un point GPS
     */
    async findNearbyStations(lat, lon, radiusMeters = 1000, limit = 10) {
        const session = this.driver.session();
        try {
            const result = await session.run(`
                MATCH (s:Station)
                WHERE point.distance(
                    point({latitude: s.lat, longitude: s.lon}),
                    point({latitude: $lat, longitude: $lon})
                ) <= $radius
                RETURN s.id as id, 
                       s.name as name, 
                       s.lat as lat, 
                       s.lon as lon,
                       s.accessible as accessible,
                       s.zone as zone,
                       s.type as type,
                       point.distance(
                         point({latitude: s.lat, longitude: s.lon}),
                         point({latitude: $lat, longitude: $lon})
                       ) as distance_meters
                ORDER BY distance_meters
                LIMIT $limit
            `, {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                radius: parseFloat(radiusMeters),
                limit: neo4j.int(limit)
            });

            return result.records.map(record => ({
                id: record.get('id'),
                name: record.get('name'),
                lat: parseFloat(record.get('lat')),
                lon: parseFloat(record.get('lon')),
                accessible: record.get('accessible') === true,
                zone: parseInt(record.get('zone')) || 1,
                type: record.get('type') || 'metro',
                distance: Math.round(record.get('distance_meters'))
            }));
        } catch (error) {
            console.error('❌ Neo4j findNearbyStations error:', error);
            return [];
        } finally {
            await session.close();
        }
    }

    /**
     * Trouve les stations accessibles (PMR) proches
     */
    async findAccessibleStations(lat, lon, radiusMeters = 1000) {
        const session = this.driver.session();
        try {
            const result = await session.run(`
                MATCH (s:Station {accessible: true})
                WHERE point.distance(
                    point({latitude: s.lat, longitude: s.lon}),
                    point({latitude: $lat, longitude: $lon})
                ) <= $radius
                RETURN s.id as id, s.name as name, s.lat as lat, s.lon as lon,
                       s.zone as zone, s.type as type,
                       point.distance(
                         point({latitude: s.lat, longitude: s.lon}),
                         point({latitude: $lat, longitude: $lon})
                       ) as distance_meters
                ORDER BY distance_meters
                LIMIT 10
            `, {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                radius: parseFloat(radiusMeters)
            });

            return result.records.map(record => ({
                id: record.get('id'),
                name: record.get('name'),
                lat: parseFloat(record.get('lat')),
                lon: parseFloat(record.get('lon')),
                zone: parseInt(record.get('zone')) || 1,
                type: record.get('type') || 'metro',
                distance: Math.round(record.get('distance_meters'))
            }));
        } catch (error) {
            console.error('❌ Neo4j findAccessibleStations error:', error);
            return [];
        } finally {
            await session.close();
        }
    }

    /**
     * Trouve le meilleur itinéraire entre deux stations
     * Optimisé pour l'accessibilité PMR
     */
    async findOptimalRoute(startStationId, endStationId, options = {}) {
        const {
            maxTransfers = 3,
            maxWalkDistance = 500,
            requireAccessibility = true,
            avoidStairs = true
        } = options;

        const session = this.driver.session();
        try {
            let query = `
                MATCH (start:Station {id: $startId}), (end:Station {id: $endId})
            `;

            if (requireAccessibility) {
                query += `
                    MATCH path = shortestPath((start)-[:CONNECTED_TO*..${maxTransfers}]-(end))
                    WHERE ALL(s IN nodes(path) WHERE s.accessible = true)
                `;
            } else {
                query += `
                    MATCH path = shortestPath((start)-[:CONNECTED_TO*..${maxTransfers}]-(end))
                `;
            }

            query += `
                RETURN [node IN nodes(path) | {
                    id: node.id,
                    name: node.name,
                    lat: node.lat,
                    lon: node.lon,
                    accessible: node.accessible,
                    zone: node.zone,
                    type: node.type
                }] as stations,
                [rel IN relationships(path) | {
                    type: rel.type,
                    line: rel.line,
                    duration: rel.duration,
                    distance: rel.distance,
                    accessible: rel.accessible
                }] as connections,
                reduce(total = 0, r IN relationships(path) | total + r.duration) as total_duration,
                reduce(total = 0, r IN relationships(path) | total + r.distance) as total_distance
                ORDER BY total_duration
                LIMIT 1
            `;

            const result = await session.run(query, {
                startId: startStationId,
                endId: endStationId
            });

            if (result.records.length === 0) return null;

            const record = result.records[0];
            return {
                stations: record.get('stations'),
                connections: record.get('connections'),
                total_duration: record.get('total_duration'),
                total_distance: record.get('total_distance'),
                estimated_price: this.calculatePrice(record.get('stations'))
            };
        } catch (error) {
            console.error('❌ Neo4j findOptimalRoute error:', error);
            return null;
        } finally {
            await session.close();
        }
    }

    /**
     * Calcule le prix estimé basé sur les zones traversées
     */
    calculatePrice(stations) {
        if (!stations || stations.length === 0) return 0;

        const zones = new Set(stations.map(s => s.zone).filter(z => z));
        const zoneCount = zones.size;

        // Tarification simplifiée IDF
        if (zoneCount === 0) return 2.10;
        if (zoneCount === 1) return 2.10;
        if (zoneCount === 2) return 4.20;
        if (zoneCount === 3) return 6.30;
        return 8.40; // 4+ zones
    }

    /**
     * Importe une station dans Neo4j
     */
    async importStation(stationData) {
        const session = this.driver.session();
        try {
            await session.run(`
                MERGE (s:Station {id: $id})
                SET s.name = $name,
                    s.lat = $lat,
                    s.lon = $lon,
                    s.accessible = $accessible,
                    s.zone = $zone,
                    s.type = $type,
                    s.updated_at = datetime()
                RETURN s
            `, {
                id: stationData.id,
                name: stationData.name,
                lat: parseFloat(stationData.lat),
                lon: parseFloat(stationData.lon),
                accessible: !!stationData.accessible,
                zone: parseInt(stationData.zone) || 1,
                type: stationData.type || 'metro'
            });

            return true;
        } catch (error) {
            console.error('❌ Neo4j importStation error:', error);
            return false;
        } finally {
            await session.close();
        }
    }

    /**
     * Recherche de stations par nom (fuzzy search)
     */
    async searchStations(query, limit = 10) {
        const session = this.driver.session();
        try {
            const result = await session.run(`
                MATCH (s:Station)
                WHERE toLower(s.name) CONTAINS toLower($query)
                OR s.id CONTAINS $query
                RETURN s.id as id, s.name as name, s.lat as lat, s.lon as lon,
                       s.accessible as accessible, s.zone as zone, s.type as type
                ORDER BY s.name
                LIMIT $limit
            `, {
                query: query,
                limit: neo4j.int(limit)
            });

            return result.records.map(record => ({
                id: record.get('id'),
                name: record.get('name'),
                lat: parseFloat(record.get('lat')),
                lon: parseFloat(record.get('lon')),
                accessible: record.get('accessible') === true,
                zone: parseInt(record.get('zone')) || 1,
                type: record.get('type') || 'metro'
            }));
        } catch (error) {
            console.error('❌ Neo4j searchStations error:', error);
            return [];
        } finally {
            await session.close();
        }
    }
}

module.exports = new Neo4jService();