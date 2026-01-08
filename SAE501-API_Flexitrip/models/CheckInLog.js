const mongoose = require('mongoose');

const checkInLogSchema = new mongoose.Schema({
  checkin_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  enrollment_id: {
    type: String,
    required: true,
    index: true
  },
  reservation_id: {
    type: Number,
    required: true,
    index: true
  },
  user_id: {
    type: Number,
    required: true,
    index: true
  },
  checkin_type: {
    type: String,
    enum: ['kiosk', 'agent', 'mobile', 'gate'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  qr_scanned: {
    type: Boolean,
    default: false
  },
  face_verified: {
    type: Boolean,
    default: false
  },
  face_match_score: {
    type: Number,
    min: 0,
    max: 100
  },
  liveness_check_passed: {
    type: Boolean,
    default: false
  },
  pmr_assistance_confirmed: {
    type: Boolean,
    default: false
  },
  boarding_pass_issued: {
    type: Boolean,
    default: false
  },
  boarding_pass_id: {
    type: String,
    required: false
  },
  agent_id: {
    type: Number,
    required: false
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'manual_override', 'pending'],
    default: 'pending'
  },
  failure_reason: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  ip_address: {
    type: String,
    required: false
  },
  user_agent: {
    type: String,
    required: false
  },
  processing_time_ms: {
    type: Number,
    required: false
  }
}, {
  timestamps: false,
  collection: 'checkin_logs'
});

checkInLogSchema.index({ enrollment_id: 1, timestamp: -1 });
checkInLogSchema.index({ reservation_id: 1, status: 1 });
checkInLogSchema.index({ user_id: 1, timestamp: -1 });

module.exports = mongoose.model('CheckInLog', checkInLogSchema);
