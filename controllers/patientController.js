const Patient      = require('../models/Patient');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const Prescription = require('../models/Prescription');
const LabReport    = require('../models/LabReport');
const Appointment  = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve a Patient document from either:
 *   - a Patient _id (24-char hex)
 *   - a User _id (24-char hex)  ← frontend passes user.id after login
 *   - a patientId string like "HMS-P-xxxxxx"
 */
const resolvePatient = async (param) => {
  if (!param) return null;

  // 24-char hex ObjectId
  if (/^[a-f\d]{24}$/i.test(param)) {
    // Try as Patient._id first
    let p = await Patient.findById(param)
      .populate('user', 'name email phone dob gender bloodGroup avatar patientId');
    if (p) return p;
    // Fallback: treat as User._id
    p = await Patient.findOne({ user: param })
      .populate('user', 'name email phone dob gender bloodGroup avatar patientId');
    return p;
  }

  // HMS-P-xxxxx patientId
  if (param.startsWith('HMS-')) {
    return Patient.findOne({ patientId: param })
      .populate('user', 'name email phone dob gender bloodGroup avatar patientId');
  }

  return null;
};

/** Shape a Patient doc into the response the frontend expects */
const formatPatient = (p) => ({
  id:               p._id,
  patientId:        p.patientId,
  age:              p.age,
  bloodGroup:       p.bloodGroup || p.user?.bloodGroup || '',
  name:             p.user?.name        || '',
  email:            p.user?.email       || '',
  phone:            p.user?.phone       || '',
  dob:              p.user?.dob         || '',
  gender:           p.user?.gender      || '',
  avatar:           p.user?.avatar      || null,
  address:          p.address           || {},
  emergencyContact: p.emergencyContact  || {},
  allergies:        p.allergies         || [],
  medicalHistory:   p.medicalHistory    || [],
  currentMedications: p.currentMedications || [],
  insuranceProvider:  p.insuranceProvider  || '',
  insurancePolicyNo:  p.insurancePolicyNo  || '',
  registrationDate:   p.registrationDate,
  isActive:           p.isActive,
});

// ─── GET /api/patients/:id ────────────────────────────────────────────────────
const getPatient = asyncHandler(async (req, res) => {
  const patient = await resolvePatient(req.params.id);
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
  res.status(200).json({ success: true, patient: formatPatient(patient) });
});

// ─── GET /api/patients/me ─────────────────────────────────────────────────────
// Convenience: get the patient profile of the currently authenticated user
const getMyPatient = asyncHandler(async (req, res) => {
  let patient = await Patient.findOne({ user: req.user._id })
    .populate('user', 'name email phone dob gender bloodGroup avatar patientId');

  // Auto-create if first login after signup (safety net)
  if (!patient) {
    patient = await Patient.create({ user: req.user._id, bloodGroup: req.user.bloodGroup || '' });
    patient = await Patient.findById(patient._id)
      .populate('user', 'name email phone dob gender bloodGroup avatar patientId');
  }

  res.status(200).json({ success: true, patient: formatPatient(patient) });
});

// ─── GET /api/patients/:id/dashboard ─────────────────────────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const patient = await resolvePatient(req.params.id);
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

  // Parallel fetch of supplementary data
  const today = new Date().toISOString().split('T')[0];
  const [upcomingAppointments, activeNotificationsCount] = await Promise.all([
    Appointment.find({
      patient: patient._id,
      date:    { $gte: today },
      status:  { $nin: ['Cancelled', 'No Show', 'Completed'] },
    })
      .sort({ date: 1, timeSlot: 1 })
      .limit(3)
      .lean(),
    Notification.countDocuments({ patient: patient._id, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    patient: formatPatient(patient),
    upcomingAppointments,
    unreadNotifications: activeNotificationsCount,
  });
});

// ─── PUT /api/patients/:id ────────────────────────────────────────────────────
const updatePatient = asyncHandler(async (req, res) => {
  const allowed = [
    'bloodGroup', 'address', 'emergencyContact',
    'allergies', 'insuranceProvider', 'insurancePolicyNo',
    'medicalHistory', 'currentMedications', 'age',
  ];
  const updates = {};
  allowed.forEach(k => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });

  // Try Patient._id first, then User._id
  let patient = await Patient.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate('user', 'name email phone dob gender bloodGroup avatar patientId');

  if (!patient) {
    patient = await Patient.findOneAndUpdate(
      { user: req.params.id },
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'name email phone dob gender bloodGroup avatar patientId');
  }

  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

  // Sync bloodGroup to User document
  if (updates.bloodGroup !== undefined) {
    await User.findByIdAndUpdate(patient.user._id, { bloodGroup: updates.bloodGroup });
  }

  res.status(200).json({ success: true, patient: formatPatient(patient) });
});

// ─── GET /api/patients/:id/medical-history ────────────────────────────────────
const getMedicalHistory = asyncHandler(async (req, res) => {
  const patient = await resolvePatient(req.params.id);
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

  res.status(200).json({
    success:            true,
    allergies:          patient.allergies          || [],
    medicalHistory:     patient.medicalHistory     || [],
    currentMedications: patient.currentMedications || [],
    emergencyContact:   patient.emergencyContact   || {},
  });
});

// ─── GET /api/patients/:id/prescriptions?active=true ─────────────────────────
const getPrescriptions = asyncHandler(async (req, res) => {
  const patient = await resolvePatient(req.params.id);
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

  const filter = { patient: patient._id };
  if (req.query.active === 'true') filter.isActive = true;

  const prescriptions = await Prescription.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, count: prescriptions.length, prescriptions });
});

// ─── GET /api/patients/:id/lab-reports ───────────────────────────────────────
const getLabReports = asyncHandler(async (req, res) => {
  const patient = await resolvePatient(req.params.id);
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

  const reports = await LabReport.find({ patient: patient._id })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, count: reports.length, reports });
});

// ─── GET /api/patients/:id/notifications ─────────────────────────────────────
const getNotifications = asyncHandler(async (req, res) => {
  const patient = await resolvePatient(req.params.id);
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

  const notifications = await Notification.find({ patient: patient._id })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, count: notifications.length, notifications });
});

// ─── GET /api/patients/:id/appointments ──────────────────────────────────────
const getPatientAppointments = asyncHandler(async (req, res) => {
  const patient = await resolvePatient(req.params.id);
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

  const { upcoming } = req.query;
  const filter = { patient: patient._id };

  if (upcoming === 'true') {
    const today = new Date().toISOString().split('T')[0];
    filter.date   = { $gte: today };
    filter.status = { $nin: ['Cancelled', 'No Show', 'Completed'] };
  }

  const appointments = await Appointment.find(filter)
    .sort({ date: 1, timeSlot: 1 })
    .populate('doctor', 'name image specialization')
    .lean();

  res.status(200).json({ success: true, count: appointments.length, appointments });
});

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
// (also wired directly in notificationRoutes.js)
const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found.' });
  }
  res.status(200).json({ success: true, notification });
});

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

  await Notification.updateMany({ patient: patient._id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: 'All notifications marked as read.' });
});

module.exports = {
  getPatient,
  getMyPatient,
  getDashboard,
  updatePatient,
  getMedicalHistory,
  getPrescriptions,
  getLabReports,
  getNotifications,
  getPatientAppointments,
  markNotificationRead,
  markAllNotificationsRead,
};
