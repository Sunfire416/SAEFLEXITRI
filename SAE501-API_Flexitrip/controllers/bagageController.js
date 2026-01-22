const crypto = require('crypto');
const { Bagage, BagageEvent, Reservations, User } = require('../models');
const notificationService = require('../services/notificationService');

function normalizeRole(role) {
  return typeof role === 'string' ? role.trim() : '';
}

async function requireCurrentUser(req) {
  const userId = req.user?.id;
  if (!userId) {
    return null;
  }

  return User.findOne({
    where: { user_id: userId },
    attributes: ['user_id', 'name', 'surname', 'email', 'role']
  });
}

function ensureRole(user, allowedRoles) {
  const role = normalizeRole(user?.role);
  return allowedRoles.includes(role);
}

function mapEventToStatus(eventType) {
  switch (eventType) {
    case 'TAG_PRINTED':
      return 'tagged';
    case 'DROP_OFF':
      return 'dropped';
    case 'TRANSFER':
      return 'in_transit';
    case 'LOAD':
      return 'loaded';
    case 'UNLOAD':
      return 'in_transit';
    case 'ARRIVAL':
      return 'arrived';
    case 'DELIVERY':
      return 'delivered';
    case 'EXCEPTION':
      return 'exception';
    default:
      return null;
  }
}

async function generateUniquePublicId() {
  // 32 chars hex (128 bits)
  return crypto.randomBytes(16).toString('hex');
}

/**
 * GET /bagages
 * PMR: liste tous ses bagages (avec statut courant)
 */
exports.listMyBagages = async (req, res) => {
  try {
    const currentUser = await requireCurrentUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    if (!ensureRole(currentUser, ['PMR', 'Accompagnant'])) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const bagages = await Bagage.findAll({
      where: { user_id: currentUser.user_id },
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: Reservations,
          as: 'reservation',
          attributes: ['reservation_id', 'num_reza_mmt', 'Type_Transport', 'Lieu_depart', 'Lieu_arrivee', 'Date_depart', 'Date_arrivee', 'etape_voyage'],
          required: false
        }
      ]
    });

    return res.json({
      success: true,
      bagages
    });
  } catch (error) {
    console.error('❌ Erreur listMyBagages:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /bagages
 * PMR: crée un bagage associé à une réservation et renvoie le QR content
 */
exports.createBagage = async (req, res) => {
  try {
    const currentUser = await requireCurrentUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    if (!ensureRole(currentUser, ['PMR', 'Accompagnant'])) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { reservation_id, bagage_type, poids_kg, fragile, assistance_required, photo_url } = req.body;

    if (!reservation_id) {
      return res.status(400).json({ success: false, error: 'reservation_id est requis' });
    }

    const reservation = await Reservations.findOne({
      where: { reservation_id },
      attributes: ['reservation_id', 'user_id', 'id_voyage', 'voyage_id_mongo']
    });

    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Réservation introuvable' });
    }

    if (reservation.user_id !== currentUser.user_id) {
      return res.status(403).json({ success: false, error: 'Cette réservation ne vous appartient pas' });
    }

    // Génération d'un bagage_public_id unique
    let bagagePublicId = await generateUniquePublicId();
    // Tenter quelques fois en cas de collision (très improbable)
    for (let i = 0; i < 3; i++) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await Bagage.findOne({ where: { bagage_public_id: bagagePublicId }, attributes: ['bagage_id'] });
      if (!exists) break;
      // eslint-disable-next-line no-await-in-loop
      bagagePublicId = await generateUniquePublicId();
    }

    const created = await Bagage.create({
      reservation_id: reservation.reservation_id,
      user_id: currentUser.user_id,
      id_voyage: reservation.id_voyage || null,
      voyage_id_mongo: reservation.voyage_id_mongo || null,
      bagage_public_id: bagagePublicId,
      bagage_type: bagage_type || 'soute',
      poids_kg: typeof poids_kg === 'number' ? poids_kg : (poids_kg ? Number(poids_kg) : null),
      fragile: Boolean(fragile),
      assistance_required: Boolean(assistance_required),
      photo_url: photo_url || null,
      status: 'tagged',
      last_location: null,
      last_event_at: new Date()
    });

    await BagageEvent.create({
      bagage_id: created.bagage_id,
      event_type: 'TAG_PRINTED',
      location: null,
      scanned_at: new Date(),
      actor_type: 'System',
      actor_user_id: null,
      actor_display_name: 'SYSTEM',
      note: 'Tag bagage généré',
      raw_data: { reservation_id: created.reservation_id }
    });

    return res.status(201).json({
      success: true,
      message: 'Bagage créé',
      bagage: created,
      qr_content: created.bagage_public_id
    });
  } catch (error) {
    console.error('❌ Erreur createBagage:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /bagages/:bagage_id/timeline
 * PMR: timeline d'un bagage (événements triés)
 */
exports.getTimeline = async (req, res) => {
  try {
    const currentUser = await requireCurrentUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    if (!ensureRole(currentUser, ['PMR', 'Accompagnant'])) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const bagageId = Number(req.params.bagage_id);
    if (!bagageId) {
      return res.status(400).json({ success: false, error: 'bagage_id invalide' });
    }

    const bagage = await Bagage.findOne({
      where: { bagage_id: bagageId, user_id: currentUser.user_id },
      include: [
        {
          model: Reservations,
          as: 'reservation',
          attributes: ['reservation_id', 'num_reza_mmt', 'Type_Transport', 'Lieu_depart', 'Lieu_arrivee', 'Date_depart', 'Date_arrivee', 'etape_voyage'],
          required: false
        }
      ]
    });

    if (!bagage) {
      return res.status(404).json({ success: false, error: 'Bagage introuvable' });
    }

    const events = await BagageEvent.findAll({
      where: { bagage_id: bagage.bagage_id },
      order: [['scanned_at', 'ASC']]
    });

    return res.json({
      success: true,
      bagage,
      events
    });
  } catch (error) {
    console.error('❌ Erreur getTimeline:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /bagages/scan
 * Agent: ajoute un événement de tracking à partir du bagage_public_id
 */
exports.scanBagage = async (req, res) => {
  try {
    const currentUser = await requireCurrentUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    if (!ensureRole(currentUser, ['Agent'])) {
      return res.status(403).json({ error: 'Accès refusé (Agent requis)' });
    }

    const { bagage_public_id, event_type, location, note } = req.body;

    const trimmedId = typeof bagage_public_id === 'string' ? bagage_public_id.trim() : '';
    const trimmedType = typeof event_type === 'string' ? event_type.trim() : '';

    if (!trimmedId) {
      return res.status(400).json({ success: false, error: 'bagage_public_id est requis' });
    }

    if (!trimmedType) {
      return res.status(400).json({ success: false, error: 'event_type est requis' });
    }

    const bagage = await Bagage.findOne({ where: { bagage_public_id: trimmedId } });
    if (!bagage) {
      return res.status(404).json({ success: false, error: 'Bagage introuvable' });
    }

    const newStatus = mapEventToStatus(trimmedType);
    if (!newStatus) {
      return res.status(400).json({ success: false, error: 'event_type invalide' });
    }

    const scannedAt = new Date();
    const actorDisplay = `${currentUser.surname || ''} ${currentUser.name || ''}`.trim() || currentUser.email;

    const createdEvent = await BagageEvent.create({
      bagage_id: bagage.bagage_id,
      event_type: trimmedType,
      location: typeof location === 'string' ? location.trim() : null,
      scanned_at: scannedAt,
      actor_type: 'Agent',
      actor_user_id: currentUser.user_id,
      actor_display_name: `${actorDisplay} - Agent`,
      note: typeof note === 'string' ? note.trim() : null,
      raw_data: { bagage_public_id: trimmedId }
    });

    bagage.status = newStatus;
    bagage.last_location = typeof location === 'string' ? location.trim() : bagage.last_location;
    bagage.last_event_at = scannedAt;
    await bagage.save();

    // Notification non bloquante (PMR)
    try {
      await notificationService.createNotification({
        user_id: bagage.user_id,
        type: 'BAGAGE_EVENT',
        title: '🧳 Mise à jour bagage',
        message: `Votre bagage (${bagage.bagage_public_id}) a un nouvel événement: ${trimmedType}.`,
        data: {
          bagage_id: bagage.bagage_id,
          bagage_public_id: bagage.bagage_public_id,
          event_type: trimmedType,
          location: bagage.last_location,
          scanned_at: scannedAt,
          status: bagage.status,
          reservation_id: bagage.reservation_id
        },
        priority: trimmedType === 'EXCEPTION' ? 'high' : 'medium',
        icon: '🧳'
      });
    } catch (notifError) {
      console.warn('⚠️ Notification bagage échouée (non bloquant):', notifError.message);
    }

    return res.json({
      success: true,
      message: 'Événement bagage enregistré',
      bagage,
      event: createdEvent
    });
  } catch (error) {
    console.error('❌ Erreur scanBagage:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
