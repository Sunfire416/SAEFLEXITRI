/**
 * Service Notifications - Supabase
 * Gère la création et l'envoi de notifications utilisateur
 */

const SupabaseService = require('./SupabaseService');
const crypto = require('crypto');

/**
 * Génère un ID notification unique
 */
const generateNotificationId = (userId) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `NOTIF-${userId}-${timestamp}-${random}`;
};

/**
 * Créer et envoyer une notification
 * @param {Object} data - Données notification
 * @returns {Promise<Object>} Notification créée
 */
const createNotification = async (data) => {
  try {
    const {
      user_id,
      type,
      title,
      message,
      data: additionalData = {},
      agent_info = null,
      priority = 'normal',
      icon = '🔔',
      action_url = null,
      expires_in_days = 30
    } = data;

    // Validation
    if (!user_id || !type || !title || !message) {
      throw new Error('Champs requis manquants: user_id, type, title, message');
    }

    const notificationData = {
      user_id,
      type,
      title,
      message,
      data: additionalData,
      agent_info,
      priority,
      icon,
      action_url,
      expires_at: new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString(),
      read: false
    };

    // Créer notification via Supabase
    const notification = await SupabaseService.createNotification(notificationData);

    console.log(`✅ Notification créée: ${notification.notification_id}`);

    return notification;

  } catch (error) {
    console.error('❌ Erreur création notification:', error);
    throw error;
  }
};

/**
 * Notification Enrollment réussi
 */
const sendEnrollmentSuccess = async (userId, enrollmentData) => {
  const { enrollment_id, identity_data } = enrollmentData;

  return createNotification({
    user_id: userId,
    type: 'ENROLLMENT_SUCCESS',
    title: '✅ Enregistrement biométrique réussi',
    message: `Bonjour ${identity_data?.prenom || ''}, votre enregistrement biométrique est confirmé. Vous pouvez maintenant effectuer votre check-in.`,
    data: {
      source: 'enrollment',
      enrollment_id,
      identity: identity_data
    },
    icon: '✅',
    priority: 'normal',
    action_url: '/user/voyages'
  });
};

/**
 * Notification Check-in réussi
 */
const sendCheckinSuccess = async (userId, checkinData, agentInfo = null) => {
  const { boarding_pass, reservation_id } = checkinData;

  let message = `Votre check-in est confirmé. Boarding pass généré.`;
  if (boarding_pass?.gate) {
    message += ` Porte: ${boarding_pass.gate}.`;
  }
  if (boarding_pass?.seat) {
    message += ` Siège: ${boarding_pass.seat}.`;
  }
  if (boarding_pass?.pmr_assistance) {
    message += ` Un agent PMR vous assistera.`;
  }

  return createNotification({
    user_id: userId,
    type: 'CHECKIN_SUCCESS',
    title: '🎫 Check-in réussi',
    message,
    data: {
      source: 'checkin',
      reservation_id,
      boarding_pass: {
        pass_id: boarding_pass?.pass_id,
        flight_train: boarding_pass?.flight_train || boarding_pass?.flight_train_number,
        gate: boarding_pass?.gate,
        seat: boarding_pass?.seat,
        boarding_time: boarding_pass?.boarding_time
      }
    },
    agent_info: agentInfo,
    icon: '🎫',
    priority: 'high',
    action_url: '/user/voyages'
  });
};

/**
 * Notification Boarding réussi
 */
const sendBoardingSuccess = async (userId, boardingData, agentInfo = null) => {
  const { passenger } = boardingData;

  let message = `Embarquement confirmé pour le vol/train ${passenger?.flight_train || 'N/A'}.`;
  if (passenger?.pmr_assistance) {
    message += ` Assistance PMR activée. Profitez de votre voyage !`;
  }

  return createNotification({
    user_id: userId,
    type: 'BOARDING_SUCCESS',
    title: '✈️ Embarquement confirmé',
    message,
    data: {
      source: 'boarding',
      ...boardingData
    },
    agent_info: agentInfo,
    icon: '✈️',
    priority: 'high',
    action_url: '/user/voyages'
  });
};

/**
 * Notification Retard
 */
const sendDelayNotification = async (userId, delayData) => {
  const { flight_train, old_time, new_time, delay_minutes, reason } = delayData;

  return createNotification({
    user_id: userId,
    type: 'DELAY',
    title: '⚠️ Retard signalé',
    message: `Le ${flight_train} a un retard de ${delay_minutes} minutes. Nouveau départ: ${new_time}. Raison: ${reason || 'Non précisée'}.`,
    data: {
      source: 'system',
      flight_train,
      old_time,
      new_time,
      delay_minutes,
      reason
    },
    icon: '⚠️',
    priority: 'urgent',
    action_url: '/user/voyages'
  });
};

/**
 * Notification Changement de porte
 */
const sendGateChangeNotification = async (userId, gateData) => {
  const { flight_train, old_gate, new_gate, reason } = gateData;

  return createNotification({
    user_id: userId,
    type: 'GATE_CHANGE',
    title: '🚪 Changement de porte',
    message: `Le ${flight_train} a changé de porte : ${old_gate} → ${new_gate}. ${reason || ''}`,
    data: {
      source: 'system',
      flight_train,
      old_gate,
      new_gate,
      reason
    },
    icon: '🚪',
    priority: 'urgent',
    action_url: '/user/voyages'
  });
};

/**
 * Notification Agent assigné
 */
const sendAgentAssigned = async (userId, agentInfo, location) => {
  return createNotification({
    user_id: userId,
    type: 'AGENT_ASSIGNED',
    title: '👤 Agent PMR assigné',
    message: `${agentInfo.name} vous assistera à ${location}. Contact: ${agentInfo.phone}`,
    data: {
      source: 'system',
      location
    },
    agent_info: agentInfo,
    icon: '👤',
    priority: 'normal',
    action_url: null
  });
};

/**
 * Récupérer notifications utilisateur
 */
const getUserNotifications = async (userId, options = {}) => {
  try {
    const {
      limit = 50,
      skip = 0,
      unread_only = false,
      type = null
    } = options;

    return await SupabaseService.getUserNotifications(userId, limit, skip, unread_only, type);
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    throw error;
  }
};

/**
 * Marquer notification(s) comme lue(s)
 */
const markAsRead = async (notificationIds) => {
  try {
    if (!Array.isArray(notificationIds)) {
      notificationIds = [notificationIds];
    }

    // Pour l'instant on boucle, mais on pourrait ajouter une méthode bulk dans SupabaseService
    const results = [];
    for (const id of notificationIds) {
      results.push(await SupabaseService.markNotificationAsRead(id));
    }
    return results;

  } catch (error) {
    console.error('❌ Erreur marquage notification:', error);
    throw error;
  }
};

/**
 * Marquer toutes les notifications comme lues
 */
const markAllAsRead = async (userId) => {
  try {
    return await SupabaseService.markAllNotificationsAsRead(userId);
  } catch (error) {
    console.error('❌ Erreur marquage toutes notifications:', error);
    throw error;
  }
};

/**
 * Supprimer notification
 */
const deleteNotification = async (notificationId) => {
  try {
    return await SupabaseService.deleteNotification(notificationId);
  } catch (error) {
    console.error('❌ Erreur suppression notification:', error);
    throw error;
  }
};

/**
 * Nettoyer notifications expirées (CRON job)
 */
const cleanExpiredNotifications = async () => {
  try {
    return await SupabaseService.deleteExpiredNotifications();
  } catch (error) {
    console.error('❌ Erreur nettoyage notifications:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  sendEnrollmentSuccess,
  sendCheckinSuccess,
  sendBoardingSuccess,
  sendDelayNotification,
  sendGateChangeNotification,
  sendAgentAssigned,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  cleanExpiredNotifications
};
