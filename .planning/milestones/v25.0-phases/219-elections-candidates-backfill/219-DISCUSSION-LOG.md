# Phase 219: Elections & Candidates Backfill - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-23
**Phase:** 219-elections-candidates-backfill
**Areas discussed:** Reference election, Uncontested/thin seats, Candidate roster depth, Candidate headshots

---

## Reference election

| Option | Description | Selected |
|--------|-------------|----------|
| Most-recent HELD | Seed the most-recent election each city actually held (certified May 2, 2026 results); matches neighbors, displays now via past-fallback, fully sourced; per-city fallback if off-cycle | ✓ |
| Next upcoming | Seed next scheduled (mostly May 2027); filing not open → empty hidden shells | |
| Both past + upcoming | Seed May 2026 results AND May 2027 shells; shells hidden until candidates; more rows | |

**User's choice:** Most-recent HELD
**Notes:** Grounded in `Results.jsx:1305` — view shows nearest upcoming, falls back to most-recent past. May 2, 2026 races display today and match already-seeded neighbor cities (all on `2026-05-02`).

---

## Uncontested / thin seats

| Option | Description | Selected |
|--------|-------------|----------|
| Seed race, mark unopposed | Create race + single declared-elected candidate (status won/unopposed); avoids zero-candidate shell; makes thin accurate | ✓ |
| Skip — thin is correct | No race where no contested election held | |
| Document only | No race row; note outcome in phase notes only | |

**User's choice:** Seed race, mark unopposed
**Notes:** Texas declares an unopposed candidate elected without a ballot; seeding them (1 candidate) still renders and shows the resident who holds the seat.

---

## Candidate roster depth

| Option | Description | Selected |
|--------|-------------|----------|
| All filed candidates | Every ballot candidate, winners + losers, with candidate_status + is_incumbent; matches neighbor data | ✓ |
| Winners only | Only elected candidate per seat; loses contest picture | |

**User's choice:** All filed candidates
**Notes:** Evidence-only — only candidates who actually filed/appeared, cited.

---

## Candidate headshots

| Option | Description | Selected |
|--------|-------------|----------|
| Incumbents reuse; source challengers where available | Incumbents link existing 218 photo; challengers sourced 600×750 where a real source exists, honest-blank otherwise | ✓ |
| Incumbents only, skip challenger photos | Reuse existing only; challengers left photoless | |
| No candidate headshots this phase | All race_candidate photos deferred | |

**User's choice:** Incumbents reuse; source challengers where available
**Notes:** No fabrication; the 5 known zero-source cities stay blank where no source exists.

---

## Claude's Discretion

- Election-record linkage — reuse the shared `2026-05-02` TX election row vs per-city elections (prefer reuse; confirm at plan/execute).
- Per-city sourcing order / which thin cities to backfill first.

## Deferred Ideas

- Compass stances for these candidates/officials — deferred this milestone (local-compass-question lock).
- Contact data (web_form_url / emails / valid_to) → Phase 220.
- Next-upcoming (May 2027) race shells — revisit once TX 2027 filing opens.
- Reviewed-not-folded todos: gazetteer Ph212 audit, LocationCombobox area-type color-coding, LocationCombobox search refinements — all UI/gazetteer, out of this data-only phase.
