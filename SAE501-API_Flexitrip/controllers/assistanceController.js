/**
 * Controller pour la gestion des assistances PMR
 */

const assistanceBookingService = require('../services/assistanceBookingService');
const assistanceCoordinationService = require('../services/assistanceCoordinationService');
const perturbationService = require('../services/perturbationService');

/**
 * @route POST /api/assistance/book
 * @desc Réserve l'assistance pour un segment
 */
exports.bookAssistance = async (req, res) => {
    try {
        const { segment, pmr_needs, user_id } = req.body;

        if (!segment || !user_id) {
            return res.status(400).json({
                success: false,
                error: 'Segment et user_id requis'
            });
        }

        const result = await assistanceBookingService.bookAssistanceWithOperator(
            segment,
            pmr_needs || {},
            user_id
        );

        res.status(result.success ? 200 : 400).json(result);

    } catch (error) {
        console.error('❌ Erreur réservation assistance:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @route POST /api/assistance/book-voyage
 * @desc Réserve l'assistance pour tous les segments d'un voyage
 */
exports.bookVoyageAssistance = async (req, res) => {
    try {
        const { voyage, pmr_needs } = req.body;

        if (!voyage || !voyage.segments) {
            return res.status(400).json({
                success: false,
                error: 'Voyage avec segments requis'
            });
        }

        const result = await assistanceBookingService.bookAssistanceForVoyage(
            voyage,
            pmr_needs || {}
        );

        res.status(result.success ? 200 : 400).json(result);

    } catch (error) {
        console.error('❌ Erreur réservation voyage:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @route POST /api/assistance/plan-transfer
 * @desc Planifie l'assistance pour un transfert entre 2 segments
 */
exports.planTransfer = async (req, res) => {
    try {
        const { segment1, segment2, location, passenger_profile } = req.body;

        if (!segment1 || !segment2 || !location) {
            return res.status(400).json({
                success: false,
                error: 'segment1, segment2 et location requis'
            });
        }

        const result = await assistanceCoordinationService.planTransferAssistance(
            segment1,
            segment2,
            location,
            passenger_profile || {}
        );

        res.status(result.success ? 200 : 400).json(result);

    } catch (error) {
        console.error('❌ Erreur planification transfert:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @route GET /api/assistance/status/:segment_id
 * @desc Obtient le statut de réservation d'assistance pour un segment
 */
exports.getAssistanceStatus = async (req, res) => {
    try {
        const { segment_id } = req.params;
        const { segment } = req.query;

        if (!segment) {
            return res.status(400).json({
                success: false,
                error: 'Paramètre segment requis (JSON)'
            });
        }

        const segmentData = JSON.parse(segment);
        const status = assistanceBookingService.getAssistanceStatus(segmentData);

        res.status(200).json({
            success: true,
            status: status
        });

    } catch (error) {
        console.error('❌ Erreur statut assistance:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @route POST /api/assistance/monitor-voyage
 * @desc Démarre le monitoring temps réel d'un voyage
 */
exports.monitorVoyage = async (req, res) => {
    try {
        const { voyage } = req.body;

        if (!voyage || !voyage.voyage_id) {
            return res.status(400).json({
                success: false,
                error: 'Voyage avec voyage_id requis'
            });
        }

        const result = await perturbationService.monitorRealTimeData(voyage);

        res.status(result.success ? 200 : 400).json(result);

    } catch (error) {
        console.error('❌ Erreur monitoring:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @route POST /api/assistance/handle-delay
 * @desc Gère un retard détecté sur un segment
 */
exports.handleDelay = async (req, res) => {
    try {
        const { voyage_id, segment_id, new_time, delay_minutes } = req.body;

        if (!voyage_id || !segment_id || !new_time) {
            return res.status(400).json({
                success: false,
                error: 'voyage_id, segment_id et new_time requis'
            });
        }

        const result = await perturbationService.handleDelay(
            voyage_id,
            segment_id,
            new_time,
            delay_minutes || 0
        );

        res.status(result.success ? 200 : 400).json(result);

    } catch (error) {
        console.error('❌ Erreur gestion retard:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @route POST /api/assistance/suggest-alternatives
 * @desc Propose des alternatives en cas de correspondance manquée
 */
exports.suggestAlternatives = async (req, res) => {
    try {
        const { voyage_id, missed_segment_id, from_time, passenger_profile } = req.body;

        if (!voyage_id || !missed_segment_id) {
            return res.status(400).json({
                success: false,
                error: 'voyage_id et missed_segment_id requis'
            });
        }

        const alternatives = await perturbationService.suggestAlternatives({
            voyage_id,
            missed_segment_id,
            from_time: from_time || new Date(),
            passenger_profile: passenger_profile || {}
        });

        res.status(200).json({
            success: true,
            count: alternatives.length,
            alternatives: alternatives
        });

    } catch (error) {
        console.error('❌ Erreur suggestions alternatives:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @route GET /api/assistance/transfer-points/:voyage_id
 * @desc Identifie les points de correspondance d'un voyage
 */
exports.getTransferPoints = async (req, res) => {
    try {
        const { voyage_id } = req.params;
        const { voyage } = req.query;

        if (!voyage) {
            return res.status(400).json({
                success: false,
                error: 'Paramètre voyage requis (JSON)'
            });
        }

        const voyageData = JSON.parse(voyage);
        const transferPoints = assistanceCoordinationService.identifyTransferPoints(voyageData);

        res.status(200).json({
            success: true,
            voyage_id: voyage_id,
            transfer_points: transferPoints
        });

    } catch (error) {
        console.error('❌ Erreur points transfert:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = exports;
