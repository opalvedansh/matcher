-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add GEOGRAPHY columns to profiles
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS location_geog GEOGRAPHY(Point, 4326);
ALTER TABLE influencer_profiles ADD COLUMN IF NOT EXISTS location_geog GEOGRAPHY(Point, 4326);

-- Populate the geography column from existing lat/lng
UPDATE brand_profiles 
SET location_geog = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
WHERE lat IS NOT NULL AND lng IS NOT NULL;

UPDATE influencer_profiles 
SET location_geog = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Create GIST spatial indexes for blazing fast radius queries
CREATE INDEX IF NOT EXISTS idx_brand_profiles_location_geog ON brand_profiles USING GIST (location_geog);
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_location_geog ON influencer_profiles USING GIST (location_geog);

-- Auto-update triggers
CREATE OR REPLACE FUNCTION sync_location_geog()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location_geog = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  ELSE
    NEW.location_geog = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_location_geog_brand ON brand_profiles;
CREATE TRIGGER trigger_sync_location_geog_brand
BEFORE INSERT OR UPDATE OF lat, lng ON brand_profiles
FOR EACH ROW EXECUTE FUNCTION sync_location_geog();

DROP TRIGGER IF EXISTS trigger_sync_location_geog_influencer ON influencer_profiles;
CREATE TRIGGER trigger_sync_location_geog_influencer
BEFORE INSERT OR UPDATE OF lat, lng ON influencer_profiles
FOR EACH ROW EXECUTE FUNCTION sync_location_geog();
