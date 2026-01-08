const { Sequelize } = require('sequelize');

// MySQL - Base de données SNCF
const sequelize = new Sequelize('SNCF_Database', process.env.DB_USER || 'root', process.env.DB_PASSWORD || 'root', {
  host: process.env.DB_HOST || 'flexitrip_mysql',
  dialect: 'mysql',
  port: 3306,
  logging: false
});

sequelize.authenticate()
  .then(() => console.log('[SNCF] Connected to MySQL SNCF_Database'))
  .catch(err => console.error('[SNCF] Unable to connect to MySQL SNCF_Database:', err));

module.exports = sequelize;