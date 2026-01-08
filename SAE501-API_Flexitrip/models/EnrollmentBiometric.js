/**
 * Modèle EnrollmentBiometric (MongoDB)
 * 
 * REMPLACE l'ancien models/Biometric.js
 * Enrichi pour Point 3 : Enregistrement sans papier
 * 
 * Stocke :
 * - Données identité (OCR)
 * - Templates biométriques chiffrés
 * - QR code enrollment
 * - Consentement RGPD
 */

const mongoose = require('mongoose');

const enrollmentBiometricSchema = new mongoose.Schema({
  // ==========================================
  // IDENTIFIANTS
  // ==========================================
  enrollment_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    comment: 'ID unique enrollment (ex: ENR-4-1767532528-A3F2)'
  },
  
  user_id: {
    type: Number,
    required: true,
    index: true,
    comment: 'ID utilisateur (lien avec MySQL User table)'
  },
  
  reservation_id: {
    type: Number,
    required: false,
    index: true,
    comment: 'ID réservation associée (optionnel lors enrollment)'
  },
  
  // ==========================================
  // DONNÉES IDENTITÉ (OCR)
  // ==========================================
  identity_data: {
    nom: {
      type: String,
      required: true,
      uppercase: true
    },
    prenom: {
      type: String,
      required: true,
      uppercase: true
    },
    date_naissance: {
      type: Date,
      required: true
    },
    numero_id: {
      type: String,
      required: true,
      comment: 'Numéro passeport ou CNI'
    },
    nationalite: {
      type: String,
      required: true,
      default: 'FR'
    },
    type_document: {
      type: String,
      enum: ['passeport', 'cni'],
      required: true
    },
    date_expiration: {
      type: Date,
      required: false,
      comment: 'Date expiration du document'
    }
  },
  
  // ==========================================
  // IMAGES STOCKÉES (Base64)
  // ==========================================
  images: {
    id_photo_recto: {
      type: String,
      required: true,
      comment: 'Photo recto pièce identité (base64)'
    },
    id_photo_verso: {
      type: String,
      required: false,
      comment: 'Photo verso CNI (base64, optionnel pour passeport)'
    },
    selfie_photo: {
      type: String,
      required: true,
      comment: 'Selfie utilisateur (base64)'
    },
    selfie_video_frames: {
      type: [String],
      required: false,
      comment: 'Frames vidéo selfie pour liveness (array base64)'
    }
  },
  
  // ==========================================
  // BIOMÉTRIE (CHIFFRÉE)
  // ==========================================
  biometric_template: {
    type: String,
    required: true,
    comment: 'Template biométrique chiffré AES-256'
  },
  
  face_encoding: {
    type: [Number],
    required: true,
    comment: 'Encoding facial 128D (pour comparaison rapide)'
  },
  
  face_encoding_hash: {
    type: String,
    required: true,
    index: true,
    comment: 'Hash SHA-256 du face encoding (recherche rapide)'
  },
  
  // ==========================================
  // SCORES QUALITÉ
  // ==========================================
  quality_scores: {
    ocr_confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      comment: 'Confiance OCR (%)'
    },
    face_match_confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      comment: 'Score similarité faciale selfie vs ID (%)'
    },
    liveness_confidence: {
      type: Number,
      required: false,
      min: 0,
      max: 100,
      comment: 'Score détection vivacité (%)'
    },
    liveness_verified: {
      type: Boolean,
      required: true,
      default: false
    },
    image_quality: {
      brightness: Number,
      sharpness: Number,
      face_detected: Boolean
    }
  },
  
  // ==========================================
  // QR CODE ENROLLMENT
  // ==========================================
  qr_enrollment: {
    qr_data_url: {
      type: String,
      required: true,
      comment: 'QR code en base64 (PNG)'
    },
    qr_url: {
      type: String,
      required: true,
      comment: 'URL deep link (ex: flexitrip://enrollment/XXX)'
    },
    qr_payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      comment: 'Payload JSON du QR (signé)'
    }
  },
  
  // ==========================================
  // CONSENTEMENT RGPD
  // ==========================================
  consent: {
    consent_given: {
      type: Boolean,
      required: true,
      default: false
    },
    consent_date: {
      type: Date,
      required: true,
      default: Date.now
    },
    consent_ip: {
      type: String,
      required: false,
      comment: 'IP lors du consentement'
    },
    consent_text_version: {
      type: String,
      required: true,
      default: 'v1.0',
      comment: 'Version du texte de consentement accepté'
    },
    consent_revoked: {
      type: Boolean,
      default: false
    },
    revocation_date: {
      type: Date,
      required: false
    }
  },
  
  // ==========================================
  // STATUT & SÉCURITÉ
  // ==========================================
  status: {
    type: String,
    enum: ['pending', 'active', 'revoked', 'expired'],
    default: 'pending',
    index: true
  },
  
  verification_status: {
    ocr_verified: { type: Boolean, default: false },
    face_verified: { type: Boolean, default: false },
    liveness_verified: { type: Boolean, default: false },
    manual_review_required: { type: Boolean, default: false },
    manual_review_completed: { type: Boolean, default: false },
    manual_review_by: { type: Number, required: false },
    manual_review_date: { type: Date, required: false }
  },
  
  // ==========================================
  // DATES & AUDIT
  // ==========================================
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updated_at: {
    type: Date,
    default: Date.now
  },
  
  expires_at: {
    type: Date,
    required: true,
    index: true,
    comment: 'Date expiration enrollment (1 an par défaut)'
  },
  
  last_verified: {
    type: Date,
    required: false,
    comment: 'Dernière utilisation pour check-in'
  },
  
  usage_count: {
    type: Number,
    default: 0,
    comment: 'Nombre de fois utilisé (check-ins)'
  },
  
  // ==========================================
  // MÉTADONNÉES
  // ==========================================
  metadata: {
    device_info: {
      type: String,
      required: false,
      comment: 'Info appareil lors enrollment (User-Agent)'
    },
    geolocation: {
      type: {
        type: String,
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: false
      }
    },
    enrollment_source: {
      type: String,
      enum: ['mobile_app', 'web_app', 'kiosk', 'agent'],
      default: 'web_app'
    }
  }
  
}, {
  timestamps: false, // On gère manuellement created_at/updated_at
  collection: 'enrollment_biometrics'
});

// ==========================================
// INDEXES
// ==========================================
enrollmentBiometricSchema.index({ user_id: 1, status: 1 });
enrollmentBiometricSchema.index({ enrollment_id: 1 }, { unique: true });
enrollmentBiometricSchema.index({ 'identity_data.numero_id': 1 });
enrollmentBiometricSchema.index({ expires_at: 1 }); // Pour nettoyage automatique
enrollmentBiometricSchema.index({ 'consent.consent_revoked': 1 }); // RGPD

// ==========================================
// MÉTHODES INSTANCE
// ==========================================

/**
 * Vérifie si l'enrollment est valide et actif
 */
enrollmentBiometricSchema.methods.isValid = function() {
  return this.status === 'active' && 
         this.consent.consent_given && 
         !this.consent.consent_revoked &&
         this.expires_at > new Date();
};

/**
 * Vérifie si toutes les vérifications sont passées
 */
enrollmentBiometricSchema.methods.isFullyVerified = function() {
  return this.verification_status.ocr_verified &&
         this.verification_status.face_verified &&
         this.verification_status.liveness_verified &&
         !this.verification_status.manual_review_required;
};

/**
 * Incrémente le compteur d'utilisation
 */
enrollmentBiometricSchema.methods.recordUsage = async function() {
  this.usage_count += 1;
  this.last_verified = new Date();
  return this.save();
};

/**
 * Révoque le consentement (RGPD)
 */
enrollmentBiometricSchema.methods.revokeConsent = async function() {
  this.consent.consent_revoked = true;
  this.consent.revocation_date = new Date();
  this.status = 'revoked';
  return this.save();
};

/**
 * Anonymise les données (RGPD - Droit à l'oubli)
 */
enrollmentBiometricSchema.methods.anonymize = async function() {
  const crypto = require('crypto');
  const hash = (data) => crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  
  // Anonymiser données identité
  this.identity_data.nom = `ANONYMIZED_${hash(this.identity_data.nom)}`;
  this.identity_data.prenom = `ANONYMIZED_${hash(this.identity_data.prenom)}`;
  this.identity_data.numero_id = `ANON_${hash(this.identity_data.numero_id)}`;
  
  // Supprimer images
  this.images.id_photo_recto = 'DELETED';
  this.images.id_photo_verso = 'DELETED';
  this.images.selfie_photo = 'DELETED';
  this.images.selfie_video_frames = [];
  
  // Supprimer biométrie
  this.biometric_template = 'DELETED';
  this.face_encoding = [];
  
  // Marquer comme anonymisé
  this.status = 'revoked';
  
  return this.save();
};

// ==========================================
// MÉTHODES STATIQUES
// ==========================================

/**
 * Trouve enrollment par user_id actif
 */
enrollmentBiometricSchema.statics.findActiveByUserId = function(userId) {
  return this.findOne({
    user_id: userId,
    status: 'active',
    'consent.consent_revoked': false,
    expires_at: { $gt: new Date() }
  });
};

/**
 * Trouve enrollment par enrollment_id et vérifie validité
 */
enrollmentBiometricSchema.statics.findAndValidate = async function(enrollmentId) {
  const enrollment = await this.findOne({ enrollment_id: enrollmentId });
  
  if (!enrollment) {
    return { valid: false, error: 'Enrollment non trouvé' };
  }
  
  if (!enrollment.isValid()) {
    return { valid: false, error: 'Enrollment expiré ou révoqué', enrollment };
  }
  
  return { valid: true, enrollment };
};

/**
 * Nettoie les enrollments expirés (CRON job)
 */
enrollmentBiometricSchema.statics.cleanupExpired = async function() {
  const result = await this.updateMany(
    {
      expires_at: { $lt: new Date() },
      status: { $ne: 'expired' }
    },
    {
      $set: { status: 'expired' }
    }
  );
  
  return result.modifiedCount;
};

// ==========================================
// HOOKS
// ==========================================

// Avant save : mettre à jour updated_at
enrollmentBiometricSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Après save : logger pour audit
enrollmentBiometricSchema.post('save', function(doc) {
  console.log(`📝 Enrollment ${doc.enrollment_id} sauvegardé (user: ${doc.user_id})`);
});

const EnrollmentBiometric = mongoose.model('EnrollmentBiometric', enrollmentBiometricSchema);

module.exports = EnrollmentBiometric;

/**
 * ============================================
 * MIGRATION DEPUIS ANCIEN Biometric.js
 * ============================================
 * 
 * 1. Renommer le fichier :
 *    mv models/Biometric.js models/Biometric.js.old
 *    
 * 2. Copier ce fichier :
 *    cp EnrollmentBiometric.js models/
 *    
 * 3. Dans models/index.js, remplacer :
 *    Biometric: require('./Biometric')
 *    par :
 *    EnrollmentBiometric: require('./EnrollmentBiometric')
 *    
 * 4. Les anciennes données Biometric peuvent être migrées :
 *    node scripts/migrateBiometricData.js
 *    
 * 5. Supprimer l'ancienne collection après vérification :
 *    db.biometrics.drop()
 */
