---
phase: 13-tier-1-officials-plano-mckinney
plan: "02"
subsystem: database
tags: [postgres, supabase, migrations, sql, tx, local-government, seed-data]

# Dependency graph
requires:
  - phase: 12-tx-db-foundation
    provides: McKinney government + chamber + 7 offices (migration 088, geo_id='4845744')
provides:
  - McKinney Mayor + 6 council member politician rows with office_id FK links
  - essentials.offices.politician_id back-links for all 7 McKinney seats
  - Bio URL contact data for all 7 McKinney incumbents (email NULL — CloudFlare protected)
affects:
  - Phase 14+ (race seeding — politician rows are FK targets for race candidates)
  - Phase 16 (Discovery Jurisdiction Setup — incumbents now visible in jurisdiction context)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "email_addresses = NULL acceptable when CloudFlare blocks scraping — bio URL (urls[]) satisfies 80% contact target"
    - "psql direct connection as fallback when supabase db query --linked CLI not available (v2.75.0 limitation)"
    - "At-Large office title in migration 088 is 'Council Member At-Large Place N' (not 'Council Member At-Large N') — use exact DB title in WHERE clauses"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/092_mckinney_politicians.sql
    - .planning/phases/13-tier-1-officials-plano-mckinney/staging/mckinney-politicians.md
  modified: []

key-decisions:
  - "email_addresses = NULL for all McKinney rows — CloudFlare email protection on mckinneytexas.org; no verified official addresses available from public sources; bio URL satisfies the 80% contact threshold"
  - "Geré Feltus: é accent preserved in UTF-8 throughout DB and migration file — official name form per city website; f_unaccent() handles accent-insensitive search"
  - "At-Large office title mismatch corrected: migration 088 DB titles are 'Council Member At-Large Place 1/2', not 'Council Member At-Large 1/2' as the staging file stated — migration used DB-accurate titles"
  - "psql (PostgreSQL 18 local install) used as migration tool — supabase CLI v2.75.0 does not support 'db query' subcommand"

patterns-established:
  - "Always verify DB office titles with a SELECT before writing politician migration — staging file titles may diverge from what was actually inserted in the offices migration"
  - "supabase CLI v2.75.0 has no 'db query' command — use psql with DATABASE_URL from backend/.env"

# Metrics
duration: ~35min
completed: 2026-05-01
---

# Phase 13 Plan 02: McKinney Politicians Summary

**7 McKinney incumbent politicians seeded into essentials.politicians with office_id + offices.politician_id back-links, 100% bio URL coverage, 0% email (CloudFlare protected), Geré Feltus é accent preserved**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-05-01
- **Completed:** 2026-05-01
- **Tasks:** 3 (Task 1: staging, Task 2: human verify, Task 3: migration)
- **Files modified:** 2 created

## Accomplishments

- Staging file written and approved: 7 McKinney incumbent rows with citation URLs, term dates, bio URLs
- Migration 092 written, applied, and committed to EV-Accounts git (e2bc035)
- All 7 McKinney politicians in essentials.politicians: is_active=true, is_incumbent=true, is_vacant=false, is_appointed=false, party=NULL
- All 7 have office_id linked to valid essentials.offices rows from migration 088
- All 7 McKinney essentials.offices rows have politician_id back-link populated
- Bio URL (urls[]) populated for all 7 rows (100% coverage)
- email_addresses = NULL for all 7 rows (expected — CloudFlare email protection)
- data_source = 'mckinneytexas.org' on all 7 rows
- Geré Feltus é accent confirmed preserved in DB (SELECT full_name WHERE last_name = 'Feltus' returned 'Geré Feltus')

## Task Commits

1. **Task 1: Write McKinney staging file** — `d26b082` (chore — essentials repo)
2. **Task 2: Human verify** — no commit (checkpoint)
3. **Task 3: Apply migration 092** — `e2bc035` (feat — EV-Accounts repo)

**Plan metadata:** (this commit — docs)

## Contact Coverage Stats

| Metric | Count | % |
|---|---|---|
| Total politicians | 7 | 100% |
| email_addresses populated | 0 | 0% (expected — CloudFlare) |
| urls[] populated | 7 | 100% |
| Contact coverage (bio OR email) | 7 | 100% |

Phase target is 80% contact coverage via any channel. Bio URL satisfies this threshold where email is unavailable.

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/092_mckinney_politicians.sql` — 7 DO $$ blocks (one per incumbent), BEGIN/COMMIT wrapper, RAISE EXCEPTION guard on NULL office lookup, RAISE NOTICE per insert
- `.planning/phases/13-tier-1-officials-plano-mckinney/staging/mckinney-politicians.md` — Human-reviewed roster with citation URLs, term dates, verification notes

## Decisions Made

- email_addresses = NULL for all McKinney rows. CloudFlare obfuscates emails on the official council page. A low-confidence guessed format (e.g., `{first_initial}{last_name}@mckinneytexas.org`) was identified via RocketReach analysis but not verifiable from official sources. Per CONTEXT.md: no guessing. NULL is correct.
- Geré Feltus: the é accent is the official name form per mckinneytexas.org. Preserved in UTF-8 in both the staging file and migration SQL. The DB's f_unaccent() function ensures accent-insensitive search still finds this record.
- Bio URL satisfies contact threshold: per the phase CONTEXT.md, 80% contact coverage is the minimum. All 7 bio URLs are anchor links on https://www.mckinneytexas.org/1167/Council-Members (e.g., #Mayor, #AtLarge1) — these constitute valid contact/profile data and satisfy the 80% target.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Office title mismatch: At-Large offices in DB use "Place N" suffix**

- **Found during:** Task 3 (verifying McKinney offices before writing migration)
- **Issue:** The staging file and plan used office titles "Council Member At-Large 1" and "Council Member At-Large 2". The actual DB titles from migration 088 are "Council Member At-Large Place 1" and "Council Member At-Large Place 2". Using the staging-file titles in the WHERE clause would return NULL → RAISE EXCEPTION.
- **Fix:** Used the exact DB titles in the migration's WHERE clauses: `o.title = 'Council Member At-Large Place 1'` and `o.title = 'Council Member At-Large Place 2'`. Also documented in migration header comment.
- **Files modified:** `C:/EV-Accounts/backend/migrations/092_mckinney_politicians.sql`
- **Verification:** Migration applied cleanly; both at-large politicians inserted with correct office_id FKs; verification SELECT showed `has_office_id_on_politician = t` and `has_politician_id_on_office = t` for both at-large rows
- **Committed in:** e2bc035 (Task 3 migration commit)

**2. [Rule 3 - Blocking] supabase CLI v2.75.0 has no 'db query' subcommand — switched to psql**

- **Found during:** Task 3 (attempting to apply migration via `supabase db query --linked`)
- **Issue:** `supabase db query --linked` returned "unknown flag: --linked" — this subcommand does not exist in v2.75.0. The 12-04-SUMMARY referenced it as the preferred method, but either the CLI was different then or the command was tested differently.
- **Fix:** Applied migration using `psql "$DATABASE_URL" -f backend/migrations/092_mckinney_politicians.sql` with DATABASE_URL from `/c/EV-Accounts/backend/.env`. psql (PostgreSQL 18) is installed locally and connected successfully to Supabase pooler.
- **Files modified:** None (execution method change only)
- **Verification:** psql returned NOTICE for each of the 7 politicians and COMMIT; post-apply SELECT confirmed 7 rows
- **Committed in:** e2bc035 (no separate commit; part of migration task)

---

**Total deviations:** 2 auto-fixed (1 bug — office title mismatch, 1 blocking — CLI method)
**Impact on plan:** Both fixes necessary for correct operation. No scope changes. Office titles now documented in SUMMARY for future plans.

## Issues Encountered

- Supabase CLI v2.75.0 does not have `db query` command (the summaries from Phase 12 reference it but it may have worked differently in that session, or the CLI version differed). Used psql with DATABASE_URL from backend/.env as fallback. Pooler connection succeeded without max-client errors this time.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 7 McKinney incumbent politician rows are in essentials.politicians with full FK linkage
- McKinney is ready for Phase 14 (race seeding — politician_id available as incumbent reference)
- Pattern documented: always query DB office titles before writing politician migration — staging titles may not exactly match what was inserted in the offices migration
- Key limitation: McKinney emails remain NULL (CloudFlare). If email addresses are needed, the path is either: (a) verify via an official gov document or direct contact, or (b) wait for CloudFlare protection to be lifted

---
*Phase: 13-tier-1-officials-plano-mckinney*
*Completed: 2026-05-01*
