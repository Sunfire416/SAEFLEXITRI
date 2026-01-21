const SupabaseService = require('../services/SupabaseService');
const { v4: uuidv4 } = require('uuid');

/**
 * Controller pour l'historique des voyages et la gestion des QR codes
 * (Remplacement de l'ancien voyageController MongoDB/MySQL)
 */
class VoyageHistoryController {

    /**
     * Récupérer l'historique des voyages
     */
    async getHistory(req, res) {
        try {
            const user_id = req.query.user_id || req.user?.user_id;

            if (!user_id) {
                return res.status(400).json({ error: 'user_id requis' });
            }

            // Récupérer le rôle (si dispo dans le token)
            // Sinon on suppose PMR ou on laisse le service gérer
            const role = req.user?.role || 'PMR';

            const voyages = await SupabaseService.getVoyagesByUser(user_id, role);

            res.json({
                success: true,
                count: voyages.length,
                voyages: voyages
            });
        } catch (error) {
            console.error('❌ Erreur getHistory:', error);
            res.status(500).json({ success: false, error: 'Erreur serveur' });
        }
    }

    /**
     * Récupérer les détails d'un voyage
     */
    async getVoyageDetails(req, res) {
        try {
            const { id } = req.params;
            const voyage = await SupabaseService.getVoyageById(id);

            if (!voyage) {
                return res.status(404).json({ success: false, error: 'Voyage non trouvé' });
            }

            res.json({
                success: true,
                voyage: voyage
            });
        } catch (error) {
            console.error('❌ Erreur getVoyageDetails:', error);
            res.status(500).json({ success: false, error: 'Erreur serveur' });
        }
    }

    /**
     * Générer (ou récupérer) le QR code
     */
    async generateQR(req, res) {
        try {
            const { id } = req.params; // id voyage

            // On cherche la réservation associée au voyage
            const { data: reservation, error } = await SupabaseService.client
                .from('reservations')
                .select('qr_code_data, ticket_qr_code')
                .eq('id_voyage', id)
                .single();

            if (error || !reservation) {
                return res.status(404).json({ success: false, error: 'Réservation non trouvée pour ce voyage' });
            }

            res.json({
                success: true,
                qr_code: reservation.ticket_qr_code, // L'image base64 ou URL si stockée
                qr_data: reservation.qr_code_data // Les données brutes
            });

        } catch (error) {
            console.error('❌ Erreur generateQR:', error);
            res.status(500).json({ success: false, error: 'Erreur serveur' });
        }
    }

    /**
     * Annuler Check-in (remettre le billet en pending)
     */
    async cancelCheckin(req, res) {
        try {
            const { reservation_id } = req.params;

            // Update reservation status
            const updated = await SupabaseService.updateReservationStatus(reservation_id, {
                ticket_status: 'pending',
                updated_at: new Date()
            });

            res.json({
                success: true,
                message: 'Check-in annulé',
                reservation: updated
            });

        } catch (error) {
            console.error('❌ Erreur cancelCheckin:', error);
            res.status(500).json({ success: false, error: 'Erreur serveur' });
        }
    }

    /**
     * Supprimer un voyage
     */
    async deleteVoyage(req, res) {
        try {
            const { id } = req.params; // id voyage

            const { error } = await SupabaseService.client
                .from('voyages')
                .delete()
                .eq('id_voyage', id);

            if (error) {
                throw error;
            }

            res.json({
                success: true,
                message: 'Voyage supprimé avec succès'
            });

        } catch (error) {
            console.error('❌ Erreur deleteVoyage:', error);
            res.status(500).json({ success: false, error: 'Erreur serveur' });
        }
    }
}

module.exports = new VoyageHistoryController();
