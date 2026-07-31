const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Insurance provider name is required'],
      trim:     true,
    },
    logo: { type: String, default: null },
    type: {
      type:    String,
      enum:    ['Private', 'Government'],
      default: 'Private',
    },
    color:      { type: String, default: '#1565C0' },
    isCashless: { type: Boolean, default: true },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

insuranceSchema.index({ isActive: 1 });

module.exports = mongoose.model('Insurance', insuranceSchema);
