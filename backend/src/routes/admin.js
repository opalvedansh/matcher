const router = require('express').Router();
const { param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const {
  getStats,
  listUsers,
  banUser,
  unbanUser,
  deleteUser,
  bulkBanUsers,
  bulkUnbanUsers,
} = require('../controllers/adminController');

const userIdRules = [
  param('userId').isString().notEmpty().withMessage('userId is required')
];

// All admin routes require authentication + admin check
router.use(authenticate, requireAdmin);

router.get ('/stats',                       getStats);
router.get ('/users',                       listUsers);
router.post('/users/bulk-ban',              bulkBanUsers);
router.post('/users/bulk-unban',            bulkUnbanUsers);
router.post('/users/:userId/ban',           userIdRules, validate, banUser);
router.post('/users/:userId/unban',         userIdRules, validate, unbanUser);
router.delete('/users/:userId',             userIdRules, validate, deleteUser);

module.exports = router;
