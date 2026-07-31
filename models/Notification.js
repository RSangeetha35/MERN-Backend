const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    patient: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Patient',
      required: [true, 'Patient reference is required'],
    },
    type: {
      type:    String,
      enum:    ['appointment', 'lab', 'prescription', 'general', 'alert', 'billing'],
      default: 'general',
    },
    title:      { type: String, required: [true, 'Title is required'], trim: true },
    message:    { type: String, required: [true, 'Message is required'] },
    isRead:     { type: Boolean, default: false },
    actionLink: { type: String, default: '' },
  },
  { timestamps: true }
);

notificationSchema.index({ patient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
