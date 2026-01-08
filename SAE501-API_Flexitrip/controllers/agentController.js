const { Agent, PMR } = require('../models'); // Modèle `Agent`
const { AgentAF, Vol, reservation_vol } = require('../models/AF');
const { AgentSNCF, Trajet, reservation_trajet } = require('../models/SNCF');
const {AgentUBER, Ride,reservations_trajet_Uber} = require('../models/Uber')
const { Op } = require('sequelize');


const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Fonction pour authentifier un agent
exports.loginAgent = async (req, res) => {
    const { email, password } = req.body;
    try {
        const agent = await Agent.findOne({ where: { email: email } });
        //console.log(agent);
        if (!agent) {
            console.log("Agent not found");
            return res.status(404).json({ error: 'Agent not found' });
        }

        const isMatch = await bcrypt.compare(password, agent.password);
        //console.log(`Password match: ${isMatch}`);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ id: agent.id_agent }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const agentWithoutPassword = { ...agent.toJSON() };
        delete agentWithoutPassword.password; // Supprimer le mot de passe 

        return res.json({ token, agent: agentWithoutPassword });

    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// Fonction pour enregistrer un nouvel agent
exports.insertAgent = async (req, res) => {
    const { name, surname, email, phone, entreprise, password } = req.body;

    if (!name || !surname || !email || !phone || !password) {
        return res.status(400).json({ error: 'Tous les champs obligatoires sont requis.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newAgent = await Agent.create({
            name,
            surname,
            email,
            phone,
            entreprise,
            password: hashedPassword
        });

        res.status(201).json({
            message: 'Agent créé avec succès.',
            agent: {
                id: newAgent.id_agent,
                name: newAgent.name,
                surname: newAgent.surname,
                email: newAgent.email,
                phone: newAgent.phone,
                entreprise: newAgent.entreprise,
            },
        });
    } catch (error) {
        console.error('Erreur lors de l\'insertion de l\'agent:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'L\'email existe déjà.' });
        }

        res.status(500).json({ error: 'Erreur lors de l\'insertion de l\'agent' });
    }
};

// Fonction pour récupérer tous les agents
exports.getAllAgents = async (req, res) => {
    try {
        const agents = await Agent.findAll();
        res.status(200).json(agents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Fonction pour récupérer un agent par ID
exports.getAgentById = async (req, res) => {
    try {
        const agent = await Agent.findByPk(req.params.id);

        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        res.status(200).json(agent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

async function getAF_PMR_ASSOCIATE(agentEntreprise){
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // Trouver les vols associés au lieu de l'agent
      const volsAssocies = await Vol.findAll({
        where: {
            departure_airport_id: agentEntreprise.id_Lieu_Associe,
            departure_time: {
                [Op.gt]: oneHourAgo
            }
        }
    });

    const volsAssociesArrivee = await Vol.findAll({
        where: {
            arrival_airport_id: agentEntreprise.id_Lieu_Associe,
            arrival_time: {
                [Op.gt]: oneHourAgo
            }
        }
    });

    // Combiner les résultats
    const tousVolsAssocies = [...volsAssocies, ...volsAssociesArrivee];


    console.log(tousVolsAssocies)
    if (!tousVolsAssocies || tousVolsAssocies.length === 0) {
        return res.status(404).json({ error: 'No flights associated with this agent' });
    }

    // Récupérer les réservations PMR pour les vols associés
    const pmrReservations = await reservation_vol.findAll({
        where: {
            id_vol: tousVolsAssocies.map(vol => vol.flight_id)
        },
        include: [
            {
                model: Vol,
                attributes: ['departure_time', 'arrival_time', 'departure_airport_id', 'arrival_airport_id']
            }
        ]
    });

    if (!pmrReservations || pmrReservations.length === 0) {
        return res.status(404).json({ error: 'No PMR reservations found for associated flights' });
    }
    console.log(pmrReservations)

    // Préparer les détails PMR à retourner
    const pmrDetails = pmrReservations.map(reservation => {
        const vol = reservation.Vol;
        const priseEnCharge = vol.departure_airport_id === agentEntreprise.id_Lieu_Associe ? vol.departure_time : vol.arrival_time;

        // Ici, on récupère le NOM et le Prenom depuis la table reservation_vol
        const pmrNom = reservation.Nom; // Exemple de récupération du nom
        const pmrPrenom = reservation.prenom; // Exemple de récupération du prénom
        const pmrReservationId = reservation.id_reservation_vol; // Exemple de récupération du prénom
        const bagageChecked = reservation.Bagage_Verifié;

        return {
            id_reservation_vol : pmrReservationId,
            Nom: pmrNom || "Unknown", // Si NOM est vide ou undefined, renvoie "Unknown"
            Prenom: pmrPrenom || "Unknown", // Si Prenom est vide ou undefined, renvoie "Unknown"
            PriseEnCharge: priseEnCharge,
            BagageCheck: bagageChecked
        };
    });

    return pmrDetails

}


async function getSNCF_PMR_ASSOCIATE(agentEntreprise){
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // Trouver les vols associés au lieu de l'agent
      const trajetAssociesDépart = await Trajet.findAll({
        where: {
            departure_gare_id: agentEntreprise.id_Lieu_Associe,
            departure_time: {
                [Op.gt]: oneHourAgo
            }
        }
    });

    const trajetAssociesArivee = await Trajet.findAll({
        where: {
            arrival_gare_id: agentEntreprise.id_Lieu_Associe,
            arrival_time: {
                [Op.gt]: oneHourAgo
            }
        }
    });

    // Combiner les résultats
    const tousTrajetsAssocies = [...trajetAssociesDépart, ...trajetAssociesArivee];


    console.log(tousTrajetsAssocies)
    if (!tousTrajetsAssocies || tousTrajetsAssocies.length === 0) {
        return res.status(404).json({ error: 'No flights associated with this agent' });
    }

    // Récupérer les réservations PMR pour les vols associés
    const pmrReservations = await reservation_trajet.findAll({
        where: {
            id_trajet: tousTrajetsAssocies.map(trajet => trajet.trajet_id)
        },
        include: [
            {
                model: Vol,
                attributes: ['departure_time', 'arrival_time', 'departure_gare_id', 'arrival_gare_id']
            }
        ]
    });

    if (!pmrReservations || pmrReservations.length === 0) {
        return res.status(404).json({ error: 'No PMR reservations found for associated flights' });
    }
    console.log(pmrReservations)

    // Préparer les détails PMR à retourner
    const pmrDetails = pmrReservations.map(reservation => {
        const trajet = reservation.Trajet;
        const priseEnCharge = trajet.departure_gare_id === agentEntreprise.id_Lieu_Associe ? trajet.departure_time : trajet.arrival_time;

        // Ici, on récupère le NOM et le Prenom depuis la table reservation_vol
        const pmrNom = reservation.Nom; // Exemple de récupération du nom
        const pmrPrenom = reservation.prenom; // Exemple de récupération du prénom

        return {
            Nom: pmrNom || "Unknown", // Si NOM est vide ou undefined, renvoie "Unknown"
            Prenom: pmrPrenom || "Unknown", // Si Prenom est vide ou undefined, renvoie "Unknown"
            PriseEnCharge: priseEnCharge
        };
    });

    return pmrDetails

}

async function getUBER_PMR_ASSOCIATE(agentEntreprise){
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // Trouver les vols associés au lieu de l'agent
      const trajetAssociesDépart = await Ride.findAll({
        where: {
            departure_gare_id: agentEntreprise.id_Lieu_Associe,
            departure_time: {
                [Op.gt]: oneHourAgo
            }
        }
    });

    const trajetAssociesArivee = await Ride.findAll({
        where: {
            arrival_gare_id: agentEntreprise.id_Lieu_Associe,
            arrival_time: {
                [Op.gt]: oneHourAgo
            }
        }
    });

    // Combiner les résultats
    const tousTrajetsAssocies = [...trajetAssociesDépart, ...trajetAssociesArivee];


    console.log(tousTrajetsAssocies)
    if (!tousTrajetsAssocies || tousTrajetsAssocies.length === 0) {
        return res.status(404).json({ error: 'No flights associated with this agent' });
    }

    // Récupérer les réservations PMR pour les vols associés
    const pmrReservations = await reservations_trajet_Uber.findAll({
        where: {
            id_trajet: tousTrajetsAssocies.map(trajet => trajet.trajet_id)
        },
        include: [
            {
                model: Vol,
                attributes: ['departure_time', 'arrival_time', 'departure_gare_id', 'arrival_gare_id']
            }
        ]
    });

    if (!pmrReservations || pmrReservations.length === 0) {
        return res.status(404).json({ error: 'No PMR reservations found for associated flights' });
    }
    console.log(pmrReservations)

    // Préparer les détails PMR à retourner
    const pmrDetails = pmrReservations.map(reservation => {
        const trajet = reservation.Trajet;
        const priseEnCharge = trajet.departure_gare_id === agentEntreprise.id_Lieu_Associe ? trajet.departure_time : trajet.arrival_time;

        // Ici, on récupère le NOM et le Prenom depuis la table reservation_vol
        const pmrNom = reservation.Nom; // Exemple de récupération du nom
        const pmrPrenom = reservation.prenom; // Exemple de récupération du prénom

        return {
            Nom: pmrNom || "Unknown", // Si NOM est vide ou undefined, renvoie "Unknown"
            Prenom: pmrPrenom || "Unknown", // Si Prenom est vide ou undefined, renvoie "Unknown"
            PriseEnCharge: priseEnCharge
        };
    });

    return pmrDetails

}

//prend info agent de getInfoCompanyAgent
//regarde le lieu associé a cette agent 
//si  Vol.departure_airport_id ou Vol.arrival_airport_id == agent.lieu_associé
//alors const idVol = Vol.flight_id
//get NOM, Prenom where reservation_vol.flight_id = idVol
//getPMRByNameAndSurname 
exports.getPMRAssociateToAgent = async (req, res) => {
    try {
        // Récupérer l'agent à partir de l'ID
        const agent = await Agent.findByPk(req.params.id);
        if (!agent) {
            return res.status(404).json({ message: "Agent not found" });
        }

        // Trouver les détails de l'agent en fonction de l'entreprise
        let agentEntreprise;
        if (agent.entreprise === "AF") {
            agentEntreprise = await AgentAF.findOne({ where: { email: agent.email } });
            res.status(200).json(await getAF_PMR_ASSOCIATE(agentEntreprise));


        } else if (agent.entreprise === "SNCF") {
            agentEntreprise = await AgentSNCF.findOne({ where: { email: agent.email } });
            res.status(200).json(await getSNCF_PMR_ASSOCIATE(agentEntreprise));
        }
        else if (agent.entreprise === "UBER") {
            agentEntreprise = await AgentUBER.findOne({ where: { email: agent.email } });
            res.status(200).json(await getSNCF_PMR_ASSOCIATE(agentEntreprise));
        }
        if (!agentEntreprise) {
            return res.status(404).json({ message: "Agent entreprise info not found" });
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




// Fonction pour mettre à jour un agent
exports.updateAgent = async (req, res) => {
    try {
        const [updated] = await Agent.update(req.body, {
            where: { id_agent: req.params.id }
        });

        if (!updated) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        const updatedAgent = await Agent.findByPk(req.params.id);
        res.status(200).json(updatedAgent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//req = { idAgent : 1}
exports.getInfoCompanyAgent = async (req, res) => {
    try {
        const agent = await Agent.findByPk(req.params.idAgent); // Correction de req.params.idAgent
        if (!agent) {
            return res.status(404).json({ message: "Agent not found" });
        }

        if (agent.entreprise === "AF") {
            const agentEntreprise = await AgentAF.findOne({ where: { email: agent.email } }); // Ajout de await et correction de la syntaxe
            if (agentEntreprise) {
                res.status(200).json(agentEntreprise);
            } else {
                res.status(404).json({ message: "Agent entreprise info not found" });
            }
        } else if (agent.entreprise === "SNCF") {
            const agentEntreprise = await AgentSNCF.findOne({ where: { email: agent.email } }); // Ajout de await et correction de la syntaxe
            if (agentEntreprise) {
                res.status(200).json(agentEntreprise);
            } else {
                res.status(404).json({ message: "Agent entreprise info not found" });
            }
        }
        else if (agent.entreprise === "UBER") {
            const agentEntreprise = await AgentUBER.findOne({ where: { email: agent.email } }); // Ajout de await et correction de la syntaxe
            if (agentEntreprise) {
                res.status(200).json(agentEntreprise);
            } else {
                res.status(404).json({ message: "Agent entreprise info not found" });
            }
        }
        else {
            res.status(400).json({ message: "Agent does not belong to entreprise AF" });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


// Fonction pour supprimer un agent
exports.deleteAgent = async (req, res) => {
    try {
        const deleted = await Agent.destroy({
            where: { id_agent: req.params.id }
        });

        if (!deleted) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        res.status(204).json();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Fonction pour répondre à une question de sécurité
exports.AnswerSecurityQuestion = async (req, res) => {
    try {
        const { reponse, id_reservation_vol, entreprise } = req.body; // Utilisation de req.body pour extraire les données du JSON

        // Vérification des paramètres requis
        if (!reponse || !id_reservation_vol || !entreprise) {
            return res.status(400).json({ error: "Tous les champs sont requis" });
        }




        res.status(200).json({ message: "Question de sécurité répondue avec succès" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


/**
 * Change le statut de vérification du bagage.
 * @async
 * @function
 * @param {Object} req - Requête Express contenant `statusBagage`, `id_reservation_vol` et `entreprise`.
 * @param {Object} res - Réponse Express.
 */
exports.ChangeBagageVerif = async (req, res) => {
    try {
        const { statusBagage, id_reservation, entreprise } = req.body;

        // Vérification des paramètres requis
        if (typeof statusBagage !== 'boolean' || !id_reservation || !entreprise) {
            return res.status(400).json({ error: 'Tous les champs requis doivent être remplis correctement.' });
        }

        let result;

        // Mise à jour du statut du bagage vérifié et ajout de l'entreprise
        if(entreprise == "AF"){
            const reservation = await reservation_vol.findOne({ where: { id_reservation_vol: id_reservation } });
            if (!reservation) {
                return res.status(404).json({ error: 'Réservation non trouvée' });
            }

            // Si le statut est déjà le bon, ne pas effectuer l'update
            if (reservation.Bagage_Verifié === statusBagage) {
                return res.status(200).json({ message: 'Le statut du bagage est déjà à jour.' });
            }

            // Effectuer l'update si nécessaire
            result = await reservation_vol.update(
                { Bagage_Verifié: statusBagage, Entreprise: entreprise },
                { where: { id_reservation_vol: id_reservation } }
            );
        } else if (entreprise == "SNCF"){
            const reservation = await reservation_trajet.findOne({ where: { id_reservation_trajet: id_reservation } });
            if (!reservation) {
                return res.status(404).json({ error: 'Réservation non trouvée' });
            }

            // Si le statut est déjà le bon, ne pas effectuer l'update
            if (reservation.Bagage_Verifié === statusBagage) {
                return res.status(200).json({ message: 'Le statut du bagage est déjà à jour.' });
            }

            // Effectuer l'update si nécessaire
            result = await reservation_trajet.update(
                { Bagage_Verifié: statusBagage, Entreprise: entreprise },
                { where: { id_reservation_trajet: id_reservation } }
            );
        }else if (entreprise == "UBER"){
            const reservation = await reservations_trajet_Uber.findOne({ where: { id_reservation_trajet: id_reservation } });
            if (!reservation) {
                return res.status(404).json({ error: 'Réservation non trouvée' });
            }

            // Si le statut est déjà le bon, ne pas effectuer l'update
            if (reservation.Bagage_Verifié === statusBagage) {
                return res.status(200).json({ message: 'Le statut du bagage est déjà à jour.' });
            }

            // Effectuer l'update si nécessaire
            result = await reservations_trajet_Uber.update(
                { Bagage_Verifié: statusBagage, Entreprise: entreprise },
                { where: { id_reservation_trajet: id_reservation } }
            );
        } else {
            return res.status(400).json({ error: 'Entreprise non valide' });
        }

        // Si aucune ligne n'a été modifiée, cela signifie que le statut était déjà correct
        if (result[0] === 0) {
            return res.status(200).json({ message: 'Le statut du bagage est déjà à jour.' });
        }

        // Retourner la réponse de succès
        res.status(200).json({ message: 'Statut du bagage mis à jour avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut du bagage:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};
