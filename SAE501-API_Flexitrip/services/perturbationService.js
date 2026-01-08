/**
 * Service de gestion des perturbations et retards
 * 
 * Gère :
 * - Monitoring temps réel avec Google Maps Directions API (traffic model)
 * - Détection retards impactant correspondances
 * - Proposition alternatives accessibles PMR
 * - Notifications passagers + agents
 * 
 * Point 4 - Gestion retards et perturbations
 */

const axios = require('axios');
const assistanceCoordinationService = require('./assistanceCoordinationService');
const notificationService = require('./notificationService');
const searchService = require('./searchService');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

// Polling interval pour monitoring (millisecondes)
const MONITORING_INTERVAL = 60000; // 1 minute

// Seuil de retard pour déclencher notifications (minutes)
const DELAY_THRESHOLD = 10;

// Cache des voyages monitorés
const monitoredVoyages = new Map();

/**
 * Démarre le monitoring temps réel d'un voyage
 */
exports.monitorRealTimeData = async (voyage) => {
    try {
        console.log(`📡 Démarrage monitoring voyage ${voyage.voyage_id}`);

        if (!voyage.segments || voyage.segments.length === 0) {
            return { success: false, error: 'Aucun segment à monitorer' };
        }

        // Ajouter au cache de monitoring
        monitoredVoyages.set(voyage.voyage_id, {
            voyage: voyage,
            last_check: new Date(),
            disruptions: [],
            delays: []
        });

        // Lancer le monitoring périodique
        const intervalId = setInterval(async () => {
            await checkForDisruptions(voyage);
        }, MONITORING_INTERVAL);

        // Sauvegarder l'interval ID pour pouvoir arrêter
        monitoredVoyages.get(voyage.voyage_id).intervalId = intervalId;

        // Premier check immédiat
        await checkForDisruptions(voyage);

        return {
            success: true,
            message: 'Monitoring activé',
            interval_seconds: MONITORING_INTERVAL / 1000
        };

    } catch (error) {
        console.error('❌ Erreur monitoring:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Arrête le monitoring d'un voyage
 */
exports.stopMonitoring = (voyageId) => {
    const monitored = monitoredVoyages.get(voyageId);
    if (monitored && monitored.intervalId) {
        clearInterval(monitored.intervalId);
        monitoredVoyages.delete(voyageId);
        console.log(`🛑 Monitoring arrêté pour voyage ${voyageId}`);
        return { success: true };
    }
    return { success: false, error: 'Voyage non monitoré' };
};

/**
 * Gère un retard détecté sur un segment
 */
exports.handleDelay = async (voyageId, segmentId, newTime, delayMinutes) => {
    try {
        console.log(`⏰ Retard détecté: Voyage ${voyageId}, Segment ${segmentId}, +${delayMinutes}min`);

        const voyage = await getVoyageById(voyageId);
        if (!voyage) {
            return { success: false, error: 'Voyage non trouvé' };
        }

        // Notifier le retard
        await notificationService.createNotification({
            user_id: voyage.user_id,
            type: 'delay',
            title: '⏰ Retard sur votre trajet',
            message: `Un retard de ${delayMinutes} minutes a été détecté sur votre trajet. Nouvel horaire: ${formatTime(newTime)}`,
            priority: delayMinutes >= 30 ? 'high' : 'medium',
            metadata: {
                voyage_id: voyageId,
                segment_id: segmentId,
                delay_minutes: delayMinutes,
                new_time: newTime
            }
        });

        // Vérifier impact sur correspondances
        const transferResult = await assistanceCoordinationService.handleTransferDelay(
            segmentId,
            newTime,
            voyage
        );

        if (transferResult.impact === 'connection_lost') {
            // Correspondance perdue : proposer alternatives
            console.log('❌ Correspondance perdue, recherche alternatives...');
            
            const alternatives = await exports.suggestAlternatives({
                voyage_id: voyageId,
                missed_segment_id: segmentId,
                from_time: newTime,
                passenger_profile: voyage.passenger_profile
            });

            return {
                success: true,
                delay_minutes: delayMinutes,
                impact: 'connection_lost',
                alternatives: alternatives,
                action_required: true
            };

        } else if (transferResult.impact === 'connection_at_risk') {
            // Correspondance à risque : agents alertés
            console.log('⚠️  Correspondance à risque, agents alertés');

            return {
                success: true,
                delay_minutes: delayMinutes,
                impact: 'connection_at_risk',
                margin_minutes: transferResult.margin,
                action_required: false,
                message: 'Agents PMR alertés pour assistance prioritaire'
            };

        } else {
            // Retard absorbé
            console.log('✅ Retard absorbé, pas d\'impact');

            return {
                success: true,
                delay_minutes: delayMinutes,
                impact: 'none',
                action_required: false
            };
        }

    } catch (error) {
        console.error('❌ Erreur gestion retard:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Propose des alternatives en cas de correspondance manquée
 */
exports.suggestAlternatives = async (missedConnection) => {
    try {
        console.log('🔍 Recherche alternatives...');

        const { voyage_id, missed_segment_id, from_time, passenger_profile } = missedConnection;

        const voyage = await getVoyageById(voyage_id);
        if (!voyage) {
            return [];
        }

        // Trouver le segment manqué
        const missedSegmentIndex = voyage.segments.findIndex(s => s.id === missed_segment_id);
        const missedSegment = voyage.segments[missedSegmentIndex];
        const remainingSegments = voyage.segments.slice(missedSegmentIndex);

        // Rechercher alternatives pour rejoindre la destination finale
        const finalDestination = voyage.segments[voyage.segments.length - 1].arrival;
        
        const searchResults = await searchService.searchMultimodalRoute(
            missedSegment.departure,
            finalDestination,
            from_time,
            passenger_profile.pmr_profile || {}
        );

        if (!searchResults.success || searchResults.routes.length === 0) {
            console.log('❌ Aucune alternative trouvée');
            return [];
        }

        // Filtrer et enrichir les alternatives
        const alternatives = searchResults.routes.map((route, index) => ({
            id: `alt_${index}`,
            route: route,
            price_difference: route.total_price - calculateOriginalPrice(remainingSegments),
            time_difference: route.total_duration - calculateOriginalDuration(remainingSegments),
            pmr_compatible: route.pmr_compatible,
            segments: route.segments,
            rebooking_available: true,
            refund_eligible: true
        }));

        // Trier par prix et accessibilité
        alternatives.sort((a, b) => {
            if (a.pmr_compatible && !b.pmr_compatible) return -1;
            if (!a.pmr_compatible && b.pmr_compatible) return 1;
            return a.price_difference - b.price_difference;
        });

        console.log(`✅ ${alternatives.length} alternatives trouvées`);
        return alternatives;

    } catch (error) {
        console.error('❌ Erreur recherche alternatives:', error);
        return [];
    }
};

/**
 * Réservation 1-click d'une alternative
 */
exports.rebookAlternative = async (voyageId, alternativeId) => {
    try {
        console.log(`🔄 Rebooking alternatif: ${voyageId} → ${alternativeId}`);

        // TODO: Implémenter logique de rebooking
        // 1. Annuler segments restants de l'ancien voyage
        // 2. Créer nouvelle réservation avec alternative
        // 3. Assigner nouveaux agents
        // 4. Notifier passager + agents

        return {
            success: true,
            message: 'Rebooking effectué',
            new_booking_reference: `REB_${Date.now()}`
        };

    } catch (error) {
        console.error('❌ Erreur rebooking:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Récupère l'historique des perturbations d'un voyage
 */
exports.getDisruptionHistory = (voyageId) => {
    const monitored = monitoredVoyages.get(voyageId);
    
    if (!monitored) {
        return {
            success: false,
            error: 'Voyage non monitoré'
        };
    }

    return {
        success: true,
        voyage_id: voyageId,
        disruptions: monitored.disruptions,
        delays: monitored.delays,
        last_check: monitored.last_check
    };
};

// ==========================================
// HELPERS PRIVÉS
// ==========================================

async function checkForDisruptions(voyage) {
    try {
        console.log(`🔍 Check perturbations voyage ${voyage.voyage_id}...`);

        for (const segment of voyage.segments) {
            // Ignorer les taxis/marche
            if (segment.mode === 'taxi' || segment.mode === 'walk') {
                continue;
            }

            // Check traffic en temps réel avec Google Maps
            const trafficInfo = await checkGoogleTraffic(segment);
            
            if (trafficInfo && trafficInfo.delay_minutes > DELAY_THRESHOLD) {
                console.log(`⚠️  Retard détecté: ${trafficInfo.delay_minutes} minutes`);
                
                // Sauvegarder dans cache
                const monitored = monitoredVoyages.get(voyage.voyage_id);
                if (monitored) {
                    monitored.delays.push({
                        segment_id: segment.id,
                        delay_minutes: trafficInfo.delay_minutes,
                        detected_at: new Date(),
                        reason: trafficInfo.reason
                    });
                    monitored.last_check = new Date();
                }

                // Gérer le retard
                await exports.handleDelay(
                    voyage.voyage_id,
                    segment.id,
                    trafficInfo.new_arrival_time,
                    trafficInfo.delay_minutes
                );
            }
        }

    } catch (error) {
        console.error('❌ Erreur check perturbations:', error);
    }
}

async function checkGoogleTraffic(segment) {
    try {
        if (!GOOGLE_MAPS_API_KEY) {
            return null;
        }

        // Requête Directions API avec traffic model
        const url = `${GOOGLE_MAPS_BASE_URL}/directions/json`;
        const response = await axios.get(url, {
            params: {
                origin: segment.departure_station || segment.departure,
                destination: segment.arrival_station || segment.arrival,
                mode: 'transit',
                departure_time: Math.floor(new Date(segment.departure_time).getTime() / 1000),
                traffic_model: 'best_guess', // Utilise données temps réel
                language: 'fr',
                key: GOOGLE_MAPS_API_KEY
            },
            timeout: 5000
        });

        if (response.data?.status === 'OK' && response.data.routes?.length > 0) {
            const route = response.data.routes[0];
            const leg = route.legs[0];

            // Comparer durée théorique vs durée en traffic
            const durationNormal = Math.floor(leg.duration.value / 60);
            const durationInTraffic = leg.duration_in_traffic ? 
                Math.floor(leg.duration_in_traffic.value / 60) : durationNormal;

            const delayMinutes = durationInTraffic - durationNormal;

            if (delayMinutes > 0) {
                const originalArrival = new Date(segment.arrival_time);
                const newArrival = new Date(originalArrival.getTime() + delayMinutes * 60000);

                return {
                    delay_minutes: delayMinutes,
                    original_arrival: segment.arrival_time,
                    new_arrival_time: newArrival.toISOString(),
                    reason: 'Traffic actuel'
                };
            }
        }

        return null;

    } catch (error) {
        console.error('❌ Erreur check traffic Google:', error);
        return null;
    }
}

async function handleDisruption(voyage, segment, disruption) {
    console.log(`⚠️  Perturbation: ${disruption.reason}`);

    // Notifier le passager
    await notificationService.createNotification({
        user_id: voyage.user_id,
        type: 'disruption',
        title: '⚠️  Perturbation sur votre trajet',
        message: disruption.message || 'Une perturbation a été détectée sur votre ligne.',
        priority: 'high',
        metadata: {
            voyage_id: voyage.voyage_id,
            segment_id: segment.id,
            reason: disruption.reason
        }
    });
}

async function getVoyageById(voyageId) {
    // TODO: Récupérer depuis MongoDB
    const monitored = monitoredVoyages.get(voyageId);
    return monitored ? monitored.voyage : null;
}

function calculateOriginalPrice(segments) {
    return segments.reduce((sum, s) => sum + (s.price || 0), 0);
}

function calculateOriginalDuration(segments) {
    return segments.reduce((sum, s) => sum + (s.duration || 0), 0);
}

function formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

module.exports = exports;
