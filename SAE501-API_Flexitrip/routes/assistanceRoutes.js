/**
 * Routes pour gestion des assistances PMR
 */

const express = require('express');
const router = express.Router();
const assistanceController = require('../controllers/assistanceController');

/**
 * @swagger
 * /api/assistance/book:
 *   post:
 *     summary: Réserve l'assistance pour un segment
 *     tags: [Assistance]
 */
router.post('/book', assistanceController.bookAssistance);

/**
 * @swagger
 * /api/assistance/book-voyage:
 *   post:
 *     summary: Réserve l'assistance pour tous les segments d'un voyage
 *     tags: [Assistance]
 */
router.post('/book-voyage', assistanceController.bookVoyageAssistance);

/**
 * @swagger
 * /api/assistance/plan-transfer:
 *   post:
 *     summary: Planifie l'assistance pour un transfert entre 2 segments
 *     tags: [Assistance]
 */
router.post('/plan-transfer', assistanceController.planTransfer);

/**
 * @swagger
 * /api/assistance/status/:segment_id:
 *   get:
 *     summary: Obtient le statut de réservation d'assistance
 *     tags: [Assistance]
 */
router.get('/status/:segment_id', assistanceController.getAssistanceStatus);

/**
 * @swagger
 * /api/assistance/monitor-voyage:
 *   post:
 *     summary: Démarre le monitoring temps réel d'un voyage
 *     tags: [Assistance]
 */
router.post('/monitor-voyage', assistanceController.monitorVoyage);

/**
 * @swagger
 * /api/assistance/handle-delay:
 *   post:
 *     summary: Gère un retard détecté sur un segment
 *     tags: [Assistance]
 */
router.post('/handle-delay', assistanceController.handleDelay);

/**
 * @swagger
 * /api/assistance/suggest-alternatives:
 *   post:
 *     summary: Propose des alternatives en cas de correspondance manquée
 *     tags: [Assistance]
 */
router.post('/suggest-alternatives', assistanceController.suggestAlternatives);

/**
 * @swagger
 * /api/assistance/transfer-points/:voyage_id:
 *   get:
 *     summary: Identifie les points de correspondance d'un voyage
 *     tags: [Assistance]
 */
router.get('/transfer-points/:voyage_id', assistanceController.getTransferPoints);

module.exports = router;
