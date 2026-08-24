const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  createPost,
  getFeedPosts,
  getMyPosts,
  toggleLike,
  deletePost,
} = require('../controllers/postController');

router.use(authenticate);

router.get('/feed', getFeedPosts);
router.get('/my', getMyPosts);
router.post('/', createPost);
router.post('/:postId/like', toggleLike);
router.delete('/:postId', deletePost);

module.exports = router;
