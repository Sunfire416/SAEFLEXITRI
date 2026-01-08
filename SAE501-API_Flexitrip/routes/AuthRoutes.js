const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');

/**
 * @swagger
 * /auth/verify-token:
 *   get:
 *     summary: Vérifier la validité d'un token JWT
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valide.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token valide"
 *                 user:
 *                   type: object
 *                   description: Données utilisateur décodées à partir du token.
 *       401:
 *         description: Token manquant ou non fourni.
 *       403:
 *         description: Token invalide ou expiré.
 */
router.get('/verify-token', authenticateToken, (req, res) => {
    // Si le middleware passe, cela signifie que le token est valide
    res.status(200).json({
        message: "Token valide",
        user: req.user, // Données utilisateur décodées ajoutées par le middleware
    });
});

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: L'email de l'utilisateur
 *         example: "john.doe@example.com"
 *       - in: query
 *         name: password
 *         schema:
 *           type: string
 *         required: true
 *         description: Le mot de passe de l'utilisateur
 *         example: "password123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       404:
 *         description: Utilisateur non trouvé
 *       401:
 *         description: Mot de passe invalide
 */
router.post('/login', userController.loginUser);

/**
 * @swagger
 * /users/agent/login:
 *   post:
 *     summary: Connexion d'un agent (Alias pour l'application mobile)
 *     tags: [Users]
 *     description: Permet aux agents de se connecter en envoyant l'email et le mot de passe dans le corps JSON. Utilise la même logique d'authentification que /users/login.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "agent.flexitrip@example.com"
 *                 description: L'email de l'agent.
 *               password:
 *                 type: string
 *                 example: "motdepasseagent"
 *                 description: Le mot de passe de l'agent.
 *     responses:
 *       200:
 *         description: Connexion de l'agent réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Jeton JWT pour l'authentification.
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Utilisateur/Agent non trouvé
 *       401:
 *         description: Mot de passe invalide
 *       500:
 *         description: Erreur serveur
 */
router.post('/agent/login', userController.loginUser);

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Déconnexion de l'utilisateur
 *     tags: [Users]
 *     description: Termine la session d'un utilisateur en supprimant ses informations de session.
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utilisateur déconnecté avec succès."
 *       401:
 *         description: Utilisateur non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Utilisateur non authentifié."
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erreur lors de la déconnexion."
 */

router.post('/logout', userController.logoutUser);

module.exports = router;
