---
phase: 219-elections-candidates-backfill
plan: 08
subsystem: data-seeding
tags: [collin-county, elections, races, candidates, texas, sql-migration, sourced-only, thin-city-backfill, photo-reuse]
status: complete
dependency-graph:
  requires: [219-01]
  provides: [migration-1399-authored]
  affects: [essentials.elections, essentials.races, essentials.race_candidates]
tech-stack:
  added: []
  patterns:
    - "SOURCED-ONLY gate (carried from 219-07/1398): a term-start date alone (from an already-cited prior seeding migration) is NOT a sufficient citation to mint an election row and seed a race — only a real, independent election finding (canvass, news, city elections page, or an explicit prior-migration comment describing the election itself, e.g. migration 094's 'Won special election February 2026') qualifies. Offices with only a term-start-date inference stay documented [OPEN], not seeded."
    - "Photo-reuse UPDATE pattern (D-05): existing race_candidates rows with no politician_id (predating the person's later officeholder-seating migration) can be opportunistically UPDATEd to link the now-existing offices.politician_id, guarded strictly by `WHERE politician_id IS NULL` so the UPDATE is net-zero on any re-run and never overwrites a non-NULL value. This is NOT a new race/election — the race was already seeded from a real canvass."
    - "Own-election-row minting for an off-cycle special election (mirrors migration 1396's Plano Place 7 precedent): ON CONFLICT (name, election_date, state) DO NOTHING, resolved by name/date/state afterward, never a hardcoded literal election UUID."
    - "Explicit `IF v_office_id IS NULL THEN RAISE EXCEPTION` guard after every office lookup — office_id is nullable on essentials.races (migration 042), so a wrong geo_id/title would otherwise silently create an orphan race instead of failing loudly."
    - "candidate_status='active'; is_incumbent=false for an open-seat special-election winner; winner-ness expressed purely via politician_id linkage, never via candidate_status."
key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1399_collin_thin_backfill_b.sql"
    - "C:/EV-Accounts/backend/scripts/_apply-migration-1399_collin_thin_backfill_b.ts"
  modified: []
decisions:
  - "SOURCED-ONLY applied (same operator standard as 219-07/1398): of the 20 race-less offices across Parker/Celina/Frisco/Fairview/Lowry Crossing, exactly ONE has an independent election citation — Frisco Council Member Place 1 (Ann Anderson), per migration 094's own header comment: 'Won special election February 2026; is_appointed=false (elected, not appointed).' This explicitly asserts an election occurred and distinguishes 'elected' from 'appointed', meeting the same bar as migration 096's Murphy Mayor precedent. Every other race-less office in these 5 cities had ONLY a term-start-date citation (migrations 094/096/097/098) with no independent election finding — left documented [OPEN], not seeded."
  - "Parker Pettle/Pilgrim/Barron politician_id link-up UPDATE is KEPT (not subject to SOURCED-ONLY) — it is not a new race or an inferred election, it links EXISTING migration-100 race_candidates rows (already anchored to the real May-2026 Collin County canvass) to the now-existing offices.politician_id seated by migration 1389. Guarded `WHERE politician_id IS NULL` for idempotent net-zero re-run."
  - "Frisco Council Member Place 1 special election seeded under its OWN new minted election row ('Frisco TX City Special 2026', 2026-02-01) — not the shared 2026-05-02 row — since a Feb-2026 special is a distinct election event, mirroring migration 1396's Plano Place 7 precedent exactly. No opponent name or exact day is cited in any source found this session; only Ann Anderson (the sole cited winner) is seeded, per the same no-fabrication standard as Plano Place 7."
  - "No WebSearch/WebFetch tool was available this execution session — all findings came from re-reading 219-RESEARCH.md, 219-PREFLIGHT.md, and every prior Collin-county migration's own header/inline comments (088-100, 1388-1398). This is consistent with 219-07's session; a future session with live web tooling could resolve some of the 17 remaining [OPEN] offices with fresh sourcing."
metrics:
  duration: "~1.5h (Tasks 1-2 only; Task 3 delegated to orchestrator)"
  completed: "2026-07-24"
---

# Phase 219 Plan 08: Parker Photo-Link + Frisco Special-Election Sourced Backfill Summary

Authored migration 1399 plus its gated apply-script under `C:/EV-Accounts`. **Final scope: 1 new race (Frisco Council Member Place 1 Special, Ann Anderson) + the Parker Pettle/Pilgrim/Barron politician_id link-up UPDATE (D-05 photo reuse, not a new race).** Migration numbering re-confirmed clean (no drift). **Task 3 (operator apply/push/verify) was NOT executed — delegated to the orchestrator**, per the objective's explicit instruction.

## Task 1: Identified remaining offices + sourced findings

Read `219-08-PLAN.md`, `219-PREFLIGHT.md`, `219-RESEARCH.md` (thin-governments table for Parker/Celina/Frisco/Fairview/Lowry Crossing, Patterns 1-5, Pitfall 4), `219-CONTEXT.md`, `C:/EV-Accounts/backend/migrations/100_collin_county_may2026_races.sql` (existing races to preserve — Parker Mayor/At-Large, Celina Mayor/Place4/5, Frisco Mayor/Place5/6, Fairview Seat2/4/6, Lowry Crossing Ward4), and `1389_collin_seat_cited_incumbents.sql` (Parker Pettle/Pilgrim/Barron `offices.politician_id` source).

No WebSearch/WebFetch tool was available this session (same constraint as 219-07). Instead of fresh web research, I re-grepped every prior Collin-county seeding migration (088-100, 1388-1398) for any header/inline comment describing an actual election **outcome** (not just a term-start date) for the 20 race-less offices across these 5 cities:

- **Parker (4855152):** remaining offices Place 1 (Roxanne Bogdan), Place 2 (Colleen Halbert), Place 4 (Darrel Sharpe) — migration 098 seeds these with term dates only, no election-outcome comment. **[OPEN]**.
- **Celina (4813684):** remaining offices Place 1 (Philip Ferguson), Place 2 (Eddie Cawlfield), Place 3 (Andy Hopkins), Place 6 (Brandon Grumbles) — migration 096, term dates only. **[OPEN]**.
- **Frisco (4827684):** remaining offices Place 1 (Ann Anderson), Place 2 (Burt Thakur), Place 3 (Angelia Pelham), Place 4 (Jared Elad) — migration 094. Place 2/3/4 are term-date only (**[OPEN]**). **Place 1 is different**: migration 094's own comment reads *"Frisco Council Member Place 1 — Ann Anderson (term: 2026-02-01 → 2029-05-01) / Won special election February 2026; is_appointed=false (elected, not appointed)"* — this is a real, independent election-outcome citation (the "elected, not appointed" phrasing exists specifically to rule out an appointment), meeting the same SOURCED bar as migration 096's Murphy Mayor precedent (219-07/1398). **SEEDED.**
- **Fairview (4825224):** remaining offices Mayor (John Hubbard), Seat 1 (Rich Connelly), Seat 3 (Jill Hawkins), Seat 5 (Pat Sheehan) — migration 097, term dates only. **[OPEN]**.
- **Lowry Crossing (4844308):** remaining offices Mayor (Pat Kelly), Place 1 (Scott Pitchure), Place 2 (Tammy Hodges), Place 3 (Eusebio "Joe" Trujillo III) — migration 098, term dates only; Place 5 (Chris Madrid), Place 6 (Agur Rios), Place 7 (Cindy Cash) — migration 1389, explicitly flagged there as **"DB-gap continuing incumbent"** (an inference, not a citation). All 7 remaining offices **[OPEN]**.

**Parker bonus (D-05 photo reuse):** confirmed via migration 100 that Parker Mayor race candidate "Lee Pettle" and Parker Councilmember-At-Large candidates "Buddy Pilgrim" / "Billy Barron" were seeded with **no** `politician_id` column at all in the original INSERT (defaults to NULL). Confirmed via migration 1389 that `offices.politician_id` for Parker Mayor / Council Member Place 3 / Council Member Place 5 is now set (Pettle/Pilgrim/Barron respectively, seated by that migration). This is a pure link-up, not a new race.

## Task 2: Migration 1399 + apply-script

Re-confirmed migration numbering: `ls C:/EV-Accounts/backend/migrations | grep -E '^1[3-4][0-9]{2}_'` shows on-disk MAX = 1398 (219-07's committed migration) → **1399 is next-free, matches the PREFLIGHT locked map exactly, no drift**.

Wrote `C:/EV-Accounts/backend/migrations/1399_collin_thin_backfill_b.sql` in `BEGIN`/`COMMIT`, single `DO $$` block:
- **3 Parker UPDATEs** (Lee Pettle / Buddy Pilgrim / Billy Barron), each: look up the office's `politician_id` via `geo_id='4855152'` + exact `title` join, `RAISE NOTICE` skip if the office isn't seated yet, else `UPDATE essentials.race_candidates SET politician_id = ... WHERE full_name = '...' AND politician_id IS NULL` — guarded so a second run affects 0 rows.
- **1 minted election row**: `'Frisco TX City Special 2026'`, `2026-02-01`, `TX`, `special`, resolved by name/date/state via `ON CONFLICT (name, election_date, state) DO NOTHING` (never a hardcoded UUID).
- **1 new race**: `Frisco Council Member Place 1 Special`, `office_id` resolved via `geo_id='4827684'` + `title='Council Member Place 1'`, `primary_party` NULL (D-06), `INSERT ... ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING`.
- **1 candidate row**: Ann Anderson, `WHERE NOT EXISTS (race_id, full_name)` guarded, `politician_id` resolved from `offices.politician_id` (already seated by migration 094), `is_incumbent=false` (open-seat special, not a retention), `candidate_status='active'`, `source` citing migration 094's header note + friscotexas.gov.
- Explicit `IF ... IS NULL THEN RAISE EXCEPTION` guards on both office lookups and the election-mint resolve (3 `RAISE EXCEPTION` guards total, confirmed via grep).
- Header comment documents, by name, all 17 remaining [OPEN] offices (grouped by city) and the reason (term-date-only citation, no election-outcome finding).

Wrote `C:/EV-Accounts/backend/scripts/_apply-migration-1399_collin_thin_backfill_b.ts`:
- Gate (a): Frisco Place 1 Special race exists under its own minted election row after apply.
- Gate (b): exactly 1 candidate on that race, named "Ann Anderson."
- Gate (c): 0 candidate rows with an illegal `candidate_status`.
- Gate (d): 0 non-NULL `primary_party` on the race.
- Gate (e) (D-07): `inform.politician_answers` total count unchanged before/after.
- Gate (f): the project-standard split-section SQL check returns 0 rows.
- Gate (g/i, plan gate "existing migration-100 race count per city UNCHANGED"): captures per-city race counts under the SHARED `2026 Texas Municipal General` election row for all 5 cities before and after apply, asserting equality — the new Frisco race lives under a wholly distinct `election_id`, so it structurally cannot pollute this count; this also proves no `ON CONFLICT` swallow of a pre-existing race occurred.
- Gate (h/ii, plan gate "Parker UPDATE only sets currently-NULL politician_id"): captures Pettle/Pilgrim/Barron's `race_candidates.politician_id` before/after, asserting all 3 are non-NULL and match their office's `politician_id` after the first apply.
- Gate (j, idempotent re-run): re-applies the full SQL a second time in-script and asserts (1) the Frisco race id + candidate count are unchanged, (2) all 5 cities' existing race counts are unchanged, and (3) the 3 Parker link-up `politician_id` values are byte-for-byte unchanged (net-zero UPDATE on re-run).
- Exits non-zero if any gate fails; prints every count either way for orchestrator visibility.

**Type-check:** `cd "C:/EV-Accounts/backend" && npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --skipLibCheck --strict --forceConsistentCasingInFileNames scripts/_apply-migration-1399_collin_thin_backfill_b.ts` — clean, zero errors (exit 0). Confirmed the identical zero-error result for the already-committed `_apply-migration-1398_collin_thin_backfill_a.ts` under the same explicit flags, as a same-session control. The plan's literal bare verify command (`npx tsc --noEmit scripts/_apply-migration-1399...ts`, no explicit flags) reproduces the same category of pre-existing project-config-gap errors (`esModuleInterop`/top-level-`await`) that the identical bare invocation produces on 1398/1395/etc. — `tsconfig.json`'s `include` is scoped to `src/**/*` only, excluding `scripts/`, so a bare file argument bypasses project-config auto-discovery and falls back to `tsc`'s ES3/CommonJS defaults regardless of which script is targeted. This is a pre-existing, already-accepted repo-wide gap (confirmed in 219-04's and 219-07's SUMMARYs), not something introduced by this migration. Both files confirmed present on disk; SQL sanity-checked via grep (1 race INSERT, 1 candidate INSERT, 1 election mint, 3 `RAISE EXCEPTION` guards, 3 Parker `UPDATE` statements).

## Expected apply-time counts (for the orchestrator's Task 3 verification)

| Election | Race | Candidates |
|---|---|---|
| Frisco TX City Special 2026 (2026-02-01, own new row) | Frisco Council Member Place 1 Special | 1 (Ann Anderson, is_incumbent=false, candidate_status='active') |
| **Total new races** | **1** | **1 candidate** |

| Parker link-up | Office | Expected result |
|---|---|---|
| Lee Pettle | Mayor | `race_candidates.politician_id` set to `offices.politician_id` (was NULL) |
| Buddy Pilgrim | Council Member Place 3 | `race_candidates.politician_id` set to `offices.politician_id` (was NULL) |
| Billy Barron | Council Member Place 5 | `race_candidates.politician_id` set to `offices.politician_id` (was NULL) |

No existing migration-100 race (Parker Mayor/At-Large, Celina Mayor/Place4/5, Frisco Mayor/Place5/6, Fairview Seat2/4/6, Lowry Crossing Ward4) is inserted, modified, or deleted by this migration.

## Documented-open offices (17 — NOT defects, per Pitfall 4)

These offices have a known, real, currently-seated officeholder (per migrations 094/096/097/098/1389) but **no independently-sourced election-outcome citation** — only a term-start-date citation, which per the operator's SOURCED-ONLY ruling (219-07) is insufficient to seed a race:

| City (geo_id) | Documented-open offices |
|---|---|
| Parker (4855152) | Council Member Place 1 (Roxanne Bogdan), Place 2 (Colleen Halbert), Place 4 (Darrel Sharpe) |
| Celina (4813684) | Council Member Place 1 (Philip Ferguson), Place 2 (Eddie Cawlfield), Place 3 (Andy Hopkins), Place 6 (Brandon Grumbles) |
| Frisco (4827684) | Council Member Place 2 (Burt Thakur), Place 3 (Angelia Pelham), Place 4 (Jared Elad) |
| Fairview (4825224) | Mayor (John Hubbard), Council Member Seat 1 (Rich Connelly), Seat 3 (Jill Hawkins), Seat 5 (Pat Sheehan) |
| Lowry Crossing (4844308) | Mayor (Pat Kelly), Council Member Place 1 (Scott Pitchure), Place 2 (Tammy Hodges), Place 3 (Eusebio "Joe" Trujillo III), Place 5 (Chris Madrid), Place 6 (Agur Rios), Place 7 (Cindy Cash) |

If a future session gains real canvass/news access for these 17 seats' actual elections, a follow-up migration can seed them with genuine citations (not term-date inference), without touching this migration's Frisco race or Parker link-up.

## Items needing orchestrator DB verification before Task 3

1. **Frisco Council Member Place 1's `offices.politician_id`** assumes it still resolves to Ann Anderson (per migration 094) — not independently re-verified via a fresh DB query this session (no DB access available to this executor). Recommend a quick pre-check before applying.
2. **Parker's three `offices.politician_id` values** (Mayor/Place 3/Place 5) assume migration 1389 has already run and seated Pettle/Pilgrim/Barron respectively — the apply-script's Gate (h/ii) will fail loudly and safely (via the `RAISE NOTICE` skip path, not a silent no-op) if any of the three are not yet seated; worth a quick pre-check.
3. **Frisco special-election exact date** (`2026-02-01`) is a best-effort month-precision date matching the officeholder's cited `valid_from` — migration 094's comment gives only "February 2026," not an exact day. If a future session finds the exact certified date, the election row's date may need a follow-up correction (would require a new election row + race move, since `(name, election_date, state)` is part of the unique key — not something this migration can safely self-correct).
4. **Position-name collision check**: confirmed via grep that no existing race across any prior migration uses the position_name `'Frisco Council Member Place 1 Special'` — this is a genuinely new, non-colliding name.

## Task 3 — DELEGATED TO ORCHESTRATOR

**Task 3 (operator applies 1399, confirms gates green, pushes, browse spot-check) was NOT executed by this subagent.** Per the objective's explicit instruction, the orchestrator performs: `cd C:/EV-Accounts/backend && npx tsx scripts/_apply-migration-1399_collin_thin_backfill_b.ts`, confirms all gates print green, resolves the DB-verification items flagged above if needed, commits + pushes `C:/EV-Accounts` (Render auto-deploys), and does a live browse spot-check (`/results?browse_geo_id=4855152` Parker — confirm Pettle/Pilgrim/Barron now show linked headshots; `/results?browse_geo_id=4827684` Frisco — confirm the new special-election race renders).

This subagent made **zero writes to the production database** and made **zero commits/pushes to `C:/EV-Accounts`** — the migration and apply-script files exist only as untracked files on disk in that repo, ready for the orchestrator to apply.

## Deviations from Plan

### Auto-fixed / Research-adjusted

**1. [Rule 3-adjacent — tooling constraint] No WebSearch/WebFetch tool available this execution session**
- **Found during:** Task 1.
- **Issue:** The plan's Task 1 `<read_first>` lists live source URLs (parkertexas.us, celinatx.gov, friscotexas.gov, fairviewtexas.org, lowrycrossingtexas.org) implying fresh confirmation, but this session's toolset had no WebSearch/WebFetch (same constraint noted in 219-07's SUMMARY).
- **Fix:** Sourced the one race that had a genuine election-outcome citation already present in the codebase (Frisco Place 1 / Ann Anderson, per migration 094's header note), matching the SOURCED-ONLY standard the operator set in 219-07. Everything else stayed documented-open rather than inferred.
- **Files modified:** N/A (research-only).
- **Commit:** N/A.

No bugs found, no blocking issues beyond the flagged DB-verification items above (all safe-fail via `RAISE NOTICE` skip or `RAISE EXCEPTION` on any lookup mismatch, not a silent data-integrity risk), no architectural questions requiring a plan change.

## Self-Check: PASSED

- `C:/EV-Accounts/backend/migrations/1399_collin_thin_backfill_b.sql` — FOUND (1 race INSERT, 1 candidate INSERT, 1 election mint, 3 `RAISE EXCEPTION` guards, 3 Parker `UPDATE` statements, 1 `BEGIN`/`COMMIT` block — verified via grep counts).
- `C:/EV-Accounts/backend/scripts/_apply-migration-1399_collin_thin_backfill_b.ts` — FOUND, type-checks clean under the project's actual compiler settings (exit 0).
