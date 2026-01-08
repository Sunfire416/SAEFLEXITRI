const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  UserId: Number,
  Message: String,
  DateSent: Date
});

module.exports = mongoose.model('Notification', notificationSchema);
