const db = require('../config/db');
const { feedCache } = require('../config/cache');
const logger = require('../config/logger');

// ─── Scoring weights ──────────────────────────────────────────────
// Total max score = 100 points
const WEIGHTS = {
  CATEGORY_OVERLAP: 40,   // shared niches
  BUDGET_FIT:       25,   // brand budget vs influencer price range
  LOCATION_MATCH:   15,   // same city / region
  COMPLETENESS:     10,   // profile has name + bio + avatar/logo
  MUTUAL_INTEREST:  10,   // they already liked you
};

/**
 * GET /api/feed
 *
 * Returns scored, offset-paginated candidates for the current user to swipe on.
 * Uses a Two-Pass query (CTE) to pre-filter a max of 500 candidates before applying
 * the expensive O(N) dynamic scoring algorithm in memory.
 *
 * Query params:
 *   limit       (default 10, max 50)
 *   offset      (default 0)
 *   min_score   (optional, 0-100 — filter out low-relevance results)
 */
async function getFeed(req, res, next) {
  try {
    const { id: userId, role } = req.user;
    const limit    = Math.min(parseInt(req.query.limit || '10', 10), 50);
    const offset   = parseInt(req.query.offset || '0', 10);
    const minScore = parseFloat(req.query.min_score || '0');

    // ── Fetch current user's profile for scoring context ─────────
    const selfCacheKey = `feed-self:${userId}`;
    let myProfile = feedCache.get(selfCacheKey);

    if (!myProfile) {
      if (role === 'brand') {
        const { rows } = await db.query(
          `SELECT categories, budget_min, budget_max, location, lat, lng FROM brand_profiles WHERE user_id = $1`,
          [userId]
        );
        myProfile = rows[0] || null;
      } else {
        const { rows } = await db.query(
          `SELECT categories, price_min, price_max, location, lat, lng, platforms FROM influencer_profiles WHERE user_id = $1`,
          [userId]
        );
        myProfile = rows[0] || null;
      }
      if (myProfile) feedCache.set(selfCacheKey, myProfile);
    }

    // ── Build the scored feed query (Two-Pass CTE) ─────────────────
    let rows;

    if (role === 'brand') {
      // Brand sees influencers
      const myCategories = myProfile?.categories || [];
      const myBudgetMin  = myProfile?.budget_min  || 0;
      const myBudgetMax  = myProfile?.budget_max  || 0;
      const myLat        = myProfile?.lat          ?? null;
      const myLng        = myProfile?.lng          ?? null;
      const myLocation   = myProfile?.location    || '';

      ({ rows } = await db.query(
        `WITH Candidates AS (
           SELECT
             u.id, u.role, u.created_at,
             ip.name, ip.avatar_url, ip.cover_url, ip.bio, ip.categories,
             ip.location, ip.lat, ip.lng, ip.age, ip.gender, ip.platforms,
             ip.followers, ip.engagement_rate, ip.avg_views, ip.price_min, ip.price_max, ip.verified,
             ip.location_geog
           FROM users u
           JOIN influencer_profiles ip ON ip.user_id = u.id
           WHERE u.role = 'influencer'
             AND u.id <> $1
             AND NOT EXISTS (
               SELECT 1 FROM swipes s WHERE s.swiper_id = $1 AND s.swiped_id = u.id
             )
             ${myLat !== null && myLng !== null 
               ? `AND (ip.location_geog IS NULL OR ST_DWithin(ip.location_geog, ST_SetSRID(ST_MakePoint(${myLng}, ${myLat}), 4326), 500000))`
               : ''}
           ORDER BY u.created_at DESC
           LIMIT 500
         )
         SELECT
            id AS user_id, role, created_at, name, avatar_url, cover_url, bio, categories,
            location, lat, lng, age, gender, platforms, followers, engagement_rate,
            avg_views, price_min, price_max, verified,

            -- ── Composite relevance score (max 100) ──────────────
            ROUND(CAST(
              -- 1. Category overlap (40 pts max)
              ${WEIGHTS.CATEGORY_OVERLAP} * (
                CASE
                  WHEN array_length($4::text[], 1) IS NULL OR array_length($4::text[], 1) = 0 THEN 0.5
                  ELSE COALESCE(
                    (SELECT COUNT(*)::float
                     FROM unnest($4::text[]) cat
                     WHERE cat = ANY(categories))
                    / GREATEST(array_length($4::text[], 1), 1),
                    0
                  )
                END
              )
              -- 2. Budget ↔ price fit (25 pts)
              + ${WEIGHTS.BUDGET_FIT} * (
                CASE
                  WHEN $5 = 0 AND $6 = 0 THEN 0.5
                  WHEN price_min = 0 AND price_max = 0 THEN 0.5
                  WHEN $6 >= price_min AND $5 <= price_max THEN 1.0
                  WHEN $6 >= price_min OR $5 <= price_max THEN 0.4
                  ELSE 0
                END
              )
              -- 3. Location proximity (15 pts)
              + ${WEIGHTS.LOCATION_MATCH} * (
                CASE
                  WHEN $7::numeric IS NOT NULL AND $8::numeric IS NOT NULL AND location_geog IS NOT NULL THEN (
                    WITH dist AS (SELECT ST_Distance(location_geog, ST_SetSRID(ST_MakePoint($8::numeric, $7::numeric), 4326)) / 1000.0 AS km)
                    SELECT CASE WHEN km < 50 THEN 1.0 WHEN km < 200 THEN 0.67 WHEN km < 500 THEN 0.33 ELSE 0 END FROM dist
                  )
                  WHEN $9 = '' OR location IS NULL THEN 0.3
                  WHEN LOWER(TRIM(location)) = LOWER(TRIM($9)) THEN 1.0
                  ELSE 0
                END
              )
              -- 4. Profile completeness (10 pts)
              + ${WEIGHTS.COMPLETENESS} * (
                CASE WHEN name IS NOT NULL AND bio IS NOT NULL AND avatar_url IS NOT NULL THEN 1.0 WHEN name IS NOT NULL THEN 0.5 ELSE 0 END
              )
              -- 5. Mutual interest boost (10 pts)
              + ${WEIGHTS.MUTUAL_INTEREST} * (
                CASE
                  WHEN EXISTS (SELECT 1 FROM swipes s2 WHERE s2.swiper_id = Candidates.id AND s2.swiped_id = $1 AND s2.direction IN ('like', 'super_like')) THEN 1.0
                  ELSE 0
                END
              )
            AS NUMERIC), 2) AS relevance_score
         FROM Candidates
         ORDER BY relevance_score DESC, created_at DESC
         OFFSET $2 LIMIT $3`,
        [userId, offset, limit, myCategories, myBudgetMin, myBudgetMax, myLat, myLng, myLocation]
      ));

    } else {
      // Influencer sees brands
      const myCategories = myProfile?.categories || [];
      const myPriceMin   = myProfile?.price_min   || 0;
      const myPriceMax   = myProfile?.price_max   || 0;
      const myLat        = myProfile?.lat          ?? null;
      const myLng        = myProfile?.lng          ?? null;
      const myLocation   = myProfile?.location    || '';

      ({ rows } = await db.query(
        `WITH Candidates AS (
           SELECT
             u.id, u.role, u.created_at,
             bp.name, bp.logo_url, bp.cover_url, bp.bio, bp.categories,
             bp.location, bp.lat, bp.lng, bp.budget_min, bp.budget_max,
             bp.campaign_types, bp.vibes, bp.website, bp.verified,
             bp.location_geog
           FROM users u
           JOIN brand_profiles bp ON bp.user_id = u.id
           WHERE u.role = 'brand'
             AND u.id <> $1
             AND NOT EXISTS (
               SELECT 1 FROM swipes s WHERE s.swiper_id = $1 AND s.swiped_id = u.id
             )
             ${myLat !== null && myLng !== null 
               ? `AND (bp.location_geog IS NULL OR ST_DWithin(bp.location_geog, ST_SetSRID(ST_MakePoint(${myLng}, ${myLat}), 4326), 500000))`
               : ''}
           ORDER BY u.created_at DESC
           LIMIT 500
         )
         SELECT
            id AS user_id, role, created_at, name, logo_url, cover_url, bio, categories,
            location, lat, lng, budget_min, budget_max, campaign_types, vibes, website, verified,

            -- ── Composite relevance score (max 100) ──────────────
            ROUND(CAST(
              -- 1. Category overlap
              ${WEIGHTS.CATEGORY_OVERLAP} * (
                CASE
                  WHEN array_length($4::text[], 1) IS NULL OR array_length($4::text[], 1) = 0 THEN 0.5
                  ELSE COALESCE(
                    (SELECT COUNT(*)::float
                     FROM unnest($4::text[]) cat
                     WHERE cat = ANY(categories))
                    / GREATEST(array_length($4::text[], 1), 1),
                    0
                  )
                END
              )
              -- 2. Budget ↔ price fit
              + ${WEIGHTS.BUDGET_FIT} * (
                CASE
                  WHEN budget_min = 0 AND budget_max = 0 THEN 0.5
                  WHEN $5 = 0 AND $6 = 0 THEN 0.5
                  WHEN budget_max >= $5 AND budget_min <= $6 THEN 1.0
                  WHEN budget_max >= $5 OR budget_min <= $6 THEN 0.4
                  ELSE 0
                END
              )
              -- 3. Location proximity
              + ${WEIGHTS.LOCATION_MATCH} * (
                CASE
                  WHEN $7::numeric IS NOT NULL AND $8::numeric IS NOT NULL AND location_geog IS NOT NULL THEN (
                    WITH dist AS (SELECT ST_Distance(location_geog, ST_SetSRID(ST_MakePoint($8::numeric, $7::numeric), 4326)) / 1000.0 AS km)
                    SELECT CASE WHEN km < 50 THEN 1.0 WHEN km < 200 THEN 0.67 WHEN km < 500 THEN 0.33 ELSE 0 END FROM dist
                  )
                  WHEN $9 = '' OR location IS NULL THEN 0.3
                  WHEN LOWER(TRIM(location)) = LOWER(TRIM($9)) THEN 1.0
                  ELSE 0
                END
              )
              -- 4. Profile completeness
              + ${WEIGHTS.COMPLETENESS} * (
                CASE WHEN name IS NOT NULL AND bio IS NOT NULL AND logo_url IS NOT NULL THEN 1.0 WHEN name IS NOT NULL THEN 0.5 ELSE 0 END
              )
              -- 5. Mutual interest boost
              + ${WEIGHTS.MUTUAL_INTEREST} * (
                CASE
                  WHEN EXISTS (SELECT 1 FROM swipes s2 WHERE s2.swiper_id = Candidates.id AND s2.swiped_id = $1 AND s2.direction IN ('like', 'super_like')) THEN 1.0
                  ELSE 0
                END
              )
            AS NUMERIC), 2) AS relevance_score
         FROM Candidates
         ORDER BY relevance_score DESC, created_at DESC
         OFFSET $2 LIMIT $3`,
        [userId, offset, limit, myCategories, myPriceMin, myPriceMax, myLat, myLng, myLocation]
      ));
    }

    // ── Filter by minimum score ────────────────────────────────────
    const filtered = minScore > 0
      ? rows.filter(r => parseFloat(r.relevance_score) >= minScore)
      : rows;

    res.json({
      data:        filtered,
      count:       filtered.length,
      next_offset: offset + limit,
      scoring: {
        weights: WEIGHTS,
        description: 'Relevance score out of 100. Uses a fast O(1) 500-candidate pre-filter before O(N) dynamic scoring.',
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getFeed };
