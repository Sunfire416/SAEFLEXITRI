const { Sequelize } = require('sequelize');

// MySQL - Base de données Air France
const sequelize = new Sequelize('AF_Database', process.env.DB_USER || 'root', process.env.DB_PASSWORD || 'root', {
  host: process.env.DB_HOST || 'flexitrip_mysql',
  dialect: 'mysql',
  port: 3306,
  logging: false
});

sequelize.authenticate()
  .then(() => console.log('[AF] Connected to MySQL AF_Database'))
  .catch(err => console.error('[AF] Unable to connect to MySQL AF_Database:', err));

module.exports = sequelize;