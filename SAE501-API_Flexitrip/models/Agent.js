const { DataTypes } = require('sequelize');
const {sequelize}  = require('../config/database');

const Agent = sequelize.define('Agent', {
    id_agent: { // Adapté au nom de la colonne dans votre base de données
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    surname: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    entreprise: {
        type: DataTypes.STRING(255)
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
}, {
    tableName: 'Agent', // Assurez-vous que c'est le nom exact de la table dans la DB
    timestamps: false   // Désactive les champs createdAt et updatedAt
});

module.exports = Agent;
