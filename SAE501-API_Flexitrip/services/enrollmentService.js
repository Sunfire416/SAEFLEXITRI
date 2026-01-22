/**
 * Service Enrollment Automatisé - ÉTAPE 4
 *
 * Mode Supabase uniquement : enrollment biométrique désactivé.
 */

/**
 * Crée un enrollment biométrique automatique pour un utilisateur
 * 
 * @param {Object} user - Objet utilisateur (User model)
 * @param {Object} options - Options d'enrollment
 * @param {number} options.reservation_id - ID de la réservation associée
 * @param {string} options.workflow_type - Type de workflow (MODERATE, FULL)
 * @param {Object} options.identity_data - Données d'identité (nom, prénom, etc.)
 * @returns {Promise<Object>} - Données enrollment créé
 */
async function createAutoEnrollment() {
    return {
        success: false,
        disabled: true,
        error: 'Enrollment biométrique désactivé (Mongo retiré)'
    };
}

/**
 * Vérifie si un utilisateur a un enrollment actif
 * 
 * @param {number} userId - ID utilisateur
 * @returns {Promise<Object|null>} - Enrollment ou null
 */
async function getActiveEnrollment() {
    return null;
}

/**
 * Vérifie si un workflow nécessite un enrollment
 * 
 * @param {string} workflowType - Type de workflow (MINIMAL, LIGHT, MODERATE, FULL)
 * @returns {boolean} - true si enrollment requis
 */
function requiresEnrollment() {
    return false;
}

module.exports = {
    createAutoEnrollment,
    getActiveEnrollment,
    requiresEnrollment
};
