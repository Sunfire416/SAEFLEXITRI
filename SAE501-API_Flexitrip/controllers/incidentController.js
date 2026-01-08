const Incident = require('../models/Incident');
const { Reservations } = require('../models');
const Notification = require('../models/Notification');

/**
 * Créer un nouvel incident
 */
const createIncident = async (req, res) => {
    try {
        const {
            type,
            severity,
            reservationId,
            transportType,
            route,
            title,
            description,
            estimatedDelay
        } = req.body;

        // Validation
        if (!type || !severity || !transportType || !route || !title || !description) {
            return res.status(400).json({ 
                message: 'Données manquantes (type, severity, transportType, route, title, description requis)' 
            });
        }

        // Trouver les utilisateurs affectés
        let affectedUsers = [];
        if (reservationId) {
            const reservation = await Reservations.findOne({
                where: { reservation_id: reservationId }
            });
            if (reservation) {
                affectedUsers.push(reservation.user_id);
            }
        } else {
            // Chercher toutes les réservations sur cette route
            const reservations = await Reservations.findAll({
                where: {
                    Lieu_depart: route.departure,
                    Lieu_arrivee: route.arrival,
                    Statut: 'confirmed'
                }
            });
            affectedUsers = reservations.map(r => r.user_id);
        }

        // Créer l'incident
        const incident = new Incident({
            type,
            severity,
            reservationId,
            transportType,
            route,
            title,
            description,
            estimatedDelay: estimatedDelay || 0,
            affectedUsers,
            status: 'active',
            reportedBy: req.user?.role === 'agent' ? 'agent' : 'system'
        });

        await incident.save();

        // Envoyer des notifications aux utilisateurs affectés
        await notifyAffectedUsers(incident, affectedUsers);

        res.status(201).json({
            message: 'Incident créé avec succès',
            incident,
            affectedUsersCount: affectedUsers.length
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'incident:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la création de l\'incident',
            error: error.message 
        });
    }
};

/**
 * Notifier les utilisateurs affectés
 */
const notifyAffectedUsers = async (incident, userIds) => {
    try {
        const message = `⚠️ ${incident.title}: ${incident.description}`;
        
        const notifications = userIds.map(userId => ({
            UserId: userId,
            Message: message,
            DateSent: new Date()
        }));

        await Notification.insertMany(notifications);
        
        incident.notificationsSent = true;
        incident.notifiedAt = new Date();
        await incident.save();

        console.log(`✅ ${userIds.length} notifications envoyées pour incident ${incident._id}`);
    } catch (error) {
        console.error('Erreur lors de l\'envoi des notifications:', error);
    }
};

/**
 * Récupérer les incidents actifs
 */
const getActiveIncidents = async (req, res) => {
    try {
        const { transportType, severity, userId } = req.query;

        const filter = { status: 'active' };
        if (transportType) filter.transportType = transportType;
        if (severity) filter.severity = severity;
        if (userId) filter.affectedUsers = parseInt(userId);

        const incidents = await Incident.find(filter)
            .sort({ severity: -1, reportedAt: -1 });

        res.status(200).json({
            count: incidents.length,
            incidents
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des incidents:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération des incidents',
            error: error.message 
        });
    }
};

/**
 * Récupérer un incident par ID
 */
const getIncidentById = async (req, res) => {
    try {
        const { incidentId } = req.params;

        const incident = await Incident.findById(incidentId);

        if (!incident) {
            return res.status(404).json({ message: 'Incident non trouvé' });
        }

        res.status(200).json(incident);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'incident:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération de l\'incident',
            error: error.message 
        });
    }
};

/**
 * Mettre à jour un incident
 */
const updateIncident = async (req, res) => {
    try {
        const { incidentId } = req.params;
        const updates = req.body;

        const incident = await Incident.findById(incidentId);

        if (!incident) {
            return res.status(404).json({ message: 'Incident non trouvé' });
        }

        // Autoriser la mise à jour de certains champs
        const allowedUpdates = [
            'status', 
            'resolution', 
            'estimatedDelay', 
            'description',
            'rerouteOptions'
        ];

        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                incident[field] = updates[field];
            }
        });

        if (updates.status === 'resolved') {
            incident.resolvedAt = new Date();
        }

        await incident.save();

        // Si le statut change, notifier les utilisateurs
        if (updates.status || updates.rerouteOptions) {
            await notifyIncidentUpdate(incident);
        }

        res.status(200).json({
            message: 'Incident mis à jour avec succès',
            incident
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'incident:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la mise à jour de l\'incident',
            error: error.message 
        });
    }
};

/**
 * Notifier de la mise à jour d'un incident
 */
const notifyIncidentUpdate = async (incident) => {
    try {
        let message = '';
        if (incident.status === 'resolved') {
            message = `✅ Incident résolu: ${incident.title}`;
        } else if (incident.rerouteOptions && incident.rerouteOptions.length > 0) {
            message = `🔄 Options de réacheminement disponibles pour: ${incident.title}`;
        }

        if (message) {
            const notifications = incident.affectedUsers.map(userId => ({
                UserId: userId,
                Message: message,
                DateSent: new Date()
            }));

            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error('Erreur lors de la notification de mise à jour:', error);
    }
};

/**
 * Ajouter des options de réacheminement
 */
const addRerouteOptions = async (req, res) => {
    try {
        const { incidentId } = req.params;
        const { rerouteOptions } = req.body;

        if (!rerouteOptions || !Array.isArray(rerouteOptions)) {
            return res.status(400).json({ 
                message: 'rerouteOptions doit être un tableau' 
            });
        }

        const incident = await Incident.findById(incidentId);

        if (!incident) {
            return res.status(404).json({ message: 'Incident non trouvé' });
        }

        incident.rerouteOptions = rerouteOptions;
        await incident.save();

        // Notifier les utilisateurs
        await notifyIncidentUpdate(incident);

        res.status(200).json({
            message: 'Options de réacheminement ajoutées',
            incident
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout des options:', error);
        res.status(500).json({ 
            message: 'Erreur lors de l\'ajout des options',
            error: error.message 
        });
    }
};

/**
 * Supprimer un incident
 */
const deleteIncident = async (req, res) => {
    try {
        const { incidentId } = req.params;

        const incident = await Incident.findByIdAndDelete(incidentId);

        if (!incident) {
            return res.status(404).json({ message: 'Incident non trouvé' });
        }

        res.status(200).json({
            message: 'Incident supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'incident:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la suppression de l\'incident',
            error: error.message 
        });
    }
};

module.exports = {
    createIncident,
    getActiveIncidents,
    getIncidentById,
    updateIncident,
    addRerouteOptions,
    deleteIncident
};
