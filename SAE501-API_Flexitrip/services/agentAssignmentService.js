/**
 * Service Agent Assignment - Auto-assignation agents PMR
 * MIGRÉ VERS SUPABASE
 * 
 * Utilise la table pmr_missions pour assignation agents
 */

const supabaseService = require('./SupabaseService');
const notificationService = require('./notificationService');

/**
 * Détermine si un agent PMR est nécessaire
 */
function requiresAgentAssistance(pmrNeeds) {
    const needsAssistance = pmrNeeds?.assistance_level && pmrNeeds.assistance_level !== 'none';
    const hasMobilityAid = pmrNeeds?.mobility_aid && pmrNeeds.mobility_aid !== 'none';

    return needsAssistance || hasMobilityAid;
}

/**
 * Assigner automatiquement un agent PMR
 * Crée une entrée dans pmr_missions
 */
async function autoAssignAgent(params) {
    try {
        const { user_id, voyage_id, reservation_id, pmr_needs, location, transport_type } = params;

        console.log(`🔍 Auto-assign agent pour réservation ${reservation_id}...`);

        // ==========================================
        // ÉTAPE 1 : VÉRIFIER SI AGENT NÉCESSAIRE
        // ==========================================
        if (!requiresAgentAssistance(pmrNeeds)) {
            console.log('ℹ️ Pas d\'assistance nécessaire');
            return {
                success: false,
                reason: 'no_assistance_needed',
                message: 'Aucune assistance PMR requise',
                agent_assigned: false
            };
        }

        console.log(`✅ Assistance nécessaire: ${pmr_needs.assistance_level}`);

        // ==========================================
        // ÉTAPE 2 : VÉRIFIER SI MISSION DÉJÀ EXISTE
        // ==========================================
        const existingMission = await supabaseService.getPmrMission(reservation_id);

        if (existingMission) {
            console.log(`ℹ️ Mission déjà assignée: agent ${existingMission.agent_id}`);
            return {
                success: false,
                reason: 'mission_already_exists',
                message: 'Mission déjà assignée',
                mission: existingMission
            };
        }

        // ==========================================
        // ÉTAPE 3 : ASSIGNER AGENT DISPONIBLE
        // ==========================================
        console.log(`📍 Recherche agent disponible pour ${location}...`);

        // TODO: Implémenter logique de sélection selon:
        // - Localisation (distance)
        // - Disponibilité
        // - Compétences
        // - Charge de travail

        // Simulé: assigner un agent (à remplacer par logique réelle)
        const agents = await supabaseService.getAllUsers({ role: 'Agent' });

        if (!agents || agents.length === 0) {
            return {
                success: false,
                reason: 'no_agents_available',
                message: 'Aucun agent disponible'
            };
        }

        const selectedAgent = agents[0]; // À remplacer par sélection intelligente

        // ==========================================
        // ÉTAPE 4 : CRÉER LA MISSION
        // ==========================================
        const mission = await supabaseService.createPmrMission({
            reservation_id,
            agent_id: selectedAgent.user_id,
            status: 'pending'
        });

        console.log(`✅ Mission créée pour agent ${selectedAgent.user_id}`);

        // ==========================================
        // ÉTAPE 5 : NOTIFIER L'AGENT
        // ==========================================
        try {
            await notificationService.createNotification({
                user_id: selectedAgent.user_id,
                type: 'mission',
                title: 'Nouvelle mission PMR',
                message: `Vous avez été assigné à une mission PMR pour la réservation ${reservation_id}`,
                data: {
                    reservation_id,
                    mission_id: mission.id
                }
            });
        } catch (notifError) {
            console.warn('⚠️ Erreur notification agent:', notifError.message);
        }

        // ==========================================
        // ÉTAPE 6 : NOTIFIER L'UTILISATEUR
        // ==========================================
        try {
            await notificationService.createNotification({
                user_id,
                type: 'mission',
                title: 'Agent assigné',
                message: `Un agent a été assigné à votre réservation: ${selectedAgent.name} ${selectedAgent.surname}`,
                data: {
                    agent_id: selectedAgent.user_id,
                    agent_name: `${selectedAgent.name} ${selectedAgent.surname}`,
                    agent_phone: selectedAgent.phone
                }
            });
        } catch (notifError) {
            console.warn('⚠️ Erreur notification utilisateur:', notifError.message);
        }

        return {
            success: true,
            reason: 'agent_assigned',
            message: 'Agent assigné avec succès',
            mission,
            agent: selectedAgent
        };

    } catch (error) {
        console.error('❌ Error in autoAssignAgent:', error.message);
        throw error;
    }
}


/**
 * Récupérer mission assignée à une réservation
 */
async function getAssignedMission(reservationId) {
    try {
        return await supabaseService.getPmrMission(reservationId);
    } catch (error) {
        console.error('❌ Erreur récupération mission:', error.message);
        return null;
    }
}

/**
 * Déterminer niveau d'urgence assignation
 */
function determineAssignmentPriority(pmrNeeds) {
    if (pmrNeeds?.assistance_level === 'complete') return 'urgent';
    if (pmrNeeds?.assistance_level === 'significant') return 'high';
    if (pmrNeeds?.assistance_level === 'moderate') return 'normal';
    return 'low';
}

/**
 * Traiter batch d'assignations agents
 */
async function processBatchAgentAssignments(reservations) {
    const results = {
        total: reservations.length,
        assigned: 0,
        skipped: 0,
        errors: 0,
        details: []
    };

    for (const reservation of reservations) {
        try {
            const result = await autoAssignAgent({
                user_id: reservation.user_id,
                reservation_id: reservation.reservation_id,
                pmr_needs: reservation.pmr_options || {},
                location: reservation.lieu_depart,
                transport_type: reservation.type_transport
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
                reservation_id: reservation.reservation_id,
                error: error.message
            });
        }
    }

    console.log(`📊 Batch results: ${results.assigned} assignées, ${results.skipped} skipped, ${results.errors} erreurs`);
    return results;
}

/**
 * Mettre à jour le statut d'une mission
 */
async function updateMissionStatus(missionId, status) {
    try {
        return await supabaseService.updatePmrMission(missionId, { status });
    } catch (error) {
        console.error('❌ Erreur mise à jour mission:', error.message);
        throw error;
    }
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    autoAssignAgent,
    getAssignedMission,
    determineAssignmentPriority,
    processBatchAgentAssignments,
    updateMissionStatus,
    requiresAgentAssistance
};


// ✅ FIN DU FICHIER - Code restant supprimé (doublon/ancien)

