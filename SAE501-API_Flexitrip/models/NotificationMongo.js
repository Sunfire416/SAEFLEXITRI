/**
 * Model Notification MongoDB - Point 4
 * Collection: notifications
 * 
 * RENOMMÉ en NotificationMongo pour éviter conflit avec Sequelize Notification.js
 */

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  notification_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  user_id: {
    type: Number,
    required: true,
    index: true
  },
  
  type: {
    type: String,
    required: true,
    enum: [
      'ENROLLMENT_SUCCESS',
      'ENROLLMENT_FAILURE',
      'CHECKIN_SUCCESS',
      'CHECKIN_FAILURE',
      'BOARDING_SUCCESS',
      'BOARDING_FAILURE',
      'DELAY',
      'GATE_CHANGE',
      'CANCELLATION',
      'AGENT_ASSIGNED',
      'GENERAL'
    ],
    index: true
  },
  
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  agent_info: {
    name: String,
    phone: String,
    email: String,
    company: String,
    location: String
  },
  
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  
  read_at: {
    type: Date,
    default: null
  },
  
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  icon: {
    type: String,
    default: '🔔'
  },
  
  action_url: {
    type: String,
    default: null
  },
  
  expires_at: {
    type: Date,
    default: null,
    index: true
  }
  
}, {
  timestamps: true,
  collection: 'notifications'
});

// Index composés
NotificationSchema.index({ user_id: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ user_id: 1, type: 1 });
NotificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index

/**
 * Méthodes statiques
 */

// Trouver notifications non lues d'un user
NotificationSchema.statics.findUnreadByUser = function(userId) {
  return this.find({
    user_id: userId,
    read: false
  }).sort({ createdAt: -1 });
};

// Compter notifications non lues
NotificationSchema.statics.countUnreadByUser = function(userId) {
  return this.countDocuments({
    user_id: userId,
    read: false
  });
};

// Marquer comme lues
NotificationSchema.statics.markAsRead = async function(notificationIds) {
  return this.updateMany(
    { notification_id: { $in: notificationIds } },
    { 
      $set: { 
        read: true,
        read_at: new Date()
      }
    }
  );
};

// Supprimer notifications expirées
NotificationSchema.statics.deleteExpired = function() {
  return this.deleteMany({
    expires_at: { $lt: new Date() }
  });
};

/**
 * Méthodes instance
 */

// Marquer cette notification comme lue
NotificationSchema.methods.markRead = function() {
  this.read = true;
  this.read_at = new Date();
  return this.save();
};

// Exporter le model avec vérification
module.exports = mongoose.models.NotificationMongo || mongoose.model('NotificationMongo', NotificationSchema, 'notifications');
