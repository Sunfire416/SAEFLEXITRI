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
 * /checkin/status/:reservation_id:
 *   get:
 *     summary: Statut check-in d'une réservation
 *     tags: [CheckIn]
 */
router.get('/status/:reservation_id', checkinController.getCheckInStatus);

module.exports = router;
