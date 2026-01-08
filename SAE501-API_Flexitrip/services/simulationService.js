/**
 * Service de simulation simplifié
 * Simule OCR, Face Matching, Wallet, Réservations
 */

const crypto = require('crypto');

/**
 * SIMULATION OCR PASSEPORT/CARTE ID
 * Retourne des données fictives réalistes
 */
async function simulateOCR(imageData, documentType = 'passport') {
    // Simule le temps de traitement OCR (1-2 secondes)
    await sleep(1500);
    
    const fakeData = {
        passport: {
            type: 'PASSPORT',
            document_number: generateDocNumber('P'),
            surname: randomChoice(['MARTIN', 'BERNARD', 'DUBOIS', 'LAURENT', 'SIMON']),
            given_names: randomChoice(['Jean', 'Marie', 'Pierre', 'Sophie', 'Luc']),
            nationality: 'FRA',
            birth_date: randomDate(1960, 2000),
            expiry_date: randomDate(2026, 2035),
            sex: randomChoice(['M', 'F']),
            place_of_birth: randomChoice(['Paris', 'Lyon', 'Marseille', 'Toulouse']),
            confidence: 0.95 + Math.random() * 0.04 // 95-99%
        },
        id_card: {
            type: 'ID_CARD',
            document_number: generateDocNumber('ID'),
            surname: randomChoice(['MARTIN', 'BERNARD', 'DUBOIS', 'LAURENT', 'SIMON']),
            given_names: randomChoice(['Jean', 'Marie', 'Pierre', 'Sophie', 'Luc']),
            birth_date: randomDate(1960, 2000),
            expiry_date: randomDate(2026, 2035),
            address: '123 Rue de la République, 75001 Paris',
            nationality: 'FRA',
            confidence: 0.93 + Math.random() * 0.06
        }
    };
    
    return {
        success: true,
        data: fakeData[documentType] || fakeData.id_card,
        processing_time: 1500,
        timestamp: new Date().toISOString()
    };
}

/**
 * SIMULATION FACE MATCHING
 * Compare deux photos (enrollment vs live)
 */
async function simulateFaceMatch(enrollmentPhoto, livePhoto) {
    // Simule le temps de matching (1 seconde)
    await sleep(1000);
    
    // 95% de chance de match réussi
    const matchSuccess = Math.random() > 0.05;
    
    return {
        match: matchSuccess,
        confidence: matchSuccess ? (0.90 + Math.random() * 0.09) : (0.40 + Math.random() * 0.20),
        liveness_check: Math.random() > 0.1 ? 'PASSED' : 'FAILED',
        processing_time: 1000,
        timestamp: new Date().toISOString()
    };
}

/**
 * SIMULATION RÉSERVATION OPÉRATEUR
 * Simule appel API SNCF/Air France/Bus
 */
async function simulateOperatorBooking(segment, userProfile) {
    // Simule le temps d'appel API (2-3 secondes)
    await sleep(2000 + Math.random() * 1000);
    
    const operators = {
        TRAIN: ['SNCF', 'Eurostar', 'Thalys'],
        BUS: ['FlixBus', 'BlaBlaBus', 'Ouibus'],
        FLIGHT: ['Air France', 'EasyJet', 'Transavia']
    };
    
    const operator = operators[segment.mode]?.[0] || 'Unknown';
    
    return {
        success: true,
        booking_reference: generateBookingRef(operator),
        operator: operator,
        status: 'CONFIRMED',
        segment: {
            from: segment.from,
            to: segment.to,
            departure_time: segment.departure_time,
            arrival_time: segment.arrival_time,
            mode: segment.mode
        },
        assistance: {
            confirmed: true,
            agent_assigned: userProfile.needs_assistance,
            special_equipment: userProfile.mobility_aid || 'none'
        },
        timestamp: new Date().toISOString()
    };
}

/**
 * SIMULATION WALLET BLOCKCHAIN
 * Déduction de points + génération transaction fictive
 */
async function simulateWalletTransaction(userId, amount, description) {
    // Simule le temps de transaction blockchain (500ms)
    await sleep(500);
    
    // Génère un hash de transaction fictif
    const txHash = '0x' + crypto.randomBytes(32).toString('hex');
    const blockNumber = Math.floor(Math.random() * 9000000) + 1000000;
    
    return {
        success: true,
        transaction_id: txHash,
        block_number: blockNumber,
        from_address: '0x' + crypto.randomBytes(20).toString('hex'),
        to_address: '0x' + crypto.randomBytes(20).toString('hex'),
        amount: amount,
        gas_fee: 0.001,
        status: 'CONFIRMED',
        confirmations: 12,
        description: description,
        timestamp: new Date().toISOString()
    };
}

/**
 * SIMULATION GÉNÉRATION QR CODE
 * Génère un QR code simple avec UUID
 */
function generateQRCode(voyageData) {
    const qrId = crypto.randomUUID();
    
    // Données encodées dans le QR (format simplifié)
    const qrPayload = {
        voyage_id: voyageData.id,
        user_id: voyageData.user_id,
        qr_id: qrId,
        departure: voyageData.departure,
        destination: voyageData.destination,
        date: voyageData.departure_time,
        validation_code: crypto.randomBytes(4).toString('hex').toUpperCase(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
    };
    
    // En production, on utiliserait une lib comme 'qrcode' pour générer l'image
    // Ici on retourne juste les données
    return {
        qr_id: qrId,
        qr_data: JSON.stringify(qrPayload),
        qr_url: `flexitrip://scan?qr=${qrId}`,
        display_code: qrPayload.validation_code
    };
}

/**
 * VALIDATION QR CODE
 * Vérifie qu'un QR code est valide
 */
function validateQRCode(qrData) {
    try {
        const payload = JSON.parse(qrData);
        const expiresAt = new Date(payload.expires_at);
        const now = new Date();
        
        return {
            valid: expiresAt > now,
            expired: expiresAt <= now,
            voyage_id: payload.voyage_id,
            user_id: payload.user_id,
            validation_code: payload.validation_code
        };
    } catch (error) {
        return {
            valid: false,
            error: 'Invalid QR code format'
        };
    }
}

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function generateDocNumber(prefix) {
    const numbers = Math.floor(Math.random() * 900000000) + 100000000;
    return `${prefix}${numbers}`;
}

function generateBookingRef(operator) {
    const letters = operator.substring(0, 2).toUpperCase();
    const numbers = Math.floor(Math.random() * 900000) + 100000;
    return `${letters}${numbers}`;
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomDate(startYear, endYear) {
    const start = new Date(startYear, 0, 1);
    const end = new Date(endYear, 11, 31);
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
}

module.exports = {
    simulateOCR,
    simulateFaceMatch,
    simulateOperatorBooking,
    simulateWalletTransaction,
    generateQRCode,
    validateQRCode
};
