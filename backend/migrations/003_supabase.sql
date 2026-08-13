-- ============================================================
-- Migration 003: Add onboarding_data to users table
--
-- Replaces Firestore by storing draft onboarding progress
-- in a JSONB column directly in the users table.
-- ============================================================

BEGIN;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb;

COMMIT;
