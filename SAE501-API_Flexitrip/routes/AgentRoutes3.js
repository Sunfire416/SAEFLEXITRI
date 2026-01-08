const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

/**
 * @swagger
 * tags:
 *   name: Agents
 *   description: Gestion des agents des entreprises
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Agent:
 *       type: object
 *       properties:
 *         id_agent:
 *           type: integer
 *           description: "Identifiant unique de l'agent"
 *         name:
 *           type: string
 *           description: "Nom de l'agent"
 *         surname:
 *           type: string
 *           description: "Prénom de l'agent"
 *         email:
 *           type: string
 *           description: "Email de l'agent"
 *         phone:
 *           type: string
 *           description: "Numéro de téléphone de l'agent"
 *         entreprise:
 *           type: string
 *           description: "Entreprise de l'agent"
 *         password:
 *           type: string
 *           description: "Mot de passe de l'agent"
 */

/**
 * @swagger
 * paths:
 *   /login:
 *     post:
 *       summary: "Authentifier un agent"
 *       description: "Permet à un agent de se connecter en utilisant son email et son mot de passe."
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                   description: "L'email de l'agent"
 *                 password:
 *                   type: string
 *                   description: "Le mot de passe de l'agent"
 *       responses:
  *         200:
 *           description: "Connexion réussie"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   token:
 *                     type: string
 *                     description: "Le token JWT généré pour l'agent"
 *                   agent:
 *                     $ref: '#/components/schemas/Agent'
 *         400:
 *           description: "Champs manquants ou invalides"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     description: "Détail de l'erreur"
 *         401:
 *           description: "Mot de passe invalide"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     description: "Détail de l'erreur"
 *         404:
 *           description: "Agent non trouvé"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     description: "Détail de l'erreur"
 *         500:
 *           description: "Erreur serveur"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     description: "Détail de l'erreur"
 */
router.post('/login', agentController.loginAgent);

/**
 * @swagger
 * /agent/insert:
 *   post:
 *     summary: "Créer un nouvel agent"
 *     tags: [Agents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: "Nom de l'agent"
 *               surname:
 *                 type: string
 *                 description: "Prénom de l'agent"
 *               email:
 *                 type: string
 *                 description: "Email de l'agent"
 *               phone:
 *                 type: string
 *                 description: "Numéro de téléphone de l'agent"
 *               address:
 *                 type: string
 *                 description: "Adresse de l'agent"
 *               role:
 *                 type: string
 *                 enum: [Agent]
 *                 description: "Le rôle de l'agent"
 *               password:
 *                 type: string
 *                 description: "Mot de passe de l'agent"
 *     responses:
 *       201:
 *         description: "Agent créé avec succès."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Message de succès"
 *                 agent:
 *                   $ref: '#/components/schemas/Agent'
 *       400:
 *         description: "Erreur de validation ou email déjà utilisé."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: "Détail de l'erreur"
 *       500:
 *         description: "Erreur serveur."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: "Détail de l'erreur"*/
router.post('/insert', agentController.insertAgent);

/**
 * @swagger
 * /agent/getAll:
 *   get:
 *     summary: Récupérer tous les agents
 *     tags: [Agents]
 *     responses:
 *       200:
 *         description: Liste de tous les agents.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Agent'
 *       500:
 *         description: Erreur serveur.
 */
router.get('/getAll', agentController.getAllAgents);

/**
 * @swagger
 * /agent/get/{id}:
 *   get:
 *     summary: Récupérer un agent par son ID
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'agent
 *     responses:
 *       200:
 *         description: Agent Récupéré avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Agent'
 *       404:
 *         description: Agent non trouvé.
 *       500:
 *         description: Erreur serveur.
 */
router.get('/get/:id', agentController.getAgentById);

/**
 * @swagger
 * /agent/update/{id}:
 *   put:
 *     summary: Mettre à jour un agent par son ID
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'agent
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Agent mis à jour avec succès.
 *       404:
 *         description: Agent non trouvé.
 *       500:
 *         description: Erreur serveur.
 */
router.put('/update/:id', agentController.updateAgent);

/**
 * @swagger
 * /agent/delete/{id}:
 *   delete:
 *     summary: Supprimer un agent par son ID
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'agent
 *     responses:
 *       200:
 *         description: Agent supprimé avec succès.
 *       404:
 *         description: Agent non trouvé.
 *       500:
 *         description: Erreur serveur.
 */
router.delete('/delete/:id', agentController.deleteAgent);

// Route pour récupérer les informations de l'agent
/**
 * @swagger
 * /agent/getCompanyInfo/{idAgent}:
 *   get:
 *     summary: Récupère les informations d'un agent et de son entreprise.
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: idAgent
 *         required: true
 *         schema:
 *           type: integer
 *         description: L'ID de l'agent
 *     responses:
 *       200:
 *         description: Informations de l'agent récupérées avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                   description: L'email de l'agent.
 *                 entreprise:
 *                   type: string
 *                   description: L'entreprise de l'agent.
 *       404:
 *         description: Agent non trouvé ou informations de l'entreprise non trouvées.
 *       400:
 *         description: L'agent ne fait pas partie de l'entreprise AF.
 *       500:
 *         description: Erreur interne du serveur.
 */
router.get('/getCompanyInfo/:id', agentController.getInfoCompanyAgent);

/**
 * @swagger
 * /agent/getPMRAssociateToAgent/{id}:
 *   get:
 *     summary: Récupérer les PMR associés à un agent
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'agent
 *     responses:
 *       200:
 *         description: PMR associés récupérés avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nom:
 *                     type: string
 *                   prenom:
 *                     type: string
 *                   autresDetails:
 *                     type: string
 *       404:
 *         description: Agent ou informations non trouvées.
 *       500:
 *         description: Erreur serveur.
 */

router.get('/getPMRAssociateToAgent/:id', agentController.getPMRAssociateToAgent);

/**
 * @swagger
 * /agent/baggage-verification:
 *   put:
 *     summary: "Vérification des bagages pour un agent"
 *     tags: [Agents]
 *     parameters:
 *       - in: query
 *         name: id_reservation
 *         type: integer
 *         required: true
 *         description: "ID de la réservation."
 *       - in: query
 *         name: entreprise
 *         type: string
 *         required: true
 *         enum: ["AF", "SNCF"]
 *         description: "Entreprise effectuant la vérification (AF ou SNCF)."
 *       - in: query
 *         name: statusBagage
 *         type: boolean
 *         required: true
 *         description: "Détails des bagages à vérifier."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             id_reservation: 12345
 *             entreprise: "AF"
 *             statusBagage: true
 *     responses:
 *       200:
 *         description: "Vérification des bagages effectuée avec succès."
 *         content:
 *           application/json:
 *             example:
 *               message: "Vérification effectuée avec succès."
 *               success: true
 *       400:
 *         description: "Erreur de validation ou données manquantes."
 *       500:
 *         description: "Erreur serveur."
 */
router.put('/baggage-verification', agentController.ChangeBagageVerif);

module.exports = router;


