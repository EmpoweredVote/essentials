---
phase: 73-or-government-db
reviewed: 2026-05-28T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 73: Code Review Report

**Reviewed:** 2026-05-28
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Migration 222 seeds 7 chamber rows under the pre-existing State of Oregon government row using `WHERE NOT EXISTS` idempotency guards and the CA short-name naming convention. The structure is correct — no slug column, no governments INSERT, all 7 chambers accounted for, correct BEGIN/COMMIT transaction wrapper.

The summary confirms the migration applied cleanly and the idempotency re-run passed. However, the SQL contains one structural defect that can cause silent data corruption (NULL government_id insertion) if the pre-flight assumption about the governments row is ever wrong, plus two fragility issues around the name-only subquery.

---

## Critical Issues

### CR-01: Government row subquery returns NULL silently — WHERE NOT EXISTS passes and inserts NULL government_id

**File:** `C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql:41-50` (and all 7 INSERT blocks)

**Issue:** Every chamber INSERT resolves `government_id` via the subquery `(SELECT id FROM essentials.governments WHERE name = 'State of Oregon')`. If that subquery returns NULL (because the government row doesn't exist or the name doesn't match exactly), the INSERT's `WHERE NOT EXISTS` guard evaluates the inner query as `WHERE government_id = NULL`. In SQL, `= NULL` is never true — so `WHERE NOT EXISTS (SELECT 1 ... WHERE government_id = NULL)` always returns TRUE, and the INSERT proceeds, writing `government_id = NULL` for all 7 chamber rows. The migration exits 0 with no error, but the data is silently corrupt.

This is not a theoretical risk: the CONTEXT.md (D-05) records that the planned migration number was wrong (221 vs 222) because a prior migration landed unexpectedly. A similar assumption mismatch about the government row name could produce this failure. The Task 2 pre-flight step (Step 1) catches it operationally, but the SQL itself is not safe.

**Fix:** Add a pre-flight assertion inside the transaction that raises if the government row is absent or ambiguous:

```sql
BEGIN;

-- Pre-flight: assert State of Oregon government row exists (exactly 1 row)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'State of Oregon' AND state = 'OR') <> 1 THEN
    RAISE EXCEPTION
      'Pre-flight failed: expected exactly 1 State of Oregon government row; '
      'found %',
      (SELECT COUNT(*) FROM essentials.governments
       WHERE name = 'State of Oregon' AND state = 'OR');
  END IF;
END $$;

-- Governor chamber
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
...
```

This causes the transaction to roll back immediately with a clear error message rather than silently inserting rows with NULL government_id. Analogous pattern to the CONTEXT.md T-73-03 mitigation — the plan identified this risk but left it to the operator rather than encoding it in SQL.

---

## Warnings

### WR-01: Government name subquery lacks state disambiguator — fragile if name is not unique

**File:** `C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql:45,49,57,61,69,73,81,85,93,97,105,109,117,121` (all 14 subquery occurrences)

**Issue:** Every subquery resolves the government row as `WHERE name = 'State of Oregon'` with no additional filter. The migration header comment correctly notes that `essentials.governments` has no unique constraint on `geo_id`, but it omits whether `name` is unique. Migration 174 (which seeded the row) also guards only by `name = 'State of Oregon'`. If a duplicate government row is ever introduced under the same name (e.g., by a botched re-seed), the correlated subquery used as a scalar expression will throw:

> `ERROR: more than one row returned by a subquery used as an expression`

This crashes the migration mid-transaction. The San Jose analog (migration 217) avoids this by scoping the subquery to `WHERE name = 'City of San Jose' AND state = 'CA'` — both the INSERT and the NOT EXISTS guard use the two-column filter. This migration should do the same.

**Fix:** Add `AND state = 'OR'` to every government name subquery:

```sql
(SELECT id FROM essentials.governments WHERE name = 'State of Oregon' AND state = 'OR')
```

Apply to all 14 occurrences (7 INSERT values + 7 WHERE NOT EXISTS guards).

---

### WR-02: `name_formal` for Oregon Senate and Oregon House of Representatives is identical to `name` — no state qualification added

**File:** `C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql:55-56` and `67-68`

**Issue:** The Oregon Senate chamber has `name='Oregon Senate'` and `name_formal='Oregon Senate'` — identical values. The Oregon House of Representatives has the same pattern: `name_formal='Oregon House of Representatives'`. Every other chamber in this migration (Governor, AG, SoS, Treasurer, Labor Commissioner) provides a distinct `name_formal` that adds state context (e.g., `name='Governor'`, `name_formal='Governor of Oregon'`). The legislative chambers deviate from this convention without explanation.

This is not a runtime error — the values are valid. However, the CA analog (migration 189) follows the same pattern for legislative chambers (California Senate / California Assembly both use identical name/name_formal), as does the ME analog (migration 168: 'Maine Senate' / 'Maine Senate'). So this is the established convention for bicameral legislative chambers where the full name already carries state context.

The inconsistency is minor but worth noting: the comment block says "Naming convention: Short names for the `name` column... with state-qualified forms in name_formal" (line 23-24), which implies `name_formal` should always be distinct and state-qualified. The legislative chambers violate the stated convention even if they match the actual pattern from prior migrations.

**Fix:** Either update the header comment to note that legislative chamber names are self-qualifying (name already includes state, so name_formal matches), or align to be fully explicit:

```sql
-- Oregon Senate: name already includes state — name_formal matches (convention per migration 168, 189)
'Oregon Senate',
'Oregon State Senate',   -- OR: keep identical; document the exception
```

If no change to the data, update the comment at line 23-24 to say: "Exception: bicameral legislative chambers whose name already contains the state abbreviation carry identical name/name_formal values — see ME (168) and CA (189) precedent."

---

## Info

### IN-01: Migration number discrepancy documented in header but not corrected in CONTEXT.md reference

**File:** `C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql:30-33`

**Issue:** The header comment correctly explains why 222 was used instead of 221, citing that `221_sj_stances.sql` landed before Phase 73. This is informational and accurate. However, the comment says "CONTEXT.md listed 221 as next" — downstream reviewers should know that the CONTEXT.md was not updated with this correction; the authoritative record is in the SUMMARY. No action needed in the migration file itself, but the discrepancy between CONTEXT.md D-05 and the actual applied number may confuse future readers of the context file.

**Fix:** No change required to the migration file. Optionally update `.planning/phases/73-or-government-db/73-CONTEXT.md` line at D-05 to append: "(actual: 222 — 221_sj_stances.sql landed first; see 73-01-SUMMARY.md)". The SUMMARY already captures this accurately.

---

_Reviewed: 2026-05-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
