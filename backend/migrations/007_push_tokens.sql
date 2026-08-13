-- ============================================================
-- Migration 007: Push Notification Tokens
--
-- Adds Expo push token storage to the users table.
-- ============================================================

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS expo_push_token VARCHAR(255) DEFAULT NULL;

COMMIT;
