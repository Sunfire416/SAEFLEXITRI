/**
 * Service d'Assignation Intelligente IA - PMR Agent Assignment
 * 
 * ==========================================
 * FONCTIONNALITÉS PRINCIPALES :
 * ==========================================
 * 
 * 1. ASSIGNATION AUTOMATIQUE BASÉE SUR SCORING MULTI-CRITÈRES
 *    - Disponibilité des agents (horaires, statut, charge de travail)
 *    - Compétences et certifications (types de handicaps, expérience)
 *    - Proximité géographique (distance, temps estimé)
 *    - Charge de travail actuelle et historique
 *    - Priorité PMR (niveau de dépendance, urgence, correspondances critiques)
 * 
 * 2. PRIORISATION DYNAMIQUE
 *    - Réévaluation en temps réel des priorités
 *    - Prise en compte des retards, incidents et correspondances critiques
 *    - Ajustement automatique des priorités selon le contexte
 * 
 * 3. RÉASSIGNATION INTELLIGENTE
 *    - Détection des situations critiques nécessitant réassignation
 *    - Escalade vers agents plus compétents ou plus proches
 *    - Notifications automatiques aux opérateurs
 * 
 * ==========================================
 * ALGORITHME DE SCORING :
 * ==========================================
 * 
 * Score total = (Disponibilité × 0.30) + (Compétences × 0.25) + 
 *               (Proximité × 0.25) + (Charge × 0.15) + (Priorité PMR × 0.05)
 * 
 * Chaque critère est évalué sur 100 points, puis pondéré selon son importance.
 */

const { Agent, AgentAvailability, AgentSkills, PriseEnCharge, User } = require('../models');
const Voyage = require('../models/Voyage');
const notificationService = require('./notificationService');
const { Op } = require('sequelize');

/**
 * CONFIGURATION DE L'ALGORITHME
 */
const SCORING_WEIGHTS = {
  availability: 0.30,    // Disponibilité (30%)
  skills: 0.25,          // Compétences (25%)
  proximity: 0.25,       // Proximité géographique (25%)
  workload: 0.15,        // Charge de travail (15%)
  pmr_priority: 0.05     // Priorité PMR (5%)
};

const DISTANCE_THRESHOLDS = {
  very_close: 2,    // < 2 km
  close: 5,         // < 5 km
  medium: 10,       // < 10 km
  far: 20,          // < 20 km
  very_far: 50      // < 50 km
};

const PRIORITY_LEVELS = {
  low: 1,
  normal: 2,
  high: 3,
  urgent: 4,
  critical: 5
};

/**
 * Calcule le score de disponibilité d'un agent
 * @param {Object} availability - Données de disponibilité de l'agent
 * @returns {Number} Score de 0 à 100
 */
function calculateAvailabilityScore(availability) {
  if (!availability) return 0;
  
  let score = 0;
  
  // Statut de l'agent (40 points)
  switch (availability.status) {
    case 'available':
      score += 40;
      break;
    case 'break':
      score += 25;
      break;
    case 'busy':
      score += 10;
      break;
    case 'on_mission':
      score += 5;
      break;
    case 'off_duty':
      score += 0;
      break;
  }
  
  // Charge de travail (30 points) - inversement proportionnel
  const workloadScore = Math.max(0, 30 - (availability.workload_score * 0.3));
  score += workloadScore;
  
  // Missions en cours (15 points)
  if (availability.assigned_missions === 0) {
    score += 15;
  } else if (availability.assigned_missions === 1) {
    score += 10;
  } else if (availability.assigned_missions === 2) {
    score += 5;
  }
  
  // Capacité restante (15 points)
  const remainingCapacity = availability.max_missions_per_day - availability.total_missions_today;
  if (remainingCapacity >= 5) {
    score += 15;
  } else if (remainingCapacity >= 3) {
    score += 10;
  } else if (remainingCapacity >= 1) {
    score += 5;
  }
  
  return Math.min(100, score);
}

/**
 * Calcule le score de compétences d'un agent pour un besoin PMR spécifique
 * @param {Object} skills - Compétences de l'agent
 * @param {Object} pmrNeeds - Besoins PMR
 * @param {String} transportType - Type de transport
 * @returns {Number} Score de 0 à 100
 */
function calculateSkillsScore(skills, pmrNeeds, transportType) {
  if (!skills) return 0;
  
  let score = 0;
  
  // Correspondance du type de handicap (35 points)
  const disabilityType = mapPmrTypeToDisabilityCategory(pmrNeeds.type_handicap);
  if (skills.disability_types && skills.disability_types.includes(disabilityType)) {
    score += 35;
  } else {
    score += 10; // Score partiel si pas de correspondance exacte
  }
  
  // Niveau d'assistance requis vs capacité (25 points)
  const assistanceMatch = checkAssistanceLevelMatch(
    pmrNeeds.pmr_profile?.assistance_level || 'partial',
    skills.max_assistance_level
  );
  score += assistanceMatch * 25;
  
  // Mode de transport (20 points)
  if (skills.transport_modes && skills.transport_modes.includes(transportType)) {
    score += 20;
  } else {
    score += 5; // Score partiel si pas de spécialisation
  }
  
  // Expérience (15 points)
  switch (skills.experience_level) {
    case 'expert':
      score += 15;
      break;
    case 'senior':
      score += 12;
      break;
    case 'intermediate':
      score += 8;
      break;
    case 'junior':
      score += 5;
      break;
  }
  
  // Note moyenne (5 points)
  if (skills.average_rating >= 4.5) {
    score += 5;
  } else if (skills.average_rating >= 4.0) {
    score += 4;
  } else if (skills.average_rating >= 3.5) {
    score += 3;
  }
  
  return Math.min(100, score);
}

/**
 * Calcule le score de proximité géographique
 * @param {Object} agentLocation - Localisation de l'agent {lat, lng}
 * @param {Object} missionLocation - Localisation de la mission {lat, lng}
 * @returns {Number} Score de 0 à 100
 */
function calculateProximityScore(agentLocation, missionLocation) {
  if (!agentLocation || !missionLocation) return 50; // Score neutre si pas de données
  
  const distance = calculateDistance(
    agentLocation.lat,
    agentLocation.lng,
    missionLocation.lat,
    missionLocation.lng
  );
  
  // Score basé sur la distance
  if (distance < DISTANCE_THRESHOLDS.very_close) {
    return 100;
  } else if (distance < DISTANCE_THRESHOLDS.close) {
    return 85;
  } else if (distance < DISTANCE_THRESHOLDS.medium) {
    return 70;
  } else if (distance < DISTANCE_THRESHOLDS.far) {
    return 50;
  } else if (distance < DISTANCE_THRESHOLDS.very_far) {
    return 30;
  } else {
    return 10;
  }
}

/**
 * Calcule le score de charge de travail (inversement proportionnel)
 * @param {Object} availability - Données de disponibilité
 * @returns {Number} Score de 0 à 100
 */
function calculateWorkloadScore(availability) {
  if (!availability) return 50;
  
  let score = 0;
  
  // Missions en cours (50 points)
  const missionScore = Math.max(0, 50 - (availability.assigned_missions * 15));
  score += missionScore;
  
  // Total missions aujourd'hui (30 points)
  const dailyScore = Math.max(0, 30 - (availability.total_missions_today * 4));
  score += dailyScore;
  
  // Temps depuis dernière mission (20 points) - repos = meilleur score
  if (availability.last_mission_end) {
    const minutesSinceLastMission = (Date.now() - new Date(availability.last_mission_end).getTime()) / 60000;
    if (minutesSinceLastMission > 120) { // Plus de 2h
      score += 20;
    } else if (minutesSinceLastMission > 60) { // Plus de 1h
      score += 15;
    } else if (minutesSinceLastMission > 30) { // Plus de 30min
      score += 10;
    } else {
      score += 5;
    }
  } else {
    score += 20; // Pas de mission récente
  }
  
  return Math.min(100, score);
}

/**
 * Calcule le score de priorité PMR
 * @param {Object} pmrNeeds - Besoins PMR
 * @param {Boolean} isCriticalConnection - Correspondance critique
 * @returns {Number} Score de 0 à 100
 */
function calculatePmrPriorityScore(pmrNeeds, isCriticalConnection) {
  let score = 50; // Score de base
  
  // Niveau de dépendance
  const dependencyLevel = pmrNeeds.pmr_profile?.assistance_level || 'partial';
  switch (dependencyLevel) {
    case 'full':
    case 'complete':
      score += 30;
      break;
    case 'significant':
      score += 20;
      break;
    case 'partial':
    case 'moderate':
      score += 10;
      break;
    case 'minimal':
      score += 5;
      break;
  }
  
  // Correspondance critique
  if (isCriticalConnection) {
    score += 20;
  }
  
  return Math.min(100, score);
}

/**
 * Calcule le score total d'un agent pour une mission
 * @param {Object} agent - Agent avec availability et skills
 * @param {Object} missionParams - Paramètres de la mission
 * @returns {Object} Score détaillé et total
 */
function calculateAgentScore(agent, missionParams) {
  const { pmrNeeds, location, transportType, isCriticalConnection } = missionParams;
  
  const availabilityScore = calculateAvailabilityScore(agent.availability);
  const skillsScore = calculateSkillsScore(agent.skills, pmrNeeds, transportType);
  const proximityScore = calculateProximityScore(
    agent.availability?.current_location,
    location
  );
  const workloadScore = calculateWorkloadScore(agent.availability);
  const priorityScore = calculatePmrPriorityScore(pmrNeeds, isCriticalConnection);
  
  // Calcul du score total pondéré
  const totalScore = 
    (availabilityScore * SCORING_WEIGHTS.availability) +
    (skillsScore * SCORING_WEIGHTS.skills) +
    (proximityScore * SCORING_WEIGHTS.proximity) +
    (workloadScore * SCORING_WEIGHTS.workload) +
    (priorityScore * SCORING_WEIGHTS.pmr_priority);
  
  return {
    totalScore: Math.round(totalScore * 10) / 10,
    breakdown: {
      availability: Math.round(availabilityScore * 10) / 10,
      skills: Math.round(skillsScore * 10) / 10,
      proximity: Math.round(proximityScore * 10) / 10,
      workload: Math.round(workloadScore * 10) / 10,
      priority: Math.round(priorityScore * 10) / 10
    },
    agent_id: agent.id_agent,
    agent_name: `${agent.name} ${agent.surname}`
  };
}

/**
 * Trouve les agents disponibles avec leurs scores pour une mission
 * @param {Object} missionParams - Paramètres de la mission
 * @returns {Promise<Array>} Liste d'agents avec leurs scores, triés par score décroissant
 */
async function findAvailableAgentsWithScores(missionParams) {
  try {
    // Récupérer tous les agents avec leurs disponibilités et compétences
    const agents = await Agent.findAll({
      include: [
        {
          model: AgentAvailability,
          as: 'availability',
          required: false
        },
        {
          model: AgentSkills,
          as: 'skills',
          required: false
        }
      ]
    });
    
    // Calculer le score pour chaque agent
    const agentsWithScores = agents
      .map(agent => {
        const score = calculateAgentScore(agent, missionParams);
        return {
          agent: agent,
          score: score
        };
      })
      .filter(item => {
        // Filtrer les agents non disponibles (off_duty ou score trop faible)
        if (!item.agent.availability) return false;
        if (item.agent.availability.status === 'off_duty') return false;
        if (item.score.totalScore < 20) return false; // Seuil minimum
        return true;
      })
      .sort((a, b) => b.score.totalScore - a.score.totalScore); // Trier par score décroissant
    
    return agentsWithScores;
    
  } catch (error) {
    console.error('❌ Erreur findAvailableAgentsWithScores:', error);
    throw error;
  }
}

/**
 * Assigne automatiquement l'agent le plus approprié à une mission
 * @param {Object} missionParams - Paramètres de la mission
 * @returns {Promise<Object>} Résultat de l'assignation avec agent et scores
 */
async function assignBestAgent(missionParams) {
  try {
    const {
      prise_en_charge_id,
      reservation_id,
      user_id,
      voyage_id,
      pmrNeeds,
      location,
      transportType,
      isCriticalConnection,
      priorityLevel
    } = missionParams;
    
    console.log(`🤖 [IA] Recherche du meilleur agent pour mission ${prise_en_charge_id}...`);
    
    // Trouver les agents disponibles avec leurs scores
    const agentsWithScores = await findAvailableAgentsWithScores({
      pmrNeeds,
      location,
      transportType,
      isCriticalConnection
    });
    
    if (agentsWithScores.length === 0) {
      console.log('⚠️ [IA] Aucun agent disponible pour cette mission');
      return {
        success: false,
        reason: 'no_available_agents',
        message: 'Aucun agent disponible correspondant aux critères',
        alternatives: []
      };
    }
    
    // Sélectionner le meilleur agent (premier de la liste triée)
    const bestMatch = agentsWithScores[0];
    const selectedAgent = bestMatch.agent;
    
    console.log(`✅ [IA] Agent sélectionné: ${selectedAgent.name} ${selectedAgent.surname} (Score: ${bestMatch.score.totalScore})`);
    console.log(`📊 [IA] Détail des scores:`, bestMatch.score.breakdown);
    
    // Mettre à jour la prise en charge avec l'agent assigné
    await PriseEnCharge.update(
      {
        agent_id: selectedAgent.id_agent,
        priority_level: priorityLevel || 'normal',
        is_critical_connection: isCriticalConnection || false
      },
      {
        where: { id: prise_en_charge_id }
      }
    );
    
    // Mettre à jour la disponibilité de l'agent
    if (selectedAgent.availability) {
      await AgentAvailability.update(
        {
          status: 'on_mission',
          assigned_missions: selectedAgent.availability.assigned_missions + 1,
          total_missions_today: selectedAgent.availability.total_missions_today + 1,
          last_updated: new Date()
        },
        {
          where: { agent_id: selectedAgent.id_agent }
        }
      );
    }
    
    // Envoyer notifications
    await sendAssignmentNotifications(
      selectedAgent,
      user_id,
      prise_en_charge_id,
      voyage_id,
      bestMatch.score
    );
    
    return {
      success: true,
      agent: {
        id: selectedAgent.id_agent,
        name: `${selectedAgent.name} ${selectedAgent.surname}`,
        email: selectedAgent.email,
        phone: selectedAgent.phone,
        entreprise: selectedAgent.entreprise
      },
      score: bestMatch.score,
      alternatives: agentsWithScores.slice(1, 4).map(item => ({
        agent: {
          id: item.agent.id_agent,
          name: `${item.agent.name} ${item.agent.surname}`
        },
        score: item.score.totalScore
      })),
      message: `Agent ${selectedAgent.name} ${selectedAgent.surname} assigné avec succès`
    };
    
  } catch (error) {
    console.error('❌ [IA] Erreur assignBestAgent:', error);
    throw error;
  }
}

/**
 * Envoie les notifications d'assignation à l'agent et à l'utilisateur
 */
async function sendAssignmentNotifications(agent, user_id, prise_en_charge_id, voyage_id, score) {
  try {
    // Notification à l'utilisateur PMR
    await notificationService.createNotification({
      user_id: user_id,
      type: 'AGENT_ASSIGNED',
      title: '👤 Agent PMR assigné',
      message: `${agent.name} ${agent.surname} vous accompagnera pour votre voyage. Vous serez contacté(e) prochainement.`,
      data: {
        source: 'intelligent_assignment_service',
        prise_en_charge_id: prise_en_charge_id,
        voyage_id: voyage_id,
        agent_id: agent.id_agent,
        agent_name: `${agent.name} ${agent.surname}`,
        agent_phone: agent.phone,
        score: score.totalScore
      },
      agent_info: {
        name: `${agent.name} ${agent.surname}`,
        phone: agent.phone,
        email: agent.email,
        company: agent.entreprise || 'FlexiTrip'
      },
      priority: 'high',
      icon: '👤'
    });
    
    // TODO: Notification à l'agent (système agent à implémenter)
    console.log(`📧 [IA] Notification agent ${agent.name} à implémenter`);
    
  } catch (error) {
    console.error('❌ [IA] Erreur envoi notifications:', error);
  }
}

/**
 * Helpers
 */

function mapPmrTypeToDisabilityCategory(type_handicap) {
  const mapping = {
    'Fauteuil roulant manuel': 'wheelchair',
    'Fauteuil roulant électrique': 'wheelchair',
    'Déficience visuelle': 'visual',
    'Déficience auditive': 'hearing',
    'Mobilité réduite': 'mobility',
    'Déficience cognitive': 'cognitive',
    'Autre': 'other',
    'Aucun': 'none'
  };
  return mapping[type_handicap] || 'other';
}

function checkAssistanceLevelMatch(required, provided) {
  const levels = ['minimal', 'partial', 'significant', 'full', 'complete', 'medical'];
  const requiredIndex = levels.indexOf(required);
  const providedIndex = levels.indexOf(provided);
  
  if (providedIndex >= requiredIndex) {
    return 1.0; // Parfait
  } else if (providedIndex === requiredIndex - 1) {
    return 0.7; // Acceptable
  } else {
    return 0.3; // Insuffisant mais possible
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  // Formule de Haversine pour calculer la distance entre deux points GPS
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

module.exports = {
  assignBestAgent,
  findAvailableAgentsWithScores,
  calculateAgentScore,
  SCORING_WEIGHTS,
  DISTANCE_THRESHOLDS,
  PRIORITY_LEVELS
};
