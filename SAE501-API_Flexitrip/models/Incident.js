const mongoose = require('mongoose');

/**
 * Modèle Incident - Gestion des perturbations et incidents
 */
const incidentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['delay', 'cancellation', 'equipment_failure', 'accessibility_issue', 'other'],
        required: true,
        comment: 'Type d\'incident'
    },
    
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
        comment: 'Niveau de gravité'
    },

    // Informations sur le voyage affecté
    reservationId: {
        type: Number,
        comment: 'ID de la réservation affectée (optionnel)'
    },
    
    transportType: {
        type: String,
        enum: ['train', 'bus', 'avion', 'taxi', 'multimodal'],
        required: true
    },

    route: {
        departure: { type: String, required: true },
        arrival: { type: String, required: true }
    },

    // Détails de l'incident
    title: {
        type: String,
        required: true,
        maxlength: 200,
        comment: 'Titre court de l\'incident'
    },

    description: {
        type: String,
        required: true,
        maxlength: 1000,
        comment: 'Description détaillée'
    },

    estimatedDelay: {
        type: Number,
        default: 0,
        comment: 'Retard estimé en minutes'
    },

    // Utilisateurs affectés
    affectedUsers: [{
        type: Number,
        comment: 'Liste des user_id affectés'
    }],

    // Actions et résolution
    status: {
        type: String,
        enum: ['active', 'resolved', 'monitoring'],
        default: 'active'
    },

    resolution: {
        type: String,
        maxlength: 500,
        comment: 'Description de la résolution'
    },

    rerouteOptions: [{
        description: String,
        additionalCost: Number,
        estimatedArrival: Date
    }],

    // Notifications
    notificationsSent: {
        type: Boolean,
        default: false
    },

    notifiedAt: {
        type: Date
    },

    // Métadonnées
    reportedBy: {
        type: String,
        enum: ['system', 'agent', 'user'],
        default: 'system'
    },

    reportedAt: {
        type: Date,
        default: Date.now
    },

    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index pour recherches
incidentSchema.index({ status: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ transportType: 1 });
incidentSchema.index({ affectedUsers: 1 });
incidentSchema.index({ reservationId: 1 });

module.exports = mongoose.model('Incident', incidentSchema);
