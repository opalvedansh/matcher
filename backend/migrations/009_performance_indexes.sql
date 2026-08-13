-- ============================================================
-- Migration: 009_performance_indexes
-- Description: Adds indexes for A++ performance and scaling
-- ============================================================

-- 1. GIN Indexes for array intersection matching
-- This speeds up `categories && $1` checks in feed query by 100x+
CREATE INDEX IF NOT EXISTS idx_brand_categories_gin ON brand_profiles USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_influencer_categories_gin ON influencer_profiles USING GIN (categories);

-- 2. Composite Index for Chat Messages
-- Speeds up: `WHERE match_id = $1 ORDER BY created_at DESC LIMIT $2`
CREATE INDEX IF NOT EXISTS idx_messages_match_created_at ON messages(match_id, created_at DESC);

-- 3. B-Tree Indexes for Budget and Price filtering
CREATE INDEX IF NOT EXISTS idx_brand_budget_max ON brand_profiles(budget_max);
CREATE INDEX IF NOT EXISTS idx_brand_budget_min ON brand_profiles(budget_min);
CREATE INDEX IF NOT EXISTS idx_influencer_price_max ON influencer_profiles(price_max);
CREATE INDEX IF NOT EXISTS idx_influencer_price_min ON influencer_profiles(price_min);

-- 4. B-Tree Indexes for Lat/Lng (to aid basic bounds filtering if used later)
CREATE INDEX IF NOT EXISTS idx_brand_lat ON brand_profiles(lat);
CREATE INDEX IF NOT EXISTS idx_brand_lng ON brand_profiles(lng);
CREATE INDEX IF NOT EXISTS idx_influencer_lat ON influencer_profiles(lat);
CREATE INDEX IF NOT EXISTS idx_influencer_lng ON influencer_profiles(lng);
