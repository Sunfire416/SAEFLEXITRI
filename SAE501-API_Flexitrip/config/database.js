const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');

// MySQL
const sequelize = new Sequelize('SAE_Multi', process.env.DB_USER || 'root', process.env.DB_PASSWORD || 'root', {
  host: 'flexitrip_mysql', // service docker
  dialect: 'mysql',
  port: 3306,
  logging: false
});

sequelize.authenticate()
  .then(() => console.log('Connected to the MySQL database'))
  .catch(err => console.error('Unable to connect to the MySQL database:', err));

// MongoDB
const connectMongoDB = async () => {
  try {
    const MONGO_URI =
      process.env.MONGO_URI ||
      'mongodb://mongodb:27017/flexitrip';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('Connected to MongoDB (main)');
    } else {
      console.log(`MongoDB already connected (readyState=${mongoose.connection.readyState})`);
    }
  } catch (err) {
    console.error('Unable to connect to the MongoDB database:', err.message);
  }
};

connectMongoDB();

module.exports = { sequelize, mongoose };
