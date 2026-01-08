const express = require('express');
const router = express.Router();
const facturationController = require('../controllers/FacturationController');
const authenticateToken = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Facturation
 *   description: Gestion des facturations
 */

/**
 * @swagger
 * /facturation/insert:
 *   post:
 *     summary: Ajouter une facturation
 *     tags: [Facturation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reservation_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: L'ID de la réservation associée
 *         example: 12345
 *       - in: query
 *         name: amount
 *         schema:
 *           type: number
 *           format: float
 *         required: true
 *         description: Le montant de la facturation
 *         example: 99.99
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *         required: true
 *         description: Le statut du paiement
 *         example: "paid"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reservation_id:
 *                 type: integer
 *                 description: ID de la réservation associée
 *                 example: 12345
 *               amount:
 *                 type: number
 *                 description: Montant de la facturation
 *                 example: 99.99
 *               payment_status:
 *                 type: string
 *                 description: Statut du paiement
 *                 example: "paid"
 *     responses:
 *       201:
 *         description: Facturation ajoutée avec succès.
 *       404:
 *         description: Réservation associée non trouvée.
 *       500:
 *         description: Erreur lors de l'ajout de la facturation.
 */
router.post('/insert', authenticateToken, facturationController.createFacture);

/**
 * @swagger
 * /facturation/getAll:
 *   get:
 *     summary: Récupérer toutes les facturations
 *     tags: [Facturation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de toutes les facturations.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Facturation'
 *       500:
 *         description: Erreur lors de la récupération des facturations.
 */
router.get('/getAll', authenticateToken, facturationController.getAllFactures);

/**
 * @swagger
 * /facturation/get/{id}:
 *   get:
 *     summary: Récupérer une facturation par ID
 *     tags: [Facturation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la facturation
 *     responses:
 *       200:
 *         description: Facturation récupérée avec succès.
 *       404:
 *         description: Facturation non trouvée.
 *       500:
 *         description: Erreur lors de la récupération de la facturation.
 */
router.get('/get/:id', authenticateToken, facturationController.getFactureById);

/**
 * @swagger
 * /facturation/update/{id}:
 *   put:
 *     summary: Mettre à jour une facturation par ID
 *     tags: [Facturation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la facturation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Nouveau montant de la facturation
 *               payment_status:
 *                 type: string
 *                 description: Nouveau statut du paiement
 *     responses:
 *       200:
 *         description: Facturation mise à jour avec succès.
 *       404:
 *         description: Facturation non trouvée.
 *       500:
 *         description: Erreur lors de la mise à jour de la facturation.
 */
router.put('/update/:id', authenticateToken, facturationController.updateFacture);

/**
 * @swagger
 * /facturation/delete/{id}:
 *   delete:
 *     summary: Supprimer une facturation par ID
 *     tags: [Facturation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la facturation
 *     responses:
 *       200:
 *         description: Facturation supprimée avec succès.
 *       404:
 *         description: Facturation non trouvée.
 *       500:
 *         description: Erreur lors de la suppression de la facturation.
 */
router.delete('/delete/:id', authenticateToken, facturationController.deleteFacture);

module.exports = router;
