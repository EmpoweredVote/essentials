---
phase: 14-tier-2-officials
plan: "02"
subsystem: database
tags: [postgres, supabase, migrations, sql, tx, local-government, seed-data]
requires:
  - phase: 12-tx-db-foundation
    provides: Richardson government + chamber + offices (migration 089)
provides:
  - Richardson Mayor + 6 council member politician rows with office_id links
  - essentials.offices.politician_id back-links for all 7 seats
  - Contact data: 7 emails + 7 bio URLs
duration: ~30min
completed: 2026-05-01
decisions:
  - id: richardson-email-domain
    summary: "Emails confirmed as Firstname.Lastname@cor.gov by user during checkpoint review"
    rationale: "cor.net council bio pages return 403 to external scrapers; staging originally set emails to NULL per CONTEXT.md policy; user confirmed the cor.gov pattern is correct"
key-files:
  created:
    - .planning/phases/14-tier-2-officials/staging/richardson-politicians.md
    - /c/EV-Accounts/backend/migrations/095_richardson_politicians.sql
  modified:
    - .planning/phases/14-tier-2-officials/staging/richardson-politicians.md
---

# Phase 14 Plan 02: Richardson Politicians Summary

**One-liner:** Seeded 7 Richardson incumbent politicians via migration 095 with bidirectional FK links; 100% email coverage (Firstname.Lastname@cor.gov); 2-year terms documented.

## What Was Done

Migration 095 inserted all 7 current City of Richardson council members into `essentials.politicians`, linked each to the pre-existing `essentials.offices` row (forward FK on `politicians.office_id`), and set the back-link (`offices.politician_id`) for all 7 seats.

### Politicians seeded

| Office (DB title) | Name | Email | valid_from | valid_to |
|---|---|---|---|---|
| Mayor | Amir Omar | Amir.Omar@cor.gov | 2025-05-01 | 2027-05-01 |
| Council Member District 1 | Curtis Dorian | Curtis.Dorian@cor.gov | 2025-05-01 | 2027-05-01 |
| Council Member District 2 | Jennifer Justice | Jennifer.Justice@cor.gov | 2025-05-01 | 2027-05-01 |
| Council Member District 3 | Dan Barrios | Dan.Barrios@cor.gov | 2025-05-01 | 2027-05-01 |
| Council Member District 4 | Joe Corcoran | Joe.Corcoran@cor.gov | 2025-05-01 | 2027-05-01 |
| Council Member Place 5 | Ken Hutchenrider | Ken.Hutchenrider@cor.gov | 2025-05-01 | 2027-05-01 |
| Council Member Place 6 | Arefin Shamsul | Arefin.Shamsul@cor.gov | 2025-05-01 | 2027-05-01 |

### Coverage metrics

- Email coverage: 7/7 (100%) — confirmed by user during checkpoint review
- Bio URL coverage: 7/7 (100%) — cor.net council member pages
- Bidirectional FK links: 7/7 (100%)

## Key Quirks Documented

### District/Place title mapping

Richardson officially labels all 7 seats "Place 1" through "Place 6". Migration 089 (Phase 12) used "District 1-4" for the first four seats due to their geographic residency requirements. Migration 095 uses DB titles as WHERE clause lookup keys with inline SQL comments mapping DB title to Richardson's official label.

| Richardson official label | DB title | Residency requirement |
|---|---|---|
| Place 1 | Council Member District 1 | Must live in District 1 |
| Place 2 | Council Member District 2 | Must live in District 2 |
| Place 3 | Council Member District 3 | Must live in District 3 |
| Place 4 | Council Member District 4 | Must live in District 4 |
| Place 5 | Council Member Place 5 | At-large |
| Place 6 | Council Member Place 6 | At-large |

### 2-year term quirk

Richardson uses 2-year staggered terms. All 7 current members were elected May 3, 2025 and have terms expiring May 2027. This differs from most Texas municipalities that use 3-year terms. `valid_from='2025-05-01'`, `valid_to='2027-05-01'`, `term_date_precision='month'`.

### Post-election flags

None. Richardson had no council races on May 3, 2026 (bond measures and charter amendments only). No politician rows need post-election review.

## Verification Results

```
             city              |          office           |    full_name     | has_office_id | has_back_link | has_email | has_bio_url | valid_from |  valid_to
-------------------------------+---------------------------+------------------+---------------+---------------+-----------+-------------+------------+------------
 City of Richardson, Texas, US | Council Member District 1 | Curtis Dorian    | t             | t             | t         | t           | 2025-05-01 | 2027-05-01
 City of Richardson, Texas, US | Council Member District 2 | Jennifer Justice | t             | t             | t         | t           | 2025-05-01 | 2027-05-01
 City of Richardson, Texas, US | Council Member District 3 | Dan Barrios      | t             | t             | t         | t           | 2025-05-01 | 2027-05-01
 City of Richardson, Texas, US | Council Member District 4 | Joe Corcoran     | t             | t             | t         | t           | 2025-05-01 | 2027-05-01
 City of Richardson, Texas, US | Council Member Place 5    | Ken Hutchenrider | t             | t             | t         | t           | 2025-05-01 | 2027-05-01
 City of Richardson, Texas, US | Council Member Place 6    | Arefin Shamsul   | t             | t             | t         | t           | 2025-05-01 | 2027-05-01
 City of Richardson, Texas, US | Mayor                     | Amir Omar        | t             | t             | t         | t           | 2025-05-01 | 2027-05-01
(7 rows)
```

All 7 rows present. All booleans true. Terms correct.

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Email domain | cor.gov (Firstname.Lastname@cor.gov) | Confirmed by user during checkpoint review 2026-05-01; originally staged as NULL because cor.net returns 403 to scrapers |
| DB title lookup keys | Use DB titles from migration 089 (District 1-4, not Place 1-4) | Migration 089 already applied; must use actual DB titles as WHERE clause keys |

## Deviations from Plan

### Auto-fixed Issues

None.

### Checkpoint-driven corrections

**1. Email addresses updated from NULL to confirmed cor.gov pattern**

- **Found during:** Task 2 (human review checkpoint)
- **Issue:** Staging file originally had all 7 email_addresses as NULL, per CONTEXT.md policy (no email inference when official source not accessible). cor.net council pages return 403 to external scrapers.
- **Correction:** User confirmed during review that Richardson council members publish emails at Firstname.Lastname@cor.gov. User provided all 7 confirmed addresses.
- **Fix:** Staging file Verification Notes updated; migration 095 written with all 7 emails included.
- **Files modified:** `.planning/phases/14-tier-2-officials/staging/richardson-politicians.md`
- **Commit:** c20e10f

## Commits

| Repo | Commit | Description |
|---|---|---|
| essentials | 4ae7bae | chore(14-02): write Richardson politician staging file |
| essentials | c20e10f | chore(14-02): update Richardson staging with confirmed cor.gov email addresses |
| EV-Accounts | 21dd223 | feat(14-02): migration 095 seed Richardson incumbent politicians (7 rows, 2-year terms, cor.gov emails) |

## Next Phase Readiness

- Richardson is fully seeded. Phase 14 Plan 03 (Murphy, Celina, Prosper) can proceed independently.
- No blockers or open questions for Richardson.
