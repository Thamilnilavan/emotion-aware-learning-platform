const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  icbtNumber: { type: String, trim: true },
  programme: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  preferences: {
    notificationSensitivity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    darkMode: { type: Boolean, default: false },
    focusGoal: { type: Number, default: 65, min: 0, max: 100 },
  },
  consent: {
    given: { type: Boolean, default: false },
    givenAt: { type: Date },
    webcamConsent: { type: Boolean, default: false },
    emotionConsent: { type: Boolean, default: false },
    attentionConsent: { type: Boolean, default: false },
    retentionConsent: { type: Boolean, default: false },
  },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email }).select('+password');
};

module.exports = mongoose.model('User', userSchema);
