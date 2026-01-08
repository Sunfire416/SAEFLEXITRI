const { Vol} = require('../../models/AF');
const { Airports } = require('../../models/AF');


// Récupérer tous les vols
exports.getAllFlights = async (req, res) => {
    try {
        const flights = await Vol.findAll();
        res.status(200).json(flights);
    } catch (error) {
        console.error("Erreur lors de la récupération des vols :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des vols" });
    }
};

// Récupérer un vol par son ID
exports.getFlightById = async (req, res) => {
    const { id } = req.params;
    try {
        const flight = await Vol.findByPk(id);
        if (flight) {
            res.status(200).json(flight);
        } else {
            res.status(404).json({ message: "Vol non trouvé" });
        }
    } catch (error) {
        console.error("Erreur lors de la récupération du vol :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération du vol" });
    }
};

// Récupérer un vol par l'ID des aéroports de départ et d'arrivée
exports.getFlightByAirportId = async (req, res) => {
    const { departure_airport_id, arrival_airport_id } = req.params;
    try {
        const flight = await Vol.findAll({
            where: {
                departure_airport_id: departure_airport_id,
                arrival_airport_id: arrival_airport_id
            }
        });
        if (flight) {
            res.status(200).json(flight);
        } else {
            res.status(404).json({ message: "Vol non trouvé" });
        }
    } catch (error) {
        console.error("Erreur lors de la récupération du vol :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération du vol" });
    }
};




// Créer un vol
exports.createFlight = async (req, res) => {
    const { flight_id, company, available_seats, price, max_weight_suitcase, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status } = req.body;
    try {
        const newFlight = await Vol.create({
            flight_id,
            company,
            available_seats,
            price,
            max_weight_suitcase,
            departure_airport_id,
            arrival_airport_id,
            departure_time,
            arrival_time,
            status
        });
        res.status(201).json(newFlight);
    } catch (error) {
        console.error("Erreur lors de la création du vol :", error);
        res.status(500).json({ message: "Erreur serveur lors de la création du vol" });
    }
};

// Mettre à jour un vol
exports.updateFlight = async (req, res) => {
    const { id } = req.params;
    const { flight_id, company, available_seats, price, max_weight_suitcase, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status } = req.body;
    try {
        const flight = await Vol.findByPk(id);
        if (flight) {
            flight.flight_id = flight_id || flight.flight_id;
            flight.company = company || flight.company;
            flight.available_seats = available_seats || flight.available_seats;
            flight.price = price || flight.price;
            flight.max_weight_suitcase = max_weight_suitcase || flight.max_weight_suitcase;
            flight.departure_airport_id = departure_airport_id || flight.departure_airport_id;
            flight.arrival_airport_id = arrival_airport_id || flight.arrival_airport_id;
            flight.departure_time = departure_time || flight.departure_time;
            flight.arrival_time = arrival_time || flight.arrival_time;
            flight.status = status || flight.status;

            await flight.save();
            res.status(200).json(flight);
        } else {
            res.status(404).json({ message: "Vol non trouvé" });
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour du vol :", error);
        res.status(500).json({ message: "Erreur serveur lors de la mise à jour du vol" });
    }
};

// Supprimer un vol
exports.deleteFlight = async (req, res) => {
    const { id } = req.params;
    try {
        const flight = await Vol.findByPk(id);
        if (flight) {
            await flight.destroy();
            res.status(200).json({ message: "Vol supprimé avec succès" });
        } else {
            res.status(404).json({ message: "Vol non trouvé" });
        }
    } catch (error) {
        console.error("Erreur lors de la suppression du vol :", error);
        res.status(500).json({ message: "Erreur serveur lors de la suppression du vol" });
    }
};



// Récupérer tous les vols sous forme d'offre
exports.getAllFlightsAmadeusModel = async (req, res) => {
    const {
        originLocationCode, // Code IATA de l'aéroport d'origine
        destinationLocationCode, // Code IATA de l'aéroport de destination
        departureDate, // Date de départ
        returnDate, // Date de retour
        adults = 1, // Nombre d'adultes
        children = 0, // Nombre d'enfants
        infants = 0, // Nombre de nourrissons
        travelClass, // Classe de voyage (Economy, Premium Economy, Business, First)
        includedAirlineCodes, // Codes des compagnies aériennes incluses
        excludedAirlineCodes, // Codes des compagnies aériennes exclues
        nonStop = false, // Vol direct ou non
        currencyCode, // Code de la devise préférée
        maxPrice, // Prix maximum
        max = 250 // Nombre maximum de résultats à retourner
    } = req.query;

    try {
        const flights = await Vol.findAll({
            include: [
                { model: Airports, as: 'departure_airport' },
                { model: Airports, as: 'arrival_airport' }
            ],
            where: {
                departure_airport_iata_code: originLocationCode || undefined,
                arrival_airport_iata_code: destinationLocationCode || undefined,
                departure_time: departureDate ? { [Op.gte]: new Date(departureDate) } : undefined,
                arrival_time: returnDate ? { [Op.lte]: new Date(returnDate) } : undefined,
                price: maxPrice ? { [Op.lte]: maxPrice } : undefined
            },
            limit: max
        });

        // Formater les résultats dans le format requis
        const flightOffers = flights.map(flight => ({
            type: "flight-offer",
            id: flight.flight_id,
            source: "GDS",  // Source fictive ici, peut être ajustée selon vos besoins
            instantTicketingRequired: false,  // A ajuster selon le contexte réel
            nonHomogeneous: false,  // A ajuster selon le contexte réel
            oneWay: false,  // Si le vol est aller simple ou aller-retour
            lastTicketingDate: new Date().toISOString(),  // Exemple de date actuelle
            numberOfBookableSeats: flight.available_seats,
            itineraries: [
                {
                    duration: `PT${Math.floor(Math.random() * 10) + 5}H${Math.floor(Math.random() * 60)}M`,  // Durée aléatoire pour l'exemple
                    segments: [
                        {
                            departure: {
                                iataCode: flight.departure_airport.iata_code,
                                at: flight.departure_time.toISOString()
                            },
                            arrival: {
                                iataCode: flight.arrival_airport.iata_code,
                                at: flight.arrival_time.toISOString()
                            },
                            carrierCode: flight.company,  // Nom de la compagnie aérienne
                            number: flight.flight_id,  // Numéro du vol
                            aircraft: {
                                code: "777"  // Code de l'avion, exemple fictif ici
                            },
                            operating: {
                                carrierCode: flight.company  // Code de la compagnie opérant le vol
                            },
                            duration: `PT${Math.floor(Math.random() * 5) + 4}H${Math.floor(Math.random() * 60)}M`,  // Durée aléatoire pour l'exemple
                            id: flight.flight_id,
                            numberOfStops: 0,  // Ici, on suppose que tous les vols sont directs
                            blacklistedInEU: false  // Exemple fictif, ajuster selon les règles
                        }
                    ]
                }
            ]
        }));

        // Envoyer la réponse au format requis
        res.status(200).json({ data: flightOffers });
    } catch (error) {
        console.error("Erreur lors de la récupération des vols :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des vols" });
    }
};