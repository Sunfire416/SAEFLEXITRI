const { reservations_trajet_Uber } = require('../../models/Uber'); // Modèle à utiliser

// Récupérer tous les trajets
exports.getAllTrajet = async (req, res) => {
    try {
        const trajets = await reservations_trajet_Uber.findAll();
        res.status(200).json(trajets);
    } catch (error) {
        console.error("Erreur lors de la récupération des trajets :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des trajets" });
    }
};

// Récupérer un trajet par son ID
exports.getTrajetById = async (req, res) => {
    const { id } = req.params;
    try {
        const trajet = await reservations_trajet_Uber.findByPk(id);
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

// Créer un trajet
exports.createTrajet = async (req, res) => {
    const {
        Nom,
        prenom,
        Num_reza_PAX,
        Num_reza_MMT,
        Enregistre = 0,
        Assistance_PMR,
        id_Ride,  // Remplacé Mail_Agent par id_Ride
        adresse_1,
        adresse_2,
        Bagage_Verifié,
    } = req.body;

    try {
        const newTrajet = await reservations_trajet_Uber.create({
            Nom,
            prenom,
            Num_reza_PAX,
            Num_reza_MMT,
            Enregistre,
            Assistance_PMR,
            id_Ride,  // Remplacé Mail_Agent par id_Ride
            adresse_1,
            adresse_2,
            Bagage_Verifié,
        });
        res.status(201).json(newTrajet);
    } catch (error) {
        console.error("Erreur lors de la création du trajet :", error);
        res.status(500).json({ message: "Erreur serveur lors de la création du trajet" });
    }
};

// Mettre à jour un trajet
exports.updateTrajet = async (req, res) => {
    const { id } = req.params;
    const {
        Nom,
        prenom,
        Num_reza_PAX,
        Num_reza_MMT,
        Enregistre,
        Assistance_PMR,
        id_Ride,  // Remplacé Mail_Agent par id_Ride
        adresse_1,
        adresse_2,
        Bagage_Verifié,
    } = req.body;

    try {
        const trajet = await reservations_trajet_Uber.findByPk(id);
        if (trajet) {
            await trajet.update({
                Nom,
                prenom,
                Num_reza_PAX,
                Num_reza_MMT,
                Enregistre,
                Assistance_PMR,
                id_Ride,  // Remplacé Mail_Agent par id_Ride
                adresse_1,
                adresse_2,
                Bagage_Verifié,
            });
            res.status(200).json(trajet);
        } else {
            res.status(404).json({ message: "Trajet non trouvé" });
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour du trajet :", error);
        res.status(500).json({ message: "Erreur serveur lors de la mise à jour du trajet" });
    }
};

// Supprimer un trajet
exports.deleteTrajet = async (req, res) => {
    const { id } = req.params;
    try {
        const trajet = await reservations_trajet_Uber.findByPk(id);
        if (trajet) {
            await trajet.destroy();
            res.status(200).json({ message: "Trajet supprimé avec succès" });
        } else {
            res.status(404).json({ message: "Trajet non trouvé" });
        }
    } catch (error) {
        console.error("Erreur lors de la suppression du trajet :", error);
        res.status(500).json({ message: "Erreur serveur lors de la suppression du trajet" });
    }
};
