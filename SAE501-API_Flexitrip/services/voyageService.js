/**
 * Service Voyages
 * Gestion historique, QR codes, annulations
 * 
 * Travaille avec:
 * - MongoDB voyages
 * - MySQL reservations
 * - qrService pour génération QR
 */

const { Voyage } = require('../models');
const { Reservations, BoardingPass, User } = require('../models');
const qrService = require('./qrService');
const mongoose = require('mongoose');

// Model MongoDB Voyage (si pas déjà importé)
const VoyageModel = mongoose.model('Voyage', new mongoose.Schema({}, { strict: false }), 'voyages');

/**
 * Récupérer historique voyages utilisateur
 * @param {number} userId - ID utilisateur
 * @param {Object} filters - Filtres (status, date)
 * @returns {Promise<Array>} Liste voyages avec réservations
 */
const getVoyageHistory = async (userId, filters = {}) => {
  try {
    console.log(`📋 Récupération historique voyages user ${userId}`);

    const {
      status = null, // 'pending', 'confirmed', 'completed', 'cancelled'
      limit = 50,
      skip = 0
    } = filters;

    // Récupérer voyages MongoDB
    const voyagesQuery = { id_pmr: userId };
    const voyages = await VoyageModel.find(voyagesQuery)
      .sort({ date_debut: -1 })
      .skip(skip)
      .limit(limit);

    // Pour chaque voyage, récupérer réservations MySQL
    const voyagesWithReservations = await Promise.all(
      voyages.map(async (voyage) => {
        const reservations = await Reservations.findAll({
          where: { 
            user_id: userId,
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

    // Filtrer par status si demandé
    let filteredVoyages = voyagesWithReservations;
    if (status) {
      filteredVoyages = voyagesWithReservations.filter(v => v.status === status);
    }

    console.log(`✅ ${filteredVoyages.length} voyage(s) trouvé(s)`);

    return {
      voyages: filteredVoyages,
      total: filteredVoyages.length
    };

  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    throw error;
  }
};

/**
 * Récupérer détails voyage complet
 * @param {string} voyageId - MongoDB ObjectId
 * @param {number} userId - ID utilisateur
 * @returns {Promise<Object>} Voyage détaillé
 */
const getVoyageDetails = async (voyageId, userId) => {
  try {
    console.log(`🔍 Récupération détails voyage ${voyageId}`);

    const voyage = await VoyageModel.findOne({ 
      _id: voyageId,
      id_pmr: userId 
    });

    if (!voyage) {
      throw new Error('Voyage introuvable ou accès non autorisé');
    }

    // Récupérer réservations
    const reservations = await Reservations.findAll({
      where: { 
        user_id: userId,
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
    const user = await User.findOne({ where: { user_id: userId } });

    return {
      voyage_id: voyage._id.toString(),
      id_voyage: voyage.id_voyage,
      user: {
        user_id: userId,
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
    };

  } catch (error) {
    console.error('❌ Erreur récupération détails voyage:', error);
    throw error;
  }
};

/**
 * Générer QR code voyage
 * @param {string} voyageId - MongoDB ObjectId
 * @param {number} userId - ID utilisateur
 * @returns {Promise<Object>} QR code
 */
const generateVoyageQR = async (voyageId, userId) => {
  try {
    console.log(`📱 Génération QR voyage ${voyageId}`);

    const voyage = await VoyageModel.findOne({ 
      _id: voyageId,
      id_pmr: userId 
    });

    if (!voyage) {
      throw new Error('Voyage introuvable');
    }

    // Récupérer réservation principale
    const reservation = await Reservations.findOne({
      where: { 
        user_id: userId,
        id_voyage: voyage.id_voyage
      }
    });

    // Données QR voyage
    const qrData = {
      type: 'VOYAGE',
      voyage_id: voyage._id.toString(),
      reservation_id: reservation?.reservation_id,
      user_id: userId,
      depart: voyage.etapes?.[0]?.adresse_1 || 'N/A',
      arrivee: voyage.etapes?.[voyage.etapes.length - 1]?.adresse_2 || 'N/A',
      date_depart: voyage.date_debut,
      train_vol: voyage.etapes?.[0]?.id || voyage.lieu_depart?.id,
      assistance_PMR: reservation?.assistance_PMR === 'Oui',
      issued_at: new Date().toISOString()
    };

    // Générer QR avec qrService
    const qrResult = await qrService.generateSimpleQR(`VOYAGE-${voyageId}`, qrData);

    console.log(`✅ QR voyage généré`);

    return {
      qr_data_url: qrResult,
      qr_payload: qrData,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Erreur génération QR voyage:', error);
    throw error;
  }
};

/**
 * Annuler check-in (boarding pass uniquement)
 * @param {number} reservationId - ID réservation
 * @param {number} userId - ID utilisateur
 * @returns {Promise<Object>} Résultat
 */
const cancelCheckin = async (reservationId, userId) => {
  try {
    console.log(`❌ Annulation check-in réservation ${reservationId}`);

    // Vérifier réservation appartient à l'utilisateur
    const reservation = await Reservations.findOne({
      where: { 
        reservation_id: reservationId,
        user_id: userId
      }
    });

    if (!reservation) {
      throw new Error('Réservation introuvable');
    }

    // Annuler boarding pass
    const boardingPass = await BoardingPass.findOne({
      where: { reservation_id: reservationId }
    });

    if (!boardingPass) {
      throw new Error('Aucun boarding pass à annuler');
    }

    await boardingPass.update({
      status: 'cancelled',
      cancelled_at: new Date()
    });

    // Remettre réservation en pending
    await reservation.update({
      enregistre: 0,
      ticket_status: 'pending'
    });

    console.log(`✅ Check-in annulé pour réservation ${reservationId}`);

    return {
      success: true,
      message: 'Check-in annulé avec succès',
      reservation_id: reservationId,
      ticket_status: 'pending'
    };

  } catch (error) {
    console.error('❌ Erreur annulation check-in:', error);
    throw error;
  }
};

/**
 * Annuler voyage complet (SUPPRESSION RÉELLE)
 * @param {string} voyageId - MongoDB ObjectId
 * @param {number} userId - ID utilisateur
 * @returns {Promise<Object>} Résultat
 */
const cancelVoyage = async (voyageId, userId) => {
  try {
    console.log(`🗑️ Annulation voyage ${voyageId}`);

    const voyage = await VoyageModel.findOne({ 
      _id: voyageId,
      id_pmr: userId 
    });

    if (!voyage) {
      throw new Error('Voyage introuvable');
    }

    // Supprimer réservations MySQL
    const reservations = await Reservations.findAll({
      where: { 
        user_id: userId,
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
    await VoyageModel.deleteOne({ _id: voyageId });

    console.log(`✅ Voyage ${voyageId} supprimé complètement`);

    return {
      success: true,
      message: 'Voyage supprimé avec succès',
      voyage_id: voyageId,
      reservations_deleted: reservations.length
    };

  } catch (error) {
    console.error('❌ Erreur annulation voyage:', error);
    throw error;
  }
};

module.exports = {
  getVoyageHistory,
  getVoyageDetails,
  generateVoyageQR,
  cancelCheckin,
  cancelVoyage
};
