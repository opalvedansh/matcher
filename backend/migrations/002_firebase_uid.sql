-- ============================================================
-- Migration 002: Switch from UUID to Firebase UID (TEXT) as PK
--
-- This drops and recreates all tables since:
--   1. The PK type changes (uuid → text)
--   2. password_hash is removed (auth moves to Firebase)
--   3. email is no longer unique (Firebase enforces uniqueness)
--
-- SAFE to run on empty or dev databases.
-- For production with real data, export first!
-- ============================================================

BEGIN;

-- Drop in reverse dependency order
DROP TABLE IF EXISTS matches            CASCADE;
DROP TABLE IF EXISTS swipes             CASCADE;
DROP TABLE IF EXISTS influencer_profiles CASCADE;
DROP TABLE IF EXISTS brand_profiles     CASCADE;
DROP TABLE IF EXISTS users              CASCADE;

-- ── users ────────────────────────────────────────────────────────
-- id = Firebase UID (e.g. "abc123def456xyz789")
CREATE TABLE users (
  id            TEXT        PRIMARY KEY,
  email         TEXT        NOT NULL DEFAULT '',
  role          user_role,                       -- NULL until role is selected
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── brand_profiles ───────────────────────────────────────────────
CREATE TABLE brand_profiles (
  user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name           VARCHAR(255),
  logo_url       TEXT,
  cover_url      TEXT,
  bio            TEXT,
  categories     TEXT[]   DEFAULT '{}',
  location       VARCHAR(255),
  budget_min     INTEGER  DEFAULT 0,
  budget_max     INTEGER  DEFAULT 0,
  campaign_types TEXT[]   DEFAULT '{}',
  vibes          TEXT[]   DEFAULT '{}',
  website        TEXT,
  verified       BOOLEAN  NOT NULL DEFAULT false,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── influencer_profiles ──────────────────────────────────────────
CREATE TABLE influencer_profiles (
  user_id         TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(255),
  avatar_url      TEXT,
  cover_url       TEXT,
  bio             TEXT,
  categories      TEXT[]         DEFAULT '{}',
  location        VARCHAR(255),
  age             INTEGER,
  gender          VARCHAR(50),
  platforms       TEXT[]         DEFAULT '{}',
  followers       INTEGER        DEFAULT 0,
  engagement_rate NUMERIC(5, 2)  DEFAULT 0,
  avg_views       INTEGER        DEFAULT 0,
  price_min       INTEGER        DEFAULT 0,
  price_max       INTEGER        DEFAULT 0,
  verified        BOOLEAN        NOT NULL DEFAULT false,
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- ── swipes ───────────────────────────────────────────────────────
CREATE TABLE swipes (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id   TEXT            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  swiped_id   TEXT            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction   swipe_direction NOT NULL,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
  CONSTRAINT swipes_unique_pair UNIQUE (swiper_id, swiped_id),
  CONSTRAINT swipes_no_self CHECK (swiper_id <> swiped_id)
);

CREATE INDEX idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX idx_swipes_swiped ON swipes(swiped_id);

-- ── matches ──────────────────────────────────────────────────────
CREATE TABLE matches (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id       TEXT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  influencer_id  TEXT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status         match_status NOT NULL DEFAULT 'active',
  matched_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT matches_unique_pair UNIQUE (brand_id, influencer_id)
);

CREATE INDEX idx_matches_brand      ON matches(brand_id);
CREATE INDEX idx_matches_influencer ON matches(influencer_id);

-- ── updated_at triggers ──────────────────────────────────────────
DO $$ BEGIN
  CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_brand_profiles_updated_at
    BEFORE UPDATE ON brand_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_influencer_profiles_updated_at
    BEFORE UPDATE ON influencer_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

COMMIT;
