const Incident = require('../models/Incident');
const { Reservations } = require('../models/index');
const Notification = require('../models/Notification');

// Créer un incident
exports.createIncident = async (req, res) => {
  try {
    const { type, severity, reservationId, transportType, route, title, description, estimatedDelay } = req.body;
    const reportedBy = req.user.id;

    // Trouver les utilisateurs affectés
    let affectedUsers = [];
    if (reservationId) {
      const reservation = await Reservations.findByPk(reservationId);
      if (reservation) {
        affectedUsers.push(reservation.user_id);
      }
    } else if (route) {
      // Trouver toutes les réservations sur cette route
      const reservations = await Reservations.findAll({
        where: {
          departure_city: route.departure,
          arrival_city: route.arrival
        }
      });
      affectedUsers = reservations.map(r => r.user_id);
    }

    const incident = new Incident({
      type,
      severity,
      reservationId,
      transportType,
      route,
      title,
      description,
      estimatedDelay,
      affectedUsers: [...new Set(affectedUsers)], // Dédupliquer
      reportedBy
    });

    await incident.save();

    // Créer des notifications pour les utilisateurs affectés
    if (affectedUsers.length > 0) {
      const notifications = affectedUsers.map(userId => ({
        userId,
        title: `Incident: ${title}`,
        message: description,
        type: 'incident',
        relatedId: incident._id.toString(),
        priority: severity === 'critique' ? 'high' : severity === 'eleve' ? 'medium' : 'low'
      }));

      await Notification.insertMany(notifications);
      incident.notificationsSent = true;
      await incident.save();
    }

    res.status(201).json({ message: 'Incident créé avec succès', incident });
  } catch (error) {
    console.error('Erreur création incident:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// Récupérer les incidents actifs
exports.getActiveIncidents = async (req, res) => {
  try {
    const { transportType, severity } = req.query;
    const userId = req.user.id;

    const query = { status: { $in: ['actif', 'en_cours'] } };
    
    if (transportType) query.transportType = transportType;
    if (severity) query.severity = severity;

    // Les utilisateurs voient leurs incidents, les agents voient tous
    if (req.user.role !== 'agent') {
      query.affectedUsers = userId;
    }

    const incidents = await Incident.find(query)
      .sort({ severity: -1, createdAt: -1 });

    res.json(incidents);
  } catch (error) {
    console.error('Erreur récupération incidents:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer un incident par ID
exports.getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({ error: 'Incident non trouvé' });
    }

    res.json(incident);
  } catch (error) {
    console.error('Erreur récupération incident:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Mettre à jour un incident (agents uniquement)
exports.updateIncident = async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ error: 'Réservé aux agents' });
    }

    const { id } = req.params;
    const updates = req.body;

    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident non trouvé' });
    }

    Object.assign(incident, updates);

    // Si résolu, enregistrer la date
    if (updates.status === 'resolu' && !incident.resolvedAt) {
      incident.resolvedAt = new Date();
      
      // Notifier les utilisateurs affectés
      if (incident.affectedUsers.length > 0) {
        const notifications = incident.affectedUsers.map(userId => ({
          userId,
          title: `Incident résolu: ${incident.title}`,
          message: incident.resolution || 'L\'incident a été résolu',
          type: 'incident_resolved',
          relatedId: incident._id.toString()
        }));
        await Notification.insertMany(notifications);
      }
    }

    await incident.save();
    res.json({ message: 'Incident mis à jour', incident });
  } catch (error) {
    console.error('Erreur mise à jour incident:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Ajouter des options de réacheminement
exports.addRerouteOptions = async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ error: 'Réservé aux agents' });
    }

    const { id } = req.params;
    const { rerouteOptions } = req.body;

    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident non trouvé' });
    }

    incident.rerouteOptions = rerouteOptions;
    await incident.save();

    // Notifier les utilisateurs des nouvelles options
    if (incident.affectedUsers.length > 0) {
      const notifications = incident.affectedUsers.map(userId => ({
        userId,
        title: 'Options de réacheminement disponibles',
        message: `De nouvelles options sont disponibles pour l'incident: ${incident.title}`,
        type: 'reroute_option',
        relatedId: incident._id.toString()
      }));
      await Notification.insertMany(notifications);
    }

    res.json({ message: 'Options ajoutées', incident });
  } catch (error) {
    console.error('Erreur ajout options:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Supprimer un incident (agents uniquement)
exports.deleteIncident = async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ error: 'Réservé aux agents' });
    }

    const { id } = req.params;
    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({ error: 'Incident non trouvé' });
    }

    await incident.deleteOne();
    res.json({ message: 'Incident supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression incident:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
