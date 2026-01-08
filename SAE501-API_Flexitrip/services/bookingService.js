/**
 * Service de réservation complète avec workflow adaptatif
 */

const workflowDecisionService = require('./workflowDecisionService');
const simulationService = require('./simulationService');
const { Reservations } = require('../models');
const { User } = require('../models');

/**
 * Normalise le mode de transport vers les valeurs ENUM valides
 * @param {string} mode - Mode brut (bus, train, flight, etc.)
 * @returns {string} - Valeur ENUM valide
 */
function normalizeTransportType(mode) {
    const modeMap = {
        'bus': 'bus',
        'train': 'train',
        'flight': 'avion',
        'avion': 'avion',
        'plane': 'avion',
        'taxi': 'taxi',
        'multimodal': 'multimodal'
    };
    return modeMap[mode?.toLowerCase()] || 'bus';
}

/**
 * RÉSERVATION COMPLÈTE AVEC WORKFLOW ADAPTATIF
 */
async function createBooking(userId, itinerary, pmrNeeds) {
    try {
        // 1. Détermine le workflow approprié
        const workflow = workflowDecisionService.determineWorkflow(itinerary);
        
        // 2. Récupère l'utilisateur
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        // 3. Calcul du prix total
        const totalPrice = calculateTotalPrice(itinerary);
        
        // 4. Vérification du solde wallet
        if (user.solde < totalPrice) {
            return {
                success: false,
                error: 'Insufficient wallet balance',
                required: totalPrice,
                available: user.solde
            };
        }
        
        // 5. Traitement selon le workflow
        let bookingResult;
        
        switch (workflow.workflow_type) {
            case 'MINIMAL':
                bookingResult = await processMinimalBooking(user, itinerary, pmrNeeds, workflow);
                break;
            case 'LIGHT':
                bookingResult = await processLightBooking(user, itinerary, pmrNeeds, workflow);
                break;
            case 'MODERATE':
                bookingResult = await processModerateBooking(user, itinerary, pmrNeeds, workflow);
                break;
            case 'FULL':
                bookingResult = await processFullBooking(user, itinerary, pmrNeeds, workflow);
                break;
            default:
                throw new Error('Unknown workflow type');
        }
        
        // 6. Déduction wallet
        const walletTx = await simulationService.simulateWalletTransaction(
            userId,
            totalPrice,
            `Paiement voyage ${itinerary.from.name} → ${itinerary.to.name}`
        );
        
        // 7. Mise à jour du solde
        const newBalance = user.solde - totalPrice;
        await user.update({
            solde: newBalance
        });
        
        // 8. Retourne le résultat
        return {
            success: true,
            workflow_type: workflow.workflow_type,
            booking: bookingResult,
            payment: walletTx,
            timeline: workflow.timeline,
            total_price: totalPrice,
            remaining_balance: newBalance
        };
        
    } catch (error) {
        console.error('Booking error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * WORKFLOW MINIMAL - Bus courte distance
 * Étapes: QR Code uniquement
 */
async function processMinimalBooking(user, itinerary, pmrNeeds, workflow) {
    // Simule réservation opérateur
    const operatorBooking = await simulationService.simulateOperatorBooking(
        itinerary.segments?.[0] || { mode: itinerary.transport_mode || 'bus' },
        { needs_assistance: pmrNeeds.assistance_level !== 'none', mobility_aid: pmrNeeds.mobility_aid }
    );
    
    // Génère numéro de réservation unique
    const numRezaMmt = `MMT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Dates par défaut si non fournies
    const now = new Date();
    const durationMs = (itinerary.duration || itinerary.total_duration || 3600) * 1000;
    
    // Validation et conversion sécurisée des dates
    let departureDate = now.toISOString();
    if (itinerary.departure_time) {
        const depDate = new Date(itinerary.departure_time);
        if (!isNaN(depDate.getTime())) {
            departureDate = depDate.toISOString();
        }
    }
    
    let arrivalDate = new Date(now.getTime() + durationMs).toISOString();
    if (itinerary.arrival_time) {
        const arrDate = new Date(itinerary.arrival_time);
        if (!isNaN(arrDate.getTime())) {
            arrivalDate = arrDate.toISOString();
        }
    } else {
        arrivalDate = new Date(new Date(departureDate).getTime() + durationMs).toISOString();
    }
    
    // Génère données QR code
    const qrCodeData = {
        type: 'RESERVATION',
        num_reza: numRezaMmt,
        user_id: user.user_id,
        depart: itinerary.from?.name || 'Unknown',
        arrivee: itinerary.to?.name || 'Unknown',
        date_depart: departureDate,
        transport: normalizeTransportType(itinerary.transport_mode),
        assistance_PMR: pmrNeeds.assistance_level !== 'none',
        booking_reference: operatorBooking.booking_reference,
        issued_at: new Date().toISOString()
    };

    // Crée le voyage en DB
    const reservation = await Reservations.create({
        user_id: user.user_id,  // Correction: user.user_id au lieu de user.id
        num_reza_mmt: numRezaMmt,
        enregistre: false,
        assistance_PMR: pmrNeeds.assistance_level !== 'none' ? 'Oui' : 'Non',
        Type_Transport: normalizeTransportType(itinerary.transport_mode),
        Lieu_depart: itinerary.from?.name || 'Unknown',
        Lieu_arrivee: itinerary.to?.name || 'Unknown',
        Date_depart: departureDate,
        Date_arrivee: arrivalDate,
        Statut: 'CONFIRMED',
        booking_reference: operatorBooking.booking_reference,
        qr_code_data: JSON.stringify(qrCodeData),
        id_voyage: null,  // Optionnel pour le nouveau système
        etape_voyage: 1   // Première étape par défaut
    });
    
    // Génère QR Code visuel
    const qrCode = simulationService.generateQRCode({
        id: reservation.reservation_id,
        user_id: user.user_id,  // Correction: user.user_id
        departure: itinerary.from?.name || 'Unknown',
        destination: itinerary.to?.name || 'Unknown',
        departure_time: departureDate
    });
    
    return {
        reservation_id: reservation.reservation_id,
        booking_reference: operatorBooking.booking_reference,
        qr_code: qrCode,
        operator: operatorBooking.operator,
        steps_completed: ['booking', 'qr_generation'],
        next_step: 'Montrez le QR code au conducteur'
    };
}

/**
 * WORKFLOW LIGHT - Train moyenne distance
 * Étapes: Réservation opérateur + QR Code + Assistance PMR
 */
async function processLightBooking(user, itinerary, pmrNeeds, workflow) {
    // 1. Réservation opérateur
    const operatorBooking = await simulationService.simulateOperatorBooking(
        itinerary.segments?.[0] || { mode: itinerary.transport_mode || 'train' },
        { needs_assistance: pmrNeeds.assistance_level !== 'none', mobility_aid: pmrNeeds.mobility_aid }
    );
    
    // Génère numéro de réservation unique
    const numRezaMmt = `MMT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Dates par défaut
    const now = new Date();
    const durationMs = (itinerary.duration || itinerary.total_duration || 7200) * 1000;
    
    // Validation et conversion sécurisée des dates
    let departureDate = now.toISOString();
    if (itinerary.departure_time) {
        const depDate = new Date(itinerary.departure_time);
        if (!isNaN(depDate.getTime())) {
            departureDate = depDate.toISOString();
        }
    }

    let arrivalDate = new Date(now.getTime() + durationMs).toISOString();
    if (itinerary.arrival_time) {
        const arrDate = new Date(itinerary.arrival_time);
        if (!isNaN(arrDate.getTime())) {
            arrivalDate = arrDate.toISOString();
        }
    } else {
        arrivalDate = new Date(new Date(departureDate).getTime() + durationMs).toISOString();
    }

    // Génère données QR code
    const qrCodeData = {
        type: 'RESERVATION',
        num_reza: numRezaMmt,
        user_id: user.user_id,
        depart: itinerary.from?.name || 'Unknown',
        arrivee: itinerary.to?.name || 'Unknown',
        date_depart: departureDate,
        transport: normalizeTransportType(itinerary.transport_mode || 'train'),
        assistance_PMR: pmrNeeds.assistance_level !== 'none',
        booking_reference: operatorBooking.booking_reference,
        issued_at: new Date().toISOString()
    };
    
    // 2. Crée le voyage
    const reservation = await Reservations.create({
        user_id: user.user_id,
        num_reza_mmt: numRezaMmt,
        enregistre: false,
        assistance_PMR: pmrNeeds.assistance_level !== 'none' ? 'Oui' : 'Non',
        Type_Transport: normalizeTransportType(itinerary.transport_mode || 'train'),
        Lieu_depart: itinerary.from?.name || 'Unknown',
        Lieu_arrivee: itinerary.to?.name || 'Unknown',
        Date_depart: departureDate,
        Date_arrivee: arrivalDate,
        Statut: 'CONFIRMED',
        booking_reference: operatorBooking.booking_reference,
        qr_code_data: JSON.stringify(qrCodeData),
        id_voyage: null,
        etape_voyage: 1
    });

    // 3. Génère QR Code visuel
    const qrCode = simulationService.generateQRCode({
        id: reservation.reservation_id,
        user_id: user.user_id,
        departure: itinerary.from?.name || 'Unknown',
        destination: itinerary.to?.name || 'Unknown',
        departure_time: departureDate
    });

    // 4. Résultat de base
    const result = {
        reservation_id: reservation.reservation_id,
        booking_reference: operatorBooking.booking_reference,
        qr_code: qrCode,
        operator: operatorBooking.operator,
        departure_time: departureDate,
        arrival_time: arrivalDate,
        steps_completed: ['operator_booking', 'qr_generation'],
        next_step: 'Présentez votre QR code à l\'embarquement'
    };
    
    // 5. Ajoute l'assignation d'un agent si assistance nécessaire
    if (pmrNeeds.assistance_level !== 'none') {
        // Trouve un agent disponible (simplifié)
        const agent = await findAvailableAgent(itinerary.from?.name || 'Unknown');
        
        if (agent) {
            await Reservations.update(
                { Agent_Id: agent.id },
                { where: { reservation_id: result.reservation_id } }
            );
            
            let departureTime = new Date().toISOString();
            if (itinerary.departure_time) {
                const depDate = new Date(itinerary.departure_time);
                if (!isNaN(depDate.getTime())) {
                    departureTime = depDate.toISOString();
                }
            }
            
            result.assistance = {
                agent_assigned: true,
                agent_name: agent.name,
                meeting_point: 'Guichet PMR - Hall principal',
                meeting_time: new Date(new Date(departureTime).getTime() - 30 * 60000).toISOString()
            };
        }
    }
    
    result.steps_completed.push('assistance_coordination');
    result.next_step = 'Rendez-vous au point de rencontre 30min avant le départ';
    
    return result;
}

/**
 * WORKFLOW MODERATE - Vol national
 * Étapes: Enrôlement biométrique + Check-in + QR Code
 */
async function processModerateBooking(user, itinerary, pmrNeeds, workflow) {
    // 1. Enrôlement biométrique si pas déjà fait
    let biometricData = null;
    if (!user.biometric_enrolled) {
        // Simulation: on fait comme si l'utilisateur avait uploadé une photo
        const faceMatch = await simulationService.simulateFaceMatch(
            'enrollment_photo_base64',
            'live_photo_base64'
        );
        
        if (faceMatch.match) {
            await user.update({ biometric_enrolled: true });
            biometricData = {
                enrolled: true,
                confidence: faceMatch.confidence,
                liveness: faceMatch.liveness_check
            };
        }
    } else {
        biometricData = { enrolled: true, already_enrolled: true };
    }
    
    // 2. Réservation opérateur (segment vol)
    const flightSegment = itinerary.segments?.find(s => s.mode === 'FLIGHT' || s.mode === 'flight') || itinerary.segments?.[0] || { mode: 'flight' };
    const operatorBooking = await simulationService.simulateOperatorBooking(
        flightSegment,
        { needs_assistance: pmrNeeds.assistance_level !== 'none', mobility_aid: pmrNeeds.mobility_aid }
    );
    
    // Génère numéro de réservation unique
    const numRezaMmt = `MMT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Dates par défaut
    const now = new Date();
    const durationMs = (itinerary.duration || itinerary.total_duration || 7200) * 1000;
    
    // Validation et conversion sécurisée des dates
    let departureDate = now.toISOString();
    if (itinerary.departure_time) {
        const depDate = new Date(itinerary.departure_time);
        if (!isNaN(depDate.getTime())) {
            departureDate = depDate.toISOString();
        }
    }
    
    let arrivalDate = new Date(now.getTime() + durationMs).toISOString();
    if (itinerary.arrival_time) {
        const arrDate = new Date(itinerary.arrival_time);
        if (!isNaN(arrDate.getTime())) {
            arrivalDate = arrDate.toISOString();
        }
    } else {
        arrivalDate = new Date(new Date(departureDate).getTime() + durationMs).toISOString();
    }

    // Détecte si multimodal (plusieurs segments)
    const isMultimodal = itinerary.segments && itinerary.segments.length > 1;
    const transportType = isMultimodal ? 'multimodal' : normalizeTransportType(flightSegment.mode || 'flight');

    // Génère données QR code
    const qrCodeData = {
        type: 'RESERVATION',
        num_reza: numRezaMmt,
        user_id: user.user_id,
        depart: itinerary.from?.name || 'Unknown',
        arrivee: itinerary.to?.name || 'Unknown',
        date_depart: departureDate,
        transport: transportType,
        multimodal: isMultimodal,
        segments: isMultimodal ? itinerary.segments.map(s => ({
            mode: s.mode,
            from: s.from,
            to: s.to
        })) : undefined,
        assistance_PMR: pmrNeeds.assistance_level !== 'none',
        booking_reference: operatorBooking.booking_reference,
        biometric_verified: true,
        issued_at: new Date().toISOString()
    };
    
    // 3. Crée le voyage
    const reservation = await Reservations.create({
        user_id: user.user_id,  // Correction: user.user_id
        num_reza_mmt: numRezaMmt,
        enregistre: false,
        assistance_PMR: pmrNeeds.assistance_level !== 'none' ? 'Oui' : 'Non',
        Type_Transport: transportType,
        Lieu_depart: itinerary.from?.name || 'Unknown',
        Lieu_arrivee: itinerary.to?.name || 'Unknown',
        Date_depart: departureDate,
        Date_arrivee: arrivalDate,
        Statut: 'CONFIRMED',
        booking_reference: operatorBooking.booking_reference,
        qr_code_data: JSON.stringify(qrCodeData),
        biometric_verified: true,
        id_voyage: null,
        etape_voyage: 1
    });
    
    // 4. Check-in automatique (simulé)
    const checkinData = {
        boarding_pass: `BP${Math.random().toString(36).substring(7).toUpperCase()}`,
        gate: `${Math.floor(Math.random() * 50) + 1}`,
        seat: `${Math.floor(Math.random() * 30) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`,
        boarding_time: new Date(new Date(departureDate).getTime() - 45 * 60000).toISOString()
    };
    
    // 5. QR Code
    const qrCode = simulationService.generateQRCode({
        id: reservation.reservation_id,
        user_id: user.user_id,  // Correction: user.user_id
        departure: itinerary.from?.name || 'Unknown',
        destination: itinerary.to?.name || 'Unknown',
        departure_time: departureDate
    });
    
    await reservation.update({ 
        qr_code_data: qrCode.qr_data,
        checkin_data: JSON.stringify(checkinData),
        enregistre: true
    });
    
    // 6. Agent assistance
    const agent = await findAvailableAgent(itinerary.from.name);
    if (agent) {
        await reservation.update({ Agent_Id: agent.id });
    }
    
    return {
        reservation_id: reservation.reservation_id,
        booking_reference: operatorBooking.booking_reference,
        biometric: biometricData,
        checkin: checkinData,
        qr_code: qrCode,
        operator: operatorBooking.operator,
        assistance: agent ? {
            agent_assigned: true,
            agent_name: agent.name,
            meeting_point: 'Porte PMR - Terminal départs'
        } : null,
        steps_completed: ['booking', 'biometric_enrollment', 'checkin', 'qr_generation', 'assistance'],
        next_step: 'Présentez-vous à la porte d\'embarquement 45min avant le départ'
    };
}

/**
 * WORKFLOW FULL - Vol international
 * Étapes: OCR Passeport + Enrôlement biométrique + Check-in + QR Code
 */
async function processFullBooking(user, itinerary, pmrNeeds, workflow) {
    // 1. Simulation OCR passeport
    const ocrData = await simulationService.simulateOCR('passport_image_base64', 'passport');
    
    if (!ocrData.success || ocrData.data.confidence < 0.85) {
        throw new Error('OCR passport validation failed');
    }
    
    // 2. Validation biométrique
    const faceMatch = await simulationService.simulateFaceMatch(
        'passport_photo_base64',
        'live_photo_base64'
    );
    
    if (!faceMatch.match || faceMatch.confidence < 0.85) {
        throw new Error('Biometric face matching failed');
    }
    
    // 3. Mise à jour profil utilisateur
    await user.update({
        passport_number: ocrData.data.document_number,
        passport_expiry: ocrData.data.expiry_date,
        biometric_enrolled: true
    });
    
    // 4. Réservation vol (même logique que MODERATE)
    const moderateResult = await processModerateBooking(user, itinerary, pmrNeeds, workflow);
    
    // 5. Ajout des données OCR et vérifications
    moderateResult.ocr_data = {
        document_type: ocrData.data.type,
        document_number: ocrData.data.document_number,
        confidence: ocrData.data.confidence,
        verified: true
    };
    
    moderateResult.steps_completed.unshift('ocr_passport', 'identity_verification');
    moderateResult.next_step = 'Vérifiez votre passeport et présentez-vous à l\'aéroport 2h avant le départ';
    
    return moderateResult;
}

/**
 * UTILITAIRES
 */

function calculateTotalPrice(itinerary) {
    // Prix basique selon la distance
    const distance = itinerary.distance_km || itinerary.distance || 0;
    let basePrice = 0;
    
    // Prix selon le type de transport et la distance
    if (itinerary.has_flight || itinerary.transport_mode === 'flight') {
        // Vol : 0.20€/km avec minimum 80€
        basePrice = Math.max(80, distance * 0.20);
        
        // Majoration pour vols internationaux
        if (itinerary.is_international) {
            basePrice *= 1.3;
        }
    } else if (itinerary.transport_mode === 'train') {
        // Train : 0.12€/km avec minimum 15€
        basePrice = Math.max(15, distance * 0.12);
    } else if (itinerary.transport_mode === 'bus') {
        // Bus : 0.08€/km avec minimum 5€
        basePrice = Math.max(5, distance * 0.08);
    } else {
        // Par défaut : 0.15€/km
        basePrice = distance * 0.15;
    }
    
    // Arrondi à 2 décimales
    return Math.round(basePrice * 100) / 100;
}

async function findAvailableAgent(location) {
    // Simulation: retourne un agent fictif
    // En production, rechercherait dans la table Agent
    return {
        id: Math.floor(Math.random() * 1000) + 1,
        name: `Agent ${Math.floor(Math.random() * 50) + 1}`,
        location: location
    };
}

/**
 * RÉCUPÉRATION DÉTAILS VOYAGE
 */
async function getBookingDetails(reservationId, userId) {
    const reservation = await Reservations.findOne({
        where: { reservation_id: reservationId, user_id: userId }
    });
    
    if (!reservation) {
        return { success: false, error: 'Reservation not found' };
    }
    
    return {
        success: true,
        reservation: reservation.toJSON(),
        qr_code: reservation.qr_code_data ? JSON.parse(reservation.qr_code_data) : null,
        checkin_data: reservation.checkin_data ? JSON.parse(reservation.checkin_data) : null
    };
}

module.exports = {
    createBooking,
    getBookingDetails
};
