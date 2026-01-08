const { Airports } = require('../../models/AF'); // Assurez-vous que les modèles Vol et Airports sont correctement importés

// --- AÉROPORTS ---

// Récupérer tous les aéroports
exports.getAllAirports = async (req, res) => {
    try {
        const airports = await Airports.findAll();
        res.status(200).json(airports);
    } catch (error) {
        console.error("Erreur lors de la récupération des aéroports :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des aéroports" });
    }
};

// Récupérer un aéroport par son ID
exports.getAirportById = async (req, res) => {
    const { id } = req.params;
    try {
        const airport = await Airports.findByPk(id);
        if (airport) {
            res.status(200).json(airport);
        } else {
            res.status(404).json({ message: "Aéroport non trouvé" });
        }
    } catch (error) {
        console.error("Erreur lors de la récupération de l'aéroport :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération de l'aéroport" });
    }
};

// Créer un aéroport
exports.createAirport = async (req, res) => {
    const { name, city, country, iata_code, icao_code, latitude, longitude } = req.body;
    try {
        const newAirport = await Airports.create({ name, city, country, iata_code, icao_code, latitude, longitude });
        res.status(201).json(newAirport);
    } catch (error) {
        console.error("Erreur lors de la création de l'aéroport :", error);
        res.status(500).json({ message: "Erreur serveur lors de la création de l'aéroport" });
    }
};

// Mettre à jour un aéroport
exports.updateAirport = async (req, res) => {
    const { id } = req.params;
    const { name, city, country, iata_code, icao_code, latitude, longitude } = req.body;
    try {
        const airport = await Airports.findByPk(id);
        if (airport) {
            airport.name = name || airport.name;
            airport.city = city || airport.city;
            airport.country = country || airport.country;
            airport.iata_code = iata_code || airport.iata_code;
            airport.icao_code = icao_code || airport.icao_code;
            airport.latitude = latitude || airport.latitude;
            airport.longitude = longitude || airport.longitude;

            await airport.save();
            res.status(200).json(airport);
        } else {
            res.status(404).json({ message: "Aéroport non trouvé" });
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'aéroport :", error);
        res.status(500).json({ message: "Erreur serveur lors de la mise à jour de l'aéroport" });
    }
};

// Supprimer un aéroport
exports.deleteAirport = async (req, res) => {
    const { id } = req.params;
    try {
        const airport = await Airports.findByPk(id);
        if (airport) {
            await airport.destroy();
            res.status(200).json({ message: "Aéroport supprimé avec succès" });
        } else {
            res.status(404).json({ message: "Aéroport non trouvé" });
        }
    } catch (error) {
        console.error("Erreur lors de la suppression de l'aéroport :", error);
        res.status(500).json({ message: "Erreur serveur lors de la suppression de l'aéroport" });
    }
};