const mongoose = require('mongoose');

/**
 * Modèle Review - Système de feedback et évaluation
 * Permet aux utilisateurs de noter leur expérience PMR
 */
const reviewSchema = new mongoose.Schema({
    reservationId: {
        type: Number,
        required: true,
        comment: 'ID de la réservation associée'
    },
    userId: {
        type: Number,
        required: true,
        comment: 'ID de l\'utilisateur qui laisse l\'avis'
    },
    
    // Évaluations par catégorie (1-5 étoiles)
    ratings: {
        overall: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            comment: 'Note globale'
        },
        accessibility: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            comment: 'Accessibilité PMR'
        },
        assistanceQuality: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            comment: 'Qualité de l\'assistance'
        },
        punctuality: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            comment: 'Ponctualité'
        },
        comfort: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            comment: 'Confort du voyage'
        }
    },

    // Commentaires
    comment: {
        type: String,
        maxlength: 1000,
        comment: 'Commentaire textuel'
    },

    // Problèmes rencontrés
    issues: [{
        type: String,
        enum: [
            'rampe_absente',
            'personnel_non_forme',
            'delai_attente',
            'equipement_defectueux',
            'information_insuffisante',
            'autre'
        ]
    }],

    // Suggestions d'amélioration
    suggestions: {
        type: String,
        maxlength: 500,
        comment: 'Suggestions d\'amélioration'
    },

    // Recommandation
    wouldRecommend: {
        type: Boolean,
        required: true,
        comment: 'Recommanderait le service'
    },

    // Statut
    status: {
        type: String,
        enum: ['pending', 'published', 'archived'],
        default: 'published',
        comment: 'Statut de l\'avis'
    },

    // Métadonnées
    transportType: {
        type: String,
        enum: ['train', 'bus', 'avion', 'taxi', 'multimodal'],
        required: true,
        comment: 'Type de transport évalué'
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index pour recherches fréquentes
reviewSchema.index({ reservationId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ 'ratings.overall': -1 });
reviewSchema.index({ transportType: 1 });

module.exports = mongoose.model('Review', reviewSchema);
