const { Gare } = require('../../models/SNCF'); // Assurez-vous que les modèles Vol et Airports sont correctement importés

// --- Gare ---

// Récupérer tous les gares
exports.getAllGare = async (req, res) => {
    try {
        const gare = await Gare.findAll();
        res.status(200).json(gare);
    } catch (error) {
        console.error("Erreur lors de la récupération des gares :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des gares" });
    }
};

// Récupérer une gare par son ID
exports.getGareById = async (req, res) => {
    const { id } = req.params;
    try {
        const gare = await Gare.findByPk(id);
        if (gare) {
            res.status(200).json(gare);
        } else {
            res.status(404).json({ message: "Gare non trouvé" });
        }
    } catch (error) {
        console.error("Erreur lors de la récupération de la gare :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération de la gare" });
    }
};

// Créer une gare
exports.createGare = async (req, res) => {
    const { name, city, country, iata_code, icao_code, latitude, longitude } = req.body;
    try {
        const newgare = await Gare.create({ name, city, country, iata_code, icao_code, latitude, longitude });
        res.status(201).json(newgare);
    } catch (error) {
        console.error("Erreur lors de la création de la gare :", error);
        res.status(500).json({ message: "Erreur serveur lors de la création de la gare" });
    }
};

// Mettre à jour une gare
exports.updateAirport = async (req, res) => {
    const { id } = req.params;
    const { name, city, country, iata_code, icao_code, latitude, longitude } = req.body;
    try {
        const gare = await Gare.findByPk(id);
        if (gare) {
            gare.name = name || gare.name;
            gare.city = city || gare.city;
            gare.country = country || gare.country;
            gare.iata_code = iata_code || gare.iata_code;
            gare.icao_code = icao_code || gare.icao_code;
            gare.latitude = latitude || gare.latitude;
            gare.longitude = longitude || gare.longitude;

            await gare.save();
            res.status(200).json(gare);
        } else {
            res.status(404).json({ message: "Gare non trouvé" });
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la gare :", error);
        res.status(500).json({ message: "Erreur serveur lors de la mise à jour de la gare" });
    }
};

// Supprimer une gare
exports.deleteGare = async (req, res) => {
    const { id } = req.params;
    try {
        const gare = await Gare.findByPk(id);
        if (gare) {
            await gare.destroy();
            res.status(200).json({ message: "Gare supprimé avec succès" });
        } else {
            res.status(404).json({ message: "Gare non trouvé" });
        }
    } catch (error) {
        console.error("Erreur lors de la suppression de la Gare :", error);
        res.status(500).json({ message: "Erreur serveur lors de la suppression de la gare" });
    }
};