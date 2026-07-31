const { validationResult } = require('express-validator');

/**
 * Middleware that reads express-validator results.
 * Place it after your body() / param() / query() chains.
 * Returns 400 with the first error message on failure.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors:  errors.array().map(e => ({ field: e.path || e.param, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;
