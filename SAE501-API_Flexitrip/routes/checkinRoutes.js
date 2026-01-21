const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkinController');

/**
 * @swagger
 * tags:
 *   name: CheckIn
 *   description: Check-in kiosk et gare
 */

/**
 * GET /checkin/search-reservation
 * Rechercher une réservation par booking_reference
 */
router.get('/search-reservation', checkinController.searchReservation);

/**
 * @swagger
 * /checkin/scan:
 *   post:
 *     summary: Scanner QR enrollment + vérification faciale
 *     tags: [CheckIn]
 */
router.post('/scan', checkinController.scanCheckIn);

/**
 * @swagger
 * /checkin/manual:
 *   post:
 *     summary: Check-in manuel par agent
 *     tags: [CheckIn]
 */
router.post('/manual', checkinController.manualCheckIn);

/**
 * @swagger
 * /checkin/:id/status:
 *   get:
 *     summary: Statut check-in d'une réservation
 *     tags: [CheckIn]
 */
router.get('/:id/status', checkinController.getCheckInStatus);

/**
 * @swagger
 * /checkin/:id:
 *   post:
 *     summary: Effectuer le check-in d'une réservation
 *     tags: [CheckIn]
 */
router.post('/:id', checkinController.scanCheckIn);

module.exports = router;
