const express = require('express');
const router = express.Router();
const { createReview, getReviewByReservation, getUserReviews, getReviewStats, updateReview, deleteReview } = require('../controllers/reviewController');
const authenticateToken = require('../middleware/auth');

router.post('/', authenticateToken, createReview);
router.get('/reservation/:reservationId', authenticateToken, getReviewByReservation);
router.get('/user/:userId', authenticateToken, getUserReviews);
router.get('/stats', authenticateToken, getReviewStats);
router.put('/:reviewId', authenticateToken, updateReview);
router.delete('/:reviewId', authenticateToken, deleteReview);

module.exports = router;
