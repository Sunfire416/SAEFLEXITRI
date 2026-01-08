/**
 * Service de décision de workflow automatique
 * Détermine quel workflow appliquer selon le type de trajet
 */

/**
 * Analyse un itinéraire et détermine le workflow approprié
 */
function determineWorkflow(route) {
    const segments = route.segments || [];
    
    // Calcul distance totale
    const totalDistance = route.distance || 0; // en mètres
    const distanceKm = totalDistance / 1000;
    
    // Détection des modes
    const hasFlight = segments.some(s => s.mode === 'FLIGHT' || s.mode === 'flight');
    const hasTrain = segments.some(s => s.mode === 'TRAIN' || s.mode === 'train');
    const hasBus = segments.some(s => s.mode === 'BUS' || s.mode === 'bus');
    const hasInternational = segments.some(s => s.international === true);
    
    // RÈGLE 1 : Vol international → FULL workflow
    if (hasInternational) {
        return {
            workflow_type: 'FULL',
            required_steps: ['OCR_PASSPORT', 'BIOMETRIC_ENROLLMENT', 'CHECKIN', 'BOARDING'],
            optional_steps: [],
            timeline: [
                { step: 'RESERVATION', day: 0, label: 'Réservation' },
                { step: 'ENROLLMENT', day: -7, label: 'Enrollment biométrique (J-7)' },
                { step: 'CHECKIN', day: -1, label: 'Check-in online (J-1)' },
                { step: 'NOTIFICATION_H2', hour: -2, label: 'Notification départ (H-2)' },
                { step: 'AIRPORT_ARRIVAL', hour: -1, label: 'Arrivée aéroport (H-1)' },
                { step: 'BOARDING', minute: -30, label: 'Boarding (H-30min)' },
                { step: 'FLIGHT', minute: 0, label: 'Vol' }
            ],
            reason: 'Vol international - Workflow complet requis',
            display_info: {
                icon: '✈️',
                title: 'Vol international',
                badges: ['Enrollment J-7', 'Passeport obligatoire', 'Agents multiples']
            }
        };
    }
    
    // RÈGLE 2 : Vol national → MODERATE workflow
    if (hasFlight) {
        return {
            workflow_type: 'MODERATE',
            required_steps: ['BIOMETRIC_ENROLLMENT', 'CHECKIN', 'BOARDING'],
            optional_steps: ['OCR_ID'],
            timeline: [
                { step: 'RESERVATION', day: 0, label: 'Réservation' },
                { step: 'ENROLLMENT', day: -7, label: 'Enrollment biométrique (J-7)' },
                { step: 'CHECKIN', day: -1, label: 'Check-in online (J-1)' },
                { step: 'NOTIFICATION_H2', hour: -2, label: 'Notification départ (H-2)' },
                { step: 'BOARDING', minute: -30, label: 'Boarding (H-30min)' },
                { step: 'FLIGHT', minute: 0, label: 'Vol' }
            ],
            reason: 'Vol national - Enrollment et check-in requis',
            display_info: {
                icon: '✈️',
                title: 'Vol national',
                badges: ['Enrollment J-7', 'Check-in J-1', 'Boarding']
            }
        };
    }
    
    // RÈGLE 3 : Train longue distance → LIGHT workflow
    if (hasTrain && distanceKm > 100) {
        return {
            workflow_type: 'LIGHT',
            required_steps: ['ASSISTANCE_BOOKING'],
            optional_steps: ['BIOMETRIC_ENROLLMENT'],
            timeline: [
                { step: 'RESERVATION', day: 0, label: 'Réservation' },
                { step: 'ASSISTANCE_BOOKING', day: -2, label: 'Réservation assistance (J-2)' },
                { step: 'NOTIFICATION_J1', day: -1, label: 'Confirmation agent (J-1)' },
                { step: 'NOTIFICATION_H1', hour: -1, label: 'Agent attend en gare (H-1)' },
                { step: 'DEPARTURE', minute: 0, label: 'Départ train' }
            ],
            reason: 'Train longue distance - Assistance SNCF requise 48h avant',
            display_info: {
                icon: '🚆',
                title: 'Train longue distance',
                badges: ['Assistance 48h avant', 'QR code billet', 'Agent gare']
            }
        };
    }
    
    // RÈGLE 4 : Bus ou train court → MINIMAL workflow
    return {
        workflow_type: 'MINIMAL',
        required_steps: ['QR_CODE'],
        optional_steps: ['ASSISTANCE_BOOKING'],
        timeline: [
            { step: 'RESERVATION', day: 0, label: 'Réservation' },
            { step: 'NOTIFICATION_H1', hour: -1, label: 'Rappel départ (H-1)' },
            { step: 'DEPARTURE', minute: 0, label: 'Départ' }
        ],
        reason: 'Trajet court - QR code simple suffit',
        display_info: {
            icon: hasBus ? '🚌' : '🚆',
            title: hasBus ? 'Trajet en bus' : 'Train court',
            badges: ['QR code simple', 'Pas de formalités']
        }
    };
}

/**
 * Génère la timeline complète d'un voyage selon le workflow
 */
function generateVoyageTimeline(route, departureDate) {
    const workflow = determineWorkflow(route);
    const departure = new Date(departureDate);
    
    return workflow.timeline.map(step => {
        let eventDate = new Date(departure);
        
        if (step.day) {
            eventDate.setDate(eventDate.getDate() + step.day);
        }
        if (step.hour) {
            eventDate.setHours(eventDate.getHours() + step.hour);
        }
        if (step.minute) {
            eventDate.setMinutes(eventDate.getMinutes() + step.minute);
        }
        
        return {
            ...step,
            date: eventDate,
            completed: false
        };
    });
}

/**
 * Vérifie si un voyage nécessite un workflow spécifique
 */
function requiresStep(route, stepName) {
    const workflow = determineWorkflow(route);
    return workflow.required_steps.includes(stepName);
}

module.exports = {
    determineWorkflow,
    generateVoyageTimeline,
    requiresStep
};
