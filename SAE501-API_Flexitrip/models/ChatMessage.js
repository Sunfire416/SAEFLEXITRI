const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * ChatMessage
 * Message d'une conversation chat.
 * Additif: n'impacte aucune table existante.
 */
const ChatMessage = sequelize.define(
  'chat_message',
  {
    message_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'ID unique du message'
    },
    conversation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID conversation (FK logique)'
    },
    sender_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "User ID de l'expéditeur (FK logique)"
    },
    message_type: {
      type: DataTypes.ENUM('text', 'system'),
      allowNull: false,
      defaultValue: 'text',
      comment: 'Type de message'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Contenu du message'
    }
  },
  {
    tableName: 'chat_messages',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['conversation_id', 'createdAt'] },
      { fields: ['conversation_id', 'message_id'] },
      { fields: ['sender_user_id'] }
    ]
  }
);

module.exports = ChatMessage;
