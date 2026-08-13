-- ============================================================
-- Migration 008: Admin Ban Flag
--
-- Adds a `banned` column to the users table so admins can
-- suspend accounts without deleting them.
-- ============================================================

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false;

COMMIT;
