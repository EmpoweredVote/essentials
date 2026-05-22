-- Migration 196: la_council_votes backfill (NO-OP)
-- Phase 62 pre-flight on 2026-05-21 confirmed migration 171 schema already present.
-- This file exists for audit trail only.
--
-- Pre-flight findings (2026-05-21):
--   to_regclass('meetings.la_council_agenda_items') = 'meetings.la_council_agenda_items'
--   to_regclass('meetings.la_council_votes')         = 'meetings.la_council_votes'
--
-- Migration 171 was applied outside the sequential ledger (likely applied directly
-- or via a timestamp-based migration not tracked under version '171').
-- Both tables confirmed present in the meetings schema before this migration ran.
--
-- Migration 182 (fix_security_invoker_public_views) confirmed applied as:
--   version = '20260520191454', name = 'fix_security_invoker_public_views'
--
-- Including idempotent DDL for documentation/completeness:
CREATE SCHEMA IF NOT EXISTS meetings;

CREATE TABLE IF NOT EXISTS meetings.la_council_agenda_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  council_file_number TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT la_council_agenda_items_cfn_unique UNIQUE (council_file_number)
);

CREATE TABLE IF NOT EXISTS meetings.la_council_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  politician_id UUID NOT NULL REFERENCES essentials.politicians(id),
  council_file_number TEXT,
  agenda_item_id UUID REFERENCES meetings.la_council_agenda_items(id),
  vote_date DATE NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('YES', 'NO', 'ABSENT', 'ABSTAIN', 'RECUSE', 'PRESENT')),
  agenda_description TEXT,
  meeting_type TEXT,
  item_number TEXT,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT la_council_votes_unique UNIQUE (politician_id, council_file_number, vote_date, item_number)
);

CREATE INDEX IF NOT EXISTS la_council_votes_politician_idx ON meetings.la_council_votes(politician_id);
CREATE INDEX IF NOT EXISTS la_council_votes_cfn_idx ON meetings.la_council_votes(council_file_number);
CREATE INDEX IF NOT EXISTS la_council_votes_date_idx ON meetings.la_council_votes(vote_date DESC);
