const { DataTypes } = require('sequelize');
const sequelize = require('../../config/databaseAF');

const AgentAF = sequelize.define('AgentAF', {
    email: {
        type: DataTypes.STRING(200),
        primaryKey: true
    },
    id_Lieu_Associe: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    surname: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
}, {
    tableName: 'AgentAF',
    timestamps: false
});


module.exports = AgentAF;
