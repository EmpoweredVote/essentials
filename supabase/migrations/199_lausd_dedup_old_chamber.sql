-- Migration 199: Remove duplicate LAUSD at-large "Board of Education" chamber
-- Pre-Phase-62 chamber (86d788f9) had 7 at-large offices with stale/former members.
-- Migration 198 created the correct per-district "LAUSD Board of Education" chamber.

-- Section A: Remap races from old at-large offices to new per-district offices
UPDATE essentials.races
SET office_id = 'fdd29e7d-22c7-4688-90fd-991cd495ed77'
WHERE id = '6479a198-8b4e-4e9c-9013-a3e1a32a351a';  -- D2 → new Rivas office

UPDATE essentials.races
SET office_id = '57cf6779-5e8e-4949-b240-b0f5cb7a0233'
WHERE id = '48841e19-133c-4357-83b4-449656f4843d';  -- D4 → new Melvoin office

UPDATE essentials.races
SET office_id = '53f13370-deee-4b25-86d6-4d5a6971e72a'
WHERE id = 'a40f03de-93d0-4552-8577-cdf0381a734f';  -- D6 → new Gonez office

-- Section B: Update race_candidates from old -202xxx to new -6004xxx
UPDATE essentials.race_candidates
SET politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -6004002)
WHERE id = '2302cb93-4d7f-43eb-824b-76ee0c2ff8d6';  -- Rocío Rivas

UPDATE essentials.race_candidates
SET politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -6004003)
WHERE id = '4db2564a-3ed2-4daa-b230-060b891d31d9';  -- Scott Schmerelson

UPDATE essentials.race_candidates
SET politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -6004004)
WHERE id = '99e5f026-9d7e-4f4b-b4af-a7e813d5f430';  -- Nick Melvoin

UPDATE essentials.race_candidates
SET politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -6004006)
WHERE id = '7a789d00-ba46-413c-ad1f-6b7e6a1d9b55';  -- Kelly Gonez

-- Section C: Clear all dependent rows for the 5 old politicians being deleted
DELETE FROM inform.politician_answers
WHERE politician_id IN (SELECT id FROM essentials.politicians WHERE external_id IN (-202137,-202138,-202139,-202141,-202142));

DELETE FROM inform.politician_context
WHERE politician_id IN (SELECT id FROM essentials.politicians WHERE external_id IN (-202137,-202138,-202139,-202141,-202142));

DELETE FROM inform.topic_rewrite_stance_proposals
WHERE politician_id IN (SELECT id FROM essentials.politicians WHERE external_id IN (-202137,-202138,-202139,-202141,-202142));

DELETE FROM essentials.politician_stances
WHERE politician_id IN (SELECT id FROM essentials.politicians WHERE external_id IN (-202137,-202138,-202139,-202141,-202142));

DELETE FROM essentials.politician_images
WHERE politician_id IN (SELECT id FROM essentials.politicians WHERE external_id IN (-202137,-202138,-202139,-202141,-202142));

-- Section D: Delete all 7 offices from old at-large chamber
DELETE FROM essentials.offices
WHERE chamber_id = '86d788f9-9dea-4fdc-bb58-a86c859fa0ae';

-- Section E: Delete old "Los Angeles Unified Board of Education" chamber
DELETE FROM essentials.chambers
WHERE id = '86d788f9-9dea-4fdc-bb58-a86c859fa0ae';

-- Section F: Delete old at-large politicians that have -6004xxx replacements
-- Keeping -202136 (Jackie Goldberg) and -202140 (Mónica García) — former members, no replacement
DELETE FROM essentials.politicians
WHERE external_id IN (-202137, -202138, -202139, -202141, -202142);
