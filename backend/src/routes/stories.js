const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const storyController = require('../controllers/storyController');

router.use(authenticate);

router.post('/', storyController.uploadStory);
router.get('/feed', storyController.getFeedStories);

module.exports = router;
