const { PriseEnCharge, Reservations, User, Agent } = require('../models');
const Voyage = require('../models/Voyage');
const notificationService = require('../services/notificationService');

/**
 * GET /prise-en-charge/:token
 * Récupère les détails de la prise en charge par token (PUBLIC)
 */
exports.getByToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log(`📋 Récupération prise en charge avec token: ${token}`);
    
    const priseEnCharge = await PriseEnCharge.findOne({
      where: { validation_token: token },
      include: [
        {
          model: Reservations,
          as: 'reservation',
          include: [
            { 
              model: User, 
              as: 'user', 
              attributes: ['user_id', 'name', 'surname', 'phone', 'type_handicap'] 
            }
          ]
        },
        {
          model: Agent,
          as: 'agent',
          attributes: ['id_agent', 'name', 'surname', 'phone', 'email', 'entreprise'],
          required: false // LEFT JOIN si agent_id null
        }
      ]
    });
    
    if (!priseEnCharge) {
      console.log(`❌ Prise en charge introuvable pour token: ${token}`);
      return res.status(404).json({ 
        success: false, 
        error: 'Prise en charge introuvable' 
      });
    }
    
    // Récupérer voyage MongoDB
    let voyage = null;
    let segmentDetails = null;
    if (priseEnCharge.voyage_id_mongo) {
      voyage = await Voyage.findById(priseEnCharge.voyage_id_mongo);
      
      // Trouver l'étape correspondante dans le voyage
      if (voyage && voyage.etapes && voyage.etapes.length > 0) {
        const etapeIndex = priseEnCharge.etape_numero - 1;
        if (etapeIndex >= 0 && etapeIndex < voyage.etapes.length) {
          const etape = voyage.etapes[etapeIndex];
          segmentDetails = {
            mode: etape.type || priseEnCharge.reservation.Type_Transport,
            line: etape.line || null,
            operator: etape.compagnie || 'Unknown',
            departure_station: etape.departure_station || etape.adresse_1,
            arrival_station: etape.arrival_station || etape.adresse_2,
            departure_time: etape.departure_time,
            arrival_time: etape.arrival_time,
            vehicle_type: etape.vehicle_type || null
          };
        }
      }
    }
    
    console.log(`✅ Prise en charge trouvée: ID ${priseEnCharge.id}, Statut: ${priseEnCharge.status}`);
    
    res.json({
      success: true,
      prise_en_charge: {
        id: priseEnCharge.id,
        status: priseEnCharge.status,
        etape_numero: priseEnCharge.etape_numero,
        location: priseEnCharge.location,
        validated_at: priseEnCharge.validated_at,
        validated_by: priseEnCharge.validated_by,
        notes: priseEnCharge.notes,
        segment: segmentDetails, // 🆕 Détails du segment réel
        user: {
          user_id: priseEnCharge.reservation.user.user_id,
          name: priseEnCharge.reservation.user.name,
          surname: priseEnCharge.reservation.user.surname,
          phone: priseEnCharge.reservation.user.phone,
          type_handicap: priseEnCharge.reservation.user.type_handicap
        },
        agent: priseEnCharge.agent ? {
          id_agent: priseEnCharge.agent.id_agent,
          name: priseEnCharge.agent.name,
          surname: priseEnCharge.agent.surname,
          phone: priseEnCharge.agent.phone,
          email: priseEnCharge.agent.email,
          entreprise: priseEnCharge.agent.entreprise
        } : null,
        reservation: {
          reservation_id: priseEnCharge.reservation.reservation_id,
          num_reza: priseEnCharge.reservation.num_reza_mmt,
          type_transport: priseEnCharge.reservation.Type_Transport,
          lieu_depart: priseEnCharge.reservation.Lieu_depart,
          lieu_arrivee: priseEnCharge.reservation.Lieu_arrivee,
          date_depart: priseEnCharge.reservation.Date_depart,
          assistance_PMR: priseEnCharge.reservation.assistance_PMR
        },
        voyage: voyage ? {
          id_voyage: voyage.id_voyage,
          depart: voyage.lieu_depart?.id || 'N/A',
          arrivee: voyage.lieu_arrive?.id || 'N/A',
          date_debut: voyage.date_debut,
          date_fin: voyage.date_fin,
          etapes: voyage.etapes || []
        } : null
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur getByToken:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * POST /prise-en-charge/:token/validate
 * Valide la prise en charge (PUBLIC)
 * Body: { validated_by: "Nom du validateur" }
 */
exports.validate = async (req, res) => {
  try {
    const { token } = req.params;
    const { validated_by, agent_qr_public_id } = req.body;

    const trimmedValidatedBy = typeof validated_by === 'string' ? validated_by.trim() : '';
    const trimmedQr = typeof agent_qr_public_id === 'string' ? agent_qr_public_id.trim() : '';

    if (!trimmedQr && !trimmedValidatedBy) {
      return res.status(400).json({
        success: false,
        error: 'Le champ agent_qr_public_id est requis (validated_by toléré pour compatibilité)'
      });
    }

    console.log(`🔍 Validation prise en charge token: ${token} (${trimmedQr ? 'QR' : 'MANUAL'})`);
    
    const priseEnCharge = await PriseEnCharge.findOne({
      where: { validation_token: token },
      include: [
        { 
          model: Reservations, 
          as: 'reservation',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });
    
    if (!priseEnCharge) {
      console.log(`❌ Prise en charge introuvable pour token: ${token}`);
      return res.status(404).json({ 
        success: false, 
        error: 'Prise en charge introuvable' 
      });
    }
    
    if (priseEnCharge.status === 'validated') {
      console.log(`⚠️ Prise en charge ${priseEnCharge.id} déjà validée`);
      return res.status(400).json({ 
        success: false, 
        error: 'Prise en charge déjà validée',
        validated_at: priseEnCharge.validated_at,
        validated_by: priseEnCharge.validated_by
      });
    }
    
    let resolvedValidatedBy = trimmedValidatedBy;
    let resolvedAgentUserId = null;
    let resolvedMethod = trimmedQr ? 'qr' : 'manual';

    if (trimmedQr) {
      const agentUser = await User.findOne({
        where: {
          agent_qr_public_id: trimmedQr,
          role: 'Agent'
        },
        attributes: ['user_id', 'name', 'surname', 'email', 'role']
      });

      if (!agentUser) {
        return res.status(400).json({
          success: false,
          error: 'QR Agent invalide (aucun compte Agent trouvé)'
        });
      }

      resolvedAgentUserId = agentUser.user_id;
      resolvedValidatedBy = `${agentUser.surname} ${agentUser.name} - Agent`;
    }

    // Mettre à jour le statut
    priseEnCharge.status = 'validated';
    priseEnCharge.validated_at = new Date();
    priseEnCharge.validated_by = resolvedValidatedBy;
    priseEnCharge.validation_method = resolvedMethod;
    if (resolvedAgentUserId) {
      priseEnCharge.validated_agent_user_id = resolvedAgentUserId;
    }
    await priseEnCharge.save();

    console.log(`✅ Prise en charge ${priseEnCharge.id} validée par ${resolvedValidatedBy}`);
    
    // 🆕 ENVOYER NOTIFICATION TEMPS RÉEL À L'UTILISATEUR
    try {
      await notificationService.createNotification({
        user_id: priseEnCharge.user_id,
        type: 'PRISE_EN_CHARGE_VALIDATED',
        title: '✅ Prise en charge validée',
        message: `Votre prise en charge pour l'étape ${priseEnCharge.etape_numero} a été validée par ${resolvedValidatedBy}.`,
        data: {
          prise_en_charge_id: priseEnCharge.id,
          reservation_id: priseEnCharge.reservation_id,
          voyage_id_mongo: priseEnCharge.voyage_id_mongo,
          validated_by: resolvedValidatedBy,
          validated_at: priseEnCharge.validated_at,
          location: priseEnCharge.location,
          etape_numero: priseEnCharge.etape_numero
        },
        priority: 'high',
        icon: '✅'
      });
      
      console.log(`📧 Notification envoyée à l'utilisateur ${priseEnCharge.user_id}`);
    } catch (notifError) {
      console.error('❌ Erreur envoi notification:', notifError);
      // Ne pas bloquer la validation si notification échoue
    }
    
    res.json({
      success: true,
      message: 'Prise en charge validée avec succès',
      prise_en_charge: {
        id: priseEnCharge.id,
        status: 'validated',
        validated_at: priseEnCharge.validated_at,
        validated_by: priseEnCharge.validated_by,
        validation_method: priseEnCharge.validation_method,
        validated_agent_user_id: priseEnCharge.validated_agent_user_id,
        reservation_id: priseEnCharge.reservation_id,
        etape_numero: priseEnCharge.etape_numero,
        location: priseEnCharge.location
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur validate:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * GET /prise-en-charge/reservation/:reservation_id
 * Récupère toutes les prises en charge d'une réservation
 */
exports.getByReservation = async (req, res) => {
  try {
    const { reservation_id } = req.params;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    console.log(`📋 Récupération prises en charge pour réservation: ${reservation_id}`);
    
    const prisesEnCharge = await PriseEnCharge.findAll({
      where: { reservation_id: parseInt(reservation_id) },
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id_agent', 'name', 'surname', 'phone', 'entreprise'],
          required: false
        }
      ],
      order: [['etape_numero', 'ASC']]
    });
    
    console.log(`✅ ${prisesEnCharge.length} prise(s) en charge trouvée(s)`);
    
    // Enrichir les données avec validation_url calculé
    const enrichedPrisesEnCharge = prisesEnCharge.map(pec => ({
      ...pec.toJSON(),
      validation_url: `${baseUrl}/prise-en-charge/validate/${pec.validation_token}`
    }));
    
    res.json({
      success: true,
      count: enrichedPrisesEnCharge.length,
      prises_en_charge: enrichedPrisesEnCharge
    });
    
  } catch (error) {
    console.error('❌ Erreur getByReservation:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * GET /prise-en-charge/agent/:agent_id
 * Récupère toutes les prises en charge d'un agent
 */
exports.getByAgent = async (req, res) => {
  try {
    const { agent_id } = req.params;
    const { status } = req.query; // Filtrer par statut optionnel
    
    console.log(`📋 Récupération prises en charge pour agent: ${agent_id}`);
    
    const whereClause = { agent_id: parseInt(agent_id) };
    if (status) {
      whereClause.status = status;
    }
    
    const prisesEnCharge = await PriseEnCharge.findAll({
      where: whereClause,
      include: [
        {
          model: Reservations,
          as: 'reservation',
          include: [
            { 
              model: User, 
              as: 'user', 
              attributes: ['user_id', 'name', 'surname', 'phone', 'type_handicap'] 
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`✅ ${prisesEnCharge.length} prise(s) en charge trouvée(s) pour agent ${agent_id}`);
    
    res.json({
      success: true,
      count: prisesEnCharge.length,
      prises_en_charge: prisesEnCharge
    });
    
  } catch (error) {
    console.error('❌ Erreur getByAgent:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

module.exports = exports;
