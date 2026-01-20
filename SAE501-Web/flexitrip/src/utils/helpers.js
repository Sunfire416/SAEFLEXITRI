/**
 * Helpers utilitaires pour normaliser les données
 */

/**
 * Formate un lieu (gare/ville) pour l'affichage
 * Gère les cas où lieu est un objet {gare, ville} ou une string
 * @param {Object|string} lieu - Le lieu à formater
 * @returns {string} - Le lieu formaté
 */
export const formatLieu = (lieu) => {
    if (!lieu) return "N/A";

    // Si c'est une string, on prend juste la première partie (ville)
    if (typeof lieu === "string") {
        return lieu.split(",")[0].trim();
    }

    // Si c'est un objet avec ville et/ou gare
    if (typeof lieu === "object") {
        const parts = [lieu.ville, lieu.gare].filter(Boolean);
        return parts.join(" - ") || "N/A";
    }

    return "N/A";
};

/**
 * Récupère le poids d'un bagage en gérant les typos (poid vs poids)
 * @param {Object} bagage - L'objet bagage
 * @returns {string|number} - Le poids ou 'N/A'
 */
export const getPoids = (bagage) => {
    if (!bagage) return 'N/A';

    // Essaie d'abord 'poids' (correct), puis 'poid' (typo)
    const weight = bagage.poids ?? bagage.poid ?? 'N/A';

    // Convertit en nombre si c'est une string
    if (typeof weight === 'string' && weight !== 'N/A') {
        const parsed = parseFloat(weight);
        return isNaN(parsed) ? weight : parsed;
    }

    return weight;
};

/**
 * Normalise le rôle utilisateur (gère les variations de casse)
 * @param {string} role - Le rôle à normaliser
 * @returns {string} - Le rôle normalisé en lowercase
 */
export const normalizeRole = (role) => {
    if (!role) return "";
    return role.toLowerCase().trim();
};

/**
 * Vérifie si un utilisateur a un rôle spécifique
 * @param {Object} user - L'objet utilisateur
 * @param {string} targetRole - Le rôle à vérifier (case-insensitive)
 * @returns {boolean}
 */
export const hasRole = (user, targetRole) => {
    if (!user || !user.role) return false;
    return normalizeRole(user.role) === normalizeRole(targetRole);
};
