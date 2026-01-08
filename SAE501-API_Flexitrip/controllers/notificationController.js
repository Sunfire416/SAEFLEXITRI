const Notification = require('../models/Notification'); // MongoDB model

// Créer une nouvelle notification
exports.createNotification = async (req, res) => {
  try {
    const newNotification = await Notification.create(req.body);
    res.status(201).json(newNotification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création de la notification' });
  }
};

// Récupérer toutes les notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
  }
};

// Récupérer une notification par son ID
exports.getNotificationById = async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }
    res.status(200).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la notification' });
  }
};

// Mettre à jour une notification
exports.updateNotification = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedNotification = await Notification.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedNotification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }
    res.status(200).json(updatedNotification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la notification' });
  }
};

// Supprimer une notification
exports.deleteNotification = async (req, res) => {
  const { id } = req.params; // Récupérer l'ID depuis les paramètres de la requête
  try {
    const deleted = await Notification.destroy({
      where: { id },
    });
    if (!deleted) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }
    res.status(204).send(); // Suppression réussie, ne retourne rien
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la notification' });
  }
};
