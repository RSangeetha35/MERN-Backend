const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'User reference is required'],
      unique:   true,
    },
    // unique + sparse declared here — no schema.index() needed for patientId
    patientId: { type: String, unique: true, sparse: true },
    age:       { type: Number, min: 0, max: 150 },
    bloodGroup: {
      type:    String,
      enum:    ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
      default: '',
    },
    address: {
      street:  { type: String, default: '' },
      city:    { type: String, default: '' },
      state:   { type: String, default: '' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    emergencyContact: {
      name:     { type: String, default: '' },
      relation: { type: String, default: '' },
      phone:    { type: String, default: '' },
    },
    allergies: {
      type:    [String],
      default: [],
    },
    medicalHistory: {
      type: [
        {
          condition: { type: String, default: '' },
          since:     { type: String, default: '' },
          status:    { type: String, default: 'Ongoing' },
          treatedBy: { type: String, default: '' },
        },
      ],
      default: [],
    },
    currentMedications: {
      type: [
        {
          name:   { type: String, default: '' },
          dosage: { type: String, default: '' },
          since:  { type: String, default: '' },
        },
      ],
      default: [],
    },
    insuranceProvider: { type: String, default: '' },
    insurancePolicyNo: { type: String, default: '' },
    registrationDate:  { type: Date, default: Date.now },
    isActive:          { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Auto-generate patientId ───────────────────────────────────────────────────
patientSchema.pre('save', function (next) {
  if (!this.patientId) {
    this.patientId = `HMS-P-${String(Math.floor(Math.random() * 900000) + 100000)}`;
  }
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
