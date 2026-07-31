const express     = require('express');
const router      = express.Router();
const { protect } = require('../middleware/auth');
const { body }    = require('express-validator');
const validate    = require('../middleware/validate');
const { createReview } = require('../controllers/doctorController');

// POST /api/reviews — frontend reviewApi.js calls this
router.post(
  '/',
  protect,
  [
    body('doctorId')
      .notEmpty().withMessage('Doctor ID is required'),
    body('rating')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional()
      .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
  ],
  validate,
  createReview
);

module.exports = router;
