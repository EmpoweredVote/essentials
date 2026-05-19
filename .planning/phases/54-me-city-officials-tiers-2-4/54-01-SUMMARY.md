---
phase: 54-me-city-officials-tiers-2-4
plan: 01
subsystem: database
tags: [postgres, supabase, sql-migration, maine, city-officials, incumbents]

# Dependency graph
requires:
  - phase: 53-portland-city-structure
    provides: Portland incumbent CTE pattern (migration 178); ME 23-city scaffolding (migration 177)
provides:
  - 24 Maine Tier 2 city incumbent politicians seeded (Lewiston 8, Bangor 9, South Portland 7)
  - 25 skeletal office rows populated (politician_id set, is_vacant=false)
  - Tipton dual-office pattern (one politician, two offices) proven in production
  - Bangor full email harvest (9 emails on politicians.email_addresses)
  - Lewiston partial email harvest (2 of 8 on politicians.email_addresses)
  - Migration 180 idempotent and applied to live DB
affects:
  - 54-02 (Auburn + Biddeford incumbents — same CTE pattern)
  - 54-03 (headshots for Lewiston/Bangor/South Portland officials)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dual-office politician pattern: one INSERT + two office UPDATEs (Tipton Mayor + D5)"
    - "5-digit geo_id prefix for Tier 2 external_ids (avoids Bangor/Auburn 4-digit collision)"
    - "Alphabetical-by-last-name At-Large seat assignment for cities without published ordering"
    - "Email stored on politicians.email_addresses (TEXT[] array) not offices.email (column DNE)"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/180_me_tier2_lewiston_bangor_southportland_incumbents.sql"
    - ".planning/phases/54-me-city-officials-tiers-2-4/54-01-SUMMARY.md"
  modified: []

key-decisions:
  - "emails on politicians.email_addresses (array), not offices.email — offices table has no email column"
  - "South Portland seeded 7 unique politicians (not 6 as plan artifacts incorrectly stated): Tipton + 6 others"
  - "Tipton holds Mayor + District 5 via one politician row (-237191001); -237191006 intentionally skipped"
  - "Bangor At-Large seat 1-8 assigned alphabetically by last name (Beck through Walker)"
  - "Susan Hawes is_appointed=false on politician row; is_appointed_position=true on office row (set by migration 177)"

patterns-established:
  - "Dual-office: one INSERT CTE for Mayor UPDATE + standalone UPDATE for second office"
  - "Email harvest on politicians.email_addresses as ARRAY['{addr}'] in INSERT VALUES"
  - "Back-fill BETWEEN range: BETWEEN -{high_external_id} AND -{low_external_id} (negative ints)"

# Metrics
duration: 9min
completed: 2026-05-19
---

# Phase 54 Plan 01: ME Tier 2 City Incumbents (Lewiston + Bangor + South Portland) Summary

**24 Tier 2 city politicians seeded via migration 180 across Lewiston (8), Bangor (9), South Portland (7); all 25 skeletal office rows from migration 177 now populated with is_vacant=false and politician_id set**

## Performance

- **Duration:** 9 min
- **Started:** 2026-05-19T22:08:36Z
- **Completed:** 2026-05-19T22:17:49Z
- **Tasks:** 2
- **Files created:** 2 (migration SQL + this SUMMARY)

## Accomplishments

- Applied migration 180 to live Supabase DB seeding 24 politicians across 3 Maine Tier 2 cities
- Tipton dual-office pattern working in production: one politician_id on both South Portland Mayor and District 5 office rows (verified via COUNT(o.id)=2 query)
- Full Bangor email harvest: all 9 @bangormaine.gov emails stored on politicians.email_addresses including mixed-case Susan.Faloon@bangormaine.gov
- Migration verified idempotent: second application produced 52 consecutive UPDATE 0 results
- MCITY-03 requirement advanced: 3 of 5 Tier 2 cities now have incumbents seeded (60% complete)

## Task Commits

1. **Task 1: Write migration 180 SQL** - `1c49fe6` (feat)
2. **Task 2: Apply migration 180 + verification** — (included in plan metadata commit)

**Plan metadata:** (this commit — docs: complete plan)

## Files Created

- `C:/EV-Accounts/backend/migrations/180_me_tier2_lewiston_bangor_southportland_incumbents.sql` — 24 politician INSERTs (Lewiston 8 + Bangor 9 + South Portland 7) + 25 office UPDATEs + 3 office_id back-fills, wrapped in BEGIN/COMMIT

## DB State After Migration

### Politician Count: 24 (plan said 23 — see Deviation #1)

| City | Count | External ID Range |
|------|-------|------------------|
| Lewiston | 8 | -233871001 .. -233871008 |
| Bangor | 9 | -230271001 .. -230271009 |
| South Portland | 7 | -237191001..-237191005, -237191007..-237191008 |
| **Total** | **24** | — |

### Final External ID Manifest

**Lewiston (geo_id=2338740):**
| external_id | full_name | office title | email |
|------------|-----------|-------------|-------|
| -233871001 | Carl L. Sheline | Mayor | NULL |
| -233871002 | Joshua L. Nagine | Council Member (Ward 1) | jnagine@lewistonmaine.gov |
| -233871003 | Susan G. Longchamps | Council Member (Ward 2) | NULL |
| -233871004 | Scott A. Harriman | Council Member (Ward 3) | sharriman@lewistonmaine.gov |
| -233871005 | Michael R. Roy | Council Member (Ward 4) | NULL |
| -233871006 | Chrissy Noble | Council Member (Ward 5) | NULL |
| -233871007 | David B. Chittim | Council Member (Ward 6) | NULL |
| -233871008 | Bret Martel | Council Member (Ward 7) | NULL |

**Bangor (geo_id=2302795):**
| external_id | full_name | office title | email |
|------------|-----------|-------------|-------|
| -230271001 | Susan Hawes | Mayor | susan.hawes@bangormaine.gov |
| -230271002 | Michael Beck | Council Member (At-Large 1) | michael.beck@bangormaine.gov |
| -230271003 | Daniel Carson | Council Member (At-Large 2) | daniel.carson@bangormaine.gov |
| -230271004 | Susan Deane | Council Member (At-Large 3) | susan.deane@bangormaine.gov |
| -230271005 | Susan Faloon | Council Member (At-Large 4) | Susan.Faloon@bangormaine.gov |
| -230271006 | Carolyn Fish | Council Member (At-Large 5) | carolyn.fish@bangormaine.gov |
| -230271007 | Joseph Leonard | Council Member (At-Large 6) | joseph.leonard@bangormaine.gov |
| -230271008 | Wayne Mallar | Council Member (At-Large 7) | wayne.mallar@bangormaine.gov |
| -230271009 | Angela Walker | Council Member (At-Large 8) | angela.walker@bangormaine.gov |

**South Portland (geo_id=2371990):**
| external_id | full_name | office title(s) | email |
|------------|-----------|----------------|-------|
| -237191001 | Elyse Tipton | Mayor + Council Member (District 5) | NULL |
| -237191002 | Carter Scott | Council Member (District 1) | NULL |
| -237191003 | Rachael Coleman | Council Member (District 2) | NULL |
| -237191004 | Misha C. Pride | Council Member (District 3) | NULL |
| -237191005 | Jessica L. Walker | Council Member (District 4) | NULL |
| -237191006 | (SKIPPED — District 5 held by Tipton -237191001) | — | — |
| -237191007 | Richard T. Matthews | Council Member (At-Large 1) | NULL |
| -237191008 | Natalie West | Council Member (At-Large 2) | NULL |

### Tipton Dual-Office Confirmation

```
full_name     | external_id | office_count
--------------+-------------+--------------
Elyse Tipton  |  -237191001 |            2
```
One politician_id linked to both Mayor and Council Member (District 5) office rows.

### Email Harvest Summary

| City | Emails Found | Emails NULL | Notes |
|------|-------------|------------|-------|
| Bangor | 9 of 9 | 0 | Full harvest; includes mixed-case Faloon |
| Lewiston | 2 of 8 | 6 | Ward 1 (Nagine) + Ward 3 (Harriman) only |
| South Portland | 0 of 7 | 7 | No individual emails on public directory |

**Lewiston email gaps (6 officials):** Mayor Sheline, Longchamps (W2), Roy (W4), Noble (W5), Chittim (W6), Martel (W7) — individual profile pages returned 404 during research; general contact is publiccomments@lewistonmaine.gov (not seeded per policy).

**South Portland email gap (all 7):** Only general citycouncil@southportland.gov found (not seeded per policy — individual emails only).

### Idempotency Probe

Second application of migration 180 produced all `UPDATE 0` — zero net DB changes. Confirmed fully idempotent via ON CONFLICT (external_id) DO NOTHING and politician_id IS NULL guards.

### office_id Back-fill

Query E: `office_id_null_count = 0` — all 24 politicians have office_id populated.
Tipton's office_id points to whichever of her two offices (Mayor or D5) the UPDATE FROM selected first — both are valid linkages per established dual-office pattern.

## Decisions Made

1. **Email column is politicians.email_addresses (TEXT[] array)** — offices table has no email column. All Bangor + Lewiston emails stored as ARRAY['{addr}'] in the INSERT VALUES clause. Plan's references to "offices.email" were incorrect; corrected automatically.

2. **South Portland seeded 7 unique politicians (not 6)** — plan's artifacts section miscounted South Portland as "6 unique — Tipton is one row" but the city has 7 distinct people (Tipton + 6 non-Tipton councilors). The must_haves correctly stated "7 politician rows". Migration seeded 7 = correct.

3. **Bangor Mayor Susan Hawes is_appointed=false on politician row** — she was elected to the council by voters, then selected as Chair by council peers. The politician.is_appointed field reflects how she came to office (elected = false), not how she became Chair. The OFFICE row's is_appointed_position=true (set by migration 177 for the Chair/Mayor seat) was intentionally left unchanged.

4. **-237191006 intentionally skipped** — South Portland external_id sequence jumps from -237191005 (District 4) to -237191007 (At-Large 1). No politician INSERT for this ID; it is documented as "District 5 held by Tipton (-237191001)" in multiple SQL comments.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Email column reference corrected from offices.email to politicians.email_addresses**

- **Found during:** Task 1 (pre-flight DB introspection)
- **Issue:** The plan specified storing emails on `offices.email` and using `UPDATE essentials.offices SET email = '...'` pattern. DB introspection confirmed essentials.offices has 17 columns — none named email. Existing politicians (e.g., Lorraine Canales, Cindy Allen) use `politicians.email_addresses` as a TEXT[] array.
- **Fix:** Stored all emails directly on the INSERT INTO essentials.politicians clause as `email_addresses = ARRAY['{addr}']`. No separate UPDATE block for emails needed.
- **Files modified:** `C:/EV-Accounts/backend/migrations/180_me_tier2_lewiston_bangor_southportland_incumbents.sql` (emails in INSERT VALUES, not in separate UPDATE)
- **Verification:** Query F shows 9 Bangor rows with non-NULL email_addresses; Lewiston Queries show Ward 1 and Ward 3 with emails. All others NULL as expected.
- **Committed in:** 1c49fe6 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Plan's "23 politicians" count corrected to 24**

- **Found during:** Task 1 (counting South Portland unique people)
- **Issue:** Plan artifacts section stated "23 politician INSERTs (Lewiston 8 + Bangor 9 + South Portland 6 unique)" but South Portland has 7 distinct people: Elyse Tipton + Carter Scott + Rachael Coleman + Misha Pride + Jessica Walker + Richard Matthews + Natalie West. The must_haves section correctly said "7 politician rows". The "6 unique" figure was an error in the artifacts section.
- **Fix:** Migration correctly seeds 7 South Portland politicians = 24 total. This is not a bug in the migration; the migration is correct. The plan's artifacts section had an arithmetic error.
- **Impact:** Verification Query A returned 24 (not 23). This is the correct result.

---

**Total deviations:** 2
- 1 auto-fixed bug (wrong column name in plan)
- 1 plan document error (wrong count in artifacts section, migration is correct)

**Impact on plan:** Both handled automatically. No scope creep. Migration is correct.

## Issues Encountered

- `supabase db query` CLI pointed to local docker (not running). Used psql directly with DATABASE_URL from `C:/EV-Accounts/backend/.env` — established pattern from prior phases.

## User Setup Required

None — migration applied directly to live DB. No manual steps.

## Next Phase Readiness

- Migration 180 applied and verified; next migration is 181 (Auburn + Biddeford incumbents)
- Plan 54-02 ready to execute: Auburn (8 officials, full email harvest) + Biddeford (10 officials, Mayor email only)
- Plan 54-03 (headshots for Lewiston/Bangor/South Portland) can proceed after 54-02
- Lewiston email gaps (6 officials) + South Portland email gaps (7 officials) deferred to GAPS.md in Plan 54-02

---
*Phase: 54-me-city-officials-tiers-2-4*
*Completed: 2026-05-19*
