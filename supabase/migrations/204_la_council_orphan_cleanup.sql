-- Migration 204: Remove orphaned LA City Council candidate office (no district, no race link).
-- Faizah Malik's politician row is kept — she has a race_candidates entry for CD-11.
-- Only the stray districtless office is removed; it was causing an LA City Council section split.
DELETE FROM essentials.offices WHERE id = '91953d3f-7594-4cbd-bca3-eff156e47b23';
