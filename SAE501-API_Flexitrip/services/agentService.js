/**
 * Service Agents PMR - Version Supabase
 * Gestion assignation agents aux réservations
 * 
 * - Assigne agents automatiquement par localisation
 * - Récupère infos agents pour notifications
 */

const SupabaseService = require('./SupabaseService');

/**
 * Base de données agents par localisation
 * En production, ces données viendraient de la table Agent MySQL
 */
const AGENTS_BY_LOCATION = {
  'Gare Lyon Part-Dieu': [
    { agent_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab', name: 'Sophie BERNARD', phone: '+33612345678', email: 'sophie.bernard@sncf.fr' },
    { agent_id: 'b2c3d4e5-f6a7-4b6c-9d0e-123456789abc', name: 'Marc DUPONT', phone: '+33623456789', email: 'marc.dupont@sncf.fr' }
  ],
  'Gare Paris Montparnasse': [
    { agent_id: 'c3d4e5f6-a7b8-4c7d-0e1f-23456789abcd', name: 'Julie MARTIN', phone: '+33634567890', email: 'julie.martin@sncf.fr' },
    { agent_id: 'd4e5f6a7-b8c9-4d8e-1f2g-3456789abcde', name: 'Pierre LEROY', phone: '+33645678901', email: 'pierre.leroy@sncf.fr' }
  ],
  'default': [
    { agent_id: 'f9e8d7c6-b5a4-4321-bcde-f01234567890', name: 'Service PMR', phone: '+33800123456', email: 'pmr@flexitrip.com' }
  ]
};

/**
 * Assigner agent PMR à une localisation
 * @param {string} location - Localisation (gare, aéroport)
 * @returns {Object} Agent assigné
 */
const assignAgentByLocation = (location) => {
  try {
    console.log(`🔍 Recherche agent PMR pour: ${location}`);

    // Chercher agents disponibles pour cette localisation
    let agents = AGENTS_BY_LOCATION[location] || AGENTS_BY_LOCATION['default'];

    // Sélectionner aléatoirement un agent disponible
    const randomAgent = agents[Math.floor(Math.random() * agents.length)];

    console.log(`✅ Agent assigné: ${randomAgent.name} (${randomAgent.phone})`);

    return {
      ...randomAgent,
      location,
      assigned_at: new Date().toISOString(),
      photo: `https://i.pravatar.cc/150?u=${randomAgent.agent_id}` // Avatar aléatoire
    };

  } catch (error) {
    console.error('❌ Erreur assignation agent:', error);
    // Retourner agent par défaut en cas d'erreur
    return {
      ...AGENTS_BY_LOCATION['default'][0],
      location,
      assigned_at: new Date().toISOString()
    };
  }
};

/**
 * Récupérer agent par ID depuis MySQL
 * @param {number} agentId - ID agent
 * @returns {Promise<Object>} Agent
 */
const getAgentById = async (agentId) => {
  try {
    // Simuler une réponse puisque le modèle Agent (Sequelize) est mort
    console.log(`🔍 Mode Supabase : Recherche simulée de l'agent ${agentId}`);
    return AGENTS_BY_LOCATION['default'][0];
  } catch (error) {
    console.error('❌ Erreur récupération agent:', error);
    return AGENTS_BY_LOCATION['default'][0];
  }
};

/**
 * Récupérer tous les agents d'une entreprise
 * @param {string} entreprise - Nom entreprise (SNCF, ADP, etc)
 * @returns {Promise<Array>} Liste agents
 */
const getAgentsByCompany = async (entreprise) => {
  try {
    // On retourne une liste vide ou statique pour éviter le crash
    return [];
  } catch (error) {
    console.error('❌ Erreur récupération agents:', error);
    return [];
  }
};

/**
 * Créer agents fictifs en base MySQL (pour démo)
 * @returns {Promise<void>}
 */
const populateAgentsDB = async () => {
  // Vider le contenu de cette fonction car elle utilisait Agent.create (Sequelize)
  console.log('⏭️ Population agents ignorée (Migration Supabase en cours)');
  return;
};

/**
 * Assigner agent à une réservation spécifique
 * @param {number} reservationId - ID réservation
 * @param {string} location - Localisation
 * @returns {Object} Agent assigné
 */
const assignAgentToReservation = async (reservationId, location) => {
  try {
    const agent = assignAgentByLocation(location);

    console.log(`✅ Agent ${agent.name} assigné à réservation ${reservationId}`);

    // TODO: Stocker l'assignation dans une table agent_assignments
    // Pour l'instant, juste retourner l'agent

    return agent;

  } catch (error) {
    console.error('❌ Erreur assignation agent réservation:', error);
    return AGENTS_BY_LOCATION['default'][0];
  }
};

/**
 * Récupérer agent assigné à une réservation
 * @param {number} reservationId - ID réservation
 * @returns {Promise<Object|null>} Agent ou null
 */
const getAgentForReservation = async (reservationId) => {
  try {
    // TODO: Récupérer depuis table agent_assignments
    // Pour l'instant, retourner agent par défaut
    console.log(`🔍 Recherche agent pour réservation ${reservationId}`);
    return null; // Pas d'agent assigné

  } catch (error) {
    console.error('❌ Erreur récupération agent réservation:', error);
    return null;
  }
};

module.exports = {
  assignAgentByLocation,
  getAgentById,
  getAgentsByCompany,
  populateAgentsDB,
  assignAgentToReservation,
  getAgentForReservation
};