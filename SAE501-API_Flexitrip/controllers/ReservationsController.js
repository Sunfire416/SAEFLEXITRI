const { Reservations, Voyage, User, Facturation } = require('../models');
const { addBlock } = require('./BlockchainController');

const sequelizeSAE_AF = require('../config/databaseAF');
const sequelizeSAE_SNCF = require('../config/databaseSNCF');
const { sequelize } = require('../config/database');
const sequelizeSAE_UBER = require('../config/databaseUBER');

const { generateRandomCode } = require('./utils/utils');
const { reservation_trajet } = require('../models/SNCF');
const { reservation_vol, Vol } = require('../models/AF/');
const { reservations_trajet_Uber } = require('../models/Uber');

/**
 * AMÉLIORATION : Réservation avec paiement wallet automatique
 * 
 * @route POST /reservations/insert
 * @body {number} user_id - ID de l'utilisateur
 * @body {number} id_voyage - ID du voyage MongoDB
 * @body {boolean} assistanceBesoin - Assistance PMR requise
 * @body {object} pmr_options - Options PMR détaillées (optionnel)
 */
exports.doReservationOfTravel = async (req, res) => {
    const t_AF = await sequelizeSAE_AF.transaction();
    const t_SNCF = await sequelizeSAE_SNCF.transaction();
    const t_UBER = await sequelizeSAE_UBER.transaction();
    const t_Multi = await sequelize.transaction();

    try {
        const { user_id, id_voyage, assistanceBesoin, pmr_options = {} } = req.body;

        // Validation des données d'entrée
        if (!user_id || !id_voyage) {
            return res.status(400).json({ 
                message: "Données manquantes : user_id ou id_voyage." 
            });
        }

        // Recherche du voyage dans MongoDB
        const voyage = await Voyage.findOne({ id_voyage });
        if (!voyage) {
            return res.status(404).json({ message: "Voyage introuvable." });
        }

        // Validation de l'association utilisateur-voyage
        if (user_id !== voyage.id_pmr) {
            return res.status(403).json({ 
                message: "Utilisateur non associé à ce voyage." 
            });
        }

        // Recherche de l'utilisateur
        const user_register = await User.findByPk(user_id);
        if (!user_register) {
            return res.status(404).json({ message: "Utilisateur introuvable." });
        }

        // ==========================================
        // NOUVEAU : Vérification du solde wallet
        // ==========================================
        const { prix_total } = voyage;
        
        if (user_register.solde < prix_total) {
            const manquant = prix_total - user_register.solde;
            return res.status(402).json({
                error: 'Solde insuffisant',
                message: 'Votre solde est insuffisant pour effectuer cette réservation',
                solde_actuel: user_register.solde,
                prix_total: prix_total,
                manquant: manquant,
                actions_possibles: [
                    { 
                        type: 'recharger', 
                        montant_min: manquant,
                        url: '/user/ewallet'
                    },
                    { type: 'annuler' }
                ]
            });
        }

        const { etapes } = voyage;
        const num_reza_MMT = generateRandomCode(20);
        const reservationsList = [];

        // Créer une facture
        const facturation = await Facturation.create(
            {
                amount: prix_total,
                payment_status: "Payé",
                date_payement: new Date(),
                id_user: user_id,
                type: "Billet_Voyage",
            },
            { transaction: t_Multi }
        );

        let compteur_etape = 1;

        // Parcourir les étapes et créer les réservations
        for (const etape of etapes) {
            const num_pax = generateRandomCode(20);

            switch (etape.type) {
                case "avion":
                    await reservation_vol.create(
                        {
                            nom: user_register.name,
                            prenom: user_register.surname,
                            num_reza_PAX: num_pax,
                            num_reza_MMT: num_reza_MMT,
                            enregistre: false,
                            assistance_PMR: assistanceBesoin,
                            id_vol: etape.id,
                            bagage_verifie: false,
                        },
                        { transaction: t_AF }
                    );
                    break;

                case "train":
                    await reservation_trajet.create(
                        {
                            nom: user_register.name,
                            prenom: user_register.surname,
                            num_reza_PAX: num_pax,
                            num_reza_MMT: num_reza_MMT,
                            enregistre: false,
                            assistance_PMR: assistanceBesoin,
                            id_trajet: etape.id,
                            bagage_verifie: false,
                        },
                        { transaction: t_SNCF }
                    );
                    break;

                case "taxi":
                    await reservations_trajet_Uber.create(
                        {
                            Nom: user_register.name,
                            prenom: user_register.surname,
                            Num_reza_PAX: num_pax,
                            Num_reza_MMT: num_reza_MMT,
                            Enregistre: false,
                            Assistance_PMR: assistanceBesoin ? 'Oui' : 'Non',
                            id_Ride: etape.id,
                            Bagage_Vérifié: false,
                        },
                        { transaction: t_UBER }
                    );
                    break;

                default:
                    throw new Error(`Type de transport '${etape.type}' non pris en charge.`);
            }

            // Ajouter une réservation dans la table Reservations
            const reservation = await Reservations.create(
                {
                    user_id,
                    num_pax,
                    num_reza_mmt: num_reza_MMT,
                    enregistre: false,
                    assistance_PMR: assistanceBesoin ? 'Oui' : 'Non',
                    Type_Transport: etape.type,
                    Facturation_Id: facturation.billing_id,
                    id_voyage,
                    etape_voyage: compteur_etape,
                    date_reservation: new Date(),
                    pmr_options: pmr_options, // NOUVEAU : Options PMR détaillées
                    ticket_status: 'pending'  // NOUVEAU : Statut du billet
                },
                { transaction: t_Multi }
            );
            
            reservationsList.push(reservation);
            compteur_etape++;
        }

        // ==========================================
        // NOUVEAU : Paiement via wallet (blockchain)
        // ==========================================
        try {
            // Effectuer la transaction blockchain
            const paymentData = {
                sender: user_id.toString(),
                receiver: '1', // ID système FlexiTrip
                amount: prix_total
            };

            // Simuler l'appel au contrôleur blockchain
            // (Dans un vrai système, on appellerait directement la fonction)
            const paymentResult = await processWalletPayment(
                user_id, 
                prix_total, 
                t_Multi
            );

            if (!paymentResult.success) {
                throw new Error('Échec du paiement wallet');
            }

            console.log('✅ Paiement wallet réussi:', prix_total, '€');

        } catch (paymentError) {
            console.error('❌ Erreur paiement wallet:', paymentError);
            
            // Rollback de toutes les transactions
            await t_Multi.rollback();
            await t_UBER.rollback();
            await t_SNCF.rollback();
            await t_AF.rollback();

            return res.status(500).json({
                error: 'Échec du paiement',
                message: 'Le paiement via wallet a échoué. Réservation annulée.',
                details: paymentError.message
            });
        }

        // Valider toutes les transactions
        await t_Multi.commit();
        await t_UBER.commit();
        await t_SNCF.commit();
        await t_AF.commit();

        res.status(201).json({
            message: "Réservations créées et payées avec succès.",
            reservations: reservationsList,
            payment: {
                amount: prix_total,
                method: 'wallet',
                status: 'completed'
            },
            next_steps: [
                'Générer le billet unique',
                'Recevoir confirmation par email',
                'Enregistrement disponible 24h avant départ'
            ]
        });

    } catch (error) {
        console.error(error);
        await t_Multi.rollback();
        await t_UBER.rollback();
        await t_SNCF.rollback();
        await t_AF.rollback();

        res.status(500).json({ 
            message: "Erreur lors de la création des réservations.", 
            error: error.message 
        });
    }
};

/**
 * Fonction helper pour traiter le paiement wallet
 */
async function processWalletPayment(userId, amount, transaction) {
    try {
        // Récupérer l'utilisateur
        const user = await User.findByPk(userId, { transaction });
        
        if (!user) {
            throw new Error('Utilisateur introuvable');
        }

        if (user.solde < amount) {
            throw new Error('Solde insuffisant');
        }

        // Débiter le compte
        user.solde -= amount;
        await user.save({ transaction });

        console.log(`💳 Wallet débité : ${amount}€ (nouveau solde: ${user.solde}€)`);

        return { success: true, new_balance: user.solde };

    } catch (error) {
        console.error('Erreur processWalletPayment:', error);
        return { success: false, error: error.message };
    }
}

// ==========================================
// ANCIENNES FONCTIONS (CONSERVÉES)
// ==========================================

// Récupérer toutes les réservations
exports.getAllReservations = async (req, res) => {
    try {
        const allReservations = await Reservations.findAll();
        res.status(200).json(allReservations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des réservations." });
    }
};

// Récupérer une réservation par ID
exports.getReservationById = async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await Reservations.findByPk(id);

        if (!reservation) {
            return res.status(404).json({ message: "Réservation non trouvée." });
        }

        res.status(200).json(reservation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération de la réservation." });
    }
};

// Récupérer une réservation par user_id
exports.getReservationByUserId = async (req, res) => {
    try {
        const { id_user } = req.params;
        const reservation = await Reservations.findAll({ where: { user_id: id_user } });

        if (!reservation) {
            return res.status(404).json({ message: "Réservation non trouvée." });
        }

        res.status(200).json(reservation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération de la réservation." });
    }
};

// Mettre à jour une réservation
exports.updateReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, num_reza_mmt, num_pax, enregistre, assistance_PMR, Type_Transport, Facturation_Id, id_voyage, pmr_options } = req.body;

        const reservation = await Reservations.findByPk(id);

        if (!reservation) {
            return res.status(404).json({ message: "Réservation non trouvée." });
        }

        // Mise à jour des champs
        reservation.user_id = user_id ?? reservation.user_id;
        reservation.num_reza_mmt = num_reza_mmt ?? reservation.num_reza_mmt;
        reservation.num_pax = num_pax ?? reservation.num_pax;
        reservation.enregistre = enregistre ?? reservation.enregistre;
        reservation.assistance_PMR = assistance_PMR ?? reservation.assistance_PMR;
        reservation.Type_Transport = Type_Transport ?? reservation.Type_Transport;
        reservation.Facturation_Id = Facturation_Id ?? reservation.Facturation_Id;
        reservation.id_voyage = id_voyage ?? reservation.id_voyage;
        reservation.pmr_options = pmr_options ?? reservation.pmr_options; // NOUVEAU

        await reservation.save();

        res.status(200).json(reservation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la mise à jour de la réservation." });
    }
};

// Supprimer une réservation
exports.deleteReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await Reservations.findByPk(id);

        if (!reservation) {
            return res.status(404).json({ message: "Réservation non trouvée." });
        }

        await reservation.destroy();
        res.status(200).json({ message: "Réservation supprimée avec succès." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la suppression de la réservation." });
    }
};

// Fonction pour récupérer l'objet voyage associé à une réservation
exports.getVoyageObjectOfReservations = async (req, res) => {
    const { reservationId } = req.params;

    try {
        const reservation = await Reservations.findByPk(reservationId);

        if (!reservation) {
            return res.status(404).json({ error: 'Réservation non trouvée' });
        }

        const voyage = await Voyage.findOne({ id_voyage: reservation.id_voyage });

        if (!voyage) {
            return res.status(404).json({ error: 'Voyage associé non trouvé' });
        }

        res.status(200).json(voyage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
};

// Mettre à jour "enregistre" pour un voyage spécifique
exports.updateEnregistreByVoyageId = async (req, res) => {
    try {
        const id_voyage = req.body.id_voyage;
        const etat = req.body.etat || req.body.etat;

        if (id_voyage === undefined || etat === undefined) {
            return res.status(400).json({ message: "Données manquantes : id_voyage ou etat." });
        }

        const reservations = await Reservations.findAll({ where: { id_voyage } });

        if (reservations.length === 0) {
            return res.status(404).json({ message: "Aucune réservation trouvée pour ce voyage." });
        }

        const allSameState = reservations.every(r => r.enregistre === etat);

        if (allSameState) {
            return res.status(200).json({
                message: "Les réservations sont déjà dans l'etat souhaité.",
                etat
            });
        }

        const [updatedRows] = await Reservations.update(
            { enregistre: etat },
            { where: { id_voyage } }
        );

        res.status(200).json({
            message: `${updatedRows} réservation(s) mise(s) à jour avec succès.`,
            etat
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la mise à jour des réservations.", error: error.message });
    }
};

// Récupérer une réservation par user_id avec l'etat enregistre = 1
exports.getReservationEnregistrerByUserId = async (req, res) => {
    try {
        const { id_user } = req.params;

        const reservation = await Reservations.findAll({
            where: {
                user_id: id_user,
                enregistre: 1
            }
        });

        if (reservation.length === 0) {
            return res.status(404).json({ message: "Réservation non trouvée." });
        }

        res.status(200).json(reservation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération de la réservation." });
    }
};

module.exports = exports;
