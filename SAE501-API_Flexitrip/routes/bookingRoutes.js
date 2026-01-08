/**
 * Routes pour la réservation adaptative
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

// Toutes les routes nécessitent authentification
router.use(authMiddleware);

// Créer une réservation
router.post('/create', bookingController.createBooking);

// Prévisualiser le workflow
router.post('/workflow-preview', bookingController.previewWorkflow);

// Récupérer les détails d'une réservation
router.get('/:id', bookingController.getBookingDetails);

module.exports = router;
