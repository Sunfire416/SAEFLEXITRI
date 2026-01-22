const SupabaseService = require('../services/SupabaseService');
const notificationService = require('../services/notificationService');

/**
 * GET /prise-en-charge/:token
 * Récupère les détails de la prise en charge par token (PUBLIC)
 */
exports.getByToken = async (req, res) => {
  try {
    const { token } = req.params;

    console.log(`📋 Récupération prise en charge avec token: ${token}`);

    const { data: reservation, error: reservationError } = await SupabaseService.client
      .from('reservations')
      .select(`
        *,
        user:users(user_id, name, surname, phone, type_handicap),
        voyage:voyages(id_voyage, date_debut, date_fin, lieu_depart, lieu_arrivee, etapes)
      `)
      .or(`reservation_id.eq.${token},num_reza_mmt.eq.${token},booking_reference.eq.${token}`)
      .single();

    if (reservationError || !reservation) {
      return res.status(404).json({
        success: false,
        error: 'Prise en charge introuvable'
      });
    }

    const { data: mission } = await SupabaseService.client
      .from('pmr_missions')
      .select('*')
      .eq('reservation_id', reservation.reservation_id)
      .single();

    const etapeIndex = Math.max((reservation.etape_voyage || 1) - 1, 0);
    let segmentDetails = null;
    if (reservation.voyage?.etapes && Array.isArray(reservation.voyage.etapes)) {
      const etape = reservation.voyage.etapes[etapeIndex];
      if (etape) {
        segmentDetails = {
          mode: etape.type || reservation.type_transport,
          line: etape.line || null,
          operator: etape.compagnie || 'Unknown',
          departure_station: etape.departure_station || etape.adresse_1 || reservation.lieu_depart,
          arrival_station: etape.arrival_station || etape.adresse_2 || reservation.lieu_arrivee,
          departure_time: etape.departure_time || reservation.date_depart,
          arrival_time: etape.arrival_time || reservation.date_arrivee,
          vehicle_type: etape.vehicle_type || null
        };
      }
    }

    const validation = reservation.pmr_options?.validation || null;

    res.json({
      success: true,
      prise_en_charge: {
        id: mission?.id || null,
        status: mission?.status || 'pending',
        etape_numero: reservation.etape_voyage || 1,
        location: mission?.agent_lat && mission?.agent_lng ? {
          lat: mission.agent_lat,
          lng: mission.agent_lng
        } : null,
        validated_at: validation?.validated_at || null,
        validated_by: validation?.validated_by || null,
        notes: validation?.notes || null,
        segment: segmentDetails,
        user: reservation.user ? {
          user_id: reservation.user.user_id,
          name: reservation.user.name,
          surname: reservation.user.surname,
          phone: reservation.user.phone,
          type_handicap: reservation.user.type_handicap
        } : null,
        agent: mission?.agent_id ? { user_id: mission.agent_id } : null,
        reservation: {
          reservation_id: reservation.reservation_id,
          num_reza: reservation.num_reza_mmt,
          type_transport: reservation.type_transport,
          lieu_depart: reservation.lieu_depart,
          lieu_arrivee: reservation.lieu_arrivee,
          date_depart: reservation.date_depart,
          assistance_pmr: reservation.assistance_pmr
        },
        voyage: reservation.voyage ? {
          id_voyage: reservation.voyage.id_voyage,
          depart: reservation.voyage.lieu_depart,
          arrivee: reservation.voyage.lieu_arrivee,
          date_debut: reservation.voyage.date_debut,
          date_fin: reservation.voyage.date_fin,
          etapes: reservation.voyage.etapes || []
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Erreur getByToken:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /prise-en-charge/:token/validate
 * Valide la prise en charge (PUBLIC)
 */
exports.validate = async (req, res) => {
  try {
    const { token } = req.params;
    const { validated_by, agent_qr_public_id } = req.body;

    const trimmedValidatedBy = typeof validated_by === 'string' ? validated_by.trim() : '';
    const trimmedQr = typeof agent_qr_public_id === 'string' ? agent_qr_public_id.trim() : '';

    if (!trimmedQr && !trimmedValidatedBy) {
      return res.status(400).json({
        success: false,
        error: 'Le champ agent_qr_public_id est requis (validated_by toléré pour compatibilité)'
      });
    }

    const { data: reservation, error: reservationError } = await SupabaseService.client
      .from('reservations')
      .select('*')
      .or(`reservation_id.eq.${token},num_reza_mmt.eq.${token},booking_reference.eq.${token}`)
      .single();

    if (reservationError || !reservation) {
      return res.status(404).json({
        success: false,
        error: 'Prise en charge introuvable'
      });
    }

    const { data: mission } = await SupabaseService.client
      .from('pmr_missions')
      .select('*')
      .eq('reservation_id', reservation.reservation_id)
      .single();

    if (mission && mission.status === 'validated') {
      return res.status(400).json({
        success: false,
        error: 'Prise en charge déjà validée'
      });
    }

    let resolvedValidatedBy = trimmedValidatedBy || 'Agent PMR';
    let resolvedAgentUserId = null;
    const resolvedMethod = trimmedQr ? 'qr' : 'manual';

    if (trimmedQr) {
      const { data: agentUser } = await SupabaseService.client
        .from('users')
        .select('user_id, name, surname, role')
        .eq('agent_qr_public_id', trimmedQr)
        .single();

      if (!agentUser || agentUser.role !== 'Agent') {
        return res.status(400).json({
          success: false,
          error: 'QR Agent invalide (aucun compte Agent trouvé)'
        });
      }

      resolvedAgentUserId = agentUser.user_id;
      resolvedValidatedBy = `${agentUser.surname} ${agentUser.name} - Agent`;
    }

    if (mission) {
      await SupabaseService.client
        .from('pmr_missions')
        .update({
          status: 'validated',
          agent_id: resolvedAgentUserId || mission.agent_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', mission.id);
    }

    const validationPayload = {
      validated_by: resolvedValidatedBy,
      validated_at: new Date().toISOString(),
      validation_method: resolvedMethod,
      validated_agent_user_id: resolvedAgentUserId || null
    };

    const mergedPmrOptions = {
      ...(reservation.pmr_options || {}),
      validation: validationPayload
    };

    await SupabaseService.client
      .from('reservations')
      .update({ pmr_options: mergedPmrOptions })
      .eq('reservation_id', reservation.reservation_id);

    try {
      await notificationService.createNotification({
        user_id: reservation.user_id,
        type: 'PRISE_EN_CHARGE_VALIDATED',
        title: '✅ Prise en charge validée',
        message: `Votre prise en charge pour l'étape ${reservation.etape_voyage || 1} a été validée par ${resolvedValidatedBy}.`,
        data: {
          reservation_id: reservation.reservation_id,
          validated_by: resolvedValidatedBy,
          validated_at: validationPayload.validated_at,
          etape_numero: reservation.etape_voyage || 1
        },
        priority: 'high',
        icon: '✅',
        action_url: `/suivi-prise-en-charge/${reservation.reservation_id}`
      });
    } catch (notificationError) {
      console.error('⚠️ Erreur notification prise en charge:', notificationError);
    }

    res.json({
      success: true,
      message: 'Prise en charge validée avec succès',
      prise_en_charge: {
        id: mission?.id || null,
        status: 'validated',
        validated_at: validationPayload.validated_at,
        validated_by: resolvedValidatedBy,
        validation_method: resolvedMethod,
        validated_agent_user_id: resolvedAgentUserId,
        reservation_id: reservation.reservation_id,
        etape_numero: reservation.etape_voyage || 1
      }
    });

  } catch (error) {
    console.error('❌ Erreur validation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /prise-en-charge/reservation/:reservation_id
 */
exports.getByReservation = async (req, res) => {
  try {
    const { reservation_id } = req.params;

    const { data: reservation, error: reservationError } = await SupabaseService.client
      .from('reservations')
      .select(`
        *,
        user:users(user_id, name, surname, phone, type_handicap),
        voyage:voyages(id_voyage, date_debut, date_fin, lieu_depart, lieu_arrivee, etapes)
      `)
      .eq('reservation_id', reservation_id)
      .single();

    if (reservationError || !reservation) {
      return res.status(404).json({
        success: false,
        error: 'Réservation introuvable'
      });
    }

    const { data: missions } = await SupabaseService.client
      .from('pmr_missions')
      .select('*')
      .eq('reservation_id', reservation_id);

    res.json({
      success: true,
      count: missions?.length || 0,
      reservation,
      prises_en_charge: missions || []
    });
  } catch (error) {
    console.error('❌ Erreur getByReservation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /prise-en-charge/agent/:agent_id
 */
exports.getByAgent = async (req, res) => {
  try {
    const { agent_id } = req.params;
    const { status } = req.query;

    let query = SupabaseService.client
      .from('pmr_missions')
      .select('*, reservation:reservations(*)')
      .eq('agent_id', agent_id)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      prises_en_charge: data
    });
  } catch (error) {
    console.error('❌ Erreur getByAgent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
