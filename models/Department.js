const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    // unique declared on the field — no schema.index() for slug alone
    slug: {
      type:      String,
      required:  [true, 'Slug is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    name: {
      type:     String,
      required: [true, 'Department name is required'],
      trim:     true,
    },
    icon:        { type: String, default: 'FaHospital' },
    image:       { type: String, default: '' },
    tagline:     { type: String, default: '' },
    description: { type: String, default: '' },
    services:    { type: [String], default: [] },
    facilities:  { type: [String], default: [] },
    workingHours: {
      weekdays: { type: String, default: '8:00 AM – 8:00 PM' },
      saturday: { type: String, default: '8:00 AM – 2:00 PM' },
      sunday:   { type: String, default: 'Emergency Only' },
    },
    color:        { type: String, default: '#1565C0' },
    patientCount: { type: Number, default: 0, min: 0 },
    successRate:  { type: Number, default: 95, min: 0, max: 100 },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound query index — isActive filter used in all list queries
departmentSchema.index({ isActive: 1, name: 1 });
departmentSchema.index({ name: 'text' });

module.exports = mongoose.model('Department', departmentSchema);
