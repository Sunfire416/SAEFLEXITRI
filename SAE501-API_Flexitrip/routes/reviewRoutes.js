const express = require('express');
const router = express.Router();
const {
    createReview,
    getReviewByReservation,
    getUserReviews,
    getReviewStats,
    updateReview,
    deleteReview
} = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/review:
 *   post:
 *     summary: Créer un nouvel avis
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reservationId
 *               - ratings
 *               - wouldRecommend
 *             properties:
 *               reservationId:
 *                 type: integer
 *               ratings:
 *                 type: object
 *                 properties:
 *                   overall: { type: integer, minimum: 1, maximum: 5 }
 *                   accessibility: { type: integer, minimum: 1, maximum: 5 }
 *                   assistanceQuality: { type: integer, minimum: 1, maximum: 5 }
 *                   punctuality: { type: integer, minimum: 1, maximum: 5 }
 *                   comfort: { type: integer, minimum: 1, maximum: 5 }
 *               comment:
 *                 type: string
 *               issues:
 *                 type: array
 *                 items:
 *                   type: string
 *               suggestions:
 *                 type: string
 *               wouldRecommend:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Avis créé avec succès
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Avis déjà existant
 */
router.post('/', authenticateToken, createReview);

/**
 * @swagger
 * /api/review/reservation/{reservationId}:
 *   get:
 *     summary: Récupérer l'avis d'une réservation
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Avis récupéré
 *       404:
 *         description: Avis non trouvé
 */
router.get('/reservation/:reservationId', authenticateToken, getReviewByReservation);

/**
 * @swagger
 * /api/review/user/{userId}:
 *   get:
 *     summary: Récupérer tous les avis d'un utilisateur
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des avis
 */
router.get('/user/:userId', authenticateToken, getUserReviews);

/**
 * @swagger
 * /api/review/stats:
 *   get:
 *     summary: Récupérer les statistiques des avis
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: transportType
 *         schema:
 *           type: string
 *           enum: [train, bus, avion, taxi, multimodal]
 *     responses:
 *       200:
 *         description: Statistiques récupérées
 */
router.get('/stats', getReviewStats);

/**
 * @swagger
 * /api/review/{reviewId}:
 *   put:
 *     summary: Mettre à jour un avis
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Avis mis à jour
 *       404:
 *         description: Avis non trouvé
 */
router.put('/:reviewId', authenticateToken, updateReview);

/**
 * @swagger
 * /api/review/{reviewId}:
 *   delete:
 *     summary: Supprimer un avis
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Avis supprimé
 *       404:
 *         description: Avis non trouvé
 */
router.delete('/:reviewId', authenticateToken, deleteReview);

module.exports = router;
