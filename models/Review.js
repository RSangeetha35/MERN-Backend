const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    doctor: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Doctor',
      required: [true, 'Doctor reference is required'],
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Patient',
    },
    patientName:   { type: String, default: 'Anonymous' },
    patientAvatar: { type: String, default: '' },
    rating: {
      type:     Number,
      required: [true, 'Rating is required'],
      min:      [1, 'Rating must be at least 1'],
      max:      [5, 'Rating cannot exceed 5'],
    },
    comment:  { type: String, default: '' },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// A patient can only review a doctor once (sparse so null patient is allowed)
reviewSchema.index({ doctor: 1, patient: 1 }, { unique: true, sparse: true });
reviewSchema.index({ doctor: 1, createdAt: -1 });

// ── After save: update doctor's aggregate rating ──────────────────────────────
reviewSchema.post('save', async function () {
  try {
    const Doctor = require('./Doctor');
    const stats = await this.constructor.aggregate([
      { $match: { doctor: this.doctor } },
      {
        $group: {
          _id:       '$doctor',
          avgRating: { $avg: '$rating' },
          count:     { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Doctor.findByIdAndUpdate(this.doctor, {
        rating:       Math.round(stats[0].avgRating * 10) / 10,
        totalReviews: stats[0].count,
      });
    }
  } catch (err) {
    console.error('[Review post-save] Failed to update doctor rating:', err.message);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
