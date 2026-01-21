/**
 * Service Incident Detection - Détection automatique des incidents
 * ÉTAPE 9 : Détecte automatiquement les incidents via monitoring et données externes
 * 
 * ==========================================
 * FONCTIONNALITÉS :
 * ==========================================
 * - Détecte retards, annulations, problèmes techniques
 * - Identifie utilisateurs PMR affectés
 * - Crée incidents automatiquement
 * - Envoie notifications aux utilisateurs affectés
 * - Propose solutions de réacheminement
 */

const Incident = require('../models/Incident');
const Voyage = require('../models/Voyage');
const { Reservations } = require('../models/index');
const notificationService = require('./notificationService');

/**
 * Détecte incident retard automatiquement
 * @param {Object} params - Paramètres
 * @param {String} params.transport_type - Type de transport (train, avion, taxi)
 * @param {String} params.booking_reference - Référence réservation opérateur
 * @param {String} params.departure - Lieu de départ
 * @param {String} params.arrival - Lieu d'arrivée
 * @param {Date} params.scheduled_time - Heure prévue
 * @param {Number} params.delay_minutes - Retard en minutes
 * @returns {Promise<Object>} Incident créé
 */
async function detectDelayIncident(params) {
    try {
        const { transport_type, booking_reference, departure, arrival, scheduled_time, delay_minutes } = params;
        
        console.log(`🚨 ÉTAPE 9: Détection retard ${delay_minutes}min pour ${booking_reference}...`);
        
        // ==========================================
        // ÉTAPE 1 : DÉTERMINER SÉVÉRITÉ
        // ==========================================
        let severity = 'faible';
        if (delay_minutes > 120) severity = 'critique';
        else if (delay_minutes > 60) severity = 'eleve';
        else if (delay_minutes > 30) severity = 'moyen';
        
        // ==========================================
        // ÉTAPE 2 : TROUVER UTILISATEURS AFFECTÉS
        // ==========================================
        const affectedReservations = await Reservations.findAll({
            where: {
                booking_reference: booking_reference
            }
        });
        
        if (affectedReservations.length === 0) {
            console.log('⚠️ Aucune réservation trouvée pour cette référence');
            return {
                success: false,
                reason: 'no_reservations_found',
                message: 'Aucun utilisateur affecté'
            };
        }
        
        const affectedUsers = [...new Set(affectedReservations.map(r => r.user_id))];
        console.log(`👥 ${affectedUsers.length} utilisateur(s) affecté(s)`);
        
        // ==========================================
        // ÉTAPE 3 : VÉRIFIER SI INCIDENT EXISTE DÉJÀ
        // ==========================================
        const existingIncident = await Incident.findOne({
            type: 'retard',
            'route.departure': departure,
            'route.arrival': arrival,
            status: { $in: ['actif', 'en_cours'] },
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Dernières 24h
        });
        
        if (existingIncident) {
            console.log(`ℹ️ Incident retard déjà créé: ${existingIncident._id}`);
            return {
                success: false,
                reason: 'incident_already_exists',
                incident_id: existingIncident._id.toString(),
                message: 'Incident déjà signalé'
            };
        }
        
        // ==========================================
        // ÉTAPE 4 : CRÉER INCIDENT
        // ==========================================
        const incident = await Incident.create({
            type: 'retard',
            severity: severity,
            reservationId: affectedReservations[0].reservation_id,
            transportType: normalizeTransportType(transport_type),
            route: {
                departure: departure,
                arrival: arrival,
                departureTime: scheduled_time
            },
            title: `Retard ${transport_type}: ${departure} → ${arrival}`,
            description: `Le ${transport_type} ${booking_reference} prévu à ${new Date(scheduled_time).toLocaleTimeString('fr-FR')} accuse un retard de ${delay_minutes} minutes.`,
            estimatedDelay: delay_minutes,
            affectedUsers: affectedUsers,
            status: 'actif',
            reportedBy: 0, // 0 = système automatique
            notificationsSent: false
        });
        
        console.log(`✅ Incident créé: ${incident._id}`);
        
        // ==========================================
        // ÉTAPE 5 : ENVOYER NOTIFICATIONS
        // ==========================================
        await sendIncidentNotifications(incident, affectedUsers);
        
        incident.notificationsSent = true;
        await incident.save();
        
        return {
            success: true,
            incident_id: incident._id.toString(),
            severity: severity,
            affected_users: affectedUsers.length,
            delay_minutes: delay_minutes,
            message: `Incident retard créé et ${affectedUsers.length} notification(s) envoyée(s)`
        };
        
    } catch (error) {
        console.error('❌ Erreur détection incident retard:', error);
        throw error;
    }
}

/**
 * Détecte incident annulation automatiquement
 * @param {Object} params - Paramètres
 * @returns {Promise<Object>} Incident créé
 */
async function detectCancellationIncident(params) {
    try {
        const { transport_type, booking_reference, departure, arrival, scheduled_time, reason } = params;
        
        console.log(`🚨 ÉTAPE 9: Détection annulation pour ${booking_reference}...`);
        
        // Annulation = toujours critique
        const severity = 'critique';
        
        // Trouver utilisateurs affectés
        const affectedReservations = await Reservations.findAll({
            where: { booking_reference: booking_reference }
        });
        
        if (affectedReservations.length === 0) {
            return {
                success: false,
                reason: 'no_reservations_found'
            };
        }
        
        const affectedUsers = [...new Set(affectedReservations.map(r => r.user_id))];
        
        // Créer incident
        const incident = await Incident.create({
            type: 'annulation',
            severity: severity,
            reservationId: affectedReservations[0].reservation_id,
            transportType: normalizeTransportType(transport_type),
            route: {
                departure: departure,
                arrival: arrival,
                departureTime: scheduled_time
            },
            title: `ANNULATION ${transport_type}: ${departure} → ${arrival}`,
            description: `Le ${transport_type} ${booking_reference} prévu à ${new Date(scheduled_time).toLocaleTimeString('fr-FR')} est ANNULÉ. Raison: ${reason || 'Non précisée'}`,
            estimatedDelay: null,
            affectedUsers: affectedUsers,
            status: 'actif',
            reportedBy: 0,
            notificationsSent: false,
            rerouteOptions: [] // TODO: Générer options de réacheminement
        });
        
        console.log(`✅ Incident annulation créé: ${incident._id}`);
        
        // Envoyer notifications urgentes
        await sendIncidentNotifications(incident, affectedUsers);
        
        incident.notificationsSent = true;
        await incident.save();
        
        return {
            success: true,
            incident_id: incident._id.toString(),
            severity: severity,
            affected_users: affectedUsers.length,
            message: `Incident annulation créé et notifications envoyées`
        };
        
    } catch (error) {
        console.error('❌ Erreur détection incident annulation:', error);
        throw error;
    }
}

/**
 * Détecte incident accessibilité automatiquement
 * @param {Object} params - Paramètres
 * @returns {Promise<Object>} Incident créé
 */
async function detectAccessibilityIncident(params) {
    try {
        const { reservation_id, issue_type, description, location } = params;
        
        console.log(`🚨 ÉTAPE 9: Détection incident accessibilité pour réservation ${reservation_id}...`);
        
        const reservation = await Reservations.findByPk(reservation_id);
        if (!reservation) {
            return {
                success: false,
                reason: 'reservation_not_found'
            };
        }
        
        // Sévérité selon type de problème
        let severity = 'moyen';
        if (issue_type === 'no_ramp' || issue_type === 'elevator_broken') severity = 'eleve';
        if (issue_type === 'no_assistance_available') severity = 'critique';
        
        const incident = await Incident.create({
            type: 'accessibilite',
            severity: severity,
            reservationId: reservation_id,
            transportType: reservation.Type_Transport || 'train',
            route: {
                departure: reservation.Lieu_depart,
                arrival: reservation.Lieu_arrivee,
                departureTime: reservation.Date_depart
            },
            title: `Problème accessibilité: ${location}`,
            description: description || `Problème d'accessibilité signalé (${issue_type})`,
            affectedUsers: [reservation.user_id],
            status: 'actif',
            reportedBy: reservation.user_id,
            notificationsSent: false
        });
        
        console.log(`✅ Incident accessibilité créé: ${incident._id}`);
        
        // Notification agent + utilisateur
        await sendIncidentNotifications(incident, [reservation.user_id]);
        
        incident.notificationsSent = true;
        await incident.save();
        
        return {
            success: true,
            incident_id: incident._id.toString(),
            severity: severity,
            message: 'Incident accessibilité créé'
        };
        
    } catch (error) {
        console.error('❌ Erreur détection incident accessibilité:', error);
        throw error;
    }
}

/**
 * Envoie notifications à tous les utilisateurs affectés
 * @param {Object} incident - Incident MongoDB
 * @param {Array} affectedUsers - Liste user IDs
 */
async function sendIncidentNotifications(incident, affectedUsers) {
    try {
        for (const userId of affectedUsers) {
            let notificationType = 'GENERAL';
            let icon = '⚠️';
            let priority = 'normal';
            
            if (incident.type === 'retard') {
                notificationType = 'DELAY';
                icon = '⏰';
                priority = incident.severity === 'critique' ? 'urgent' : 'high';
            } else if (incident.type === 'annulation') {
                notificationType = 'CANCELLATION';
                icon = '🚫';
                priority = 'urgent';
            } else if (incident.type === 'accessibilite') {
                notificationType = 'GENERAL';
                icon = '♿';
                priority = 'high';
            }
            
            await notificationService.createNotification({
                user_id: userId,
                type: notificationType,
                title: incident.title,
                message: incident.description,
                data: {
                    source: 'incident_detection_service',
                    incident_id: incident._id.toString(),
                    incident_type: incident.type,
                    severity: incident.severity,
                    transport_type: incident.transportType,
                    route: incident.route,
                    estimated_delay: incident.estimatedDelay
                },
                priority: priority,
                icon: icon,
                action_url: `/incidents/${incident._id}`,
                expires_in_days: 3
            });
            
            console.log(`📨 Notification envoyée à user ${userId}`);
        }
        
        console.log(`✅ ${affectedUsers.length} notification(s) incident envoyée(s)`);
        
    } catch (error) {
        console.error('❌ Erreur envoi notifications incident:', error);
        throw error;
    }
}

/**
 * Normalise type de transport vers enum valide
 */
function normalizeTransportType(type) {
    const map = {
        'bus': 'taxi',
        'train': 'train',
        'avion': 'avion',
        'flight': 'avion',
        'plane': 'avion'
    };
    return map[type.toLowerCase()] || 'train';
}

/**
 * Surveiller et détecter incidents pour un voyage
 * @param {String} voyage_id - ID voyage MongoDB
 * @returns {Promise<Object>} Résultat surveillance
 */
async function monitorVoyageForIncidents(voyage_id) {
    try {
        console.log(`🔍 ÉTAPE 9: Surveillance incidents pour voyage ${voyage_id}...`);
        
        const voyage = await Voyage.findById(voyage_id);
        if (!voyage) {
            return {
                success: false,
                reason: 'voyage_not_found'
            };
        }
        
        // Récupérer réservations associées
        const reservations = await Reservations.findAll({
            where: { voyage_id_mongo: voyage_id.toString() }
        });
        
        if (reservations.length === 0) {
            return {
                success: false,
                reason: 'no_reservations'
            };
        }
        
        // TODO: Implémenter monitoring temps réel via APIs opérateurs
        // Pour l'instant, retour monitoring activé
        
        return {
            success: true,
            voyage_id: voyage_id,
            reservations_monitored: reservations.length,
            message: 'Monitoring incidents activé'
        };
        
    } catch (error) {
        console.error('❌ Erreur monitoring voyage:', error);
        throw error;
    }
}

module.exports = {
    detectDelayIncident,
    detectCancellationIncident,
    detectAccessibilityIncident,
    monitorVoyageForIncidents,
    sendIncidentNotifications
};
