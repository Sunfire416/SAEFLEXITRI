const { Trajet } = require('../../models/SNCF');

// Ensure the Trajet table exists in the SNCF MySQL database.
let trajetSynced = false;
const ensureTrajetSynced = async () => {
    if (!trajetSynced) {
        await Trajet.sync();
        trajetSynced = true;
    }
};

// Récupérer tous les trajets
exports.getAllTrajet = async (req, res) => {
    try {
        // Récupération des trajets
        await ensureTrajetSynced();
        const trajet = await Trajet.findAll();
        res.status(200).json(trajet); // Retour des trajets trouvés
    } catch (error) {
        console.error("Erreur lors de la récupération des trajets :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des trajets" });
    }
};
// Récupérer un trajet par l'ID des gares de départ et d'arrivée
exports.getTrajetByGareId = async (req, res) => {
    const { departure_gare_id, arrival_gare_id } = req.params;
    try {
        await ensureTrajetSynced();
        const trajet = await Trajet.findOne({
            where: {
                departure_gare_id: departure_gare_id,
                arrival_gare_id: arrival_gare_id
            }
        });
        if (trajet) {
            res.status(200).json(trajet);
        } else {
            res.status(404).json({ message: "Trajet non trouvé" });
        }
    } catch (error) {
        console.error("Erreur lors de la récupération du trajet :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération du trajet" });
    }
};
// Récupérer un trajet par son ID
exports.getTrajetById = async (req, res) => {
    const { id } = req.params; // Récupération de l'ID du trajet
    try {
        // Recherche du trajet par ID
        await ensureTrajetSynced();
        const trajet = await Trajet.findByPk(id);
        if (trajet) {
            res.status(200).json(trajet); // Si trouvé, retourner le trajet
        } else {
            res.status(404).json({ message: "Trajet non trouvé" }); // Si non trouvé, retour d'une erreur
        }
    } catch (error) {
        console.error("Erreur lors de la récupération du trajet :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération du trajet" });
    }
};

// Créer un trajet
exports.createTrajetSNCF = async (req, res) => {
    console.log("📥 Données reçues:", req.body); // LOG 1
    
    const { departure, destination, price, trajet_id, company, available_seats, 
            max_weight_suitcase, departure_gare_id, arrival_gare_id, 
            departure_time, arrival_time, status } = req.body;
    
    try {
        await ensureTrajetSynced();
        const now = new Date();
        
        const dataToInsert = {
            trajet_id: trajet_id || `SNCF-${Date.now()}`,
            company: company || 'SNCF',
            available_seats: available_seats || 100,
            price: price ?? 0,
            max_weight_suitcase: max_weight_suitcase || 20,
            departure_gare_id: departure_gare_id || 1,
            arrival_gare_id: arrival_gare_id || 2,
            departure_time: departure_time || now,
            arrival_time: arrival_time || new Date(now.getTime() + 2 * 60 * 60 * 1000),
            status: status || 'scheduled'
        };
        
        console.log("💾 Données à insérer:", dataToInsert); // LOG 2
        
        const newtrajet = await Trajet.create(dataToInsert);
        
        console.log("✅ Trajet créé:", newtrajet.toJSON()); // LOG 3
        
        res.status(201).json(newtrajet);
    } catch (error) {
        console.error("❌ ERREUR COMPLÈTE:", error); // LOG 4
        console.error("❌ Message:", error.message); // LOG 5
        console.error("❌ SQL:", error.sql); // LOG 6
        res.status(500).json({ 
            message: "Erreur serveur lors de la création du trajet",
            error: error.message 
        });
    }
};

// Mettre à jour un vol
exports.updateTrajet = async (req, res) => {
    const { id } = req.params;
    const { trajet_id, company, available_seats, price, max_weight_suitcase, departure_gare_id, arrival_gare_id, departure_time, arrival_time, status } = req.body;
    try {
        const trajet = await Trajet.findByPk(id);
        if (flight) {
            trajet.trajet_id = trajet_id || trajet.trajet_id;
            trajet.company = company || trajet.company;
            trajet.available_seats = available_seats || trajet.available_seats;
            trajet.price = price || trajet.price;
            trajet.max_weight_suitcase = max_weight_suitcase || trajet.max_weight_suitcase;
            trajet.departure_gare_id = departure_gare_id || trajet.departure_gare_id;
            trajet.arrival_gare_id = arrival_gare_id || trajet.arrival_gare_id;
            trajet.departure_time = departure_time || trajet.departure_time;
            trajet.arrival_time = arrival_time || trajet.arrival_time;
            trajet.status = status || trajet.status;

            await flight.save();
            res.status(200).json(trajet);
        } else {
            res.status(404).json({ message: "Trajet non trouvé" });
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour du trajet :", error);
        res.status(500).json({ message: "Erreur serveur lors de la mise à jour du Trajet" });
    }
};

// Supprimer un vol
exports.deleteTrajet = async (req, res) => {
    const { id } = req.params;
    try {
        const trajet = await Trajet.findByPk(id);
        if (trajet) {
            await trajet.destroy();
            res.status(200).json({ message: "trajet supprimé avec succès" });
        } else {
            res.status(404).json({ message: "trajet non trouvé" });
        }
    } catch (error) {
        console.error("Erreur lors de la suppression du trajet :", error);
        res.status(500).json({ message: "Erreur serveur lors de la suppression du trajet" });
    }
};



// Récupérer tous les vols sous forme d'offre
exports.getAllTrajetAmadeusModel = async (req, res) => {
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
        const trajet = await Trajet.findAll({
            include: [
                { model: Gare, as: 'departure_gare' },
                { model: Gare, as: 'arrival_gare' }
            ],
            where: {
                departure_gare_iata_code: originLocationCode || undefined,
                arrival_gare_iata_code: destinationLocationCode || undefined,
                departure_time: departureDate ? { [Op.gte]: new Date(departureDate) } : undefined,
                arrival_time: returnDate ? { [Op.lte]: new Date(returnDate) } : undefined,
                price: maxPrice ? { [Op.lte]: maxPrice } : undefined
            },
            limit: max
        });

        // Formater les résultats dans le format requis
        const TrajetOffers = trajet.map(trajet => ({
            type: "trajet-offer",
            id: trajet.trajet_id,
            source: "RATP",  // Source fictive ici, peut être ajustée selon vos besoins
            instantTicketingRequired: false,  // A ajuster selon le contexte réel
            nonHomogeneous: false,  // A ajuster selon le contexte réel
            oneWay: false,  // Si le vol est aller simple ou aller-retour
            lastTicketingDate: new Date().toISOString(),  // Exemple de date actuelle
            numberOfBookableSeats: trajet.available_seats,
            itineraries: [
                {
                    duration: `PT${Math.floor(Math.random() * 10) + 5}H${Math.floor(Math.random() * 60)}M`,  // Durée aléatoire pour l'exemple
                    segments: [
                        {
                            departure: {
                                iataCode: trajet.departure_gare.iata_code,
                                at: flight.departure_time.toISOString()
                            },
                            arrival: {
                                iataCode: trajet.arrival_gare.iata_code,
                                at: trajet.arrival_time.toISOString()
                            },
                            carrierCode: trajet.company,  // Nom de la compagnie aérienne
                            number: trajet.trajet_id,  // Numéro du vol
                            aircraft: {
                                code: "777"  // Code de l'avion, exemple fictif ici
                            },
                            operating: {
                                carrierCode: trajet.company  // Code de la compagnie opérant le vol
                            },
                            duration: `PT${Math.floor(Math.random() * 5) + 4}H${Math.floor(Math.random() * 60)}M`,  // Durée aléatoire pour l'exemple
                            id: trajet.trajet_id,
                            numberOfStops: 0,  // Ici, on suppose que tous les vols sont directs
                            blacklistedInEU: false  // Exemple fictif, ajuster selon les règles
                        }
                    ]
                }
            ]
        }));

        // Envoyer la réponse au format requis
        res.status(200).json({ data: TrajetOffers });
    } catch (error) {
        console.error("Erreur lors de la récupération des trajets :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des trajets" });
    }
};