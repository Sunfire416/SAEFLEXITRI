/**
 * Service de réservation d'assistance préalable
 * 
 * Gère :
 * - Délais minimum par opérateur (SNCF 48h, bus 72h, avion 48h)
 * - Validation des deadlines de réservation
 * - Réservation automatique ou manuelle
 * - Confirmations et rappels
 * 
 * Point 5 - Réservation assistance préalable
 */

const notificationService = require('./notificationService');
const agentService = require('./agentService');

// Délais minimum de réservation par opérateur (heures)
const LEAD_TIMES = {
    // Trains
    'SNCF': {
        weekday: 48,
        weekend: 72,
        description: 'Accès Plus SNCF'
    },
    'TER': {
        weekday: 48,
        weekend: 72,
        description: 'Service PMR TER'
    },
    'TGV': {
        weekday: 48,
        weekend: 72,
        description: 'Accès Plus TGV'
    },

    // Bus
    'FlixBus': {
        weekday: 36,
        weekend: 48,
        description: 'Service assistance FlixBus'
    },
    'BlaBlaBus': {
        weekday: 36,
        weekend: 48,
        description: 'Assistance BlaBlaBus'
    },
    'Eurolines': {
        weekday: 72,
        weekend: 72,
        description: 'Service PMR Eurolines'
    },

    // Avions
    'Air France': {
        weekday: 48,
        weekend: 48,
        description: 'Saphir Air France'
    },
    'Transavia': {
        weekday: 48,
        weekend: 48,
        description: 'Assistance Transavia'
    },
    'EasyJet': {
        weekday: 48,
        weekend: 48,
        description: 'EasyJet Special Assistance'
    },

    // Défaut
    'default': {
        weekday: 48,
        weekend: 72,
        description: 'Service assistance standard'
    }
};

// Statuts de réservation assistance
const BOOKING_STATUS = {
    CONFIRMED: 'confirmed',
    PENDING: 'pending',
    TOO_LATE: 'too_late',
    WARNING: 'warning',
    MANUAL_REQUIRED: 'manual_required'
};

/**
 * Obtient le délai minimum par opérateur
 */
exports.getLeadTimeByOperator = (operator, transportType = 'train') => {
    // Normaliser le nom de l'opérateur
    const normalizedOperator = operator.toUpperCase().trim();

    if (LEAD_TIMES[normalizedOperator]) {
        return LEAD_TIMES[normalizedOperator];
    }

    // Fallback sur type de transport
    if (transportType === 'bus') {
        return { weekday: 72, weekend: 72, description: 'Service bus standard' };
    } else if (transportType === 'plane') {
        return { weekday: 48, weekend: 48, description: 'Assistance aérienne standard' };
    }

    return LEAD_TIMES['default'];
};

/**
 * Valide si le délai de réservation est respecté
 */
exports.validateBookingDeadline = (departureDate, operator, transportType = 'train') => {
    try {
        const departure = new Date(departureDate);
        const now = new Date();

        // Vérifier si la date est dans le passé
        if (departure <= now) {
            return {
                valid: false,
                status: BOOKING_STATUS.TOO_LATE,
                message: 'Date de départ déjà passée',
                hours_remaining: 0
            };
        }

        // Obtenir le délai requis
        const leadTime = exports.getLeadTimeByOperator(operator, transportType);
        const isWeekend = departure.getDay() === 0 || departure.getDay() === 6;
        const requiredHours = isWeekend ? leadTime.weekend : leadTime.weekday;

        // Calculer le temps restant
        const hoursRemaining = (departure - now) / 1000 / 60 / 60;

        if (hoursRemaining < requiredHours) {
            // Trop tard !
            return {
                valid: false,
                status: BOOKING_STATUS.TOO_LATE,
                message: `Délai minimum de ${requiredHours}h non respecté. Il reste ${Math.floor(hoursRemaining)}h.`,
                required_hours: requiredHours,
                hours_remaining: Math.floor(hoursRemaining),
                alternative_suggestion: 'Contacter directement l\'opérateur ou choisir un autre trajet'
            };

        } else if (hoursRemaining < requiredHours + 12) {
            // Proche de la limite (warning)
            return {
                valid: true,
                status: BOOKING_STATUS.WARNING,
                message: `⚠️  Attention : vous êtes proche de la limite (${Math.floor(hoursRemaining)}h restantes). Réservez rapidement !`,
                required_hours: requiredHours,
                hours_remaining: Math.floor(hoursRemaining)
            };

        } else {
            // OK
            return {
                valid: true,
                status: BOOKING_STATUS.CONFIRMED,
                message: `✅ Délai respecté (${Math.floor(hoursRemaining)}h restantes)`,
                required_hours: requiredHours,
                hours_remaining: Math.floor(hoursRemaining)
            };
        }

    } catch (error) {
        console.error('❌ Erreur validation deadline:', error);
        return {
            valid: false,
            status: BOOKING_STATUS.TOO_LATE,
            message: error.message
        };
    }
};

/**
 * Réserve l'assistance pour un segment
 */
exports.bookAssistanceWithOperator = async (segment, pmrNeeds, userId) => {
    try {
        console.log(`📋 Réservation assistance: ${segment.operator} - ${segment.mode}`);

        // Valider le délai
        const validation = exports.validateBookingDeadline(
            segment.departure_time,
            segment.operator,
            segment.mode
        );

        if (!validation.valid) {
            console.log('❌ Délai non respecté');
            return {
                success: false,
                error: validation.message,
                validation: validation
            };
        }

        // Générer une référence de réservation
        const bookingReference = generateBookingReference(segment);

        // Assigner un agent pour ce segment
        const agent = await agentService.assignAgentByLocation(
            segment.departure_station || segment.departure
        );

        // Créer notification de confirmation
        await notificationService.createNotification({
            user_id: userId,
            type: 'assistance_booking',
            title: '✅ Assistance réservée',
            message: `Votre assistance ${segment.operator} est confirmée. Référence: ${bookingReference}`,
            priority: 'medium',
            agent_info: agent ? {
                agent_id: agent.agent_id,
                agent_name: agent.name,
                agent_phone: agent.telephone
            } : null,
            metadata: {
                booking_reference: bookingReference,
                segment_id: segment.id,
                operator: segment.operator,
                departure_time: segment.departure_time,
                departure_station: segment.departure_station,
                pmr_needs: pmrNeeds
            }
        });

        // Créer rappel J-1
        await createReminderNotification(userId, segment, bookingReference);

        // TODO: Appeler API opérateur si disponible
        // Pour l'instant, enregistrement manuel

        console.log('✅ Assistance réservée:', bookingReference);

        return {
            success: true,
            status: validation.status,
            booking_reference: bookingReference,
            agent: agent,
            confirmation_sent: true,
            operator_api_called: false, // Pas encore implémenté
            manual_confirmation_required: true,
            deadline_validation: validation
        };

    } catch (error) {
        console.error('❌ Erreur réservation assistance:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Vérifie les deadlines pour tous les segments d'un voyage
 */
exports.checkAllDeadlines = (voyage) => {
    if (!voyage.segments || voyage.segments.length === 0) {
        return { valid: true, segments: [] };
    }

    const segmentValidations = voyage.segments.map(segment => {
        const validation = exports.validateBookingDeadline(
            segment.departure_time,
            segment.operator,
            segment.mode
        );

        return {
            segment_id: segment.id,
            operator: segment.operator,
            mode: segment.mode,
            departure: segment.departure_station || segment.departure,
            departure_time: segment.departure_time,
            validation: validation
        };
    });

    const hasErrors = segmentValidations.some(s => !s.validation.valid);
    const hasWarnings = segmentValidations.some(s => s.validation.status === BOOKING_STATUS.WARNING);

    return {
        valid: !hasErrors,
        has_warnings: hasWarnings,
        segments: segmentValidations,
        summary: {
            total: segmentValidations.length,
            confirmed: segmentValidations.filter(s => s.validation.status === BOOKING_STATUS.CONFIRMED).length,
            warning: segmentValidations.filter(s => s.validation.status === BOOKING_STATUS.WARNING).length,
            too_late: segmentValidations.filter(s => s.validation.status === BOOKING_STATUS.TOO_LATE).length
        }
    };
};

/**
 * Réserve l'assistance pour tous les segments d'un voyage
 */
exports.bookAssistanceForVoyage = async (voyage, pmrNeeds) => {
    try {
        console.log(`📋 Réservation assistance voyage ${voyage.voyage_id}`);

        // Vérifier tous les délais
        const deadlineCheck = exports.checkAllDeadlines(voyage);

        if (!deadlineCheck.valid) {
            return {
                success: false,
                error: 'Certains segments ne respectent pas les délais minimum',
                validation: deadlineCheck
            };
        }

        // Réserver pour chaque segment
        const bookingResults = [];

        for (const segment of voyage.segments) {
            // Ignorer taxis/marche
            if (segment.mode === 'taxi' || segment.mode === 'walk') {
                continue;
            }

            const result = await exports.bookAssistanceWithOperator(
                segment,
                pmrNeeds,
                voyage.user_id
            );

            bookingResults.push({
                segment_id: segment.id,
                result: result
            });
        }

        const allSuccess = bookingResults.every(r => r.result.success);

        return {
            success: allSuccess,
            bookings: bookingResults,
            deadline_check: deadlineCheck,
            message: allSuccess ? 
                     'Toutes les assistances ont été réservées' : 
                     'Certaines réservations ont échoué'
        };

    } catch (error) {
        console.error('❌ Erreur réservation voyage:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Obtient le statut de réservation d'assistance pour un segment
 */
exports.getAssistanceStatus = (segment) => {
    const validation = exports.validateBookingDeadline(
        segment.departure_time,
        segment.operator,
        segment.mode
    );

    const statusMap = {
        [BOOKING_STATUS.CONFIRMED]: {
            icon: '✅',
            label: 'Confirmée',
            color: 'green'
        },
        [BOOKING_STATUS.PENDING]: {
            icon: '⏳',
            label: 'En attente confirmation',
            color: 'orange'
        },
        [BOOKING_STATUS.WARNING]: {
            icon: '⚠️',
            label: 'Délai court',
            color: 'orange'
        },
        [BOOKING_STATUS.TOO_LATE]: {
            icon: '❌',
            label: 'Trop tard (assistance non garantie)',
            color: 'red'
        }
    };

    return {
        status: validation.status,
        ...statusMap[validation.status],
        validation: validation
    };
};

// ==========================================
// HELPERS PRIVÉS
// ==========================================

function generateBookingReference(segment) {
    const date = new Date();
    const operator = segment.operator.substring(0, 3).toUpperCase();
    const timestamp = date.getTime().toString().slice(-6);
    return `${operator}PMR${timestamp}`;
}

async function createReminderNotification(userId, segment, bookingReference) {
    try {
        // Calculer la date du rappel (J-1)
        const departureDate = new Date(segment.departure_time);
        const reminderDate = new Date(departureDate);
        reminderDate.setDate(reminderDate.getDate() - 1);
        reminderDate.setHours(18, 0, 0, 0); // 18h la veille

        // TODO: Implémenter système de notifications planifiées
        console.log(`📅 Rappel planifié pour ${reminderDate.toISOString()}`);

        // Pour l'instant, créer notification immédiate avec métadonnées
        await notificationService.createNotification({
            user_id: userId,
            type: 'reminder',
            title: '📅 Rappel : Assistance PMR demain',
            message: `N'oubliez pas : votre assistance ${segment.operator} est prévue demain à ${formatTime(segment.departure_time)}. Référence: ${bookingReference}`,
            priority: 'medium',
            metadata: {
                booking_reference: bookingReference,
                segment_id: segment.id,
                scheduled_for: reminderDate,
                departure_time: segment.departure_time
            }
        });

    } catch (error) {
        console.error('❌ Erreur création rappel:', error);
    }
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

module.exports = exports;
