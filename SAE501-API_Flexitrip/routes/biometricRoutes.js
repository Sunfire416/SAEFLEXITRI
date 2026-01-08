const express = require('express');
const router = express.Router();
const multer = require('multer');
const {saveBiometricData} = require('../controllers/biometricController');

// Configurer multer pour gérer les fichiers d'image uploadés
const upload = multer({ dest: 'uploads/' });

/**
 * @swagger
 * tags:
 *   name: Biometrics
 *   description: API pour la gestion des données biométriques
 */

/**
 * @swagger
 * /biometric/recognize:
 *   post:
 *     summary: Reconnaître les points faciaux et enregistrer les données biométriques
 *     tags: [Biometrics]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         type: file
 *         description: Image contenant le visage à analyser
 *         required: true
 *       - in: formData
 *         name: userId
 *         type: string
 *         description: ID de l'utilisateur pour lequel les données biométriques seront associées
 *         required: true
 *     responses:
 *       201:
 *         description: Données biométriques enregistrées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Données biométriques enregistrées avec succès
 *                 landmarks:
 *                   type: array
 *                   items:
 *                     type: number
 *                   description: Liste des points de repère faciaux détectés
 *       500:
 *         description: Erreur lors de la détection ou de l'enregistrement des données biométriques
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Erreur lors de la création des données biométriques
 */

// Route pour la reconnaissance faciale et l'enregistrement des données biométriques
router.post('/recognize', saveBiometricData);

/**
 * AJOUTER CE CODE À LA FIN DE routes/biometricRoutes.js EXISTANT
 * 
 * NE PAS REMPLACER LE FICHIER ENTIER
 * JUSTE AJOUTER CES LIGNES APRÈS LA ROUTE /recognize
 */

// ==========================================
// 🆕 POINT 3 - ENROLLMENT ROUTES
// ==========================================
const enrollmentController = require('../controllers/enrollmentController');
const auth = require('../middleware/auth'); // Si middleware auth existe

/**
 * @swagger
 * /biometric/enrollment/register:
 *   post:
 *     summary: Enregistrement biométrique initial (OCR + Face Match)
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - document_type
 *               - id_photo_recto
 *               - selfie_photo
 *               - consent_given
 *             properties:
 *               user_id:
 *                 type: integer
 *               reservation_id:
 *                 type: integer
 *               document_type:
 *                 type: string
 *                 enum: [passeport, cni]
 *               id_photo_recto:
 *                 type: string
 *                 description: Base64 image
 *               id_photo_verso:
 *                 type: string
 *                 description: Base64 image (optionnel)
 *               selfie_photo:
 *                 type: string
 *                 description: Base64 image
 *               selfie_video_frames:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array base64 frames (optionnel)
 *               consent_given:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Enrollment créé avec succès
 *       400:
 *         description: Erreur validation
 */
router.post('/enrollment/register', auth, enrollmentController.registerEnrollment);

/**
 * @swagger
 * /biometric/enrollment/verify:
 *   post:
 *     summary: Vérifier un enrollment existant
 *     tags: [Enrollment]
 */
router.post('/enrollment/verify', enrollmentController.verifyEnrollment);

/**
 * @swagger
 * /biometric/enrollment/:user_id:
 *   get:
 *     summary: Récupérer enrollment d'un utilisateur
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 */
router.get('/enrollment/:user_id', auth, enrollmentController.getEnrollmentByUserId);

/**
 * @swagger
 * /biometric/enrollment/:enrollment_id:
 *   delete:
 *     summary: Révoquer consentement (RGPD)
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/enrollment/:enrollment_id', auth, enrollmentController.revokeConsent);

/**
 * @swagger
 * /biometric/enrollment/:enrollment_id/anonymize:
 *   delete:
 *     summary: Anonymiser données (RGPD - Droit à l'oubli)
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/enrollment/:enrollment_id/anonymize', auth, enrollmentController.anonymizeEnrollment);

// module.exports = router; // Déjà présent à la fin du fichier existant


module.exports = router;
