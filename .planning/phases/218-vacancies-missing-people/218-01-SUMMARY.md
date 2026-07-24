---
phase: 218-vacancies-missing-people
plan: 01
subsystem: database
tags: [postgres, sql-migration, collin-county-tx, municipal-offices, brownfield-seeding]

requires: []
provides:
  - "6 new essentials.offices rows across 3 Collin County, TX councils that previously had fewer office rows than real seats"
  - "Live-verified seat counts + citations + the locked Lowry Crossing Place->member mapping for Plan 02 to seat people directly"
affects: [218-02, 218-03, 218-04, 218-05]

tech-stack:
  added: []
  patterns:
    - "Structural INSERT...WHERE NOT EXISTS on (chamber_id, title) for adding missing office rows to an already-existing chamber (brownfield, no new government/chamber rows)"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1388_collin_missing_office_rows.sql
  modified: []

key-decisions:
  - "Blue Ridge Place 5 confirmed a genuine 5th seat (not a rename) via live blueridgecity.com/council fetch showing 5 distinct non-mayor members with sequential council1@-council5@ email aliases"
  - "Lowry Crossing Place 5-8 locked as a parallel continuation of the existing single-Place numbering (not a new ward-seat naming scheme), per the plan's locked mapping: Place5=Ward1 2nd member, Place6=Ward2 2nd member, Place7=Ward3 2nd member, Place8=2nd Ward4 winner"
  - "Weston Place 5 confirmed Marla Johnston still the current 6th alderman ~14 months after the original migration comment, via live westontexas.com/page/Mayor_Aldermen fetch"
  - "Josephine Place 5 confirmed already present in the DB (added by someone between May and July 2026, politician_id still NULL) — migration explicitly does NOT touch Josephine"

requirements-completed: [COLLIN-PEOPLE-01]

coverage:
  - id: D1
    description: "6 missing essentials.offices rows added (Blue Ridge Place 5, Lowry Crossing Place 5-8, Weston Place 5), each idempotently guarded and gate-verified"
    requirement: "COLLIN-PEOPLE-01"
    verification:
      - kind: other
        ref: "npx tsx scripts/_apply-migration-1388_collin_missing_office_rows.ts (embedded SQL gates a-e, run twice for idempotency)"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-07-24
status: complete
---

# Phase 218 Plan 01: Missing Office Rows (Blue Ridge, Lowry Crossing, Weston) Summary

**Idempotent structural migration adding 6 essentials.offices rows across 3 Collin County, TX councils whose real seat count exceeded their seeded office-row count — Blue Ridge +1, Lowry Crossing +4, Weston +1 — with all three seat counts re-confirmed against each city's live 2026-07-23 roster page before insert.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-07-24T01:53:00Z (approx)
- **Completed:** 2026-07-24T02:28:00Z (approx)
- **Tasks:** 2
- **Files modified:** 1 (migration SQL, committed to C:/EV-Accounts); apply script is gitignored per repo convention (`backend/scripts/_*`), not committed

## Accomplishments
- Live re-verified all 3 flagged missing-seat assumptions (Blue Ridge charter/rename question, Lowry Crossing naming/mapping, Weston still-current officeholder) against each city's own current roster page, resolving RESEARCH's Open Questions 1 and 2 with direct evidence.
- Confirmed via a read-only DB check that Josephine's Place 5 office row already exists (politician_id NULL) — migration correctly excludes Josephine, satisfying the "not duplicated" must-have.
- Wrote and applied migration 1388, adding exactly 6 new `essentials.offices` rows (all `politician_id IS NULL`, `partisan_type IS NULL`, `district_id IS NULL` — matching every existing Collin office row).
- All 5 embedded apply-script gates passed on first run, and passed again identically on a second full re-run (idempotency proven, not just asserted).
- Pushed migration to `C:/EV-Accounts` `master` — deployed live via Render.

## Task Commits

1. **Task 1: Blocking evidence re-verify of the 3 missing-seat questions + resolve naming** - research/verification only, no file writes, no commit (per plan `<files>` note).
2. **Task 2: Write + apply structural migration adding the 6 missing office rows** - `0c738e90` (feat, C:/EV-Accounts repo)

**Plan metadata:** (this SUMMARY + STATE.md + ROADMAP.md commit, essentials repo — see final commit below)

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/1388_collin_missing_office_rows.sql` - idempotent structural migration adding 6 office rows (Blue Ridge Place 5; Lowry Crossing Place 5/6/7/8; Weston Place 5)
- `C:/EV-Accounts/backend/scripts/_apply-migration-1388_collin_missing_office_rows.ts` - apply script with 5 embedded gates (per-city office-count, idempotent re-run, split-section, no-premature-politician_id, Josephine-not-duplicated); gitignored by repo convention (`backend/scripts/_*`), not committed to git, kept on disk for potential re-run

## Live-Verified Seat Counts + Citations (for Plan 02)

### Blue Ridge, TX (geo_id 4808872)
- **Live source:** `blueridgecity.com/council`, fetched 2026-07-23 (curl).
- **Confirmed roster:** Mayor Rhonda Williams (mayor@) + 5 non-mayor council members with sequential email aliases: Linda Braly — Mayor Pro Tem (council2@), David Apple — Councilmember (council1@), Trenton Sissom — Councilmember (council3@), Wendy Mattingly — Councilmember (council4@), Keith Chitwood — Council Member (council5@).
- **Resolution of A5/Open-Q2:** the sequential council1@ through council5@ numbering is strong direct evidence of 5 distinct, intentionally-numbered seats, not a renamed existing member — **genuine 5th seat confirmed**, not a charter-vs-DB-undercount ambiguity requiring further research.
- **DB state pre-migration (read-only check):** only Place 1-4 existed (Place 1 unseated, Place 2/3/4 seated). Place 5 = Keith Chitwood, to be seated in Plan 02.

### Lowry Crossing, TX (geo_id 4844308)
- **Live source:** `lowrycrossingtexas.org/operations/city_council.php`, fetched 2026-07-23 (curl).
- **Confirmed roster:** Mayor Pat Kelly (pkelly@) + Ward 1: Scott Pitchure (pitchure@) + Chris Madrid — Treasurer (cmadrid@); Ward 2: Tammy Hodges — Mayor Pro Tem (thodges@) + Agur Rios; Ward 3: Eusebio "Joe" Trujillo III (etrujillo@) + Cindy Cash (ccash@); Ward 4: Muhanad "G" Hijazen (Ghijazen@) + Ollie Simpson (osimpson@). Exactly 8 non-mayor council seats confirmed live, matching RESEARCH exactly.
- **DB state pre-migration:** only Place 1-4 existed (one per ward: Pitchure→P1 seated, Hodges→P2 seated, Trujillo→P3 seated, P4 unseated/vacant).
- **LOCKED mapping for Plan 02 (per plan's Task 1 instruction, not left to executor judgment):**
  - Place 5 = Ward 1 2nd member = **Chris Madrid**
  - Place 6 = Ward 2 2nd member = **Agur Rios**
  - Place 7 = Ward 3 2nd member = **Cindy Cash**
  - Place 8 = 2nd Ward 4 winner = **Hijazen or Simpson** (whichever is NOT the pre-existing Place 4 occupant — Plan 02 must resolve this from the May-2026 Ward-4 special-election notice at `lowrycrossingtexas.org/operations/elections.php` before seating both Place 4 and Place 8)
  - The pre-existing `Council Member Place 4` row keeps the FIRST Ward 4 winner; the new `Place 8` row is for the SECOND Ward 4 winner. Both Hijazen and Simpson are confirmed current members per the live fetch — Plan 02 only needs to determine which name goes in which row.

### Weston, TX (geo_id 4877740)
- **Live source:** `westontexas.com/page/Mayor_Aldermen`, fetched 2026-07-23 (curl).
- **Confirmed roster:** Mayor Matthew Marchiori (Term Expires Nov 2027) + 5 aldermen: Jeff Metzger (Term Expires Nov 2026), Patti Harrington (Term Expires Nov 2027), Brian M. Roach — Mayor Pro Tem (Term Expires Nov 2027), Mike Hill (Term Expires Nov 2026), **Marla Johnston (Term Expires Nov 2026)**.
- **Resolution of A6:** Marla Johnston **is still the current 6th alderman** ~14 months after the original migration-098 comment — directly re-confirmed, not assumed.
- **DB state pre-migration:** only Place 1-4 existed, all seated. Place 5 = Marla Johnston, to be seated in Plan 02. (Note: Mayor Matthew Marchiori's name was not previously flagged in RESEARCH — out of scope for this plan since Mayor was already seated; noted here for Plan 02/220 awareness in case the seated Mayor politician row needs a name-accuracy check.)

### Josephine, TX (geo_id 4838068) — confirmed NOT touched
- **Read-only DB check (no live fetch needed — internal state, not a roster claim):** `Council Member Place 5` office row already exists (added by someone between May and July 2026), `politician_id IS NULL`. Migration 1388 correctly excludes Josephine entirely; Plan 02 seats Gary Chappell into this pre-existing row.

## Decisions Made
- Used the same `INSERT ... SELECT ... WHERE NOT EXISTS` idempotent pattern from RESEARCH's "Pattern: Missing office-row creation," extended to a `CROSS JOIN (VALUES ...)` for Lowry Crossing's 4 new rows in a single statement rather than 4 separate `INSERT` blocks — reduces duplication while keeping the same guard semantics.
- Confirmed the on-disk migration counter (`ls .../migrations | sort -t_ -k1 -n | tail`) showed 1387 as the last committed file — 1388 was free and used as planned, no drift since RESEARCH.
- Kept the apply script on disk (gitignored per `backend/scripts/_*` convention, matching the established precedent of `_apply-migration-1213.ts` which is also untracked) rather than force-adding it — no deviation from repo convention needed.

## Deviations from Plan

None - plan executed exactly as written. All 3 live re-verifications confirmed RESEARCH's findings with no discrepancies requiring a STOP (Task 1's "if the live page shows only 4 non-mayor members, STOP" condition was never triggered — Blue Ridge showed exactly 5).

## Issues Encountered
- Initial `curl -o /tmp_scratch_*.html` calls failed (exit 23, permission denied writing to filesystem root) — redirected output to the session scratchpad directory instead, which resolved it immediately. No impact on findings.

## User Setup Required

None - no external service configuration required. Migration deployed via `git -C "C:/EV-Accounts" push origin master` (Render auto-deploy from `master`), consistent with `[[backend_architecture]]` / `[[no_git_in_ev_accounts]]`.

## Next Phase Readiness

Plan 02 can now seat people directly into all 6 new rows plus the pre-existing Josephine Place 5 row, using the live-verified names and the locked Lowry Crossing Place 5-8 -> member mapping recorded above. The only remaining open item for Plan 02 is resolving which of Hijazen/Simpson occupies the pre-existing Place 4 row vs. the new Place 8 row (both are confirmed current Lowry Crossing council members; only the row assignment needs resolving via the Ward-4 special-election notice).

No blockers. Split-section gate clean; no new office row has a premature `politician_id`; Josephine not duplicated; idempotency proven via two full re-runs producing identical counts.

---
*Phase: 218-vacancies-missing-people*
*Completed: 2026-07-24*
