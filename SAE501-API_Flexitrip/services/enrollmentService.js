/**
 * Service Enrollment Automatisé - ÉTAPE 4
 * 
 * Ce service crée automatiquement des enrollments biométriques
 * pour les workflows MODERATE et FULL (vols nationaux/internationaux)
 * 
 * Utilise des données simulées en attendant l'upload réel de photos
 */

const { EnrollmentBiometric } = require('../models');
const qrService = require('./qrService');
const encryptionService = require('./encryptionService');
const simulationService = require('./simulationService');
const notificationService = require('./notificationService');

/**
 * Crée un enrollment biométrique automatique pour un utilisateur
 * 
 * @param {Object} user - Objet utilisateur (User model)
 * @param {Object} options - Options d'enrollment
 * @param {number} options.reservation_id - ID de la réservation associée
 * @param {string} options.workflow_type - Type de workflow (MODERATE, FULL)
 * @param {Object} options.identity_data - Données d'identité (nom, prénom, etc.)
 * @returns {Promise<Object>} - Données enrollment créé
 */
async function createAutoEnrollment(user, options = {}) {
    try {
        console.log(`🔍 Vérification enrollment pour user ${user.user_id}...`);
        
        // Vérifier si enrollment existe déjà
        const existingEnrollment = await EnrollmentBiometric.findActiveByUserId(user.user_id);
        if (existingEnrollment) {
            console.log(`✅ Enrollment existant trouvé: ${existingEnrollment.enrollment_id}`);
            return {
                success: true,
                enrollment_id: existingEnrollment.enrollment_id,
                already_exists: true,
                qr_data_url: existingEnrollment.qr_enrollment?.qr_data_url || null
            };
        }
        
        console.log(`🆕 Création nouvel enrollment pour user ${user.user_id}...`);
        
        // Génération ID enrollment unique
        const enrollmentId = qrService.generateSecureId('ENR', user.user_id);
        
        // Simulation OCR (en attendant vraies photos)
        const ocrSimulated = {
            success: true,
            data: {
                nom: options.identity_data?.nom || user.nom || 'SIMULÉ',
                prenom: options.identity_data?.prenom || user.prenom || 'UTILISATEUR',
                date_naissance: options.identity_data?.date_naissance || user.date_naissance || new Date('1990-01-01'),
                numero_id: `SIM${user.user_id}${Date.now()}`,
                nationalite: options.identity_data?.nationalite || 'FR',
                confidence_moyenne: 95
            }
        };
        
        // Simulation Face Match (selfie vs ID)
        const faceMatchSimulated = await simulationService.simulateFaceMatch(
            'simulated_id_photo',
            'simulated_selfie_photo'
        );
        
        // Simulation template biométrique
        const biometricTemplate = encryptionService.encryptBiometricData({
            face_encoding: [/* simulated encoding array */],
            landmarks: {},
            quality: { Brightness: 80, Sharpness: 85 },
            created_at: new Date().toISOString(),
            simulated: true
        });
        
        // Génération QR code enrollment
        const qrData = await qrService.generateEnrollmentQR({
            enrollment_id: enrollmentId,
            user_id: user.user_id,
            reservation_id: options.reservation_id || null,
            nom: ocrSimulated.data.nom,
            prenom: ocrSimulated.data.prenom,
            date_naissance: ocrSimulated.data.date_naissance
        });
        
        // Création enrollment dans MongoDB
        const enrollmentData = {
            enrollment_id: enrollmentId,
            user_id: user.user_id,
            reservation_id: options.reservation_id || null,
            
            identity_data: {
                nom: ocrSimulated.data.nom,
                prenom: ocrSimulated.data.prenom,
                date_naissance: new Date(ocrSimulated.data.date_naissance),
                numero_id: ocrSimulated.data.numero_id,
                nationalite: ocrSimulated.data.nationalite,
                type_document: options.workflow_type === 'FULL' ? 'passeport' : 'cni'
            },
            
            images: {
                id_photo_recto: 'SIMULATED_BASE64_ID_PHOTO',
                id_photo_verso: null,
                selfie_photo: 'SIMULATED_BASE64_SELFIE',
                selfie_video_frames: []
            },
            
            biometric_template: biometricTemplate,
            face_encoding: [/* simulated */],
            face_encoding_hash: encryptionService.hashFaceEncoding([]),
            
            quality_scores: {
                ocr_confidence: ocrSimulated.data.confidence_moyenne,
                face_match_confidence: faceMatchSimulated.confidence,
                liveness_confidence: faceMatchSimulated.liveness_check?.confidence || 0,
                liveness_verified: faceMatchSimulated.liveness_check?.is_live || false,
                image_quality: {
                    brightness: 80,
                    sharpness: 85,
                    face_detected: true
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
                consent_ip: 'AUTO_ENROLLMENT',
                consent_text_version: 'v1.0'
            },
            
            status: 'active',
            
            verification_status: {
                ocr_verified: true,
                face_verified: true,
                liveness_verified: false,
                manual_review_required: false
            },
            
            created_at: new Date(),
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
            
            metadata: {
                device_info: 'AUTO_ENROLLMENT_SERVICE',
                enrollment_source: 'booking_workflow',
                workflow_type: options.workflow_type,
                auto_created: true
            }
        };
        
        const newEnrollment = await EnrollmentBiometric.create(enrollmentData);
        
        console.log(`✅ Enrollment ${enrollmentId} créé automatiquement pour user ${user.user_id}`);
        
        // Envoi notification
        try {
            await notificationService.sendEnrollmentSuccess(user.user_id, {
                enrollment_id: enrollmentId,
                identity_data: enrollmentData.identity_data
            });
            console.log('✅ Notification enrollment envoyée');
        } catch (notifError) {
            console.error('⚠️ Erreur notification (enrollment sauvegardé quand même):', notifError.message);
        }
        
        return {
            success: true,
            enrollment_id: enrollmentId,
            already_exists: false,
            qr_data_url: qrData.qr_data_url,
            qr_url: qrData.qr_url,
            created_at: new Date()
        };
        
    } catch (error) {
        console.error('❌ Erreur création enrollment automatique:', error);
        throw new Error(`Failed to create auto-enrollment: ${error.message}`);
    }
}

/**
 * Vérifie si un utilisateur a un enrollment actif
 * 
 * @param {number} userId - ID utilisateur
 * @returns {Promise<Object|null>} - Enrollment ou null
 */
async function getActiveEnrollment(userId) {
    try {
        return await EnrollmentBiometric.findActiveByUserId(userId);
    } catch (error) {
        console.error('❌ Erreur récupération enrollment:', error);
        return null;
    }
}

/**
 * Vérifie si un workflow nécessite un enrollment
 * 
 * @param {string} workflowType - Type de workflow (MINIMAL, LIGHT, MODERATE, FULL)
 * @returns {boolean} - true si enrollment requis
 */
function requiresEnrollment(workflowType) {
    // MINIMAL (bus) et LIGHT (train régional) : pas d'enrollment
    // MODERATE (vol national) et FULL (vol international) : enrollment requis
    return ['MODERATE', 'FULL'].includes(workflowType);
}

module.exports = {
    createAutoEnrollment,
    getActiveEnrollment,
    requiresEnrollment
};
