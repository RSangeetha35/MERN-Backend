const express     = require('express');
const router      = express.Router();
const { protect } = require('../middleware/auth');
const { body }    = require('express-validator');
const validate    = require('../middleware/validate');
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
} = require('../controllers/appointmentController');

// All appointment routes require a valid JWT
router.use(protect);

// GET  /api/appointments?patientId=&upcoming=true&doctorId=&status=
router.get('/', getAppointments);

// POST /api/appointments
router.post(
  '/',
  [
    body('doctorId')
      .notEmpty().withMessage('Doctor ID is required'),
    body('date')
      .notEmpty().withMessage('Appointment date is required')
      .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
    body('timeSlot')
      .notEmpty().withMessage('Time slot is required'),
  ],
  validate,
  createAppointment
);

// GET   /api/appointments/:id
router.get('/:id', getAppointmentById);

// PATCH /api/appointments/:id/cancel
router.patch('/:id/cancel', cancelAppointment);

// PATCH /api/appointments/:id/status
router.patch(
  '/:id/status',
  [
    body('status').notEmpty().withMessage('Status is required'),
  ],
  validate,
  updateAppointmentStatus
);

module.exports = router;
