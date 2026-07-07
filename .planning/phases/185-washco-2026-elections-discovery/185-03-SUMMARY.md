---
phase: 185-washco-2026-elections-discovery
plan: 03
status: complete
completed: 2026-07-04
requirements: [WM-ELEC-01]
---

# Plan 185-03 SUMMARY — Arm west-metro 2026 discovery + one live run

## Outcome
8 `essentials.discovery_jurisdictions` rows armed (Washington County + 7 west-metro cities), date-based
cron horizon, school boards excluded (D-05). One real discovery run triggered against the LIVE pipeline
**completed with `error_message IS NULL`** — pipeline proven wired end-to-end.

## Migration numbering
- Live max at write time = 1215 (Plan 02's candidates); 1216 free → discovery migration = **1216**
  (committed `950a50ec`). No further counter drift observed between Plan 02 and 03.

## What was built
- `C:/EV-Accounts/backend/migrations/1216_washco_2026_discovery.sql` (committed `950a50ec`)
- `C:/EV-Accounts/backend/scripts/_apply-migration-1216.ts`, `_poll-discovery-run.ts`
  (gitignored `_`-prefixed harnesses — local only)

## Task 1 — 8 discovery_jurisdictions rows
- All `state='OR'` (UPPERCASE — discovery_jurisdictions convention, NOT districts.state 'or' lowercase),
  `election_date='2026-11-03'`, `ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING`, no ledger,
  no BEGIN/COMMIT wrap (1113 family).
- **URL reachability re-checked 2026-07-04:**
  - Washington County (41067): SOS Candidate-Filings-Local-Measures fallback in source_url + county page &
    ballotpedia.org in allowed_domains (D-06 resilience — the county's own filings sub-page 403s).
  - Cornelius (4115550): `/385/Elections-2024` **302-redirects to `/385/Elections-2026`** → used the
    resolved live URL as source_url.
  - Hillsboro (4134100): root + candidate sub-paths are WAF-403 to curl → root domain `https://www.hillsboro-oregon.gov/`
    used as source_url (the discovery agent navigates hub pages a raw scraper can't), hillsboro-oregon.gov
    in allowed_domains.
  - Beaverton/Tigard/Tualatin/Forest Grove/Sherwood: each city's own confirmed election page.
- **School boards NOT armed** — in-migration negative assertion confirmed 0 rows for the 5 west-metro
  G5420 geo_ids (4101920, 4105160, 4100023, 4111290, 4112240).
- Jurisdiction IDs (from RETURNING): WashCo `28b92666-ecf7-489e-b80a-981db9cdaa06`, Beaverton
  `384baeec-…`, Hillsboro `a286522a-…`, Tigard `1780c5ff-…`, Tualatin `1be1408c-…`, Forest Grove
  `fa0f8ec0-…`, Sherwood `2ba78db8-…`, Cornelius `f9f01ecc-…`.

## Task 2 — Live discovery run
- Triggered `POST https://accounts-api.empowered.vote/api/admin/discover/jurisdiction/28b92666-…`
  (Washington County — most authoritative source; correct host, NOT the dead .onrender.com) → **202 accepted**.
- Polled `essentials.discovery_runs` (run id `f878483a-7d26-4a6c-9955-8531518e4179`): reached
  **`status='completed'`, `error_message IS NULL`, `candidates_found=3`, `candidates_new=3`** — exceeds the
  D-07 acceptance bar (completes without error; count may be 0).
- **`ADMIN_INGEST_TOKEN` was read from `.env` into a shell variable at trigger time only** — never echoed,
  logged, written to a file, or committed. Verified absent from all committed files, SUMMARY, and script output.

## Verification
- Smoke script exits 0 on first apply AND idempotent re-run (still 8, 0 school boards). ✓
- In-migration `DO $$` gate passed: 8 west-metro OR rows, 0 school-board rows armed. ✓
- Live discovery run completed with no error (candidates_found=3). ✓
- No `supabase_migrations.schema_migrations` row for 1216. ✓
