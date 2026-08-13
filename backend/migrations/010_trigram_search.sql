-- ============================================================
-- Migration: 010_trigram_search
-- Description: Adds pg_trgm extension and GIN indexes for ILIKE search in Admin panel
-- ============================================================

-- 1. Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create GIN trigram indexes for fast wildcard searches
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON users USING GIN (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_brand_name_trgm ON brand_profiles USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_influencer_name_trgm ON influencer_profiles USING GIN (name gin_trgm_ops);
