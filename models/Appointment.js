const mongoose = require('mongoose');

const VALID_STATUSES = [
  'Pending', 'Confirmed', 'Scheduled', 'Checked In',
  'Waiting', 'In Consultation', 'In Progress',
  'Completed', 'Cancelled', 'No Show',
];

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Patient',
      required: [true, 'Patient reference is required'],
    },
    doctor: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Doctor',
      required: [true, 'Doctor reference is required'],
    },
    department:     { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    doctorName:     { type: String, default: '' },
    doctorImage:    { type: String, default: '' },
    departmentName: { type: String, default: '' },
    departmentSlug: { type: String, default: '' },
    date:           { type: String, required: [true, 'Appointment date is required'] },
    timeSlot:       { type: String, required: [true, 'Time slot is required'] },
    tokenNumber:    { type: String, default: '' },
    status: {
      type:    String,
      enum:    VALID_STATUSES,
      default: 'Pending',
    },
    reason:       { type: String, default: '', maxlength: 500 },
    notes:        { type: String, default: '', maxlength: 1000 },
    fee:          { type: Number, default: 0, min: 0 },
    patientName:  { type: String, default: '' },
    patientPhone: { type: String, default: '' },
    patientEmail: { type: String, default: '' },
    isUrgent:     { type: Boolean, default: false },
    bookedAt:     { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
appointmentSchema.index({ patient: 1, date: 1 });
appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ status: 1 });

// ── Auto-generate token number ────────────────────────────────────────────────
appointmentSchema.pre('save', function (next) {
  if (!this.tokenNumber) {
    const prefix = this.departmentName
      ? this.departmentName.charAt(0).toUpperCase()
      : 'A';
    this.tokenNumber = `${prefix}-${String(Math.floor(Math.random() * 900) + 100)}`;
  }
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
