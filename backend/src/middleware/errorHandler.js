const logger = require('../config/logger');

/**
 * Central error handler — must be the LAST middleware registered in app.js.
 * Express identifies it by its 4-parameter signature (err, req, res, next).
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Structured error logging via Pino
  logger.error({
    err,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id || 'anonymous',
  }, err.message || 'Unhandled error');

  // Postgres unique-violation (duplicate email, duplicate swipe, etc.)
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry', detail: err.detail });
  }

  // Postgres foreign-key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced resource does not exist' });
  }

  const status  = err.statusCode || err.status || 500;
  const message = err.message    || 'Internal server error';

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
