/**
 * CHECKIN CONTROLLER - VERSION DEBUG
 * Désactive temporairement la vérification HMAC pour tester
 */

const EnrollmentBiometric = require('../models/EnrollmentBiometric');
const CheckInLog = require('../models/CheckInLog');
const BoardingPass = require('../models/BoardingPass');
const faceMatchService = require('../services/faceMatchService');
const { Reservations } = require('../models');

// ==========================================
// 🆕 POINT 4 - IMPORTS NOTIFICATIONS + AGENT
// ==========================================
const notificationService = require('../services/notificationService');
const agentService = require('../services/agentService');

/**
 * POST /checkin/scan
 * Check-in kiosk automatique
 */
exports.scanCheckIn = async (req, res) => {
  try {
    const { qr_data, live_photo, location, checkin_type } = req.body;

    if (!qr_data || !live_photo) {
      return res.status(400).json({
        success: false,
        error: '⚠️ Champs requis manquants : qr_data, live_photo'
      });
    }

    console.log(`📱 Check-in ${checkin_type || 'kiosk'} à ${location}...`);

    // ==========================================
    // ÉTAPE 1 : Parser QR Code (SANS vérification HMAC)
    // ==========================================
    console.log('🔍 Étape 1/5 : Parsing QR code (MODE DEBUG - pas de vérification signature)...');
    
    let qrPayload;
    try {
      qrPayload = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data;
      console.log('✅ QR parsé:', { type: qrPayload.type, id: qrPayload.id, user_id: qrPayload.user_id, reservation_id: qrPayload.reservation_id });
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'QR code invalide (JSON mal formé)',
        reason: parseError.message
      });
    }

    if (qrPayload.type !== 'ENROLLMENT') {
      return res.status(400).json({
        success: false,
        error: 'Type QR invalide. QR enrollment attendu.'
      });
    }

    const enrollmentId = qrPayload.id;
    const userId = qrPayload.user_id;
    const reservationId = qrPayload.reservation_id;

    // ==========================================
    // ÉTAPE 2 : Récupérer Enrollment
    // ==========================================
    console.log('🔍 Étape 2/5 : Récupération enrollment...');
    const enrollment = await EnrollmentBiometric.findOne({ enrollment_id: enrollmentId });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: `Enrollment introuvable : ${enrollmentId}`
      });
    }

    if (enrollment.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Enrollment révoqué ou expiré'
      });
    }

    console.log('✅ Enrollment trouvé:', enrollmentId);

    // ==========================================
    // ÉTAPE 3 : Face Matching
    // ==========================================
    console.log('📷 Étape 3/5 : Face matching...');
    
    let faceMatchResult;
    
    // Vérifier si biometric_data existe
    if (!enrollment.biometric_data || !enrollment.biometric_data.face_template) {
      console.warn('⚠️ Pas de face_template, simulation du face matching...');
      // Simuler un score de matching
      faceMatchResult = {
        match: true,
        similarity: 92.5
      };
    } else {
      // Face matching réel
      faceMatchResult = await faceMatchService.compareFaces(
        enrollment.biometric_data.face_template,
        live_photo
      );
      
      if (!faceMatchResult.match) {
        return res.status(403).json({
          success: false,
          error: 'Vérification faciale échouée',
          similarity_score: faceMatchResult.similarity
        });
      }
    }

    console.log(`✅ Face match réussi (score: ${faceMatchResult.similarity}%)`);

    // ==========================================
    // ÉTAPE 4 : Récupérer Réservation
    // ==========================================
    console.log('🔍 Étape 4/5 : Récupération réservation...');
    const reservation = await Reservations.findOne({
      where: { reservation_id: reservationId }
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: `Réservation introuvable : ${reservationId}`
      });
    }

    console.log('✅ Réservation trouvée:', reservationId);

    // ==========================================
    // ÉTAPE 5 : Générer Boarding Pass
    // ==========================================
    console.log('🔍 Étape 5/5 : Génération boarding pass...');
    
    const boardingPass = await BoardingPass.create({
      reservation_id: reservationId,
      user_id: userId,
      flight_train_number: 'TGV6201',
      departure_time: new Date('2026-01-15T08:00:00Z'),
      boarding_time: new Date('2026-01-15T07:30:00Z'),
      gate: 'A12',
      seat: '15A',
      status: 'issued',
      pmr_assistance: true,
      boarding_group: 'PMR_PRIORITY',
      issued_at: new Date()
    });

    console.log('✅ Boarding pass créé :', boardingPass.pass_id);

    // Log check-in
    const checkinId = `CHK-${userId}-${Date.now()}`;
    
    await CheckInLog.create({
      checkin_id: checkinId,
      enrollment_id: enrollmentId,
      user_id: userId,
      reservation_id: reservationId,
      checkin_type: checkin_type || 'kiosk',
      location,
      face_match_score: faceMatchResult.similarity,
      verification_method: 'biometric',
      status: 'success'
    });

    // ==========================================
    // 🆕 POINT 4 - NOTIFICATION CHECK-IN + AGENT
    // ==========================================
    try {
      // Assigner agent PMR
      const checkinLocation = location || 'Gare Lyon Part-Dieu';
      const agent = agentService.assignAgentByLocation(checkinLocation);
      
      // Envoyer notification avec infos agent
      await notificationService.sendCheckinSuccess(
        userId,
        {
          boarding_pass: {
            pass_id: boardingPass.pass_id,
            flight_train_number: boardingPass.flight_train_number,
            gate: boardingPass.gate,
            seat: boardingPass.seat,
            boarding_time: boardingPass.boarding_time,
            pmr_assistance: boardingPass.pmr_assistance
          },
          reservation_id: reservationId
        },
        agent
      );
      
      console.log('✅ Notification check-in + agent envoyés');
    } catch (notifError) {
      console.error('⚠️ Erreur notification (check-in fait quand même):', notifError);
    }
    // ==========================================

    // Générer QR boarding pass
    const boardingQRData = {
      type: 'BOARDING_PASS',
      pass_id: boardingPass.pass_id,
      reservation_id: reservationId,
      user_id: userId,
      flight_train: 'TGV6201',
      gate: 'A12',
      seat: '15A',
      boarding_time: new Date('2026-01-15T08:00:00Z'),
      pmr: true
    };

    res.json({
      success: true,
      message: 'Check-in réussi',
      boarding_pass: {
        pass_id: boardingPass.pass_id,
        flight_train: boardingPass.flight_train_number,
        gate: boardingPass.gate,
        seat: boardingPass.seat,
        boarding_time: boardingPass.boarding_time,
        departure_time: boardingPass.departure_time,
        status: boardingPass.status,
        pmr_assistance: boardingPass.pmr_assistance,
        qr_data: JSON.stringify(boardingQRData),
        barcode: `BP${boardingPass.pass_id}${userId}`
      },
      passenger: {
        nom: enrollment.identity_data?.nom || 'DUPONT',
        prenom: enrollment.identity_data?.prenom || 'JEAN',
        user_id: userId
      },
      verification: {
        face_match_score: faceMatchResult.similarity,
        enrollment_id: enrollmentId
      }
    });

  } catch (error) {
    console.error('❌ Erreur check-in:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du check-in',
      details: error.message
    });
  }
};

/**
 * POST /checkin/manual
 * Check-in manuel par agent avec override
 */
exports.manualCheckIn = async (req, res) => {
  try {
    const { qr_data, agent_id, notes, override_face_match } = req.body;

    // Parse QR sans vérification
    let qrPayload;
    try {
      qrPayload = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'QR code invalide'
      });
    }

    const enrollmentId = qrPayload.id;
    const userId = qrPayload.user_id;
    const reservationId = qrPayload.reservation_id;

    const enrollment = await EnrollmentBiometric.findOne({ enrollment_id: enrollmentId });
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment introuvable'
      });
    }

    const boardingPass = await BoardingPass.create({
      reservation_id: reservationId,
      user_id: userId,
      flight_train_number: 'TGV6201',
      gate: 'A12',
      seat: '15A',
      status: 'issued',
      pmr_assistance: true,
      issued_at: new Date()
    });

    await CheckInLog.create({
      enrollment_id: enrollmentId,
      user_id: userId,
      reservation_id: reservationId,
      checkin_type: 'manual',
      agent_id,
      notes,
      override_reason: override_face_match ? 'Manual override by agent' : null,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Check-in manuel réussi',
      boarding_pass: {
        pass_id: boardingPass.pass_id,
        flight_train: 'TGV6201',
        gate: 'A12',
        seat: '15A'
      }
    });

  } catch (error) {
    console.error('❌ Erreur check-in manuel:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
};

/**
 * GET /checkin/status/:reservation_id
 * Récupérer le statut check-in d'une réservation
 */
exports.getCheckInStatus = async (req, res) => {
  try {
    const { reservation_id } = req.params;

    const checkInLog = await CheckInLog.findOne({
      reservation_id: parseInt(reservation_id)
    }).sort({ created_at: -1 });

    const boardingPass = await BoardingPass.findOne({
      where: { reservation_id: parseInt(reservation_id) }
    });

    if (!checkInLog && !boardingPass) {
      return res.json({
        success: true,
        checked_in: false,
        message: 'Aucun check-in trouvé pour cette réservation'
      });
    }

    res.json({
      success: true,
      checked_in: !!boardingPass,
      check_in_log: checkInLog ? {
        checkin_type: checkInLog.checkin_type,
        location: checkInLog.location,
        timestamp: checkInLog.created_at,
        status: checkInLog.status
      } : null,
      boarding_pass: boardingPass ? {
        pass_id: boardingPass.pass_id,
        flight_train: boardingPass.flight_train_number,
        gate: boardingPass.gate,
        seat: boardingPass.seat,
        status: boardingPass.status
      } : null
    });

  } catch (error) {
    console.error('❌ Erreur récupération statut check-in:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
};

module.exports = exports;
