const mongoose = require('mongoose');

const healthTipSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, 'Title is required'],
      trim:     true,
    },
    category:      { type: String, default: 'General' },
    categoryColor: { type: String, default: '#1565C0' },
    image:         { type: String, default: '' },
    excerpt:       { type: String, default: '' },
    content:       { type: String, default: '' },
    author:        { type: String, default: '' },
    authorImage:   { type: String, default: '' },
    date:          { type: String },
    readTime:      { type: String, default: '5 min' },
    tags:          { type: [String], default: [] },
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

healthTipSchema.index({ isActive: 1, date: -1 });

healthTipSchema.pre('save', function (next) {
  if (!this.date) {
    this.date = new Date().toISOString().split('T')[0];
  }
  next();
});

module.exports = mongoose.model('HealthTip', healthTipSchema);
