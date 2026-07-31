const Appointment  = require('../models/Appointment');
const Patient      = require('../models/Patient');
const Doctor       = require('../models/Doctor');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

// ─── helper: resolve Patient._id from various inputs ─────────────────────────
// Frontend may pass a MongoDB ObjectId OR a HMS-P-xxxxx patientId string
const resolvePatientId = async (value) => {
  if (!value) return null;
  if (/^[a-f\d]{24}$/i.test(value)) return value; // already an ObjectId
  const p = await Patient.findOne({ patientId: value }).select('_id').lean();
  return p ? p._id : null;
};

// ─── helper: ensure a Patient record exists for this user ─────────────────────
const getOrCreatePatient = async (user) => {
  let patient = await Patient.findOne({ user: user._id });
  if (!patient) {
    patient = await Patient.create({
      user:       user._id,
      bloodGroup: user.bloodGroup || '',
    });
  }
  return patient;
};

// ─── GET /api/appointments ────────────────────────────────────────────────────
// Query: patientId=, doctorId=, upcoming=true, status=
const getAppointments = asyncHandler(async (req, res) => {
  const { patientId, upcoming, doctorId, status } = req.query;
  const filter = {};

  if (patientId) {
    const resolved = await resolvePatientId(patientId);
    if (resolved) filter.patient = resolved;
  }
  if (doctorId) filter.doctor = doctorId;
  if (status)   filter.status = status;

  if (upcoming === 'true') {
    const today = new Date().toISOString().split('T')[0];
    filter.date   = { $gte: today };
    filter.status = { $nin: ['Cancelled', 'No Show', 'Completed'] };
  }

  const appointments = await Appointment.find(filter)
    .sort({ date: 1, timeSlot: 1 })
    .populate('patient', 'patientId')
    .populate('doctor',  'name image specialization consultationFee')
    .lean();

  res.status(200).json({ success: true, count: appointments.length, appointments });
});

// ─── POST /api/appointments ───────────────────────────────────────────────────
const createAppointment = asyncHandler(async (req, res) => {
  const {
    doctorId,
    departmentId,
    date,
    timeSlot,
    reason,
    patientName,
    patientPhone,
    patientEmail,
    departmentName,
    departmentSlug,
    isUrgent,
  } = req.body;

  // 1. Verify doctor
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found.' });
  }

  // 2. Ensure patient profile exists (auto-create if needed)
  const patient = await getOrCreatePatient(req.user);

  // 3. Create appointment
  const appointment = await Appointment.create({
    patient:        patient._id,
    doctor:         doctor._id,
    department:     departmentId || null,
    doctorName:     doctor.name,
    doctorImage:    doctor.image || '',
    departmentName: departmentName || doctor.department || '',
    departmentSlug: departmentSlug || doctor.departmentSlug || '',
    date,
    timeSlot,
    reason:       reason       || '',
    fee:          doctor.consultationFee || 0,
    patientName:  patientName  || req.user.name  || '',
    patientPhone: patientPhone || req.user.phone || '',
    patientEmail: patientEmail || req.user.email || '',
    isUrgent:     isUrgent === true || isUrgent === 'true',
    status:       'Confirmed',
  });

  // 4. Create in-app notification
  try {
    await Notification.create({
      patient:    patient._id,
      type:       'appointment',
      title:      'Appointment Confirmed',
      message:    `Your appointment with ${doctor.name} on ${date} at ${timeSlot} is confirmed. Token: ${appointment.tokenNumber}.`,
      actionLink: '/patient/appointments',
    });
  } catch (notifErr) {
    // Non-fatal — appointment was created successfully
    console.warn('[createAppointment] Notification failed:', notifErr.message);
  }

  res.status(201).json({ success: true, appointment });
});

// ─── GET /api/appointments/:id ────────────────────────────────────────────────
const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('doctor',  'name image specialization consultationFee')
    .populate('patient', 'patientId')
    .lean();

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found.' });
  }
  res.status(200).json({ success: true, appointment });
});

// ─── PATCH /api/appointments/:id/cancel ──────────────────────────────────────
const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status: 'Cancelled' },
    { new: true }
  );
  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found.' });
  }
  res.status(200).json({ success: true, appointment });
});

// ─── PATCH /api/appointments/:id/status ──────────────────────────────────────
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required.' });
  }

  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );
  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found.' });
  }
  res.status(200).json({ success: true, appointment });
});

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
};
