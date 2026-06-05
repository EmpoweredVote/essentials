# Phase 92: MD State Government DB - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-05
**Phase:** 92-md-state-government-db
**Areas discussed:** LG chamber modeling, State Treasurer scope

---

## LG Chamber Modeling

| Option | Description | Selected |
|--------|-------------|----------|
| Own chamber + district | Same pattern as Governor — 'Lieutenant Governor' chamber under State of Maryland, 'Maryland Lieutenant Governor' STATE_EXEC district. Matches her independent constitutional role. | ✓ |
| Under Governor's chamber | No separate LG chamber — Miller gets an office in the Governor's chamber instead. Simpler migration but collapses two distinct roles. | |

**User's choice:** Own chamber + district (recommended)
**Notes:** MD LG chairs the Board of Public Works and has independent constitutional duties. This modeling is consistent with how other strong LG roles are handled. Result: 5 chambers total (not 4 as originally stated in ROADMAP success criteria).

---

## State Treasurer Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Seed Dereck Davis now | Create politician + office + headshot in Phase 92 while migration is open. Completes full executive branch in one shot. | ✓ |
| Just the chamber, politician later | Create only the Treasurer chamber per ROADMAP success criteria. Dereck Davis seeded in a future phase. | |

**User's choice:** Seed Dereck Davis now (recommended)
**Notes:** Consistent with ME and OR precedent where appointed officials were seeded at chamber creation time. Davis is elected by General Assembly (is_appointed_position=true). Result: 5 politicians seeded in Phase 92 (not 4).

---

## Claude's Discretion

- Chamber naming convention (follow OR pattern: short name + state-qualified name_formal)
- External ID numbering (-240001 through -240005)
- Migration structure (2 migrations: chambers first, officials second)
- Exact headshot sources (governor.maryland.gov + attorney-general.maryland.gov; Wikipedia fallback)
- Exact next migration number (verify by listing directory before writing)
- Pre-flight assertion structure

## Deferred Ideas

None — discussion stayed within phase scope.
