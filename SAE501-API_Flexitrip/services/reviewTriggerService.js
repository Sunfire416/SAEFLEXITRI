/**
 * Service Review Trigger - Auto-déclenchement des demandes d'avis
 * ÉTAPE 7 : Détecte automatiquement la fin d'un voyage et envoie notification review
 * 
 * ==========================================
 * FONCTIONNALITÉS :
 * ==========================================
 * - Détecter voyage terminé (status = 'completed')
 * - Vérifier si review déjà soumis
 * - Envoyer notification demande d'avis
 * - Éviter spam (max 1 notification par voyage)
 */

const Review = require('../models/Review');
const { Reservations } = require('../models/index');
const notificationService = require('./notificationService');
const Notification = require('../models/Notification');

/**
 * Déclenche demande d'avis après fin de voyage
 * @param {Object} params - Paramètres
 * @param {String} params.voyage_id - ID voyage MongoDB
 * @param {Number} params.user_id - ID utilisateur
 * @param {Array} params.reservations - Liste des réservations du voyage
 * @param {String} params.depart - Lieu de départ
 * @param {String} params.arrivee - Lieu d'arrivée
 * @param {String} params.transport_type - Type de transport principal
 * @returns {Promise<Object>} Résultat du déclenchement
 */
async function triggerReviewRequest(params) {
    try {
        const { voyage_id, user_id, reservations, depart, arrivee, transport_type } = params;
        
        console.log(`🔍 ÉTAPE 7: Vérification review pour voyage ${voyage_id}...`);
        
        // ==========================================
        // ÉTAPE 1 : VÉRIFIER SI REVIEWS DÉJÀ SOUMIS
        // ==========================================
        if (!reservations || reservations.length === 0) {
            console.log('⚠️ Aucune réservation associée, skip review trigger');
            return {
                success: false,
                reason: 'no_reservations',
                message: 'Aucune réservation trouvée pour ce voyage'
            };
        }
        
        // Vérifier si au moins un review existe pour ce voyage
        const reservation_ids = reservations.map(r => r.reservation_id);
        const existingReviews = await Review.find({
            reservationId: { $in: reservation_ids },
            userId: user_id
        });
        
        if (existingReviews.length > 0) {
            console.log(`✅ Review déjà soumis pour ce voyage (${existingReviews.length} review(s))`);
            return {
                success: false,
                reason: 'review_already_exists',
                message: 'Avis déjà soumis pour ce voyage',
                existing_reviews: existingReviews.length
            };
        }
        
        // ==========================================
        // ÉTAPE 2 : VÉRIFIER SI NOTIFICATION DÉJÀ ENVOYÉE
        // ==========================================
        const existingNotification = await Notification.findOne({
            user_id: user_id,
            type: 'review_request',
            'metadata.voyage_id': voyage_id,
            status: { $ne: 'deleted' }
        });
        
        if (existingNotification) {
            console.log(`ℹ️ Notification review déjà envoyée pour ce voyage`);
            return {
                success: false,
                reason: 'notification_already_sent',
                message: 'Notification déjà envoyée',
                notification_id: existingNotification.notification_id
            };
        }
        
        // ==========================================
        // ÉTAPE 3 : ENVOYER NOTIFICATION DEMANDE D'AVIS
        // ==========================================
        console.log(`📨 Envoi notification demande d'avis pour voyage ${voyage_id}...`);
        
        const primaryReservation = reservations[0]; // Prendre la première réservation pour le lien
        
        const notification = await notificationService.createNotification({
            user_id: user_id,
            type: 'review_request',
            title: '🌟 Comment s\'est passé votre voyage ?',
            message: `Votre voyage ${depart} → ${arrivee} est terminé. Partagez votre expérience pour nous aider à améliorer nos services !`,
            data: {
                source: 'review_trigger_service',
                voyage_id: voyage_id,
                reservation_id: primaryReservation.reservation_id,
                depart: depart,
                arrivee: arrivee,
                transport_type: transport_type,
                reservation_count: reservations.length
            },
            priority: 'normal',
            icon: '⭐',
            action_url: `/reviews/create?reservation_id=${primaryReservation.reservation_id}`,
            expires_in_days: 7 // Notification expire après 7 jours
        });
        
        console.log(`✅ Notification review envoyée: ${notification.notification_id}`);
        
        return {
            success: true,
            notification_id: notification.notification_id,
            voyage_id: voyage_id,
            reservation_id: primaryReservation.reservation_id,
            message: 'Notification review envoyée avec succès'
        };
        
    } catch (error) {
        console.error('❌ Erreur trigger review request:', error);
        throw error;
    }
}

/**
 * Vérifier si voyage nécessite demande d'avis
 * @param {String} voyageStatus - Statut du voyage
 * @param {Date} voyageDateFin - Date de fin du voyage
 * @returns {Boolean} true si demande d'avis nécessaire
 */
function shouldTriggerReviewRequest(voyageStatus, voyageDateFin) {
    // Déclencher uniquement si :
    // 1. Status = 'completed'
    // 2. Date de fin est passée
    const isCompleted = voyageStatus === 'completed';
    const isPast = new Date(voyageDateFin) < new Date();
    
    return isCompleted && isPast;
}

/**
 * Traiter automatiquement les demandes d'avis pour plusieurs voyages
 * @param {Array} voyages - Liste des voyages à traiter
 * @returns {Promise<Object>} Résultat du traitement
 */
async function processBatchReviewRequests(voyages) {
    const results = {
        total: voyages.length,
        triggered: 0,
        skipped: 0,
        errors: 0,
        details: []
    };
    
    for (const voyage of voyages) {
        try {
            if (!shouldTriggerReviewRequest(voyage.status, voyage.date_fin)) {
                results.skipped++;
                continue;
            }
            
            const result = await triggerReviewRequest({
                voyage_id: voyage.voyage_id,
                user_id: voyage.id_pmr || voyage.user_id,
                reservations: voyage.reservations || [],
                depart: voyage.depart || voyage.lieu_depart?.id || 'N/A',
                arrivee: voyage.arrivee || voyage.lieu_arrive?.id || 'N/A',
                transport_type: voyage.etapes?.[0]?.type || 'unknown'
            });
            
            if (result.success) {
                results.triggered++;
            } else {
                results.skipped++;
            }
            
            results.details.push(result);
            
        } catch (error) {
            results.errors++;
            results.details.push({
                success: false,
                voyage_id: voyage.voyage_id,
                error: error.message
            });
        }
    }
    
    return results;
}

module.exports = {
    triggerReviewRequest,
    shouldTriggerReviewRequest,
    processBatchReviewRequests
};
