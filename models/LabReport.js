const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema(
  {
    patient: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Patient',
      required: [true, 'Patient reference is required'],
    },
    labId:      { type: String },
    testName:   { type: String, required: [true, 'Test name is required'] },
    orderedBy:  { type: String, default: '' },
    department: { type: String, default: '' },
    date:       { type: String },
    status: {
      type:    String,
      enum:    ['Normal', 'Abnormal', 'Pending'],
      default: 'Pending',
    },
    results: {
      type: [
        {
          parameter:      { type: String, default: '' },
          value:          { type: String, default: '' },
          unit:           { type: String, default: '' },
          referenceRange: { type: String, default: '' },
          status: {
            type:    String,
            enum:    ['Normal', 'Abnormal', 'High', 'Low', 'Pending'],
            default: 'Normal',
          },
        },
      ],
      default: [],
    },
    remarks:    { type: String, default: '' },
    technician: { type: String, default: '' },
  },
  { timestamps: true }
);

labReportSchema.index({ patient: 1, date: -1 });

labReportSchema.pre('save', function (next) {
  if (!this.labId) {
    this.labId = `HMS-LAB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  }
  if (!this.date) {
    this.date = new Date().toISOString().split('T')[0];
  }
  next();
});

module.exports = mongoose.model('LabReport', labReportSchema);
