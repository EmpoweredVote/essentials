# Phase 97: MD Compass Stances — Executives + Senators (Wave 1) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-06
**Phase:** 97-md-compass-stances-executives-senators-wave-1
**Areas discussed:** Executive stances strategy, Exec scope, Senator batching structure, Migration strategy

---

## Executive Stances Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Start fresh | Ignore existing CSV, run full research for each exec one at a time (15-20+ topics) | ✓ |
| Validate and supplement | Treat existing CSV as starting point, fill gaps only | |
| Accept as-is, just add IDs | Keep 23 rows, look up politician_ids, feed through gen_migration.py | |

**User's choice:** Start fresh
**Notes:** The existing `2026-06-06-md-officials.csv` is sparse (3-8 topics per official) and lacks politician_ids. Fresh research will produce better coverage.

---

## Executive Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All 5 MD executives | Moore, Miller, Brown, Lierman, AND Davis | ✓ |
| 4 voter-elected execs only | Skip Davis (appointed by General Assembly) | |

**User's choice:** Yes — all 5 MD executives
**Notes:** ROADMAP says "4 exec" but user confirmed Davis should be included since he has a seeded profile page and compass coverage improves it.

---

## Senator Batching Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Two batches: ~25 + 22 | Plans 97-02 and 97-03 | |
| One plan: all 47 senators | Single sequential run | |
| Three batches: ~15/16/16 | Plans 97-02, 97-03, 97-04 | ✓ |

**User's choice:** Three batches (~15/16/16)
**Notes:** Smaller runs provide tighter scope per plan. Exact district cutpoints determined by researcher querying the DB.

---

## Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Rolling: one migration per plan | Migration 282=exec, 283/284/285=senator batches | ✓ |
| End bundle: one migration for everything | All CSVs bundled at the end | |
| Two migrations: exec first, all senators second | Migration 282=exec, 283=all senators | |

**User's choice:** Rolling — one migration per plan
**Notes:** Stances appear in production incrementally; each batch can be verified in the DB before moving on.

---

## Claude's Discretion

- Exact politician_id lookup query for executives
- Senator batch boundary cutpoints (which districts fall in A/B/C)
- Per-senator source strategy (mgaleg, ballotpedia, ontheissues)

## Deferred Ideas

None — discussion stayed within phase scope.
