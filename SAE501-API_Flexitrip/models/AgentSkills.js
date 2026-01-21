const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modèle AgentSkills - Compétences et certifications des agents PMR
 * Gère les types de handicaps pris en charge, certifications et niveau d'expérience
 */
const AgentSkills = sequelize.define('AgentSkills', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    comment: 'ID de l\'agent (FK vers Agent)'
  },
  disability_types: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Types de handicaps pris en charge ["wheelchair", "visual", "hearing", "cognitive"]'
  },
  certifications: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Certifications ["airport", "railway", "medical", "sign_language"]'
  },
  languages: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['fr'],
    comment: 'Langues parlées ["fr", "en", "es"]'
  },
  experience_level: {
    type: DataTypes.ENUM('junior', 'intermediate', 'senior', 'expert'),
    defaultValue: 'junior',
    allowNull: false,
    comment: 'Niveau d\'expérience'
  },
  experience_years: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Années d\'expérience'
  },
  total_missions_completed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Total de missions accomplies'
  },
  average_rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
    allowNull: false,
    comment: 'Note moyenne (0-5)'
  },
  specializations: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Spécialisations particulières ["heavy_equipment", "medical_emergency", "child_assistance"]'
  },
  transport_modes: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Modes de transport maîtrisés ["train", "plane", "bus", "taxi"]'
  },
  max_assistance_level: {
    type: DataTypes.ENUM('minimal', 'partial', 'full', 'medical'),
    defaultValue: 'partial',
    allowNull: false,
    comment: 'Niveau maximum d\'assistance pouvant être fourni'
  }
}, {
  tableName: 'agent_skills',
  timestamps: true,
  indexes: [
    { fields: ['agent_id'] },
    { fields: ['experience_level'] },
    { fields: ['average_rating'] }
  ],
  comment: 'Compétences et qualifications des agents PMR'
});

module.exports = AgentSkills;
