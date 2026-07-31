require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose   = require('mongoose');
const bcrypt     = require('bcryptjs');
const connectDB  = require('../config/db');

const User        = require('../models/User');
const Patient     = require('../models/Patient');
const Doctor      = require('../models/Doctor');
const Department  = require('../models/Department');
const Appointment = require('../models/Appointment');
const Prescription= require('../models/Prescription');
const LabReport   = require('../models/LabReport');
const Notification= require('../models/Notification');
const Review      = require('../models/Review');
const Faq         = require('../models/Faq');
const Facility    = require('../models/Facility');
const HealthTip   = require('../models/HealthTip');
const Insurance   = require('../models/Insurance');
const News        = require('../models/News');
const Testimonial = require('../models/Testimonial');

const departments = require('./data/departments');
const doctors     = require('./data/doctors');
const faqs        = require('./data/faqs');
const facilities  = require('./data/facilities');
const healthTips  = require('./data/healthTips');
const insurance   = require('./data/insurance');
const news        = require('./data/news');
const testimonials= require('./data/testimonials');

const run = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clear
  await Promise.all([
    User.deleteMany(), Patient.deleteMany(), Doctor.deleteMany(), Department.deleteMany(),
    Appointment.deleteMany(), Prescription.deleteMany(), LabReport.deleteMany(),
    Notification.deleteMany(), Review.deleteMany(), Faq.deleteMany(), Facility.deleteMany(),
    HealthTip.deleteMany(), Insurance.deleteMany(), News.deleteMany(), Testimonial.deleteMany(),
  ]);
  console.log('✓ Cleared all collections');

  // Departments
  const createdDepts = await Department.insertMany(departments);
  const deptMap = {};
  createdDepts.forEach(d => { deptMap[d.slug] = d._id; });
  console.log(`✓ ${createdDepts.length} departments seeded`);

  // Doctors — attach department refs
  const doctorsWithRef = doctors.map(d => ({ ...d, departmentRef: deptMap[d.departmentSlug] || null }));
  const createdDoctors = await Doctor.insertMany(doctorsWithRef);
  const docMap = {};
  createdDoctors.forEach(d => { docMap[d.name] = d._id; });
  console.log(`✓ ${createdDoctors.length} doctors seeded`);

  // Demo patient user
  const user = await User.create({
    name: 'Rahul Sharma', email: 'alice123@gmail.com', password: 'password123',
    phone: '+91 9876543210', dob: '1990-05-15', gender: 'Male', bloodGroup: 'B+',
  });

  const patient = await Patient.create({
    user:     user._id,
    patientId:'HMS-P-001',
    age:      36,
    bloodGroup: 'B+',
    address:  { street: '42, Green Park Colony', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
    emergencyContact: { name: 'Sunita Sharma', relation: 'Wife', phone: '+91 9988776655' },
    allergies: ['Penicillin', 'Dust', 'Shellfish'],
    medicalHistory: [
      { condition: 'Hypertension', since: '2018', status: 'Ongoing', treatedBy: 'Dr. Arun Kumar' },
      { condition: 'Appendicitis', since: '2015', status: 'Resolved (Surgery)', treatedBy: 'Dr. Suresh Nambiar' },
    ],
    currentMedications: [
      { name: 'Amlodipine 5mg', dosage: 'Once daily', since: '2018' },
      { name: 'Losartan 50mg',  dosage: 'Once daily', since: '2020' },
    ],
    insuranceProvider: 'Star Health Insurance',
    insurancePolicyNo: 'SHI-2023-887654',
  });
  console.log('✓ Demo patient seeded  (email: alice123@gmail.com  password: password123)');

  // First two doctors for sample appointments/prescriptions
  const drArun   = createdDoctors.find(d => d.name === 'Dr. Arun Kumar');
  const drSarah  = createdDoctors.find(d => d.name === 'Dr. Sarah Johnson');

  // Sample Appointments
  const apptData = [
    { patient: patient._id, doctor: drArun?._id || createdDoctors[8]._id, doctorName: 'Dr. Arun Kumar', doctorImage: 'https://randomuser.me/api/portraits/men/63.jpg', departmentName: 'General Medicine', departmentSlug: 'general-medicine', date: '2026-08-15', timeSlot: '09:00 AM', status: 'Confirmed', reason: 'Routine check-up & BP monitoring', fee: 400 },
    { patient: patient._id, doctor: drSarah?._id || createdDoctors[0]._id, doctorName: 'Dr. Sarah Johnson', doctorImage: 'https://randomuser.me/api/portraits/women/44.jpg', departmentName: 'Cardiology', departmentSlug: 'cardiology', date: '2026-09-05', timeSlot: '10:00 AM', status: 'Pending', reason: 'Annual cardiac check-up', fee: 800 },
    { patient: patient._id, doctor: drArun?._id || createdDoctors[8]._id, doctorName: 'Dr. Arun Kumar', doctorImage: 'https://randomuser.me/api/portraits/men/63.jpg', departmentName: 'General Medicine', departmentSlug: 'general-medicine', date: '2026-07-15', timeSlot: '09:00 AM', status: 'Completed', reason: 'Follow-up consultation', fee: 400 },
    { patient: patient._id, doctor: drSarah?._id || createdDoctors[0]._id, doctorName: 'Dr. Sarah Johnson', doctorImage: 'https://randomuser.me/api/portraits/women/44.jpg', departmentName: 'Cardiology', departmentSlug: 'cardiology', date: '2026-06-10', timeSlot: '10:30 AM', status: 'Cancelled', reason: 'Chest pain investigation', fee: 800 },
  ];
  const appts = await Appointment.insertMany(apptData);
  console.log(`✓ ${appts.length} appointments seeded`);

  // Sample Prescriptions
  await Prescription.insertMany([
    {
      patient: patient._id, doctor: drArun?._id || createdDoctors[8]._id,
      doctorName: 'Dr. Arun Kumar', department: 'General Medicine',
      appointment: appts[0]._id, diagnosis: 'Hypertension, Stage 1',
      medicines: [
        { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily (morning)', duration: '30 days', instructions: 'Take with water at the same time each day.' },
        { name: 'Losartan',   dosage: '50mg', frequency: 'Once daily (evening)', duration: '30 days', instructions: 'Can be taken with or without food.' },
      ],
      advice: 'Reduce salt intake. Exercise 30 min daily. Monitor BP at home twice daily.', nextVisit: '2026-09-15', isActive: true,
    },
    {
      patient: patient._id, doctor: drSarah?._id || createdDoctors[0]._id,
      doctorName: 'Dr. Sarah Johnson', department: 'Cardiology',
      diagnosis: 'Stable Angina, CAD',
      medicines: [
        { name: 'Atorvastatin',    dosage: '40mg', frequency: 'Once daily (night)', duration: '90 days', instructions: 'Take at night.' },
        { name: 'Metoprolol',      dosage: '25mg', frequency: 'Once daily (morning)', duration: '90 days', instructions: 'Do not stop abruptly.' },
      ],
      advice: 'Cardiac diet. No smoking. Walk 5,000 steps daily.', nextVisit: '2026-09-10', isActive: false,
    },
  ]);
  console.log('✓ Prescriptions seeded');

  // Sample Lab Reports
  await LabReport.insertMany([
    {
      patient: patient._id, testName: 'Complete Blood Count (CBC)',
      orderedBy: 'Dr. Arun Kumar', department: 'General Medicine',
      date: '2026-07-27', status: 'Abnormal',
      results: [
        { parameter: 'Hemoglobin',   value: '10.8', unit: 'g/dL', referenceRange: '13.5–17.5', status: 'Low' },
        { parameter: 'WBC Count',    value: '7400', unit: '/µL',  referenceRange: '4500–11000', status: 'Normal' },
        { parameter: 'Platelet Count', value: '210000', unit: '/µL', referenceRange: '150000–400000', status: 'Normal' },
      ],
      remarks: 'Mild microcytic anemia detected. Iron deficiency to be ruled out.',
    },
    {
      patient: patient._id, testName: 'Lipid Profile',
      orderedBy: 'Dr. Sarah Johnson', department: 'Cardiology',
      date: '2026-07-20', status: 'Abnormal',
      results: [
        { parameter: 'Total Cholesterol', value: '218', unit: 'mg/dL', referenceRange: '<200', status: 'High' },
        { parameter: 'LDL Cholesterol',   value: '142', unit: 'mg/dL', referenceRange: '<130', status: 'High' },
        { parameter: 'HDL Cholesterol',   value: '42',  unit: 'mg/dL', referenceRange: '>40',  status: 'Normal' },
      ],
      remarks: 'Elevated LDL. Dietary modification and medication advised.',
    },
    {
      patient: patient._id, testName: 'HbA1c (Glycated Hemoglobin)',
      orderedBy: 'Dr. Arun Kumar', department: 'General Medicine',
      date: '2026-06-15', status: 'Normal',
      results: [
        { parameter: 'HbA1c',                 value: '5.4', unit: '%',    referenceRange: '<5.7', status: 'Normal' },
        { parameter: 'Estimated Avg Glucose',  value: '108', unit: 'mg/dL', referenceRange: '<126', status: 'Normal' },
      ],
      remarks: 'HbA1c within normal range.',
    },
  ]);
  console.log('✓ Lab reports seeded');

  // Notifications
  await Notification.insertMany([
    { patient: patient._id, type: 'appointment', title: 'Appointment Confirmed', message: 'Your appointment with Dr. Arun Kumar on Aug 15, 2026 at 09:00 AM has been confirmed.', isRead: false },
    { patient: patient._id, type: 'lab', title: 'Lab Report Ready', message: 'Your Complete Blood Count (CBC) report is now available.', isRead: false },
    { patient: patient._id, type: 'prescription', title: 'New Prescription Added', message: 'Dr. Arun Kumar has added a new prescription following your consultation.', isRead: false },
    { patient: patient._id, type: 'alert', title: 'Medication Refill Reminder', message: 'Your Losartan 50mg prescription is running low.', isRead: true },
  ]);
  console.log('✓ Notifications seeded');

  // Sample Reviews
  await Review.insertMany([
    { doctor: drSarah?._id || createdDoctors[0]._id, patientName: 'Amit K.', patientAvatar: 'https://randomuser.me/api/portraits/men/10.jpg', rating: 5, comment: 'Dr. Sarah is an exceptional cardiologist.', verified: true },
    { doctor: drArun?._id  || createdDoctors[8]._id, patientName: 'Ramesh K.', patientAvatar: 'https://randomuser.me/api/portraits/men/65.jpg', rating: 4, comment: 'Dr. Arun is a reliable family physician.', verified: false },
  ]);
  console.log('✓ Reviews seeded');

  // Public collections
  await Faq.insertMany(faqs);
  await Facility.insertMany(facilities);
  await HealthTip.insertMany(healthTips);
  await Insurance.insertMany(insurance);
  await News.insertMany(news);
  await Testimonial.insertMany(testimonials);
  console.log('✓ Public data seeded (FAQs, facilities, health tips, insurance, news, testimonials)');

  console.log('\n✅ Database seeded successfully!\n');
  console.log('Demo credentials:');
  console.log('  Email:    alice123@gmail.com');
  console.log('  Password: password123\n');
  process.exit(0);
};

run().catch(err => { console.error('Seed error:', err); process.exit(1); });
