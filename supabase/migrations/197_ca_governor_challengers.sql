-- Migration 197: CA Governor challengers — assign canonical external_ids and add lavote.gov discovery
--
-- Context: The 8 net-new Calmatters-sourced challenger politician rows already exist (created by the
-- discovery agent / prior seeding) with external_id = NULL. This migration assigns them canonical
-- -6003001..-6003008 external_ids. Tony Thurmond already has external_id = -6000108 (CA Superintendent).
-- All 9 Calmatters-sourced race_candidates rows already have politician_id set (linked by discovery).
-- No lavote.gov row exists in discovery_jurisdictions — INSERT one with id=4338 for June 2026.

-- ============================================================
-- Section A: Assign canonical external_ids to 8 challenger politicians
-- These rows exist but have external_id = NULL. UPDATE by full_name match (each name is unique).
-- Idempotent: WHERE external_id IS NULL guard prevents double-assignment on re-run.
-- ============================================================

UPDATE essentials.politicians
SET external_id = -6003001
WHERE lower(full_name) = 'xavier becerra'
  AND external_id IS NULL;

UPDATE essentials.politicians
SET external_id = -6003002
WHERE lower(full_name) = 'chad bianco'
  AND external_id IS NULL;

UPDATE essentials.politicians
SET external_id = -6003003
WHERE lower(full_name) = 'steve hilton'
  AND external_id IS NULL;

UPDATE essentials.politicians
SET external_id = -6003004
WHERE lower(full_name) = 'matt mahan'
  AND external_id IS NULL;

UPDATE essentials.politicians
SET external_id = -6003005
WHERE lower(full_name) = 'katie porter'
  AND external_id IS NULL;

UPDATE essentials.politicians
SET external_id = -6003006
WHERE lower(full_name) = 'tom steyer'
  AND external_id IS NULL;

UPDATE essentials.politicians
SET external_id = -6003007
WHERE lower(full_name) = 'antonio villaraigosa'
  AND external_id IS NULL;

UPDATE essentials.politicians
SET external_id = -6003008
WHERE lower(full_name) = 'betty yee'
  AND external_id IS NULL;

-- ============================================================
-- Section B: Link race_candidates — already completed by prior seeding.
-- Verification-only comment: all 9 Calmatters-sourced candidates have non-NULL politician_id
-- as of 2026-05-22 pre-check. No UPDATE needed.
-- ============================================================
-- Idempotent safety pass: link any remaining NULL race_candidates for the 8 chalengers
-- (handles edge case where a row was added after prior seeding)
UPDATE essentials.race_candidates rc
SET politician_id = p.id
FROM essentials.politicians p
JOIN essentials.races r
  ON r.position_name = 'CA Governor'
 AND r.election_id = '1ebca37f-cf96-47f4-bc2b-47ef266721fe'
WHERE p.external_id BETWEEN -6003008 AND -6003001
  AND rc.race_id = r.id
  AND lower(rc.full_name) = lower(p.full_name)
  AND rc.politician_id IS NULL;

-- ============================================================
-- Section C: Thurmond special case — link existing -6000108 row
-- Idempotent: politician_id IS NULL guard.
-- ============================================================
UPDATE essentials.race_candidates rc
SET politician_id = p.id
FROM essentials.politicians p
JOIN essentials.races r
  ON r.position_name = 'CA Governor'
 AND r.election_id = '1ebca37f-cf96-47f4-bc2b-47ef266721fe'
WHERE p.external_id = -6000108
  AND rc.race_id = r.id
  AND lower(rc.full_name) LIKE '%thurmond%'
  AND rc.politician_id IS NULL;

-- ============================================================
-- Section D: lavote.gov discovery_jurisdictions — INSERT (no row exists yet)
-- Pre-check 2026-05-22: no lavote.gov row found in discovery_jurisdictions for state='CA'.
-- Inserting with id=4338 (verified valid for June 2026 cycle via WebFetch 2026-05-21).
-- jurisdiction_geoid = '06037' (LA County FIPS: CA=06, County=037)
-- election_date = 2026-06-03 (LA County primary; matches existing CA rows at 2026-06-02)
-- NOTE: After June 3 2026 primary, this source_url will need updating for the November general.
-- ============================================================
INSERT INTO essentials.discovery_jurisdictions
  (id, jurisdiction_geoid, jurisdiction_name, state, election_date, source_url)
VALUES
  (
    gen_random_uuid(),
    '06037',
    'Los Angeles County',
    'CA',
    '2026-06-03',
    'https://www.lavote.gov/Apps/CandidateList/Index?id=4338'
  )
ON CONFLICT DO NOTHING;
