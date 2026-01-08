const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');


/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         User_ID:
 *           type: integer
 *           description: L'ID unique de l'utilisateur
 *         Nom:
 *           type: string
 *           description: Le nom de l'utilisateur
 *         Prenom:
 *           type: string
 *           description: Le prénom de l'utilisateur
 *         Email:
 *           type: string
 *           description: L'email de l'utilisateur
 *         Telephone:
 *           type: string
 *           description: Le numéro de téléphone de l'utilisateur
 *         Adresse:
 *           type: string
 *           description: L'adresse de l'utilisateur
 *         Role:
 *           type: string
 *           description: Le rôle de l'utilisateur
 *         Password:
 *           type: string
 *           description: Le mot de passe de l'utilisateur
 */

/**
 * @swagger
 * /users/insert:
 *   post:
 *     summary: Insérer un nouvel utilisateur
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         description: Le nom de l'utilisateur
 *         schema:
 *           type: string
 *       - in: query
 *         name: surname
 *         required: true
 *         description: Le prénom de l'utilisateur
 *         schema:
 *           type: string
 *       - in: query
 *         name: email
 *         required: true
 *         description: L'email de l'utilisateur
 *         schema:
 *           type: string
 *       - in: query
 *         name: phone
 *         required: true
 *         description: Le numéro de téléphone de l'utilisateur
 *         schema:
 *           type: string
 *       - in: query
 *         name: address
 *         required: false
 *         description: L'adresse de l'utilisateur
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         required: true
 *         description: Le rôle de l'utilisateur
 *         schema:
 *           type: string
 *       - in: query
 *         name: password
 *         required: true
 *         description: Le mot de passe de l'utilisateur
 *         schema:
 *           type: string
 *       - in: query
 *         name: pmr_assistance
 *         required: false
 *         description: Assistance PMR de l'utilisateur
 *         schema:
 *           type: boolean
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: "Nom de l'utilisateur"
 *               surname:
 *                 type: string
 *                 description: "Prénom de l'utilisateur"
 *               email:
 *                 type: string
 *                 description: "Email de l'utilisateur"
 *               phone:
 *                 type: string
 *                 description: "Numéro de téléphone de l'utilisateur"
 *               address:
 *                 type: string
 *                 description: "Adresse de l'utilisateur"
 *               role:
 *                 type: string
 *                 description: "Rôle de l'utilisateur"
 *               password:
 *                 type: string
 *                 description: "Mot de passe de l'utilisateur"
 *               pmr_assistance:
 *                 type: boolean
 *                 description: "Assistance PMR de l'utilisateur"
 *       example:
 *         value: |
 *           {
 *             "name": "John",
 *             "surname": "Doe",
 *             "email": "john.doe@example.com",
 *             "phone": "1234567890",
 *             "address": "123 Main St",
 *             "role": "admin",
 *             "password": "password123",
 *             "pmr_assistance": false
 *           }
 *     responses:
 *       201:
 *         description: "Utilisateur ajouté avec succès."
 *       400:
 *         description: "Données invalides ou champs manquants."
 *       500:
 *         description: "Erreur lors de l'insertion de l'utilisateur."
 */
router.post('/insert', userController.insertUser);

/**
 * @swagger
 * /users/getAll:
 *   get:
 *     summary: Récupérer tous les utilisateurs
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Liste de tous les utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Erreur lors de la récupération des utilisateurs
 */
router.get('/getAll', authenticateToken, userController.getAllUsers);

/**
 * @swagger
 * /users/get/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: L'ID de l'utilisateur à récupérer
 *     responses:
 *       200:
 *         description: L'utilisateur a été trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/get/:id', authenticateToken, userController.getUserById);

/**
 * @swagger
 * /users/update/{id}:
 *   put:
 *     summary: Mettre à jour un utilisateur par ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: L'ID de l'utilisateur à mettre à jour
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Le nom de l'utilisateur
 *         example: "John"
 *       - in: query
 *         name: surname
 *         schema:
 *           type: string
 *         description: Le prénom de l'utilisateur
 *         example: "Doe"
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: L'email de l'utilisateur
 *         example: "john.doe@example.com"
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: Le numéro de téléphone de l'utilisateur
 *         example: "+1234567890"
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *         description: L'adresse de l'utilisateur
 *         example: "123 Rue Exemple, Paris"
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Admin, User, Agent]
 *         description: Le rôle de l'utilisateur
 *         example: "User"
 *       - in: query
 *         name: password
 *         schema:
 *           type: string
 *         description: Le mot de passe de l'utilisateur
 *         example: "newpassword123"
 *       - in: query
 *         name: pmr_assistance
 *         schema:
 *           type: boolean
 *         description: Si l'utilisateur nécessite une assistance PMR
 *         example: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John"
 *               surname:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               address:
 *                 type: string
 *                 example: "123 Rue Exemple, Paris"
 *               role:
 *                 type: string
 *                 enum: [Admin, User, Agent]
 *                 example: "User"
 *               password:
 *                 type: string
 *                 example: "newpassword123"
 *               pmr_assistance:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour avec succès
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur lors de la mise à jour de l'utilisateur
 */
router.put('/update/:id', authenticateToken, userController.updateUser);

/**
 * @swagger
 * /users/delete/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur par ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: L'ID de l'utilisateur à supprimer
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur lors de la suppression de l'utilisateur
 */
router.delete('/delete/:id', authenticateToken, userController.deleteUser);

/**
 * @swagger
 * /users/insertAgent:
 *   post:
 *     summary: Création d'un nouvel agent
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - surname
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Agent créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 agent:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     surname:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     address:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Données manquantes ou email déjà utilisé
 *       500:
 *         description: Erreur serveur
 */

router.post('/insertAgent', userController.insertAgent);

/**
 * @swagger
 * /users/getPMR:
 *   post:
 *     summary: Récupérer les utilisateurs ayant le rôle PMR
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Liste des utilisateurs ayant le rôle PMR
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Erreur lors de la récupération des PMR
 */
router.post('/getPMR', userController.getUserWithPMRRole);

/**
 * @swagger
 * /users/getAccompagnant:
 *   post:
 *     summary: Récupérer les utilisateurs ayant le rôle d'accompagnant
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Liste des utilisateurs ayant le rôle d'accompagnant
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Erreur lors de la récupération des accompagnants
 */
router.post('/getAccompagnant', userController.getUserWithAccompagnantRole);


/**
 * @swagger
 * /users/getVoyageByPMRID/{idPMR}:
 *   get:
 *     summary: Récupérer les voyages associés à un PMR
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: idPMR
 *         required: true
 *         description: L'ID du PMR pour lequel récupérer les voyages associés
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des voyages associés au PMR
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   destination:
 *                     type: string
 *                   date_depart:
 *                     type: string
 *                     format: date-time
 *                   date_arrivee:
 *                     type: string
 *                     format: date-time
 *                   status:
 *                     type: string
 *       404:
 *         description: Aucun voyage trouvé pour ce PMR
 *       500:
 *         description: Erreur lors de la récupération des voyages
 */
router.get('/getVoyageByPMRID/:idPMR', userController.getVoyageWithIdPMR);


module.exports = router;
