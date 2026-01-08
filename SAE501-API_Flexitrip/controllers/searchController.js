const { Vol } = require('../models/AF');
const { Trajet } = require('../models/SNCF');
const { Ride } = require('../models/Uber');
const { Op } = require('sequelize');

/**
 * Temps de transfert minimums entre modes de transport (en minutes)
 */
const TRANSFER_TIMES = {
    'avion->avion': 90,      // 1h30 (sécurité, changement terminal)
    'avion->train': 60,      // 1h (trajet aéroport→gare + marge)
    'avion->taxi': 30,       // 30min (taxi disponible rapidement)
    'train->train': 20,      // 20min (même gare)
    'train->avion': 60,      // 1h (trajet gare→aéroport)
    'train->taxi': 15,       // 15min
    'taxi->avion': 45,       // 45min (arriver en avance)
    'taxi->train': 20,       // 20min
    'taxi->taxi': 10         // 10min
};

/**
 * Recherche multimodale intelligente
 * Combine vols, trains et taxis pour proposer des itinéraires complets
 * 
 * @route GET /search/multimodal
 * @query {string} departure - Ville de départ
 * @query {string} destination - Ville de destination
 * @query {date} date - Date du voyage (YYYY-MM-DD)
 * @query {boolean} pmr_required - Filtre accessibilité PMR
 * @query {number} max_price - Prix maximum total
 * @query {number} max_transfers - Nombre max de correspondances
 */
exports.searchMultimodalTrips = async (req, res) => {
    try {
        const { 
            departure, 
            destination, 
            date,
            pmr_required = false,
            max_price = 10000,
            max_transfers = 2
        } = req.query;

        // Validation des paramètres
        if (!departure || !destination) {
            return res.status(400).json({ 
                error: 'Paramètres manquants',
                message: 'Les villes de départ et destination sont requises' 
            });
        }

        console.log(`🔍 Recherche multimodale : ${departure} → ${destination}`);

        // Date de recherche (aujourd'hui si non spécifiée)
        const searchDate = date ? new Date(date) : new Date();
        const endOfDay = new Date(searchDate);
        endOfDay.setHours(23, 59, 59, 999);

        // ==========================================
        // ÉTAPE 1 : Recherche trajets directs
        // ==========================================
        const directTrips = await searchDirectTrips(
            departure, 
            destination, 
            searchDate, 
            endOfDay,
            pmr_required
        );

        // ==========================================
        // ÉTAPE 2 : Recherche trajets avec 1 correspondance
        // ==========================================
        let oneStopTrips = [];
        if (max_transfers >= 1) {
            oneStopTrips = await searchOneStopTrips(
                departure,
                destination,
                searchDate,
                endOfDay,
                pmr_required
            );
        }

        // ==========================================
        // ÉTAPE 3 : Combiner et trier les résultats
        // ==========================================
        let allTrips = [...directTrips, ...oneStopTrips];

        // Filtrer par prix maximum
        allTrips = allTrips.filter(trip => trip.total_price <= max_price);

        // Trier par prix croissant
        allTrips.sort((a, b) => a.total_price - b.total_price);

        // Limiter à 20 résultats
        allTrips = allTrips.slice(0, 20);

        res.status(200).json({
            query: {
                departure,
                destination,
                date: searchDate,
                pmr_required,
                max_price
            },
            results: {
                total: allTrips.length,
                direct: directTrips.length,
                with_transfers: oneStopTrips.length
            },
            trips: allTrips
        });

    } catch (error) {
        console.error('❌ Erreur recherche multimodale:', error);
        res.status(500).json({ 
            error: 'Erreur serveur',
            message: error.message 
        });
    }
};

/**
 * Recherche de trajets directs (1 segment)
 */
async function searchDirectTrips(departure, destination, startDate, endDate, pmrRequired) {
    const trips = [];

    // Recherche vols directs
    const flights = await Vol.findAll({
        where: {
            departure_city: { [Op.like]: `%${departure}%` },
            arrival_city: { [Op.like]: `%${destination}%` },
            departure_time: { [Op.between]: [startDate, endDate] },
            status: 'scheduled',
            ...(pmrRequired && { accessible_pmr: true })
        },
        order: [['price', 'ASC']]
    });

    flights.forEach(flight => {
        trips.push({
            trip_id: `DIRECT_FLIGHT_${flight.flight_id}`,
            type: 'direct',
            segments: [{
                type: 'avion',
                id: flight.flight_id,
                company: flight.company,
                departure: flight.departure_city,
                arrival: flight.arrival_city,
                departure_time: flight.departure_time,
                arrival_time: flight.arrival_time,
                duration: flight.getDuration(),
                price: flight.price,
                pmr_compatible: flight.accessible_pmr,
                pmr_services: flight.pmr_services
            }],
            total_duration: flight.getDuration(),
            total_price: flight.price,
            pmr_compatible: flight.accessible_pmr,
            number_of_transfers: 0
        });
    });

    // Recherche trains directs
    const trains = await Trajet.findAll({
        where: {
            departure_city: { [Op.like]: `%${departure}%` },
            arrival_city: { [Op.like]: `%${destination}%` },
            departure_time: { [Op.between]: [startDate, endDate] },
            status: 'scheduled',
            ...(pmrRequired && { accessible_pmr: true })
        },
        order: [['price', 'ASC']]
    });

    trains.forEach(train => {
        trips.push({
            trip_id: `DIRECT_TRAIN_${train.trajet_id}`,
            type: 'direct',
            segments: [{
                type: 'train',
                id: train.trajet_id,
                company: train.company,
                train_type: train.train_type,
                departure: train.departure_city,
                arrival: train.arrival_city,
                departure_time: train.departure_time,
                arrival_time: train.arrival_time,
                duration: train.getDuration(),
                price: train.price,
                pmr_compatible: train.accessible_pmr,
                pmr_services: train.pmr_services
            }],
            total_duration: train.getDuration(),
            total_price: train.price,
            pmr_compatible: train.accessible_pmr,
            number_of_transfers: 0
        });
    });

    return trips;
}

/**
 * Recherche de trajets avec 1 correspondance
 */
async function searchOneStopTrips(departure, destination, startDate, endDate, pmrRequired) {
    const trips = [];

    // Villes de correspondance courantes
    const hubCities = ['Paris', 'Lyon', 'Marseille', 'Lille', 'Bordeaux'];

    for (const hub of hubCities) {
        // Éviter les correspondances inutiles
        if (hub === departure || hub === destination) continue;

        // ==========================================
        // COMBINAISON 1 : Vol + Train
        // ==========================================
        const firstFlights = await Vol.findAll({
            where: {
                departure_city: { [Op.like]: `%${departure}%` },
                arrival_city: { [Op.like]: `%${hub}%` },
                departure_time: { [Op.between]: [startDate, endDate] },
                status: 'scheduled',
                ...(pmrRequired && { accessible_pmr: true })
            },
            limit: 3
        });

        for (const flight of firstFlights) {
            const minTransferTime = TRANSFER_TIMES['avion->train'];
            const connectionStart = new Date(flight.arrival_time);
            connectionStart.setMinutes(connectionStart.getMinutes() + minTransferTime);

            const secondTrains = await Trajet.findAll({
                where: {
                    departure_city: { [Op.like]: `%${hub}%` },
                    arrival_city: { [Op.like]: `%${destination}%` },
                    departure_time: { 
                        [Op.between]: [connectionStart, endDate] 
                    },
                    status: 'scheduled',
                    ...(pmrRequired && { accessible_pmr: true })
                },
                limit: 2
            });

            secondTrains.forEach(train => {
                const totalDuration = calculateTotalDuration(
                    flight.departure_time,
                    train.arrival_time
                );

                trips.push({
                    trip_id: `COMBO_${flight.flight_id}_${train.trajet_id}`,
                    type: 'avec_correspondance',
                    segments: [
                        {
                            type: 'avion',
                            id: flight.flight_id,
                            company: flight.company,
                            departure: flight.departure_city,
                            arrival: flight.arrival_city,
                            departure_time: flight.departure_time,
                            arrival_time: flight.arrival_time,
                            duration: flight.getDuration(),
                            price: flight.price,
                            pmr_compatible: flight.accessible_pmr,
                            pmr_services: flight.pmr_services
                        },
                        {
                            type: 'train',
                            id: train.trajet_id,
                            company: train.company,
                            train_type: train.train_type,
                            departure: train.departure_city,
                            arrival: train.arrival_city,
                            departure_time: train.departure_time,
                            arrival_time: train.arrival_time,
                            duration: train.getDuration(),
                            price: train.price,
                            pmr_compatible: train.accessible_pmr,
                            pmr_services: train.pmr_services
                        }
                    ],
                    transfer_info: {
                        city: hub,
                        duration: `${minTransferTime}min`,
                        type: 'avion->train'
                    },
                    total_duration: totalDuration,
                    total_price: flight.price + train.price,
                    pmr_compatible: flight.accessible_pmr && train.accessible_pmr,
                    number_of_transfers: 1
                });
            });
        }

        // ==========================================
        // COMBINAISON 2 : Train + Vol
        // ==========================================
        const firstTrains = await Trajet.findAll({
            where: {
                departure_city: { [Op.like]: `%${departure}%` },
                arrival_city: { [Op.like]: `%${hub}%` },
                departure_time: { [Op.between]: [startDate, endDate] },
                status: 'scheduled',
                ...(pmrRequired && { accessible_pmr: true })
            },
            limit: 3
        });

        for (const train of firstTrains) {
            const minTransferTime = TRANSFER_TIMES['train->avion'];
            const connectionStart = new Date(train.arrival_time);
            connectionStart.setMinutes(connectionStart.getMinutes() + minTransferTime);

            const secondFlights = await Vol.findAll({
                where: {
                    departure_city: { [Op.like]: `%${hub}%` },
                    arrival_city: { [Op.like]: `%${destination}%` },
                    departure_time: { 
                        [Op.between]: [connectionStart, endDate] 
                    },
                    status: 'scheduled',
                    ...(pmrRequired && { accessible_pmr: true })
                },
                limit: 2
            });

            secondFlights.forEach(flight => {
                const totalDuration = calculateTotalDuration(
                    train.departure_time,
                    flight.arrival_time
                );

                trips.push({
                    trip_id: `COMBO_${train.trajet_id}_${flight.flight_id}`,
                    type: 'avec_correspondance',
                    segments: [
                        {
                            type: 'train',
                            id: train.trajet_id,
                            company: train.company,
                            train_type: train.train_type,
                            departure: train.departure_city,
                            arrival: train.arrival_city,
                            departure_time: train.departure_time,
                            arrival_time: train.arrival_time,
                            duration: train.getDuration(),
                            price: train.price,
                            pmr_compatible: train.accessible_pmr,
                            pmr_services: train.pmr_services
                        },
                        {
                            type: 'avion',
                            id: flight.flight_id,
                            company: flight.company,
                            departure: flight.departure_city,
                            arrival: flight.arrival_city,
                            departure_time: flight.departure_time,
                            arrival_time: flight.arrival_time,
                            duration: flight.getDuration(),
                            price: flight.price,
                            pmr_compatible: flight.accessible_pmr,
                            pmr_services: flight.pmr_services
                        }
                    ],
                    transfer_info: {
                        city: hub,
                        duration: `${minTransferTime}min`,
                        type: 'train->avion'
                    },
                    total_duration: totalDuration,
                    total_price: train.price + flight.price,
                    pmr_compatible: train.accessible_pmr && flight.accessible_pmr,
                    number_of_transfers: 1
                });
            });
        }
    }

    return trips;
}

/**
 * Calculer la durée totale d'un voyage
 */
function calculateTotalDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
}

/**
 * Recherche de taxis/navettes disponibles
 * 
 * @route GET /search/taxis
 * @query {string} from - Adresse départ
 * @query {string} to - Adresse arrivée
 * @query {boolean} pmr_required - Véhicule PMR requis
 */
exports.searchTaxis = async (req, res) => {
    try {
        const { from, to, pmr_required = false } = req.query;

        if (!from || !to) {
            return res.status(400).json({ 
                error: 'Paramètres manquants',
                message: 'Les adresses de départ et arrivée sont requises' 
            });
        }

        const rides = await Ride.findAll({
            where: {
                adresse_1: { [Op.like]: `%${from}%` },
                adresse_2: { [Op.like]: `%${to}%` },
                status: 'Prévu',
                ...(pmr_required && { accessible_pmr: true })
            },
            order: [['price', 'ASC']],
            limit: 10
        });

        const formattedRides = rides.map(ride => ({
            ride_id: ride.Ride_Id,
            company: ride.company,
            from: ride.adresse_1,
            to: ride.adresse_2,
            departure_time: ride.departure_time,
            arrival_time: ride.arrival_time,
            duration: ride.getDuration(),
            price: ride.price,
            pmr_compatible: ride.accessible_pmr,
            vehicle_type: ride.pmr_vehicle_type,
            pmr_services: ride.pmr_services,
            capacity: ride.vehicle_capacity
        }));

        res.status(200).json({
            query: { from, to, pmr_required },
            results: formattedRides.length,
            rides: formattedRides
        });

    } catch (error) {
        console.error('❌ Erreur recherche taxis:', error);
        res.status(500).json({ 
            error: 'Erreur serveur',
            message: error.message 
        });
    }
};

module.exports = exports;
