const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modèle Agent - Vue sur les utilisateurs avec le rôle Agent
 * NOTE: Cette table partage les mêmes colonnes que User (table "User").
 * Le champ `id_agent` mappe `user_id`.
 */
const Agent = sequelize.define('Agent', {
  id_agent: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'user_id',
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  surname: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('PMR', 'Accompagnant', 'Agent'),
    allowNull: false
  },
  agent_qr_public_id: {
    type: DataTypes.STRING(64),
    allowNull: true
  }
}, {
  tableName: 'User',
  timestamps: false,
  defaultScope: {
    where: {
      role: 'Agent'
    }
  }
});

module.exports = Agent;
