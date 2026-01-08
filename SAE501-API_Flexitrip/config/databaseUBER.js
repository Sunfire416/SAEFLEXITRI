const { Sequelize } = require('sequelize');

// MySQL - Base de données UBER
const sequelize = new Sequelize('UBER_Database', process.env.DB_USER || 'root', process.env.DB_PASSWORD || 'root', {
  host: process.env.DB_HOST || 'flexitrip_mysql',
  dialect: 'mysql',
  port: 3306,
  logging: false
});

sequelize.authenticate()
  .then(() => console.log('[UBER] Connected to MySQL UBER_Database'))
  .catch(err => console.error('[UBER] Unable to connect to MySQL UBER_Database:', err));

module.exports = sequelize;