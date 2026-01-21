const express = require('express');
const router = express.Router();
const Neo4jService = require('../services/neo4jService');

/**
 * @swagger
 * /api/stations/search:
 *   get:
 *     summary: Rechercher des stations par nom
 *     tags: [Stations]
 */
router.get('/search', async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Recherche trop courte (minimum 2 caractères)'
            });
        }

        const stations = await Neo4jService.searchStations(query, parseInt(limit));

        res.json({
            success: true,
            count: stations.length,
            stations
        });

    } catch (error) {
        console.error('❌ Erreur recherche stations:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la recherche de stations'
        });
    }
});

/**
 * @swagger
 * /api/stations/nearby:
 *   get:
 *     summary: Trouver les stations proches
 *     tags: [Stations]
 */
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lon, radius = 1000, limit = 10 } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                success: false,
                error: 'Coordonnées lat/lon requises'
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
            stations,
            search_params: {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                radius_meters: parseInt(radius)
            }
        });

    } catch (error) {
        console.error('❌ Erreur stations proches:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la recherche des stations proches'
        });
    }
});

/**
 * @swagger
 * /api/stations/accessible/nearby:
 *   get:
 *     summary: Trouver les stations accessibles PMR proches
 *     tags: [Stations]
 */
router.get('/accessible/nearby', async (req, res) => {
    try {
        const { lat, lon, radius = 1000 } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                success: false,
                error: 'Coordonnées lat/lon requises'
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
            accessibility: {
                only_accessible: true,
                pmr_compatible: true
            }
        });

    } catch (error) {
        console.error('❌ Erreur stations accessibles:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la recherche des stations accessibles'
        });
    }
});

/**
 * @swagger
 * /api/stations/:id:
 *   get:
 *     summary: Détails d'une station
 *     tags: [Stations]
 */
router.get('/:id', async (req, res) => {
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
        console.error('❌ Erreur get station:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération de la station'
        });
    }
});

/**
 * @swagger
 * /api/stations/route:
 *   post:
 *     summary: Calculer un itinéraire entre deux stations
 *     tags: [Stations]
 */
router.post('/route', async (req, res) => {
    try {
        const {
            start_station_id,
            end_station_id,
            require_accessibility = true,
            max_transfers = 3
        } = req.body;

        if (!start_station_id || !end_station_id) {
            return res.status(400).json({
                success: false,
                error: 'IDs des stations de départ et d\'arrivée requis'
            });
        }

        const route = await Neo4jService.findOptimalRoute(
            start_station_id,
            end_station_id,
            {
                requireAccessibility: require_accessibility,
                maxTransfers: max_transfers
            }
        );

        if (!route) {
            return res.status(404).json({
                success: false,
                error: 'Aucun itinéraire trouvé',
                suggestions: {
                    try_without_accessibility: require_accessibility,
                    try_increase_transfers: max_transfers < 5
                }
            });
        }

        res.json({
            success: true,
            route,
            accessibility_required: require_accessibility
        });

    } catch (error) {
        console.error('❌ Erreur calcul route:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du calcul de l\'itinéraire'
        });
    }
});

module.exports = router;
