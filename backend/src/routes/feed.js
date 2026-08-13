const { authenticate } = require('../middleware/auth');
const { getFeed } = require('../controllers/feedController');

const router = require('express').Router();

router.use(authenticate);

/**
 * GET /api/feed?limit=10&offset=0
 * Returns swipe candidates for the current user.
 */
router.get('/', getFeed);

module.exports = router;
