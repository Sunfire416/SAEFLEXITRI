const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const SupabaseService = require('../services/SupabaseService');
const Neo4jService = require('../services/neo4jService');

/**
 * @swagger
 * /api/voyages:
 *   get:
 *     summary: Liste des voyages de l'utilisateur
 *     tags: [Voyages]
 */
router.get('/', async (req, res) => {
    try {
        const voyages = await SupabaseService.getVoyagesByUser(req.userId, req.userRole);

        res.json({
            success: true,
            count: voyages.length,
            voyages
        });

    } catch (error) {
        console.error('❌ Erreur liste voyages:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des voyages'
        });
    }
});

/**
 * @swagger
 * /api/voyages:
 *   post:
 *     summary: Créer un nouveau voyage
 *     tags: [Voyages]
 */
router.post('/', async (req, res) => {
    try {
        const {
            date_debut,
            date_fin,
            lieu_depart,
            lieu_arrivee,
            etapes = [],
            bagage = [],
            prix_total = 0,
            id_accompagnant = null
        } = req.body;

        // Validation
        if (!date_debut || !date_fin || !lieu_depart || !lieu_arrivee) {
            return res.status(400).json({
                success: false,
                error: 'Dates et lieux de départ/arrivée requis'
            });
        }

        // Enrichir les étapes avec les données Neo4j si disponible
        const enrichedEtapes = [];
        for (const etape of etapes) {
            if (etape.station_id) {
                const stationDetails = await Neo4jService.getStationById(etape.station_id);
                if (stationDetails) {
                    enrichedEtapes.push({
                        ...etape,
                        station: stationDetails
                    });
                } else {
                    enrichedEtapes.push(etape);
                }
            } else {
                enrichedEtapes.push(etape);
            }
        }

        const voyageData = {
            id_voyage: uuidv4(),
            id_pmr: req.userId,
            id_accompagnant,
            date_debut: new Date(date_debut).toISOString(),
            date_fin: new Date(date_fin).toISOString(),
            lieu_depart,
            lieu_arrivee,
            etapes: enrichedEtapes,
            bagage,
            prix_total
        };

        const voyage = await SupabaseService.createVoyage(voyageData);

        res.status(201).json({
            success: true,
            message: 'Voyage créé avec succès',
            voyage
        });

    } catch (error) {
        console.error('❌ Erreur création voyage:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la création du voyage'
        });
    }
});

/**
 * @swagger
 * /api/voyages/:id:
 *   get:
 *     summary: Détails d'un voyage
 *     tags: [Voyages]
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const voyage = await SupabaseService.getVoyageById(id);

        if (!voyage) {
            return res.status(404).json({
                success: false,
                error: 'Voyage non trouvé'
            });
        }

        // Vérifier les droits d'accès
        if (voyage.id_pmr !== req.userId &&
            voyage.id_accompagnant !== req.userId &&
            req.userRole !== 'admin' &&
            req.userRole !== 'Agent') {
            return res.status(403).json({
                success: false,
                error: 'Accès non autorisé'
            });
        }

        // Récupérer les réservations associées
        const { data: reservations } = await SupabaseService.client
            .from('reservations')
            .select('*')
            .eq('id_voyage', id)
            .order('date_depart', { ascending: true });

        res.json({
            success: true,
            voyage: {
                ...voyage,
                reservations: reservations || []
            }
        });

    } catch (error) {
        console.error('❌ Erreur get voyage:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du voyage'
        });
    }
});

/**
 * @swagger
 * /api/voyages/:id:
 *   put:
 *     summary: Modifier un voyage
 *     tags: [Voyages]
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier que le voyage existe et appartient à l'utilisateur
        const voyage = await SupabaseService.getVoyageById(id);

        if (!voyage) {
            return res.status(404).json({
                success: false,
                error: 'Voyage non trouvé'
            });
        }

        if (voyage.id_pmr !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Accès non autorisé'
            });
        }

        const allowedFields = ['date_debut', 'date_fin', 'lieu_depart', 'lieu_arrivee', 'etapes', 'bagage', 'prix_total', 'id_accompagnant'];
        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const { data, error } = await SupabaseService.client
            .from('voyages')
            .update(updates)
            .eq('id_voyage', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Voyage mis à jour',
            voyage: data
        });

    } catch (error) {
        console.error('❌ Erreur update voyage:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour du voyage'
        });
    }
});

/**
 * @swagger
 * /api/voyages/:id:
 *   delete:
 *     summary: Annuler un voyage
 *     tags: [Voyages]
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const voyage = await SupabaseService.getVoyageById(id);

        if (!voyage) {
            return res.status(404).json({
                success: false,
                error: 'Voyage non trouvé'
            });
        }

        if (voyage.id_pmr !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Accès non autorisé'
            });
        }

        // Soft delete: on pourrait ajouter un champ cancelled mais ici on supprime
        const { error } = await SupabaseService.client
            .from('voyages')
            .delete()
            .eq('id_voyage', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Voyage annulé'
        });

    } catch (error) {
        console.error('❌ Erreur delete voyage:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'annulation du voyage'
        });
    }
});

module.exports = router;
