const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    name:  { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    phone: { type: String, required: [true, 'Phone number is required'], trim: true },
    department:      { type: String, default: '' },
    appointmentType: { type: String, default: '' },
    preferredDate:   { type: String, default: '' },
    message:         { type: String, default: '' },
    status: {
      type:    String,
      enum:    ['New', 'In Progress', 'Resolved'],
      default: 'New',
    },
    reference: { type: String },
  },
  { timestamps: true }
);

enquirySchema.index({ status: 1, createdAt: -1 });

enquirySchema.pre('save', function (next) {
  if (!this.reference) {
    this.reference = `ENQ-${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model('Enquiry', enquirySchema);
