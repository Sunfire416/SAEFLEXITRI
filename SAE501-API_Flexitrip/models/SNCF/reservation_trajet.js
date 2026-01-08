const { DataTypes } = require('sequelize');
const sequelize = require('../../config/databaseSNCF');

const reservation_trajet = sequelize.define('reservation_trajet', {
    id_reservation_trajet: {
        type: DataTypes.INTEGER(7),
        primaryKey: true,
        autoIncrement: true
    },
    nom: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    prenom: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    num_reza_PAX: {
        type: DataTypes.STRING(25),
        allowNull: false
    },
    num_reza_MMT: {
        type: DataTypes.STRING(25),
        allowNull: true
    },
    enregistre:{
        type: DataTypes.TINYINT,
    },
    assistance_PMR: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    id_trajet: {
        type: DataTypes.STRING(7),
        allowNull: false
    },
    bagage_verifie:{
        type: DataTypes.BOOLEAN,
        defaultValue: false 
    }

}, {
    tableName: 'reservation_trajet',
    timestamps: false
});


module.exports = reservation_trajet;