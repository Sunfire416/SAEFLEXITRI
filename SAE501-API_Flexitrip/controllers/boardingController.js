/**
 * BOARDING CONTROLLER - VERSION DEBUG
 * Désactive vérification HMAC
 */

const BoardingPass = require('../models/BoardingPass');
const EnrollmentBiometric = require('../models/EnrollmentBiometric');
const CheckInLog = require('../models/CheckInLog');
const { Reservations } = require('../models');
const faceMatchService = require('../services/faceMatchService');

// ==========================================
// 🆕 POINT 4 - IMPORTS NOTIFICATIONS + AGENT
// ==========================================
const notificationService = require('../services/notificationService');
const agentService = require('../services/agentService');

/**
 * POST /boarding/validate
 * Validation complète embarquement (QR + Face optionnel)
 */
exports.validateBoarding = async (req, res) => {
  try {
    const { qr_data, live_photo, gate } = req.body;

    if (!qr_data || !gate) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis : qr_data, gate'
      });
    }

    console.log(`🚪 Validation boarding à porte ${gate}...`);

    // Parser QR (MODE DEBUG - pas de vérification HMAC)
    let qrPayload;
    try {
      qrPayload = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data;
      console.log('✅ QR parsé:', { type: qrPayload.type, pass_id: qrPayload.pass_id });
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'QR invalide (JSON mal formé)'
      });
    }

    if (qrPayload.type !== 'BOARDING_PASS') {
      return res.status(400).json({
        success: false,
        error: 'Type QR invalide. QR boarding pass attendu.'
      });
    }

    const passId = qrPayload.pass_id;

    // Récupérer boarding pass
    const boardingPass = await BoardingPass.findOne({
      where: { pass_id: passId }
    });

    if (!boardingPass) {
      return res.status(404).json({
        success: false,
        error: 'Boarding pass non trouvé'
      });
    }

    if (boardingPass.status === 'boarded') {
      return res.status(409).json({
        success: false,
        error: 'Passager déjà embarqué',
        boarded_at: boardingPass.boarded_at
      });
    }

    // Vérifier porte (case-insensitive + trim)
    const normalizedExpectedGate = (boardingPass.gate || '').toLowerCase().trim();
    const normalizedProvidedGate = (gate || '').toLowerCase().trim();
    
    if (normalizedExpectedGate !== normalizedProvidedGate) {
      return res.status(400).json({
        success: false,
        error: `Mauvaise porte. Porte attendue : ${boardingPass.gate}`,
        expected_gate: boardingPass.gate,
        provided_gate: gate
      });
    }

    // Face matching optionnel
    let faceMatchScore = null;
    if (live_photo) {
      const enrollment = await EnrollmentBiometric.findOne({
        user_id: boardingPass.user_id
      });

      if (enrollment?.biometric_data?.face_template) {
        const faceMatch = await faceMatchService.compareFaces(
          enrollment.biometric_data.face_template,
          live_photo
        );
        faceMatchScore = faceMatch.similarity;
      }
    }

    // Marquer comme embarqué
    await boardingPass.update({
      status: 'boarded',
      boarded_at: new Date(),
      gate_scanned_at: new Date()
    });

    console.log('✅ Passager embarqué avec succès');

    // ==========================================
    // 🆕 POINT 4 - NOTIFICATION BOARDING
    // ==========================================
    try {
      const boardingLocation = gate || 'Terminal 2E';
      const agent = agentService.assignAgentByLocation(boardingLocation);
      
      await notificationService.sendBoardingSuccess(
        boardingPass.user_id,
        {
          passenger: {
            user_id: boardingPass.user_id,
            flight_train: boardingPass.flight_train_number,
            gate: boardingPass.gate,
            seat: boardingPass.seat,
            pmr_assistance: boardingPass.pmr_assistance
          }
        },
        agent
      );
      
      console.log('✅ Notification boarding envoyée');
    } catch (notifError) {
      console.error('⚠️ Erreur notification (boarding fait quand même):', notifError);
    }
    // ==========================================

    res.json({
      success: true,
      message: 'Embarquement autorisé',
      access_granted: true,
      passenger: {
        user_id: boardingPass.user_id,
        flight_train: boardingPass.flight_train_number,
        gate: boardingPass.gate,
        seat: boardingPass.seat,
        pmr_assistance: boardingPass.pmr_assistance
      },
      verification: {
        face_match_score: faceMatchScore
      }
    });

  } catch (error) {
    console.error('❌ Erreur validation boarding:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
};

/**
 * POST /boarding/scan-gate
 * Scan rapide QR uniquement (sans face)
 */
exports.scanGate = async (req, res) => {
  try {
    const { qr_data, gate } = req.body;

    if (!qr_data || !gate) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis : qr_data, gate'
      });
    }

    console.log(`⚡ Scan rapide porte ${gate}...`);

    // Parser QR
    let qrPayload;
    try {
      qrPayload = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'QR invalide'
      });
    }

    if (qrPayload.type !== 'BOARDING_PASS') {
      return res.status(400).json({
        success: false,
        error: 'Type QR invalide'
      });
    }

    const passId = qrPayload.pass_id;

    const boardingPass = await BoardingPass.findOne({
      where: { pass_id: passId }
    });

    if (!boardingPass) {
      return res.status(404).json({
        success: false,
        error: 'Boarding pass non trouvé'
      });
    }

    // Vérifier porte (case-insensitive + trim)
    const normalizedExpectedGate = (boardingPass.gate || '').toLowerCase().trim();
    const normalizedProvidedGate = (gate || '').toLowerCase().trim();
    
    if (normalizedExpectedGate !== normalizedProvidedGate) {
      return res.status(400).json({
        success: false,
        error: `Mauvaise porte. Attendue : ${boardingPass.gate}`
      });
    }

    // Marquer comme embarqué
    await boardingPass.update({
      status: 'boarded',
      boarded_at: new Date(),
      gate_scanned_at: new Date()
    });

    console.log('✅ Embarquement rapide réussi');

    // ==========================================
    // 🆕 POINT 4 - NOTIFICATION BOARDING (scan gate)
    // ==========================================
    try {
      const boardingLocation = gate || 'Terminal 2E';
      const agent = agentService.assignAgentByLocation(boardingLocation);
      
      await notificationService.sendBoardingSuccess(
        boardingPass.user_id,
        {
          passenger: {
            user_id: boardingPass.user_id,
            flight_train: boardingPass.flight_train_number,
            gate: boardingPass.gate,
            seat: boardingPass.seat,
            pmr_assistance: boardingPass.pmr_assistance
          }
        },
        agent
      );
      
      console.log('✅ Notification boarding envoyée');
    } catch (notifError) {
      console.error('⚠️ Erreur notification:', notifError);
    }
    // ==========================================

    res.json({
      success: true,
      message: 'Accès autorisé',
      access_granted: true,
      passenger: {
        user_id: boardingPass.user_id,
        flight_train: boardingPass.flight_train_number,
        gate: boardingPass.gate,
        seat: boardingPass.seat,
        pmr_assistance: boardingPass.pmr_assistance
      }
    });

  } catch (error) {
    console.error('❌ Erreur scan gate:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
};

/**
 * GET /boarding/pass/:reservation_id
 * Récupérer boarding pass par reservation_id
 */
exports.getBoardingPass = async (req, res) => {
  try {
    const { reservation_id } = req.params;

    const boardingPass = await BoardingPass.findOne({
      where: { reservation_id: parseInt(reservation_id) }
    });

    if (!boardingPass) {
      return res.status(404).json({
        success: false,
        error: 'Boarding pass introuvable'
      });
    }

    res.json({
      success: true,
      boarding_pass: boardingPass
    });

  } catch (error) {
    console.error('❌ Erreur récupération boarding pass:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

/**
 * PATCH /boarding/pass/:pass_id/cancel
 * Annuler un boarding pass
 */
exports.cancelBoardingPass = async (req, res) => {
  try {
    const { pass_id } = req.params;

    const boardingPass = await BoardingPass.findOne({
      where: { pass_id: parseInt(pass_id) }
    });

    if (!boardingPass) {
      return res.status(404).json({
        success: false,
        error: 'Boarding pass introuvable'
      });
    }

    await boardingPass.update({
      status: 'cancelled',
      cancelled_at: new Date()
    });

    console.log(`✅ Boarding pass ${pass_id} annulé`);

    res.json({
      success: true,
      message: 'Boarding pass annulé'
    });

  } catch (error) {
    console.error('❌ Erreur annulation boarding pass:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

module.exports = exports;
