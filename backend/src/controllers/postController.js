const db = require('../config/db');

/**
 * POST /api/posts
 * Body: { image_url, caption }
 */
async function createPost(req, res, next) {
  try {
    const { image_url, caption } = req.body;
    const userId = req.user.id;

    if (!image_url) {
      return res.status(400).json({ error: 'image_url is required' });
    }

    const { rows: [post] } = await db.query(
      `INSERT INTO posts (user_id, image_url, caption)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, image_url, caption || null]
    );

    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/posts/feed
 * Returns posts from all users, newest first
 */
async function getFeedPosts(req, res, next) {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = parseInt(req.query.offset) || 0;

    const { rows } = await db.query(
      `SELECT
         p.*,
         u.email,
         COALESCE(ip.name, bp.name) AS author_name,
         COALESCE(ip.avatar_url, bp.logo_url) AS author_avatar,
         COALESCE(ip.categories, bp.categories) AS author_categories,
         EXISTS(
           SELECT 1 FROM post_likes pl
           WHERE pl.post_id = p.id AND pl.user_id = $1
         ) AS liked_by_me
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN influencer_profiles ip ON ip.user_id = p.user_id
       LEFT JOIN brand_profiles bp ON bp.user_id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ posts: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/posts/my
 * Returns the current user's posts
 */
async function getMyPosts(req, res, next) {
  try {
    const userId = req.user.id;
    const { rows } = await db.query(
      `SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ posts: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/posts/:postId/like
 * Toggle like on a post
 */
async function toggleLike(req, res, next) {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if already liked
    const { rows: existing } = await db.query(
      `SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    );

    if (existing.length > 0) {
      // Unlike
      await db.query(
        `DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`,
        [postId, userId]
      );
      await db.query(
        `UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1`,
        [postId]
      );
      res.json({ liked: false });
    } else {
      // Like
      await db.query(
        `INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [postId, userId]
      );
      await db.query(
        `UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1`,
        [postId]
      );
      res.json({ liked: true });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/posts/:postId
 * Delete a post (owner only)
 */
async function deletePost(req, res, next) {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const { rowCount } = await db.query(
      `DELETE FROM posts WHERE id = $1 AND user_id = $2`,
      [postId, userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPost, getFeedPosts, getMyPosts, toggleLike, deletePost };
