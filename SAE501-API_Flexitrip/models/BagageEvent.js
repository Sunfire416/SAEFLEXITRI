const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BagageEvent = sequelize.define('bagage_events', {
  event_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Identifiant unique de l\'événement'
  },
  bagage_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'FK vers bagages'
  },
  event_type: {
    type: DataTypes.ENUM(
      'TAG_PRINTED',
      'DROP_OFF',
      'TRANSFER',
      'LOAD',
      'UNLOAD',
      'ARRIVAL',
      'DELIVERY',
      'EXCEPTION'
    ),
    allowNull: false,
    comment: 'Type d\'événement de tracking'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Lieu de l\'événement'
  },
  scanned_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Horodatage de l\'événement'
  },
  actor_type: {
    type: DataTypes.ENUM('Agent', 'System'),
    allowNull: false,
    defaultValue: 'Agent',
    comment: 'Type d\'acteur ayant créé l\'événement'
  },
  actor_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID User (si actor_type=Agent)'
  },
  actor_display_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nom affiché de l\'acteur'
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Note libre'
  },
  photo_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'URL photo (preuve dépôt/livraison)'
  },
  raw_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Données brutes (optionnel)'
  }
}, {
  tableName: 'bagage_events',
  timestamps: true,
  indexes: [
    { name: 'idx_bagage_events_bagage_id', fields: ['bagage_id'] },
    { name: 'idx_bagage_events_scanned_at', fields: ['scanned_at'] },
    { name: 'idx_bagage_events_event_type', fields: ['event_type'] }
  ],
  comment: 'Événements de tracking bagage'
});

module.exports = BagageEvent;
