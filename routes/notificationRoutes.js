const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const {
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/patientController');

router.use(protect);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', markNotificationRead);

// PATCH /api/notifications/read-all
router.patch('/read-all', markAllNotificationsRead);

module.exports = router;
