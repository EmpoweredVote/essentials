-- Migration 198: LAUSD Board of Education sub-district seed
-- Seeds 7 SCHOOL sub-districts, 7 current board member politicians (-6004001..-6004007),
-- 7 offices linked to lausd-board-district-N geofences + LAUSD Board of Education chamber.
-- D2/D3 fix: new offices correctly map Rivas to D2 and Schmerelson to D3.
-- Pre-conditions (confirmed before writing this migration):
--   - LAUSD government row exists: id=356cd776-ad56-4616-bd3e-f762517b3c72, geo_id='0622710'
--   - 7 lausd-board-district-N rows exist in essentials.geofence_boundaries (Phase 58)
--   - 0 lausd-board-district-N rows in essentials.districts (all will be inserted fresh)
--   - 0 existing -6004xxx politicians (all will be inserted fresh)
--   - Existing 7 at-large offices use district_id=284bf9b3 (at-large geo_id='0622710') — leave untouched

-- =====================================================================
-- Section A: LAUSD Board of Education chamber (new canonical chamber)
-- Note: slug is a GENERATED column — do NOT include in INSERT
-- =====================================================================
INSERT INTO essentials.chambers (name, government_id)
SELECT 'LAUSD Board of Education', g.id
FROM essentials.governments g
WHERE g.name = 'Los Angeles Unified, California, US'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.chambers c
    WHERE c.name = 'LAUSD Board of Education' AND c.government_id = g.id
  );

-- =====================================================================
-- Section B: 7 SCHOOL sub-districts for routing
-- district_type='SCHOOL' (NOT 'SCHOOL_DISTRICT') to match essentialsService.ts
-- state='06' matches essentials.geofence_boundaries.state for these boundaries
-- mtfcc='G5420' matches the geofence_boundaries rows loaded in Phase 58
-- =====================================================================
INSERT INTO essentials.districts (geo_id, label, mtfcc, district_type, state)
SELECT
  'lausd-board-district-' || d.num,
  'LAUSD Board District ' || d.num,
  'G5420',
  'SCHOOL',
  '06'
FROM (VALUES (1),(2),(3),(4),(5),(6),(7)) AS d(num)
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts ed
  WHERE ed.geo_id = 'lausd-board-district-' || d.num
);

-- =====================================================================
-- Section C: 7 current board member politicians
-- external_ids -6004001..-6004007 (new canonical scheme for LAUSD board)
-- D1=Newbill, D2=Rivas, D3=Schmerelson, D4=Melvoin, D5=Griego, D6=Gonez, D7=Ortiz Franklin
-- =====================================================================
INSERT INTO essentials.politicians
  (id, full_name, first_name, last_name, is_active, is_appointed, is_vacant, is_incumbent, external_id)
VALUES
  (gen_random_uuid(), 'Sherlett Hendy Newbill', 'Sherlett', 'Hendy Newbill',  true, false, false, true, -6004001),
  (gen_random_uuid(), 'Dr. Rocio Rivas',        'Rocio',    'Rivas',          true, false, false, true, -6004002),
  (gen_random_uuid(), 'Scott Schmerelson',      'Scott',    'Schmerelson',    true, false, false, true, -6004003),
  (gen_random_uuid(), 'Nick Melvoin',           'Nick',     'Melvoin',        true, false, false, true, -6004004),
  (gen_random_uuid(), 'Karla Griego',           'Karla',    'Griego',         true, false, false, true, -6004005),
  (gen_random_uuid(), 'Kelly Gonez',            'Kelly',    'Gonez',          true, false, false, true, -6004006),
  (gen_random_uuid(), 'Tanya Ortiz Franklin',   'Tanya',    'Ortiz Franklin', true, false, false, true, -6004007)
ON CONFLICT (external_id) DO NOTHING;

-- =====================================================================
-- Section D: D2/D3 data-fix safety net
-- D.1 — Clear any D2 office that incorrectly points to Schmerelson
-- (This is a no-op if no offices are linked to lausd-board-district-2 yet,
--  but is idempotent and safe to include.)
-- =====================================================================
UPDATE essentials.offices o
SET politician_id = NULL
WHERE o.district_id = (
    SELECT id FROM essentials.districts WHERE geo_id = 'lausd-board-district-2'
  )
  AND EXISTS (
    SELECT 1 FROM essentials.politicians p
    WHERE p.id = o.politician_id AND p.full_name ILIKE '%Schmerelson%'
  );

-- D.2 — Insert 7 sub-district offices (one per LAUSD board district)
-- Only insert if no office already exists for that (district_id, chamber_id) pair.
-- offices.title = 'Board Member'; linked via district_id UUID FK (not geo_id string)
-- DO NOT include email column (does not exist on offices)
-- DO NOT re-add unique index on politician_id (dropped in migration 159)
WITH chamber AS (
  SELECT id AS chamber_id FROM essentials.chambers
  WHERE name = 'LAUSD Board of Education' LIMIT 1
),
target AS (
  SELECT * FROM (VALUES
    ('lausd-board-district-1', -6004001),
    ('lausd-board-district-2', -6004002),
    ('lausd-board-district-3', -6004003),
    ('lausd-board-district-4', -6004004),
    ('lausd-board-district-5', -6004005),
    ('lausd-board-district-6', -6004006),
    ('lausd-board-district-7', -6004007)
  ) AS t(geo_id, ext_id)
)
INSERT INTO essentials.offices (id, district_id, chamber_id, politician_id, title, is_appointed_position, is_vacant)
SELECT
  gen_random_uuid(),
  d.id,
  c.chamber_id,
  p.id,
  'Board Member',
  false,
  false
FROM target t
JOIN essentials.districts d ON d.geo_id = t.geo_id
CROSS JOIN chamber c
JOIN essentials.politicians p ON p.external_id = t.ext_id
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.offices o
  WHERE o.district_id = d.id AND o.chamber_id = c.chamber_id
);

-- D.3 — Repoint any existing sub-district offices to the correct politician
-- (Covers drift if D.2 partially ran before; idempotent.)
WITH target AS (
  SELECT * FROM (VALUES
    ('lausd-board-district-1', -6004001),
    ('lausd-board-district-2', -6004002),
    ('lausd-board-district-3', -6004003),
    ('lausd-board-district-4', -6004004),
    ('lausd-board-district-5', -6004005),
    ('lausd-board-district-6', -6004006),
    ('lausd-board-district-7', -6004007)
  ) AS t(geo_id, ext_id)
)
UPDATE essentials.offices o
SET politician_id = p.id
FROM target t
JOIN essentials.districts d ON d.geo_id = t.geo_id
JOIN essentials.politicians p ON p.external_id = t.ext_id
WHERE o.district_id = d.id
  AND (o.politician_id IS DISTINCT FROM p.id);
