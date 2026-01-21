/**
 * Service Check-in Unifié - ÉTAPE 5
 * 
 * Centralise la logique de check-in avec vérification d'enrollment
 * Gère 3 modes de check-in :
 * 1. QR code enrollment (biométrique)
 * 2. Réservation directe (avec enrollment_id)
 * 3. Manuel (fallback sans biométrie)
 */

const { EnrollmentBiometric, Reservations, CheckInLog, BoardingPass } = require('../models');
const enrollmentService = require('./enrollmentService');
const faceMatchService = require('./faceMatchService');
const notificationService = require('./notificationService');
const agentService = require('./agentService');

/**
 * Check-in avec vérification enrollment automatique
 * 
 * @param {Object} params - Paramètres du check-in
 * @param {number} params.user_id - ID utilisateur
 * @param {number} params.reservation_id - ID réservation
 * @param {string} params.live_photo - Photo selfie pour vérification (optionnel)
 * @param {string} params.location - Localisation check-in
 * @param {string} params.checkin_type - Type de check-in (kiosk, mobile, agent, gate)
 * @returns {Promise<Object>} - Résultat du check-in
 */
async function performCheckIn(params) {
    const { user_id, reservation_id, live_photo, location, checkin_type = 'kiosk' } = params;
    
    try {
        console.log(`🔍 Check-in user ${user_id}, reservation ${reservation_id}...`);
        
        // ==========================================
        // ÉTAPE 1 : RÉCUPÉRER RÉSERVATION
        // ==========================================
        const reservation = await Reservations.findOne({
            where: { reservation_id, user_id }
        });
        
        if (!reservation) {
            throw new Error('Réservation introuvable');
        }
        
        console.log(`✅ Réservation ${reservation_id} trouvée`);
        
        // Vérifier si check-in déjà effectué
        const existingPass = await BoardingPass.findOne({
            where: { reservation_id }
        });
        
        if (existingPass) {
            return {
                success: false,
                error: 'Check-in déjà effectué',
                boarding_pass: existingPass,
                already_checked_in: true
            };
        }
        
        // ==========================================
        // ÉTAPE 2 : VÉRIFIER ENROLLMENT (SI EXISTE)
        // ⚠️ WORKFLOWS MINIMAL/LIGHT : enrollment_id = null (ÉTAPE 6)
        // ✅ WORKFLOWS MODERATE/FULL : enrollment_id existe (ÉTAPE 4)
        // ==========================================
        let enrollmentData = null;
        let faceMatchResult = null;
        let biometricVerified = false;
        
        // Récupérer enrollment_id depuis la réservation (ÉTAPE 4)
        const enrollmentId = reservation.enrollment_id;
        
        if (enrollmentId) {
            // Enrollment existe uniquement pour MODERATE/FULL
            console.log(`🔐 Enrollment trouvé: ${enrollmentId}`);
            
            try {
                // Récupérer enrollment depuis MongoDB
                enrollmentData = await EnrollmentBiometric.findOne({ 
                    enrollment_id: enrollmentId 
                });
                
                if (!enrollmentData) {
                    console.warn(`⚠️ Enrollment ${enrollmentId} introuvable dans MongoDB`);
                } else if (enrollmentData.status !== 'active') {
                    console.warn(`⚠️ Enrollment ${enrollmentId} non actif (status: ${enrollmentData.status})`);
                } else {
                    console.log(`✅ Enrollment ${enrollmentId} actif`);
                    
                    // Si photo fournie, faire la vérification biométrique
                    if (live_photo) {
                        console.log('📷 Vérification biométrique...');
                        
                        // Vérifier si face_encoding existe
                        if (enrollmentData.face_encoding && enrollmentData.face_encoding.length > 0) {
                            faceMatchResult = await faceMatchService.compareFaces(
                                enrollmentData.face_encoding,
                                live_photo
                            );
                            
                            if (faceMatchResult.match) {
                                biometricVerified = true;
                                console.log(`✅ Face match réussi: ${faceMatchResult.confidence}%`);
                            } else {
                                console.warn(`⚠️ Face match échoué: ${faceMatchResult.confidence}%`);
                                // Ne pas bloquer le check-in, juste enregistrer le score
                            }
                        } else {
                            console.warn('⚠️ Pas de face_encoding dans enrollment, skip verification');
                        }
                    } else {
                        console.log('ℹ️ Pas de photo fournie, skip verification biométrique');
                    }
                }
            } catch (enrollError) {
                console.error('❌ Erreur vérification enrollment:', enrollError.message);
                // Ne pas bloquer le check-in si erreur enrollment
            }
        } else {
            // WORKFLOWS MINIMAL (bus) et LIGHT (train) : pas d'enrollment (ÉTAPE 6)
            console.log('ℹ️ Pas d\'enrollment associé à cette réservation (workflow MINIMAL/LIGHT)');
        }
        
        // ==========================================
        // ÉTAPE 3 : GÉNÉRER BOARDING PASS
        // ==========================================
        console.log('🎫 Génération boarding pass...');
        
        // Extraire infos voyage depuis reservation
        const departureTime = reservation.Date_depart || new Date(Date.now() + 3600000);
        const boardingTime = new Date(new Date(departureTime).getTime() - 30 * 60000); // 30min avant
        
        // Générer gate et seat (simulation)
        const gate = generateGate(reservation.Type_Transport);
        const seat = generateSeat(reservation.Type_Transport);
        
        const boardingPass = await BoardingPass.create({
            reservation_id,
            enrollment_id: enrollmentId || null, // 🆕 ÉTAPE 5
            user_id,
            flight_train_number: reservation.num_reza_mmt || `${reservation.Type_Transport?.toUpperCase() || 'BUS'}${Math.floor(Math.random() * 9000 + 1000)}`,
            departure_location: reservation.Lieu_depart || 'Unknown',
            arrival_location: reservation.Lieu_arrivee || 'Unknown',
            departure_time: departureTime,
            boarding_time: boardingTime,
            gate,
            seat,
            status: 'issued',
            pmr_assistance: reservation.assistance_PMR === 'Oui',
            boarding_group: 'PMR_PRIORITY',
            issued_at: new Date()
        });
        
        console.log(`✅ Boarding pass ${boardingPass.pass_id} créé`);
        
        // ==========================================
        // ÉTAPE 4 : LOGGER CHECK-IN
        // ==========================================
        const checkinId = `CHK-${user_id}-${Date.now()}`;
        
        await CheckInLog.create({
            checkin_id: checkinId,
            enrollment_id: enrollmentId || null, // 🆕 ÉTAPE 5
            reservation_id,
            user_id,
            checkin_type,
            location: location || 'Unknown',
            qr_scanned: false, // Mode direct (pas de QR)
            face_verified: biometricVerified,
            face_match_score: faceMatchResult?.confidence || null,
            liveness_check_passed: faceMatchResult?.liveness_check?.is_live || false,
            pmr_assistance_confirmed: reservation.assistance_PMR === 'Oui',
            boarding_pass_issued: true,
            boarding_pass_id: boardingPass.pass_id.toString(),
            verification_method: biometricVerified ? 'biometric' : 'manual',
            status: 'success'
        });
        
        console.log(`✅ Check-in log ${checkinId} créé`);
        
        // ==========================================
        // ÉTAPE 5 : ASSIGNER AGENT PMR (si nécessaire)
        // ==========================================
        let agentInfo = null;
        
        if (reservation.assistance_PMR === 'Oui') {
            try {
                const agent = agentService.assignAgentByLocation(location || reservation.Lieu_depart);
                agentInfo = {
                    agent_id: agent.id,
                    agent_name: agent.name,
                    agent_phone: agent.phone,
                    meeting_point: `Porte ${gate} - Point d'accueil PMR`
                };
                console.log(`✅ Agent PMR assigné: ${agent.name}`);
            } catch (agentError) {
                console.warn('⚠️ Erreur assignation agent:', agentError.message);
            }
        }
        
        // ==========================================
        // ÉTAPE 6 : NOTIFICATION
        // ==========================================
        try {
            await notificationService.sendCheckinSuccess(
                user_id,
                {
                    boarding_pass: {
                        pass_id: boardingPass.pass_id,
                        flight_train_number: boardingPass.flight_train_number,
                        gate: boardingPass.gate,
                        seat: boardingPass.seat,
                        boarding_time: boardingPass.boarding_time
                    },
                    reservation_id,
                    biometric_verified: biometricVerified
                },
                agentInfo
            );
            console.log('✅ Notification check-in envoyée');
        } catch (notifError) {
            console.error('⚠️ Erreur notification:', notifError.message);
        }
        
        // ==========================================
        // RETOUR RÉSULTAT
        // ==========================================
        return {
            success: true,
            message: 'Check-in effectué avec succès',
            checkin_id: checkinId,
            boarding_pass: {
                pass_id: boardingPass.pass_id,
                flight_train_number: boardingPass.flight_train_number,
                gate: boardingPass.gate,
                seat: boardingPass.seat,
                boarding_time: boardingPass.boarding_time,
                departure_location: boardingPass.departure_location,
                arrival_location: boardingPass.arrival_location,
                pmr_assistance: boardingPass.pmr_assistance
            },
            enrollment: enrollmentId ? {
                enrollment_id: enrollmentId,
                biometric_verified: biometricVerified,
                face_match_confidence: faceMatchResult?.confidence || null
            } : null,
            agent: agentInfo,
            next_step: `Présentez-vous à la porte ${gate} au moins 15 minutes avant l'heure d'embarquement`
        };
        
    } catch (error) {
        console.error('❌ Erreur check-in:', error);
        throw error;
    }
}

/**
 * Utilitaires
 */

function generateGate(transportType) {
    const gatesByType = {
        'avion': ['A', 'B', 'C', 'D', 'E', 'F'],
        'train': ['1', '2', '3', '4', '5', '6', '7', '8'],
        'bus': ['P1', 'P2', 'P3', 'P4'],
        'taxi': ['Zone Taxi']
    };
    
    const gates = gatesByType[transportType?.toLowerCase()] || gatesByType['bus'];
    const gatePrefix = gates[Math.floor(Math.random() * gates.length)];
    
    if (transportType?.toLowerCase() === 'avion') {
        return `${gatePrefix}${Math.floor(Math.random() * 30) + 1}`;
    } else if (transportType?.toLowerCase() === 'train') {
        return `Voie ${gatePrefix}`;
    } else {
        return gatePrefix;
    }
}

function generateSeat(transportType) {
    if (transportType?.toLowerCase() === 'avion') {
        const row = Math.floor(Math.random() * 30) + 1;
        const letter = String.fromCharCode(65 + Math.floor(Math.random() * 6)); // A-F
        return `${row}${letter}`;
    } else if (transportType?.toLowerCase() === 'train') {
        const car = Math.floor(Math.random() * 8) + 1;
        const seat = Math.floor(Math.random() * 60) + 1;
        return `Voiture ${car} - Place ${seat}`;
    } else {
        return `Place ${Math.floor(Math.random() * 40) + 1}`;
    }
}

module.exports = {
    performCheckIn
};
