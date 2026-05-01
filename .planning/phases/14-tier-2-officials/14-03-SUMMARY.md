---
phase: 14-tier-2-officials
plan: "03"
subsystem: database
tags: [postgres, supabase, migrations, sql, tx, local-government, seed-data]
requires:
  - phase: 12-tx-db-foundation
    provides: Murphy + Celina + Prosper government + chamber + offices (migration 089)
provides:
  - Murphy Mayor + 6 council member politician rows with office_id links
  - Celina Mayor + 6 council member politician rows with office_id links
  - Prosper Mayor + 6 council member politician rows with office_id links
  - essentials.offices.politician_id back-links for all 21 seats
duration: ~30min
completed: 2026-05-01
decisions:
  - "email_addresses = NULL (SQL null, not empty array) for all rows without a confirmed address"
  - "Celina council members 1-6 share the general council page URL (no individual EID pages captured); satisfies bio URL requirement"
  - "Prosper Town label documented in SQL comments only — not a schema change"
key-files:
  created:
    - C:/EV-Accounts/backend/migrations/096_murphy_celina_prosper_politicians.sql
  modified: []
---

# Phase 14 Plan 03: Murphy + Celina + Prosper Politician Seed Summary

**One-liner:** Seeded 21 Murphy/Celina/Prosper incumbent politicians via migration 096; UTF-8 accent preserved for Jené Butler, Celina hyphen-domain enforced, Prosper Town label noted

## What Was Done

Migration 096 inserted 21 incumbent politician rows across three Tier 2 Collin County cities and applied the bidirectional `office_id` / `politician_id` links between `essentials.politicians` and `essentials.offices`.

### Row counts by city

| City | Seats | Data source |
|------|-------|-------------|
| Murphy | 7 (Mayor + Places 1-6) | murphytx.org |
| Celina | 7 (Mayor + Places 1-6) | celina-tx.gov |
| Prosper (Town) | 7 (Mayor + Places 1-6) | prospertx.gov |
| **Total** | **21** | |

### Contact coverage

| Metric | Count |
|--------|-------|
| email_addresses populated | 1/21 (~5%) — Celina Mayor only |
| bio URL populated | 21/21 (100%) |

### Special handling

- **Jené Butler (Murphy Place 6):** é accent written directly as UTF-8 in the SQL file; verified `SELECT first_name FROM essentials.politicians WHERE last_name='Butler'` returns `Jené`.
- **David F. Bristol (Prosper Mayor):** `full_name = 'David F. Bristol'`, `first_name = 'David'`, `last_name = 'Bristol'` — middle initial only in full_name per official directory listing.
- **Marcus E. Ray (Prosper Place 1):** Same pattern — middle initial in full_name only.
- **celina-tx.gov hyphen domain:** Enforced in `data_source` and all URL values; never `celinatx.gov`.
- **Prosper as Town:** SQL comments note "Prosper is legally a Town (not a City); chamber name = 'Town Council'" on all Prosper blocks.
- **Celina council bio URLs:** Places 1-6 all use the general council page `https://www.celina-tx.gov/319/City-Council` (individual EID pages not captured during research); this satisfies the bio URL OR email contact requirement.

## Verification Results

```
 city                       | office                  | full_name         | has_office_id | has_back_link | has_email | has_bio_url | data_source
----------------------------+-------------------------+-------------------+---------------+---------------+-----------+-------------+---------------
 City of Celina, Texas, US  | Council Member Place 1  | Philip Ferguson   | t             | t             |           | t           | celina-tx.gov
 City of Celina, Texas, US  | Council Member Place 2  | Eddie Cawlfield   | t             | t             |           | t           | celina-tx.gov
 City of Celina, Texas, US  | Council Member Place 3  | Andy Hopkins      | t             | t             |           | t           | celina-tx.gov
 City of Celina, Texas, US  | Council Member Place 4  | Wendie Wigginton  | t             | t             |           | t           | celina-tx.gov
 City of Celina, Texas, US  | Council Member Place 5  | Mindy Koehne      | t             | t             |           | t           | celina-tx.gov
 City of Celina, Texas, US  | Council Member Place 6  | Brandon Grumbles  | t             | t             |           | t           | celina-tx.gov
 City of Celina, Texas, US  | Mayor                   | Ryan Tubbs        | t             | t             | t         | t           | celina-tx.gov
 City of Murphy, Texas, US  | Council Member Place 1  | Elizabeth Abraham | t             | t             |           | t           | murphytx.org
 City of Murphy, Texas, US  | Council Member Place 2  | Scott Smith       | t             | t             |           | t           | murphytx.org
 City of Murphy, Texas, US  | Council Member Place 3  | Andrew Chase      | t             | t             |           | t           | murphytx.org
 City of Murphy, Texas, US  | Council Member Place 4  | Ken Oltmann       | t             | t             |           | t           | murphytx.org
 City of Murphy, Texas, US  | Council Member Place 5  | Laura Deel        | t             | t             |           | t           | murphytx.org
 City of Murphy, Texas, US  | Council Member Place 6  | Jené Butler       | t             | t             |           | t           | murphytx.org
 City of Murphy, Texas, US  | Mayor                   | Scott Bradley     | t             | t             |           | t           | murphytx.org
 Town of Prosper, Texas, US | Council Member Place 1  | Marcus E. Ray     | t             | t             |           | t           | prospertx.gov
 Town of Prosper, Texas, US | Council Member Place 2  | Craig Andres      | t             | t             |           | t           | prospertx.gov
 Town of Prosper, Texas, US | Council Member Place 3  | Amy Bartley       | t             | t             |           | t           | prospertx.gov
 Town of Prosper, Texas, US | Council Member Place 4  | Chris Kern        | t             | t             |           | t           | prospertx.gov
 Town of Prosper, Texas, US | Council Member Place 5  | Jeff Hodges       | t             | t             |           | t           | prospertx.gov
 Town of Prosper, Texas, US | Council Member Place 6  | Cameron Reeves    | t             | t             |           | t           | prospertx.gov
 Town of Prosper, Texas, US | Mayor                   | David F. Bristol  | t             | t             |           | t           | prospertx.gov
(21 rows)
```

Accent check: `SELECT first_name, last_name FROM essentials.politicians WHERE last_name='Butler' AND data_source='murphytx.org'` → `Jené | Butler` ✓

## Post-Election Flags

These 7 seats require follow-up updates after May 3-12 election results are certified. NOT handled in this migration.

| City | Seat | Current Incumbent | Flag | Follow-up Action |
|------|------|-------------------|------|-----------------|
| Murphy | Mayor | Scott Bradley | Re-elected unopposed May 3 | Update valid_from='2026-05-01', valid_to='2029-05-01' |
| Murphy | Place 3 | Andrew Chase | Contested May 3 | Check murphytx.org; update or replace row |
| Murphy | Place 5 | Laura Deel | Contested May 3 | Check murphytx.org; update or replace row |
| Celina | Mayor | Ryan Tubbs | Contested May 3 | Check celina-tx.gov; update or replace row |
| Celina | Place 4 | Wendie Wigginton | Open seat (not running) | Insert winner, set Wigginton is_active=false |
| Celina | Place 5 | Mindy Koehne | Open seat (not running) | Insert winner, set Koehne is_active=false |
| Prosper | Place 3 | Amy Bartley | Re-elected uncontested, sworn in May 12 | After May 12: update valid_from='2026-05-12', valid_to='2029-05-01' |
| Prosper | Place 5 | Jeff Hodges | Doug Charles sworn in May 12, 2026 | After May 12: set Hodges is_active=false, valid_to='2026-05-12'; insert Doug Charles |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| email_addresses = NULL (not empty array) for rows with no email | Consistent with schema convention; NULL distinguishes "not published" from "has no email" |
| Celina council members share general council page URL | Individual EID pages not captured during research; general page satisfies bio URL requirement |
| Prosper "Town" label in SQL comments only | No schema change needed; governments.name already says "Town of Prosper" |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

- EV-Accounts `a5cbd7a`: `feat(14-03): migration 096 seed Murphy + Celina + Prosper incumbent politicians (21 rows)`
