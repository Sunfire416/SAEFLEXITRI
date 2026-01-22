/**
 * Service d'Assignation Intelligente IA - MIGRATION SUPABASE
 * 
 * Version simplifiée pour la migration.
 * Utilise la table `users` (Agents) et `pmr_missions`.
 */

const SupabaseService = require('./SupabaseService');
const notificationService = require('./notificationService');

/**
 * Assigne automatiquement l'agent le plus approprié à une mission
 */
async function assignBestAgent(missionParams) {
  try {
    const {
      prise_en_charge_id, // Mapped to mission_id or just reservation_id context
      reservation_id,
      user_id,
      voyage_id,
      location,
      priorityLevel
    } = missionParams;

    console.log(`🤖 [IA] Assignation simplifiée pour réservation ${reservation_id}...`);

    // 1. Trouver les agents disponibles
    const { data: agents, error } = await SupabaseService.client
      .from('users')
      .select('*')
      .eq('role', 'Agent'); // .eq('available', true) if we had status

    if (error || !agents || agents.length === 0) {
      return {
        success: false,
        reason: 'no_available_agents',
        message: 'Aucun agent trouvé'
      };
    }

    // 2. Sélectionner un agent (Aléatoire pour l'instant, ou basé sur location si possible)
    const selectedAgent = agents[Math.floor(Math.random() * agents.length)];

    // 3. Créer la mission PMR
    const missionData = {
      reservation_id: reservation_id, // UUID
      agent_id: selectedAgent.user_id,
      status: 'assigned',
      notes: `Priorité: ${priorityLevel || 'normal'}. Assigné par IA.`,
      created_at: new Date().toISOString()
    };

    const { data: mission, error: missionError } = await SupabaseService.client
      .from('pmr_missions')
      .insert([missionData])
      .select()
      .single();

    if (missionError) throw missionError;

    // 4. Notifications
    try {
      await notificationService.sendAgentAssigned(user_id, {
        name: `${selectedAgent.name} ${selectedAgent.surname}`,
        phone: selectedAgent.phone || 'Non renseigné'
      }, location ? 'Gare/Aéroport' : 'Point de rendez-vous');
    } catch (e) {
      console.warn('Notification failed', e.message);
    }

    return {
      success: true,
      agent: {
        id: selectedAgent.user_id,
        name: `${selectedAgent.name} ${selectedAgent.surname}`,
        email: selectedAgent.email,
        phone: selectedAgent.phone
      },
      score: { totalScore: 85 }, // Mock score
      alternatives: [],
      message: `Agent ${selectedAgent.name} assigné`
    };

  } catch (error) {
    console.error('❌ [IA] Erreur assignBestAgent:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Trouve les agents disponibles avec scores (Mock)
 */
async function findAvailableAgentsWithScores(missionParams) {
  // Return simple list from Supabase
  const { data: agents } = await SupabaseService.client
    .from('users')
    .select('*')
    .eq('role', 'Agent');

  return (agents || []).map(a => ({
    agent: {
      id_agent: a.user_id, // Map user_id to id_agent for compat
      name: a.name,
      surname: a.surname,
      email: a.email,
      phone: a.phone,
      availability: { status: 'available' }
    },
    score: { totalScore: Math.floor(Math.random() * 40) + 60 }
  }));
}

module.exports = {
  assignBestAgent,
  findAvailableAgentsWithScores
};
