/**
 * VoyageService - Remplace le modèle Voyage.js Sequelize
 * 
 * Utilise supabaseService pour tous les accès à la table voyages
 */

const supabaseService = require('./supabaseService');
const { v4: uuidv4 } = require('uuid');

class VoyageService {
    /**
     * Créer un nouveau voyage
     */
    async create(voyageData) {
        const {
            id_pmr, id_accompagnant, date_debut, date_fin,
            lieu_depart, lieu_arrivee, bagage = [], etapes = [],
            prix_total = 0, status = 'planned'
        } = voyageData;

        return supabaseService.createVoyage({
            id_pmr, id_accompagnant, date_debut, date_fin,
            lieu_depart, lieu_arrivee, bagage, etapes,
            prix_total, status
        });
    }

    /**
     * Récupérer voyage par ID
     */
    async findById(voyageId) {
        return supabaseService.getVoyageById(voyageId);
    }

    /**
     * Récupérer voyages d'un utilisateur (PMR)
     */
    async findByPmr(pmrId) {
        return supabaseService.getVoyagesByUser(pmrId, 'pmr');
    }

    /**
     * Récupérer voyages d'un accompagnant
     */
    async findByAccompagnant(accompagnantId) {
        return supabaseService.getVoyagesByUser(accompagnantId, 'accompagnant');
    }

    /**
     * Récupérer tous les voyages d'un utilisateur
     */
    async findByUser(userId, role) {
        return supabaseService.getVoyagesByUser(userId, role);
    }

    /**
     * Mettre à jour un voyage
     */
    async update(voyageId, updates) {
        return supabaseService.updateVoyage(voyageId, updates);
    }

    /**
     * Mettre à jour le statut d'un voyage
     */
    async updateStatus(voyageId, status) {
        return this.update(voyageId, { status });
    }

    /**
     * Ajouter un accompagnant à un voyage
     */
    async addAccompagnant(voyageId, accompagnantId) {
        return this.update(voyageId, { id_accompagnant: accompagnantId });
    }

    /**
     * Calculer le prix total du voyage
     */
    calculateTotalPrice(segments) {
        // À adapter selon la logique métier
        return segments.reduce((total, segment) => total + (segment.price || 0), 0);
    }

    /**
     * Valider les dates du voyage
     */
    validateDates(dateDebut, dateFin) {
        const start = new Date(dateDebut);
        const end = new Date(dateFin);

        if (end <= start) {
            throw new Error('La date de fin doit être après la date de début');
        }

        return true;
    }

    /**
     * Vérifier si les emplacements sont valides
     */
    validateLocations(lieuDepart, lieuArrivee) {
        if (!lieuDepart || !lieuDepart.lat || !lieuDepart.lng) {
            throw new Error('Lieu de départ invalide');
        }

        if (!lieuArrivee || !lieuArrivee.lat || !lieuArrivee.lng) {
            throw new Error('Lieu d\'arrivée invalide');
        }

        return true;
    }

    /**
     * Vérifier si le voyage peut être modifié (par ex, pas déjà commencé)
     */
    async canBeModified(voyageId) {
        const voyage = await this.findById(voyageId);

        if (!voyage) {
            throw new Error('Voyage non trouvé');
        }

        const now = new Date();
        const start = new Date(voyage.date_debut);

        if (now > start) {
            throw new Error('Impossible de modifier un voyage qui a déjà commencé');
        }

        return true;
    }

    /**
     * Obtenir les voyages dans les 7 prochains jours
     */
    async getUpcomingVoyages(limit = 50) {
        const now = new Date();
        const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // À implémenter si besoin: filtre par date
        return [];
    }
}

module.exports = new VoyageService();
