const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  content: [{
    contentType: { type: String, enum: ['video', 'youtube', 'document', 'link'] },
    title: { type: String, required: true },
    url: { type: String, required: true },
    durationMinutes: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    transcript: {
      url: { type: String, default: '' },
      language: { type: String, default: 'en', trim: true },
    },
  }],
  integrations: {
    zoomLink: { type: String },
    googleClassroomLink: { type: String },
    teamsLink: { type: String },
  },
  settings: {
    engagementThreshold: { type: Number, default: 45 },
    alertFrequency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

CourseSchema.index({ isActive: 1 });
CourseSchema.index({ teacherId: 1 });
CourseSchema.index({ enrolledStudents: 1, isActive: 1 });

module.exports = mongoose.model('Course', CourseSchema);
