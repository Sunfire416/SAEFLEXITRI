const express = require('express');
const {
  bagageVerification,
  eBilletVerification,
  reconnaissanceFaciale,
  filtrageException,
  confirmationDepot
} = require('../controllers/kafkaController');
const { startConsumer } = require('../controllers/kafkaConsumerController');
const { getConsumedMessages, clearMessagesBuffer } = require('../models/kafkaConsumer');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Kafka
 *   description: Gestion des messages Kafka
 */

/**
 * @swagger
 * /kafka/bagage-verification:
 *   post:
 *     summary: Vérifie les bagages d'un PMR
 *     tags: [Kafka]
 *     description: Produit un message Kafka pour signaler la vérification des bagages.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agentId:
 *                 type: string
 *                 description: ID de l'agent
 *                 example: "agent123"
 *               pmrId:
 *                 type: string
 *                 description: ID du PMR
 *                 example: "pmr456"
 *               status:
 *                 type: string
 *                 description: Statut de la vérification des bagages
 *                 example: "Bagage vérifié"
 *     responses:
 *       200:
 *         description: Message produit avec succès
 *       500:
 *         description: Erreur serveur
 */
router.post('/bagage-verification', bagageVerification);

/**
 * @swagger
 * /kafka/e-billet-verification:
 *   post:
 *     summary: Vérifie le e-billet d'un PMR
 *     tags: [Kafka]
 *     description: Produit un message Kafka pour signaler la vérification du e-billet.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agentId:
 *                 type: string
 *                 description: ID de l'agent
 *                 example: "agent123"
 *               pmrId:
 *                 type: string
 *                 description: ID du PMR
 *                 example: "pmr456"
 *               status:
 *                 type: string
 *                 description: Statut de la vérification du e-billet
 *                 example: "E-billet validé"
 *     responses:
 *       200:
 *         description: Message produit avec succès
 *       500:
 *         description: Erreur serveur
 */
router.post('/e-billet-verification', eBilletVerification);

/**
 * @swagger
 * /kafka/reconnaissance-faciale:
 *   post:
 *     summary: Envoie les résultats de la reconnaissance faciale
 *     tags: [Kafka]
 *     description: Produit un message Kafka pour signaler le résultat de la reconnaissance faciale.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agentId:
 *                 type: string
 *                 description: ID de l'agent
 *                 example: "agent123"
 *               pmrId:
 *                 type: string
 *                 description: ID du PMR
 *                 example: "pmr456"
 *               success:
 *                 type: boolean
 *                 description: Résultat de la reconnaissance faciale (succès ou échec)
 *                 example: true
 *               confidence:
 *                 type: number
 *                 description: Niveau de confiance de la reconnaissance faciale
 *                 example: 98.5
 *     responses:
 *       200:
 *         description: Message produit avec succès
 *       500:
 *         description: Erreur serveur
 */
router.post('/reconnaissance-faciale', reconnaissanceFaciale);

/**
 * @swagger
 * /kafka/filtrage-exception:
 *   post:
 *     summary: Envoie les résultats du filtrage des exceptions
 *     tags: [Kafka]
 *     description: Produit un message Kafka pour signaler les résultats du filtrage des exceptions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agentId:
 *                 type: string
 *                 description: ID de l'agent
 *                 example: "agent123"
 *               exceptionType:
 *                 type: string
 *                 description: Type de l'exception
 *                 example: "Suspicion de fraude"
 *               description:
 *                 type: string
 *                 description: Détails de l'exception
 *                 example: "Suspicion de fraude sur l'e-billet"
 *               status:
 *                 type: string
 *                 description: Statut du filtrage
 *                 example: "Filtrage réussi"
 *     responses:
 *       200:
 *         description: Message produit avec succès
 *       500:
 *         description: Erreur serveur
 */
router.post('/filtrage-exception', filtrageException);

/**
 * @swagger
 * /kafka/confirmation-depot:
 *   post:
 *     summary: Confirme un dépôt d'un PMR
 *     tags: [Kafka]
 *     description: Produit un message Kafka pour confirmer un dépôt d'un PMR.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agentId:
 *                 type: string
 *                 description: ID de l'agent
 *                 example: "agent123"
 *               pmrId:
 *                 type: string
 *                 description: ID du PMR
 *                 example: "pmr456"
 *               depotId:
 *                 type: string
 *                 description: ID du dépôt
 *                 example: "depot789"
 *               status:
 *                 type: string
 *                 description: Statut de la confirmation du dépôt
 *                 example: "Dépôt confirmé"
 *     responses:
 *       200:
 *         description: Message produit avec succès
 *       500:
 *         description: Erreur serveur
 */
router.post('/confirmation-depot', confirmationDepot);

/**
 * @swagger
 * /kafka-consumer/start-consumer:
 *   get:
 *     summary: Démarre le consommateur Kafka
 *     description: Permet de démarrer le consommateur Kafka pour écouter et traiter les messages des sujets spécifiés.
 *     tags: [Kafka]
 *     responses:
 *       200:
 *         description: Le consommateur Kafka a démarré avec succès.
 *         content:
 *           application/json:
 *             example:
 *               message: "Le consommateur Kafka a démarré avec succès."
 *       500:
 *         description: Une erreur s'est produite lors du démarrage du consommateur Kafka.
 *         content:
 *           application/json:
 *             example:
 *               error: "Erreur lors du démarrage du consommateur Kafka."
 */
router.get('/start-consumer', startConsumer);

// Route pour récupérer les messages consommés
router.get('/messages', (req, res) => {
  const messages = getConsumedMessages();
  res.status(200).json(messages);
});

// Route pour vider le buffer de messages
router.delete('/messages', (req, res) => {
  clearMessagesBuffer();
  res.status(200).json({ message: 'Buffer des messages vidé avec succès.' });
});

module.exports = router;
