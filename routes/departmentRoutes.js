const express = require('express');
const router  = express.Router();
const { getDepartments, getDepartmentBySlug } = require('../controllers/departmentController');

// Public routes — no auth required

// GET /api/departments?q=search
router.get('/', getDepartments);

// GET /api/departments/:slug
router.get('/:slug', getDepartmentBySlug);

module.exports = router;
