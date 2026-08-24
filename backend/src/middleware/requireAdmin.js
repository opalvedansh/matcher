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

  const isAdminEmail = req.user?.email === 'fadedsukla572@gmail.com';
  const isAdminId = adminIds.includes(req.user?.id);

  if (!isAdminEmail && !isAdminId) {
    logger.warn({ user: req.user?.id, email: req.user?.email }, 'Admin access rejected');
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

module.exports = requireAdmin;
