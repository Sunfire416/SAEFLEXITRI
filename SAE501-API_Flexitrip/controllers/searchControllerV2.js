/**
 * Controller pour la recherche multimodale avancée
 */

const searchService = require('../services/searchService');
const assistanceBookingService = require('../services/assistanceBookingService');
const workflowService = require('../services/workflowService');

/**
 * @route POST /api/search/multimodal
 * @desc Recherche itinéraire multimodal avec filtres PMR
 */
exports.searchMultimodal = async (req, res) => {
    try {
        const { origin, destination, date, pmr_needs } = req.body;

        if (!origin || !destination) {
            return res.status(400).json({
                success: false,
                error: 'Origine et destination requises'
            });
        }

        const results = await searchService.searchMultimodalRoute(
            origin,
            destination,
            date,
            pmr_needs || {}
        );

        res.status(200).json(results);

    } catch (error) {
        console.error('❌ Erreur recherche multimodale:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @route POST /api/search/validate-booking-deadlines
 * @desc Valide les délais de réservation pour un voyage
 */
exports.validateBookingDeadlines = async (req, res) => {
    try {
        const { voyage } = req.body;

        if (!voyage || !voyage.segments) {
            return res.status(400).json({
                success: false,
                error: 'Voyage avec segments requis'
            });
        }

        const validation = assistanceBookingService.checkAllDeadlines(voyage);

        res.status(200).json({
            success: true,
            validation: validation
        });

    } catch (error) {
        console.error('❌ Erreur validation deadlines:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @route POST /api/search/define-workflow
 * @desc Définit le workflow PMR pour un voyage
 */
exports.defineWorkflow = async (req, res) => {
    try {
        const { voyage } = req.body;

        if (!voyage || !voyage.segments) {
            return res.status(400).json({
                success: false,
                error: 'Voyage avec segments requis'
            });
        }

        const steps = workflowService.defineWorkflowSteps(voyage);
        const deadlines = workflowService.calculateStepDeadlines(voyage);

        res.status(200).json({
            success: true,
            workflow_steps: steps,
            deadlines: deadlines
        });

    } catch (error) {
        console.error('❌ Erreur définition workflow:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = exports;
