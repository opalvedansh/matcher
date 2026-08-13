-- ============================================================
-- Migration 004: Matching Algorithm Upgrade
--
-- Adds:
--   1. super_like to swipe_direction enum
--   2. updated_at to swipes (for undo timestamp check)
--   3. relevance_score to matches (for quality tracking)
--   4. GIN indexes on categories arrays (fast array overlap queries)
--   5. Composite index for reciprocal-like lookup
-- ============================================================

BEGIN;

-- ── 1. Add super_like to enum ────────────────────────────────────
DO $$ BEGIN
  ALTER TYPE swipe_direction ADD VALUE 'super_like';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── 2. Add updated_at to swipes for undo window tracking ─────────
ALTER TABLE swipes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ── 3. Add relevance_score to matches ────────────────────────────
ALTER TABLE matches ADD COLUMN IF NOT EXISTS relevance_score NUMERIC(5,2) DEFAULT 0;

-- ── 4. GIN indexes on category arrays for fast overlap queries ────
CREATE INDEX IF NOT EXISTS idx_brand_profiles_categories
  ON brand_profiles USING GIN (categories);

CREATE INDEX IF NOT EXISTS idx_influencer_profiles_categories
  ON influencer_profiles USING GIN (categories);

-- ── 5. Composite index for reciprocal-like lookup ─────────────────
-- Covers: WHERE swiper_id = $other AND swiped_id = $me AND direction IN ('like','super_like')
CREATE INDEX IF NOT EXISTS idx_swipes_reciprocal
  ON swipes(swiped_id, swiper_id, direction);

-- ── 6. Index for undo lookup (last swipe by user) ─────────────────
CREATE INDEX IF NOT EXISTS idx_swipes_swiper_time
  ON swipes(swiper_id, created_at DESC);

COMMIT;
