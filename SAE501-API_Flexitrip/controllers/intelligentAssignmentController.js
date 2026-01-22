/**
 * Contrôleur pour l'Assignation Intelligente IA - MIGRATION SUPABASE
 */

const intelligentAssignmentService = require('../services/intelligentAssignmentService');
const SupabaseService = require('../services/SupabaseService');

/**
 * Assigne automatiquement l'agent le plus approprié
 */
exports.assignAgent = async (req, res) => {
  try {
    const { reservation_id, user_id } = req.body;

    if (!reservation_id || !user_id) {
      return res.status(400).json({ error: 'reservation_id et user_id requis' });
    }

    const result = await intelligentAssignmentService.assignBestAgent(req.body);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erreur assignAgent:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Récupère la liste des agents disponibles
 */
exports.getAvailableAgents = async (req, res) => {
  try {
    const agents = await intelligentAssignmentService.findAvailableAgentsWithScores(req.query);
    res.json({ success: true, agents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Stubs for other methods to prevent routing errors
exports.reevaluatePriority = (req, res) => res.json({ success: true, message: "Not implemented in simplified version" });
exports.monitorMissions = (req, res) => res.json({ success: true, message: "Not implemented" });
exports.reassignAgent = (req, res) => res.json({ success: true, message: "Not implemented" });
exports.getAgentAvailability = (req, res) => res.json({ success: true, availability: { status: 'available' } });
exports.updateAgentAvailability = (req, res) => res.json({ success: true });
exports.getAgentSkills = (req, res) => res.json({ success: true, skills: [] });
exports.updateAgentSkills = (req, res) => res.json({ success: true });
exports.getStatistics = (req, res) => res.json({ success: true, statistics: {} });
