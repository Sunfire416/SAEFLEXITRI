/**
 * Service de coordination d'assistance aux correspondances
 * 
 * Gère :
 * - Planification assistance entre 2 modes de transport
 * - Assignation d'agents à chaque point de transfert
 * - Notifications synchronisées pour agents et passagers
 * - Gestion des retards impactant les correspondances
 * 
 * Point 3 - Assistance coordonnée correspondances
 */

const agentService = require('./agentService');
const notificationService = require('./notificationService');

// Temps minimum de correspondance par type (minutes)
const MIN_TRANSFER_TIMES = {
    'plane_to_plane': 90,
    'plane_to_train': 60,
    'plane_to_bus': 45,
    'train_to_plane': 60,
    'train_to_train': 20,
    'train_to_bus': 15,
    'bus_to_plane': 60,
    'bus_to_train': 15,
    'bus_to_bus': 10
};

// Temps supplémentaire PMR selon type de mobilité
const PMR_EXTRA_TRANSFER_TIME = {
    'wheelchair_electric': 20,
    'wheelchair_manual': 15,
    'walker': 10,
    'cane': 5,
    'none': 0
};

/**
 * Planifie l'assistance pour un transfert entre 2 segments
 */
exports.planTransferAssistance = async (segment1, segment2, location, passengerProfile = {}) => {
    try {
        console.log(`🔄 Planification assistance transfert: ${segment1.mode} → ${segment2.mode} à ${location}`);

        // Calculer le temps de transfert nécessaire
        const transferTime = calculateTransferTime(segment1, segment2, passengerProfile);

        // Vérifier si le temps est suffisant
        const actualTransferTime = calculateActualTransferTime(segment1, segment2);
        if (actualTransferTime < transferTime.required_minutes) {
            return {
                success: false,
                error: 'Temps de correspondance insuffisant',
                required_minutes: transferTime.required_minutes,
                actual_minutes: actualTransferTime,
                suggestion: 'Augmenter le temps entre correspondances ou choisir un autre itinéraire'
            };
        }

        // Assigner 2 agents : départ du mode 1 + arrivée du mode 2
        const agent1 = await agentService.assignAgentByLocation(segment1.arrival_station || location);
        const agent2 = await agentService.assignAgentByLocation(segment2.departure_station || location);

        // Créer les notifications synchronisées
        await createTransferNotifications(segment1, segment2, agent1, agent2, location, passengerProfile);

        return {
            success: true,
            transfer_location: location,
            transfer_time: transferTime,
            actual_time_available: actualTransferTime,
            time_margin: actualTransferTime - transferTime.required_minutes,
            agents: {
                departure_agent: agent1,
                arrival_agent: agent2
            },
            assistance_plan: {
                step1: `Agent ${agent1?.name || 'PMR'} accompagne jusqu'à ${location}`,
                step2: `Transfert et passage ${segment1.mode} → ${segment2.mode}`,
                step3: `Agent ${agent2?.name || 'PMR'} accueille et accompagne vers ${segment2.mode}`
            }
        };

    } catch (error) {
        console.error('❌ Erreur planification assistance:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Notifie les agents d'un transfert planifié
 */
exports.notifyAgentsTransfer = async (transferPoint, arrivalTime, passenger) => {
    try {
        const { agent1, agent2, location } = transferPoint;

        // Notification agent 1 (départ mode 1)
        if (agent1) {
            await notificationService.createNotification({
                user_id: agent1.agent_id,
                type: 'transfer_preparation',
                title: '🔄 Transfert PMR à préparer',
                message: `Préparer transfert passager ${passenger.name} à ${location} vers ${arrivalTime}`,
                priority: 'high',
                agent_info: {
                    agent_id: agent1.agent_id,
                    agent_name: agent1.name,
                    agent_role: agent1.specialite
                },
                metadata: {
                    location: location,
                    arrival_time: arrivalTime,
                    passenger_id: passenger.user_id,
                    passenger_name: passenger.name,
                    pmr_needs: passenger.pmr_profile
                }
            });
        }

        // Notification agent 2 (arrivée mode 2)
        if (agent2) {
            await notificationService.createNotification({
                user_id: agent2.agent_id,
                type: 'transfer_arrival',
                title: '👋 Passager PMR en arrivée',
                message: `Passager ${passenger.name} en arrivée à ${location} à ${arrivalTime}. Prêt à accueillir.`,
                priority: 'high',
                agent_info: {
                    agent_id: agent2.agent_id,
                    agent_name: agent2.name,
                    agent_role: agent2.specialite
                },
                metadata: {
                    location: location,
                    arrival_time: arrivalTime,
                    passenger_id: passenger.user_id,
                    passenger_name: passenger.name,
                    pmr_needs: passenger.pmr_profile
                }
            });
        }

        // Notification passager
        await notificationService.createNotification({
            user_id: passenger.user_id,
            type: 'transfer_info',
            title: '🔄 Assistance à votre correspondance',
            message: `Agent ${agent1?.name || 'PMR'} vous accompagnera jusqu'à ${location}. Agent ${agent2?.name || 'PMR'} vous accueillera pour la suite.`,
            priority: 'medium',
            metadata: {
                location: location,
                transfer_time: arrivalTime,
                agent1_name: agent1?.name,
                agent1_phone: agent1?.telephone,
                agent2_name: agent2?.name,
                agent2_phone: agent2?.telephone
            }
        });

        console.log('✅ Notifications transfert envoyées');
        return { success: true };

    } catch (error) {
        console.error('❌ Erreur notification agents:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Gère un retard impactant un transfert
 */
exports.handleTransferDelay = async (segmentId, newTime, voyage) => {
    try {
        console.log(`⏰ Gestion retard segment ${segmentId} → Nouveau horaire: ${newTime}`);

        // Trouver le segment en retard
        const delayedSegmentIndex = voyage.segments.findIndex(s => s.id === segmentId);
        if (delayedSegmentIndex === -1) {
            return { success: false, error: 'Segment non trouvé' };
        }

        const delayedSegment = voyage.segments[delayedSegmentIndex];
        const nextSegment = voyage.segments[delayedSegmentIndex + 1];

        if (!nextSegment) {
            // Dernier segment, pas de correspondance
            return { success: true, impact: 'none' };
        }

        // Calculer le nouveau temps de correspondance
        const oldTransferTime = calculateActualTransferTime(delayedSegment, nextSegment);
        const newArrivalTime = new Date(newTime);
        const nextDepartureTime = new Date(nextSegment.departure_time);
        const newTransferTime = Math.floor((nextDepartureTime - newArrivalTime) / 1000 / 60);

        console.log(`⏱️  Temps correspondance: ${oldTransferTime}min → ${newTransferTime}min`);

        // Vérifier si correspondance encore faisable
        const minRequired = getMinTransferTime(
            delayedSegment.mode, 
            nextSegment.mode, 
            voyage.passenger_profile
        );

        if (newTransferTime < minRequired) {
            // Correspondance perdue !
            console.log('❌ Correspondance PERDUE');

            // Proposer alternatives
            const alternatives = await findAlternativeConnections(nextSegment, newArrivalTime);

            // Notifier passager + agents
            await notifyConnectionMissed(voyage, delayedSegment, nextSegment, alternatives);

            return {
                success: true,
                impact: 'connection_lost',
                new_transfer_time: newTransferTime,
                min_required: minRequired,
                alternatives: alternatives
            };

        } else if (newTransferTime < minRequired + 10) {
            // Correspondance à risque
            console.log('⚠️  Correspondance À RISQUE');

            // Réassigner agents avec priorité haute
            await reassignAgentsUrgent(delayedSegment, nextSegment, voyage);

            // Notifier risque
            await notifyConnectionRisk(voyage, delayedSegment, nextSegment, newTransferTime);

            return {
                success: true,
                impact: 'connection_at_risk',
                new_transfer_time: newTransferTime,
                min_required: minRequired,
                margin: newTransferTime - minRequired
            };

        } else {
            // Correspondance OK, juste mettre à jour agents
            console.log('✅ Correspondance OK (retard absorbé)');

            await notifyDelayAbsorbed(voyage, delayedSegment, newTransferTime);

            return {
                success: true,
                impact: 'delay_absorbed',
                new_transfer_time: newTransferTime,
                margin: newTransferTime - minRequired
            };
        }

    } catch (error) {
        console.error('❌ Erreur gestion retard:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Identifie tous les points de transfert d'un voyage
 */
exports.identifyTransferPoints = (voyage) => {
    if (!voyage.segments || voyage.segments.length <= 1) {
        return [];
    }

    const transferPoints = [];

    for (let i = 0; i < voyage.segments.length - 1; i++) {
        const current = voyage.segments[i];
        const next = voyage.segments[i + 1];

        transferPoints.push({
            index: i,
            location: current.arrival_station || current.arrival,
            from_mode: current.mode,
            to_mode: next.mode,
            from_segment: current,
            to_segment: next,
            transfer_time: calculateActualTransferTime(current, next),
            requires_assistance: true, // Toujours pour PMR
            critical: current.mode === 'plane' || next.mode === 'plane'
        });
    }

    return transferPoints;
};

// ==========================================
// HELPERS
// ==========================================

function calculateTransferTime(segment1, segment2, passengerProfile) {
    const transferKey = `${segment1.mode}_to_${segment2.mode}`;
    const baseTime = MIN_TRANSFER_TIMES[transferKey] || 15;

    // Temps supplémentaire selon profil PMR
    const mobilityAid = passengerProfile.pmr_profile?.mobility_aid || 'none';
    const wheelchairType = passengerProfile.pmr_profile?.wheelchair_type;
    
    let pmrExtra = 0;
    if (mobilityAid === 'wheelchair' && wheelchairType) {
        pmrExtra = PMR_EXTRA_TRANSFER_TIME[`wheelchair_${wheelchairType}`] || 15;
    } else {
        pmrExtra = PMR_EXTRA_TRANSFER_TIME[mobilityAid] || 0;
    }

    return {
        base_minutes: baseTime,
        pmr_extra_minutes: pmrExtra,
        required_minutes: baseTime + pmrExtra
    };
}

function calculateActualTransferTime(segment1, segment2) {
    const arrival = new Date(segment1.arrival_time);
    const departure = new Date(segment2.departure_time);
    return Math.floor((departure - arrival) / 1000 / 60);
}

function getMinTransferTime(mode1, mode2, passengerProfile = {}) {
    const transferKey = `${mode1}_to_${mode2}`;
    const baseTime = MIN_TRANSFER_TIMES[transferKey] || 15;
    
    const mobilityAid = passengerProfile.pmr_profile?.mobility_aid || 'none';
    const wheelchairType = passengerProfile.pmr_profile?.wheelchair_type;
    
    let pmrExtra = 0;
    if (mobilityAid === 'wheelchair' && wheelchairType) {
        pmrExtra = PMR_EXTRA_TRANSFER_TIME[`wheelchair_${wheelchairType}`] || 15;
    } else {
        pmrExtra = PMR_EXTRA_TRANSFER_TIME[mobilityAid] || 0;
    }

    return baseTime + pmrExtra;
}

async function createTransferNotifications(segment1, segment2, agent1, agent2, location, passenger) {
    // Implémenté via notifyAgentsTransfer
    const arrivalTime = segment1.arrival_time;
    await exports.notifyAgentsTransfer(
        { agent1, agent2, location },
        arrivalTime,
        passenger
    );
}

async function reassignAgentsUrgent(segment1, segment2, voyage) {
    // Réassigner avec priorité haute
    const location = segment1.arrival_station || segment1.arrival;
    const result = await exports.planTransferAssistance(
        segment1, 
        segment2, 
        location, 
        voyage.passenger_profile
    );
    
    console.log('🔄 Agents réassignés (urgence):', result);
    return result;
}

async function notifyConnectionRisk(voyage, segment1, segment2, newTransferTime) {
    await notificationService.createNotification({
        user_id: voyage.user_id,
        type: 'connection_risk',
        title: '⚠️  Risque de correspondance manquée',
        message: `Votre correspondance à ${segment1.arrival_station} est à risque à cause d'un retard. Temps disponible: ${newTransferTime} minutes. Nos agents sont prévenus pour vous assister.`,
        priority: 'high',
        metadata: {
            segment1_id: segment1.id,
            segment2_id: segment2.id,
            new_transfer_time: newTransferTime,
            location: segment1.arrival_station
        }
    });
}

async function notifyConnectionMissed(voyage, segment1, segment2, alternatives) {
    await notificationService.createNotification({
        user_id: voyage.user_id,
        type: 'connection_missed',
        title: '❌ Correspondance manquée',
        message: `Votre correspondance à ${segment1.arrival_station} ne peut plus être assurée. Nous vous proposons des alternatives.`,
        priority: 'urgent',
        metadata: {
            segment1_id: segment1.id,
            segment2_id: segment2.id,
            alternatives: alternatives
        }
    });
}

async function notifyDelayAbsorbed(voyage, segment, newTransferTime) {
    await notificationService.createNotification({
        user_id: voyage.user_id,
        type: 'delay',
        title: 'ℹ️ Retard sur votre trajet',
        message: `Un retard a été détecté mais votre correspondance reste assurée (${newTransferTime} minutes disponibles).`,
        priority: 'low',
        metadata: {
            segment_id: segment.id,
            transfer_time: newTransferTime
        }
    });
}

async function findAlternativeConnections(missedSegment, fromTime) {
    // TODO: Intégrer recherche alternatives via searchService
    console.log('🔍 Recherche alternatives pour segment manqué...');
    return [
        {
            mode: missedSegment.mode,
            departure: missedSegment.departure,
            arrival: missedSegment.arrival,
            new_departure_time: new Date(fromTime.getTime() + 60 * 60 * 1000), // +1h
            available: true
        }
    ];
}

module.exports = exports;
