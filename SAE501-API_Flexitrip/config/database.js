const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_URL || 'sqlite::memory:', {
  logging: false
});

module.exports = { sequelize };
