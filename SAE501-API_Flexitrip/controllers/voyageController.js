const { Voyage } = require('../models');
const { Vol } = require('../models/AF'); // Exemple pour avions
const { Trajet } = require('../models/SNCF'); // Exemple pour avions
const { Ride } = require ('../models/Uber')

const sequelizeSAE_UBER = require ('../config/databaseUBER')

// CrÃ©er un nouveau voyage
//req : {"id_pmr":1,"id_accompagnant":1,"prixtotal":5,id_baguage[{"id":1,poid:"10kg","descriptif":"rouge"}],etapes:[{"type":"avion","id":"FL12345"},{"type":"avion","id":"FL55555"},{"type":"taxi","departure_time":...,"arrival_time":...,"adresse_1":"...","adresse_2":"..."}]'
//rep :{
//  pmrid:"1",
// accompagnant_id;'1',
//   "date_debut": "2024-01-01T00:00:00Z",
//   "date_fin": "2024-01-15T00:00:00Z",
//   "lieu_depart": {
//     locomotion:"train"
//     id:1
//   },
//   "lieu_arrive": {
//     locomotion:"avion"
//     id:3
//   },
//   "bagage":[{
//        "id": 1 ,
//        "poid":10,
//        "descriptif":"rouge
//      "}]
//   "etapes": [
//     1:{
//       "id": FL12345,
//       "type": "avion",
//       "compagnie": "Air France",
//     },
//     2:{
//       "id": FL5555,
//       "type": "train",
//       "compagnie": "Shinkansen",    
//     },
//     3:{
//       "id": 1,
//       "type": "taxi",
//       "compagnie": "Uber",
//      "adresse_1":"2 rue albert mallet",
//      "adresse_2": "3 rue albert mallet "
      
//     },
//   ],
//   "prix_total": 971.25
// }
exports.createVoyage = async (req, res) => {
  let t_UBER;
  let t_SAE; // Transaction MySQL
  try {
    // Analyse de l'entrée
    t_UBER = await sequelizeSAE_UBER.transaction();
    
    // ==========================================
    // 🆕 TRANSACTION MYSQL
    // ==========================================
    const { sequelize } = require('../config/database');
    t_SAE = await sequelize.transaction();
    
    const { id_pmr, id_accompagnant, prix_total, etapes, bagage } = req.body;

    console.log(req.body);
    if (!Array.isArray(etapes)) {
      return res.status(400).json({ error: 'Le champ "etapes" doit être un tableau.' });
    }

    const etapesDetails = [];
    let lieu_depart = null;
    let lieu_arrive = null;
    let date_debut = null;
    let date_fin = null;

    // Traitement des étapes (tolérant : crée des étapes même si aucune fiche n'existe)
    for (let i = 0; i < etapes.length; i++) {
      const { type, id } = etapes[i];
      let data = null;
      let id_data = id;

      if (type === 'taxi') {
        // Création d'une ride taxi si données fournies
        data = await Ride.create({
          adresse_1: etapes[i].adresse_1,
          adresse_2: etapes[i].adresse_2,
          departure_time: etapes[i].departure_time,
          arrival_time: etapes[i].arrival_time,
          status: "Prévu",
          company: "UBER"
        }, { transaction: t_UBER });
        id_data = data ? data.Ride_Id : id;
      } else if (type === 'avion') {
        data = await Vol.findByPk(id).catch(() => null);
        id_data = data ? data.flight_id : id;
      } else if (type === 'train') {
        data = await Trajet.findByPk(id).catch(() => null);
        id_data = data ? data.trajet_id || data.Trajet_id : id;
      }

      // Construction des étapes avec valeurs fallback
      etapesDetails.push({
        id: id_data,
        type,
        compagnie: (data && (data.company || data.train_company || data.taxi_company)) || 'N/A',
        adresse_1: (data && data.adresse_1) || etapes[i].adresse_1 || '',
        adresse_2: (data && data.adresse_2) || etapes[i].adresse_2 || '',
      });

      // Mise à jour des informations principales pour lieu_depart et lieu_arrive
      if (i === 0) {
        const depart_id = type === 'taxi'
          ? (etapes[i].adresse_1 || (data && data.adresse_1))
          : (data && (data.departure_airport_id || data.departure_station_id)) || id_data;

        lieu_depart = {
          locomotion: type,
          id: depart_id,
        };
        date_debut = (data && data.departure_time) || etapes[i].departure_time || null;
      }

      if (i === etapes.length - 1) {
        const arrive_id = type === 'taxi'
          ? (etapes[i].adresse_2 || (data && data.adresse_2))
          : (data && (data.arrival_airport_id || data.arrival_station_id || data.arrival_taxi_id)) || id_data;

        lieu_arrive = {
          locomotion: type,
          id: arrive_id,
        };
        date_fin = (data && data.arrival_time) || etapes[i].arrival_time || null;
      }
    }

    // Construction des données du voyage
    const voyageData = {
      id_pmr: id_pmr,
      accompagnant_id: id_accompagnant || null,
      date_debut,
      date_fin,
      lieu_depart,
      lieu_arrive,
      bagage: bagage || [],
      etapes: etapesDetails,
      prix_total,
    };

    // Sauvegarder dans MongoDB
    const newVoyage = await Voyage.create(voyageData);
    
    // ==========================================
    // 🆕 CRÉER LA RÉSERVATION MYSQL
    // ==========================================
    const Reservation = require('../models/Reservations');
    
    // Récupérer user_id depuis req (authentification)
    const user_id = req.user?.id || id_pmr; // Fallback sur id_pmr si pas d'auth
    
    // Générer num_reza_mmt unique
    const num_reza_mmt = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Déterminer le type de transport principal (première étape)
    const type_transport = etapesDetails[0]?.type === 'avion' ? 'avion' 
                         : etapesDetails[0]?.type === 'train' ? 'train' 
                         : 'taxi';
    
    // Options PMR depuis req.body
    const pmr_options = req.body.pmr_options || null;
    
    const reservationData = {
      user_id: user_id,
      num_reza_mmt: num_reza_mmt,
      num_pax: `PAX-${user_id}-${Date.now()}`,
      enregistre: false,
      assistance_PMR: pmr_options ? 'Oui' : 'Non',
      Type_Transport: type_transport,
      id_voyage: newVoyage.id_voyage,
      etape_voyage: etapesDetails.length,
      date_reservation: new Date(),
      pmr_options: pmr_options,
      ticket_status: 'pending'
    };
    
    const newReservation = await Reservation.create(reservationData, { transaction: t_SAE });
    
    console.log('✅ Réservation créée:', newReservation.reservation_id);
    
    // Commit des transactions
    await t_UBER.commit();
    await t_SAE.commit();
    
    res.status(201).json({
      ...newVoyage.toJSON(),
      reservation_id: newReservation.reservation_id
    });
    
  } catch (error) {
    if (t_UBER) await t_UBER.rollback();
    if (t_SAE) await t_SAE.rollback();
    console.error("Erreur lors de la création du voyage :", error);
    res.status(500).json({ error: 'Erreur serveur lors de la création du voyage', details: error.message });
  }
};


/** V1 ne pas encore delete 21/01/25
exports.createVoyage = async (req, res) => {
  try {
    // Analyse de l'entrÃ©e
    const { id_pmr, id_accompagnant, etapes } = req.body;

    console.log(etapes);
    if (!Array.isArray(etapes)) {
      return res.status(400).json({ error: 'Le champ "etapes" doit Ãªtre un tableau.' });
    }

    const etapesDetails = [];
    let lieu_depart = null;
    let lieu_arrive = null;
    let id = null;
    let date_debut = null;
    let date_fin = null;
    let prix_total = 0;

    // Traitement des Ã©tapes
    for (let i = 0; i < etapes.length; i++) {
      const { type, id } = etapes[i];
      let data = null;

      // RÃ©cupÃ©rer les informations en fonction du type
      if (type === 'avion') {
        data = await Vol.findByPk(id);
        id_data = data.flight_id
      } else if (type === 'train') {
        data = await Trajet.findByPk(id);
        id_data = data.Trajet_id
      }

      if (!data) {
        return res.status(404).json({ error: `Ã‰tape ${i} introuvable avec le type ${type} et l'id ${id}` });
      }

      // Construction des Ã©tapes
      etapesDetails.push({
        id:id_data,
        type_Transport: type,
        compagnie: data.company || data.train_company, // Exemple pour avions et trains
      });

      // Mise Ã  jour des informations principales
      if (i === 0) {
        lieu_depart = {
          locomotion: type,
          id: data.departure_airport_id || data.departure_station_id, // Exemple pour avions/trains
        };
        date_debut = data.departure_time; // Exemple
      }

      if (i === etapes.length - 1) {
        lieu_arrive = {
          locomotion: type,
          id: data.arrival_airport_id || data.arrival_station_id, // Exemple pour avions/trains
        };
        date_fin = data.arrival_time; // Exemple
      }

      // Calcul du prix total
      prix_total += data.price;
    }

    // Construction de la rÃ©ponse finale
    const newVoyage = {
      id_pmr,
      id_accompagnant,
      date_debut,
      date_fin,
      lieu_depart,
      lieu_arrive,
      etapes: etapesDetails,
      prix_total,
    };


    console.log(newVoyage)
    // Sauvegarde dans la base de donnÃ©es (optionnel)
    const voyageEnregistre = await Voyage.create(newVoyage);

    // RÃ©ponse
    res.status(201).json(voyageEnregistre);
  } catch (error) {
    console.error("Erreur lors de la crÃ©ation du voyage :", error);
    res.status(500).json({ error: 'Erreur serveur lors de la crÃ©ation du voyage' });
  }
};
*/

// RÃ©cupÃ©rer tous les voyages
exports.getVoyages = async (req, res) => {
  try {
    const voyages = await Voyage.find();
    if (!voyages.length) {
      return res.status(404).json({ error: 'Aucun voyage trouvÃ©' });
    }
    res.status(200).json(voyages.map(voyage => voyage.toJSON()));

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la rÃ©cupÃ©ration des voyages' });
  }
};

exports.getVoyageById = async (req, res) => {
  const { id } = req.params; // RÃ©cupÃ©rer l'ID depuis les paramÃ¨tres de la requÃªte
  try {
    const voyage = await Voyage.findOne({ id_voyage: id }); // Utiliser findOne pour rÃ©cupÃ©rer un seul voyage
    if (!voyage) {
      return res.status(404).json({ error: 'Voyage non trouvÃ©' });
    }
    res.status(200).json(voyage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la rÃ©cupÃ©ration du voyage' });
  }
};

// Mettre Ã  jour un voyage
// pas encore concu!!!!!!!!!!!
exports.updateVoyage = async (req, res) => {
  const { id } = req.params; // RÃ©cupÃ©rer l'ID depuis les paramÃ¨tres de la requÃªte
  try {
    const [updated] = await Voyage.update(req.body, {
      where: { id },
    });
    if (!updated) {
      return res.status(404).json({ error: 'Voyage non trouvÃ©' });
    }
    const updatedVoyage = await Voyage.findByPk(id);
    res.status(200).json(updatedVoyage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise Ã  jour du voyage' });
  }
};

// Supprimer un voyage
exports.deleteVoyage = async (req, res) => {
  const { id } = req.params; // RÃ©cupÃ©rer l'ID depuis les paramÃ¨tres de la requÃªte
  try {
    const deleted = await Voyage.destroy({
      where: { id },
    });
    if (!deleted) {
      return res.status(404).json({ error: 'Voyage non trouvÃ©' });
    }
    res.status(204).send(); // Suppression rÃ©ussie, ne retourne rien
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression du voyage' });
  }
};