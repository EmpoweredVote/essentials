---
phase: 73-or-government-db
fixed_at: 2026-05-28T00:00:00Z
review_path: .planning/phases/73-or-government-db/73-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 73: Code Review Fix Report

**Fixed at:** 2026-05-28
**Source review:** .planning/phases/73-or-government-db/73-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (CR-01, WR-01, WR-02 — IN-01 excluded by fix_scope=critical_warning)
- Fixed: 3
- Skipped: 0

**Note on commits:** `C:/EV-Accounts` is not a git repository. All three fixes were applied directly to the SQL file. No git commit was made for this file per project instructions (never run git in C:/EV-Accounts).

## Fixed Issues

### CR-01: Government row subquery returns NULL silently

**File modified:** `C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql`
**Commit:** n/a (file lives outside git repo)
**Applied fix:** Added a `DO $$ BEGIN ... END $$` pre-flight assertion block immediately after `BEGIN;` (lines 42-52). The block queries `essentials.governments WHERE name = 'State of Oregon' AND state = 'OR'` and calls `RAISE EXCEPTION` with the actual count if the result is not exactly 1. This causes the entire transaction to roll back with a clear error message instead of silently inserting NULL government_id values for all 7 chambers.

### WR-01: Government name subquery lacks state disambiguator

**File modified:** `C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql`
**Commit:** n/a (file lives outside git repo)
**Applied fix:** Added `AND state = 'OR'` to all 14 government name subquery occurrences — the 7 INSERT SELECT values and the 7 WHERE NOT EXISTS guard subqueries. Every subquery now reads `WHERE name = 'State of Oregon' AND state = 'OR'`, matching the San Jose analog (migration 217) two-column filter pattern.

### WR-02: `name_formal` for Oregon Senate and House identical to `name` — comment inconsistency

**File modified:** `C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql`
**Commit:** n/a (file lives outside git repo)
**Applied fix:** Updated the header comment block (lines 26-27) to document the established exception: "Exception: bicameral legislative chambers whose name already contains the state carry identical name/name_formal values — see ME (migration 168) and CA (migration 189) precedent." The data values for Oregon Senate and Oregon House of Representatives were left unchanged (identical name/name_formal) as this matches the established convention from prior migrations.

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-05-28_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
