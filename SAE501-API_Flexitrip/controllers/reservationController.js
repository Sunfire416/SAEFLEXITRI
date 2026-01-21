const { v4: uuidv4 } = require('uuid');
const SupabaseService = require('../services/SupabaseService');

/**
 * Reservation Controller - Uses Supabase for reservation operations
 */
class ReservationController {

    /**
     * Lister les réservations de l'utilisateur
     */
    async list(req, res) {
        try {
            const { status, type_transport, limit = 50 } = req.query;

            let query = SupabaseService.client
                .from('reservations')
                .select(`*, voyage:voyages(*)`)
                .eq('user_id', req.userId)
                .order('created_at', { ascending: false })
                .limit(parseInt(limit));

            if (status) query = query.eq('statut', status);
            if (type_transport) query = query.eq('type_transport', type_transport);

            const { data, error } = await query;
            if (error) throw error;

            res.json({
                success: true,
                count: data.length,
                reservations: data
            });

        } catch (error) {
            console.error('❌ ReservationController.list error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération'
            });
        }
    }

    /**
     * Créer une réservation
     */
    async create(req, res) {
        try {
            const {
                id_voyage,
                type_transport,
                lieu_depart,
                lieu_arrivee,
                date_depart,
                date_arrivee,
                assistance_pmr = false,
                pmr_options = {}
            } = req.body;

            if (!type_transport || !lieu_depart || !lieu_arrivee || !date_depart) {
                return res.status(400).json({
                    success: false,
                    error: 'Champs obligatoires manquants'
                });
            }

            const numRezaMmt = `FLX-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            const reservationData = {
                reservation_id: uuidv4(),
                user_id: req.userId,
                id_voyage,
                num_reza_mmt: numRezaMmt,
                num_pax: `PAX-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                booking_reference: numRezaMmt,
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

            res.status(201).json({
                success: true,
                message: 'Réservation créée',
                reservation
            });

        } catch (error) {
            console.error('❌ ReservationController.create error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la création'
            });
        }
    }

    /**
     * Récupérer une réservation par ID
     */
    async getById(req, res) {
        try {
            const { id } = req.params;

            const { data, error } = await SupabaseService.client
                .from('reservations')
                .select(`
                    *,
                    user:users(user_id, name, surname, email, phone, role, pmr_profile),
                    voyage:voyages(*)
                `)
                .eq('reservation_id', id)
                .single();

            if (error || !data) {
                return res.status(404).json({
                    success: false,
                    error: 'Réservation non trouvée'
                });
            }

            // Vérifier les droits
            if (data.user_id !== req.userId &&
                req.userRole !== 'admin' &&
                req.userRole !== 'Agent') {
                return res.status(403).json({
                    success: false,
                    error: 'Accès non autorisé'
                });
            }

            res.json({
                success: true,
                reservation: data
            });

        } catch (error) {
            console.error('❌ ReservationController.getById error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération'
            });
        }
    }

    /**
     * Mettre à jour le statut
     */
    async updateStatus(req, res) {
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
            console.error('❌ ReservationController.updateStatus error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la mise à jour'
            });
        }
    }

    /**
     * Rechercher par référence
     */
    async getByReference(req, res) {
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
            console.error('❌ ReservationController.getByReference error:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la recherche'
            });
        }
    }
}

module.exports = new ReservationController();
