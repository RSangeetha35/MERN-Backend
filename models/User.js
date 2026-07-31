const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select:    false,
    },
    phone:      { type: String, default: '', trim: true },
    dob:        { type: String, default: '' },
    gender: {
      type:    String,
      enum:    ['Male', 'Female', 'Other', 'Prefer not to say', ''],
      default: '',
    },
    bloodGroup: { type: String, default: '' },
    avatar:     { type: String, default: null },
    role: {
      type:    String,
      enum:    ['patient', 'doctor', 'admin'],
      default: 'patient',
    },
    isActive:  { type: Boolean, default: true },
    patientId: { type: String },

    // Password reset
    passwordResetToken:  { type: String, select: false },
    passwordResetExpiry: { type: Date,   select: false },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// email has unique:true in the schema field definition — no separate index needed
userSchema.index({ patientId: 1 });

// ── Hash password before save ─────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

// ── Auto-generate patientId ───────────────────────────────────────────────────
userSchema.pre('save', function (next) {
  if (!this.patientId) {
    this.patientId = `HMS-U-${String(Math.floor(Math.random() * 900000) + 100000)}`;
  }
  next();
});

// ── Instance method: compare password ─────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
