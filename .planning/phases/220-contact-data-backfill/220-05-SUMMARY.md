---
phase: 220-contact-data-backfill
plan: 05
subsystem: database
tags: [postgres, migration, sql, contact-data, texas-municipal]

# Dependency graph
requires:
  - phase: 220-contact-data-backfill (220-01)
    provides: locked migration-number map (1408 assigned to this plan)
provides:
  - "Migration 1408: idempotent personal email_addresses seeding for Parker, Saint Paul, Weston, Lowry Crossing, Lucas (34 seat rows attempted)"
  - "Gated apply-script (gitignored) ready for the operator to run in plan 220-06"
affects: [220-06 (apply wave), 220-contact-data-backfill closeout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Personal-email seeding via UPDATE ... FROM (VALUES (geo_id, title, full_name, email)) JOIN governments->chambers->offices, guarded by array_append + a case-insensitive NOT EXISTS/unnest email-presence check AND an explicit p.full_name = v.full_name match (same shape as sibling migration 1407, refined to case-insensitive presence-checking)."

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1408_collin_personal_emails_b.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-1408_collin_personal_emails_b.ts (gitignored, not committed)

key-decisions:
  - "Resolved the Parker Place 3 name/place ambiguity flagged by 220-RESEARCH.md. RESEARCH's two live fetches disagreed on whether 'Place 3 (Deputy Mayor Pro Tem)' and a separately-named 'Place 6 (Mayor Pro Tem) Buddy Pilgrim' were the same seat or different seats. Cross-referencing this codebase's own prior seating migrations (090: 'Parker — 6 seats, Mayor + Place 1-5' — Parker has NO Place 6 office at all; 1389: 'Parker Council Member Place 3 — Buddy Pilgrim (now Mayor Pro Tem)') resolves it conclusively: Buddy Pilgrim IS the Place 3 occupant, and RESEARCH's 'Place 6' label was a mislabel carried from the live page fetch, not a second office. Seeded (Place 3, 'Buddy Pilgrim', bpilgrim@parkertexas.us) matched against the DB's own authoritative title+name pairing rather than RESEARCH's ambiguous label — a wrong guess would have safely no-op'd rather than corrupted data, per the full_name guard."
  - "Used a case-insensitive (lower()-normalized) email-presence check via NOT EXISTS/unnest, rather than 1407's exact-string array-containment (@>), because cross-referencing migration history surfaced several already-seeded DB addresses that differ from RESEARCH's transcribed casing only by letter case (DB has 'jt.trevino@stpaultexas.us', RESEARCH transcribes 'JT.trevino@...'; DB has 'junderhill@lucastexas.us', RESEARCH transcribes 'JUnderhill@...'). Case-insensitive matching prevents seeding a functionally-redundant duplicate casing variant while remaining a true idempotency guard."
  - "Lowry Crossing Ward 4 TLD correction is additive, not corrective. Migrations 098/1389 already seeded ALL 9 Lowry Crossing seats with emails, but seeded Ward 4 members Hijazen (Place 4) and Simpson (Place 8) with the WRONG TLD (.org) at that time. This migration's Hijazen/Simpson rows use the RESEARCH-confirmed .com address and are APPENDED alongside the pre-existing .org entry — this migration does not delete the earlier .org entry (out of this data-only migration's append-only scope per D-07; see Deviations)."
  - "Zero known-possible-skips in this batch (unlike sibling 1407's 5). Every one of the 34 rows was cross-checked at authoring time against the actual seating migrations already applied for these 5 cities (090/097/098 initial seed, 1389/1390 Phase-219 reconcile) and every RESEARCH-sourced full_name matched the currently-seated DB politician for that office — no stale-seat mismatches like Frisco/Celina/Prosper surfaced here."

requirements-completed: [COLLIN-CONTACT-02]

coverage:
  - id: D1
    description: "Migration 1408 authored: idempotent personal email_addresses seeding, 34 seat rows attempted across Parker (6), Saint Paul (6), Weston (6), Lowry Crossing (9), Lucas (7), keyed by geo_id + office title + full_name"
    requirement: COLLIN-CONTACT-02
    verification:
      - kind: other
        ref: "npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --strict (project's actual tsconfig.json flags) on apply-script: clean; test -f migrations/1408_collin_personal_emails_b.sql: exists"
        status: pass
    human_judgment: true
    rationale: "SQL correctness against production schema (office titles, seat->politician_id join, the Parker Place 3 name resolution, and the Lowry Crossing per-person TLD split) cannot be verified without DB access, which this plan does not have (no Supabase MCP). The gated apply-script's g-a..g-e checks must run against live data at apply time (plan 220-06) to confirm actual coverage."

# Metrics
duration: 38min
completed: 2026-07-24
status: complete
---

# Phase 220 Plan 05: Personal Emails B (Parker, Saint Paul, Weston, Lowry Crossing, Lucas) Summary

**Authored migration 1408 — idempotent personal email_addresses seeding across 5 cities (34 seat rows attempted), resolving the Parker Place 3 name ambiguity via cross-reference against prior seating migrations, and preserving Lowry Crossing's Ward 4 .com/.org TLD split as an additive correction alongside the pre-existing (wrong-TLD) entries.**

## Performance

- **Duration:** 38 min
- **Started:** 2026-07-24T21:05:00Z
- **Completed:** 2026-07-24T21:43:00Z
- **Tasks:** 1 completed
- **Files modified:** 2 (both new)

## Accomplishments
- Authored `1408_collin_personal_emails_b.sql`: one idempotent `UPDATE ... FROM (VALUES ...)` join seeding personal emails for Parker (Mayor + Places 1–5, 6 seats), Saint Paul (Mayor + Places 1–5, 6 seats), Weston (Mayor + Places 1–5, 6 seats), Lowry Crossing (Mayor + Places 1–8, 9 seats — Mayor + 4 wards × 2), and Lucas (Mayor + Places 1–6, 7 seats) — 34 seat rows total, transcribed verbatim from 220-RESEARCH.md including every domain gotcha (parkertexas.us, stpaultexas.us, westontexas.com, lucastexas.us, and Lowry Crossing's mixed lowrycrossingtexas.org/.com).
- **Resolved the Parker Place 3 ambiguity RESEARCH flagged.** Rather than guessing between RESEARCH's two conflicting fetches, cross-referenced this codebase's own prior seating migrations: migration 090's header states Parker has exactly "6 seats (Mayor + Place 1-5)" — no Place 6 office exists at all — and migration 1389 explicitly seated "Parker Council Member Place 3 — Buddy Pilgrim (now Mayor Pro Tem)". This conclusively resolves the ambiguity: Buddy Pilgrim is the Place 3 occupant, and RESEARCH's "Place 6" label was an artifact of the live page fetch, not a real second office. Seeded accordingly; matched by the DB's own title+name pairing so an incorrect resolution would have safely no-op'd rather than corrupted data.
- **Preserved the Lowry Crossing per-person TLD split as an additive fix.** Discovered (by reading migrations 098 and 1389) that all 9 Lowry Crossing seats were already seeded with emails by earlier phases — but Ward 4 members Muhanad "G" Hijazen (Place 4) and Ollie Simpson (Place 8) were seeded with the wrong TLD (.org) at that time, contradicting RESEARCH's confirmed .com addresses for those two. This migration appends the correct `.com` addresses alongside the existing (wrong-TLD) `.org` entries rather than deleting/replacing them — removal is out of scope for this data-only, append-only migration (documented as a deferred item below). Agur Rios (Place 6) had no email at all pre-existing and gets one seeded fresh.
- **Confirmed the Saint Paul roster-reshuffle note is already resolved in the DB.** RESEARCH's Pitfall/roster-reshuffle warning (an earlier cached-search snapshot showed Seat 3/4 as Justin Graham / J.T. Trevino-as-alderman, contradicting the live page fetch's Greg Pierson / Kristen Bewley) was already correctly reconciled by prior migrations 098/1390 — the DB's stored full_names for those seats are Greg Pierson and Kristen Bewley, matching the current-roster names, not the stale snapshot. The full_name guard confirms this rather than assuming it.
- **Used case-insensitive email-presence checking** (`NOT EXISTS (SELECT 1 FROM unnest(...) WHERE lower(existing) = lower(v.email))`) rather than sibling 1407's exact-string array-containment, after discovering several already-seeded addresses differ from RESEARCH's transcribed casing only by letter case (J.T. Trevino: DB `jt.trevino@` vs. RESEARCH `JT.trevino@`; Jonathan Underhill: DB `junderhill@` vs. RESEARCH `JUnderhill@`). This avoids seeding functionally-redundant duplicate casing variants while remaining a true idempotency guard.
- Zero "known-possible-skip" rows in this batch, unlike sibling 1407's 5 — every one of the 34 rows was cross-checked against prior seating migrations (090, 097, 098, 1389, 1390) at authoring time and every RESEARCH full_name matched the DB's currently-seated politician for that office.
- Authored the gated apply-script (`_apply-migration-1408_collin_personal_emails_b.ts`, gitignored per `backend/scripts/_*` convention): gate g-a (34/34 required rows present, case-insensitive check), g-b (0 generic catch-all local-parts — info@/cityhall@/townhall@/publiccomments@/contact@/council@ — across the 5 geo_ids), g-c (`inform.politician_answers` row count unchanged), g-d (split-section check returns 0 rows), g-e (idempotent re-run: no lost/duplicated/changed emails across all 34 rows), plus an informational (non-gating) already-present-vs-newly-appended count for transparency.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author migration 1408 (personal emails B) + gated apply-script** - `19014bc7` (feat, in `C:/EV-Accounts`)

**Plan metadata:** committed separately in `essentials` (see below).

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/1408_collin_personal_emails_b.sql` - Idempotent personal-email `email_addresses` seeding for Parker (6/6), Saint Paul (6/6), Weston (6/6), Lowry Crossing (9/9, including the additive Ward-4 TLD correction), Lucas (7/7)
- `C:/EV-Accounts/backend/scripts/_apply-migration-1408_collin_personal_emails_b.ts` - Gated apply-script (gitignored, not committed to git) with gates g-a..g-e; ready for the operator to run in plan 220-06

## Decisions Made
- Parker Place 3 resolved to Buddy Pilgrim by cross-referencing migration 090 (Parker has no Place 6 office) + migration 1389 (Place 3 = Buddy Pilgrim, now Mayor Pro Tem) rather than guessing from RESEARCH's ambiguous page-order fetch.
- Case-insensitive email-presence guard adopted (deviation from 1407's exact-match pattern) after discovering multiple casing-only mismatches between RESEARCH's transcription and the DB's already-seeded values.
- Lowry Crossing's Ward-4 `.org`→`.com` correction seeded additively (both entries end up present), not as a replace/delete — consistent with this migration's append-only, non-destructive scope.
- Did not flag any row as a "known-possible-skip" — this batch's 5 cities had no unresolved May-2026 election reseating gaps analogous to 1407's Frisco/Celina/Prosper findings.

## Deviations from Plan

**1. [Rule 1 - Bug, scoped] Discovered pre-existing wrong-TLD emails for Lowry Crossing Ward 4 (Hijazen, Simpson) seeded by an earlier phase; did not remove them.**
- **Found during:** Task 1, while cross-referencing Lowry Crossing's seating migrations (098, 1389) to confirm office-title/full_name ground truth.
- **Issue:** Migration 1389 (Phase 219, already applied to production) seeded Muhanad "G" Hijazen (Place 4) and Ollie Simpson (Place 8) with `@lowrycrossingtexas.org` addresses. 220-RESEARCH.md's more careful investigation this phase confirms these two Ward-4 members actually use `@lowrycrossingtexas.com` — the `.org` addresses already in production are wrong.
- **Fix scope:** This migration appends the correct `.com` address for each (per its stated append-only, idempotent, non-destructive contract — D-07). It does NOT delete or replace the pre-existing `.org` entries; doing so would be a `DELETE`/array-element-removal operation outside this migration's declared shape and outside this plan's task scope (the plan's action describes appending, not correcting prior migrations). Documented here rather than silently fixed, per the SCOPE BOUNDARY rule (the wrong `.org` entries were introduced by migration 1389 in a prior phase, not by this task).
- **Files modified:** `C:/EV-Accounts/backend/migrations/1408_collin_personal_emails_b.sql` (adds `.com` rows), `C:/EV-Accounts/backend/scripts/_apply-migration-1408_collin_personal_emails_b.ts`
- **Commit:** `19014bc7`
- **Recommended follow-up (not blocking):** a small corrective migration (mirroring mig 1409's idiom) could remove the stale `@lowrycrossingtexas.org` entries for Hijazen/Simpson once the `.com` addresses are confirmed live, so each carries only their correct address. Flagged for 220-06 close-out consideration, not required for this plan's completion.

No other deviations — the rest of the plan (per-person TLD verbatim transcription, idempotency shape, D-02 catch-all guard, Parker Place 3 resolution) executed exactly as written.

## Issues Encountered
- The plan's literal verification command (`npx tsc --noEmit scripts/....ts`, no flags) reported `esModuleInterop`/top-level-await errors — confirmed as the known false positive called out in the task prompt by reproducing the identical error set against the pre-existing, already-committed sibling migration 1407's apply-script. Re-ran with the project's actual `tsconfig.json` compiler flags (`--target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --strict`), which passed clean. Root cause (consistent with 220-03/220-04's finding): `backend/tsconfig.json`'s `include` is scoped to `src/**/*`, so a bare `tsc <file-outside-src>` falls back to TS's older compiler-option defaults instead of the project's real config.
- **Discovered but NOT fixed (documented as a deviation above, Rule 1 scoped-out):** Lowry Crossing Ward 4's pre-existing wrong-TLD (`.org`) emails for Hijazen and Simpson, seeded by migration 1389 in a prior phase. This migration adds the correct `.com` addresses alongside them rather than removing the wrong ones, since removal is outside this append-only migration's scope. Flagged for optional cleanup consideration at 220-06 close-out.

## Known Stubs
None.

## Threat Flags
None — this migration only writes to `essentials.politicians.email_addresses` on pre-existing rows, matching the phase's already-modeled trust boundary (pre-sourced RESEARCH table → migration SQL → production essentials schema); no new network endpoints, auth paths, or schema changes.

## User Setup Required

None - no external service configuration required. The migration and apply-script are authoring artifacts only; the operator applies them in plan 220-06 via Supabase MCP.

## Next Phase Readiness
- Migration 1408 is ready for Wave 3 (plan 220-06) application alongside 1405, 1406, 1407 (and 1410 if needed), per the 220-PREFLIGHT.md locked migration-number map.
- **Follow-up recommended before or during 220-06 close-out (not blocking):** consider a small corrective migration removing the stale `@lowrycrossingtexas.org` entries for Hijazen/Simpson once their correct `.com` addresses are confirmed live in production.
- No blockers to this plan's own deliverable. This plan's output is authoring-only (no DB writes performed by this agent, no Supabase MCP access).

---
*Phase: 220-contact-data-backfill*
*Completed: 2026-07-24*

## Self-Check: PASSED
- FOUND: C:/EV-Accounts/backend/migrations/1408_collin_personal_emails_b.sql
- FOUND: C:/EV-Accounts/backend/scripts/_apply-migration-1408_collin_personal_emails_b.ts
- FOUND: commit 19014bc7 (C:/EV-Accounts)
