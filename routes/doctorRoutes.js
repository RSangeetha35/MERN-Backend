const express  = require('express');
const router   = express.Router();
const {
  getDoctors,
  searchDoctors,
  getDoctorById,
  getDoctorReviews,
} = require('../controllers/doctorController');

// All doctor-list routes are public (no auth required)

// IMPORTANT: /search must be registered before /:id
// so Express doesn't interpret "search" as a doctor ID.
router.get('/search',      searchDoctors);
router.get('/',            getDoctors);
router.get('/:id',         getDoctorById);
router.get('/:id/reviews', getDoctorReviews);

module.exports = router;
