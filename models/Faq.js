const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    category: { type: String, required: [true, 'Category is required'], trim: true },
    question: { type: String, required: [true, 'Question is required'] },
    answer:   { type: String, required: [true, 'Answer is required'] },
    order:    { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

faqSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Faq', faqSchema);
