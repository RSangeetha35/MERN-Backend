const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Facility name is required'],
      trim:     true,
    },
    icon:        { type: String, default: 'FaHospital' },
    description: { type: String, default: '' },
    image:       { type: String, default: '' },
    color:       { type: String, default: '#1565C0' },
    highlight:   { type: Boolean, default: false },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

facilitySchema.index({ isActive: 1 });

module.exports = mongoose.model('Facility', facilitySchema);
