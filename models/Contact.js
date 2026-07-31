const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
    },
    email: {
      type:     String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim:      true,
    },
    phone:   { type: String, default: '', trim: true },
    subject: { type: String, required: [true, 'Subject is required'] },
    message: { type: String, required: [true, 'Message is required'] },
    status: {
      type:    String,
      enum:    ['New', 'Read', 'Replied'],
      default: 'New',
    },
  },
  { timestamps: true }
);

contactSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
