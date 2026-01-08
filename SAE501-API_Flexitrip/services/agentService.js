/**
 * Service Agents PMR
 * Gestion assignation agents aux réservations
 * 
 * - Assigne agents automatiquement par localisation
 * - Récupère infos agents pour notifications
 */

const { Agent } = require('../models');

/**
 * Base de données agents par localisation
 * En production, ces données viendraient de la table Agent MySQL
 */
const AGENTS_BY_LOCATION = {
  'Gare Lyon Part-Dieu': [
    { agent_id: 1, name: 'Sophie BERNARD', phone: '+33612345678', email: 'sophie.bernard@sncf.fr' },
    { agent_id: 2, name: 'Marc DUPONT', phone: '+33623456789', email: 'marc.dupont@sncf.fr' }
  ],
  'Gare Paris Montparnasse': [
    { agent_id: 3, name: 'Julie MARTIN', phone: '+33634567890', email: 'julie.martin@sncf.fr' },
    { agent_id: 4, name: 'Pierre LEROY', phone: '+33645678901', email: 'pierre.leroy@sncf.fr' }
  ],
  'CDG Terminal 2E': [
    { agent_id: 5, name: 'Emma DUBOIS', phone: '+33656789012', email: 'emma.dubois@adp.fr' },
    { agent_id: 6, name: 'Thomas PETIT', phone: '+33667890123', email: 'thomas.petit@adp.fr' }
  ],
  'Orly Terminal 3': [
    { agent_id: 7, name: 'Léa ROUX', phone: '+33678901234', email: 'lea.roux@adp.fr' },
    { agent_id: 8, name: 'Lucas MOREAU', phone: '+33689012345', email: 'lucas.moreau@adp.fr' }
  ],
  'default': [
    { agent_id: 9, name: 'Service PMR', phone: '+33800123456', email: 'pmr@flexitrip.com' }
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
    const agent = await Agent.findOne({
      where: { id_agent: agentId }
    });

    if (!agent) {
      console.warn(`⚠️ Agent ${agentId} introuvable, retour agent par défaut`);
      return AGENTS_BY_LOCATION['default'][0];
    }

    return {
      agent_id: agent.id_agent,
      name: `${agent.name} ${agent.surname}`,
      phone: agent.phone,
      email: agent.email,
      entreprise: agent.entreprise,
      photo: `https://i.pravatar.cc/150?u=${agent.id_agent}`
    };

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
    const agents = await Agent.findAll({
      where: { entreprise }
    });

    return agents.map(agent => ({
      agent_id: agent.id_agent,
      name: `${agent.name} ${agent.surname}`,
      phone: agent.phone,
      email: agent.email,
      entreprise: agent.entreprise
    }));

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
  try {
    console.log('📋 Population agents PMR...');

    const agentsToCreate = [
      { name: 'Sophie', surname: 'BERNARD', email: 'sophie.bernard@sncf.fr', phone: '+33612345678', entreprise: 'SNCF' },
      { name: 'Marc', surname: 'DUPONT', email: 'marc.dupont@sncf.fr', phone: '+33623456789', entreprise: 'SNCF' },
      { name: 'Julie', surname: 'MARTIN', email: 'julie.martin@sncf.fr', phone: '+33634567890', entreprise: 'SNCF' },
      { name: 'Pierre', surname: 'LEROY', email: 'pierre.leroy@sncf.fr', phone: '+33645678901', entreprise: 'SNCF' },
      { name: 'Emma', surname: 'DUBOIS', email: 'emma.dubois@adp.fr', phone: '+33656789012', entreprise: 'ADP' },
      { name: 'Thomas', surname: 'PETIT', email: 'thomas.petit@adp.fr', phone: '+33667890123', entreprise: 'ADP' },
      { name: 'Léa', surname: 'ROUX', email: 'lea.roux@adp.fr', phone: '+33678901234', entreprise: 'ADP' },
      { name: 'Lucas', surname: 'MOREAU', email: 'lucas.moreau@adp.fr', phone: '+33689012345', entreprise: 'ADP' },
      { name: 'Service', surname: 'PMR', email: 'pmr@flexitrip.com', phone: '+33800123456', entreprise: 'FlexiTrip' }
    ];

    for (const agentData of agentsToCreate) {
      // Vérifier si existe déjà
      const exists = await Agent.findOne({ where: { email: agentData.email } });
      
      if (!exists) {
        await Agent.create({
          ...agentData,
          password: '$2b$10$dummyHashForDemo' // Hash bcrypt fictif
        });
        console.log(`✅ Agent créé: ${agentData.name} ${agentData.surname}`);
      } else {
        console.log(`⏭️ Agent existe: ${agentData.name} ${agentData.surname}`);
      }
    }

    console.log('✅ Population agents terminée');

  } catch (error) {
    console.error('❌ Erreur population agents:', error);
    throw error;
  }
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
