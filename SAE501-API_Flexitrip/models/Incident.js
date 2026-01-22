const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['retard', 'annulation', 'probleme_technique', 'accessibilite', 'autre'], 
    required: true 
  },
  severity: { 
    type: String, 
    enum: ['faible', 'moyen', 'eleve', 'critique'], 
    required: true 
  },
  reservationId: { type: Number },
  transportType: { 
    type: String, 
    enum: ['train', 'avion', 'taxi'], 
    required: true 
  },
  route: {
    departure: { type: String, required: true },
    arrival: { type: String, required: true },
    departureTime: { type: Date }
  },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  estimatedDelay: { type: Number }, // en minutes
  affectedUsers: [{ type: Number }], // user IDs
  status: { 
    type: String, 
    enum: ['actif', 'en_cours', 'resolu'], 
    default: 'actif' 
  },
  resolution: { type: String, maxlength: 1000 },
  rerouteOptions: [{
    description: { type: String },
    estimatedTime: { type: Date },
    additionalCost: { type: Number, default: 0 }
  }],
  notificationsSent: { type: Boolean, default: false },
  reportedBy: { type: Number, required: true }, // user ID ou agent ID
  reportedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
}, {
  timestamps: true
});

incidentSchema.index({ status: 1 });
incidentSchema.index({ severity: -1 });
incidentSchema.index({ affectedUsers: 1 });

module.exports = mongoose.model('Incident', incidentSchema);
