const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Patient name is required'],
      trim:     true,
    },
    avatar:     { type: String, default: '' },
    text:       { type: String, required: [true, 'Testimonial text is required'] },
    rating: {
      type:     Number,
      required: [true, 'Rating is required'],
      min:      [1, 'Rating must be at least 1'],
      max:      [5, 'Rating cannot exceed 5'],
    },
    treatment:  { type: String, default: '' },
    department: { type: String, default: '' },
    date:       { type: String },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

testimonialSchema.index({ isActive: 1, createdAt: -1 });

testimonialSchema.pre('save', function (next) {
  if (!this.date) {
    this.date = new Date().toISOString().split('T')[0];
  }
  next();
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
