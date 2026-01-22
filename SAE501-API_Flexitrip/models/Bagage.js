const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Bagage = sequelize.define('bagages', {
  bagage_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Identifiant unique du bagage'
  },
  reservation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Référence à la réservation (FK)'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID du propriétaire (User)'
  },
  id_voyage: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Identifiant numérique du voyage (optionnel)'
  },
  voyage_id_mongo: {
    type: DataTypes.STRING(24),
    allowNull: true,
    comment: 'ObjectId MongoDB du voyage (optionnel)'
  },
  bagage_public_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
    comment: 'Identifiant public (QR) du bagage'
  },
  bagage_type: {
    type: DataTypes.ENUM('cabine', 'soute', 'medical', 'fauteuil', 'autre'),
    allowNull: false,
    defaultValue: 'soute',
    comment: 'Type de bagage'
  },
  poids_kg: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Poids du bagage (kg)'
  },
  fragile: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Bagage fragile'
  },
  assistance_required: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Nécessite une assistance pour manutention'
  },
  photo_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'URL photo du bagage (optionnel)'
  },
  status: {
    type: DataTypes.ENUM('created', 'tagged', 'dropped', 'in_transit', 'loaded', 'arrived', 'delivered', 'exception'),
    allowNull: false,
    defaultValue: 'created',
    comment: 'Statut courant du bagage'
  },
  last_location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Dernière localisation connue'
  },
  last_event_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date du dernier événement de tracking'
  }
}, {
  tableName: 'bagages',
  timestamps: true,
  indexes: [
    { name: 'idx_bagages_user_id', fields: ['user_id'] },
    { name: 'idx_bagages_reservation_id', fields: ['reservation_id'] },
    { name: 'idx_bagages_public_id', fields: ['bagage_public_id'] },
    { name: 'idx_bagages_status', fields: ['status'] }
  ],
  comment: 'Bagages liés à une réservation (tracking par événements)'
});

module.exports = Bagage;
