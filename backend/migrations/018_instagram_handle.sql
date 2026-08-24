-- Migration 018: Add Instagram handle + sync timestamp to influencer profiles
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(255),
  ADD COLUMN IF NOT EXISTS instagram_synced_at TIMESTAMPTZ;
