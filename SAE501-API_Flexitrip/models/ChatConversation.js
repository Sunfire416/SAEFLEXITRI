const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * ChatConversation
 * Conversation PMR <-> Agent liée à une réservation + étape.
 * Additif: n'impacte aucune table existante.
 */
const ChatConversation = sequelize.define(
  'chat_conversation',
  {
    conversation_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'ID unique de la conversation'
    },
    reservation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID réservation (FK logique)'
    },
    etape_numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Numéro étape (1,2,3...)'
    },
    pmr_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'User ID du PMR (FK logique)'
    },
    agent_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "User ID de l'Agent (FK logique)"
    },
    status: {
      type: DataTypes.ENUM('open', 'closed'),
      allowNull: false,
      defaultValue: 'open',
      comment: 'Statut de la conversation'
    }
  },
  {
    tableName: 'chat_conversations',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['reservation_id', 'etape_numero']
      },
      { fields: ['pmr_user_id'] },
      { fields: ['agent_user_id'] }
    ]
  }
);

module.exports = ChatConversation;
