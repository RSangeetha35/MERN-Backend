const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, 'Title is required'],
      trim:     true,
    },
    excerpt:       { type: String, default: '' },
    content:       { type: String, default: '' },
    image:         { type: String, default: '' },
    category:      { type: String, default: 'Hospital News' },
    categoryColor: { type: String, default: '#1565C0' },
    author:        { type: String, default: 'HMS Communications' },
    date:          { type: String },
    tags:          { type: [String], default: [] },
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

newsSchema.index({ isActive: 1, date: -1 });

newsSchema.pre('save', function (next) {
  if (!this.date) {
    this.date = new Date().toISOString().split('T')[0];
  }
  next();
});

module.exports = mongoose.model('News', newsSchema);
