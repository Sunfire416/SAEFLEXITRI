/**
 * Routes Voyage History - Point 5
 * Gestion historique, QR, annulations
 * 
 * Base path: /voyages
 */

const express = require('express');
const router = express.Router();
const voyageController = require('../controllers/voyageHistoryController');

/**
 * GET /voyages/history
 * Récupérer historique voyages utilisateur
 * Query params: user_id, status, limit, skip
 */
router.get('/history', voyageController.getHistory);

/**
 * GET /voyages/:id
 * Récupérer détails d'un voyage
 * Params: id (MongoDB ObjectId)
 * Query: user_id
 */
router.get('/:id', voyageController.getVoyageDetails);

/**
 * GET /voyages/:id/qr
 * Générer QR code pour un voyage
 * Params: id (MongoDB ObjectId)
 * Query: user_id
 */
router.get('/:id/qr', voyageController.generateQR);

/**
 * PATCH /voyages/cancel-checkin/:reservation_id
 * Annuler check-in (boarding pass uniquement)
 * Params: reservation_id (MySQL)
 * Body: { user_id }
 */
router.patch('/cancel-checkin/:reservation_id', voyageController.cancelCheckin);

/**
 * DELETE /voyages/:id
 * Supprimer voyage complet (réservations + voyage)
 * Params: id (MongoDB ObjectId)
 * Body: { user_id }
 */
router.delete('/:id', voyageController.deleteVoyage);

module.exports = router;
