---
phase: 192-arizona-legislature-seed-headshots
reviewed: 2026-07-09T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - C:/EV-Accounts/backend/migrations/1286_az_legislature.sql
  - C:/EV-Accounts/backend/migrations/1287_az_legislature_headshots.sql
  - C:/EV-Accounts/backend/scripts/_tmp-az-legislature-headshots.py
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: clean
---

# Phase 192: Code Review Report

**Reviewed:** 2026-07-09
**Depth:** standard
**Files Reviewed:** 3
**Status:** clean

## Summary

These three files were already applied to production and independently audited (192-01/02/03
SUMMARY.md all show 30 Senate + 60 House offices, exactly 2 reps/district, 90/90 headshots at
600x750, 0/90 section-split violations, ledger state correct, and a human-verified live browse
check). I traced the full 1286/1287 SQL byte-for-byte (all 2949 + 1019 lines) and the Python
pipeline logic looking for latent defects that the applied-and-passing state could still be hiding
(e.g. a bug that happens to be masked by data that was already clean, or one guarded against only
by the post-verify rollback rather than by correct logic).

Verified clean, no defects found:
- House 2-per-district guard correctly keys on `(district_id, politician_id)` in all 60 House
  blocks; Senate 1-per-district guard correctly keys on `(district_id, chamber_id)` in all 30
  Senate blocks — no guard-divergence bug.
- `d.state = 'az'` (lowercase) is present and correct in every one of the 92 office↔district WHERE
  clauses (30 Senate + 60 House + 2 post-verify assertions) — no casing typo.
- `district_type` (`STATE_UPPER`/`STATE_LOWER`) is present in every WHERE — no cross-linking
  between SLDU/SLDL sharing the same geo_id space.
- All 90 `external_id` literals in 1286 are unique and exactly cover -4005001..-4005030 and
  -4006001..-4006060 with no gaps or duplicates (grep-verified against the full sequence).
- 1287's 90 `politician_id` UUIDs match 1-for-1 against the Python `ROSTER` UUIDs I spot-checked
  (Sears, Reim, Allen, Peña, Márquez, Gabaldón, Luna-Nájera) — no transcription drift between the
  script's manifest and the audit migration.
- No SQL injection surface (both migrations are 100% static hand-authored SQL with no external
  input interpolation; the Python script's only DB query is parameterized `external_id = %s`).
- No hardcoded secrets (Supabase URL/service key/DB URL are read only from gitignored `.env`).
- `PIL.Image.convert('RGB')` + re-encode with `optimize=True` on every remote-fetched image
  correctly strips EXIF/embedded payloads before upload, per the T-192-03 threat mitigation.
- `crop_to_4_5`'s two branches are mathematically correct (center-crop width when wider than 4:5,
  top-crop height when taller/narrower), verified against the Sears 452x632 exception case by hand.

The findings below are latent maintainability/robustness concerns, not correctness defects — none
rise to Critical, and the Warnings should be read as "worth fixing if this pattern is reused again,"
not "this migration is broken."

## Warnings

### WR-01: Section-split detector (Assertion 6) keys on `full_name`, not politician id

**File:** `C:/EV-Accounts/backend/migrations/1286_az_legislature.sql:2920-2935`
**Issue:** The post-verify "no politician split across two governments" gate groups by
`p.full_name` and flags `count(DISTINCT ch.government_id) > 1`. This is the established
project-wide split-section pattern (see prior phases' `feedback_section_split_check.md`), but
keying on the display name rather than `p.id` means two distinct real legislators who happen to
share an exact full name would produce a false-positive rollback of the entire structural
migration (transaction abort on `RAISE EXCEPTION`), and conversely a genuine data-duplication bug
that coincidentally lands under slightly different-cased/spaced names would go undetected. For a
90-person roster the collision risk is low, but the check is inherited technical debt that will
keep getting copy-pasted into every future legislature-seed migration.
**Fix:** If a future revision of this pattern is needed, prefer grouping by a per-run identity key
that is stable across duplicate-detection (e.g., `external_id` blocks or a synthetic composite of
`first_name||last_name||dob` if available) rather than `full_name` alone, or at minimum add a
secondary assertion that counts `DISTINCT p.id` per `full_name` to distinguish "two real people,
same name" from "one person duplicated."

### WR-02: 90x near-identical hand-authored INSERT blocks — no reduction to a data-driven bulk insert

**File:** `C:/EV-Accounts/backend/migrations/1286_az_legislature.sql:111-2822`
**Issue:** All 90 politician+office pairs are authored as 90 separate `WITH ins_p AS (INSERT
... RETURNING id) INSERT INTO offices SELECT ...` blocks (~2700 of the file's 2949 lines). This is
consistent with prior state-legislature migrations in this codebase, but the sheer duplication is a
standing risk for future transcription errors (wrong external_id, mismatched name/party/district)
that would only be caught by the post-verify counts-and-links gate rather than by construction. In
this instance the post-verify gate caught nothing wrong (grep-verified: all 90 external_ids unique
and sequential, all party/title/state literals consistent), so no defect shipped — but the
maintainability cost of a 2900-line migration built from copy-paste blocks is real for the next
person who has to patch a single legislator (e.g., after a future resignation).
**Fix:** For future legislature-seed migrations, consider a single `VALUES (...), (...), ...` bulk
politician insert (a literal 90-row VALUES list) joined against a small per-district office-shape
table, cutting the file to a few hundred lines and making row-level diffs actually reviewable.

### WR-03: `.env` parsing in the pipeline script is a hand-rolled naive line-splitter

**File:** `C:/EV-Accounts/backend/scripts/_tmp-az-legislature-headshots.py:206-213`
**Issue:**
```python
with open(_env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            _env[k.strip()] = v.strip()
```
This does not strip surrounding quotes (`KEY="value"` would keep the literal quote characters in
the value), does not handle inline comments after a value (`KEY=value # comment`), and does not
handle `export KEY=value` syntax. This matches the pre-existing `_tmp-az-state-exec-headshots.py`
convention verbatim (per the file's own comment), so it isn't a regression introduced by this
phase, but it is a latent robustness gap that would silently corrupt `SUPABASE_URL`/
`SUPABASE_SERVICE_ROLE_KEY`/`DATABASE_URL` if the `.env` file's format ever drifts (e.g., a
teammate adds a quoted value or trailing comment for readability).
**Fix:** Use `python-dotenv`'s `load_dotenv()` (already a common dependency in this ecosystem) or
at minimum strip matching leading/trailing quotes from `v` before storing.

## Info

### IN-01: Two different casing conventions for "state" coexist in the same file

**File:** `C:/EV-Accounts/backend/migrations/1286_az_legislature.sql:130` (and all 90 office
INSERTs)
**Issue:** `essentials.districts.state` is lowercase `'az'` while `essentials.offices
.representing_state` is uppercase `'AZ'` in the very same INSERT statement. This is intentional and
already flagged prominently in the file's header comment (line 19-20), so this is not a hidden
trap for THIS file's own maintainers — but it's worth recording explicitly here since a reviewer
skimming only the INSERT bodies (without the header) could easily "fix" one to match the other and
break the district join.
**Fix:** No action needed beyond what's already documented; flagging for visibility only.

### IN-02: `psycopg2.connect()` has no surrounding try/except

**File:** `C:/EV-Accounts/backend/scripts/_tmp-az-legislature-headshots.py:429`
**Issue:** If `DATABASE_URL` is malformed or the DB is unreachable, `psycopg2.connect(db_url)` raises
an unhandled exception and the script exits with a raw traceback rather than the same
clean `print(...); sys.exit(1)` pattern used for the three env-var presence checks a few lines
above. Low-severity since this is an orchestrator-run, gitignored, throwaway script and a traceback
is still an unambiguous failure signal — but it's an inconsistency with the rest of the file's
error-handling style.
**Fix:**
```python
try:
    conn = psycopg2.connect(db_url)
except Exception as e:
    print(f'ERROR: could not connect to database: {e}')
    sys.exit(1)
```

### IN-03: Audit migration's idempotency guard checks "any image exists", not "this exact image"

**File:** `C:/EV-Accounts/backend/migrations/1287_az_legislature_headshots.sql:32-35` (pattern
repeated 90x)
**Issue:** `WHERE NOT EXISTS (SELECT 1 FROM politician_images WHERE politician_id = ...)` skips the
INSERT if *any* image row already exists for that politician, not specifically the one this
migration would insert. That's correct and intentional for a greenfield re-run, but it means this
migration file can never be re-applied to fix a wrong or corrupted URL that already made it into
the table — a future fix would require an explicit `DELETE` or `UPDATE` migration rather than
re-running this one. Not a defect in the current apply (table was empty for these 90 politicians
before this ran), just a design limitation worth knowing about for the next photo-refresh pass.
**Fix:** No action needed for this migration; note the limitation if this file is ever used as a
template for a "refresh existing headshots" migration.

---

_Reviewed: 2026-07-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
