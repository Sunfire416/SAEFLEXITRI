const SupabaseService = require('../services/SupabaseService');

/**
 * Controller Voyage History - Supabase
 * Gestion historique, QR, annulations
 */
class VoyageHistoryController {
  async getHistory(req, res) {
    try {
      const user_id = req.query.user_id || req.user?.user_id;
      const role = req.user?.role || 'PMR';

      if (!user_id) {
        return res.status(400).json({ success: false, error: 'user_id requis' });
      }

      const voyages = await SupabaseService.getVoyagesByUser(user_id, role);

      const { data: reservations, error } = await SupabaseService.client
        .from('reservations')
        .select('*')
        .eq('user_id', user_id)
        .order('date_reservation', { ascending: false });

      if (error) throw error;

      const grouped = new Map();
      (voyages || []).forEach((voyage) => {
        grouped.set(voyage.id_voyage, {
          voyage_id: voyage.id_voyage,
          depart: voyage.lieu_depart,
          arrivee: voyage.lieu_arrivee,
          date_debut: voyage.date_debut,
          date_fin: voyage.date_fin,
          etapes: voyage.etapes || [],
          prix_total: voyage.prix_total || 0,
          bagage: voyage.bagage || [],
          status: voyage.status || 'planned',
          reservations: []
        });
      });

      (reservations || []).forEach((reservation) => {
        const key = reservation.id_voyage || `standalone_${reservation.reservation_id}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            voyage_id: key,
            depart: reservation.lieu_depart,
            arrivee: reservation.lieu_arrivee,
            date_debut: reservation.date_depart,
            date_fin: reservation.date_arrivee,
            etapes: [],
            prix_total: 0,
            bagage: [],
            status: reservation.ticket_status || 'pending',
            reservations: []
          });
        }
        grouped.get(key).reservations.push(reservation);
      });

      const allVoyages = Array.from(grouped.values()).sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut));

      res.json({
        success: true,
        voyages: allVoyages,
        total: allVoyages.length
      });
    } catch (error) {
      console.error('❌ Erreur getHistory:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }

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
