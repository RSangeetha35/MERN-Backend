/**
 * Wraps an async Express route handler and forwards any rejected promise
 * to the next() error-handler middleware so we never have uncaught rejections.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
