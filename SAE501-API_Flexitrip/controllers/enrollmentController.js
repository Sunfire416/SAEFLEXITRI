/**
 * Contrôleur Enrollment - Enregistrement biométrique initial
 * 
 * Endpoints :
 * - POST /enrollment/register : Créer enrollment (OCR + Face Match)
 * - POST /enrollment/verify : Vérifier enrollment existant
 * - GET /enrollment/:user_id : Récupérer enrollment utilisateur
 * - DELETE /enrollment/:enrollment_id : Révoquer consentement (RGPD)
 */

const ocrService = require('../services/ocrService');
const faceMatchService = require('../services/faceMatchService');
const qrService = require('../services/qrService');
const encryptionService = require('../services/encryptionService');

// ==========================================
// 🆕 POINT 4 - IMPORTS NOTIFICATIONS
// ==========================================
const notificationService = require('../services/notificationService');
const agentService = require('../services/agentService');

const enrollmentDisabled = (res) => {
  return res.status(501).json({
    success: false,
    error: 'Enrollment biométrique désactivé (Mongo retiré)'
  });
};

/**
 * POST /enrollment/register
 * Créer un nouvel enrollment biométrique
 */
exports.registerEnrollment = async (req, res) => {
  return enrollmentDisabled(res);
  try {
    const {
      user_id,
      reservation_id,
      document_type, // 'passeport' ou 'cni'
      id_photo_recto, // base64
      id_photo_verso, // base64 (optionnel pour passeport)
      selfie_photo, // base64
      selfie_video_frames, // array base64 (optionnel, pour liveness)
      consent_given,
      consent_ip
    } = req.body;

    // Validation basique
    if (!user_id || !id_photo_recto || !selfie_photo || !document_type) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis manquants : user_id, id_photo_recto, selfie_photo, document_type'
      });
    }

    if (!consent_given) {
      return res.status(400).json({
        success: false,
        error: 'Consentement RGPD requis'
      });
    }

    // Vérifier si enrollment existe déjà
    const existingEnrollment = await EnrollmentBiometric.findActiveByUserId(user_id);
    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        error: 'Un enrollment actif existe déjà pour cet utilisateur',
        enrollment_id: existingEnrollment.enrollment_id
      });
    }

    console.log(`🔍 Démarrage enrollment pour user ${user_id}...`);

    // ==========================================
    // ÉTAPE 1 : OCR - Extraction données identité
    // ==========================================
    console.log('📄 Étape 1/5 : OCR en cours...');
    const ocrResult = await ocrService.processOCR(id_photo_recto, document_type);

    if (!ocrResult.success || ocrResult.data.confidence_moyenne < 90) {
      return res.status(400).json({
        success: false,
        error: 'Qualité OCR insuffisante. Veuillez prendre une photo plus nette.',
        ocr_confidence: ocrResult.data?.confidence_moyenne || 0
      });
    }

    console.log(`✅ OCR réussi : ${ocrResult.data.nom} ${ocrResult.data.prenom} (${ocrResult.data.confidence_moyenne}%)`);

    // ==========================================
    // ÉTAPE 2 : Face Match - Selfie vs Photo ID
    // ==========================================
    console.log('📷 Étape 2/5 : Face matching...');
    const faceMatchResult = await faceMatchService.compareFaces(selfie_photo, id_photo_recto);

    if (!faceMatchResult.match || faceMatchResult.confidence < 85) {
      return res.status(400).json({
        success: false,
        error: 'Le selfie ne correspond pas à la photo sur la pièce d\'identité',
        face_match_confidence: faceMatchResult.confidence
      });
    }

    console.log(`✅ Face match réussi : ${faceMatchResult.confidence}%`);

    // ==========================================
    // ÉTAPE 3 : Liveness Check (optionnel)
    // ==========================================
    let livenessResult = { is_live: false, confidence: 0 };
    if (selfie_video_frames && selfie_video_frames.length >= 3) {
      console.log('🎥 Étape 3/5 : Liveness detection...');
      livenessResult = await faceMatchService.verifyLiveness(selfie_video_frames);
      
      if (!livenessResult.is_live) {
        return res.status(400).json({
          success: false,
          error: 'Détection de vivacité échouée. Veuillez réessayer avec une vraie personne.',
          liveness_confidence: livenessResult.confidence
        });
      }
      
      console.log(`✅ Liveness vérifié : ${livenessResult.confidence}%`);
    } else {
      console.log('⚠️ Liveness skippé (pas de vidéo fournie)');
    }

    // ==========================================
    // ÉTAPE 4 : Génération template biométrique
    // ==========================================
    console.log('🔐 Étape 4/5 : Génération template biométrique...');
    const faceEncoding = await faceMatchService.generateFaceEncoding(selfie_photo);
    const faceEncodingHash = encryptionService.hashFaceEncoding(faceEncoding);
    
    // Chiffrer le template (RGPD)
    const biometricTemplate = encryptionService.encryptBiometricData({
      face_encoding: faceEncoding,
      landmarks: faceMatchResult.face_landmarks,
      quality: faceMatchResult.face_quality,
      created_at: new Date().toISOString()
    });

    console.log('✅ Template biométrique chiffré');

    // ==========================================
    // ÉTAPE 5 : Génération QR Code Enrollment
    // ==========================================
    console.log('📱 Étape 5/5 : Génération QR code...');
    const enrollmentId = qrService.generateSecureId('ENR', user_id);
    
    const qrData = await qrService.generateEnrollmentQR({
      enrollment_id: enrollmentId,
      user_id: user_id,
      reservation_id: reservation_id || null,
      nom: ocrResult.data.nom,
      prenom: ocrResult.data.prenom,
      date_naissance: ocrResult.data.date_naissance
    });

    console.log('✅ QR code généré');

    // ==========================================
    // CRÉATION ENROLLMENT DANS MONGODB
    // ==========================================
    const enrollmentData = {
      enrollment_id: enrollmentId,
      user_id: user_id,
      reservation_id: reservation_id || null,
      
      identity_data: {
        nom: ocrResult.data.nom,
        prenom: ocrResult.data.prenom,
        date_naissance: new Date(ocrResult.data.date_naissance),
        numero_id: ocrResult.data.numero_id,
        nationalite: ocrResult.data.nationalite || 'FR',
        type_document: document_type
      },
      
      images: {
        id_photo_recto: id_photo_recto,
        id_photo_verso: id_photo_verso || null,
        selfie_photo: selfie_photo,
        selfie_video_frames: selfie_video_frames || []
      },
      
      biometric_template: biometricTemplate,
      face_encoding: faceEncoding,
      face_encoding_hash: faceEncodingHash,
      
      quality_scores: {
        ocr_confidence: ocrResult.data.confidence_moyenne,
        face_match_confidence: faceMatchResult.confidence,
        liveness_confidence: livenessResult.confidence || 0,
        liveness_verified: livenessResult.is_live,
        image_quality: {
          brightness: faceMatchResult.face_quality.Brightness || 0,
          sharpness: faceMatchResult.face_quality.Sharpness || 0,
          face_detected: faceMatchResult.face_detected
        }
      },
      
      qr_enrollment: {
        qr_data_url: qrData.qr_data_url,
        qr_url: qrData.qr_url,
        qr_payload: qrData.qr_payload
      },
      
      consent: {
        consent_given: true,
        consent_date: new Date(),
        consent_ip: consent_ip || req.ip,
        consent_text_version: 'v1.0'
      },
      
      status: 'active',
      
      verification_status: {
        ocr_verified: ocrResult.success,
        face_verified: faceMatchResult.match,
        liveness_verified: livenessResult.is_live,
        manual_review_required: false
      },
      
      created_at: new Date(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
      
      metadata: {
        device_info: req.headers['user-agent'],
        enrollment_source: 'web_app'
      }
    };

    const newEnrollment = await EnrollmentBiometric.create(enrollmentData);

    console.log(`🎉 Enrollment ${enrollmentId} créé avec succès pour user ${user_id}`);

    // ==========================================
    // 🆕 POINT 4 - NOTIFICATION ENROLLMENT
    // ==========================================
    try {
      await notificationService.sendEnrollmentSuccess(user_id, {
        enrollment_id: enrollmentId,
        identity_data: enrollmentData.identity_data
      });
      console.log('✅ Notification enrollment envoyée');
    } catch (notifError) {
      console.error('⚠️ Erreur notification (enrollment sauvegardé quand même):', notifError);
    }
    // ==========================================

    // Réponse finale
    res.status(201).json({
      success: true,
      message: 'Enrollment créé avec succès',
      enrollment_id: enrollmentId,
      qr_data_url: qrData.qr_data_url,
      qr_url: qrData.qr_url,
      identity: {
        nom: ocrResult.data.nom,
        prenom: ocrResult.data.prenom,
        numero_id: ocrResult.data.numero_id
      },
      quality_scores: {
        ocr: ocrResult.data.confidence_moyenne,
        face_match: faceMatchResult.confidence,
        liveness: livenessResult.confidence
      },
      expires_at: enrollmentData.expires_at
    });

  } catch (error) {
    console.error('❌ Erreur enrollment:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'enrollment',
      details: error.message
    });
  }
};

/**
 * POST /enrollment/verify
 * Vérifier un enrollment existant (pour check-in)
 */
exports.verifyEnrollment = async (req, res) => {
  return enrollmentDisabled(res);
  try {
    const { enrollment_id, live_photo } = req.body;

    if (!enrollment_id || !live_photo) {
      return res.status(400).json({
        success: false,
        error: 'enrollment_id et live_photo requis'
      });
    }

    // Récupérer enrollment
    const result = await EnrollmentBiometric.findAndValidate(enrollment_id);
    
    if (!result.valid) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    const enrollment = result.enrollment;

    // Comparer photo live avec selfie enrollment
    const faceMatchResult = await faceMatchService.compareFaces(
      live_photo,
      enrollment.images.selfie_photo
    );

    if (!faceMatchResult.match || faceMatchResult.confidence < 85) {
      return res.status(401).json({
        success: false,
        verified: false,
        error: 'Visage non reconnu',
        confidence: faceMatchResult.confidence
      });
    }

    // Mettre à jour usage
    await enrollment.recordUsage();

    res.json({
      success: true,
      verified: true,
      enrollment_id: enrollment.enrollment_id,
      user_id: enrollment.user_id,
      identity: enrollment.identity_data,
      confidence: faceMatchResult.confidence,
      last_verified: enrollment.last_verified
    });

  } catch (error) {
    console.error('❌ Erreur vérification enrollment:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
};

/**
 * GET /enrollment/:user_id
 * Récupérer enrollment d'un utilisateur
 */
exports.getEnrollmentByUserId = async (req, res) => {
  return enrollmentDisabled(res);
  try {
    const { user_id } = req.params;

    // Vérifier que l'utilisateur demande bien son propre enrollment
    if (req.user && req.user.id !== parseInt(user_id)) {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }

    const enrollment = await EnrollmentBiometric.findActiveByUserId(parseInt(user_id));

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Aucun enrollment actif trouvé'
      });
    }

    // Ne pas renvoyer les données sensibles
    res.json({
      success: true,
      enrollment: {
        enrollment_id: enrollment.enrollment_id,
        user_id: enrollment.user_id,
        identity: enrollment.identity_data,
        qr_data_url: enrollment.qr_enrollment.qr_data_url,
        status: enrollment.status,
        created_at: enrollment.created_at,
        expires_at: enrollment.expires_at,
        usage_count: enrollment.usage_count,
        last_verified: enrollment.last_verified,
        quality_scores: enrollment.quality_scores
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération enrollment:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
};

/**
 * DELETE /enrollment/:enrollment_id
 * Révoquer consentement (RGPD - Droit à l'oubli)
 */
exports.revokeConsent = async (req, res) => {
  return enrollmentDisabled(res);
  try {
    const { enrollment_id } = req.params;

    const enrollment = await EnrollmentBiometric.findOne({ enrollment_id });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment non trouvé'
      });
    }

    // Vérifier autorisation (utilisateur doit être propriétaire)
    if (req.user && req.user.id !== enrollment.user_id) {
      return res.status(403).json({
        success: false,
        error: 'Non autorisé'
      });
    }

    // Révoquer consentement
    await enrollment.revokeConsent();

    console.log(`🔒 Consentement révoqué pour enrollment ${enrollment_id}`);

    res.json({
      success: true,
      message: 'Consentement révoqué avec succès',
      enrollment_id: enrollment_id,
      revoked_at: enrollment.consent.revocation_date
    });

  } catch (error) {
    console.error('❌ Erreur révocation consentement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
};

/**
 * DELETE /enrollment/:enrollment_id/anonymize
 * Anonymiser données (RGPD - Droit à l'oubli complet)
 */
exports.anonymizeEnrollment = async (req, res) => {
  return enrollmentDisabled(res);
  try {
    const { enrollment_id } = req.params;

    const enrollment = await EnrollmentBiometric.findOne({ enrollment_id });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment non trouvé'
      });
    }

    // Vérifier autorisation
    if (req.user && req.user.id !== enrollment.user_id) {
      return res.status(403).json({
        success: false,
        error: 'Non autorisé'
      });
    }

    // Anonymiser
    await enrollment.anonymize();

    console.log(`🗑️ Enrollment ${enrollment_id} anonymisé`);

    res.json({
      success: true,
      message: 'Données anonymisées avec succès (RGPD)',
      enrollment_id: enrollment_id
    });

  } catch (error) {
    console.error('❌ Erreur anonymisation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
};

module.exports = exports;
