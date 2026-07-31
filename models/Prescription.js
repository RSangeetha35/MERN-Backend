const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
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
    doctorName:  { type: String, default: '' },
    department:  { type: String, default: '' },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    diagnosis:   { type: String, required: [true, 'Diagnosis is required'] },
    medicines: {
      type: [
        {
          name:         { type: String, default: '' },
          dosage:       { type: String, default: '' },
          frequency:    { type: String, default: '' },
          duration:     { type: String, default: '' },
          instructions: { type: String, default: '' },
        },
      ],
      default: [],
    },
    advice:    { type: String, default: '' },
    nextVisit: { type: String, default: '' },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patient: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
