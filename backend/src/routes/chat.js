const router = require('express').Router();
const { param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { getMessages } = require('../controllers/chatController');

const chatRules = [
  param('matchId').isUUID().withMessage('matchId must be a valid UUID'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('cursor').optional().isISO8601()
];

router.use(authenticate);

router.get('/:matchId/messages', chatRules, validate, getMessages);

module.exports = router;
