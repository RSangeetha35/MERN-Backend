const express     = require('express');
const router      = express.Router();
const { protect } = require('../middleware/auth');
const {
  getPatient,
  getMyPatient,
  getDashboard,
  updatePatient,
  getMedicalHistory,
  getPrescriptions,
  getLabReports,
  getNotifications,
  getPatientAppointments,
} = require('../controllers/patientController');

// All patient routes require authentication
router.use(protect);

// GET /api/patients/me  — current user's own profile
router.get('/me', getMyPatient);

// GET /api/patients/:id
router.get('/:id', getPatient);

// GET /api/patients/:id/dashboard
router.get('/:id/dashboard', getDashboard);

// PUT /api/patients/:id
router.put('/:id', updatePatient);

// GET /api/patients/:id/medical-history
router.get('/:id/medical-history', getMedicalHistory);

// GET /api/patients/:id/prescriptions?active=true
router.get('/:id/prescriptions', getPrescriptions);

// GET /api/patients/:id/lab-reports
router.get('/:id/lab-reports', getLabReports);

// GET /api/patients/:id/notifications
router.get('/:id/notifications', getNotifications);

// GET /api/patients/:id/appointments?upcoming=true
router.get('/:id/appointments', getPatientAppointments);

module.exports = router;
