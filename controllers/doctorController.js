const Doctor       = require('../models/Doctor');
const Review       = require('../models/Review');
const Patient      = require('../models/Patient');
const asyncHandler = require('../utils/asyncHandler');

// ─── GET /api/doctors ─────────────────────────────────────────────────────────
// Query params: featured=true, department=slug, online=true, q=text
const getDoctors = asyncHandler(async (req, res) => {
  const { featured, department, q, online } = req.query;
  const filter = { isActive: true };

  if (featured === 'true') filter.isFeatured = true;
  if (department)          filter.departmentSlug = department.toLowerCase();
  if (online === 'true')   filter.isAvailableOnline = true;

  let doctors;

  if (q && q.trim()) {
    // Text search — requires the text index on Doctor
    doctors = await Doctor.find(
      { ...filter, $text: { $search: q.trim() } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).lean();
  } else {
    doctors = await Doctor.find(filter)
      .sort({ isFeatured: -1, rating: -1 })
      .lean();
  }

  res.status(200).json({ success: true, count: doctors.length, doctors });
});

// ─── GET /api/doctors/search ──────────────────────────────────────────────────
// Query params: q, sortBy, department, experienceRange=5-10, onlineOnly=true
const searchDoctors = asyncHandler(async (req, res) => {
  const { q, sortBy, department, experienceRange, onlineOnly } = req.query;
  const filter = { isActive: true };

  if (department)           filter.departmentSlug = department.toLowerCase();
  if (onlineOnly === 'true') filter.isAvailableOnline = true;

  if (experienceRange) {
    const parts = experienceRange.split('-').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      filter.experience = { $gte: parts[0], $lte: parts[1] };
    }
  }

  let doctors;

  if (q && q.trim()) {
    try {
      doctors = await Doctor.find(
        { ...filter, $text: { $search: q.trim() } },
        { score: { $meta: 'textScore' } }
      ).sort({ score: { $meta: 'textScore' } }).lean();
    } catch {
      // Fallback to regex if text index not yet built
      doctors = await Doctor.find({
        ...filter,
        $or: [
          { name:           { $regex: q.trim(), $options: 'i' } },
          { specialization: { $regex: q.trim(), $options: 'i' } },
          { department:     { $regex: q.trim(), $options: 'i' } },
        ],
      }).lean();
    }
  } else {
    doctors = await Doctor.find(filter).lean();
  }

  // In-memory sort (text search already sorted by score above)
  if (!q || !q.trim()) {
    const sorters = {
      rating_desc:     (a, b) => b.rating - a.rating,
      fee_asc:         (a, b) => a.consultationFee - b.consultationFee,
      fee_desc:        (a, b) => b.consultationFee - a.consultationFee,
      experience_desc: (a, b) => b.experience - a.experience,
      name_asc:        (a, b) => a.name.localeCompare(b.name),
    };
    if (sortBy && sorters[sortBy]) {
      doctors.sort(sorters[sortBy]);
    } else {
      doctors.sort((a, b) => b.rating - a.rating);
    }
  }

  res.status(200).json({ success: true, count: doctors.length, doctors });
});

// ─── GET /api/doctors/:id ─────────────────────────────────────────────────────
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).lean();
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found.' });
  }
  res.status(200).json({ success: true, doctor });
});

// ─── GET /api/doctors/:id/reviews ─────────────────────────────────────────────
const getDoctorReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ doctor: req.params.id })
    .sort({ createdAt: -1 })
    .lean();
  res.status(200).json({ success: true, count: reviews.length, reviews });
});

// ─── POST /api/reviews (also exported here, used by reviewRoutes) ─────────────
const createReview = asyncHandler(async (req, res) => {
  const { doctorId, rating, comment } = req.body;

  // Verify doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found.' });
  }

  // Link to patient profile if it exists
  const patient = await Patient.findOne({ user: req.user._id });

  // Prevent duplicate reviews
  if (patient) {
    const existing = await Review.findOne({ doctor: doctorId, patient: patient._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this doctor.' });
    }
  }

  const review = await Review.create({
    doctor:      doctorId,
    patient:     patient?._id || null,
    patientName: req.user.name,
    rating:      Number(rating),
    comment:     comment || '',
    verified:    !!patient,
  });

  res.status(201).json({ success: true, review });
});

module.exports = {
  getDoctors,
  searchDoctors,
  getDoctorById,
  getDoctorReviews,
  createReview,
};
