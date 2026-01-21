/**
 * Service de réservation complète avec workflow adaptatif
 * 
 * ✅ SYSTÈME UNIFIÉ : Crée automatiquement un Voyage MongoDB + Reservation MySQL
 * Ce service est le SEUL point d'entrée pour créer des réservations
 */

const workflowDecisionService = require('./workflowDecisionService');
const simulationService = require('./simulationService');
const enrollmentService = require('./enrollmentService'); // 🆕 ÉTAPE 4
const agentAssignmentService = require('./agentAssignmentService'); // 🆕 ÉTAPE 8
const incidentDetectionService = require('./incidentDetectionService'); // 🆕 ÉTAPE 9
const walletService = require('./walletService'); // 🆕 ÉTAPE 10
const { Reservations, Voyage, User } = require('../models');

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
 * Crée les prises en charge pour chaque segment de transport (hors WALK)
 * @param {Object} params - Paramètres
 * @returns {Promise<Array>} - Tableau des prises en charge créées
 */
async function createPrisesEnChargeForSegments({ reservation, voyage, user, itinerary, agentData }) {
    const prisesEnCharge = [];
    const { PriseEnCharge } = require('../models');
    const crypto = require('crypto');
    const notificationService = require('./notificationService');
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Filtre les segments qui nécessitent une prise en charge (exclut WALK)
    const transportSegments = (itinerary.segments || []).filter(seg => 
        seg.mode && seg.mode.toUpperCase() !== 'WALK'
    );
    
    // Si pas de segments, créer une prise en charge unique
    if (transportSegments.length === 0) {
        const validationToken = crypto.randomBytes(32).toString('hex');
        const validationUrl = `${baseUrl}/prise-en-charge/validate/${validationToken}`;
        
        const priseEnCharge = await PriseEnCharge.create({
            reservation_id: reservation.reservation_id,
            voyage_id_mongo: voyage._id.toString(),
            agent_id: agentData ? agentData.agent_id : null,
            user_id: user.user_id,
            etape_numero: 1,
            validation_token: validationToken,
            location: itinerary.from?.name || 'Unknown',
            status: 'pending'
        });
        
        console.log(`✅ PriseEnCharge unique créée: ${priseEnCharge.id}`);
        
        prisesEnCharge.push({
            id: priseEnCharge.id,
            validation_url: validationUrl,
            validation_token: validationToken,
            status: 'pending',
            location: itinerary.from?.name || 'Unknown',
            etape_numero: 1,
            mode: 'unknown'
        });
        
        // Notification
        try {
            await notificationService.createNotification({
                user_id: user.user_id,
                type: 'PRISE_EN_CHARGE_CREATED',
                title: '📋 Prise en charge créée',
                message: `Votre prise en charge est prête. Partagez le lien au personnel de transport.`,
                data: {
                    prise_en_charge_id: priseEnCharge.id,
                    validation_url: validationUrl,
                    location: itinerary.from?.name || 'Unknown',
                    reservation_id: reservation.reservation_id,
                    voyage_id: voyage._id.toString()
                },
                priority: 'high',
                icon: '📋',
                action_url: validationUrl
            });
        } catch (notifError) {
            console.error('⚠️ Erreur notification:', notifError.message);
        }
        
        return prisesEnCharge;
    }
    
    // Créer une prise en charge par segment de transport
    for (let i = 0; i < transportSegments.length; i++) {
        const segment = transportSegments[i];
        const validationToken = crypto.randomBytes(32).toString('hex');
        const validationUrl = `${baseUrl}/prise-en-charge/validate/${validationToken}`;
        
        const location = segment.departure_station || segment.from || segment.departure || 'Unknown';
        
        const priseEnCharge = await PriseEnCharge.create({
            reservation_id: reservation.reservation_id,
            voyage_id_mongo: voyage._id.toString(),
            agent_id: agentData ? agentData.agent_id : null,
            user_id: user.user_id,
            etape_numero: i + 1,
            validation_token: validationToken,
            location: location,
            status: 'pending'
        });
        
        console.log(`✅ PriseEnCharge créée: ${priseEnCharge.id} - Étape ${i + 1}/${transportSegments.length} (${segment.mode}) - ${location}`);
        
        prisesEnCharge.push({
            id: priseEnCharge.id,
            validation_url: validationUrl,
            validation_token: validationToken,
            status: 'pending',
            location: location,
            etape_numero: i + 1,
            mode: segment.mode,
            line: segment.line || null,
            operator: segment.operator || 'Unknown'
        });
        
        // Notification pour chaque segment
        try {
            await notificationService.createNotification({
                user_id: user.user_id,
                type: 'PRISE_EN_CHARGE_CREATED',
                title: `📋 Prise en charge - Étape ${i + 1}/${transportSegments.length}`,
                message: `${segment.mode} ${segment.line || ''} depuis ${location}`,
                data: {
                    prise_en_charge_id: priseEnCharge.id,
                    validation_url: validationUrl,
                    location: location,
                    segment_mode: segment.mode,
                    segment_line: segment.line,
                    etape_numero: i + 1,
                    reservation_id: reservation.reservation_id,
                    voyage_id: voyage._id.toString()
                },
                priority: 'high',
                icon: '📋',
                action_url: validationUrl
            });
        } catch (notifError) {
            console.error(`⚠️ Erreur notification étape ${i + 1}:`, notifError.message);
        }
    }
    
    console.log(`✅ Total: ${prisesEnCharge.length} prise(s) en charge créée(s)`);
    return prisesEnCharge;
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
            remaining_balance: newBalance,
            itinerary: {
                segments: itinerary.segments || [],
                from: itinerary.from,
                to: itinerary.to,
                duration: itinerary.duration,
                distance: itinerary.distance
            }
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
 * Mappe les segments de l'itinéraire vers le format MongoDB voyage.etapes
 * @param {Object} itinerary - Itinéraire complet avec segments
 * @param {Object} operatorBooking - Données de réservation opérateur (fallback)
 * @param {string} transportMode - Mode de transport normalisé
 * @param {string} departureDate - Date de départ ISO
 * @param {string} arrivalDate - Date d'arrivée ISO
 * @returns {Array} - Tableau d'étapes enrichies
 */
function mapSegmentsToEtapes(itinerary, operatorBooking, transportMode, departureDate, arrivalDate) {
    const hasSegments = itinerary.segments && itinerary.segments.length > 0;
    
    if (hasSegments) {
        // ✅ Mappe TOUS les segments avec champs enrichis
        return itinerary.segments.map((seg, index) => ({
            id: `${seg.mode}_${Date.now()}_${index}`,
            type: normalizeTransportType(seg.mode),
            compagnie: seg.operator || 'Unknown',
            adresse_1: seg.departure_station || seg.from || '',
            adresse_2: seg.arrival_station || seg.to || '',
            // Champs enrichis
            line: seg.line || null,
            departure_station: seg.departure_station || seg.departure || null,
            departure_time: seg.departure_time ? new Date(seg.departure_time) : null,
            arrival_station: seg.arrival_station || seg.arrival || null,
            arrival_time: seg.arrival_time ? new Date(seg.arrival_time) : null,
            duration_minutes: seg.duration || null,
            accessible: seg.accessible !== undefined ? seg.accessible : true,
            vehicle_type: seg.vehicle_type || null
        }));
    }
    
    // ❌ Fallback : pas de segments
    return [{
        id: operatorBooking.booking_reference,
        type: transportMode,
        compagnie: operatorBooking.operator || 'Unknown',
        adresse_1: itinerary.from?.name || '',
        adresse_2: itinerary.to?.name || '',
        // Champs enrichis avec valeurs par défaut
        line: null,
        departure_station: itinerary.from?.name || null,
        departure_time: new Date(departureDate),
        arrival_station: itinerary.to?.name || null,
        arrival_time: new Date(arrivalDate),
        duration_minutes: itinerary.duration || null,
        accessible: true,
        vehicle_type: null
    }];
}

/**
 * WORKFLOW MINIMAL - Bus courte distance
 * Étapes: QR Code uniquement
 * 
 * ✅ CRÉER : Voyage MongoDB + Reservation MySQL
 */
async function processMinimalBooking(user, itinerary, pmrNeeds, workflow) {
    // ==========================================
    // 🚌 WORKFLOW MINIMAL (BUS)
    // ⚠️ PAS d'enrollment biométrique (ÉTAPE 6)
    // ⚠️ enrollment_id reste NULL
    // ==========================================
    
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
    
    // ==========================================
    // 🆕 ÉTAPE 1 : CRÉER VOYAGE MONGODB
    // ⚠️ enrollment_id NON INCLUS (workflow MINIMAL)
    // ==========================================
    const transportMode = normalizeTransportType(itinerary.transport_mode);
    const voyageData = {
        id_pmr: user.user_id,
        id_accompagnant: null,
        date_debut: new Date(departureDate),
        date_fin: new Date(arrivalDate),
        lieu_depart: {
            locomotion: transportMode,
            id: itinerary.from?.id || itinerary.from?.name || 'Unknown'
        },
        lieu_arrive: {
            locomotion: transportMode,
            id: itinerary.to?.id || itinerary.to?.name || 'Unknown'
        },
        bagage: [],
        etapes: mapSegmentsToEtapes(itinerary, operatorBooking, transportMode, departureDate, arrivalDate),
        prix_total: calculateTotalPrice(itinerary)
        // ⚠️ PAS de enrollment_id ici (MINIMAL)
    };
    
    const voyage = await Voyage.create(voyageData);
    console.log('✅ Voyage MongoDB créé:', voyage._id);

    // ==========================================
    // 🆕 ÉTAPE 2 : CRÉER RESERVATION MYSQL
    // ==========================================
    const reservation = await Reservations.create({
        user_id: user.user_id,
        num_reza_mmt: numRezaMmt,
        enregistre: false,
        assistance_PMR: pmrNeeds.assistance_level !== 'none' ? 'Oui' : 'Non',
        Type_Transport: transportMode,
        Lieu_depart: itinerary.from?.name || 'Unknown',
        Lieu_arrivee: itinerary.to?.name || 'Unknown',
        Date_depart: departureDate,
        Date_arrivee: arrivalDate,
        Statut: 'CONFIRMED',
        booking_reference: operatorBooking.booking_reference,
        qr_code_data: JSON.stringify(qrCodeData),
        voyage_id_mongo: voyage._id.toString(),  // 🔗 LIEN MongoDB
        id_voyage: voyage.id_voyage,              // 🔗 LIEN id_voyage (numérique)
        etape_voyage: 1
    });
    
    console.log('✅ Reservation MySQL créée:', reservation.reservation_id, '→ Voyage:', voyage._id);
    
    // ==========================================
    // 🆕 ÉTAPE 8 : AUTO-ASSIGN AGENT PMR
    // ==========================================
    let agentData = null;
    try {
        const agentResult = await agentAssignmentService.autoAssignAgent({
            user_id: user.user_id,
            voyage_id: voyage._id.toString(),
            reservation_id: reservation.reservation_id,
            pmr_needs: pmrNeeds,
            location: itinerary.from?.name || 'Unknown',
            transport_type: transportMode
        });
        
        if (agentResult.agent_assigned) {
            agentData = {
                agent_id: agentResult.agent.agent_id,
                agent_name: agentResult.agent.name,
                agent_phone: agentResult.agent.phone
            };
            console.log(`✅ Agent assigné: ${agentData.agent_name}`);
        }
    } catch (agentError) {
        console.error('⚠️ Erreur agent assignment (booking continue):', agentError.message);
    }
    
    // ==========================================
    // 🆕 ÉTAPE 8B : CRÉER PRISES EN CHARGE (MULTI-SEGMENTS)
    // ==========================================
    let priseEnChargeData = null;
    try {
        const prisesEnCharge = await createPrisesEnChargeForSegments({
            reservation,
            voyage,
            user,
            itinerary,
            agentData
        });
        
        // Retourner toutes les prises en charge
        priseEnChargeData = prisesEnCharge;
        
    } catch (priseEnChargeError) {
        console.error('⚠️ Erreur création prises en charge (booking continue):', priseEnChargeError.message);
    }
    
    // Génère QR Code visuel
    const qrCode = simulationService.generateQRCode({
        id: reservation.reservation_id,
        user_id: user.user_id,
        departure: itinerary.from?.name || 'Unknown',
        destination: itinerary.to?.name || 'Unknown',
        departure_time: departureDate
    });
    
    // ==========================================
    // 🆕 ÉTAPE 9 : ACTIVER MONITORING INCIDENTS
    // ==========================================
    incidentDetectionService.monitorVoyageForIncidents(voyage._id.toString())
        .catch(err => console.error('⚠️ Erreur monitoring incidents:', err.message));
    
    // ==========================================
    // 🆕 ÉTAPE 10 : AUTO-DEDUCTION WALLET
    // ==========================================
    let paymentData = null;
    try {
        const bookingPrice = walletService.calculateBookingPrice('MINIMAL', { pmrNeeds });
        const deductionResult = await walletService.deductFromWallet({
            user_id: user.user_id,
            amount: bookingPrice,
            booking_reference: operatorBooking.booking_reference,
            description: `Paiement booking ${transportMode} - ${itinerary.from?.name} → ${itinerary.to?.name}`,
            voyage_id: voyage._id.toString()
        });
        
        if (deductionResult.success) {
            paymentData = {
                transaction_id: deductionResult.transaction_id,
                amount_paid: deductionResult.amount_deducted,
                wallet_balance: deductionResult.balance_after
            };
            console.log(`✅ Paiement effectué : ${bookingPrice} points (solde: ${deductionResult.balance_after})`);
        } else {
            console.warn(`⚠️ Échec déduction wallet: ${deductionResult.error}`);
            paymentData = { error: deductionResult.error, balance: deductionResult.currentBalance };
        }
    } catch (paymentError) {
        console.error('⚠️ Erreur paiement wallet (booking continue):', paymentError.message);
    }
    
    return {
        reservation_id: reservation.reservation_id,
        voyage_id: voyage._id.toString(),
        voyage_id_numeric: voyage.id_voyage,
        booking_reference: operatorBooking.booking_reference,
        qr_code: qrCode,
        operator: operatorBooking.operator,
        agent: agentData,  // 🆕 ÉTAPE 8
        prise_en_charge: priseEnChargeData,  // 🆕 ÉTAPE 8B
        payment: paymentData,  // 🆕 ÉTAPE 10
        segments: voyage.etapes,  // 🆕 Segments enrichis sauvegardés
        steps_completed: ['booking', 'qr_generation', agentData ? 'agent_assigned' : null, priseEnChargeData ? 'prise_en_charge_created' : null, paymentData?.transaction_id ? 'payment' : null].filter(Boolean),
        next_step: 'Montrez le QR code au conducteur'
    };
}

/**
 * WORKFLOW LIGHT - Train moyenne distance
 * Étapes: Réservation opérateur + QR Code + Assistance PMR
 * 
 * ✅ CRÉER : Voyage MongoDB + Reservation MySQL
 */
async function processLightBooking(user, itinerary, pmrNeeds, workflow) {
    // ==========================================
    // 🚆 WORKFLOW LIGHT (TRAIN RÉGIONAL)
    // ⚠️ PAS d'enrollment biométrique (ÉTAPE 6)
    // ⚠️ enrollment_id reste NULL
    // ==========================================
    
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
    
    // ==========================================
    // 🆕 ÉTAPE 1 : CRÉER VOYAGE MONGODB
    // ⚠️ enrollment_id NON INCLUS (workflow LIGHT)
    // ==========================================
    const transportMode = normalizeTransportType(itinerary.transport_mode || 'train');
    
    // 🆕 Enrichissement étapes avec données détaillées
    const voyageEtapes = mapSegmentsToEtapes(itinerary, operatorBooking, transportMode, departureDate, arrivalDate);
    
    const voyageData = {
        id_pmr: user.user_id,
        id_accompagnant: null,
        date_debut: new Date(departureDate),
        date_fin: new Date(arrivalDate),
        lieu_depart: {
            locomotion: transportMode,
            id: itinerary.from?.id || itinerary.from?.name || 'Unknown'
        },
        lieu_arrive: {
            locomotion: transportMode,
            id: itinerary.to?.id || itinerary.to?.name || 'Unknown'
        },
        bagage: [],
        etapes: voyageEtapes,  // 🆕 Utiliser les étapes enrichies
        prix_total: calculateTotalPrice(itinerary)
        // ⚠️ PAS de enrollment_id ici (LIGHT)
    };
    
    const voyage = await Voyage.create(voyageData);
    console.log('✅ Voyage MongoDB créé:', voyage._id);
    
    // ==========================================
    // 🆕 ÉTAPE 2 : CRÉER RESERVATION MYSQL
    // ==========================================
    const reservation = await Reservations.create({
        user_id: user.user_id,
        num_reza_mmt: numRezaMmt,
        enregistre: false,
        assistance_PMR: pmrNeeds.assistance_level !== 'none' ? 'Oui' : 'Non',
        Type_Transport: transportMode,
        Lieu_depart: itinerary.from?.name || 'Unknown',
        Lieu_arrivee: itinerary.to?.name || 'Unknown',
        Date_depart: departureDate,
        Date_arrivee: arrivalDate,
        Statut: 'CONFIRMED',
        booking_reference: operatorBooking.booking_reference,
        qr_code_data: JSON.stringify(qrCodeData),
        voyage_id_mongo: voyage._id.toString(),  // 🔗 LIEN MongoDB
        id_voyage: voyage.id_voyage,              // 🔗 LIEN id_voyage (numérique)
        etape_voyage: 1
    });
    
    console.log('✅ Reservation MySQL créée:', reservation.reservation_id, '→ Voyage:', voyage._id);

    // ==========================================
    // 🆕 ÉTAPE 8 : AUTO-ASSIGN AGENT PMR
    // ==========================================
    let agentData = null;
    try {
        const agentResult = await agentAssignmentService.autoAssignAgent({
            user_id: user.user_id,
            voyage_id: voyage._id.toString(),
            reservation_id: reservation.reservation_id,
            pmr_needs: pmrNeeds,
            location: itinerary.from?.name || 'Unknown',
            transport_type: transportMode
        });
        
        if (agentResult.agent_assigned) {
            agentData = {
                agent_id: agentResult.agent.agent_id,
                agent_name: agentResult.agent.name,
                agent_phone: agentResult.agent.phone
            };
            console.log(`✅ Agent assigné: ${agentData.agent_name}`);
        }
    } catch (agentError) {
        console.error('⚠️ Erreur agent assignment (booking continue):', agentError.message);
    }

    // ==========================================
    // 🆕 ÉTAPE 8B : CRÉER PRISES EN CHARGE (MULTI-SEGMENTS)
    // ==========================================
    let priseEnChargeData = null;
    try {
        const prisesEnCharge = await createPrisesEnChargeForSegments({
            reservation,
            voyage,
            user,
            itinerary,
            agentData
        });
        
        // Retourner toutes les prises en charge
        priseEnChargeData = prisesEnCharge;
        
    } catch (priseEnChargeError) {
        console.error('⚠️ Erreur création prises en charge (booking continue):', priseEnChargeError.message);
    }

    // 3. Génère QR Code visuel
    const qrCode = simulationService.generateQRCode({
        id: reservation.reservation_id,
        user_id: user.user_id,
        departure: itinerary.from?.name || 'Unknown',
        destination: itinerary.to?.name || 'Unknown',
        departure_time: departureDate
    });

    // ==========================================
    // 🆕 ÉTAPE 9 : ACTIVER MONITORING INCIDENTS
    // ==========================================
    incidentDetectionService.monitorVoyageForIncidents(voyage._id.toString())
        .catch(err => console.error('⚠️ Erreur monitoring incidents:', err.message));

    // ==========================================
    // 🆕 ÉTAPE 10 : AUTO-DEDUCTION WALLET
    // ==========================================
    let paymentData = null;
    try {
        const bookingPrice = walletService.calculateBookingPrice('LIGHT', { pmrNeeds });
        const deductionResult = await walletService.deductFromWallet({
            user_id: user.user_id,
            amount: bookingPrice,
            booking_reference: operatorBooking.booking_reference,
            description: `Paiement booking ${transportMode} - ${itinerary.from?.name} → ${itinerary.to?.name}`,
            voyage_id: voyage._id.toString()
        });
        
        if (deductionResult.success) {
            paymentData = {
                transaction_id: deductionResult.transaction_id,
                amount_paid: deductionResult.amount_deducted,
                wallet_balance: deductionResult.balance_after
            };
            console.log(`✅ Paiement effectué : ${bookingPrice} points (solde: ${deductionResult.balance_after})`);
        } else {
            console.warn(`⚠️ Échec déduction wallet: ${deductionResult.error}`);
            paymentData = { error: deductionResult.error, balance: deductionResult.currentBalance };
        }
    } catch (paymentError) {
        console.error('⚠️ Erreur paiement wallet (booking continue):', paymentError.message);
    }

    // 4. Résultat de base
    const result = {
        reservation_id: reservation.reservation_id,
        booking_reference: operatorBooking.booking_reference,
        qr_code: qrCode,
        operator: operatorBooking.operator,
        departure_time: departureDate,
        arrival_time: arrivalDate,
        agent: agentData,  // 🆕 ÉTAPE 8
        prise_en_charge: priseEnChargeData,  // 🆕 ÉTAPE 8B
        payment: paymentData,  // 🆕 ÉTAPE 10
        steps_completed: ['operator_booking', 'qr_generation', agentData ? 'agent_assigned' : null, priseEnChargeData ? 'prise_en_charge_created' : null, paymentData?.transaction_id ? 'payment' : null].filter(Boolean),
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
    
    // 🆕 Ajouter les IDs de voyage
    result.voyage_id = reservation.voyage_id_mongo;
    result.voyage_id_numeric = reservation.id_voyage;
    
    return result;
}

/**
 * WORKFLOW MODERATE - Vol national
 * Étapes: Enrôlement biométrique + Check-in + QR Code
 * 
 * ✅ CRÉER : Voyage MongoDB + Reservation MySQL
 */
async function processModerateBooking(user, itinerary, pmrNeeds, workflow) {
    // ==========================================
    // 🆕 ÉTAPE 4 : ENROLLMENT BIOMÉTRIQUE AUTO
    // ==========================================
    console.log('🔐 ÉTAPE 4 : Enrollment biométrique pour workflow MODERATE...');
    let enrollmentData = null;
    let biometricData = null;
    
    try {
        enrollmentData = await enrollmentService.createAutoEnrollment(user, {
            workflow_type: 'MODERATE',
            identity_data: {
                nom: user.nom,
                prenom: user.prenom,
                date_naissance: user.date_naissance
            }
        });
        
        if (enrollmentData.success) {
            await user.update({ biometric_enrolled: true });
            biometricData = {
                enrolled: true,
                enrollment_id: enrollmentData.enrollment_id,
                already_enrolled: enrollmentData.already_exists,
                qr_data_url: enrollmentData.qr_data_url
            };
            console.log(`✅ Enrollment actif: ${enrollmentData.enrollment_id}`);
        }
    } catch (enrollError) {
        console.error('⚠️ Erreur enrollment (booking continue quand même):', enrollError.message);
        biometricData = { enrolled: false, error: enrollError.message };
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
    
    // ==========================================
    // 🆕 ÉTAPE 1 : CRÉER VOYAGE MONGODB
    // ==========================================
    const voyageEtapes = mapSegmentsToEtapes(itinerary, operatorBooking, transportType, departureDate, arrivalDate);
    
    const voyageData = {
        id_pmr: user.user_id,
        id_accompagnant: null,
        date_debut: new Date(departureDate),
        date_fin: new Date(arrivalDate),
        lieu_depart: {
            locomotion: transportType,
            id: itinerary.from?.id || itinerary.from?.name || 'Unknown'
        },
        lieu_arrive: {
            locomotion: transportType,
            id: itinerary.to?.id || itinerary.to?.name || 'Unknown'
        },
        bagage: [],
        etapes: voyageEtapes,
        prix_total: calculateTotalPrice(itinerary),
        enrollment_id: enrollmentData?.enrollment_id || null // 🆕 ÉTAPE 4
    };
    
    const voyage = await Voyage.create(voyageData);
    console.log('✅ Voyage MongoDB créé:', voyage._id);
    
    // ==========================================
    // 🆕 ÉTAPE 2 : CRÉER RESERVATION MYSQL
    // ==========================================
    const reservation = await Reservations.create({
        user_id: user.user_id,
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
        biometric_verified: enrollmentData?.success || false, // 🆕 ÉTAPE 4
        voyage_id_mongo: voyage._id.toString(),  // 🔗 LIEN MongoDB
        id_voyage: voyage.id_voyage,              // 🔗 LIEN id_voyage (numérique)
        enrollment_id: enrollmentData?.enrollment_id || null, // 🆕 ÉTAPE 4
        etape_voyage: isMultimodal ? voyageEtapes.length : 1
    });
    
    console.log('✅ Reservation MySQL créée:', reservation.reservation_id, '→ Voyage:', voyage._id);
    
    // ==========================================
    // 🆕 ÉTAPE 8 : AUTO-ASSIGN AGENT PMR
    // ==========================================
    let agentData = null;
    try {
        const agentResult = await agentAssignmentService.autoAssignAgent({
            user_id: user.user_id,
            voyage_id: voyage._id.toString(),
            reservation_id: reservation.reservation_id,
            pmr_needs: pmrNeeds,
            location: itinerary.from?.name || 'Unknown',
            transport_type: transportType
        });
        
        if (agentResult.agent_assigned) {
            agentData = {
                agent_id: agentResult.agent.agent_id,
                agent_name: agentResult.agent.name,
                agent_phone: agentResult.agent.phone
            };
            console.log(`✅ Agent assigné: ${agentData.agent_name}`);
        }
    } catch (agentError) {
        console.error('⚠️ Erreur agent assignment (booking continue):', agentError.message);
    }
    
    // ==========================================
    // 🆕 ÉTAPE 8B : CRÉER PRISES EN CHARGE (MULTI-SEGMENTS)
    // ==========================================
    let priseEnChargeData = null;
    try {
        const prisesEnCharge = await createPrisesEnChargeForSegments({
            reservation,
            voyage,
            user,
            itinerary,
            agentData
        });
        
        // Retourner toutes les prises en charge
        priseEnChargeData = prisesEnCharge;
        
    } catch (priseEnChargeError) {
        console.error('⚠️ Erreur création prises en charge (booking continue):', priseEnChargeError.message);
    }
    
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
    
    // ==========================================
    // 🆕 ÉTAPE 9 : ACTIVER MONITORING INCIDENTS
    // ==========================================
    incidentDetectionService.monitorVoyageForIncidents(voyage._id.toString())
        .catch(err => console.error('⚠️ Erreur monitoring incidents:', err.message));
    
    // ==========================================
    // 🆕 ÉTAPE 10 : AUTO-DEDUCTION WALLET
    // ==========================================
    let paymentData = null;
    try {
        const bookingPrice = walletService.calculateBookingPrice('MODERATE', { pmrNeeds });
        const deductionResult = await walletService.deductFromWallet({
            user_id: user.user_id,
            amount: bookingPrice,
            booking_reference: operatorBooking.booking_reference,
            description: `Paiement booking ${transportType} - ${itinerary.from?.name} → ${itinerary.to?.name}`,
            voyage_id: voyage._id.toString()
        });
        
        if (deductionResult.success) {
            paymentData = {
                transaction_id: deductionResult.transaction_id,
                amount_paid: deductionResult.amount_deducted,
                wallet_balance: deductionResult.balance_after
            };
            console.log(`✅ Paiement effectué : ${bookingPrice} points (solde: ${deductionResult.balance_after})`);
        } else {
            console.warn(`⚠️ Échec déduction wallet: ${deductionResult.error}`);
            paymentData = { error: deductionResult.error, balance: deductionResult.currentBalance };
        }
    } catch (paymentError) {
        console.error('⚠️ Erreur paiement wallet (booking continue):', paymentError.message);
    }
    
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
        voyage_id: voyage._id.toString(),
        voyage_id_numeric: voyage.id_voyage,
        booking_reference: operatorBooking.booking_reference,
        payment: paymentData,  // 🆕 ÉTAPE 10
        segments: voyage.etapes,  // 🆕 Segments enrichis sauvegardés
        enrollment: enrollmentData ? {
            enrollment_id: enrollmentData.enrollment_id,
            already_exists: enrollmentData.already_exists,
            qr_data_url: enrollmentData.qr_data_url
        } : null, // 🆕 ÉTAPE 4
        biometric: biometricData,
        checkin: checkinData,
        qr_code: qrCode,
        operator: operatorBooking.operator,
        agent: agentData,  // 🆕 ÉTAPE 8
        prise_en_charge: priseEnChargeData,  // 🆕 ÉTAPE 8B
        assistance: agent ? {
            agent_assigned: true,
            agent_name: agent.name,
            meeting_point: 'Porte PMR - Terminal départs'
        } : null,
        steps_completed: [
            'booking', 
            enrollmentData?.success ? 'biometric_enrollment' : null,
            'checkin', 
            'qr_generation',
            agentData ? 'agent_assigned' : null,  // 🆕 ÉTAPE 8
            priseEnChargeData ? 'prise_en_charge_created' : null,  // 🆕 ÉTAPE 8B
            'assistance'
        ].filter(Boolean), // 🆕 ÉTAPE 4 : Filtre null
        next_step: 'Présentez-vous à la porte d\'embarquement 45min avant le départ'
    };
}

/**
 * WORKFLOW FULL - Vol international
 * Étapes: OCR Passeport + Enrôlement biométrique + Check-in + QR Code
 * 
 * ✅ Utilise processModerateBooking qui crée déjà Voyage MongoDB + Reservation MySQL
 */
async function processFullBooking(user, itinerary, pmrNeeds, workflow) {
    // ==========================================
    // 🆕 ÉTAPE 4 : ENROLLMENT BIOMÉTRIQUE AUTO
    // ==========================================
    console.log('🔐 ÉTAPE 4 : Enrollment biométrique pour workflow FULL...');
    let enrollmentData = null;
    
    try {
        // Simulation OCR passeport (déjà dans enrollmentService mais on garde pour cohérence)
        const ocrData = await simulationService.simulateOCR('passport_image_base64', 'passport');
        
        if (!ocrData.success || ocrData.data.confidence < 0.85) {
            throw new Error('OCR passport validation failed');
        }
        
        // Création enrollment avec données passeport
        enrollmentData = await enrollmentService.createAutoEnrollment(user, {
            workflow_type: 'FULL',
            identity_data: {
                nom: ocrData.data.nom || user.nom,
                prenom: ocrData.data.prenom || user.prenom,
                date_naissance: ocrData.data.date_naissance || user.date_naissance,
                numero_id: ocrData.data.document_number,
                nationalite: ocrData.data.nationalite || 'FR'
            }
        });
        
        if (enrollmentData.success) {
            // Mise à jour profil utilisateur
            await user.update({
                passport_number: ocrData.data.document_number,
                passport_expiry: ocrData.data.expiry_date,
                biometric_enrolled: true
            });
            console.log(`✅ Enrollment FULL actif: ${enrollmentData.enrollment_id}`);
        }
    } catch (enrollError) {
        console.error('⚠️ Erreur enrollment FULL (booking continue quand même):', enrollError.message);
    }
    
    // 4. Réservation vol (même logique que MODERATE - crée déjà Voyage + Reservation avec enrollment_id)
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
