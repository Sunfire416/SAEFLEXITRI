const { DataTypes } = require('sequelize');
const sequelize = require('../../config/databaseUBER');

const AgentUBER = sequelize.define('AgentUBER', {
    email: {
        type: DataTypes.STRING(200),
        primaryKey: true
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
    tableName: 'AgentUBER',
    timestamps: false
});


module.exports = AgentUBER;
