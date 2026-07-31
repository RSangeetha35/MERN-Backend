const Department   = require('../models/Department');
const Doctor       = require('../models/Doctor');
const asyncHandler = require('../utils/asyncHandler');

// ─── GET /api/departments?q= ──────────────────────────────────────────────────
const getDepartments = asyncHandler(async (req, res) => {
  const { q } = req.query;
  let departments;

  if (q && q.trim()) {
    departments = await Department.find({
      isActive: true,
      $or: [
        { name:     { $regex: q.trim(), $options: 'i' } },
        { tagline:  { $regex: q.trim(), $options: 'i' } },
        { services: { $elemMatch: { $regex: q.trim(), $options: 'i' } } },
      ],
    }).sort('name').lean();
  } else {
    departments = await Department.find({ isActive: true }).sort('name').lean();
  }

  res.status(200).json({ success: true, count: departments.length, departments });
});

// ─── GET /api/departments/:slug ───────────────────────────────────────────────
const getDepartmentBySlug = asyncHandler(async (req, res) => {
  const department = await Department.findOne({
    slug:     req.params.slug.toLowerCase(),
    isActive: true,
  }).lean();

  if (!department) {
    return res.status(404).json({ success: false, message: 'Department not found.' });
  }

  // Attach doctors for this department
  const doctors = await Doctor.find({
    departmentSlug: department.slug,
    isActive:       true,
  }).lean();

  res.status(200).json({ success: true, department: { ...department, doctors } });
});

module.exports = { getDepartments, getDepartmentBySlug };
