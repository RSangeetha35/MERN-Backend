const express = require('express');
const router  = express.Router();
const {
  getFaqs,
  getFacilities,
  getNews,
  getHealthTips,
  getInsurancePartners,
  getTestimonials,
  submitEnquiry,
  submitContact,
  getHospitalStats,
} = require('../controllers/publicController');

// All public — no auth required

// GET  /api/faqs
router.get('/faqs', getFaqs);

// GET  /api/facilities
router.get('/facilities', getFacilities);

// GET  /api/news?limit=
router.get('/news', getNews);

// GET  /api/health-tips?limit=
router.get('/health-tips', getHealthTips);

// GET  /api/insurance-partners
router.get('/insurance-partners', getInsurancePartners);

// GET  /api/testimonials
router.get('/testimonials', getTestimonials);

// GET  /api/hospital-stats
router.get('/hospital-stats', getHospitalStats);

// POST /api/enquiry
router.post('/enquiry', submitEnquiry);

// POST /api/contact
router.post('/contact', submitContact);

module.exports = router;
