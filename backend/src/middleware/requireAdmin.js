const logger = require('../config/logger');

/**
 * Middleware — restricts access to admin users.
 * Admin user IDs are listed in the ADMIN_USER_IDS env var (comma-separated).
 *
 * Usage: router.use(authenticate, requireAdmin, handler)
 */
function requireAdmin(req, res, next) {
  const adminIds = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  if (!adminIds.length) {
    logger.warn('ADMIN_USER_IDS is not configured — all admin requests will be rejected');
    return res.status(403).json({ error: 'Admin access not configured' });
  }

  if (!adminIds.includes(req.user?.id)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

module.exports = requireAdmin;
