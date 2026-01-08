const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BoardingPass = sequelize.define('BoardingPass', {
  pass_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reservation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'reservations',
      key: 'reservation_id'
    }
  },
  enrollment_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  flight_train_number: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  gate: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  seat: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  boarding_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  boarding_group: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'A'
  },
  pmr_assistance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pmr_priority: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  wheelchair_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  qr_code: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  barcode: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('issued', 'boarded', 'cancelled', 'expired'),
    defaultValue: 'issued'
  },
  issued_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  boarded_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  gate_scanned_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  issued_by: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'boarding_passes',
  timestamps: false,
  indexes: [
    { fields: ['reservation_id'] },
    { fields: ['enrollment_id'] },
    { fields: ['user_id'] },
    { fields: ['status'] }
  ]
});

BoardingPass.prototype.markAsBoarded = async function() {
  this.status = 'boarded';
  this.boarded_at = new Date();
  return this.save();
};

BoardingPass.prototype.cancel = async function() {
  this.status = 'cancelled';
  return this.save();
};

module.exports = BoardingPass;
