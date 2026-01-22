/**
 * Service Priorité Dynamique - Stub Migration
 */
const SupabaseService = require('./SupabaseService');

const reevaluateMissionPriority = async (id) => {
  return { priority: 'normal', reason: 'Migration default' };
};

const monitorActiveMissions = async () => {
  return { monitored: 0, updates: 0 };
};

const reassignAgent = async (id, reason) => {
  return { success: false, message: 'Not implemented' };
};

module.exports = {
  reevaluateMissionPriority,
  monitorActiveMissions,
  reassignAgent,
  REASSIGNMENT_REASONS: { BETTER_AGENT: 'better_agent' }
};
