const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modèle AgentAvailability - Gestion de la disponibilité des agents PMR
 * Permet de suivre les horaires, le statut et la charge de travail en temps réel
 */
const AgentAvailability = sequelize.define('AgentAvailability', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID de l\'agent (FK vers Agent)'
  },
  status: {
    type: DataTypes.ENUM('available', 'busy', 'on_mission', 'break', 'off_duty'),
    defaultValue: 'available',
    allowNull: false,
    comment: 'Statut actuel de l\'agent'
  },
  current_location: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    comment: 'Localisation actuelle GPS {lat, lng, location_name}'
  },
  assigned_missions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Nombre de missions en cours'
  },
  total_missions_today: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Total de missions effectuées aujourd\'hui'
  },
  last_mission_end: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date/heure de fin de dernière mission'
  },
  shift_start: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Heure de début de service'
  },
  shift_end: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Heure de fin de service'
  },
  max_missions_per_day: {
    type: DataTypes.INTEGER,
    defaultValue: 8,
    allowNull: false,
    comment: 'Nombre maximum de missions par jour'
  },
  workload_score: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
    allowNull: false,
    comment: 'Score de charge de travail (0-100)'
  },
  last_updated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    comment: 'Dernière mise à jour du statut'
  }
}, {
  tableName: 'agent_availability',
  timestamps: true,
  indexes: [
    { fields: ['agent_id'] },
    { fields: ['status'] },
    { fields: ['workload_score'] }
  ],
  comment: 'Suivi de la disponibilité et charge de travail des agents PMR'
});

module.exports = AgentAvailability;
