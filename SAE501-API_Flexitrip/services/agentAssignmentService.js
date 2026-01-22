/**
 * Service Agent Assignment - Auto-assignation agents PMR
 * ÉTAPE 8 : Assigne automatiquement un agent PMR selon les besoins utilisateur
 * 
 * ==========================================
 * FONCTIONNALITÉS :
 * ==========================================
 * - Détecte si assistance PMR nécessaire (assistance_level)
 * - Assigne agent disponible selon critères (localisation, disponibilité)
 * - Envoie notifications utilisateur + agent
 * - Évite double assignation
 */

const Agent = require('../models/Agent');
const Voyage = require('../models/Voyage');
const { Reservations } = require('../models/index');
const notificationService = require('./notificationService');
const agentService = require('./agentService');

/**
 * Détermine si un agent PMR est nécessaire
 * @param {Object} pmrNeeds - Besoins PMR
 * @returns {Boolean} true si agent nécessaire
 */
function requiresAgentAssistance(pmrNeeds) {
    // Agent nécessaire si :
    // - assistance_level !== 'none'
    // - OU mobility_aid existe (fauteuil, déambulateur, etc.)
    
    const needsAssistance = pmrNeeds.assistance_level && pmrNeeds.assistance_level !== 'none';
    const hasMobilityAid = pmrNeeds.mobility_aid && pmrNeeds.mobility_aid !== 'none';
    
    return needsAssistance || hasMobilityAid;
}

/**
 * Assigner automatiquement un agent PMR
 * @param {Object} params - Paramètres
 * @param {Number} params.user_id - ID utilisateur
 * @param {String} params.voyage_id - ID voyage MongoDB
 * @param {Number} params.reservation_id - ID réservation
 * @param {Object} params.pmr_needs - Besoins PMR
 * @param {String} params.location - Localisation (départ)
 * @param {String} params.transport_type - Type de transport
 * @returns {Promise<Object>} Résultat de l'assignation
 */
async function autoAssignAgent(params) {
    try {
        const { user_id, voyage_id, reservation_id, pmr_needs, location, transport_type } = params;
        
        console.log(`🔍 ÉTAPE 8: Vérification besoins agent pour user ${user_id}...`);
        
        // ==========================================
        // ÉTAPE 1 : VÉRIFIER SI AGENT NÉCESSAIRE
        // ==========================================
        if (!requiresAgentAssistance(pmr_needs)) {
            console.log('ℹ️ Pas d\'assistance nécessaire (assistance_level = none)');
            return {
                success: false,
                reason: 'no_assistance_needed',
                message: 'Aucune assistance PMR requise',
                agent_assigned: false
            };
        }
        
        console.log(`✅ Assistance nécessaire: ${pmr_needs.assistance_level} | Aide: ${pmr_needs.mobility_aid || 'aucune'}`);
        
        // ==========================================
        // ÉTAPE 2 : VÉRIFIER SI AGENT DÉJÀ ASSIGNÉ
        // ==========================================
        // Vérifier dans Voyage MongoDB si agent_id existe
        const voyage = await Voyage.findById(voyage_id);
        if (voyage && voyage.id_accompagnant) {
            console.log(`ℹ️ Agent déjà assigné: ${voyage.id_accompagnant}`);
            
            const existingAgent = await agentService.getAgentById(voyage.id_accompagnant);
            return {
                success: false,
                reason: 'agent_already_assigned',
                message: 'Agent déjà assigné à ce voyage',
                agent_assigned: true,
                agent: existingAgent
            };
        }
        
        // ==========================================
        // ÉTAPE 3 : ASSIGNER AGENT SELON LOCALISATION
        // ==========================================
        console.log(`📍 Assignation agent pour localisation: ${location}...`);
        
        const agent = agentService.assignAgentByLocation(location);
        
        // Mise à jour Voyage MongoDB avec id_accompagnant
        if (voyage) {
            voyage.id_accompagnant = agent.agent_id;
            await voyage.save();
            console.log(`✅ Voyage ${voyage_id} mis à jour avec agent ${agent.agent_id}`);
        }
        
        // ==========================================
        // ÉTAPE 4 : ENVOYER NOTIFICATIONS
        // ==========================================
        
        // Notification utilisateur
        await notificationService.createNotification({
            user_id: user_id,
            type: 'AGENT_ASSIGNED',
            title: '👤 Agent PMR assigné',
            message: `${agent.name} vous accompagnera pour votre voyage. Vous serez contacté(e) prochainement.`,
            data: {
                source: 'agent_assignment_service',
                voyage_id: voyage_id,
                reservation_id: reservation_id,
                agent_id: agent.agent_id,
                agent_name: agent.name,
                agent_phone: agent.phone,
                location: location,
                transport_type: transport_type,
                assistance_level: pmr_needs.assistance_level,
                mobility_aid: pmr_needs.mobility_aid
            },
            agent_info: {
                name: agent.name,
                phone: agent.phone,
                email: agent.email || null,
                company: agent.company || 'FlexiTrip',
                location: location
            },
            priority: 'high',
            icon: '👤',
            action_url: `/voyage/${voyage_id}`,
            expires_in_days: 30
        });
        
        console.log(`📨 Notification utilisateur envoyée`);
        
        // TODO: Notification agent (future ÉTAPE)
        // Notification vers système agent pour l'informer de la mission
        console.log(`ℹ️ Notification agent ${agent.name} (à implémenter)`);
        
        return {
            success: true,
            agent_assigned: true,
            agent: agent,
            voyage_id: voyage_id,
            reservation_id: reservation_id,
            message: `Agent ${agent.name} assigné avec succès`,
            notifications_sent: {
                user: true,
                agent: false // Pas encore implémenté
            }
        };
        
    } catch (error) {
        console.error('❌ Erreur auto-assignation agent:', error);
        throw error;
    }
}

/**
 * Récupérer agent assigné à un voyage
 * @param {String} voyage_id - ID voyage MongoDB
 * @returns {Promise<Object|null>} Agent ou null
 */
async function getAssignedAgent(voyage_id) {
    try {
        const voyage = await Voyage.findById(voyage_id);
        
        if (!voyage || !voyage.id_accompagnant) {
            return null;
        }
        
        const agent = await agentService.getAgentById(voyage.id_accompagnant);
        return agent;
        
    } catch (error) {
        console.error('❌ Erreur récupération agent assigné:', error);
        return null;
    }
}

/**
 * Déterminer niveau d'urgence assignation agent
 * @param {Object} pmrNeeds - Besoins PMR
 * @returns {String} Niveau d'urgence (low, normal, high, urgent)
 */
function determineAssignmentPriority(pmrNeeds) {
    // URGENT: Fauteuil électrique, aide vitale
    if (pmrNeeds.mobility_aid === 'electric_wheelchair' || pmrNeeds.assistance_level === 'complete') {
        return 'urgent';
    }
    
    // HIGH: Fauteuil manuel, déambulateur
    if (pmrNeeds.mobility_aid === 'wheelchair' || pmrNeeds.assistance_level === 'significant') {
        return 'high';
    }
    
    // NORMAL: Canne, assistance modérée
    if (pmrNeeds.mobility_aid === 'cane' || pmrNeeds.assistance_level === 'moderate') {
        return 'normal';
    }
    
    // LOW: Assistance minimale
    return 'low';
}

/**
 * Traiter batch d'assignations agents
 * @param {Array} bookings - Liste des bookings nécessitant agent
 * @returns {Promise<Object>} Résultat du traitement
 */
async function processBatchAgentAssignments(bookings) {
    const results = {
        total: bookings.length,
        assigned: 0,
        skipped: 0,
        errors: 0,
        details: []
    };
    
    for (const booking of bookings) {
        try {
            if (!requiresAgentAssistance(booking.pmr_needs)) {
                results.skipped++;
                continue;
            }
            
            const result = await autoAssignAgent({
                user_id: booking.user_id,
                voyage_id: booking.voyage_id,
                reservation_id: booking.reservation_id,
                pmr_needs: booking.pmr_needs,
                location: booking.location,
                transport_type: booking.transport_type
            });
            
            if (result.success) {
                results.assigned++;
            } else {
                results.skipped++;
            }
            
            results.details.push(result);
            
        } catch (error) {
            results.errors++;
            results.details.push({
                success: false,
                voyage_id: booking.voyage_id,
                error: error.message
            });
        }
    }
    
    return results;
}

module.exports = {
    autoAssignAgent,
    requiresAgentAssistance,
    getAssignedAgent,
    determineAssignmentPriority,
    processBatchAgentAssignments
};
