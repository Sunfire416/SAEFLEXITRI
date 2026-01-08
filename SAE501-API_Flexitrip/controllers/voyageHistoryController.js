/**
 * Controller Voyage History - Point 5
 * Gestion historique, QR, annulations
 * 
 * Routes: /voyages/*
 */

const { Reservations, BoardingPass, User } = require('../models');
const qrService = require('../services/qrService');
const mongoose = require('mongoose');

// ✅ Fonction helper pour accéder à la collection voyages
const getVoyageCollection = () => mongoose.connection.db.collection('voyages');

/**
 * GET /voyages/history
 * Récupérer historique voyages utilisateur
 */
exports.getHistory = async (req, res) => {
  try {
    const user_id = req.user?.user_id || req.query.user_id;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id requis'
      });
    }

    const {
      status = null,
      limit = 50,
      skip = 0
    } = req.query;

    console.log(`📋 Récupération historique voyages user ${user_id}`);

    // Récupérer voyages MongoDB
    const voyagesCollection = getVoyageCollection();
    const voyagesQuery = { id_pmr: parseInt(user_id) };
    const voyages = await voyagesCollection.find(voyagesQuery)
      .sort({ date_debut: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray();

    // Récupérer AUSSI les réservations standalone (sans id_voyage)
    const standaloneReservations = await Reservations.findAll({
      where: { 
        user_id: parseInt(user_id),
        id_voyage: null  // Réservations du nouveau système
      },
      order: [['date_reservation', 'DESC']]
    });

    // Pour chaque voyage, récupérer réservations MySQL
    const voyagesWithReservations = await Promise.all(
      voyages.map(async (voyage) => {
        const reservations = await Reservations.findAll({
          where: { 
            user_id: parseInt(user_id),
            id_voyage: voyage.id_voyage
          },
          include: [
            {
              model: BoardingPass,
              as: 'boarding_pass',
              required: false
            }
          ]
        });

        // Déterminer statut voyage
        let voyageStatus = 'pending';
        if (reservations.length > 0) {
          const allCancelled = reservations.every(r => r.ticket_status === 'cancelled');
          const allUsed = reservations.every(r => r.ticket_status === 'used');
          const hasGenerated = reservations.some(r => r.ticket_status === 'generated');

          if (allCancelled) voyageStatus = 'cancelled';
          else if (allUsed) voyageStatus = 'completed';
          else if (hasGenerated) voyageStatus = 'confirmed';
        }

        // Vérifier si voyage passé
        const isPast = new Date(voyage.date_fin) < new Date();
        if (isPast && voyageStatus === 'pending') voyageStatus = 'completed';

        return {
          voyage_id: voyage._id.toString(),
          id_voyage: voyage.id_voyage,
          depart: voyage.etapes?.[0]?.adresse_1 || voyage.lieu_depart?.id || 'N/A',
          arrivee: voyage.etapes?.[voyage.etapes.length - 1]?.adresse_2 || voyage.lieu_arrive?.id || 'N/A',
          date_debut: voyage.date_debut,
          date_fin: voyage.date_fin,
          etapes: voyage.etapes || [],
          prix_total: voyage.prix_total,
          bagage: voyage.bagage || [],
          status: voyageStatus,
          reservations: reservations.map(r => ({
            reservation_id: r.reservation_id,
            num_reza: r.num_reza_mmt,
            assistance_PMR: r.assistance_PMR,
            type_transport: r.Type_Transport,
            ticket_status: r.ticket_status,
            date_reservation: r.date_reservation,
            boarding_pass: r.boarding_pass ? {
              pass_id: r.boarding_pass.pass_id,
              gate: r.boarding_pass.gate,
              seat: r.boarding_pass.seat,
              status: r.boarding_pass.status
            } : null
          }))
        };
      })
    );

    // Formatter les réservations standalone comme des voyages
    const standaloneVoyages = standaloneReservations.map(r => ({
      voyage_id: `standalone_${r.reservation_id}`,
      id_voyage: null,
      depart: r.Lieu_depart,
      arrivee: r.Lieu_arrivee,
      date_debut: r.Date_depart,
      date_fin: r.Date_arrivee,
      etapes: [],
      prix_total: 0,
      bagage: [],
      status: r.Statut === 'CONFIRMED' ? 'confirmed' : 'pending',
      is_standalone: true,
      reservations: [{
        reservation_id: r.reservation_id,
        num_reza: r.num_reza_mmt,
        assistance_PMR: r.assistance_PMR,
        type_transport: r.Type_Transport,
        ticket_status: r.ticket_status,
        date_reservation: r.date_reservation,
        qr_code: r.qr_code_data,
        booking_reference: r.booking_reference
      }]
    }));

    // Combiner voyages MongoDB et réservations standalone
    let allVoyages = [...standaloneVoyages, ...voyagesWithReservations]
      .sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut));

    // Filtrer par status si demandé
    if (status) {
      allVoyages = allVoyages.filter(v => v.status === status);
    }

    console.log(`✅ ${allVoyages.length} voyage(s) trouvé(s) (${standaloneReservations.length} standalone + ${voyagesWithReservations.length} MongoDB)`);

    res.json({
      success: true,
      voyages: allVoyages,
      total: allVoyages.length
    });

  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
};

/**
 * GET /voyages/:id
 * Récupérer détails voyage
 */
exports.getVoyageDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user?.user_id || req.query.user_id;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id requis'
      });
    }

    console.log(`🔍 Récupération détails voyage ${id}`);

    // Détecter si c'est une réservation standalone
    if (id.startsWith('standalone_')) {
      const reservationId = parseInt(id.replace('standalone_', ''));
      const reservation = await Reservations.findOne({
        where: { 
          reservation_id: reservationId,
          user_id: parseInt(user_id)
        }
      });

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'Réservation introuvable'
        });
      }

      const user = await User.findOne({ where: { user_id: parseInt(user_id) } });

      return res.json({
        success: true,
        voyage: {
          voyage_id: id,
          id_voyage: null,
          is_standalone: true,
          user: {
            user_id: parseInt(user_id),
            name: user?.name,
            surname: user?.surname,
            email: user?.email
          },
          depart: reservation.Lieu_depart,
          arrivee: reservation.Lieu_arrivee,
          date_debut: reservation.Date_depart,
          date_fin: reservation.Date_arrivee,
          etapes: [],
          prix_total: 0,
          bagage: [],
          reservations: [{
            reservation_id: reservation.reservation_id,
            num_reza: reservation.num_reza_mmt,
            assistance_PMR: reservation.assistance_PMR,
            type_transport: reservation.Type_Transport,
            ticket_status: reservation.ticket_status,
            date_reservation: reservation.date_reservation,
            booking_reference: reservation.booking_reference,
            qr_code_data: reservation.qr_code_data
          }]
        }
      });
    }

    const voyagesCollection = getVoyageCollection();
    const voyage = await voyagesCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(id),
      id_pmr: parseInt(user_id)
    });

    if (!voyage) {
      return res.status(404).json({
        success: false,
        error: 'Voyage introuvable ou accès non autorisé'
      });
    }

    // Récupérer réservations
    const reservations = await Reservations.findAll({
      where: { 
        user_id: parseInt(user_id),
        id_voyage: voyage.id_voyage
      },
      include: [
        {
          model: BoardingPass,
          as: 'boarding_pass',
          required: false
        }
      ]
    });

    // Récupérer user info
    const user = await User.findOne({ where: { user_id: parseInt(user_id) } });

    res.json({
      success: true,
      voyage: {
        voyage_id: voyage._id.toString(),
        id_voyage: voyage.id_voyage,
        user: {
          user_id: parseInt(user_id),
          name: user?.name,
          surname: user?.surname,
          email: user?.email
        },
        depart: voyage.etapes?.[0]?.adresse_1 || 'N/A',
        arrivee: voyage.etapes?.[voyage.etapes.length - 1]?.adresse_2 || 'N/A',
        date_debut: voyage.date_debut,
        date_fin: voyage.date_fin,
        etapes: voyage.etapes || [],
        prix_total: voyage.prix_total,
        bagage: voyage.bagage || [],
        reservations: reservations.map(r => ({
          reservation_id: r.reservation_id,
          num_reza: r.num_reza_mmt,
          num_pax: r.num_pax,
          assistance_PMR: r.assistance_PMR,
          pmr_options: r.pmr_options,
          type_transport: r.Type_Transport,
          ticket_status: r.ticket_status,
          date_reservation: r.date_reservation,
          boarding_pass: r.boarding_pass
        }))
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération détails voyage:', error);
    
    if (error.message.includes('introuvable')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
};

/**
 * GET /voyages/:id/qr
 * Générer QR code voyage
 */
exports.generateQR = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user?.user_id || req.query.user_id;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id requis'
      });
    }

    console.log(`📱 Génération QR voyage ${id}`);

    // Détecter si c'est une réservation standalone
    if (id.startsWith('standalone_')) {
      const reservationId = parseInt(id.replace('standalone_', ''));
      const reservation = await Reservations.findOne({
        where: { 
          reservation_id: reservationId,
          user_id: parseInt(user_id)
        }
      });

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'Réservation introuvable'
        });
      }

      // QR code déjà stocké
      if (reservation.qr_code_data) {
        try {
          const qrData = JSON.parse(reservation.qr_code_data);
          return res.json({
            success: true,
            qr_data_url: qrData.qr_data || qrData.qr_data_url,
            qr_payload: qrData,
            reservation_id: reservation.reservation_id
          });
        } catch (e) {
          // Si parsing échoue, générer nouveau
        }
      }

      // Générer nouveau QR
      const qrData = {
        type: 'RESERVATION',
        reservation_id: reservation.reservation_id,
        num_reza: reservation.num_reza_mmt,
        user_id: parseInt(user_id),
        depart: reservation.Lieu_depart,
        arrivee: reservation.Lieu_arrivee,
        date_depart: reservation.Date_depart,
        transport: reservation.Type_Transport,
        assistance_PMR: reservation.assistance_PMR === 'Oui',
        booking_reference: reservation.booking_reference,
        issued_at: new Date().toISOString()
      };

      const qrResult = await qrService.generateSimpleQR(`RES-${reservationId}`, qrData);

      return res.json({
        success: true,
        qr_data_url: qrResult,
        qr_payload: qrData,
        reservation_id: reservation.reservation_id
      });
    }

    const voyagesCollection = getVoyageCollection();
    const voyage = await voyagesCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(id),
      id_pmr: parseInt(user_id)
    });

    if (!voyage) {
      return res.status(404).json({
        success: false,
        error: 'Voyage introuvable'
      });
    }

    // Récupérer réservation principale
    const reservation = await Reservations.findOne({
      where: { 
        user_id: parseInt(user_id),
        id_voyage: voyage.id_voyage
      }
    });

    // Données QR voyage
    const qrData = {
      type: 'VOYAGE',
      voyage_id: voyage._id.toString(),
      reservation_id: reservation?.reservation_id,
      user_id: parseInt(user_id),
      depart: voyage.etapes?.[0]?.adresse_1 || 'N/A',
      arrivee: voyage.etapes?.[voyage.etapes.length - 1]?.adresse_2 || 'N/A',
      date_depart: voyage.date_debut,
      train_vol: voyage.etapes?.[0]?.id || voyage.lieu_depart?.id,
      assistance_PMR: reservation?.assistance_PMR === 'Oui',
      issued_at: new Date().toISOString()
    };

    // Générer QR avec qrService
    const qrResult = await qrService.generateSimpleQR(`VOYAGE-${id}`, qrData);

    console.log(`✅ QR voyage généré`);

    res.json({
      success: true,
      qr_data_url: qrResult,
      qr_payload: qrData,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur génération QR voyage:', error);

    if (error.message.includes('introuvable')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
};

/**
 * PATCH /voyages/cancel-checkin/:reservation_id
 * Annuler check-in (boarding pass)
 */
exports.cancelCheckin = async (req, res) => {
  try {
    const { reservation_id } = req.params;
    const user_id = req.user?.user_id || req.body.user_id;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id requis'
      });
    }

    console.log(`❌ Annulation check-in réservation ${reservation_id}`);

    // Vérifier réservation appartient à l'utilisateur
    const reservation = await Reservations.findOne({
      where: { 
        reservation_id: parseInt(reservation_id),
        user_id: parseInt(user_id)
      }
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Réservation introuvable'
      });
    }

    // Annuler boarding pass
    const boardingPass = await BoardingPass.findOne({
      where: { reservation_id: parseInt(reservation_id) }
    });

    if (!boardingPass) {
      return res.status(404).json({
        success: false,
        error: 'Aucun boarding pass à annuler'
      });
    }

    await boardingPass.update({
      status: 'cancelled',
      cancelled_at: new Date()
    });

    // Remettre réservation en pending
    await reservation.update({
      ticket_status: 'pending'
    });

    console.log(`✅ Check-in annulé pour réservation ${reservation_id}`);

    res.json({
      success: true,
      message: 'Check-in annulé avec succès',
      reservation_id: parseInt(reservation_id),
      ticket_status: 'pending'
    });

  } catch (error) {
    console.error('❌ Erreur annulation check-in:', error);

    if (error.message.includes('introuvable')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
};

/**
 * DELETE /voyages/:id
 * Supprimer voyage complet
 */
exports.deleteVoyage = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user?.user_id || req.body.user_id;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id requis'
      });
    }

    console.log(`🗑️ Annulation voyage ${id}`);

    // Détecter si c'est une réservation standalone
    if (id.startsWith('standalone_')) {
      const reservationId = parseInt(id.replace('standalone_', ''));
      const reservation = await Reservations.findOne({
        where: { 
          reservation_id: reservationId,
          user_id: parseInt(user_id)
        }
      });

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'Réservation introuvable'
        });
      }

      await reservation.destroy();

      console.log(`✅ Réservation standalone ${reservationId} supprimée`);

      return res.json({
        success: true,
        message: 'Réservation supprimée avec succès'
      });
    }

    const voyagesCollection = getVoyageCollection();
    const voyage = await voyagesCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(id),
      id_pmr: parseInt(user_id)
    });

    if (!voyage) {
      return res.status(404).json({
        success: false,
        error: 'Voyage introuvable'
      });
    }

    // Supprimer réservations MySQL
    const reservations = await Reservations.findAll({
      where: { 
        user_id: parseInt(user_id),
        id_voyage: voyage.id_voyage
      }
    });

    for (const reservation of reservations) {
      // Supprimer boarding pass si existe
      await BoardingPass.destroy({
        where: { reservation_id: reservation.reservation_id }
      });

      // Supprimer réservation
      await reservation.destroy();
    }

    // Supprimer voyage MongoDB
    await voyagesCollection.deleteOne({ _id: new mongoose.Types.ObjectId(id) });

    console.log(`✅ Voyage ${id} supprimé complètement`);

    res.json({
      success: true,
      message: 'Voyage supprimé avec succès',
      voyage_id: id,
      reservations_deleted: reservations.length
    });

  } catch (error) {
    console.error('❌ Erreur suppression voyage:', error);

    if (error.message.includes('introuvable')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
};

module.exports = exports;
