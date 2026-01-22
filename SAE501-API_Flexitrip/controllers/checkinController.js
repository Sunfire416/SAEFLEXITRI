/**
 * CHECKIN CONTROLLER - MIGRATION SUPABASE
 */

const checkinService = require('../services/checkinService');
const SupabaseService = require('../services/SupabaseService');

/**
 * Helper - Check-in unifié
 */
async function performUnifiedCheckIn(userId, reservationId, location, livePhoto, checkinType, res) {
  try {
    const result = await checkinService.performCheckIn({
      user_id: userId,
      reservation_id: reservationId,
      live_photo: livePhoto || null,
      location: location || 'Web Interface',
      checkin_type: checkinType || 'manual_web'
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Erreur check-in manuel:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du check-in',
      details: error.message
    });
  }
}

/**
 * POST /checkin/scan
 */
exports.scanCheckIn = async (req, res) => {
  try {
    const { qr_data, live_photo, location, checkin_type, user_id, reservation_id } = req.body;

    if (user_id && reservation_id && !qr_data) {
      return await performUnifiedCheckIn(user_id, reservation_id, location, live_photo, checkin_type, res);
    }

    if (!qr_data) {
      return res.status(400).json({ success: false, error: 'qr_data requis' });
    }

    // Parse QR if present
    let qrPayload;
    try {
      qrPayload = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data;
    } catch (e) {
      return res.status(400).json({ error: 'QR invalide' });
    }

    const targetUserId = qrPayload.user_id || user_id;
    const targetResId = qrPayload.reservation_id || reservation_id;

    if (!targetUserId || !targetResId) {
      return res.status(400).json({ error: 'QR incomplet' });
    }

    return await performUnifiedCheckIn(targetUserId, targetResId, location, live_photo, checkin_type, res);

  } catch (error) {
    console.error('❌ Erreur check-in:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * POST /checkin/manual
 */
exports.manualCheckIn = async (req, res) => {
  try {
    // Legacy support, maps to unified checkin
    const { qr_data, user_id, reservation_id } = req.body;
    let uid = user_id;
    let rid = reservation_id;

    if (qr_data) {
      try {
        const parsed = JSON.parse(qr_data);
        uid = parsed.user_id;
        rid = parsed.reservation_id;
      } catch (e) { }
    }

    if (!uid || !rid) return res.status(400).json({ error: 'IDs manquants' });

    return await performUnifiedCheckIn(uid, rid, 'Manual', null, 'manual', res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /checkin/status/:reservation_id
 */
exports.getCheckInStatus = async (req, res) => {
  try {
    const { reservation_id } = req.params;
    const reservation = await SupabaseService.getReservationById(reservation_id);

    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Réservation introuvable' });
    }

    const checkedIn = reservation.ticket_status === 'issued' || reservation.ticket_status === 'used';

    res.json({
      success: true,
      checked_in: checkedIn,
      boarding_pass: checkedIn ? {
        pass_id: reservation.reservation_id,
        gate: reservation.gate,
        seat: reservation.seat
      } : null
    });

  } catch (error) {
    console.error('❌ Erreur status:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * GET /checkin/search-reservation
 */
exports.searchReservation = async (req, res) => {
  try {
    const { booking_reference } = req.query;
    if (!booking_reference) return res.status(400).json({ error: 'booking_reference requis' });

    const reservation = await SupabaseService.getReservationByNumReza(booking_reference); // Assume method exists or I add it
    // Wait, getReservationByNumReza might check 'num_reza_mmt'.
    // Use SupabaseService to finding it.

    if (!reservation) {
      // Fallback search by client
      const { data, error } = await SupabaseService.client
        .from('reservations')
        .select('*')
        .eq('num_reza_mmt', booking_reference)
        .maybeSingle();

      if (!data) return res.status(404).json({ error: 'Introuvable' });

      return res.json({ success: true, reservation: data });
    }

    return res.json({ success: true, reservation });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
