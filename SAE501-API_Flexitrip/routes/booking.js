const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const SupabaseService = require('../services/SupabaseService');
const Neo4jService = require('../services/neo4jService');

/**
 * @swagger
 * /api/booking/multimodal:
 *   post:
 *     summary: Réserver un itinéraire multimodal
 *     tags: [Booking]
 */
router.post('/multimodal', async (req, res) => {
    try {
        const {
            itinerary,
            date_depart,
            require_assistance = false,
            pmr_options = {}
        } = req.body;

        if (!itinerary || !itinerary.segments || itinerary.segments.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Itinéraire avec segments requis'
            });
        }

        // Créer le voyage
        const voyage = await SupabaseService.createVoyage({
            id_voyage: uuidv4(),
            id_pmr: req.userId,
            date_debut: new Date(date_depart).toISOString(),
            date_fin: new Date(new Date(date_depart).getTime() + 24 * 60 * 60 * 1000).toISOString(),
            lieu_depart: itinerary.origin || itinerary.segments[0].departure,
            lieu_arrivee: itinerary.destination || itinerary.segments[itinerary.segments.length - 1].arrival,
            etapes: itinerary.segments,
            prix_total: itinerary.total_price || 0
        });

        // Créer une réservation pour chaque segment
        const reservations = [];
        for (let i = 0; i < itinerary.segments.length; i++) {
            const segment = itinerary.segments[i];

            const numRezaMmt = `FLX-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

            const reservationData = {
                reservation_id: uuidv4(),
                user_id: req.userId,
                id_voyage: voyage.id_voyage,
                num_reza_mmt: numRezaMmt,
                num_pax: `PAX-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                booking_reference: numRezaMmt,
                type_transport: segment.transport_type || segment.mode || 'multimodal',
                lieu_depart: segment.departure?.name || segment.departure || '',
                lieu_arrivee: segment.arrival?.name || segment.arrival || '',
                date_depart: segment.departure_time ? new Date(segment.departure_time).toISOString() : new Date(date_depart).toISOString(),
                date_arrivee: segment.arrival_time ? new Date(segment.arrival_time).toISOString() : null,
                assistance_pmr: require_assistance,
                pmr_options: {
                    ...pmr_options,
                    segment_index: i
                },
                statut: 'CONFIRMED',
                ticket_status: 'generated',
                etape_voyage: i + 1
            };

            const reservation = await SupabaseService.createReservation(reservationData);
            reservations.push(reservation);
        }

        res.status(201).json({
            success: true,
            message: 'Réservation multimodale créée',
            booking: {
                voyage,
                reservations,
                total_segments: reservations.length,
                total_price: itinerary.total_price
            }
        });

    } catch (error) {
        console.error('❌ Erreur booking multimodal:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la réservation'
        });
    }
});

/**
 * @swagger
 * /api/booking/pay:
 *   post:
 *     summary: Payer avec le wallet
 *     tags: [Booking]
 */
router.post('/pay', async (req, res) => {
    try {
        const { reservation_id, voyage_id, amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Montant invalide'
            });
        }

        // Vérifier le solde
        const user = await SupabaseService.getUserById(req.userId);

        if (!user || user.solde < amount) {
            return res.status(400).json({
                success: false,
                error: 'Solde insuffisant',
                current_balance: user?.solde || 0,
                required: amount
            });
        }

        // Créer la transaction (le trigger Supabase mettra à jour le solde)
        const transaction = await SupabaseService.createTransaction({
            user_id: req.userId,
            reservation_id: reservation_id || null,
            amount: parseFloat(amount),
            type: 'Billet_Voyage',
            payment_status: 'paid',
            date_payement: new Date().toISOString(),
            description: voyage_id ? `Paiement voyage ${voyage_id}` : 'Paiement réservation'
        });

        // Mettre à jour le statut de la réservation si fourni
        if (reservation_id) {
            await SupabaseService.updateReservationStatus(reservation_id, {
                statut: 'PAID',
                ticket_status: 'generated'
            });
        }

        // Récupérer le nouveau solde
        const updatedUser = await SupabaseService.getUserById(req.userId);

        res.json({
            success: true,
            message: 'Paiement effectué',
            transaction: transaction,
            new_balance: updatedUser?.solde || 0
        });

    } catch (error) {
        console.error('❌ Erreur paiement:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du paiement'
        });
    }
});

/**
 * @swagger
 * /api/booking/:id/ticket:
 *   get:
 *     summary: Récupérer le ticket QR code
 *     tags: [Booking]
 */
router.get('/:id/ticket', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: reservation, error } = await SupabaseService.client
            .from('reservations')
            .select('*')
            .eq('reservation_id', id)
            .single();

        if (error || !reservation) {
            return res.status(404).json({
                success: false,
                error: 'Réservation non trouvée'
            });
        }

        if (reservation.user_id !== req.userId && req.userRole !== 'admin' && req.userRole !== 'Agent') {
            return res.status(403).json({
                success: false,
                error: 'Accès non autorisé'
            });
        }

        res.json({
            success: true,
            ticket: {
                reservation_id: reservation.reservation_id,
                num_reza_mmt: reservation.num_reza_mmt,
                num_pax: reservation.num_pax,
                qr_code: reservation.ticket_qr_code,
                qr_data: reservation.qr_code_data,
                status: reservation.ticket_status,
                generated_at: reservation.ticket_generated_at,
                departure: reservation.lieu_depart,
                arrival: reservation.lieu_arrivee,
                date: reservation.date_depart,
                type: reservation.type_transport
            }
        });

    } catch (error) {
        console.error('❌ Erreur get ticket:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du ticket'
        });
    }
});

module.exports = router;
