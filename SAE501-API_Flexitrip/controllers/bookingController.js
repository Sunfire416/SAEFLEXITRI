/**
 * Contrôleur pour la réservation adaptative
 */

const bookingService = require('../services/bookingService');
const workflowDecisionService = require('../services/workflowDecisionService');

/**
 * @swagger
 * /api/booking/create:
 *   post:
 *     summary: Créer une réservation avec workflow adaptatif
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itinerary:
 *                 type: object
 *               pmr_needs:
 *                 type: object
 *     responses:
 *       200:
 *         description: Réservation créée avec succès
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 */
async function createBooking(req, res) {
    try {
        const { itinerary, pmr_needs } = req.body;
        const userId = req.user.id;  // Le JWT contient { id: user.user_id }
        
        if (!itinerary) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: itinerary'
            });
        }
        
        // pmr_needs est optionnel, utiliser un objet vide par défaut
        const prmNeeds = pmr_needs || {};
        
        // Crée la réservation
        const result = await bookingService.createBooking(userId, itinerary, prmNeeds);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json(result);
        
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * @swagger
 * /api/booking/workflow-preview:
 *   post:
 *     summary: Prévisualise le workflow qui sera appliqué
 *     tags: [Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itinerary:
 *                 type: object
 *     responses:
 *       200:
 *         description: Workflow déterminé
 */
async function previewWorkflow(req, res) {
    try {
        const { itinerary } = req.body;
        
        if (!itinerary) {
            return res.status(400).json({
                success: false,
                error: 'Missing itinerary'
            });
        }
        
        const workflow = workflowDecisionService.determineWorkflow(itinerary);
        
        res.json({
            success: true,
            workflow: workflow
        });
        
    } catch (error) {
        console.error('Workflow preview error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * @swagger
 * /api/booking/:id:
 *   get:
 *     summary: Récupère les détails d'une réservation
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails de la réservation
 *       404:
 *         description: Réservation non trouvée
 */
async function getBookingDetails(req, res) {
    try {
        const voyageId = parseInt(req.params.id);
        const userId = req.user.id;
        
        const result = await bookingService.getBookingDetails(voyageId, userId);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.json(result);
        
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

module.exports = {
    createBooking,
    previewWorkflow,
    getBookingDetails
};
