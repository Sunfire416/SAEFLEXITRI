const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const Facturation = sequelize.define('facturation', {
    billing_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    payment_status: {
        type: DataTypes.ENUM('unpaid', 'pending', 'paid'),
        allowNull: true
    },
    date_payement: {
        type: DataTypes.DATE,
        allowNull: true
    },
    id_user: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('Billet_Voyage', 'Duty_Free'),
        allowNull: false
    }
}, {
    tableName: 'facturation',
    timestamps: false
});

module.exports = Facturation;