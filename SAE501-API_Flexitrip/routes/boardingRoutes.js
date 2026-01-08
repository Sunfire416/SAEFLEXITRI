const express = require('express');
const router = express.Router();
const boardingController = require('../controllers/boardingController');

/**
 * @swagger
 * tags:
 *   name: Boarding
 *   description: Validation embarquement porte
 */

/**
 * @swagger
 * /boarding/validate:
 *   post:
 *     summary: Validation complète embarquement (QR + Face)
 *     tags: [Boarding]
 */
router.post('/validate', boardingController.validateBoarding);

/**
 * @swagger
 * /boarding/scan-gate:
 *   post:
 *     summary: Scanner rapide QR à la porte
 *     tags: [Boarding]
 */
router.post('/scan-gate', boardingController.scanGate);

/**
 * @swagger
 * /boarding/pass/:reservation_id:
 *   get:
 *     summary: Récupérer boarding pass
 *     tags: [Boarding]
 */
router.get('/pass/:reservation_id', boardingController.getBoardingPass);

/**
 * @swagger
 * /boarding/pass/:pass_id/cancel:
 *   patch:
 *     summary: Annuler boarding pass
 *     tags: [Boarding]
 */
router.patch('/pass/:pass_id/cancel', boardingController.cancelBoardingPass);

module.exports = router;
