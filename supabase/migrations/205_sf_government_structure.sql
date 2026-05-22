-- Migration 205: SF Government Structure
-- Creates the City and County of San Francisco government scaffolding:
--   1 government row, 10 chambers (Board of Supervisors + 9 citywide),
--   11 supervisor district rows, 1 SF-wide LOCAL_EXEC district row.
-- No politicians or offices — those are added in migration 206 (plan 63-02).
--
-- Safe to re-apply: all INSERTs are guarded with WHERE NOT EXISTS.
-- Note: migration 198 number was already used by 198_lausd_board_seed.sql (unapplied file);
-- this migration uses 205 to maintain sequential order after 204_la_council_orphan_cleanup.

BEGIN;

-- =====================================================================
-- Step 1: Government row
-- governments has NO unique constraint on geo_id — use WHERE NOT EXISTS
-- =====================================================================
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'City and County of San Francisco', 'LOCAL', 'CA', 'San Francisco', '0667000'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = 'City and County of San Francisco' AND state = 'CA'
);

-- =====================================================================
-- Step 2: 10 chambers (slug is a GENERATED column — do NOT include in INSERT)
-- Guard on (name, government_id) via WHERE NOT EXISTS
-- =====================================================================

-- Board of Supervisors
INSERT INTO essentials.chambers (name, government_id)
SELECT 'Board of Supervisors', g.id
FROM essentials.governments g
WHERE g.name = 'City and County of San Francisco'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.chambers c
    WHERE c.name = 'Board of Supervisors' AND c.government_id = g.id
  );

-- Mayor
INSERT INTO essentials.chambers (name, government_id)
SELECT 'Mayor', g.id
FROM essentials.governments g
WHERE g.name = 'City and County of San Francisco'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.chambers c
    WHERE c.name = 'Mayor' AND c.government_id = g.id
  );

-- City Attorney
INSERT INTO essentials.chambers (name, government_id)
SELECT 'City Attorney', g.id
FROM essentials.governments g
WHERE g.name = 'City and County of San Francisco'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.chambers c
    WHERE c.name = 'City Attorney' AND c.government_id = g.id
  );

-- District Attorney
INSERT INTO essentials.chambers (name, government_id)
SELECT 'District Attorney', g.id
FROM essentials.governments g
WHERE g.name = 'City and County of San Francisco'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.chambers c
    WHERE c.name = 'District Attorney' AND c.government_id = g.id
  );

-- Sheriff
INSERT INTO essentials.chambers (name, government_id)
SELECT 'Sheriff', g.id
FROM essentials.governments g
WHERE g.name = 'City and County of San Francisco'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.chambers c
    WHERE c.name = 'Sheriff' AND c.government_id = g.id
  );

-- Assessor-Recorder
INSERT INTO essentials.chambers (name, government_id)
SELECT 'Assessor-Recorder', g.id
FROM essentials.governments g
WHERE g.name = 'City and County of San Francisco'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.chambers c
    WHERE c.name = 'Assessor-Recorder' AND c.government_id = g.id
  );

-- Treasurer
INSERT INTO essentials.chambers (name, government_id)
SELECT 'Treasurer', g.id
FROM essentials.governments g
WHERE g.name = 'City and County of San Francisco'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.chambers c
    WHERE c.name = 'Treasurer' AND c.government_id = g.id
  );

-- Public Defender
INSERT INTO essentials.chambers (name, government_id)
SELECT 'Public Defender', g.id
FROM essentials.governments g
WHERE g.name = 'City and County of San Francisco'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.chambers c
    WHERE c.name = 'Public Defender' AND c.government_id = g.id
  );

-- Controller
INSERT INTO essentials.chambers (name, government_id)
SELECT 'Controller', g.id
FROM essentials.governments g
WHERE g.name = 'City and County of San Francisco'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.chambers c
    WHERE c.name = 'Controller' AND c.government_id = g.id
  );

-- City Administrator
INSERT INTO essentials.chambers (name, government_id)
SELECT 'City Administrator', g.id
FROM essentials.governments g
WHERE g.name = 'City and County of San Francisco'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.chambers c
    WHERE c.name = 'City Administrator' AND c.government_id = g.id
  );

-- =====================================================================
-- Step 3: 11 supervisor district rows (district_type='LOCAL', state='CA')
-- Districts table has no unique constraint on (geo_id, district_type);
-- use WHERE NOT EXISTS for idempotency.
-- Column is 'label' (not 'name') on essentials.districts
-- =====================================================================

INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT 'sf-supervisor-district-1', 'LOCAL', 'District 1', 'CA'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id = 'sf-supervisor-district-1' AND district_type = 'LOCAL');

INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT 'sf-supervisor-district-2', 'LOCAL', 'District 2', 'CA'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id = 'sf-supervisor-district-2' AND district_type = 'LOCAL');

INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT 'sf-supervisor-district-3', 'LOCAL', 'District 3', 'CA'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id = 'sf-supervisor-district-3' AND district_type = 'LOCAL');

INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT 'sf-supervisor-district-4', 'LOCAL', 'District 4', 'CA'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id = 'sf-supervisor-district-4' AND district_type = 'LOCAL');

INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT 'sf-supervisor-district-5', 'LOCAL', 'District 5', 'CA'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id = 'sf-supervisor-district-5' AND district_type = 'LOCAL');

INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT 'sf-supervisor-district-6', 'LOCAL', 'District 6', 'CA'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id = 'sf-supervisor-district-6' AND district_type = 'LOCAL');

INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT 'sf-supervisor-district-7', 'LOCAL', 'District 7', 'CA'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id = 'sf-supervisor-district-7' AND district_type = 'LOCAL');

INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT 'sf-supervisor-district-8', 'LOCAL', 'District 8', 'CA'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id = 'sf-supervisor-district-8' AND district_type = 'LOCAL');

INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT 'sf-supervisor-district-9', 'LOCAL', 'District 9', 'CA'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id = 'sf-supervisor-district-9' AND district_type = 'LOCAL');

INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT 'sf-supervisor-district-10', 'LOCAL', 'District 10', 'CA'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id = 'sf-supervisor-district-10' AND district_type = 'LOCAL');

INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT 'sf-supervisor-district-11', 'LOCAL', 'District 11', 'CA'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id = 'sf-supervisor-district-11' AND district_type = 'LOCAL');

-- =====================================================================
-- Step 4: SF-wide district row for citywide offices (Mayor, City Attorney, etc.)
-- Only insert if no LOCAL or LOCAL_EXEC row for this geo_id+state combo
-- =====================================================================
INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT '0667000', 'LOCAL_EXEC', 'San Francisco (Citywide)', 'CA'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '0667000'
    AND state = 'CA'
    AND district_type IN ('LOCAL', 'LOCAL_EXEC')
);

COMMIT;
