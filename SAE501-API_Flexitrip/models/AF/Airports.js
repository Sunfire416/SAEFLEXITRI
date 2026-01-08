const { DataTypes } = require('sequelize');
const sequelize = require('../../config/databaseAF');

const Airports = sequelize.define('Airports', {
    airport_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,  // La colonne airport_id est définie pour être auto-incrémentée
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    city: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    country: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    iata_code: {
        type: DataTypes.STRING(3),
        allowNull: false
    },
    icao_code: {
        type: DataTypes.STRING(3),
        allowNull: false
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, {
    tableName: 'Airports',
    timestamps: false // Désactive les champs `createdAt` et `updatedAt` si vous n'en avez pas besoin
});

// Export du modèle
module.exports = Airports;
