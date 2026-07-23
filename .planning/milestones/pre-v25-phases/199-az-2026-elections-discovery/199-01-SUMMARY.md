# 199-01 SUMMARY — AZ 2026 Statewide Primary election row

**Status:** ✅ Complete
**Wave:** 1
**Applied to production:** 2026-07-17

## What was built
- `C:/EV-Accounts/backend/migrations/1372_az_2026_primary_election.sql` — idempotent INSERT of the bare AZ 2026 Statewide Primary row (2026-07-21) + post-verify `DO $$` + ledger row `('1372')`.
- `C:/EV-Accounts/backend/scripts/_apply-migration-1372.ts` — apply script with smoke tests (primary date, AZ count=2, general present, ledger).

## Migration numbering
- Disk max at execute time = **1371** → next free = **1372**. No offset applied; 199 series stays 1372–1376.

## Verified facts (against live production)
- AZ 2026 Statewide Primary row exists, `election_date = 2026-07-21` (corrected HB 2022 date — NOT 2026-08-04).
- The primary row is **bare** — no races link to it.
- General election FK anchor present: `e21f5757-071e-4851-9c06-83520d96460e` (name='AZ 2026 Statewide General').
- `SELECT COUNT(*) FROM essentials.elections WHERE state='AZ'` = **2**.
- Re-apply idempotent (AZ count stays 2).
- Ledger entry 1372 PRESENT.

## Acceptance criteria
- [x] 1372 SQL exists; contains `'AZ 2026 Statewide Primary'`, `'2026-07-21'`; does NOT contain `'2026-08-04'`
- [x] Contains `ON CONFLICT (name, election_date, state) DO NOTHING`
- [x] Contains `VALUES ('1372')`; does NOT contain `cron_active`
- [x] Apply script exists, references `1372_az_2026_primary_election.sql`, prints all 4 gate lines
- [x] Idempotent re-apply; prod queries return 2026-07-21 and count=2

## Deviations
- Apply command runs from `C:/EV-Accounts/backend` (`npx tsx scripts/_apply-migration-1372.ts`), not the repo root — the apply script resolves the SQL via `process.cwd()/migrations`, matching the existing 1216-era apply-script convention. (Plan example showed `cd C:/EV-Accounts && npx tsx backend/scripts/...`; corrected to preserve path resolution.)
- No git in C:/EV-Accounts (Render deploys from master; project rule). SUMMARY/tracking committed in the essentials repo only.

## Enables
Plans 02/03 can resolve `(SELECT id FROM essentials.elections WHERE name='AZ 2026 Statewide General' AND state='AZ')` to a non-null UUID for all 73 race shells.
