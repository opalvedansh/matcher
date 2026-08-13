-- Add photos array to influencer and brand profiles

ALTER TABLE influencer_profiles ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
