-- Migration 203: Fix CA federal grouping issues
--
-- Fix 1: Alex Padilla's office is linked to "Inglewood City Council" chamber.
--   His politician row (-6000201) is a U.S. Senator. Update his office to the
--   United States Senate chamber with the California state district.
UPDATE essentials.offices
SET
  chamber_id  = '7cbe07bc-84b8-433b-952b-540e7de18a92',  -- United States Senate
  district_id = '8f76aeec-fcd4-4010-9a37-7bca1063224b'   -- California (geo_id=06, NATIONAL_UPPER)
WHERE id = '24a4f107-b36c-4291-82c1-347235e31226';        -- Padilla's office

-- Fix 2: Delete per-district government_bodies entries for CA congressional districts.
--   17 districts had entries, 3 (CD-20, CD-40, CD-47) did not — causing Fong/Kim/Min
--   to appear in a separate "U.S. REPRESENTATIVE" section from the other House members.
--   Removing all entries lets all CA House reps share government_body_name='' and group together.
DELETE FROM essentials.government_bodies
WHERE state = 'CA' AND body_key = 'United States House of Representatives';
