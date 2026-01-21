const SupabaseService = require('../services/SupabaseService');

/**
 * Controller Voyage History - Supabase
 * Gestion historique, QR, annulations
 */
class VoyageHistoryController {
  /**
   * Récupérer l'historique des voyages
   */
  async getHistory(req, res) {
    try {
      const user_id = req.query.user_id || req.user?.user_id;

      if (!user_id) {
        return res.status(400).json({ success: false, error: 'user_id requis' });
      }

      const role = req.user?.role || 'PMR';
      const voyages = await SupabaseService.getVoyagesByUser(user_id, role);

      res.json({
        success: true,
        count: voyages.length,
        voyages
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

      res.json({ success: true, voyage });
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
      const { id } = req.params;

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
        qr_code: reservation.ticket_qr_code,
        qr_data: reservation.qr_code_data
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
      const { id } = req.params;

      const { error } = await SupabaseService.client
        .from('voyages')
        .delete()
        .eq('id_voyage', id);

      if (error) throw error;

      res.json({ success: true, message: 'Voyage supprimé avec succès' });
    } catch (error) {
      console.error('❌ Erreur deleteVoyage:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }
}

module.exports = new VoyageHistoryController();
