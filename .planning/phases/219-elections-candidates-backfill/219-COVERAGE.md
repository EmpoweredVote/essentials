# Phase 219: Elections & Candidates Backfill — Coverage Roll-Up

**Phase gate for COLLIN-ELECT-01 / COLLIN-ELECT-02 / COLLIN-ELECT-03.**
**Status: PASS** (24/24 governments reconciled; the sole zero-race government, Melissa, is a documented legitimately-open exception, not a defect).

Consolidates the per-migration gates from Plans 219-02 through 219-08 into a single authoritative roll-up, applied by the orchestrator against production across migrations 1393-1399.

---

## 1. Phase-wide invariants (all 24 governments)

| Invariant | Result |
|---|---|
| Zero-candidate shells | **0** |
| Races with non-NULL `primary_party` (antipartisan, D-06) | **0** |
| Races linked to a future-dated election (`election_date > CURRENT_DATE`, D-02) | **0** |
| `inform.politician_answers` row count (before Wave 2 → after migrations 1393-1399) | **34215 → 34215 (unchanged, D-07)** |

Net new this phase: **37 races / 54 candidates** across migrations 1393-1399.

---

## 2. 24-government roll-up

Columns: tier | geo_id | name | offices | races | raced_offices | candidates.

### Zero-race tier (12 governments)

| geo_id | Government | Offices | Races | Raced Offices | Candidates | Status |
|---|---|---|---|---|---|---|
| 4808872 | Blue Ridge | 6 | 3 | 3 | 3 | Covered |
| 4825488 | Farmersville | 6 | 2 | 2 | 2 | Covered |
| 4838068 | Josephine | 6 | 3 | 3 | 6 | Covered |
| 4841800 | Lavon | 6 | 3 | 3 | 5 | Covered |
| 4845744 | McKinney | 7 | 6 (4 general + 2 runoff) | 4 | 11 | Covered |
| 4847496 | Melissa | 7 | 0 | 0 | 0 | **Documented legitimately-open** (see §4) |
| 4850760 | Nevada | 6 | 3 | 3 | 3 | Covered |
| 4858016 | Plano | 9 | 1 (Place 7 special) | 1 | 1 | Covered (Place 6 = documented vacancy, no race — see §4) |
| 4861796 | Richardson | 7 | 2 | 2 | 5 | Covered |
| 4864220 | Saint Paul | 6 | 6 | 6 | 7 | Fully covered |
| 4874924 | Van Alstyne | 7 | 2 | 2 | 3 | Covered |
| 4877740 | Weston | 6 | 1 | 1 | 1 | Covered |

### Thin tier (12 governments)

| geo_id | Government | Offices | Races | Raced Offices | Candidates | Status |
|---|---|---|---|---|---|---|
| 4801924 | Allen | 7 | 2 | 2 | — | Covered (thin, [OPEN] remainder documented §4) |
| 4803300 | Anna | 7 | 2 | 2 | — | Covered (thin, [OPEN] remainder documented §4) |
| 4813684 | Celina | 7 | 3 | 3 | — | Covered (thin, [OPEN] remainder documented §4) |
| 4827684 | Frisco | 7 | 4 | 4 | — | Covered (thin, [OPEN] remainder documented §4) |
| 4843888 | Longview | 7 | 3 | 2 | — | Covered (2 raced_offices — D3 general+runoff share one office; D3 seating gap flagged §5) |
| 4844308 | Lowry Crossing | 9 | 1 | 1 | — | Covered (thin, [OPEN] remainder documented §4) |
| 4845012 | Lucas | 7 | 2 | 2 | — | Covered (thin, [OPEN] remainder documented §4) |
| 4850100 | Murphy | 7 | 3 | 3 | — | Covered (thin, [OPEN] remainder documented §4) |
| 4855152 | Parker | 6 | 2 | 2 | — | Covered (+ 3 photo-links, no new race — see §4) |
| 4859576 | Princeton | 8 | 2 | 1 | — | Covered (1 raced_office — Place 4 special+runoff share one office) |
| 4825224 | Fairview | 7 | 3 | 3 | — | Covered (thin, [OPEN] remainder documented §4) |
| 4859696 | Prosper | 7 | 2 | 2 | — | Covered (thin, [OPEN] remainder documented §4; geo_id corrected — see §6) |

*(Candidate counts for the thin tier were not re-tallied government-by-government in this roll-up's authored form — the phase-wide invariant checks in §1, run via `_verify-219-coverage.ts`, cover zero-candidate-shell and antipartisan checks per-race across all 24 governments. The orchestrator's live run of the verify script prints exact per-government candidate counts on each execution.)*

---

## 3. Requirement status

| Requirement | Status | Basis |
|---|---|---|
| **COLLIN-ELECT-01** — 12 zero-race governments seeded with most-recent/next races + candidates where public records exist | **MET** | 11 of 12 zero-race governments now carry >=1 race with candidates. Melissa is the sole exception, documented legitimately-open (§4) — no cited election-result roster exists for either of its real reference cycles this session. |
| **COLLIN-ELECT-02** — Thin cities reviewed and backfilled where a known election exists for a seat | **MET** | All 12 thin governments reconciled against RESEARCH's per-city table. Every remaining race-less office in the thin tier carries a cited reason (§4) — either a term-date-only citation (SOURCED-ONLY policy, insufficient to seed) or a staggered off-cycle term not yet independently sourced. No fabricated race exists anywhere in this phase. |
| **COLLIN-ELECT-03** — Every seeded race links to the correct office, renders on `/results`, no split-section/zero-candidate-shell defects | **MET** | 0 zero-candidate shells, 0 non-NULL `primary_party`, 0 future-dated races, phase-wide (§1). Split-section check clean (verified per-migration by each apply-script's gate f, and re-checkable via `_verify-219-coverage.ts`). |

---

## 4. Remaining documented-[OPEN] offices (legitimately-open, not defects)

Per 219-RESEARCH.md Pitfall 4 ("0 unseated offices != races complete") and the operator's SOURCED-ONLY ruling (219-07/219-08): a known, currently-seated officeholder with only a **term-start-date** citation (not an independent election-outcome finding) is NOT sufficient evidence to seed a race. Every office below has a real officeholder but no independently-sourced election citation this session, or is out of this backfill's cheap-research horizon (staggered multi-year term histories). None of these are counted as defects against COLLIN-ELECT-01/02.

### Zero-race tier remainders

| Government | Documented-[OPEN] offices | Reason |
|---|---|---|
| Blue Ridge | Places 2, 3, 4 (Braly, Sissom, Mattingly) | Confirmed "Term ends May 2027" — not up in the May 2026 cycle. |
| Farmersville | Mayor, Place 2, Place 4, Place 5 | Not among the seats filed for the cancelled May 2026 ballot (city's own cancellation notice). |
| Josephine | Mayor, Place 3 (Turney, Esquivel) | No citation of any election found this session. |
| Josephine | Place 5 (Chappell) | Continuing incumbent, not up this cycle. |
| Lavon | Places 1, 3, 5 (Shepard, Jacob, Hedge) | Not on the Nov-2025 ballot per sourced race pages. |
| McKinney | Council Member District 2, District 4, At-Large Place 2 | Not confirmed up in the 2025 cycle this session. |
| **Melissa** | **All 7 offices** (Mayor + Place 1-6) | **No cited election-result roster found for either real reference cycle (fallback 2025-05-03 or fallback 2024-05-04). Only the current officeholder roster exists (not an election-result citation). Deferred to a future canvass-sourced reconcile phase.** |
| Nevada | Places 3, 4, 5 (Wilson, Laughter, Little) | Odd-year election cycle per city's own elections page; last elected 2025, expires 2027. |
| Plano | Mayor, Places 1-5, 8 | Staggered 2023-2025 term history — legitimately out of this backfill's cheap-research horizon (RESEARCH.md Pitfall 3). |
| **Plano Place 6** | **No race** | **Documented genuine vacancy (migration 1392) — distinct from an [OPEN] research gap; correctly seeded with zero races, enforced by a dedicated apply-script gate in migration 1396.** |
| Richardson | Places 1, 2, 3, 4, 5 | Not independently re-verified this session. |
| Van Alstyne | Places 1-5 | No citation of any 2026-05-02 (or other) election found this session. |
| Weston | Mayor, Places 1-4 | Migration-098 placeholder May-cycle term dates don't match Weston's confirmed November voting cycle; no independent citation. |

### Thin tier remainders (41 offices, SOURCED-ONLY exclusions)

| Government | Documented-[OPEN] offices | Reason |
|---|---|---|
| Allen | Places 1, 3, 4, 5, 6 | Term-date-only citation; no independent election-outcome finding (SOURCED-ONLY, 219-07). |
| Anna | Mayor, Places 1, 2, 4, 6 | Term-date-only citation. |
| Lucas | Mayor, Places 3, 4, 5, 6 | Term-date-only citation. |
| Murphy | Places 1, 2, 4, 6 | Term-date-only citation. (Murphy Mayor WAS seeded — migration 096's own header names the election outcome, not just a term date.) |
| Prosper | Mayor, Places 1, 2, 4, 6 | Term-date-only citation. |
| Parker | Places 1, 2, 4 (Bogdan, Halbert, Sharpe) | Term-date-only citation (migration 098). |
| Celina | Places 1, 2, 3, 6 (Ferguson, Cawlfield, Hopkins, Grumbles) | Term-date-only citation. |
| Frisco | Places 2, 3, 4 (Thakur, Pelham, Elad) | Term-date-only citation. (Frisco Place 1 WAS seeded — migration 094's own header explicitly states "won special election... elected, not appointed," an election-outcome citation, not just a term date.) |
| Fairview | Mayor, Seat 1, Seat 3, Seat 5 (Hubbard, Connelly, Hawkins, Sheehan) | Term-date-only citation. |
| Lowry Crossing | Mayor, Places 1, 2, 3, 5, 6, 7 | Term-date-only citation; Places 5/6/7 explicitly flagged in migration 1389 as "DB-gap continuing incumbent" (an inference, not a citation). |

If a future session gains real canvass/news access for any of these seats' actual elections, a follow-up migration can seed them with genuine citations without touching any race seeded by this phase.

---

## 5. Longview D3 seating gap (operator decision, not resolved this phase)

Longview Council Member District 3's `offices.politician_id` still holds over **Wray Wade** (the prior officeholder), while the cited, sourced runoff winner of the June 13, 2026 D3 runoff is **Brandon Smith** (confirmed alongside Marlena Cooper's runner-up position in the general race, migration 1397). This migration seeded the race + candidates correctly (Smith and Cooper, both `politician_id = NULL` since neither is currently the seated officeholder) but deliberately did **not** update `offices.politician_id` — that UPDATE is out of this phase's races/candidates-only scope and is explicitly an operator call per 219-PREFLIGHT.md §5's carried-forward recommendation and 219-06's SUMMARY.

**Flagged, not resolved.** If the operator wants Smith seated as the officeholder (matching the Phase-218-style seating pattern), a small follow-up UPDATE migration is required — not bundled into this phase.

---

## 6. Prosper geo_id correction

Prosper's real geo_id is **4859696** (Town of Prosper). Earlier drafts (219-07's initial migration draft) used **4863276**, which is stale/incorrect. Since the final, applied migrations seed nothing new for Prosper beyond its pre-existing thin-tier races, no SQL in migrations 1393-1399 references the incorrect value — this correction is recorded here so any future Prosper reconcile phase queries the correct geo_id (4859696), not 4863276.

---

## 7. Future reconcile notes

- **Melissa** needs a future canvass-sourced reconcile — no cited election-result roster exists for either real reference cycle this session; only the current officeholder roster (not an election-result citation) was available.
- **Longview D3 officeholder seating** (Wray Wade → Brandon Smith) needs an operator decision + a small follow-up UPDATE migration if the operator chooses to seat the winner now.
- **41 thin-tier [OPEN] offices** (§4) and **the zero-race-tier's remaining term-date-only offices** are all candidates for live-WebSearch sourcing in a future session that has WebSearch/WebFetch tooling available — none was fabricated or guessed this phase (SOURCED-ONLY policy, operator-directed 219-07/219-08).
- **Murphy Mayor's `politicians` table term dates remain stale** (`valid_to='2026-05-01'`, per migration 096's own never-executed TODO to bump to 2029) — out of this phase's races/candidates-only scope, flagged as an in-passing note (219-07 SUMMARY).

---

*Phase: 219-elections-candidates-backfill*
*Coverage roll-up authored: 2026-07-24*
*Verify script: `C:/EV-Accounts/backend/scripts/_verify-219-coverage.ts` (read-only, re-runnable)*

---

## Post-Close Sourcing Reconcile (2026-07-24, operator-approved)

After phase close, the operator approved sourcing the documented-[OPEN] inference-only seats via live WebSearch (Collin/Denton County official canvass exports + city certifications), evidence-only. Seeded as migrations 1401-1403:

| Migration | Scope | Races / Candidates |
|-----------|-------|--------------------|
| 1400 | Longview D3 seating: reseat Brandon Smith (runoff winner), retire hold-over Wray Wade | — (seating fix) |
| 1401 | Melissa city council (was the one zero-race city) — 5 sourced seats (Mayor + P1/2/3/4); P5/P6 [OPEN] | 5 / 8 |
| 1402 | Allen/Anna/Lucas/Murphy/Prosper — all 24 inference-only seats sourced from official canvass | 24 / 44 |
| 1403 | Celina/Frisco/Lowry Crossing — 14 sourced seats | 14 / 22 |
| **Reconcile total** | | **43 / 74** |

**Grand phase total (219 proper + reconcile): ~80 races / ~128 candidates across 24 governments.**

### Data-correction flag (surfaced, NOT auto-applied)
- **Frisco Place 4**: official Collin County June-7-2025 runoff canvass (double-verified) shows **Gopal Ponangi won** (53.89%–46.11%) over Jared Elad. The DB seats **Jared Elad** (the loser). Migration 1403 seeds the race correctly (Ponangi winner name-only, Elad loser linked) but does NOT change `offices.politician_id`. **Operator decision owed**: reseat Ponangi / retire Elad (a Phase-218-style seating action, like the Wade→Smith fix in 1400).

### Remaining documented-[OPEN] after reconcile (honest gaps, not defects)
- **Parker P1/P2/P4** — sourced (2025-05-03 at-large: Bogdan/Sharpe/Halbert won top-3 of 6) but Parker uses a single vote-for-N at-large contest that doesn't map to the per-Place office model without confusing duplicate data; deferred rather than mis-modeled.
- **Fairview Mayor/Seat 1/3/5** — sourcing too weak for the SOURCED-ONLY bar (canvass-absence + LegiStorm term dates, no primary cancellation/certification doc); needs a Town Secretary records request.
- **Melissa Place 5 / Place 6 (2024)** — absent from county canvass (unopposed-cancellation signature) but no independently-cited candidate name found; needs a City Secretary records request.
- **Genuinely off-cycle seats** from 219 proper (Blue Ridge P2/3/4, Nevada P3-5, Farmersville's other seats, etc.) — staggered terms not up in the seeded reference window; not reconcilable (no recent election exists to source).
