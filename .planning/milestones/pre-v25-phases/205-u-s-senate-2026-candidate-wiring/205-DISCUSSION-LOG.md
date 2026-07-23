# Phase 205: U.S. Senate 2026 Candidate Wiring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-15
**Phase:** 205-u-s-senate-2026-candidate-wiring
**Areas discussed:** Verification depth, Migration reviewability, Seat-map review gate, Special-election handling

---

## Verification depth

| Option | Description | Selected |
|--------|-------------|----------|
| DB parity + live sample | DB parity queries (all races) + real in-state address test on 3+ sample states | ✓ |
| DB queries only | SQL-only linkage + before/after diff; no live UI check | |
| Full live sweep | Address-test every mapped state (~35) | |

**User's choice:** DB parity + live sample
**Notes:** Confirms the actual user-facing surfacing path without testing all 35 states.

---

## Migration reviewability

| Option | Description | Selected |
|--------|-------------|----------|
| Committed idempotent SQL | Checked-in re-runnable `supabase/migrations/NNN_*.sql` with explicit state→incumbent→office_id map; applied after spot-check | ✓ |
| Ad-hoc via MCP | Apply UPDATEs directly via Supabase MCP; map documented only in the plan | |

**User's choice:** Committed idempotent SQL
**Notes:** Auditable in git and re-runnable; matches on-disk migration convention.

---

## Seat-map review gate

| Option | Description | Selected |
|--------|-------------|----------|
| Blocking checkpoint | Execution pauses; user approves the full state→seat table before any UPDATE runs | ✓ |
| Async artifact review | Commit seat-map as artifact; user reviews later, then apply | |

**User's choice:** Blocking checkpoint
**Notes:** Same pattern as the 204-04 human-verify checkpoint.

---

## Special-election handling

| Option | Description | Selected |
|--------|-------------|----------|
| Link to appointee seat, flag in map | Link special-election races to the appointee's current seat office (OH→Husted, FL→Moody); mark SPECIAL in the review table | ✓ |
| Flag & skip specials | Skip specials for manual resolution; auto-link only Class 2 | |

**User's choice:** Link to appointee seat, flag in map
**Notes:** Appointee seat office is the correct statewide geography; specials flagged for eyeballing at the checkpoint.

---

## Claude's Discretion

- None left undecided — all four selected areas resolved to the recommended option.

## Deferred Ideas

- Stray `Candidate for U.S. Senate — {State}` office cleanup (data-hygiene follow-on).
- Senate candidate headshots.
- Senate candidate compass stances.
- Backfilling any Senate races/candidates not yet seeded.
