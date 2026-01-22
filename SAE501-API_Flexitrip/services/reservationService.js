/**
 * ReservationService - Remplace le modèle Reservations.js Sequelize
 * 
 * Utilise supabaseService pour tous les accès à la table reservations
 */

const supabaseService = require('./supabaseService');
const { v4: uuidv4 } = require('uuid');

class ReservationService {
    /**
     * Créer une nouvelle réservation
     */
    async create(reservationData) {
        const {
            user_id, id_voyage, num_reza_mmt, num_pax,
            booking_reference, type_transport, assistance_pmr = false,
            date_reservation, lieu_depart, lieu_arrivee,
            date_depart, date_arrivee, pmr_options = {},
            statut = 'PENDING', etape_voyage = 1
        } = reservationData;

        // Valider le numéro de réservation unique
        const existing = await this.findByNum(num_reza_mmt);
        if (existing) {
            throw new Error(`Réservation avec numéro ${num_reza_mmt} existe déjà`);
        }

        return supabaseService.createReservation({
            user_id, id_voyage, num_reza_mmt, num_pax,
            booking_reference, type_transport, assistance_pmr,
            date_reservation, lieu_depart, lieu_arrivee,
            date_depart, date_arrivee, pmr_options,
            statut, etape_voyage
        });
    }

    /**
     * Récupérer réservation par ID
     */
    async findById(reservationId) {
        return supabaseService.getReservationById(reservationId);
    }

    /**
     * Récupérer réservation par numéro de réservation
     */
    async findByNum(numReza) {
        return supabaseService.getReservationByNum(numReza);
    }

    /**
     * Récupérer réservations d'un utilisateur
     */
    async findByUser(userId) {
        return supabaseService.getUserReservations(userId);
    }

    /**
     * Mettre à jour une réservation
     */
    async update(reservationId, updates) {
        return supabaseService.updateReservation(reservationId, updates);
    }

    /**
     * Mettre à jour le statut d'une réservation
     */
    async updateStatus(reservationId, status) {
        return this.update(reservationId, { statut: status });
    }

    /**
     * Confirmer une réservation
     */
    async confirm(reservationId) {
        return this.updateStatus(reservationId, 'CONFIRMED');
    }

    /**
     * Marquer comme enregistré (check-in)
     */
    async checkIn(reservationId) {
        return this.update(reservationId, {
            statut: 'CHECKED_IN',
            enregistre: true
        });
    }

    /**
     * Annuler une réservation
     */
    async cancel(reservationId) {
        return this.updateStatus(reservationId, 'CANCELLED');
    }

    /**
     * Générer un ticket avec QR code
     */
    async generateTicket(reservationId, qrCodeData) {
        return this.update(reservationId, {
            ticket_status: 'generated',
            ticket_generated_at: new Date().toISOString(),
            qr_code_data: qrCodeData,
            ticket_qr_code: qrCodeData // Ou générer un URL vers le QR code
        });
    }

    /**
     * Obtenir les réservations d'un vol spécifique
     */
    async findByVoyage(voyageId) {
        // À implémenter avec filtrage par id_voyage
        const allRes = await supabaseService.getAllReservations();
        return allRes.filter(r => r.id_voyage === voyageId);
    }

    /**
     * Obtenir réservations par type de transport
     */
    async findByTransportType(type) {
        // À implémenter
        return [];
    }

    /**
     * Vérifier si PMR a besoin d'assistance
     */
    isPmrAssistanceNeeded(reservation) {
        return reservation.assistance_pmr === true;
    }

    /**
     * Obtenir les réservations avec assistance PMR
     */
    async findWithAssistance(limit = 50) {
        // À implémenter avec filtre assistance_pmr = true
        return [];
    }

    /**
     * Valider les données de réservation avant création
     */
    validate(reservationData) {
        const errors = [];

        if (!reservationData.user_id) {
            errors.push('user_id requis');
        }

        if (!reservationData.num_reza_mmt) {
            errors.push('num_reza_mmt requis');
        }

        if (reservationData.date_depart && reservationData.date_arrivee) {
            const depart = new Date(reservationData.date_depart);
            const arrivee = new Date(reservationData.date_arrivee);

            if (arrivee <= depart) {
                errors.push('date_arrivee doit être après date_depart');
            }
        }

        if (errors.length > 0) {
            throw new Error('Validation errors: ' + errors.join(', '));
        }

        return true;
    }

    /**
     * Compter les réservations pour un voyages
     */
    async countByVoyage(voyageId) {
        // À implémenter
        return 0;
    }
}

module.exports = new ReservationService();
