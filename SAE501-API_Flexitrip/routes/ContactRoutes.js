const express = require('express');
const router = express.Router();
const contactController = require('../controllers/ContactController');

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Gestion des contacts et des messages
 */

/**
 * @swagger
 * /contact/send-email:
 *   post:
 *     summary: Envoyer un e-mail de contact
 *     tags: [Contact]
 *     parameters:
 *       - in: query
 *         name: recipientEmail
 *         required: true
 *         description: Email du destinataire
 *         schema:
 *           type: string
 *       - in: query
 *         name: subject
 *         required: true
 *         description: Sujet de l'e-mail
 *         schema:
 *           type: string
 *       - in: query
 *         name: message
 *         required: true
 *         description: Message à envoyer
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipientEmail:
 *                 type: string
 *                 description: "Email du destinataire."
 *               subject:
 *                 type: string
 *                 description: "Sujet de l'e-mail."
 *               message:
 *                 type: string
 *                 description: "Message à envoyer."
 *       example:
 *         value: |
 *           {
 *             "recipientEmail": "example@example.com",
 *             "subject": "Sujet de l'email",
 *             "message": "Votre message ici"
 *           }
 *     responses:
 *       200:
 *         description: "E-mail envoyé avec succès."
 *       400:
 *         description: "Erreur dans l'envoi de l'e-mail."
 */
router.post('/send-email', contactController.sendContactMail);

/**
 * @swagger
 * /contact/receive-message:
 *   post:
 *     summary: Recevoir un message de l'utilisateur
 *     tags: [Contact]
 *     parameters:
 *       - in: query
 *         name: Nom
 *         required: true
 *         description: Nom de l'utilisateur
 *         schema:
 *           type: string
 *       - in: query
 *         name: Prenom
 *         required: true
 *         description: Prénom de l'utilisateur
 *         schema:
 *           type: string
 *       - in: query
 *         name: userEmail
 *         required: true
 *         description: Email de l'utilisateur
 *         schema:
 *           type: string
 *       - in: query
 *         name: message
 *         required: true
 *         description: Message de l'utilisateur
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Nom:
 *                 type: string
 *                 description: "Nom de l'utilisateur."
 *               Prenom:
 *                 type: string
 *                 description: "Prénom de l'utilisateur."
 *               userEmail:
 *                 type: string
 *                 description: "Email de l'utilisateur."
 *               message:
 *                 type: string
 *                 description: "Message envoyé par l'utilisateur."
 *       example:
 *         value: |
 *           {
 *             "Nom": "John",
 *             "Prenom": "Doe",
 *             "userEmail": "user@example.com",
 *             "message": "Votre message ici"
 *           }
 *     responses:
 *       200:
 *         description: "Message reçu avec succès."
 *       400:
 *         description: "L'email de l'utilisateur et le message sont requis."
 */
router.post('/receive-message', contactController.receiveUserMessage);

module.exports = router;
