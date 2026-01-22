const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PriseEnCharge = sequelize.define('prise_en_charge', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'ID unique de la prise en charge'
  },
  reservation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Référence à la réservation (FK)'
  },
  voyage_id_mongo: {
    type: DataTypes.STRING(24),
    allowNull: true,
    comment: 'ID du voyage MongoDB'
  },
  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Agent assigné (FK vers Agent, nullable car assignation peut être après)'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID de l\'utilisateur PMR (FK)'
  },
  etape_numero: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Numéro de l\'étape dans le voyage (1, 2, 3...)'
  },
  validation_token: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
    comment: 'Token public unique pour validation (crypto.randomBytes)'
  },
  status: {
    type: DataTypes.ENUM('pending', 'validated', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false,
    comment: 'Statut de la prise en charge'
  },
  validated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date/heure de validation'
  },
  validated_by: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nom/fonction du validateur (ex: Jean Dupont - Agent SNCF)'
  },
  validated_agent_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID du compte User (role=Agent) ayant validé via QR (nullable)'
  },
  validation_method: {
    type: DataTypes.STRING(32),
    allowNull: true,
    comment: 'Méthode de validation (ex: qr, manual)'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Lieu de prise en charge (gare, arrêt, aéroport...)'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes additionnelles sur la prise en charge'
  },
  priority_level: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent', 'critical'),
    defaultValue: 'normal',
    allowNull: false,
    comment: 'Niveau de priorité de la mission'
  },
  pmr_dependency_level: {
    type: DataTypes.ENUM('minimal', 'partial', 'significant', 'complete'),
    defaultValue: 'partial',
    allowNull: false,
    comment: 'Niveau de dépendance du PMR'
  },
  is_critical_connection: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Indique si cette étape est une correspondance critique'
  },
  estimated_duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Durée estimée de la prise en charge en minutes'
  },
  actual_start_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Heure réelle de début de prise en charge'
  },
  actual_end_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Heure réelle de fin de prise en charge'
  },
  reassignment_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Nombre de fois que la mission a été réassignée'
  },
  reassignment_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Raison de la dernière réassignation'
  }
}, {
  tableName: 'prise_en_charge',
  timestamps: true, // createdAt, updatedAt
  indexes: [
    { fields: ['priority_level'] },
    { fields: ['status', 'priority_level'] },
    { fields: ['is_critical_connection'] }
  ],
  comment: 'Traçabilité des prises en charge PMR par agents/personnel transport avec gestion intelligente des priorités'
});

module.exports = PriseEnCharge;
