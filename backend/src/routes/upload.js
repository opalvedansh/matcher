const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { generatePresignedUrl } = require('../controllers/uploadController');

router.use(authenticate);

router.post('/presigned-url', generatePresignedUrl);

module.exports = router;
