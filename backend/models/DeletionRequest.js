const mongoose = require('mongoose');

const deletionRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, trim: true, required: true, maxlength: 1000 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
  },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletionSummary: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

deletionRequestSchema.index({ status: 1, createdAt: -1 });
deletionRequestSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('DeletionRequest', deletionRequestSchema);
