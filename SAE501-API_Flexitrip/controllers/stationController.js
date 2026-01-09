const Neo4jService = require('../services/neo4jService');

/**
 * Station Controller - Uses Neo4j for all station operations
 */
class StationController {

    /**
     * Rechercher des stations par nom
     */
    async searchStations(req, res) {
        try {
            const { query, limit = 10 } = req.query;

            if (!query || query.length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Recherche trop courte'
                });
            }

            const stations = await Neo4jService.searchStations(query, parseInt(limit));

            res.json({
                success: true,
                count: stations.length,
                stations
            });

        } catch (error) {
            console.error('❌ StationController.searchStations error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la recherche'
            });
        }
    }

    /**
     * Trouver les stations proches
     */
    async findNearby(req, res) {
        try {
            const { lat, lon, radius = 1000, limit = 10 } = req.query;

            if (!lat || !lon) {
                return res.status(400).json({
                    success: false,
                    error: 'Coordonnées requises'
                });
            }

            const stations = await Neo4jService.findNearbyStations(
                parseFloat(lat),
                parseFloat(lon),
                parseInt(radius),
                parseInt(limit)
            );

            res.json({
                success: true,
                count: stations.length,
                stations
            });

        } catch (error) {
            console.error('❌ StationController.findNearby error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la recherche'
            });
        }
    }

    /**
     * Trouver les stations accessibles proches
     */
    async findAccessibleNearby(req, res) {
        try {
            const { lat, lon, radius = 1000 } = req.query;

            if (!lat || !lon) {
                return res.status(400).json({
                    success: false,
                    error: 'Coordonnées requises'
                });
            }

            const stations = await Neo4jService.findAccessibleStations(
                parseFloat(lat),
                parseFloat(lon),
                parseInt(radius)
            );

            res.json({
                success: true,
                count: stations.length,
                stations,
                pmr_only: true
            });

        } catch (error) {
            console.error('❌ StationController.findAccessibleNearby error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la recherche'
            });
        }
    }

    /**
     * Obtenir une station par ID
     */
    async getById(req, res) {
        try {
            const { id } = req.params;

            const station = await Neo4jService.getStationById(id);

            if (!station) {
                return res.status(404).json({
                    success: false,
                    error: 'Station non trouvée'
                });
            }

            res.json({
                success: true,
                station
            });

        } catch (error) {
            console.error('❌ StationController.getById error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération'
            });
        }
    }

    /**
     * Calculer un itinéraire
     */
    async findRoute(req, res) {
        try {
            const {
                start_station_id,
                end_station_id,
                require_accessibility = true
            } = req.body;

            if (!start_station_id || !end_station_id) {
                return res.status(400).json({
                    success: false,
                    error: 'IDs stations requis'
                });
            }

            const route = await Neo4jService.findOptimalRoute(
                start_station_id,
                end_station_id,
                { requireAccessibility: require_accessibility }
            );

            if (!route) {
                return res.status(404).json({
                    success: false,
                    error: 'Aucun itinéraire trouvé'
                });
            }

            res.json({
                success: true,
                route
            });

        } catch (error) {
            console.error('❌ StationController.findRoute error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors du calcul'
            });
        }
    }
}

module.exports = new StationController();
