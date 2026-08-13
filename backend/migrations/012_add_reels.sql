ALTER TABLE influencer_profiles ADD COLUMN IF NOT EXISTS reels JSONB DEFAULT '[]'::jsonb;
