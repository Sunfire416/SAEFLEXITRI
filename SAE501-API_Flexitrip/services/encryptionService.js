/**
 * Service Encryption - Chiffrement données biométriques
 * 
 * Conforme RGPD : Les templates biométriques sont chiffrés AES-256
 * Les clés sont stockées en variables d'environnement
 */

const crypto = require('crypto');

// Configuration chiffrement
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.BIOMETRIC_ENCRYPTION_KEY || 
  crypto.randomBytes(32).toString('hex'); // 32 bytes = 256 bits
const IV_LENGTH = 16; // Pour AES, IV = 16 bytes

/**
 * Chiffre un template biométrique
 * @param {string|Object} data - Données à chiffrer
 * @returns {string} Données chiffrées (format: IV:ENCRYPTED)
 */
const encryptBiometricData = (data) => {
  try {
    // Convertir en string si objet/array
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Générer IV aléatoire (nouveau pour chaque chiffrement)
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Créer cipher
    const key = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Chiffrer
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Retourner IV:ENCRYPTED (IV nécessaire pour déchiffrement)
    return iv.toString('hex') + ':' + encrypted;
    
  } catch (error) {
    console.error('Erreur chiffrement biométrique:', error);
    throw new Error('Échec du chiffrement des données biométriques');
  }
};

/**
 * Déchiffre un template biométrique
 * @param {string} encryptedData - Données chiffrées (format: IV:ENCRYPTED)
 * @returns {string|Object} Données déchiffrées
 */
const decryptBiometricData = (encryptedData) => {
  try {
    // Séparer IV et données chiffrées
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Format données chiffrées invalide');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    // Créer decipher
    const key = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    // Déchiffrer
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Tenter de parser JSON si applicable
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
    
  } catch (error) {
    console.error('Erreur déchiffrement biométrique:', error);
    throw new Error('Échec du déchiffrement des données biométriques');
  }
};

/**
 * Hash un encoding facial (pour comparaison rapide)
 * Unidirectionnel - ne peut pas être inversé
 * @param {Array<number>} faceEncoding - Encoding facial (128D)
 * @returns {string} Hash SHA-256
 */
const hashFaceEncoding = (faceEncoding) => {
  try {
    const encodingString = JSON.stringify(faceEncoding);
    return crypto
      .createHash('sha256')
      .update(encodingString)
      .digest('hex');
  } catch (error) {
    console.error('Erreur hash face encoding:', error);
    throw error;
  }
};

/**
 * Génère un salt pour hashage sécurisé
 * @returns {string} Salt hexadécimal
 */
const generateSalt = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Hash avec salt (pour données sensibles non-biométriques)
 * @param {string} data - Données à hasher
 * @param {string} salt - Salt (optionnel, généré si absent)
 * @returns {Object} { hash, salt }
 */
const hashWithSalt = (data, salt = null) => {
  try {
    const usedSalt = salt || generateSalt();
    const hash = crypto
      .createHash('sha256')
      .update(data + usedSalt)
      .digest('hex');
    
    return { hash, salt: usedSalt };
  } catch (error) {
    console.error('Erreur hash avec salt:', error);
    throw error;
  }
};

/**
 * Vérifie un hash avec salt
 * @param {string} data - Données à vérifier
 * @param {string} hash - Hash stocké
 * @param {string} salt - Salt utilisé
 * @returns {boolean} Match
 */
const verifyHash = (data, hash, salt) => {
  try {
    const computed = crypto
      .createHash('sha256')
      .update(data + salt)
      .digest('hex');
    
    return computed === hash;
  } catch (error) {
    console.error('Erreur vérification hash:', error);
    return false;
  }
};

/**
 * Anonymise des données sensibles (RGPD)
 * Remplace par hash irréversible
 * @param {string} data - Données à anonymiser
 * @returns {string} Hash SHA-256
 */
const anonymize = (data) => {
  return crypto
    .createHash('sha256')
    .update(data + process.env.ANONYMIZATION_SALT || 'flexitrip-anon')
    .digest('hex');
};

/**
 * Génère un token sécurisé (pour sessions, reset password, etc.)
 * @param {number} length - Longueur en bytes (défaut: 32)
 * @returns {string} Token hexadécimal
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Vérifie l'intégrité de données avec HMAC
 * @param {string|Object} data - Données
 * @param {string} signature - Signature à vérifier
 * @returns {boolean} Valide ou non
 */
const verifyDataIntegrity = (data, signature) => {
  try {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const secret = process.env.INTEGRITY_SECRET || 'flexitrip-integrity-2026';
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(dataString)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Erreur vérification intégrité:', error);
    return false;
  }
};

/**
 * Signe des données avec HMAC
 * @param {string|Object} data - Données à signer
 * @returns {string} Signature HMAC
 */
const signData = (data) => {
  try {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const secret = process.env.INTEGRITY_SECRET || 'flexitrip-integrity-2026';
    
    return crypto
      .createHmac('sha256', secret)
      .update(dataString)
      .digest('hex');
  } catch (error) {
    console.error('Erreur signature données:', error);
    throw error;
  }
};

module.exports = {
  encryptBiometricData,
  decryptBiometricData,
  hashFaceEncoding,
  generateSalt,
  hashWithSalt,
  verifyHash,
  anonymize,
  generateSecureToken,
  verifyDataIntegrity,
  signData
};

/**
 * ============================================
 * CONFIGURATION PRODUCTION
 * ============================================
 * 
 * Variables d'environnement requises (.env) :
 * 
 * # Clé chiffrement biométrique (256 bits = 64 hex chars)
 * BIOMETRIC_ENCRYPTION_KEY=a1b2c3d4e5f6...64_chars_total
 * 
 * # Secret pour signatures HMAC
 * INTEGRITY_SECRET=your-secret-key-2026
 * 
 * # Salt anonymisation RGPD
 * ANONYMIZATION_SALT=another-secret-salt
 * 
 * # Secret QR codes (utilisé par qrService)
 * QR_SECRET=qr-signing-secret
 * 
 * Générer clés sécurisées :
 * 
 * node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * 
 * ============================================
 * CONFORMITÉ RGPD
 * ============================================
 * 
 * 1. Les templates biométriques sont TOUJOURS chiffrés en base
 * 2. Les hash sont irréversibles (SHA-256)
 * 3. Les données peuvent être anonymisées sur demande
 * 4. Les clés sont rotées tous les 6 mois (production)
 * 5. Audit trail de tous les accès (voir CheckInLog)
 * 
 * Droit à l'oubli (RGPD Article 17) :
 * - Supprimer enrollment + biométrie
 * - Anonymiser logs (remplacer user_id par hash)
 * - Conserver uniquement données anonymisées (analytics)
 */
