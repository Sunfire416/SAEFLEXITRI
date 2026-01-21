const {  mongoose } = require('../config/database');

// Simple counter for local dev (no external MongoDB plugin dependency)
let voyageCounter = 1;

// Schéma pour une étape de transport (vol, train, taxi, etc.)
const trajetSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['avion', 'train', 'taxi', 'bus'], required: true },
  compagnie: { type: String, required: true },
  adresse_1: { type: String, default: '' },
  adresse_2: { type: String, default: '' },
  // 🆕 Champs enrichis pour segments détaillés
  line: { type: String, default: null },                      // Numéro de ligne/vol (ex: "TGV 6601", "RER A", "Bus 91")
  departure_station: { type: String, default: null },         // Station de départ précise
  departure_time: { type: Date, default: null },              // Horaire de départ ISO
  arrival_station: { type: String, default: null },           // Station d'arrivée précise
  arrival_time: { type: Date, default: null },                // Horaire d'arrivée ISO
  duration_minutes: { type: Number, default: null },          // Durée du segment en minutes
  accessible: { type: Boolean, default: true },               // Accessibilité PMR
  vehicle_type: { type: String, default: null }               // Type de véhicule (HEAVY_RAIL, BUS, etc.)
});

// Schéma pour un voyage
const voyageSchema = new mongoose.Schema({
  id_voyage: { type: Number, unique: false },
  id_pmr: { type: Number, required: true },  // ✅ STANDARDISÉ: id_pmr au lieu de pmrid
  id_accompagnant: { type: Number, required: false },
  date_debut: { type: Date, required: true },
  date_fin: { type: Date, required: true },
  lieu_depart: { 
    locomotion: { type: String, enum: ['train', 'avion', 'taxi', 'bus'], required: true },
    id: { type: String, required: true }
  },
  lieu_arrive: { 
    locomotion: { type: String, enum: ['train', 'avion', 'taxi', 'bus'], required: true },
    id: { type: String, required: true }
  },
  bagage: [{
    id: { type: Number, required: false },
    poid: { type: Number, required: false },
    descriptif: { type: String, required: false },
  }],
  etapes: [trajetSchema],
  prix_total: { type: Number, required: true },
  
  // ==========================================
  // 🆕 ÉTAPE 4 - ENROLLMENT BIOMÉTRIQUE
  // ==========================================
  enrollment_id: {
    type: String,
    required: false,
    index: true,
    comment: 'ID enrollment biométrique (EnrollmentBiometric._id) - Workflows MODERATE/FULL uniquement'
  },
});

// Pre-save hook to auto-increment id_voyage locally
voyageSchema.pre('save', function (next) {
  if (this.isNew && !this.id_voyage) {
    this.id_voyage = voyageCounter++;
  }
  next();
});

module.exports = mongoose.model('Voyage', voyageSchema);