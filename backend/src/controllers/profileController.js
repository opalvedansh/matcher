const db = require('../config/db');
const { invalidateCache } = require('../middlewares/cacheMiddleware');
const logger = require('../config/logger');

// ─── Helper: fetch full profile by userId + role (explicit columns) ──
async function fetchProfile(userId, role) {
  if (role === 'brand') {
    const { rows } = await db.query(
      `SELECT
         p.user_id, p.name, p.logo_url, p.cover_url, p.bio,
         p.categories, p.location, p.lat, p.lng,
         p.budget_min, p.budget_max, p.campaign_days,
         p.campaign_types, p.vibes, p.website, p.photos, p.platforms, p.verified, p.updated_at,
         u.email, u.role, u.created_at AS member_since
       FROM brand_profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1`,
      [userId]
    );
    return rows[0] || null;
  } else {
    const { rows } = await db.query(
      `SELECT
         p.user_id, p.name, p.avatar_url, p.cover_url, p.bio,
         p.categories, p.location, p.lat, p.lng,
         p.age, p.gender, p.platforms, p.photos, p.reels,
         p.followers, p.engagement_rate, p.avg_views,
         p.price_min, p.price_max, p.verified, p.updated_at,
         u.email, u.role, u.created_at AS member_since
       FROM influencer_profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1`,
      [userId]
    );
    return rows[0] || null;
  }
}

// ─── GET /api/profiles/me ────────────────────────────────────────
async function getMyProfile(req, res, next) {
  try {
    let profile = await fetchProfile(req.user.id, req.user.role);

    if (!profile) {
      // Auto-create a blank profile row so the user sees their profile screen
      // rather than a crash. They can fill it in from the profile edit screen.
      if (req.user.role === 'brand') {
        await db.query(
          `INSERT INTO brand_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
          [req.user.id]
        );
      } else {
        // influencer (or null role – treat as influencer for now)
        await db.query(
          `INSERT INTO influencer_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
          [req.user.id]
        );
      }
      profile = await fetchProfile(req.user.id, req.user.role || 'influencer');
    }

    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/profiles/me ────────────────────────────────────────
async function updateMyProfile(req, res, next) {
  try {
    const { id: userId, role } = req.user;

    if (role === 'brand') {
      const {
        name, logo_url, cover_url, bio, categories,
        location, lat, lng, budget_min, budget_max, campaign_days, campaign_types, vibes, website, photos, platforms
      } = req.body;

      await db.query(
        `UPDATE brand_profiles SET
          name           = COALESCE($1,  name),
          logo_url       = COALESCE($2,  logo_url),
          cover_url      = COALESCE($3,  cover_url),
          bio            = COALESCE($4,  bio),
          categories     = COALESCE($5,  categories),
          location       = COALESCE($6,  location),
          lat            = COALESCE($7,  lat),
          lng            = COALESCE($8,  lng),
          budget_min     = COALESCE($9,  budget_min),
          budget_max     = COALESCE($10, budget_max),
          campaign_days  = COALESCE($11, campaign_days),
          campaign_types = COALESCE($12, campaign_types),
          vibes          = COALESCE($13, vibes),
          website        = COALESCE($14, website),
          photos         = COALESCE($15, photos),
          platforms      = COALESCE($16, platforms)
        WHERE user_id = $17`,
        [name, logo_url, cover_url, bio, categories,
         location, lat, lng, budget_min, budget_max, campaign_days, campaign_types, vibes, website, photos, platforms,
         userId]
      );
    } else {
      const {
        name, avatar_url, cover_url, bio, categories,
        location, lat, lng, age, gender, platforms, photos, reels,
        followers, engagement_rate, avg_views, price_min, price_max,
      } = req.body;

      await db.query(
        `UPDATE influencer_profiles SET
          name            = COALESCE($1,  name),
          avatar_url      = COALESCE($2,  avatar_url),
          cover_url       = COALESCE($3,  cover_url),
          bio             = COALESCE($4,  bio),
          categories      = COALESCE($5,  categories),
          location        = COALESCE($6,  location),
          lat             = COALESCE($7,  lat),
          lng             = COALESCE($8,  lng),
          age             = COALESCE($9,  age),
          gender          = COALESCE($10, gender),
          platforms       = COALESCE($11, platforms),
          photos          = COALESCE($12, photos),
          reels           = COALESCE($13, reels),
          followers       = COALESCE($14, followers),
          engagement_rate = COALESCE($15, engagement_rate),
          avg_views       = COALESCE($16, avg_views),
          price_min       = COALESCE($17, price_min),
          price_max       = COALESCE($18, price_max)
        WHERE user_id = $19`,
        [name, avatar_url, cover_url, bio, categories,
         location, lat, lng, age, gender, platforms, photos,
         reels !== undefined ? JSON.stringify(reels) : undefined,
         followers, engagement_rate, avg_views, price_min, price_max,
         userId]
      );
    }

    // Invalidate the public profile API endpoint cache in Redis
    await invalidateCache(`cache:/api/profiles/${userId}`);

    const updated = await fetchProfile(userId, role);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/profiles/:userId ───────────────────────────────────
async function getProfileById(req, res, next) {
  try {
    const { userId } = req.params;

    // (We now rely entirely on the Redis cache middleware at the route level)
    // which wraps this entire controller action.

    // Look up role first
    const { rows: [user] } = await db.query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    const profile = await fetchProfile(userId, user.role);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    res.json(profile);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyProfile, updateMyProfile, getProfileById };
