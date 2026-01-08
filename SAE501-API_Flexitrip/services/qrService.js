/**
 * Service QR Code Generation
 * 
 * Utilise la lib 'qrcode' (déjà installée pour Point 2)
 * Compatible avec tous les scanners QR standards
 */

const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Génère un ID unique sécurisé
 * @param {string} prefix - Préfixe (ENR, CHK, BRD)
 * @param {number} userId - ID utilisateur
 * @returns {string} ID unique
 */
const generateSecureId = (prefix, userId) => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${userId}-${timestamp}-${randomBytes}`;
};

/**
 * Génère un QR code d'enrollment
 * @param {Object} enrollmentData - Données enrollment
 * @returns {Promise<Object>} QR code + URL
 */
const generateEnrollmentQR = async (enrollmentData) => {
  try {
    const {
      enrollment_id,
      user_id,
      reservation_id,
      nom,
      prenom,
      date_naissance
    } = enrollmentData;
    
    // Données encodées dans le QR (format JSON signé)
    const qrPayload = {
      type: 'ENROLLMENT',
      id: enrollment_id,
      user_id: user_id,
      reservation_id: reservation_id,
      identity: {
        nom: nom,
        prenom: prenom,
        dob: date_naissance
      },
      issued_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 an
      version: '1.0'
    };
    
    // Signature HMAC pour sécurité (empêche falsification)
    const secret = process.env.QR_SECRET || 'flexitrip-secret-key-2026';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(qrPayload))
      .digest('hex');
    
    qrPayload.signature = signature;
    
    // Générer QR code en base64
    const qrDataURL = await QRCode.toDataURL(JSON.stringify(qrPayload), {
      errorCorrectionLevel: 'H', // Haute correction erreurs
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Générer aussi URL pour partage
    const qrURL = `flexitrip://enrollment/${enrollment_id}?sig=${signature.substring(0, 16)}`;
    
    return {
      qr_data_url: qrDataURL, // Base64 PNG
      qr_url: qrURL,
      qr_payload: qrPayload,
      generated_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Erreur génération QR enrollment:', error);
    throw new Error('Impossible de générer le QR code');
  }
};

/**
 * Génère un QR code de boarding pass
 * @param {Object} boardingData - Données boarding pass
 * @returns {Promise<Object>} QR code + barcode
 */
const generateBoardingPassQR = async (boardingData) => {
  try {
    const {
      pass_id,
      reservation_id,
      user_id,
      flight_train_number,
      gate,
      seat,
      boarding_time,
      pmr_assistance
    } = boardingData;
    
    // Format IATA BCBP (Bar Coded Boarding Pass) simplifié
    const qrPayload = {
      type: 'BOARDING_PASS',
      pass_id: pass_id,
      reservation_id: reservation_id,
      user_id: user_id,
      flight_train: flight_train_number,
      gate: gate,
      seat: seat,
      boarding_time: boarding_time,
      pmr: pmr_assistance,
      issued_at: new Date().toISOString(),
      status: 'VALID'
    };
    
    // Signature
    const secret = process.env.QR_SECRET || 'flexitrip-secret-key-2026';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(qrPayload))
      .digest('hex');
    
    qrPayload.signature = signature;
    
    // QR Code haute résolution
    const qrDataURL = await QRCode.toDataURL(JSON.stringify(qrPayload), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 400,
      color: {
        dark: '#1E40AF', // Bleu FlexiTrip
        light: '#FFFFFF'
      }
    });
    
    // Barcode 1D (Code 128) pour compatibilité lecteurs anciens
    const barcode = `FT${pass_id.toString().padStart(8, '0')}${signature.substring(0, 4)}`;
    
    return {
      qr_data_url: qrDataURL,
      barcode: barcode,
      qr_payload: qrPayload,
      generated_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Erreur génération QR boarding pass:', error);
    throw new Error('Impossible de générer le boarding pass');
  }
};

/**
 * Vérifie la validité d'un QR code scanné
 * @param {string} qrDataString - Données QR scannées (JSON string)
 * @returns {Object} Résultat validation
 */
const verifyQRCode = (qrDataString) => {
  try {
    const qrData = JSON.parse(qrDataString);
    
    // Vérifier signature
    const secret = process.env.QR_SECRET || 'flexitrip-secret-key-2026';
    const signature = qrData.signature;
    delete qrData.signature;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(qrData))
      .digest('hex');
    
    const signatureValid = signature === expectedSignature;
    
    // Vérifier expiration (pour enrollment)
    let expired = false;
    if (qrData.expires_at) {
      expired = new Date(qrData.expires_at) < new Date();
    }
    
    // Vérifier statut (pour boarding pass)
    const statusValid = !qrData.status || qrData.status === 'VALID';
    
    return {
      valid: signatureValid && !expired && statusValid,
      signature_valid: signatureValid,
      expired: expired,
      status_valid: statusValid,
      data: qrData,
      verified_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Erreur vérification QR:', error);
    return {
      valid: false,
      error: 'QR code invalide ou corrompu'
    };
  }
};

/**
 * Génère un QR simple pour check-in
 * @param {string} checkinId - ID check-in
 * @param {Object} data - Données additionnelles
 * @returns {Promise<string>} QR code base64
 */
const generateSimpleQR = async (checkinId, data = {}) => {
  try {
    const payload = {
      id: checkinId,
      ...data,
      timestamp: new Date().toISOString()
    };
    
    const qrDataURL = await QRCode.toDataURL(JSON.stringify(payload), {
      errorCorrectionLevel: 'M',
      width: 250
    });
    
    return qrDataURL;
    
  } catch (error) {
    console.error('Erreur génération QR simple:', error);
    throw error;
  }
};

module.exports = {
  generateSecureId,
  generateEnrollmentQR,
  generateBoardingPassQR,
  verifyQRCode,
  generateSimpleQR
};

/**
 * ============================================
 * EXEMPLES D'UTILISATION
 * ============================================
 * 
 * 1. Générer QR Enrollment :
 * 
 *    const { generateEnrollmentQR } = require('./qrService');
 *    
 *    const qrResult = await generateEnrollmentQR({
 *      enrollment_id: 'ENR-4-1767532528-A3F2',
 *      user_id: 4,
 *      reservation_id: 3,
 *      nom: 'DUPONT',
 *      prenom: 'JEAN',
 *      date_naissance: '1985-05-15'
 *    });
 *    
 *    console.log(qrResult.qr_data_url); // Base64 image
 *    console.log(qrResult.qr_url);      // URL deep link
 * 
 * 2. Générer Boarding Pass :
 * 
 *    const boardingQR = await generateBoardingPassQR({
 *      pass_id: 123,
 *      reservation_id: 3,
 *      user_id: 4,
 *      flight_train_number: 'AF1148',
 *      gate: 'A12',
 *      seat: '15A',
 *      boarding_time: '2026-01-15T09:30:00Z',
 *      pmr_assistance: true
 *    });
 * 
 * 3. Vérifier QR scanné :
 * 
 *    const scannedData = '{"type":"ENROLLMENT","id":"ENR-4-...",...}';
 *    const verification = verifyQRCode(scannedData);
 *    
 *    if (verification.valid) {
 *      console.log('QR valide:', verification.data);
 *    }
 */
