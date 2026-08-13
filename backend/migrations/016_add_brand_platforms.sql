-- Add platforms array to brand_profiles table
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{}';
