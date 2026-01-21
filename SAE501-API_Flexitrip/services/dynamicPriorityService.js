/**
 * Service de Priorisation Dynamique et Réassignation
 * 
 * ==========================================
 * FONCTIONNALITÉS :
 * ==========================================
 * 
 * 1. RÉÉVALUATION EN TEMPS RÉEL
 *    - Surveillance continue des missions en cours
 *    - Détection des incidents et retards
 *    - Ajustement automatique des priorités
 * 
 * 2. DÉTECTION DES SITUATIONS CRITIQUES
 *    - Correspondances en danger
 *    - Retards importants
 *    - Incidents bloquants
 * 
 * 3. RÉASSIGNATION AUTOMATIQUE
 *    - Changement d'agent en cas de nécessité
 *    - Escalade vers agents plus qualifiés
 *    - Notifications aux opérateurs
 * 
 * 4. GESTION DES ALERTES
 *    - Alertes temps réel pour situations critiques
 *    - Notifications aux équipes opérationnelles
 *    - Historique des décisions
 */

const { PriseEnCharge, Agent, AgentAvailability, User } = require('../models');
const Voyage = require('../models/Voyage');
const Incident = require('../models/Incident');
const intelligentAssignmentService = require('./intelligentAssignmentService');
const notificationService = require('./notificationService');
const { Op } = require('sequelize');

/**
 * CONFIGURATION
 */
const CRITICAL_TIME_THRESHOLD = 30; // minutes avant correspondance critique
const DELAY_THRESHOLD_MINOR = 15; // minutes - retard mineur
const DELAY_THRESHOLD_MAJOR = 30; // minutes - retard majeur
const DELAY_THRESHOLD_CRITICAL = 60; // minutes - retard critique

const REASSIGNMENT_REASONS = {
  AGENT_UNAVAILABLE: 'agent_unavailable',
  CRITICAL_DELAY: 'critical_delay',
  INCIDENT: 'incident',
  CONNECTION_RISK: 'connection_risk',
  BETTER_AGENT: 'better_agent_available',
  ESCALATION: 'escalation_required'
};

/**
 * Réévalue la priorité d'une mission en fonction du contexte actuel
 * @param {Number} prise_en_charge_id - ID de la prise en charge
 * @returns {Promise<Object>} Nouvelle priorité et raisons
 */
async function reevaluateMissionPriority(prise_en_charge_id) {
  try {
    const priseEnCharge = await PriseEnCharge.findByPk(prise_en_charge_id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'surname', 'type_handicap', 'pmr_profile']
        }
      ]
    });
    
    if (!priseEnCharge) {
      throw new Error('Prise en charge introuvable');
    }
    
    console.log(`🔄 [PRIORITÉ] Réévaluation mission ${prise_en_charge_id}...`);
    
    let newPriority = priseEnCharge.priority_level;
    let priorityReasons = [];
    let requiresAction = false;
    
    // 1. Vérifier les incidents actifs affectant cette mission
    const activeIncidents = await checkActiveIncidents(priseEnCharge);
    if (activeIncidents.length > 0) {
      priorityReasons.push({
        type: 'incident',
        severity: activeIncidents[0].severity,
        description: `Incident actif: ${activeIncidents[0].title}`
      });
      
      if (activeIncidents[0].severity === 'critique' || activeIncidents[0].severity === 'eleve') {
        newPriority = escalatePriority(newPriority, 2); // Escalade de 2 niveaux
        requiresAction = true;
      }
    }
    
    // 2. Vérifier les correspondances critiques
    const connectionStatus = await checkCriticalConnection(priseEnCharge);
    if (connectionStatus.isCritical) {
      priorityReasons.push({
        type: 'critical_connection',
        timeRemaining: connectionStatus.timeRemaining,
        description: `Correspondance critique dans ${connectionStatus.timeRemaining} minutes`
      });
      
      if (connectionStatus.timeRemaining < CRITICAL_TIME_THRESHOLD) {
        newPriority = escalatePriority(newPriority, 1);
        requiresAction = true;
      }
    }
    
    // 3. Vérifier le niveau de dépendance PMR
    const dependencyLevel = priseEnCharge.user?.pmr_profile?.assistance_level;
    if (dependencyLevel === 'complete' || dependencyLevel === 'full') {
      priorityReasons.push({
        type: 'high_dependency',
        level: dependencyLevel,
        description: 'PMR avec niveau de dépendance élevé'
      });
      
      if (newPriority === 'normal' || newPriority === 'low') {
        newPriority = 'high';
      }
    }
    
    // 4. Vérifier les retards détectés
    const delayStatus = await checkDelays(priseEnCharge);
    if (delayStatus.hasDelay) {
      priorityReasons.push({
        type: 'delay',
        delayMinutes: delayStatus.delayMinutes,
        description: `Retard de ${delayStatus.delayMinutes} minutes`
      });
      
      if (delayStatus.delayMinutes > DELAY_THRESHOLD_CRITICAL) {
        newPriority = 'critical';
        requiresAction = true;
      } else if (delayStatus.delayMinutes > DELAY_THRESHOLD_MAJOR) {
        newPriority = escalatePriority(newPriority, 1);
        requiresAction = true;
      }
    }
    
    // Mettre à jour la priorité si changée
    if (newPriority !== priseEnCharge.priority_level) {
      await PriseEnCharge.update(
        { priority_level: newPriority },
        { where: { id: prise_en_charge_id } }
      );
      
      console.log(`⬆️ [PRIORITÉ] Mission ${prise_en_charge_id}: ${priseEnCharge.priority_level} → ${newPriority}`);
      
      // Envoyer notification si action requise
      if (requiresAction) {
        await notifyPriorityChange(priseEnCharge, newPriority, priorityReasons);
      }
    }
    
    return {
      prise_en_charge_id,
      old_priority: priseEnCharge.priority_level,
      new_priority: newPriority,
      changed: newPriority !== priseEnCharge.priority_level,
      requires_action: requiresAction,
      reasons: priorityReasons
    };
    
  } catch (error) {
    console.error('❌ [PRIORITÉ] Erreur reevaluateMissionPriority:', error);
    throw error;
  }
}

/**
 * Surveille toutes les missions actives et ajuste les priorités
 * @returns {Promise<Object>} Résumé des réévaluations
 */
async function monitorActiveMissions() {
  try {
    console.log('🔍 [MONITOR] Surveillance des missions actives...');
    
    // Récupérer toutes les missions pending ou en cours
    const activeMissions = await PriseEnCharge.findAll({
      where: {
        status: {
          [Op.in]: ['pending', 'validated']
        }
      }
    });
    
    console.log(`📋 [MONITOR] ${activeMissions.length} missions actives à surveiller`);
    
    const results = {
      total: activeMissions.length,
      reevaluated: 0,
      priority_changed: 0,
      actions_required: 0,
      reassignments: 0,
      details: []
    };
    
    for (const mission of activeMissions) {
      try {
        // Réévaluer la priorité
        const reevaluation = await reevaluateMissionPriority(mission.id);
        results.reevaluated++;
        
        if (reevaluation.changed) {
          results.priority_changed++;
        }
        
        if (reevaluation.requires_action) {
          results.actions_required++;
          
          // Vérifier si réassignation nécessaire
          const reassignmentCheck = await checkReassignmentNeed(mission, reevaluation);
          if (reassignmentCheck.shouldReassign) {
            const reassignment = await reassignAgent(mission.id, reassignmentCheck.reason);
            if (reassignment.success) {
              results.reassignments++;
            }
          }
        }
        
        results.details.push(reevaluation);
        
      } catch (error) {
        console.error(`❌ [MONITOR] Erreur mission ${mission.id}:`, error.message);
        results.details.push({
          prise_en_charge_id: mission.id,
          error: error.message
        });
      }
    }
    
    console.log(`✅ [MONITOR] Surveillance terminée: ${results.priority_changed} priorités changées, ${results.reassignments} réassignations`);
    
    return results;
    
  } catch (error) {
    console.error('❌ [MONITOR] Erreur monitorActiveMissions:', error);
    throw error;
  }
}

/**
 * Vérifie si une réassignation est nécessaire
 * @param {Object} mission - Prise en charge
 * @param {Object} reevaluation - Résultat de la réévaluation
 * @returns {Promise<Object>} Besoin de réassignation et raison
 */
async function checkReassignmentNeed(mission, reevaluation) {
  try {
    let shouldReassign = false;
    let reason = null;
    
    // 1. Vérifier si l'agent actuel est toujours disponible
    if (mission.agent_id) {
      const agentAvailability = await AgentAvailability.findOne({
        where: { agent_id: mission.agent_id }
      });
      
      if (!agentAvailability || agentAvailability.status === 'off_duty') {
        shouldReassign = true;
        reason = REASSIGNMENT_REASONS.AGENT_UNAVAILABLE;
      }
    }
    
    // 2. Vérifier si la priorité est critique et nécessite un agent plus qualifié
    if (reevaluation.new_priority === 'critical' && !shouldReassign) {
      // Vérifier s'il existe un agent mieux qualifié
      const betterAgentExists = await checkForBetterAgent(mission);
      if (betterAgentExists) {
        shouldReassign = true;
        reason = REASSIGNMENT_REASONS.ESCALATION;
      }
    }
    
    // 3. Vérifier les raisons de réévaluation
    for (const reasonItem of reevaluation.reasons) {
      if (reasonItem.type === 'critical_connection' && reasonItem.timeRemaining < 15) {
        shouldReassign = true;
        reason = REASSIGNMENT_REASONS.CONNECTION_RISK;
        break;
      }
      
      if (reasonItem.type === 'delay' && reasonItem.delayMinutes > DELAY_THRESHOLD_CRITICAL) {
        shouldReassign = true;
        reason = REASSIGNMENT_REASONS.CRITICAL_DELAY;
        break;
      }
      
      if (reasonItem.type === 'incident' && reasonItem.severity === 'critique') {
        shouldReassign = true;
        reason = REASSIGNMENT_REASONS.INCIDENT;
        break;
      }
    }
    
    return {
      shouldReassign,
      reason,
      current_agent_id: mission.agent_id,
      priority: reevaluation.new_priority
    };
    
  } catch (error) {
    console.error('❌ [REASSIGN] Erreur checkReassignmentNeed:', error);
    return { shouldReassign: false, reason: null };
  }
}

/**
 * Réassigne un agent à une mission
 * @param {Number} prise_en_charge_id - ID de la prise en charge
 * @param {String} reason - Raison de la réassignation
 * @returns {Promise<Object>} Résultat de la réassignation
 */
async function reassignAgent(prise_en_charge_id, reason) {
  try {
    console.log(`🔄 [REASSIGN] Réassignation mission ${prise_en_charge_id} - Raison: ${reason}`);
    
    const priseEnCharge = await PriseEnCharge.findByPk(prise_en_charge_id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'surname', 'type_handicap', 'pmr_profile']
        }
      ]
    });
    
    if (!priseEnCharge) {
      throw new Error('Prise en charge introuvable');
    }
    
    const oldAgentId = priseEnCharge.agent_id;
    
    // Libérer l'ancien agent si assigné
    if (oldAgentId) {
      // Récupérer l'agent actuel pour décrémenter correctement
      const oldAgentAvailability = await AgentAvailability.findOne({
        where: { agent_id: oldAgentId }
      });
      
      if (oldAgentAvailability && oldAgentAvailability.assigned_missions > 0) {
        await AgentAvailability.update(
          {
            status: 'available',
            assigned_missions: oldAgentAvailability.assigned_missions - 1,
            last_updated: new Date()
          },
          {
            where: { agent_id: oldAgentId }
          }
        );
      }
    }
    
    // Récupérer le voyage et la réservation pour avoir les détails
    const voyage = priseEnCharge.voyage_id_mongo 
      ? await Voyage.findById(priseEnCharge.voyage_id_mongo)
      : null;
    
    const { Reservations } = require('../models');
    const reservation = await Reservations.findByPk(priseEnCharge.reservation_id);
    
    // Extraire la localisation et le type de transport
    let location = { lat: 48.8566, lng: 2.3522 }; // Paris par défaut
    let transportType = 'train'; // Type par défaut
    
    if (voyage && voyage.etapes && voyage.etapes.length > 0) {
      const etapeIndex = priseEnCharge.etape_numero - 1;
      if (etapeIndex >= 0 && etapeIndex < voyage.etapes.length) {
        const etape = voyage.etapes[etapeIndex];
        transportType = etape.type || 'train';
        // TODO: Extraire lat/lng depuis les gares/aéroports si disponibles
      }
    } else if (reservation) {
      transportType = reservation.Type_Transport || 'train';
    }
    
    // Trouver un nouvel agent via le service intelligent
    const assignment = await intelligentAssignmentService.assignBestAgent({
      prise_en_charge_id: priseEnCharge.id,
      reservation_id: priseEnCharge.reservation_id,
      user_id: priseEnCharge.user_id,
      voyage_id: priseEnCharge.voyage_id_mongo,
      pmrNeeds: priseEnCharge.user,
      location: location,
      transportType: transportType,
      isCriticalConnection: priseEnCharge.is_critical_connection,
      priorityLevel: priseEnCharge.priority_level
    });
    
    if (!assignment.success) {
      console.log('⚠️ [REASSIGN] Échec de réassignation: Aucun agent disponible');
      
      // Alerter les opérateurs
      await sendOperatorAlert(priseEnCharge, reason, 'no_agent_available');
      
      return {
        success: false,
        reason: 'no_agent_available',
        message: 'Aucun agent disponible pour la réassignation'
      };
    }
    
    // Mettre à jour le compteur de réassignation et la raison
    await PriseEnCharge.update(
      {
        reassignment_count: priseEnCharge.reassignment_count + 1,
        reassignment_reason: reason
      },
      {
        where: { id: prise_en_charge_id }
      }
    );
    
    console.log(`✅ [REASSIGN] Mission ${prise_en_charge_id} réassignée: Agent ${oldAgentId} → Agent ${assignment.agent.id}`);
    
    // Notifications de réassignation
    await sendReassignmentNotifications(
      priseEnCharge,
      oldAgentId,
      assignment.agent,
      reason
    );
    
    return {
      success: true,
      old_agent_id: oldAgentId,
      new_agent: assignment.agent,
      reason: reason,
      score: assignment.score,
      message: `Agent réassigné avec succès`
    };
    
  } catch (error) {
    console.error('❌ [REASSIGN] Erreur reassignAgent:', error);
    throw error;
  }
}

/**
 * Helpers
 */

async function checkActiveIncidents(priseEnCharge) {
  try {
    // Chercher les incidents actifs qui affectent cette réservation
    const incidents = await Incident.find({
      status: { $in: ['actif', 'en_cours'] },
      affectedUsers: priseEnCharge.user_id
    }).sort({ severity: -1 });
    
    return incidents;
  } catch (error) {
    console.error('❌ Erreur checkActiveIncidents:', error);
    return [];
  }
}

async function checkCriticalConnection(priseEnCharge) {
  try {
    if (!priseEnCharge.is_critical_connection) {
      return { isCritical: false };
    }
    
    // Calculer le temps restant jusqu'à la correspondance
    let timeRemaining = 45; // Valeur par défaut en minutes
    
    // Tenter de récupérer le voyage pour calculer le temps réel
    if (priseEnCharge.voyage_id_mongo) {
      const voyage = await Voyage.findById(priseEnCharge.voyage_id_mongo);
      
      if (voyage && voyage.etapes && voyage.etapes.length > 0) {
        const etapeIndex = priseEnCharge.etape_numero - 1;
        
        // Vérifier s'il y a une étape suivante (correspondance)
        if (etapeIndex >= 0 && etapeIndex < voyage.etapes.length - 1) {
          const etapeActuelle = voyage.etapes[etapeIndex];
          const etapeSuivante = voyage.etapes[etapeIndex + 1];
          
          // Calculer le temps entre l'arrivée de l'étape actuelle et le départ de la suivante
          if (etapeActuelle.arrival_time && etapeSuivante.departure_time) {
            const now = new Date();
            const nextDeparture = new Date(etapeSuivante.departure_time);
            timeRemaining = Math.max(0, Math.floor((nextDeparture - now) / 60000)); // en minutes
          }
        }
      }
    }
    
    return {
      isCritical: true,
      timeRemaining: timeRemaining
    };
  } catch (error) {
    console.error('❌ Erreur checkCriticalConnection:', error);
    return { isCritical: false };
  }
}

async function checkDelays(priseEnCharge) {
  try {
    // TODO: Intégrer avec les systèmes de transport pour détecter les retards
    // Pour l'instant, retourne pas de retard
    return {
      hasDelay: false,
      delayMinutes: 0
    };
  } catch (error) {
    console.error('❌ Erreur checkDelays:', error);
    return { hasDelay: false, delayMinutes: 0 };
  }
}

async function checkForBetterAgent(mission) {
  // TODO: Implémenter la logique de vérification d'agent mieux qualifié
  return false;
}

function escalatePriority(currentPriority, levels = 1) {
  const priorities = ['low', 'normal', 'high', 'urgent', 'critical'];
  const currentIndex = priorities.indexOf(currentPriority);
  const newIndex = Math.min(currentIndex + levels, priorities.length - 1);
  return priorities[newIndex];
}

async function notifyPriorityChange(priseEnCharge, newPriority, reasons) {
  try {
    await notificationService.createNotification({
      user_id: priseEnCharge.user_id,
      type: 'PRIORITY_CHANGED',
      title: '⚠️ Priorité de mission mise à jour',
      message: `Votre prise en charge est maintenant prioritaire (${newPriority})`,
      data: {
        prise_en_charge_id: priseEnCharge.id,
        old_priority: priseEnCharge.priority_level,
        new_priority: newPriority,
        reasons: reasons
      },
      priority: 'high',
      icon: '⚠️'
    });
  } catch (error) {
    console.error('❌ Erreur notifyPriorityChange:', error);
  }
}

async function sendReassignmentNotifications(priseEnCharge, oldAgentId, newAgent, reason) {
  try {
    // Notification à l'utilisateur
    await notificationService.createNotification({
      user_id: priseEnCharge.user_id,
      type: 'AGENT_REASSIGNED',
      title: '🔄 Changement d\'agent',
      message: `Votre agent a été changé. ${newAgent.name} vous accompagnera maintenant.`,
      data: {
        prise_en_charge_id: priseEnCharge.id,
        old_agent_id: oldAgentId,
        new_agent_id: newAgent.id,
        reason: reason
      },
      agent_info: {
        name: newAgent.name,
        phone: newAgent.phone,
        email: newAgent.email
      },
      priority: 'high',
      icon: '🔄'
    });
    
    console.log(`📧 [REASSIGN] Notifications envoyées`);
  } catch (error) {
    console.error('❌ Erreur sendReassignmentNotifications:', error);
  }
}

async function sendOperatorAlert(priseEnCharge, reason, alertType) {
  console.log(`🚨 [ALERT] Alerte opérateur: Mission ${priseEnCharge.id} - ${alertType} - ${reason}`);
  // TODO: Implémenter l'envoi d'alertes aux opérateurs
}

module.exports = {
  reevaluateMissionPriority,
  monitorActiveMissions,
  reassignAgent,
  checkReassignmentNeed,
  REASSIGNMENT_REASONS,
  CRITICAL_TIME_THRESHOLD,
  DELAY_THRESHOLD_CRITICAL
};
