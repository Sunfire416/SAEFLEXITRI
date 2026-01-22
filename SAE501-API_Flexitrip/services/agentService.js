/**
 * Service Agents - MIGRÉ VERS SUPABASE
 * 
 * Gestion agents PMR
 * Utilise la table users avec role='Agent'
 */

const supabaseService = require('./SupabaseService');

/**
 * Récupérer tous les agents disponibles
 */
async function getAllAgents(filters = {}) {
    try {
        const agents = await supabaseService.getAllUsers({ role: 'Agent' });
        return agents || [];
    } catch (error) {
        console.error('❌ Erreur récupération agents:', error.message);
        return [];
    }
}

/**
 * Récupérer agent par ID
 */
async function getAgentById(agentId) {
    try {
        return await supabaseService.getUserById(agentId);
    } catch (error) {
        console.error('❌ Erreur récupération agent:', error.message);
        return null;
    }
}

/**
 * Assigner agent par localisation (simple)
 * À améliorer avec logique géographique réelle
 */
async function assignAgentByLocation(location) {
    try {
        const agents = await getAllAgents();

        if (!agents || agents.length === 0) {
            throw new Error('Aucun agent disponible');
        }

        // Sélection aléatoire simple (à remplacer par logique géographique)
        return agents[Math.floor(Math.random() * agents.length)];
    } catch (error) {
        console.error('❌ Erreur assignation agent:', error.message);
        return null;
    }
}

/**
 * Créer un agent
 */
async function createAgent(agentData) {
    try {
        const agent = await supabaseService.createUser({
            ...agentData,
            role: 'Agent'
        });
        return agent;
    } catch (error) {
        console.error('❌ Erreur création agent:', error.message);
        throw error;
    }
}

/**
 * Mettre à jour agent
 */
async function updateAgent(agentId, updates) {
    try {
        return await supabaseService.updateUser(agentId, updates);
    } catch (error) {
        console.error('❌ Erreur mise à jour agent:', error.message);
        throw error;
    }
}

/**
 * Obtenir missions d'un agent
 */
async function getAgentMissions(agentId) {
    try {
        return await supabaseService.getAgentMissions(agentId);
    } catch (error) {
        console.error('❌ Erreur récupération missions:', error.message);
        return [];
    }
}

/**
 * Mettre à jour localisation agent (GPS)
 */
async function updateAgentLocation(agentId, lat, lng) {
    try {
        const mission = await supabaseService.getAgentMissions(agentId);

        if (mission && mission.length > 0) {
            // Mettre à jour la première mission active
            const firstMission = mission[0];
            return await supabaseService.updatePmrMission(firstMission.id, {
                agent_lat: lat,
                agent_lng: lng,
                updated_at: new Date().toISOString()
            });
        }

        return null;
    } catch (error) {
        console.error('❌ Erreur mise à jour localisation:', error.message);
        throw error;
    }
}

/**
 * Vérifier disponibilité agent
 */
async function isAgentAvailable(agentId) {
    try {
        const agent = await getAgentById(agentId);
        // Logique simple: agent est dispo s'il existe
        // Logique simple: agent est dispo s'il existe
        return agent !== null;
    } catch (error) {
        return false;
    }
}

/**
 * Assigner agent à une réservation (Stub)
 */
const assignAgentToReservation = async (reservationId, location) => {
    try {
        // Réutiliser assignAgentByLocation
        const agent = await assignAgentByLocation(location);
        console.log(`✅ Agent ${agent ? agent.name : 'Unknown'} assigné à réservation ${reservationId}`);
        return agent;
    } catch (error) {
        console.error('❌ Erreur assignation agent réservation:', error);
        return null;
    }
};

/**
 * Récupérer agent assigné à une réservation (Stub)
 */
const getAgentForReservation = async (reservationId) => {
    // TODO: Implémenter avec table pmr_missions
    return null;
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    getAllAgents,
    getAgentById,
    assignAgentByLocation,
    createAgent,
    updateAgent,
    getAgentMissions,
    updateAgentLocation,
    isAgentAvailable,
    assignAgentToReservation,
    getAgentForReservation
};