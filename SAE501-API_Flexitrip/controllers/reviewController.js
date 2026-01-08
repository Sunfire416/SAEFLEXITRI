const Review = require('../models/Review');
const { Reservations } = require('../models');

/**
 * Créer un nouvel avis
 */
const createReview = async (req, res) => {
    try {
        const { reservationId, ratings, comment, issues, suggestions, wouldRecommend } = req.body;
        const userId = req.user?.user_id || req.body.userId;

        // Validation des données
        if (!reservationId || !ratings || !userId) {
            return res.status(400).json({ 
                message: 'Données manquantes (reservationId, ratings, userId requis)' 
            });
        }

        // Vérifier que la réservation existe et appartient à l'utilisateur
        const reservation = await Reservations.findOne({
            where: { reservation_id: reservationId, user_id: userId }
        });

        if (!reservation) {
            return res.status(404).json({ 
                message: 'Réservation non trouvée ou n\'appartient pas à cet utilisateur' 
            });
        }

        // Vérifier qu'un avis n'existe pas déjà
        const existingReview = await Review.findOne({ reservationId, userId });
        if (existingReview) {
            return res.status(409).json({ 
                message: 'Un avis existe déjà pour cette réservation' 
            });
        }

        // Créer l'avis
        const review = new Review({
            reservationId,
            userId,
            ratings: {
                overall: ratings.overall,
                accessibility: ratings.accessibility,
                assistanceQuality: ratings.assistanceQuality,
                punctuality: ratings.punctuality,
                comfort: ratings.comfort
            },
            comment: comment || '',
            issues: issues || [],
            suggestions: suggestions || '',
            wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : true,
            transportType: reservation.Type_Transport || 'multimodal',
            status: 'published'
        });

        await review.save();

        res.status(201).json({
            message: 'Avis créé avec succès',
            review
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'avis:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la création de l\'avis',
            error: error.message 
        });
    }
};

/**
 * Récupérer l'avis d'une réservation
 */
const getReviewByReservation = async (req, res) => {
    try {
        const { reservationId } = req.params;
        const userId = req.user?.user_id || req.query.userId;

        const review = await Review.findOne({ reservationId, userId });

        if (!review) {
            return res.status(404).json({ 
                message: 'Aucun avis trouvé pour cette réservation' 
            });
        }

        res.status(200).json(review);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'avis:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération de l\'avis',
            error: error.message 
        });
    }
};

/**
 * Récupérer tous les avis d'un utilisateur
 */
const getUserReviews = async (req, res) => {
    try {
        const { userId } = req.params;

        const reviews = await Review.find({ userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: reviews.length,
            reviews
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des avis:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération des avis',
            error: error.message 
        });
    }
};

/**
 * Récupérer les statistiques globales des avis
 */
const getReviewStats = async (req, res) => {
    try {
        const { transportType } = req.query;

        const filter = transportType ? { transportType } : {};

        const stats = await Review.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    avgOverall: { $avg: '$ratings.overall' },
                    avgAccessibility: { $avg: '$ratings.accessibility' },
                    avgAssistance: { $avg: '$ratings.assistanceQuality' },
                    avgPunctuality: { $avg: '$ratings.punctuality' },
                    avgComfort: { $avg: '$ratings.comfort' },
                    recommendCount: {
                        $sum: { $cond: ['$wouldRecommend', 1, 0] }
                    }
                }
            }
        ]);

        if (stats.length === 0) {
            return res.status(200).json({
                totalReviews: 0,
                averages: {},
                recommendationRate: 0
            });
        }

        const result = stats[0];
        
        res.status(200).json({
            totalReviews: result.totalReviews,
            averages: {
                overall: Math.round(result.avgOverall * 10) / 10,
                accessibility: Math.round(result.avgAccessibility * 10) / 10,
                assistanceQuality: Math.round(result.avgAssistance * 10) / 10,
                punctuality: Math.round(result.avgPunctuality * 10) / 10,
                comfort: Math.round(result.avgComfort * 10) / 10
            },
            recommendationRate: Math.round((result.recommendCount / result.totalReviews) * 100)
        });
    } catch (error) {
        console.error('Erreur lors du calcul des statistiques:', error);
        res.status(500).json({ 
            message: 'Erreur lors du calcul des statistiques',
            error: error.message 
        });
    }
};

/**
 * Mettre à jour un avis
 */
const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user?.user_id || req.body.userId;
        const updates = req.body;

        // Vérifier que l'avis appartient à l'utilisateur
        const review = await Review.findOne({ _id: reviewId, userId });

        if (!review) {
            return res.status(404).json({ 
                message: 'Avis non trouvé ou n\'appartient pas à cet utilisateur' 
            });
        }

        // Mettre à jour les champs autorisés
        const allowedUpdates = ['ratings', 'comment', 'issues', 'suggestions', 'wouldRecommend'];
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                review[field] = updates[field];
            }
        });

        review.updatedAt = new Date();
        await review.save();

        res.status(200).json({
            message: 'Avis mis à jour avec succès',
            review
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'avis:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la mise à jour de l\'avis',
            error: error.message 
        });
    }
};

/**
 * Supprimer un avis
 */
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user?.user_id || req.body.userId;

        const review = await Review.findOneAndDelete({ _id: reviewId, userId });

        if (!review) {
            return res.status(404).json({ 
                message: 'Avis non trouvé ou n\'appartient pas à cet utilisateur' 
            });
        }

        res.status(200).json({
            message: 'Avis supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'avis:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la suppression de l\'avis',
            error: error.message 
        });
    }
};

module.exports = {
    createReview,
    getReviewByReservation,
    getUserReviews,
    getReviewStats,
    updateReview,
    deleteReview
};
