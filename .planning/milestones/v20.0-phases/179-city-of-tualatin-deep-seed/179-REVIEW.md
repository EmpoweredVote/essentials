---
phase: 179-city-of-tualatin-deep-seed
reviewed: 2026-07-02T21:35:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - C:/EV-Accounts/backend/scripts/_tmp-tualatin-wave0-probe.sql
  - C:/EV-Accounts/backend/scripts/_tmp-tualatin-headshots.py
  - C:/EV-Accounts/backend/migrations/1169_tualatin_city_council.sql
  - C:/EV-Accounts/backend/migrations/1170_tualatin_headshots.sql
  - C:/EV-Accounts/backend/migrations/1171_bubenik_stances.sql
  - C:/EV-Accounts/backend/migrations/1172_reyes_stances.sql
  - C:/EV-Accounts/backend/migrations/1173_sacco_stances.sql
  - C:/EV-Accounts/backend/migrations/1174_brooks_stances.sql
  - C:/EV-Accounts/backend/migrations/1175_hillier_stances.sql
  - C:/EV-Accounts/backend/migrations/1176_gonzalez_stances.sql
  - C:/EV-Accounts/backend/migrations/1177_pratt_stances.sql
  - C:/Transparent Motivations/essentials/src/lib/coverage.js
  - C:/Transparent Motivations/essentials/src/lib/buildingImages.js
findings:
  critical: 0
  warning: 2
  info: 5
  total: 7
status: issues_found
---

# Phase 179: Code Review Report

**Reviewed:** 2026-07-02T21:35:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Reviewed all 13 Phase 179 (City of Tualatin deep-seed) artifacts: the Wave-0
verification probe, the headshot pipeline script, structural migration 1169,
audit migrations 1170-1177, and the two frontend surfacing edits. All
domain-context invariants were verified mechanically, not by eye:

- **geo_id correctness:** `'4174950'` is the only operative geo_id in every
  file. The WRONG value `4175200` appears exactly 4 times, all inside the
  Wave-0 probe's A1 correction check and its comments — repo-wide grep of
  `migrations/` + `scripts/` confirms it appears nowhere else.
- **Casing:** `districts.state = 'or'` (lowercase) in both district INSERTs
  and every district-filter predicate; `governments.state = 'OR'` and
  `offices.representing_state = 'OR'` (uppercase) throughout 1169.
- **Ledger discipline:** 1169 registers version `'1169'`
  (`ON CONFLICT DO NOTHING`); a scripted scan confirms none of 1170-1177
  touches `supabase_migrations.schema_migrations`.
- **Stance parity (scripted diff, all 7 files):** the `politician_answers`
  and `politician_context` VALUES blocks are byte-identical in every file;
  row counts (10/6/8/9/10/7/9) match both the header comments and both
  triple-gate expected counts; no duplicate topic_keys; no `judicial-*`
  topic_keys; all values within 1-5; every row carries reasoning plus a
  non-empty `sources` array (no `ARRAY[]` anywhere).
- **UUID/external_id identity:** all 7 hardcoded politician UUIDs match the
  expected mapping (Bubenik -4174951 ... Pratt -4174957) consistently across
  the stance files AND migration 1170's CDN URLs, and each stance file's
  WR-01 identity gate cross-checks the UUID against the right external_id
  at apply time.
- **Migration numbering:** 1169-1177 have unique on-disk prefixes;
  1168 is the prior max, matching the Probe-E doctrine.
- **Frontend edits (commit be1816d):** purely additive (3 insertions,
  0 deletions); Tualatin slots alphabetically between Troutdale and Wood
  Village with geo 4174950 and `hasContext: true`; `CURATED_LOCAL.tualatin`
  points at `cities/tualatin.jpg` with CC BY-SA 3.0 attribution comment; no
  raw Windows backslash paths in either file (a `\` seen at
  buildingImages.js:105 during grep was a rendering artifact — the file
  content is a proper `//` comment).
- **Security:** the Python script uses parameterized SQL for the UUID lookup,
  loads all credentials from `.env` (no hardcoded secrets), enforces TLS
  (`verify=True`, `sslmode=require`), and re-encodes images (EXIF/stego strip).

No Critical findings. Two Warnings (latent robustness defects in files, not
failures that occurred — these migrations already applied cleanly to
production) and five Info items.

## Warnings

### WR-01: Headshot script exits 0 even when uploads fail — no machine-readable failure signal

**File:** `C:/EV-Accounts/backend/scripts/_tmp-tualatin-headshots.py:410-465`
**Issue:** The file's own doctrine (lines 44-45, 328, 386) is "if any of the 7
unexpectedly 404s at run-time, STOP." But `main()` never enforces that stop:
`process_member` failures only accumulate into `results`, the final block
prints a WARNING line when `len(successes) != 7`, and the process still exits
with status 0. Similarly, `test_download_guard(OFFICIALS[0])` (line 427)
returns a boolean that is discarded — a failed guard does not halt the run.
Any shell chaining (`python _tmp-tualatin-headshots.py && psql -f
1170_tualatin_headshots.sql`) would proceed to apply 1170 after a partial
upload, recording CDN URLs whose objects were never PUT — and 1170's
post-verification gate cannot catch that, because it only checks that the URL
string embeds the politician's UUID, not that the object exists. The manifest
cross-check is a purely manual control. (This run happened to be 7/7, so the
defect is latent, not realized.)
**Fix:**
```python
    print('=== END MANIFEST ===')
    if failures:
        sys.exit(1)  # hard-fail so automation cannot chain into migration 1170
```
and optionally honor the guard: `if not test_download_guard(OFFICIALS[0]): sys.exit(1)`.

### WR-02: 1169 `ON CONFLICT (external_id) DO UPDATE` can silently seat a colliding pre-existing politician, and the post-verification gates cannot detect that case

**File:** `C:/EV-Accounts/backend/migrations/1169_tualatin_city_council.sql:108-110` (repeated in Steps 5-11), gates at `409-418`
**Issue:** Each politician INSERT uses `ON CONFLICT (external_id) DO UPDATE
SET is_active = EXCLUDED.is_active ... RETURNING id`. If any external_id in
-4174951..-4174957 had already belonged to a *different person*, the CTE would
return the existing row's id and attach a Tualatin office to the wrong human —
with no name check. Critically, the in-file gates would all pass in that
scenario: gate (b) still counts 7 offices; gate (e) checks `office_id IS
NULL`, and a colliding politician with a pre-existing office_id sails through;
gate (f) counts offices, not identities. The only defense is the out-of-band
Wave-0 Probe D collision scan — which ran and returned 0 rows, so the risk did
not materialize, but the migration file itself is not self-protecting the way
its stance-file siblings are (they added a WR-01 identity gate for exactly
this class of silent misattribution).
**Fix:** Add an identity assertion to the post-verification DO block, e.g.:
```sql
  -- Identity gate: each ext_id must map to the intended full_name
  IF EXISTS (
    SELECT 1 FROM essentials.politicians
    WHERE (external_id, full_name) NOT IN (
      (-4174951,'Frank Bubenik'),(-4174952,'María Reyes'),(-4174953,'Christen Sacco'),
      (-4174954,'Bridget Brooks'),(-4174955,'Cyndy Hillier'),(-4174956,'Octavio Gonzalez'),
      (-4174957,'Valerie Pratt'))
      AND external_id BETWEEN -4174957 AND -4174951
  ) THEN
    RAISE EXCEPTION 'ext_id collision: an external_id in the Tualatin block maps to an unexpected name';
  END IF;
```
Carry this into the template for future city seeds (Ph180+).

## Info

### IN-01: Inconsistent source-URL paths for the same articles in 1177 (Pratt)

**File:** `C:/EV-Accounts/backend/migrations/1177_pratt_stances.sql:14` (and duplicate at 31); `:11` (and 28)
**Issue:** The transportation-priorities row cites
`https://tualatinlife.com/local-news/state-of-the-city-tualatin-is-going-full-steam-ahead/`,
while 1171/1174/1175 cite the same article under `/featured/`. Likewise the
homelessness rows cite
`https://tualatinoregon.gov/administration/homelessness/camping-regulations/`
where every other file uses
`https://www.tualatinoregon.gov/administration/camping-regulations`. One of
each pair is likely a 404 or redirect; citation links surface to end users.
**Fix:** Normalize both to the verified-canonical paths used by the sibling
files (follow-up UPDATE on `inform.politician_context.sources` since the
migration already applied).

### IN-02: Fragile hand-rolled `.env` parser in headshot script

**File:** `C:/EV-Accounts/backend/scripts/_tmp-tualatin-headshots.py:149-160, 430-432`
**Issue:** `open(_env_path)` uses the platform-default encoding (cp1252 on
this Windows host — a UTF-8 BOM or non-ASCII char in `.env` would corrupt the
first key); quoted values (`KEY="value"`) are not unquoted, which would make
the `SUPABASE_URL.startswith('https://')` assert fail confusingly; and the
`if 'sslmode' not in db_url` check is a substring test that a password or
comment containing "sslmode" would defeat.
**Fix:** `open(_env_path, encoding='utf-8')`, strip surrounding quotes from
`v`, and check `'sslmode=' not in db_url` (or parse the URL query properly).

### IN-03: Stance-gate counts are politician-total, not migration-scoped

**File:** `C:/EV-Accounts/backend/migrations/1171_bubenik_stances.sql:54-64` (same pattern in 1172-1177)
**Issue:** `SELECT COUNT(*) ... WHERE politician_id = <uuid>` asserts the
politician's *total* answer/context row count equals this file's row count.
Exact for the greenfield first apply (politicians minted in 1169), but any
legitimate future re-apply after additional stances are seeded elsewhere will
raise a false-positive exception and roll back. Acceptable for audit-only
files, but worth knowing before ever re-running one.
**Fix:** None required now; if re-apply support is ever needed, count `FROM s
JOIN inform.compass_topics ...` matched rows instead of politician totals.

### IN-04: office_id back-fill picks an arbitrary office if a politician ever has more than one

**File:** `C:/EV-Accounts/backend/migrations/1169_tualatin_city_council.sql:338-345`
**Issue:** `UPDATE ... FROM essentials.offices o WHERE o.politician_id = p.id`
has no district/chamber filter; with multiple matching office rows Postgres
would join-update with an unspecified winner. Harmless here (each of the 7
politicians is freshly minted with exactly one office) but latent in the
template.
**Fix:** Constrain the join:
`AND o.district_id IN (SELECT id FROM essentials.districts WHERE geo_id = '4174950')`.

### IN-05: Guard `assert` statements are stripped under `python -O`

**File:** `C:/EV-Accounts/backend/scripts/_tmp-tualatin-headshots.py:141-143, 167-169, 299`
**Issue:** The roster-shape hard-asserts (the deliberate Hillsboro-style 7/7
gate), the SUPABASE_URL sanity assert, and the post-resize size assert are all
`assert` statements, which are compiled out when the interpreter runs with
`-O`/`PYTHONOPTIMIZE`. The "hard assert" doctrine in the header silently
becomes a no-op in that mode.
**Fix:** For guards that must never be skippable, use
`if not cond: raise RuntimeError(...)` instead of `assert`.

---

_Reviewed: 2026-07-02T21:35:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
