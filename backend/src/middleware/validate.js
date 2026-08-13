const { validationResult } = require('express-validator');

/**
 * Middleware — run after express-validator chain.
 * Returns 422 with a structured error list if validation failed.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = validate;
