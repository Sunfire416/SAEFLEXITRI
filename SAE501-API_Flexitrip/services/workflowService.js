/**
 * Service de gestion des workflows PMR par type de transport
 * 
 * Workflows différenciés :
 * - AVION : Enrollment → Check-in → Boarding → Assistance embarquement
 * - TRAIN : Enrollment optionnel → Assistance montée → Correspondance → Assistance descente
 * - BUS : Réservation assistance (J-3 min) → Assistance montée → Correspondance
 * 
 * Point 2 - Workflow multimodal cohérent
 */

// Définition des workflows par transport
const TRANSPORT_WORKFLOWS = {
    plane: {
        name: 'Avion',
        steps: [
            {
                id: 'enrollment',
                name: 'Enrollment biométrique',
                required: true,
                deadline_days: 7,
                description: 'Enregistrement des données biométriques',
                agent_assignment: 'airport',
                notification_type: 'enrollment'
            },
            {
                id: 'checkin',
                name: 'Check-in en ligne',
                required: true,
                deadline_days: 1,
                description: 'Check-in en ligne et carte d\'embarquement',
                agent_assignment: 'gate',
                notification_type: 'checkin'
            },
            {
                id: 'boarding',
                name: 'Embarquement',
                required: true,
                deadline_minutes: 30,
                description: 'Scan QR et validation embarquement',
                agent_assignment: 'gate',
                notification_type: 'boarding'
            },
            {
                id: 'assistance_boarding',
                name: 'Assistance embarquement',
                required: true,
                deadline_minutes: 20,
                description: 'Accompagnement jusqu\'à la passerelle',
                agent_assignment: 'cabin',
                notification_type: 'assistance'
            }
        ]
    },
    train: {
        name: 'Train',
        steps: [
            {
                id: 'assistance_booking',
                name: 'Réservation assistance',
                required: true,
                deadline_hours: 48,
                description: 'Réservation assistance SNCF (48h min)',
                agent_assignment: 'station_departure',
                notification_type: 'assistance_booking'
            },
            {
                id: 'enrollment',
                name: 'Enrollment biométrique',
                required: false,
                deadline_days: 3,
                description: 'Enregistrement biométrique optionnel',
                agent_assignment: 'station_departure',
                notification_type: 'enrollment'
            },
            {
                id: 'assistance_montee',
                name: 'Assistance montée',
                required: true,
                deadline_minutes: 15,
                description: 'Aide à l\'embarquement en gare',
                agent_assignment: 'platform',
                notification_type: 'assistance'
            },
            {
                id: 'transfer',
                name: 'Correspondance',
                required: false,
                deadline_minutes: 20,
                description: 'Assistance lors des correspondances',
                agent_assignment: 'station_transfer',
                notification_type: 'transfer'
            },
            {
                id: 'assistance_descente',
                name: 'Assistance descente',
                required: true,
                deadline_minutes: 5,
                description: 'Aide à la descente en gare d\'arrivée',
                agent_assignment: 'station_arrival',
                notification_type: 'assistance'
            }
        ]
    },
    bus: {
        name: 'Bus',
        steps: [
            {
                id: 'assistance_booking',
                name: 'Réservation assistance',
                required: true,
                deadline_hours: 72,
                description: 'Réservation assistance compagnie bus (72h min)',
                agent_assignment: 'bus_stop',
                notification_type: 'assistance_booking'
            },
            {
                id: 'assistance_montee',
                name: 'Assistance montée',
                required: true,
                deadline_minutes: 10,
                description: 'Aide embarquement (chauffeur + agent)',
                agent_assignment: 'bus_stop',
                notification_type: 'assistance'
            },
            {
                id: 'transfer',
                name: 'Correspondance',
                required: false,
                deadline_minutes: 15,
                description: 'Assistance correspondance si planifiée',
                agent_assignment: 'bus_stop_transfer',
                notification_type: 'transfer'
            },
            {
                id: 'assistance_descente',
                name: 'Assistance descente',
                required: true,
                deadline_minutes: 5,
                description: 'Aide à la descente',
                agent_assignment: 'bus_stop_arrival',
                notification_type: 'assistance'
            }
        ]
    },
    taxi: {
        name: 'Taxi/VTC',
        steps: [
            {
                id: 'booking',
                name: 'Réservation véhicule adapté',
                required: true,
                deadline_hours: 24,
                description: 'Réservation véhicule PMR si nécessaire',
                agent_assignment: null,
                notification_type: 'booking'
            },
            {
                id: 'pickup',
                name: 'Prise en charge',
                required: true,
                deadline_minutes: 10,
                description: 'Prise en charge avec assistance',
                agent_assignment: null,
                notification_type: 'pickup'
            }
        ]
    }
};

/**
 * Définit les étapes du workflow pour un voyage
 */
exports.defineWorkflowSteps = (voyage) => {
    if (!voyage || !voyage.segments) {
        return [];
    }

    const allSteps = [];

    voyage.segments.forEach((segment, segmentIndex) => {
        const transportType = normalizeTransportType(segment.mode);
        const workflow = TRANSPORT_WORKFLOWS[transportType];

        if (!workflow) {
            console.warn(`⚠️  Workflow non défini pour: ${segment.mode}`);
            return;
        }

        const segmentSteps = workflow.steps.map((step, stepIndex) => ({
            ...step,
            segment_index: segmentIndex,
            segment_id: segment.id || `segment_${segmentIndex}`,
            transport_type: transportType,
            transport_name: workflow.name,
            step_order: stepIndex + 1,
            status: 'pending',
            completed_at: null,
            assigned_agent: null,
            location: step.agent_assignment ? 
                      getLocationForAssignment(segment, step.agent_assignment) : 
                      segment.departure
        }));

        allSteps.push(...segmentSteps);
    });

    return allSteps;
};

/**
 * Obtient la prochaine action requise pour un voyage
 */
exports.getNextRequiredAction = (voyage, currentStep, transportMode) => {
    const workflow = TRANSPORT_WORKFLOWS[normalizeTransportType(transportMode)];
    
    if (!workflow) {
        return null;
    }

    // Trouver l'étape actuelle
    const currentIndex = workflow.steps.findIndex(s => s.id === currentStep);
    
    // Prochaine étape requise
    for (let i = currentIndex + 1; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        if (step.required) {
            return {
                ...step,
                transport_type: normalizeTransportType(transportMode),
                transport_name: workflow.name,
                deadline: calculateDeadline(step, voyage.departure_time)
            };
        }
    }

    return null;
};

/**
 * Valide si une étape est complétée correctement
 */
exports.validateStepCompletion = (step, transportMode, data = {}) => {
    const workflow = TRANSPORT_WORKFLOWS[normalizeTransportType(transportMode)];
    
    if (!workflow) {
        return { valid: false, error: 'Workflow non trouvé' };
    }

    const stepDef = workflow.steps.find(s => s.id === step.id);
    
    if (!stepDef) {
        return { valid: false, error: 'Étape non trouvée dans workflow' };
    }

    // Validations selon le type d'étape
    switch (stepDef.id) {
        case 'enrollment':
            if (!data.biometric_data || !data.user_id) {
                return { valid: false, error: 'Données biométriques manquantes' };
            }
            break;

        case 'checkin':
            if (!data.boarding_pass || !data.seat_number) {
                return { valid: false, error: 'Carte d\'embarquement manquante' };
            }
            break;

        case 'boarding':
            if (!data.qr_code_validated) {
                return { valid: false, error: 'QR code non validé' };
            }
            break;

        case 'assistance_booking':
            if (!data.booking_reference) {
                return { valid: false, error: 'Référence de réservation manquante' };
            }
            break;

        default:
            // Validation générique
            if (!data.completed_by) {
                return { valid: false, error: 'Agent non identifié' };
            }
    }

    return { 
        valid: true, 
        message: `Étape ${stepDef.name} validée`,
        next_step: getNextRequiredStep(workflow, stepDef.id)
    };
};

/**
 * Obtient les étapes requises pour un type de transport
 */
exports.getRequiredStepsForTransport = (transportMode) => {
    const workflow = TRANSPORT_WORKFLOWS[normalizeTransportType(transportMode)];
    
    if (!workflow) {
        return [];
    }

    return workflow.steps.filter(step => step.required);
};

/**
 * Calcule les deadlines pour toutes les étapes
 */
exports.calculateStepDeadlines = (voyage) => {
    const steps = exports.defineWorkflowSteps(voyage);
    
    return steps.map(step => {
        const departureTime = new Date(voyage.departure_time || new Date());
        let deadline = new Date(departureTime);

        if (step.deadline_days) {
            deadline.setDate(deadline.getDate() - step.deadline_days);
        } else if (step.deadline_hours) {
            deadline.setHours(deadline.getHours() - step.deadline_hours);
        } else if (step.deadline_minutes) {
            deadline.setMinutes(deadline.getMinutes() - step.deadline_minutes);
        }

        return {
            ...step,
            deadline: deadline,
            is_overdue: new Date() > deadline,
            time_remaining: Math.floor((deadline - new Date()) / 1000 / 60) // minutes
        };
    });
};

/**
 * Vérifie si un voyage peut être effectué (toutes étapes requises complétées)
 */
exports.canProceedWithVoyage = (voyage, completedSteps = []) => {
    const allSteps = exports.defineWorkflowSteps(voyage);
    const requiredSteps = allSteps.filter(s => s.required);

    const completedStepIds = completedSteps.map(s => s.id);
    const missingSteps = requiredSteps.filter(s => !completedStepIds.includes(s.id));

    return {
        can_proceed: missingSteps.length === 0,
        missing_steps: missingSteps,
        completion_rate: (requiredSteps.length - missingSteps.length) / requiredSteps.length
    };
};

// ==========================================
// HELPERS
// ==========================================

function normalizeTransportType(mode) {
    const mapping = {
        'avion': 'plane',
        'plane': 'plane',
        'flight': 'plane',
        'train': 'train',
        'rail': 'train',
        'bus': 'bus',
        'coach': 'bus',
        'taxi': 'taxi',
        'vtc': 'taxi',
        'uber': 'taxi'
    };

    return mapping[mode.toLowerCase()] || 'bus';
}

function getLocationForAssignment(segment, assignment) {
    const locationMap = {
        'airport': segment.departure_station || segment.departure,
        'gate': segment.departure_station || segment.departure,
        'cabin': 'En vol',
        'station_departure': segment.departure_station || segment.departure,
        'station_arrival': segment.arrival_station || segment.arrival,
        'station_transfer': segment.arrival_station || segment.arrival,
        'platform': segment.departure_station || segment.departure,
        'bus_stop': segment.departure_station || segment.departure,
        'bus_stop_arrival': segment.arrival_station || segment.arrival,
        'bus_stop_transfer': segment.arrival_station || segment.arrival
    };

    return locationMap[assignment] || segment.departure;
}

function calculateDeadline(step, departureTime) {
    const departure = new Date(departureTime || new Date());
    let deadline = new Date(departure);

    if (step.deadline_days) {
        deadline.setDate(deadline.getDate() - step.deadline_days);
    } else if (step.deadline_hours) {
        deadline.setHours(deadline.getHours() - step.deadline_hours);
    } else if (step.deadline_minutes) {
        deadline.setMinutes(deadline.getMinutes() - step.deadline_minutes);
    }

    return deadline;
}

function getNextRequiredStep(workflow, currentStepId) {
    const currentIndex = workflow.steps.findIndex(s => s.id === currentStepId);
    
    for (let i = currentIndex + 1; i < workflow.steps.length; i++) {
        if (workflow.steps[i].required) {
            return workflow.steps[i].id;
        }
    }

    return null;
}

module.exports = exports;
