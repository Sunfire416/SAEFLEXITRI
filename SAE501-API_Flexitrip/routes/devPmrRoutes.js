const express = require('express');
const router = express.Router();
const supabaseService = require('../services/SupabaseService');

router.get('/pmr-missions/latest', async (req, res) => {
  try {
    // Récupérer la mission la plus récente avec jointures sur agent et réservation
    const { data: missionData, error: missionError } = await supabaseService.client
      .from('pmr_missions')
      .select(`
        id,
        reservation_id,
        agent_id,
        status,
        agent_lat,
        agent_lng,
        eta,
        updated_at
      `)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (missionError) {
      console.error('❌ pmr-missions/latest error:', {
        message: missionError.message,
        code: missionError.code,
        details: missionError.details,
        hint: missionError.hint,
      });
      return res.status(500).json({ success: false, error: missionError.message, code: missionError.code });
    }

    if (!missionData) {
      return res.status(404).json({ success: false, error: 'Aucune mission trouvée' });
    }

    // Récupérer les infos agent
    const { data: agentData, error: agentError } = await supabaseService.client
      .from('users')
      .select('user_id, name, surname')
      .eq('user_id', missionData.agent_id)
      .single();

    if (agentError) {
      console.warn('⚠️ Agent not found:', missionData.agent_id);
    }

    // Récupérer les infos réservation
    const { data: reservationData, error: reservationError } = await supabaseService.client
      .from('reservations')
      .select(`
        reservation_id,
        num_reza_mmt,
        num_pax,
        booking_reference,
        type_transport,
        assistance_pmr,
        lieu_depart,
        lieu_arrivee,
        date_depart,
        date_arrivee,
        ticket_qr_code,
        qr_code_data,
        pmr_options
      `)
      .eq('reservation_id', missionData.reservation_id)
      .single();

    if (reservationError) {
      console.warn('⚠️ Reservation not found:', missionData.reservation_id);
    }

    // Construire l'objet mission enrichi
    const enrichedMission = {
      id: missionData.id,
      status: missionData.status,
      agent_position: {
        lat: missionData.agent_lat,
        lng: missionData.agent_lng,
        coordinates: [missionData.agent_lng, missionData.agent_lat], // [lng, lat] pour Mapbox
      },
      eta_seconds: missionData.eta, // Temps en secondes
      agent: agentData ? {
        user_id: agentData.user_id,
        name: agentData.name,
        surname: agentData.surname,
        full_name: `${agentData.name} ${agentData.surname}`,
      } : null,
      reservation: reservationData ? {
        reservation_id: reservationData.reservation_id,
        num_reza_mmt: reservationData.num_reza_mmt,
        booking_reference: reservationData.booking_reference,
        type_transport: reservationData.type_transport,
        assistance_pmr: reservationData.assistance_pmr,
        lieu_depart: reservationData.lieu_depart,
        lieu_arrivee: reservationData.lieu_arrivee,
        date_depart: reservationData.date_depart,
        date_arrivee: reservationData.date_arrivee,
        ticket_qr_code: reservationData.ticket_qr_code,
        qr_code_data: reservationData.qr_code_data,
        pmr_options: reservationData.pmr_options,
      } : null,
      updated_at: missionData.updated_at,
    };

    console.log('✅ Mission enrichie récupérée:', enrichedMission.id);
    res.json({ success: true, mission: enrichedMission });

  } catch (err) {
    console.error('❌ pmr-missions/latest exception:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
