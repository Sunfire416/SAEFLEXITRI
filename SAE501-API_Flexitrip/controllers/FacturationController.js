const { Facturation, Reservations } = require('../models');


exports.createFacture = async (req, res) => {
    try {
        const { reservation_id, amount, payment_status } = req.body;

        // Vérifier si la réservation existe
        const reservation = await Reservations.findByPk(reservation_id);
        if (!reservation) {
            return res.status(404).json({ message: "Réservation non trouvée." });
        }

        const facture = await Facturation.create({
            reservation_id,
            amount,
            payment_status
        });

        res.status(201).json(facture);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la création de la facture." });
    }
};

// Récupérer toutes les factures
exports.getAllFactures = async (req, res) => {
    try {
        const factures = await Facturation.findAll({
            include: [
                {
                    model: Reservations,
                    as: 'reservation', // Alias défini dans le modèle
                    attributes: ['reservation_id', 'user_id', 'price'] // Attributs à inclure
                }
            ]
        });
        res.status(200).json(factures);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des factures." });
    }
};

// Récupérer une facture par ID
exports.getFactureById = async (req, res) => {
    try {
        const { id } = req.params;

        const facture = await Facturation.findByPk(id, {
            include: [
                {
                    model: Reservations,
                    as: 'reservation'
                }
            ]
        });

        if (!facture) {
            return res.status(404).json({ message: "Facture non trouvée." });
        }

        res.status(200).json(facture);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération de la facture." });
    }
};

// Mettre à jour une facture
exports.updateFacture = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, payment_status } = req.body;

        const facture = await Facturation.findByPk(id);

        if (!facture) {
            return res.status(404).json({ message: "Facture non trouvée." });
        }

        // Mise à jour des champs
        facture.amount = amount ?? facture.amount;
        facture.payment_status = payment_status ?? facture.payment_status;
        await facture.save();

        res.status(200).json(facture);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la mise à jour de la facture." });
    }
};

// Supprimer une facture
exports.deleteFacture = async (req, res) => {
    try {
        const { id } = req.params;

        const facture = await Facturation.findByPk(id);

        if (!facture) {
            return res.status(404).json({ message: "Facture non trouvée." });
        }

        await facture.destroy();
        res.status(200).json({ message: "Facture supprimée avec succès." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la suppression de la facture." });
    }
};
