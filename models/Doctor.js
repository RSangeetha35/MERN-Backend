const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Doctor name is required'],
      trim:     true,
    },
    image:          { type: String, default: '' },
    qualification:  { type: String, default: '' },
    specialization: { type: String, default: '' },
    department:     { type: String, default: '' },
    departmentSlug: { type: String, default: '' },
    departmentRef:  { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    experience:     { type: Number, default: 0, min: 0 },
    about:          { type: String, default: '' },
    education: {
      type: [
        {
          degree:      { type: String, default: '' },
          institution: { type: String, default: '' },
          year:        { type: Number, min: 1900, max: 2100 },
        },
      ],
      default: [],
    },
    languages:      { type: [String], default: ['English'] },
    availableDays:  { type: [String], default: [] },
    availableTime: {
      from: { type: String, default: '09:00' },
      to:   { type: String, default: '17:00' },
    },
    consultationFee:   { type: Number, default: 0, min: 0 },
    rating:            { type: Number, default: 0, min: 0, max: 5 },
    totalReviews:      { type: Number, default: 0, min: 0 },
    isFeatured:        { type: Boolean, default: false },
    isAvailableOnline: { type: Boolean, default: false },
    isActive:          { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Text search index ─────────────────────────────────────────────────────────
doctorSchema.index({ name: 'text', specialization: 'text', department: 'text' });
doctorSchema.index({ departmentSlug: 1, isActive: 1 });
doctorSchema.index({ isFeatured: -1, rating: -1 });

module.exports = mongoose.model('Doctor', doctorSchema);
