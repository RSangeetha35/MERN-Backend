const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const {
  signup, login, forgotPassword, resetPassword,
  getMe, updateProfile, changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate    = require('../middleware/validate');

// ── Public ─────────────────────────────────────────────────────────────────────

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
    body('email')
      .isEmail().withMessage('A valid email address is required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  signup
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email')
      .isEmail().withMessage('A valid email address is required')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [
    body('email')
      .isEmail().withMessage('A valid email address is required')
      .normalizeEmail(),
  ],
  validate,
  forgotPassword
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('token')
      .notEmpty().withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  resetPassword
);

// ── Protected ──────────────────────────────────────────────────────────────────

// GET /api/auth/me
router.get('/me', protect, getMe);

// PUT /api/auth/profile
router.put(
  '/profile',
  protect,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
    body('phone')
      .optional()
      .trim(),
  ],
  validate,
  updateProfile
);

// PUT /api/auth/change-password
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);

module.exports = router;
