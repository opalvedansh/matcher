-- ============================================================
-- Migration 005: Add lat/lng coordinates to profiles
--
-- Stores real geographic coordinates alongside the human-readable
-- location name, enabling Haversine distance scoring in the feed.
-- ============================================================

BEGIN;

-- ── brand_profiles ───────────────────────────────────────────────
ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS lat  NUMERIC(10, 7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lng  NUMERIC(10, 7) DEFAULT NULL;

-- ── influencer_profiles ──────────────────────────────────────────
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS lat  NUMERIC(10, 7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lng  NUMERIC(10, 7) DEFAULT NULL;

-- ── Indexes for bounding box proximity queries ────────────────────
CREATE INDEX IF NOT EXISTS idx_brand_profiles_lat_lng
  ON brand_profiles(lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_influencer_profiles_lat_lng
  ON influencer_profiles(lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

COMMIT;
