-- ============================================================
-- Matcherc Database Schema v2
-- Auth: Firebase Auth (UID stored as TEXT primary key)
-- Run: psql $DATABASE_URL -f migrations/001_init.sql
-- ============================================================

-- Enable UUID generation (still used for swipes/matches)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role       AS ENUM ('brand', 'influencer');
  CREATE TYPE swipe_direction AS ENUM ('like', 'reject');
  CREATE TYPE match_status    AS ENUM ('active', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── users ────────────────────────────────────────────────────────
-- id = Firebase UID (e.g. "abc123def456xyz789")
CREATE TABLE IF NOT EXISTS users (
  id            TEXT        PRIMARY KEY,   -- Firebase UID
  email         TEXT        NOT NULL DEFAULT '',
  role          user_role,                 -- NULL until user completes role selection
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── brand_profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand_profiles (
  user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name           VARCHAR(255),
  logo_url       TEXT,
  cover_url      TEXT,
  bio            TEXT,
  categories     TEXT[]   DEFAULT '{}',
  location       VARCHAR(255),
  budget_min     INTEGER  DEFAULT 0,   -- INR
  budget_max     INTEGER  DEFAULT 0,
  campaign_types TEXT[]   DEFAULT '{}',
  vibes          TEXT[]   DEFAULT '{}',
  website        TEXT,
  verified       BOOLEAN  NOT NULL DEFAULT false,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── influencer_profiles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS influencer_profiles (
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
  engagement_rate NUMERIC(5, 2)  DEFAULT 0,  -- percentage
  avg_views       INTEGER        DEFAULT 0,
  price_min       INTEGER        DEFAULT 0,   -- INR per campaign
  price_max       INTEGER        DEFAULT 0,
  verified        BOOLEAN        NOT NULL DEFAULT false,
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- ── swipes ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS swipes (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id   TEXT            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  swiped_id   TEXT            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction   swipe_direction NOT NULL,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),

  -- A user can only swipe on another user once
  CONSTRAINT swipes_unique_pair UNIQUE (swiper_id, swiped_id),
  -- Can't swipe on yourself
  CONSTRAINT swipes_no_self CHECK (swiper_id <> swiped_id)
);

CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_swipes_swiped ON swipes(swiped_id);

-- ── matches ──────────────────────────────────────────────────────
-- Created only when BOTH parties have swiped "like" on each other
CREATE TABLE IF NOT EXISTS matches (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id       TEXT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  influencer_id  TEXT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status         match_status NOT NULL DEFAULT 'active',
  matched_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT matches_unique_pair UNIQUE (brand_id, influencer_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_brand       ON matches(brand_id);
CREATE INDEX IF NOT EXISTS idx_matches_influencer  ON matches(influencer_id);

-- ── updated_at trigger ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
