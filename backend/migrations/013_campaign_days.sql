-- ============================================================
-- Add campaign_days to brand_profiles
-- ============================================================

ALTER TABLE brand_profiles
ADD COLUMN IF NOT EXISTS campaign_days INTEGER DEFAULT 0;
