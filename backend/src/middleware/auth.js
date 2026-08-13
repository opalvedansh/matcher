const { verifySupabaseToken } = require('../utils/verifyToken');
const db     = require('../config/db');
const logger = require('../config/logger');

/**
 * Middleware — verifies the Supabase ID token in the Authorization header.
 * Attaches { id, email, role } to req.user on success.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.slice(7);

    let uid, email;
    try {
      const verified = await verifySupabaseToken(token);
      uid = verified.sub;
      email = verified.email;
    } catch (jwtErr) {
      logger.warn({ jwtErr: jwtErr.message }, 'Token verification failed');
      return res.status(401).json({ error: 'Invalid Supabase token', details: jwtErr.message });
    }

    // Look up the user row in our DB
    const { rows } = await db.query(
      'SELECT id, email, role, banned FROM users WHERE id = $1',
      [uid]
    );

    if (!rows.length) {
      // User hasn't called /api/auth/sync yet — auto-create the row
      const { rows: [newUser] } = await db.query(
        `INSERT INTO users (id, email, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
         RETURNING id, email, role`,
        [uid, email, null]
      );
      req.user = newUser;
    } else {
      req.user = rows[0];
    }

    // Check if user is banned
    if (req.user.banned) {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware factory — restrict access to specific roles.
 * Usage:  router.get('/...', authenticate, requireRole('brand'), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        error: `Access restricted to: ${roles.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
