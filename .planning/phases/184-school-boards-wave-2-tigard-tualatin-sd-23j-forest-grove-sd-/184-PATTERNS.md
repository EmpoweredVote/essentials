# Phase 184: School Boards Wave 2 — Pattern Map

**Mapped:** 2026-07-04
**Files analyzed:** 5 (1 probe SQL, 1 structural migration, 1 headshot migration, 1 headshot ETL script, 1 coverage.js edit)
**Analogs found:** 5 / 5

> This phase is a same-shape clone of Phase 183 (Wave 1). Every analog below is the **183-shipped
> file itself** (not 183's own analogs), because 183 is one phase old, same schema, same shape,
> and its own PATTERNS.md is already the authoritative pattern map — see
> `.planning/phases/183-school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j/183-PATTERNS.md`.
> **CRITICAL DEVIATION FROM 183:** do not clone 1203/1205 verbatim. `183-REVIEW.md` found 3
> Warning-level latent defects (WR-01/WR-02/WR-03) in these exact files; the excerpts below show
> the FIXED shape, not the original. Also: **all three Wave-2 boards are 5-seat, not 7-seat**
> (RESEARCH.md Key Finding 1) — every count literal (`official_count`, expected-offices gate,
> `OFFICIALS` length guard, ext_id block width) must read 5, not 7.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|---------------|
| `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave2-probe.sql` | utility (read-only DB probe) | request-response (SELECT only) | `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-probe.sql` | exact |
| `C:/EV-Accounts/backend/migrations/1206_or_westmetro_school_boards_wave2.sql` | migration (structural) | CRUD (batch INSERT) | `C:/EV-Accounts/backend/migrations/1203_or_westmetro_school_boards_wave1.sql` — **WITH WR-01/WR-02 fixes applied, 5-seat counts** | exact (fixed) |
| `C:/EV-Accounts/backend/migrations/1207(or next free)_..._headshots.sql` | migration (audit-only) | CRUD (batch INSERT) | `C:/EV-Accounts/backend/migrations/1205_or_westmetro_school_boards_wave1_headshots.sql` — **WITH WR-03 fix applied** | exact (fixed) |
| `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave2-headshots.py` | utility (headshot ETL, file-I/O) | file-I/O (download → transform → upload) + request-response (WP REST API GET, new this wave) | `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-headshots.py` | exact (extended — 3 CDN sourcing paths, not 1) |
| `src/lib/coverage.js` (edit — append 3 entries to `COVERAGE_SCHOOL_DISTRICTS`) | config (data table) | CRUD (static array append) | Same file, lines 253-257 (current state, already includes the 2 Wave-1 entries) | exact |

No frontend component/controller files expected — `groupHierarchy.js` Rule 3.5 already renders school-board card subtitles for any SCHOOL district with no code change (confirmed working live for both Wave-1 boards per 183 SUMMARY).

---

## Pattern Assignments

### `_tmp-westmetro-school-wave2-probe.sql` (utility, read-only DB probe)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-probe.sql` (full file, 102 lines) — clone structure, apply IN-03 fixes (accurate migration-number comment; margin on BOTH bounds of every ext_id range).

**Header/scope-note pattern** (wave1-probe.sql lines 1-13) — gitignored `_tmp-*`, read-only, states what's pre-loaded and what branch is moot:
```sql
-- _tmp-westmetro-school-wave2-probe.sql
-- Phase 184 (WSCH-03 + WSCH-04 + WSCH-05) — School Boards Wave 2: Tigard-Tualatin SD 23J +
-- Forest Grove SD 15 + Sherwood SD 88J
-- Gitignored orchestrator-run helper (_tmp-* convention) -- DO NOT COMMIT to the EV-Accounts repo.
-- Read-only SELECT/\echo statements only -- no DDL, no transaction wrapper, no writes.
--
-- CONTEXT: All 3 G5420 geofences (4112240 TTSD, 4105160 FGSD, 4111290 SSD) already loaded and
-- smoke-tested by Phase 174 -- this phase must NOT re-load them. All 3 boards confirmed
-- WHOLE-DISTRICT at-large (research 2026-07-04) -- D-Z1 zone-voted branch does not fire for any
-- of the 3; D-Z2 fallback is moot. All 3 boards are 5-seat (NOT 7 like Wave 1) -- every ext_id
-- block and count literal below reflects 5, not 7.
```

**Probe A — geofence existence-and-name** (wave1-probe.sql lines 15-25), extend to 3 rows:
```sql
\echo '=== PROBE A: geo_id IN (4112240,4105160,4111290) AND mtfcc=G5420 -- EXPECT 3 rows ==='
SELECT geo_id, mtfcc, name, source, ST_IsValid(geometry) AS is_valid
FROM essentials.geofence_boundaries
WHERE geo_id IN ('4112240','4105160','4111290') AND mtfcc = 'G5420';
```

**Probe B — greenfield governments** (wave1-probe.sql lines 27-37), extend to 3 names + 3 ILIKE terms, EXPECT 0.

**Probe C — greenfield districts** (wave1-probe.sql lines 39-47), extend geo_id IN list to 3, EXPECT 0.

**Probe D — ext_id collision, margin on BOTH bounds (IN-03 fix)** — Wave-1's Hillsboro range had zero margin on the lower bound (`-4100030..-4100020`, exactly on the block edge); Wave-2 blocks are 5-wide, give real margin both sides:
```sql
\echo '=== PROBE D: external_id collision check, all 3 blocks with margin BOTH sides -- EXPECT 0 rows ==='
SELECT external_id, full_name
FROM essentials.politicians
WHERE external_id BETWEEN -4112250 AND -4112238   -- TTSD block -4112241..-4112245, margin both sides
   OR external_id BETWEEN -4105170 AND -4105158   -- FGSD block -4105161..-4105165, margin both sides
   OR external_id BETWEEN -4111300 AND -4111288   -- SSD block  -4111291..-4111295, margin both sides
ORDER BY external_id;
```

**Probe E — migration ledger, accurate number in comment (IN-03 fix)** — Wave-1's probe comment said "headshots 1204" when it actually shipped as 1205 (never updated after the collision). Name the REAL expected headshot migration number from the start:
```sql
\echo '=== PROBE E: ledger MAX(version) -- cross-check against on-disk ls, do not use directly ==='
-- On-disk MAX confirmed 1205 (2026-07-04, no 1206 file exists) -> next structural = 1206,
-- next headshot migration = 1207 (re-confirm both immediately before authoring each file --
-- 1204 was claimed by a concurrent AZ workstream mid-Phase-183, filename collisions are real).
SELECT MAX(version::bigint) AS ledger_max_version
FROM supabase_migrations.schema_migrations
WHERE version ~ '^[0-9]{1,6}$';
```

**Probe F — casing confirmation** (wave1-probe.sql lines 77-85), reuse verbatim (Portland Public Schools geo_id 4110040, EXPECT lowercase 'or').

**Probe G — 0-stance baseline** (wave1-probe.sql lines 87-99), extend ext_id ranges to all 3 5-wide blocks, EXPECT 0.

---

### `1206_or_westmetro_school_boards_wave2.sql` (migration, structural — WR-01/WR-02 baked in)

**Analog:** `C:/EV-Accounts/backend/migrations/1203_or_westmetro_school_boards_wave1.sql` (full file, 686 lines) — **do NOT copy the office CTE or post-verify gate verbatim; both need the 183-REVIEW fixes from first authoring, not patched after.**

**Header/CRITICAL-comment-block pattern** (1203 lines 1-40) — copy shape, substitute facts. Note the seat-count and fix-provenance deltas:
```sql
-- Migration 1206: Tigard-Tualatin SD 23J + Forest Grove SD 15 + Sherwood SD 88J school boards (wave 2)
--
-- Purpose: Deep-seeds THREE west-metro school-district governments end-to-end:
--   Tigard-Tualatin SD 23J (geo_id='4112240') -- 1 gov + 'School Board' chamber
--     (official_count=5) + 1 shared SCHOOL district + 5 directors (Position 1-5).
--   Forest Grove SD 15 (geo_id='4105160') -- 1 gov + 'School Board' chamber
--     (official_count=5) + 1 shared SCHOOL district + 5 directors (Position 1-5).
--   Sherwood SD 88J (geo_id='4111290') -- 1 gov + 'Board of Directors' chamber
--     (official_count=5) + 1 shared SCHOOL district + 5 directors (Position 1-5).
--   All three boards are WHOLE-DISTRICT AT-LARGE (Wave-0 confirmed) -- one shared SCHOOL
--   district per government carries all 5 seats; NO sub-zone/per-seat districts or geofences.
--
-- CRITICAL: all three boards are 5-SEAT (NOT 7 like Wave 1) -- office CTE count (15 total, not
--           21), official_count, ext_id block width, and post-verify gate literals all read 5.
-- CRITICAL: the auto-generated column on essentials.chambers is GENERATED ALWAYS -- never in the
--           INSERT list.
-- CRITICAL: essentials.governments has NO unique constraint on geo_id/name -- every government
--           INSERT uses a WHERE NOT EXISTS name guard.
-- CRITICAL: districts.state must be 'or' (LOWERCASE) to match routing queries -- uppercase = 0
--           rows and a silently-empty office JOIN (the #1 pitfall this milestone).
-- CRITICAL: governments.state = 'OR' (uppercase). offices.representing_state = 'OR' (uppercase).
-- CRITICAL: district_type='SCHOOL' (NOT 'SCHOOL_DISTRICT').
-- CRITICAL: all three G5420 geofence rows (4112240 / 4105160 / 4111290) ALREADY EXIST -- loaded
--           by Phase 174. This migration does NOT run any geofence loader.
-- CRITICAL: party=NULL on all 15 directors (antipartisan mission).
-- CRITICAL: all 15 seats are ELECTED -- is_appointed=false, is_appointed_position=false.
-- CRITICAL: Chair/Vice-Chair are titles on existing elected seats, NOT separate rows -- 5 offices
--           per district (15 total), never 6.
-- CRITICAL (183-REVIEW WR-01/WR-02 baked in from authoring, not patched after): every
--           politician+office CTE resolves the politician id via a `pol` union CTE (not a raw
--           CROSS JOIN on `ins_p`) so the office NOT EXISTS guard is genuinely live/self-healing;
--           the post-verify DO block asserts chamber_id IS NOT NULL for all 15 offices.
```

**Government INSERT pattern** (1203 lines 64-80) — copy verbatim shape, 3 governments instead of 2. `type='LOCAL'`, `state='OR'` uppercase, `WHERE NOT EXISTS` guard (no unique constraint):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'Tigard-Tualatin School District 23J, Oregon, US',
       'LOCAL', 'OR', NULL, '4112240'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'Tigard-Tualatin School District 23J, Oregon, US'
);
```
Repeat for `'Forest Grove School District 15, Oregon, US'` (geo_id `4105160`) and `'Sherwood School District 88J, Oregon, US'` (geo_id `4111290`).

**Chamber INSERT pattern** (1203 lines 87-111) — verbatim per-district naming (D-R1/D-R2), `official_count=5` (NOT 7):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'School Board',
       'Tigard-Tualatin School District 23J School Board',
       (SELECT id FROM essentials.governments WHERE name = 'Tigard-Tualatin School District 23J, Oregon, US'),
       5
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'School Board'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'Tigard-Tualatin School District 23J, Oregon, US')
);
```
Names: TTSD `'School Board'`, FGSD `'School Board'`, SSD `'Board of Directors'` (RESEARCH.md Key Finding 5, all verbatim-confirmed).

**SCHOOL district INSERT pattern** (1203 lines 119-131) — one shared district per government, lowercase state, `mtfcc='G5420'`, geo_id already exists (no loader):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'SCHOOL', 'or', '4112240', 'Tigard-Tualatin School District 23J', 'G5420'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4112240' AND district_type = 'SCHOOL' AND state = 'or'
);
```
Repeat for `4105160`/`'Forest Grove School District 15'` and `4111290`/`'Sherwood School District 88J'`.

**Politician+office CTE pattern — WR-01 FIX APPLIED (load-bearing delta from 1203)**

1203's original shape (lines 144-174, do NOT copy this exact CROSS-JOIN-on-`ins_p` form — WR-01 confirms the `NOT EXISTS` guard is dead code because `ins_p` yields 0 rows whenever the politician already exists):
```sql
-- ORIGINAL 1203 shape (VULNERABLE — do not copy):
ins_p AS (
  INSERT INTO essentials.politicians (...) VALUES (...)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices (...)
SELECT ..., p.id, ...
FROM essentials.districts d CROSS JOIN ins_p p   -- BUG: 0 rows when politician pre-exists
WHERE ... AND NOT EXISTS (...)                    -- unreachable guard
```

**Fixed shape for 1206 (183-REVIEW.md WR-01 fix, verbatim):**
```sql
-- Position 1: David Jaimes — -4112241
WITH chamber AS (
  SELECT id FROM essentials.chambers
  WHERE name = 'School Board'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'Tigard-Tualatin School District 23J, Oregon, US')
),
ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'David Jaimes', 'David', 'Jaimes', NULL,
          true, false, false, true, -4112241)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
),
pol AS (
  SELECT id FROM ins_p
  UNION
  SELECT id FROM essentials.politicians WHERE external_id = -4112241
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM chamber),
       p.id,
       'Director, Position 1', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN pol p
WHERE d.geo_id = '4112240' AND d.district_type = 'SCHOOL' AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```
Apply 15× (5 TTSD + 5 FGSD + 5 SSD), each with its own `pol` CTE referencing that seat's own `-4XXXXXX` external_id. Titles per RESEARCH.md Pattern 3 roster tables: all "Director, Position N" with Chair/Vice-Chair title-on-seat suffixes:
- TTSD (ext_id -4112241..-4112245): P1 Jaimes, P2 Miles, P3 Irvin "(Vice Chair)", P4 Zurschmeide "(Chair)", P5 Weston — **re-verify Chair/VC pairing at execution time (RESEARCH.md Assumption A3 — possible annual rotation)**.
- FGSD (ext_id -4105161..-4105165): P1 Franco, P2 Truax, P3 Lozano "(Vice Chair)", P4 Harrington, P5 Kottkey "(Chair)".
- SSD (ext_id -4111291..-4111295): P1 Carson "(Chair)" — verbatim seat title is literally `'Board Chair/Director, Position 1'`, P2 Kaufman, P3 Hawkins "(Vice Chair)" — verbatim `'Board Vice Chair/Director, Position 3'`, P4 Moller, P5 Thornton. **Sherwood's title strings are HIGH-confidence literal from the district's own page — use the district's exact phrasing, not a generic "(Chair)"/"(Vice Chair)" suffix, for these two seats specifically** (RESEARCH.md Key Finding 5).

**office_id back-fill pattern** (1203 lines 607-616) — same shape, extend the `external_id IN (...)` list to all 15:
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id IN (-4112241,-4112242,-4112243,-4112244,-4112245,
                         -4105161,-4105162,-4105163,-4105164,-4105165,
                         -4111291,-4111292,-4111293,-4111294,-4111295)
  AND p.office_id IS NULL;
```

**Post-verify DO block — WR-02 FIX APPLIED (chamber_id IS NOT NULL assertion added)**

1203's original gate (lines 624-675) had no `chamber_id IS NULL` check at all. Fixed shape for 1206, extended to 3 governments/5-seat counts AND the new WR-02 gate:
```sql
DO $$
DECLARE
  v_ttsd_gov INTEGER; v_fgsd_gov INTEGER; v_ssd_gov INTEGER;
  v_ttsd_off INTEGER; v_fgsd_off INTEGER; v_ssd_off INTEGER;
  v_split INTEGER; v_null_chamber INTEGER; v_null_oid INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_ttsd_gov FROM essentials.governments WHERE name = 'Tigard-Tualatin School District 23J, Oregon, US';
  SELECT COUNT(*) INTO v_fgsd_gov FROM essentials.governments WHERE name = 'Forest Grove School District 15, Oregon, US';
  SELECT COUNT(*) INTO v_ssd_gov  FROM essentials.governments WHERE name = 'Sherwood School District 88J, Oregon, US';
  IF v_ttsd_gov <> 1 OR v_fgsd_gov <> 1 OR v_ssd_gov <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 gov each, found TTSD=%, FGSD=%, SSD=%', v_ttsd_gov, v_fgsd_gov, v_ssd_gov;
  END IF;

  SELECT COUNT(*) INTO v_ttsd_off FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id
    WHERE d.geo_id='4112240' AND d.district_type='SCHOOL' AND d.state='or';
  SELECT COUNT(*) INTO v_fgsd_off FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id
    WHERE d.geo_id='4105160' AND d.district_type='SCHOOL' AND d.state='or';
  SELECT COUNT(*) INTO v_ssd_off  FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id
    WHERE d.geo_id='4111290' AND d.district_type='SCHOOL' AND d.state='or';
  -- NOTE: expected count is 5 per district (Key Finding 1) — NOT 7 like Wave 1.
  IF v_ttsd_off <> 5 OR v_fgsd_off <> 5 OR v_ssd_off <> 5 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 5 offices each, found TTSD=%, FGSD=%, SSD=%', v_ttsd_off, v_fgsd_off, v_ssd_off;
  END IF;

  -- WR-02 FIX: assert no office landed with a NULL chamber_id (chamber-name string drift guard)
  SELECT COUNT(*) INTO v_null_chamber
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id IN ('4112240','4105160','4111290') AND d.district_type = 'SCHOOL' AND d.state = 'or'
    AND o.chamber_id IS NULL;
  IF v_null_chamber <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: % offices have NULL chamber_id', v_null_chamber;
  END IF;

  SELECT COUNT(*) INTO v_split
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id IN ('4112240','4105160','4111290') AND gb.mtfcc = 'G5420'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id AND d.district_type = 'SCHOOL' AND d.state = 'or'
    );
  IF v_split <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % orphan rows', v_split;
  END IF;

  SELECT COUNT(*) INTO v_null_oid
  FROM essentials.politicians
  WHERE external_id IN (-4112241,-4112242,-4112243,-4112244,-4112245,
                         -4105161,-4105162,-4105163,-4105164,-4105165,
                         -4111291,-4111292,-4111293,-4111294,-4111295)
    AND office_id IS NULL;
  IF v_null_oid <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: % directors still have NULL office_id after back-fill', v_null_oid;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: TTSD gov=%/off=%, FGSD gov=%/off=%, SSD gov=%/off=%, null_chamber=%, split_orphans=%, office_id_nulls=%',
    v_ttsd_gov, v_ttsd_off, v_fgsd_gov, v_fgsd_off, v_ssd_gov, v_ssd_off, v_null_chamber, v_split, v_null_oid;
END $$;
```

**Ledger registration pattern** (1203 lines 677-686) — version-only form, before COMMIT:
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('1206')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

---

### `1207 (or next free)_or_westmetro_school_boards_wave2_headshots.sql` (migration, audit-only — WR-03 fix baked in)

**Analog:** `C:/EV-Accounts/backend/migrations/1205_or_westmetro_school_boards_wave1_headshots.sql` (full file, 254 lines) — **do NOT copy the per-block INSERT shape verbatim; WR-03 confirms the guard is vacuously true when the politician lookup returns NULL.**

**Header pattern** (1205 lines 1-49) — AUDIT-ONLY, numbering-collision note, sourcing note (this wave needs 3 CDN provenance notes, not 1), documented-gap section, orchestrator checklist:
```sql
-- Migration 1207 (or next free number — re-confirm on-disk MAX at Wave-0): Tigard-Tualatin
-- SD 23J + Forest Grove SD 15 + Sherwood SD 88J School Board Headshots — AUDIT-ONLY
-- (not registered in the ledger)
--
-- Phase 184 Plan 0N — WSCH-03 + WSCH-04 + WSCH-05 (headshot portion).
--
-- Records the essentials.politician_images rows for the 15 directors (5 TTSD + 5 FGSD + 5 SSD)
-- whose 600x750 portraits were uploaded to Supabase Storage
-- (politician_photos/{uuid}-headshot.jpg) by _tmp-westmetro-school-wave2-headshots.py.
--
-- THREE DIFFERENT SOURCING TECHNIQUES this wave (unlike Wave 1's uniform finalsite sourcing):
--   TTSD (5): finalsite CDN, untransformed originals, small-but-genuine circular photos
--     (3.3KB-27KB) — Lanczos-upscale-with-documented-caveat, same class of treatment as
--     Hillsboro in Wave 1.
--   FGSD (5): Edlio CDN direct JPEGs. 4/5 genuine high-quality photos. Position 4 (Linda
--     Harrington) is a DOCUMENTED GAP — the on-page image is a confirmed "Coming Soon"
--     placeholder graphic (4.3KB gray PNG), not a real photo (D-R5 — no fabrication). If a
--     usable local-news photo of her June 2026 appointment was found at execution time, cite
--     that source instead; otherwise this INSERT block is simply omitted for her.
--   SSD (5): WordPress + Fly Dynamic Image Resizer originals recovered via
--     wp-json/wp/v2/media/{id} -> media_details.sizes.large.source_url (NOT the on-page
--     pre-cropped fly-images URL — that is a transform-output trap, same class as finalsite's
--     t_image_size_6). 4/5 native 2400x3000 exact-4:5 (no-op crop, no upscale — best sourcing
--     quality in the milestone); 1/5 (Matt Kaufman) near-square 1831x1694, ordinary center-crop.
--
-- DOCUMENTED GAPS (no fabrication — honest blanks, no row):
--   -4105164 Linda Harrington (FGSD Position 4) — "Coming Soon" placeholder is not a real photo;
--     recent June 23, 2026 mid-term appointee, district has not yet published her portrait.
--
-- AUDIT-ONLY: does NOT write a ledger row (matches 1205's convention).
-- columns: essentials.politician_images is exactly (id, politician_id, url, type, photo_license).
```

**Per-official INSERT pattern — WR-03 FIX APPLIED (load-bearing delta from 1205)**

1205's original shape (lines 56-64, do NOT copy — WR-03 confirms `WHERE NOT EXISTS (... politician_id = (SELECT id FROM politicians WHERE external_id = ...))` is vacuously true and would insert `politician_id = NULL` if the politician is absent):
```sql
-- ORIGINAL 1205 shape (VULNERABLE — do not copy):
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4101921),  -- NULL if missing
       'https://.../headshot.jpg',
       'default', 'press_use'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4101921)  -- vacuously true when NULL
);
```

**Fixed shape for 1207 (183-REVIEW.md WR-03 fix, verbatim):**
```sql
-- David Jaimes (TTSD Position 1, -4112241) — SOURCE: ttsdschools.org / resources.finalsite.net (direct, HTTP 200)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(), p.id,
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'press_use'
FROM essentials.politicians p
WHERE p.external_id = -4112241
  AND NOT EXISTS (SELECT 1 FROM essentials.politician_images pi WHERE pi.politician_id = p.id);
```
Repeat 14× (skip Harrington unless a usable photo was found) against `-4112241..-4112245`, `-4105161..-4105165` (minus `-4105164` if the gap stands), `-4111291..-4111295`. `{uuid}` values come from the headshot ETL manifest (populated at execution time by the orchestrator, same as 1205's workflow — the structural migration 1206 mints the politician UUIDs, the ETL script resolves them and prints the manifest, the orchestrator hand-fills the URL literals here).

**Post-verify uuid-embed gate pattern** (1205 lines 214-251) — same shape, derives its identity set from the SAME uuid literals the INSERTs above use (not a hardcoded external_id range) so a clone that edits INSERT uuids fails loudly instead of passing vacuously:
```sql
DO $$
DECLARE missing INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing
  FROM (VALUES
    ('{ttsd-p1-uuid}'::uuid),  -- David Jaimes
    -- ... one row per shipped director (14, or 15 if Harrington's gap is resolved)
  ) AS expected(pid)
  WHERE NOT EXISTS (
    SELECT 1 FROM essentials.politician_images pi
    WHERE pi.politician_id = expected.pid
      AND pi.url LIKE '%' || expected.pid::text || '%'
  );
  IF missing <> 0 THEN
    RAISE EXCEPTION 'Westmetro school boards wave-2 headshot gate: % targeted politician uuid(s) lack a politician_images row with a uuid-embedding url', missing;
  END IF;
END $$;

COMMIT;
```

---

### `_tmp-westmetro-school-wave2-headshots.py` (utility, headshot ETL pipeline)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-headshots.py` (full file, 609 lines) — same pipeline shape; extend with the IN-01 `.env` parser fix and a third sourcing code path for Sherwood's WP REST API.

**Config/env-load pattern — IN-01 FIX APPLIED (strips quotes + `export ` prefix)**

Wave-1's original parser (lines 237-244) did NOT strip quotes/`export `. Fixed shape for Wave-2:
```python
_env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
_env = {}
with open(_env_path) as f:
    for line in f:
        line = line.strip()
        if line.startswith('export '):
            line = line[len('export '):].strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            v = v.strip().strip('\'"')   # IN-01 FIX: strip surrounding quotes
            _env[k.strip()] = v

SUPABASE_URL = _env.get('SUPABASE_URL', '')
SERVICE_KEY = _env.get('SUPABASE_SERVICE_ROLE_KEY', '')
DATABASE_URL = _env.get('DATABASE_URL', '')
BUCKET = 'politician_photos'

if not (SUPABASE_URL.startswith('https://') and '.supabase.co' in SUPABASE_URL):
    raise ValueError(
        f'SUPABASE_URL missing or malformed — cannot derive storage CDN base: {SUPABASE_URL!r}'
    )
_project_ref = SUPABASE_URL.split('//', 1)[1].split('.', 1)[0]
CDN_BASE = f'https://{_project_ref}.storage.supabase.co/storage/v1/object/public/{BUCKET}'

TARGET_SIZE = (600, 750)
JPEG_QUALITY = 90
RESAMPLE = Image.Resampling.LANCZOS
```

**Roster shape** (wave1 lines 104-219) — same `OFFICIALS` list-of-dicts shape, 15 entries (5 TTSD + 5 FGSD + 5 SSD) instead of 14. Guard checks (wave1 lines 224-231) update the hardcoded `14` to `15` — but this wave has one genuine gap (Harrington), so decide at execution time whether `OFFICIALS` should hold 15 with a `'url': None` entry that's explicitly skipped, or 14 with an explicit code comment documenting the omission (either is consistent with D-R5; do not silently drop her from the roster comment without a note):
```python
OFFICIALS = [
    {
        'ext_id': -4112241,
        'name': 'David Jaimes',
        'url': 'https://resources.finalsite.net/images/v1692537256/ttsdschoolsorg/cqzkjpsorsuu0uygvhfe/DJaimes.png',
        'license': 'press_use',
        # TTSD Position 1. Small circular finalsite photo (~20KB) — Lanczos-upscale with
        # documented caveat, same class of treatment as Hillsboro in Wave 1.
    },
    # ... 4 more TTSD, 5 FGSD (Harrington's entry either omitted with a comment, or present with
    # a local-news-sourced url if one was found at execution time), 5 Sherwood
]

if len({m['ext_id'] for m in OFFICIALS}) != len(OFFICIALS):
    raise ValueError('external_ids must be unique')
if not all(m['license'] for m in OFFICIALS):
    raise ValueError('every official must carry a license string')
if not all(m['url'] for m in OFFICIALS):
    raise ValueError('every official must carry a source url')
```
Do not carry forward Wave-1's `len(OFFICIALS) != 14: raise` hard gate unmodified — replace the literal with the actual expected count for this run (14 if Harrington's gap stands, 15 if resolved), and comment why.

**NEW sourcing code path — Sherwood WP REST API original-recovery (RESEARCH.md Pattern 4, novel this wave)**

Add a small helper alongside `download_image()` used only for the 5 Sherwood sources — resolve the true original/large rendition before downloading the pixel bytes, rather than using the on-page pre-cropped `fly-images` URL directly:
```python
def resolve_wp_media_large_url(media_api_url: str) -> str:
    """
    Given a WordPress REST API media endpoint URL
    (https://sherwood.k12.or.us/wp-json/wp/v2/media/{attachment_id}), return the
    'large' rendition source_url (already-cropped-if-needed by WP, confirmed
    4:5 for 4/5 Sherwood directors). Falls back to the raw source_url if no
    'large' size is present. NEVER use the on-page fly-images pre-cropped URL
    directly — that is a transform-output trap, the same class as finalsite's
    t_image_size_6 (RESEARCH.md Pattern 4 / Pitfall 4).
    """
    resp = requests.get(media_api_url, headers=DESCRIPTIVE_HEADERS, timeout=DOWNLOAD_TIMEOUT)
    if resp.status_code != 200:
        raise Exception(f'HTTP {resp.status_code} for WP media API {media_api_url}')
    data = resp.json()
    sizes = data.get('media_details', {}).get('sizes', {})
    if 'large' in sizes:
        return sizes['large']['source_url']
    return data['source_url']
```
Sherwood roster entries carry a `wp_media_api_url` field (e.g. `https://sherwood.k12.or.us/wp-json/wp/v2/media/10012`) instead of a plain `url`; `process_member()` resolves it via `resolve_wp_media_large_url()` before calling `download_image()` on the result. Matt Kaufman (near-square 1831×1694) needs the ordinary `crop_to_4_5` center-crop branch to actually execute (not a no-op like the other 4 Sherwood sources).

**Everything else unchanged from Wave 1** — `resolve_politician_id()`, `download_image()` (lines 293-309), `crop_to_4_5()` (lines 312-343, including the RGBA/circle-cutout inscribed-crop branch kept intact even though not exercised), `resize_600x750()` (lines 346-350), `upload_to_storage()` (lines 353-371), `process_headshot_bytes()` (lines 374-435), `test_download_guard()` (lines 438-464), `process_member()` (lines 467-530), and `main()`'s WR-01/WR-C/WR-02 fixes (lines 533-608) — copy verbatim, these are standing milestone-wide fixes, not Wave-1-specific.

---

### `src/lib/coverage.js` (config, append 3 entries to `COVERAGE_SCHOOL_DISTRICTS`)

**Analog:** the file's own current state at lines 253-257 (already contains CCSD + both Wave-1 entries — this is the exact, currently-live template):
```javascript
export const COVERAGE_SCHOOL_DISTRICTS = [
  { label: 'Clark County School District', browseGeoId: '3200060', browseMtfcc: 'G5420', browseStateAbbrev: 'NV' },
  { label: 'Beaverton School District 48J', browseGeoId: '4101920', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
  { label: 'Hillsboro School District 1J', browseGeoId: '4100023', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
];
```
Append (do not add `hasContext` — plain entry is the honest state per `[[feedback_school_districts_search_only]]`):
```javascript
export const COVERAGE_SCHOOL_DISTRICTS = [
  { label: 'Clark County School District', browseGeoId: '3200060', browseMtfcc: 'G5420', browseStateAbbrev: 'NV' },
  { label: 'Beaverton School District 48J', browseGeoId: '4101920', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
  { label: 'Hillsboro School District 1J', browseGeoId: '4100023', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
  { label: 'Tigard-Tualatin School District 23J', browseGeoId: '4112240', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
  { label: 'Forest Grove School District 15', browseGeoId: '4105160', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
  { label: 'Sherwood School District 88J', browseGeoId: '4111290', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
];
```
Line 275 (`...COVERAGE_SCHOOL_DISTRICTS.map((d) => ({ ...d, kind: 'school district', stateAbbrev: d.browseStateAbbrev }))`) already feeds `ALL_COVERAGE_AREAS` — no other file needs editing.

---

## Shared Patterns

### Idempotent guard convention (applies to every INSERT in both migrations)
**Source:** 1203/1205 (governments/chambers/districts/politician_images: `WHERE NOT EXISTS`; politicians: `ON CONFLICT (external_id) DO NOTHING`).
**Apply to:** every INSERT in 1206 and 1207 — no migration in this phase should ever be able to double-insert on a re-run.

### WR-01 fix: politician-id resolution via `pol` union CTE (NOT a raw `ins_p` CROSS JOIN)
**Source:** 183-REVIEW.md WR-01 fix SQL, applied above.
**Apply to:** all 15 politician+office CTEs in 1206. This is the single highest-value fix this phase must bake in from authoring — it is what makes every block genuinely self-healing on a re-run.

### WR-02 fix: `chamber_id IS NOT NULL` gate in the structural post-verify DO block
**Source:** 183-REVIEW.md WR-02 fix SQL, applied above.
**Apply to:** 1206's Step-6 (or equivalent) post-verify DO block only (1207 is audit-only, no in-migration DO gate needed beyond its own uuid-embed check).

### WR-03 fix: headshot INSERT resolves via `FROM politicians p WHERE p.external_id = ...` (never a scalar-subquery-in-SELECT-list that can silently become NULL)
**Source:** 183-REVIEW.md WR-03 fix SQL, applied above.
**Apply to:** all 14-15 politician_images INSERTs in 1207.

### IN-01 fix: `.env` parser strips quotes + `export ` prefix
**Source:** 183-REVIEW.md IN-01 fix, applied above.
**Apply to:** `_tmp-westmetro-school-wave2-headshots.py`'s env-load block.

### IN-03 fix: probe comments name the real migration numbers; ext_id ranges get margin on both bounds
**Source:** 183-REVIEW.md IN-03 fix, applied above.
**Apply to:** `_tmp-westmetro-school-wave2-probe.sql` Probes D and E.

### Casing convention (the #1 silent-failure pitfall)
**Source:** 1203 header comments, consistent usage throughout.
**Apply to:** `districts.state` = lowercase (`'or'`); `governments.state` and `offices.representing_state` = uppercase (`'OR'`).

### Crop-4:5-then-resize-600x750-Lanczos-q90 pipeline
**Source:** `_tmp-westmetro-school-wave1-headshots.py` `crop_to_4_5`/`resize_600x750`/`process_headshot_bytes` (lines 312-435); mirrors `[[feedback_headshot_resize_no_distort]]` and `[[feedback_headshot_circle_cutout_sources]]`.
**Apply to:** all headshots this wave. Note the crop step is a genuine, exercised (non-no-op) branch for Matt Kaufman's near-square Sherwood source — unlike Wave 1 where it was a no-op for all 14 sources.

### Untransformed-original / transform-trap avoidance (finalsite AND the new WordPress-fly-images variant)
**Source:** `_tmp-westmetro-school-wave1-headshots.py` header sourcing note (finalsite `t_image_size_6` trap) + RESEARCH.md Pattern 4 (Sherwood `fly-images` trap, same class).
**Apply to:** TTSD sourcing (finalsite untransformed originals) AND Sherwood sourcing (WP REST API `media_details.sizes.large`, never the on-page `fly-images` URL).

### Antipartisan / party=NULL
**Source:** 1203 header comment + every politician INSERT.
**Apply to:** all 15 politician INSERTs in 1206.

### Genuine-gap documentation, never fabrication (D-R5)
**Source:** 1205 header lines 44-49 (Wave-1's empty gap-list, kept as a template) + this wave's actual Linda Harrington placeholder finding.
**Apply to:** the FGSD Position 4 block in 1207 — omit or clearly annotate rather than shipping the "Coming Soon" PNG.

---

## No Analog Found

None. Every file this phase touches has an exact, one-phase-old analog (1203/1205/wave1-headshots.py/wave1-probe.sql/coverage.js's own current state). The only genuinely new sub-pattern (Sherwood's WP REST API original-recovery) is fully specified in RESEARCH.md Pattern 4 and has no prior codebase analog — treat that helper function as net-new code following the surrounding script's existing conventions (descriptive UA, explicit status checks, no bare `assert`).

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/`, `C:/EV-Accounts/backend/scripts/`, `src/lib/coverage.js`, `.planning/phases/183-school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j/`
**Files scanned:** `1203_or_westmetro_school_boards_wave1.sql` (full), `1205_or_westmetro_school_boards_wave1_headshots.sql` (full), `_tmp-westmetro-school-wave1-headshots.py` (full), `_tmp-westmetro-school-wave1-probe.sql` (full), `183-REVIEW.md` (full, WR-01/WR-02/WR-03 + IN-01..04), `183-PATTERNS.md` (full), `src/lib/coverage.js` (COVERAGE_SCHOOL_DISTRICTS block + ALL_COVERAGE_AREAS consumer)
**Pattern extraction date:** 2026-07-04
