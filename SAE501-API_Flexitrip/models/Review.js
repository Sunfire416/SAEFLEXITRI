const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reservationId: { type: Number, required: true },
  userId: { type: Number, required: true },
  ratings: {
    overall: { type: Number, required: true, min: 1, max: 5 },
    accessibility: { type: Number, required: true, min: 1, max: 5 },
    assistanceQuality: { type: Number, required: true, min: 1, max: 5 },
    punctuality: { type: Number, required: true, min: 1, max: 5 },
    comfort: { type: Number, required: true, min: 1, max: 5 }
  },
  comment: { type: String, maxlength: 1000 },
  issues: [{ type: String }],
  suggestions: { type: String, maxlength: 500 },
  wouldRecommend: { type: Boolean, required: true },
  transportType: { type: String, enum: ['train', 'avion', 'taxi'], required: true },
  status: { type: String, enum: ['pending', 'processed'], default: 'pending' }
}, {
  timestamps: true
});

reviewSchema.index({ reservationId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ 'ratings.overall': -1 });

module.exports = mongoose.model('Review', reviewSchema);
