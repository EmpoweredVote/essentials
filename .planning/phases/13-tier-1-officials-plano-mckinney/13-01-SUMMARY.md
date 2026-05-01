---
phase: 13-tier-1-officials-plano-mckinney
plan: "01"
subsystem: database
tags: [postgres, supabase, migrations, sql, tx, local-government, seed-data]

requires:
  - phase: 12-tx-db-foundation
    provides: Plano government + chamber + 9 offices (migration 088)
provides:
  - Plano Mayor + 7 council member politician rows with office_id links
  - essentials.offices.politician_id back-links for all 8 filled Plano seats
  - Contact data (email + bio URL) for all 8 Plano incumbents

tech-stack:
  added: []
  patterns:
    - "DO $$ DECLARE v_office_id UUID; v_politician_id UUID; BEGIN ... END $$; pattern for seeding politicians with office back-link"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/091_plano_politicians.sql
    - .planning/phases/13-tier-1-officials-plano-mckinney/staging/plano-politicians.md
  modified: []

key-decisions:
  - "email_addresses array column used for contact (not politician_contacts table — that's for BallotReady/discovery pipeline)"
  - "valid_from/valid_to as TEXT ISO strings per schema design"
  - "Shun Thomas: is_appointed=false (elected via special election January 31, 2026, sworn in February 9, 2026)"
  - "Council Member Place 6 is vacant — no politician row created; office left with politician_id=NULL"
  - "8 rows seeded (not 8+1) — Place 6 vacant seat intentionally excluded from staging"

duration: ~25 minutes
completed: 2026-05-01
---

# Phase 13 Plan 01: Plano Incumbent Politicians Summary

**One-liner:** Seeded 8 Plano city council incumbents (Mayor + Places 1-5, 7-8) via migration 091 with email/bio contact coverage and bidirectional office/politician FK links.

## What Was Built

Migration 091 seeds the 8 current Plano incumbents into `essentials.politicians`. Each DO block:
1. Looks up the office by `geo_id = '4863000'` + `title` (no hardcoded UUIDs)
2. Inserts the politician row with all required fields
3. Updates `essentials.offices.politician_id` for the bidirectional back-link

Council Member Place 6 is intentionally vacant — no politician row was created, and the office retains `politician_id = NULL`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write staging file | d26b082 | .planning/phases/13-tier-1-officials-plano-mckinney/staging/plano-politicians.md |
| 2 | Human verify staging | (checkpoint) | — |
| 3 | Write + apply migration 091 | 8459ec3 (EV-Accounts) | C:/EV-Accounts/backend/migrations/091_plano_politicians.sql |

## Verification Results

```
8 rows returned from essentials.politicians WHERE geo_id = '4863000' AND is_active = true
All 8: has_office_id_on_politician = true
All 8: has_politician_id_on_office = true
All 8: contact_email_status = 'email'
All 8: bio_url_status = 'bio'
```

Contact coverage: **100%** (email + bio URL on all 8 rows)

## Data Summary

| Office | Politician | Term |
|--------|-----------|------|
| Mayor | John B. Muns | 2025-05-01 → 2029-05-01 |
| Council Member Place 1 | Maria Tu | 2023-05-01 → 2027-05-01 |
| Council Member Place 2 | Bob Kehr | 2025-05-01 → 2029-05-01 |
| Council Member Place 3 | Rick Horne | 2023-05-01 → 2027-05-01 |
| Council Member Place 4 | Chris Krupa Downs | 2025-05-01 → 2029-05-01 |
| Council Member Place 5 | Steve Lavine | 2025-05-01 → 2029-05-01 |
| Council Member Place 6 | (vacant) | — |
| Council Member Place 7 | Shun Thomas | 2026-02-09 → 2027-05-01 |
| Council Member Place 8 | Vidal Quintanilla | 2025-05-01 → 2029-05-01 |

## Decisions Made

1. **No slug column in INSERT** — `slug` exists on `essentials.politicians` but is left NULL for TX incumbents (not part of current seeding scope; auto-slug pattern TBD for TX)
2. **Place 6 vacant** — staging data confirmed no incumbent for Place 6; office left with `politician_id = NULL`, `is_vacant` not set on office row (no explicit vacancy flag needed at this stage)
3. **Shun Thomas `valid_from = '2026-02-09'`** — staging specified `2026-02-09` as term start (sworn-in date after Jan 31 special election); `is_appointed = false` confirmed (elected via special election, not council appointment)
4. **`term_date_precision = 'month'`** — all Plano terms use month precision per schema convention for municipal elections
5. **`data_source = 'plano.gov'`** — official city website as authoritative source

## Deviations from Plan

None — plan executed exactly as written.

The staging file noted 8 incumbents for 8 council seats; Place 6 being vacant was already encoded in the staging data (only 8 rows for 9 offices). Migration correctly skips Place 6 with an explicit comment.

## Next Phase Readiness

Plan 13-02 (McKinney politicians) can proceed immediately. The pattern established here:
- `DO $$` block per politician
- `SELECT office by geo_id + title`
- `RAISE EXCEPTION` if office not found
- `RETURNING id INTO v_politician_id`
- `UPDATE offices SET politician_id`

…is directly reusable for McKinney (geo_id `4845744`, 6 incumbents expected).
