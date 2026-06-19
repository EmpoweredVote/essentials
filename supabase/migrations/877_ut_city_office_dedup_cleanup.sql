-- Migration 877: Utah city council office-row dedup cleanup
--
-- Removes 5 surplus/stale office rows left behind when the v16.0 Utah deep-seed (migrations
-- 777-806) renumbered SLC wards -> numbered districts and re-seeded Ogden/Layton WITHOUT
-- deleting the pre-existing skeletal rows. Each surplus row is a second office for a person
-- already seated under their canonical deep-seed row, so they render as DUPLICATE
-- councilmembers on the SLC / Ogden / Layton browse views.
--
-- Pattern matches the v15.0 LA reconciliation (migration 204_la_council_orphan_cleanup):
-- UNLINK the surplus OFFICE rows only. The politician, stance, and image records are
-- intentionally KEPT (they become orphaned and stop rendering, but no research data is
-- destroyed and the change is fully reversible by re-inserting the office row).
--
-- Surplus rows removed (office_id | city | title | politician | ext_id | orphaned stances):
--   819a9c30 | SLC    | Council Ward 1            | Victoria Petro          | -391010      | 9  (dup of D1 Petro-Eschler -4967000011)
--   f8685258 | SLC    | Council Ward 4            | Eva Lopez               | -357172      | 0  (no longer seated)
--   0ad055d1 | SLC    | Council Ward 5            | Darin Mano              | -375832      | 0  (no longer seated)
--   5422c291 | Ogden  | Council District 2 (Chair)| Richard A. Hyer         | -359894      | 0  (dup of D2 Richard Hyer -4955980012)
--   0b7bd5fb | Layton | City Council              | Bettina Smith Edmondson | -310608      | 0  (dup of "City Council Member" -4943660003)
--
-- Keepers (untouched, each has a headshot): SLC D1 Petro-Eschler -4967000011; Ogden D2
-- Richard Hyer -4955980012; Layton "City Council Member" Edmondson -4943660003.
--
-- VICTORIA PETRO NOTE: the deleted Ward-1 record has 9 stances vs the keeper's 7, and the two
-- diverge on residential-zoning (old 2 / keeper 4) and growth-and-development (old 3 / keeper 2).
-- The keeper (-4967000011) is the canonical v16.0 deep-seed research (migration 779, polarity-
-- verified), so its values stand and the old 9 stances are left STRANDED on the orphan record,
-- NOT merged. Optional follow-up if manually re-verified: migrate the 4 keeper-absent topics
-- (economic-development, local-immigration, public-safety-approach, transportation-priorities)
-- from the orphan onto the keeper.
--
-- OGDEN NOTE: the deleted row carried a "(Chair)" annotation. If Hyer is confirmed council
-- chair, re-add it to the keeper with:
--   UPDATE essentials.offices SET title = 'Council District 2 (Chair)'
--   WHERE id = '70656648-e8a2-4e37-8059-a25ffccb5cfb';
--
-- Applied as raw SQL (psql -f / Supabase execute_sql). Does NOT register in schema_migrations
-- (on-disk counter is authoritative for Utah-era migrations). Next migration after this: 878.

BEGIN;

-- Safety guard: abort unless the DB still matches the state this migration was authored against.
DO $$
DECLARE
  targets uuid[] := ARRAY[
    '819a9c30-8a49-4c0f-9ec6-d368a92e80af',
    'f8685258-59cd-4608-96c0-d07466a3e9d2',
    '0ad055d1-efba-4851-b291-700be2f3d180',
    '5422c291-c668-4f60-b17f-a2dba406494a',
    '0b7bd5fb-2bf5-4f68-ba96-17191e4ad5f7'
  ]::uuid[];
  found int;
  refs  int;
BEGIN
  SELECT count(*) INTO found FROM essentials.offices WHERE id = ANY(targets);
  IF found <> 5 THEN
    RAISE EXCEPTION 'Expected 5 target office rows, found % — aborting (DB state changed since authored).', found;
  END IF;

  SELECT count(*) INTO refs FROM essentials.races WHERE office_id = ANY(targets);
  IF refs <> 0 THEN
    RAISE EXCEPTION 'Target offices are referenced by % race row(s) — aborting.', refs;
  END IF;
END $$;

DELETE FROM essentials.offices
WHERE id IN (
  '819a9c30-8a49-4c0f-9ec6-d368a92e80af',  -- SLC Council Ward 1 (Victoria Petro, dup of D1)
  'f8685258-59cd-4608-96c0-d07466a3e9d2',  -- SLC Council Ward 4 (Eva Lopez, stale)
  '0ad055d1-efba-4851-b291-700be2f3d180',  -- SLC Council Ward 5 (Darin Mano, stale)
  '5422c291-c668-4f60-b17f-a2dba406494a',  -- Ogden Council District 2 (Chair) (R.A. Hyer, dup of D2)
  '0b7bd5fb-2bf5-4f68-ba96-17191e4ad5f7'   -- Layton City Council (Edmondson, dup of "City Council Member")
);

-- Post-condition (verify after apply): each city has exactly one office per real person —
-- SLC 8 (Mayor + D1-D7), Ogden 8 (Mayor + 3 at-large + D1-D4), Layton 6 (Mayor + 5 council).

COMMIT;
