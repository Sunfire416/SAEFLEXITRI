const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const SupabaseService = require('../services/SupabaseService');
const { requireRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/assistance/request:
 *   post:
 *     summary: Demander une assistance PMR
 *     tags: [Assistance]
 */
router.post('/request', async (req, res) => {
    try {
        const {
            reservation_id,
            request_type,
            notes,
            preferred_time,
            special_equipment = []
        } = req.body;

        if (!request_type) {
            return res.status(400).json({
                success: false,
                error: 'Type d\'assistance requis'
            });
        }

        // Vérifier le profil PMR de l'utilisateur
        const user = await SupabaseService.getUserById(req.userId);

        const assistanceRequest = {
            id: uuidv4(),
            user_id: req.userId,
            reservation_id: reservation_id || null,
            request_type,
            notes: notes || '',
            status: 'pending',
            preferred_time: preferred_time || null,
            special_equipment,
            user_pmr_profile: user?.pmr_profile || {},
            created_at: new Date().toISOString()
        };

        // Pour l'instant, stocker dans les réservations pmr_options si lié à une réservation
        if (reservation_id) {
            const { data: reservation } = await SupabaseService.client
                .from('reservations')
                .select('pmr_options')
                .eq('reservation_id', reservation_id)
                .single();

            const updatedPmrOptions = {
                ...(reservation?.pmr_options || {}),
                assistance_request: assistanceRequest
            };

            await SupabaseService.client
                .from('reservations')
                .update({
                    assistance_pmr: true,
                    pmr_options: updatedPmrOptions
                })
                .eq('reservation_id', reservation_id);
        }

        res.status(201).json({
            success: true,
            message: 'Demande d\'assistance enregistrée',
            request: assistanceRequest
        });

    } catch (error) {
        console.error('❌ Erreur demande assistance:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la demande d\'assistance'
        });
    }
});

/**
 * @swagger
 * /api/assistance/requests:
 *   get:
 *     summary: Liste des demandes d'assistance
 *     tags: [Assistance]
 */
router.get('/requests', async (req, res) => {
    try {
        const { status } = req.query;

        // Récupérer les réservations avec assistance PMR
        let query = SupabaseService.client
            .from('reservations')
            .select(`
                reservation_id,
                num_reza_mmt,
                assistance_pmr,
                pmr_options,
                date_depart,
                lieu_depart,
                lieu_arrivee,
                user:users(user_id, name, surname, phone, pmr_profile)
            `)
            .eq('assistance_pmr', true)
            .order('date_depart', { ascending: true });

        // Agents voient tout, utilisateurs seulement leurs demandes
        if (req.userRole !== 'Agent' && req.userRole !== 'admin') {
            query = query.eq('user_id', req.userId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Filtrer par statut si spécifié
        let requests = data.map(r => ({
            reservation_id: r.reservation_id,
            num_reza_mmt: r.num_reza_mmt,
            date_depart: r.date_depart,
            lieu_depart: r.lieu_depart,
            lieu_arrivee: r.lieu_arrivee,
            user: r.user,
            assistance_request: r.pmr_options?.assistance_request || { status: 'pending' }
        }));

        if (status) {
            requests = requests.filter(r => r.assistance_request.status === status);
        }

        res.json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {
        console.error('❌ Erreur liste assistance:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des demandes'
        });
    }
});

/**
 * @swagger
 * /api/assistance/requests/:id:
 *   put:
 *     summary: Mettre à jour le statut d'une demande (Agent)
 *     tags: [Assistance]
 */
router.put('/requests/:id', requireRole(['Agent', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, agent_notes, assigned_agent } = req.body;

        // Récupérer la réservation
        const { data: reservation, error: fetchError } = await SupabaseService.client
            .from('reservations')
            .select('pmr_options')
            .eq('reservation_id', id)
            .single();

        if (fetchError || !reservation) {
            return res.status(404).json({
                success: false,
                error: 'Demande non trouvée'
            });
        }

        // Mettre à jour la demande d'assistance dans pmr_options
        const updatedRequest = {
            ...(reservation.pmr_options?.assistance_request || {}),
            status: status || 'pending',
            agent_notes: agent_notes || '',
            assigned_agent: assigned_agent || req.userId,
            updated_at: new Date().toISOString()
        };

        const { error: updateError } = await SupabaseService.client
            .from('reservations')
            .update({
                pmr_options: {
                    ...(reservation.pmr_options || {}),
                    assistance_request: updatedRequest
                }
            })
            .eq('reservation_id', id);

        if (updateError) throw updateError;

        res.json({
            success: true,
            message: 'Demande mise à jour',
            request: updatedRequest
        });

    } catch (error) {
        console.error('❌ Erreur update assistance:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour'
        });
    }
});

module.exports = router;
