/**
 * Contrôleur pour l'Assignation Intelligente IA
 * Gestion des endpoints d'assignation automatique et de monitoring
 */

const intelligentAssignmentService = require('../services/intelligentAssignmentService');
const dynamicPriorityService = require('../services/dynamicPriorityService');
const { AgentAvailability, AgentSkills, Agent, PriseEnCharge, User } = require('../models');
const { Op } = require('sequelize');

/**
 * POST /api/intelligent-assignment/assign
 * Assigne automatiquement l'agent le plus approprié à une mission
 */
exports.assignAgent = async (req, res) => {
  try {
    const {
      prise_en_charge_id,
      reservation_id,
      user_id,
      voyage_id,
      location,
      transport_type,
      is_critical_connection,
      priority_level
    } = req.body;
    
    // Validation
    if (!prise_en_charge_id || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'prise_en_charge_id et user_id sont requis'
      });
    }
    
    console.log(`🤖 [API] Demande d'assignation intelligente pour mission ${prise_en_charge_id}`);
    
    // Récupérer les informations utilisateur PMR
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur introuvable'
      });
    }
    
    // Appeler le service d'assignation
    const result = await intelligentAssignmentService.assignBestAgent({
      prise_en_charge_id,
      reservation_id,
      user_id,
      voyage_id,
      pmrNeeds: user,
      location: location || { lat: 48.8566, lng: 2.3522 }, // Paris par défaut
      transportType: transport_type || 'train',
      isCriticalConnection: is_critical_connection || false,
      priorityLevel: priority_level || 'normal'
    });
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.message,
        reason: result.reason
      });
    }
    
    res.json({
      success: true,
      message: result.message,
      assignment: {
        agent: result.agent,
        score: result.score,
        alternatives: result.alternatives
      }
    });
    
  } catch (error) {
    console.error('❌ [API] Erreur assignAgent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/intelligent-assignment/available-agents
 * Récupère la liste des agents disponibles avec leurs scores pour une mission
 */
exports.getAvailableAgents = async (req, res) => {
  try {
    const {
      user_id,
      location_lat,
      location_lng,
      transport_type,
      is_critical_connection
    } = req.query;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id est requis'
      });
    }
    
    // Récupérer les informations utilisateur PMR
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur introuvable'
      });
    }
    
    const location = location_lat && location_lng
      ? { lat: parseFloat(location_lat), lng: parseFloat(location_lng) }
      : { lat: 48.8566, lng: 2.3522 };
    
    // Récupérer les agents avec scores
    const agentsWithScores = await intelligentAssignmentService.findAvailableAgentsWithScores({
      pmrNeeds: user,
      location: location,
      transportType: transport_type || 'train',
      isCriticalConnection: is_critical_connection === 'true'
    });
    
    res.json({
      success: true,
      count: agentsWithScores.length,
      agents: agentsWithScores.map(item => ({
        agent: {
          id: item.agent.id_agent,
          name: `${item.agent.name} ${item.agent.surname}`,
          email: item.agent.email,
          phone: item.agent.phone,
          entreprise: item.agent.entreprise,
          status: item.agent.availability?.status
        },
        score: item.score
      }))
    });
    
  } catch (error) {
    console.error('❌ [API] Erreur getAvailableAgents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/intelligent-assignment/reevaluate-priority
 * Réévalue la priorité d'une mission
 */
exports.reevaluatePriority = async (req, res) => {
  try {
    const { prise_en_charge_id } = req.body;
    
    if (!prise_en_charge_id) {
      return res.status(400).json({
        success: false,
        error: 'prise_en_charge_id est requis'
      });
    }
    
    console.log(`🔄 [API] Réévaluation priorité mission ${prise_en_charge_id}`);
    
    const result = await dynamicPriorityService.reevaluateMissionPriority(prise_en_charge_id);
    
    res.json({
      success: true,
      reevaluation: result
    });
    
  } catch (error) {
    console.error('❌ [API] Erreur reevaluatePriority:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/intelligent-assignment/monitor
 * Lance la surveillance de toutes les missions actives
 */
exports.monitorMissions = async (req, res) => {
  try {
    console.log('🔍 [API] Lancement surveillance missions actives');
    
    const result = await dynamicPriorityService.monitorActiveMissions();
    
    res.json({
      success: true,
      monitoring: result
    });
    
  } catch (error) {
    console.error('❌ [API] Erreur monitorMissions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/intelligent-assignment/reassign
 * Réassigne un agent à une mission
 */
exports.reassignAgent = async (req, res) => {
  try {
    const { prise_en_charge_id, reason } = req.body;
    
    if (!prise_en_charge_id) {
      return res.status(400).json({
        success: false,
        error: 'prise_en_charge_id est requis'
      });
    }
    
    console.log(`🔄 [API] Réassignation mission ${prise_en_charge_id}`);
    
    const result = await dynamicPriorityService.reassignAgent(
      prise_en_charge_id,
      reason || dynamicPriorityService.REASSIGNMENT_REASONS.BETTER_AGENT
    );
    
    res.json({
      success: result.success,
      reassignment: result
    });
    
  } catch (error) {
    console.error('❌ [API] Erreur reassignAgent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/intelligent-assignment/agent-availability/:agent_id
 * Récupère la disponibilité d'un agent
 */
exports.getAgentAvailability = async (req, res) => {
  try {
    const { agent_id } = req.params;
    
    const availability = await AgentAvailability.findOne({
      where: { agent_id: parseInt(agent_id) },
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id_agent', 'name', 'surname', 'email', 'phone', 'entreprise']
        }
      ]
    });
    
    if (!availability) {
      return res.status(404).json({
        success: false,
        error: 'Disponibilité agent introuvable'
      });
    }
    
    res.json({
      success: true,
      availability: availability
    });
    
  } catch (error) {
    console.error('❌ [API] Erreur getAgentAvailability:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * PUT /api/intelligent-assignment/agent-availability/:agent_id
 * Met à jour la disponibilité d'un agent
 */
exports.updateAgentAvailability = async (req, res) => {
  try {
    const { agent_id } = req.params;
    const updateData = req.body;
    
    // Vérifier si l'agent existe
    const agent = await Agent.findByPk(agent_id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent introuvable'
      });
    }
    
    // Chercher ou créer la disponibilité
    let availability = await AgentAvailability.findOne({
      where: { agent_id: parseInt(agent_id) }
    });
    
    if (!availability) {
      // Créer une nouvelle entrée
      availability = await AgentAvailability.create({
        agent_id: parseInt(agent_id),
        ...updateData,
        last_updated: new Date()
      });
    } else {
      // Mettre à jour l'existante
      await availability.update({
        ...updateData,
        last_updated: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Disponibilité mise à jour',
      availability: availability
    });
    
  } catch (error) {
    console.error('❌ [API] Erreur updateAgentAvailability:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/intelligent-assignment/agent-skills/:agent_id
 * Récupère les compétences d'un agent
 */
exports.getAgentSkills = async (req, res) => {
  try {
    const { agent_id } = req.params;
    
    const skills = await AgentSkills.findOne({
      where: { agent_id: parseInt(agent_id) },
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id_agent', 'name', 'surname', 'email', 'phone', 'entreprise']
        }
      ]
    });
    
    if (!skills) {
      return res.status(404).json({
        success: false,
        error: 'Compétences agent introuvables'
      });
    }
    
    res.json({
      success: true,
      skills: skills
    });
    
  } catch (error) {
    console.error('❌ [API] Erreur getAgentSkills:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * PUT /api/intelligent-assignment/agent-skills/:agent_id
 * Met à jour les compétences d'un agent
 */
exports.updateAgentSkills = async (req, res) => {
  try {
    const { agent_id } = req.params;
    const updateData = req.body;
    
    // Vérifier si l'agent existe
    const agent = await Agent.findByPk(agent_id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent introuvable'
      });
    }
    
    // Chercher ou créer les compétences
    let skills = await AgentSkills.findOne({
      where: { agent_id: parseInt(agent_id) }
    });
    
    if (!skills) {
      // Créer une nouvelle entrée
      skills = await AgentSkills.create({
        agent_id: parseInt(agent_id),
        ...updateData
      });
    } else {
      // Mettre à jour l'existante
      await skills.update(updateData);
    }
    
    res.json({
      success: true,
      message: 'Compétences mises à jour',
      skills: skills
    });
    
  } catch (error) {
    console.error('❌ [API] Erreur updateAgentSkills:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/intelligent-assignment/statistics
 * Récupère les statistiques d'assignation
 */
exports.getStatistics = async (req, res) => {
  try {
    const { period } = req.query; // today, week, month
    
    let dateFilter = new Date();
    if (period === 'today') {
      dateFilter.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === 'month') {
      dateFilter.setDate(dateFilter.getDate() - 30);
    }
    
    // Statistiques globales
    const totalMissions = await PriseEnCharge.count({
      where: {
        createdAt: { [Op.gte]: dateFilter }
      }
    });
    
    const assignedMissions = await PriseEnCharge.count({
      where: {
        agent_id: { [Op.not]: null },
        createdAt: { [Op.gte]: dateFilter }
      }
    });
    
    const criticalMissions = await PriseEnCharge.count({
      where: {
        priority_level: { [Op.in]: ['urgent', 'critical'] },
        createdAt: { [Op.gte]: dateFilter }
      }
    });
    
    const reassignedMissions = await PriseEnCharge.count({
      where: {
        reassignment_count: { [Op.gt]: 0 },
        createdAt: { [Op.gte]: dateFilter }
      }
    });
    
    // Agents disponibles
    const availableAgents = await AgentAvailability.count({
      where: {
        status: 'available'
      }
    });
    
    const busyAgents = await AgentAvailability.count({
      where: {
        status: { [Op.in]: ['busy', 'on_mission'] }
      }
    });
    
    res.json({
      success: true,
      period: period || 'all',
      statistics: {
        missions: {
          total: totalMissions,
          assigned: assignedMissions,
          unassigned: totalMissions - assignedMissions,
          critical: criticalMissions,
          reassigned: reassignedMissions,
          assignment_rate: totalMissions > 0 ? ((assignedMissions / totalMissions) * 100).toFixed(2) : 0
        },
        agents: {
          available: availableAgents,
          busy: busyAgents,
          total: availableAgents + busyAgents
        }
      }
    });
    
  } catch (error) {
    console.error('❌ [API] Erreur getStatistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
