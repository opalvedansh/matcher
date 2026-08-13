-- ============================================================
-- Migration 006: Chat Messages
--
-- Enables real-time chat between matched users.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ DEFAULT NULL
);

-- Index for retrieving messages per match, ordered by time
CREATE INDEX IF NOT EXISTS idx_messages_match_id_time 
  ON messages(match_id, created_at);

COMMIT;
