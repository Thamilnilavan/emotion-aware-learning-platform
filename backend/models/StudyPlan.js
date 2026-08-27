const mongoose = require('mongoose');

const StudyPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, required: true, min: 5, max: 480 },
}, { timestamps: true });

StudyPlanSchema.index({ userId: 1, scheduledAt: 1 });

module.exports = mongoose.model('StudyPlan', StudyPlanSchema);
