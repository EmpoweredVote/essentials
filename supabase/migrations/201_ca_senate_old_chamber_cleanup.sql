-- Migration 201: Remove stale "California Senate" chamber and its 13 offices.
-- These were pre-Phase-61 senate records. Phase 61 created correct senators
-- in "California State Senate" chamber. The old chamber caused a split
-- "CALIFORNIA SENATE" vs "SENATOR" section in the UI.

-- Section A: Remap race referencing old SD-26 office → new office (Durazo)
UPDATE essentials.races
SET office_id = '493a571f-b01b-4253-afbc-ffe3979f52bb'
WHERE id = '8950a6e9-1123-4a83-87e2-4a6715b64a92';

-- Section B: Delete all 13 offices in the old "California Senate" chamber
DELETE FROM essentials.offices
WHERE chamber_id = '1545a1c9-ff26-4fcc-9425-170399bcf728';

-- Section C: Delete the old "California Senate" chamber
DELETE FROM essentials.chambers
WHERE id = '1545a1c9-ff26-4fcc-9425-170399bcf728';

-- Section D: Delete the 13 government_bodies rows keyed to the old chamber name
DELETE FROM essentials.government_bodies
WHERE body_key = 'California Senate' AND state = 'CA';
