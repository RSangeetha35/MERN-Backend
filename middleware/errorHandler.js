/**
 * Global Express error-handling middleware.
 * Must be registered last (after all routes) in server.js.
 */
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // ── Mongoose / MongoDB errors ───────────────────────────────────────────────

  // Duplicate key (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message    = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    statusCode = 409;
  }

  // Mongoose schema validation errors
  if (err.name === 'ValidationError') {
    message    = Object.values(err.errors).map(e => e.message).join(', ');
    statusCode = 400;
  }

  // Bad ObjectId (e.g. /api/doctors/not-an-id)
  if (err.name === 'CastError') {
    message    = `Invalid value for field: ${err.path}.`;
    statusCode = 400;
  }

  // ── JWT errors ──────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError')  { message = 'Invalid token.';             statusCode = 401; }
  if (err.name === 'TokenExpiredError')  { message = 'Token has expired.';         statusCode = 401; }
  if (err.name === 'NotBeforeError')     { message = 'Token not yet active.';      statusCode = 401; }

  // ── Log in development ──────────────────────────────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    console.error('[errorHandler]', err);
  } else {
    // In production only log 5xx errors
    if (statusCode >= 500) console.error('[errorHandler]', err.message, err.stack);
  }

  const body = { success: false, message };

  // Include stack trace in development for easier debugging
  if (process.env.NODE_ENV === 'development') {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

module.exports = errorHandler;
