const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const SupabaseService = require('../services/SupabaseService');
const QrService = require('../services/qrService');

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Liste des réservations de l'utilisateur
 *     tags: [Reservations]
 */
router.get('/', async (req, res) => {
    try {
        const { status, type_transport, limit = 50 } = req.query;

        let query = SupabaseService.client
            .from('reservations')
            .select(`
                *,
                voyage:voyages(*)
            `)
            .eq('user_id', req.userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status) {
            query = query.eq('statut', status);
        }
        if (type_transport) {
            query = query.eq('type_transport', type_transport);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            count: data.length,
            reservations: data
        });

    } catch (error) {
        console.error('❌ Erreur liste reservations:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des réservations'
        });
    }
});

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Créer une réservation
 *     tags: [Reservations]
 */
router.post('/', async (req, res) => {
    try {
        const {
            id_voyage,
            type_transport,
            lieu_depart,
            lieu_arrivee,
            date_depart,
            date_arrivee,
            assistance_pmr = false,
            pmr_options = {},
            booking_reference = null
        } = req.body;

        // Validation
        if (!type_transport || !lieu_depart || !lieu_arrivee || !date_depart) {
            return res.status(400).json({
                success: false,
                error: 'Type de transport, lieux et date de départ requis'
            });
        }

        // Générer un numéro de réservation unique
        const numRezaMmt = `FLX-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const reservationData = {
            reservation_id: uuidv4(),
            user_id: req.userId,
            id_voyage,
            num_reza_mmt: numRezaMmt,
            num_pax: `PAX-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            booking_reference: booking_reference || numRezaMmt,
            type_transport,
            lieu_depart,
            lieu_arrivee,
            date_depart: new Date(date_depart).toISOString(),
            date_arrivee: date_arrivee ? new Date(date_arrivee).toISOString() : null,
            assistance_pmr,
            pmr_options,
            statut: 'CONFIRMED',
            ticket_status: 'pending'
        };

        const reservation = await SupabaseService.createReservation(reservationData);

        // Générer le QR code du ticket
        let qrCodeData = null;
        try {
            if (QrService && typeof QrService.generateQRCode === 'function') {
                qrCodeData = await QrService.generateQRCode({
                    reservation_id: reservation.reservation_id,
                    num_reza_mmt: numRezaMmt,
                    passenger: req.userId,
                    departure: lieu_depart,
                    arrival: lieu_arrivee,
                    date: date_depart
                });

                // Mettre à jour la réservation avec le QR
                await SupabaseService.client
                    .from('reservations')
                    .update({
                        ticket_qr_code: qrCodeData,
                        qr_code_data: JSON.stringify({ num_reza_mmt: numRezaMmt }),
                        ticket_status: 'generated',
                        ticket_generated_at: new Date().toISOString()
                    })
                    .eq('reservation_id', reservation.reservation_id);
            }
        } catch (qrError) {
            console.warn('QR generation skipped:', qrError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Réservation créée avec succès',
            reservation: {
                ...reservation,
                ticket_qr_code: qrCodeData
            }
        });

    } catch (error) {
        console.error('❌ Erreur création reservation:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la création de la réservation'
        });
    }
});

/**
 * @swagger
 * /api/reservations/:id:
 *   get:
 *     summary: Détails d'une réservation
 *     tags: [Reservations]
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: reservation, error } = await SupabaseService.client
            .from('reservations')
            .select(`
                *,
                user:users(user_id, name, surname, email, phone, role, pmr_profile),
                voyage:voyages(*)
            `)
            .eq('reservation_id', id)
            .single();

        if (error || !reservation) {
            return res.status(404).json({
                success: false,
                error: 'Réservation non trouvée'
            });
        }

        // Vérifier les droits
        if (reservation.user_id !== req.userId &&
            req.userRole !== 'admin' &&
            req.userRole !== 'Agent') {
            return res.status(403).json({
                success: false,
                error: 'Accès non autorisé'
            });
        }

        res.json({
            success: true,
            reservation
        });

    } catch (error) {
        console.error('❌ Erreur get reservation:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération de la réservation'
        });
    }
});

/**
 * @swagger
 * /api/reservations/:id/status:
 *   put:
 *     summary: Mettre à jour le statut
 *     tags: [Reservations]
 */
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, ticket_status, enregistre } = req.body;

        const updates = {};
        if (statut) updates.statut = statut;
        if (ticket_status) updates.ticket_status = ticket_status;
        if (enregistre !== undefined) updates.enregistre = enregistre;

        const reservation = await SupabaseService.updateReservationStatus(id, updates);

        res.json({
            success: true,
            message: 'Statut mis à jour',
            reservation
        });

    } catch (error) {
        console.error('❌ Erreur update status:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour du statut'
        });
    }
});

/**
 * @swagger
 * /api/reservations/by-ref/:numReza:
 *   get:
 *     summary: Trouver par référence
 *     tags: [Reservations]
 */
router.get('/by-ref/:numReza', async (req, res) => {
    try {
        const { numReza } = req.params;

        const reservation = await SupabaseService.getReservationByNumReza(numReza);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                error: 'Réservation non trouvée'
            });
        }

        // Agents peuvent voir toutes les réservations
        if (reservation.user_id !== req.userId &&
            req.userRole !== 'admin' &&
            req.userRole !== 'Agent') {
            return res.status(403).json({
                success: false,
                error: 'Accès non autorisé'
            });
        }

        res.json({
            success: true,
            reservation
        });

    } catch (error) {
        console.error('❌ Erreur get by ref:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la recherche'
        });
    }
});

module.exports = router;
