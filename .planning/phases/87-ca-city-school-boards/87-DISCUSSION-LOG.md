# Phase 87: CA City School Boards - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 87-ca-city-school-boards
**Areas discussed:** Multi-ISD gap handling, Plan structure

---

## Multi-ISD Gap Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Document the gap, stay in scope | Seed only the 6 named districts per requirements. Add a comment in the migration noting the coverage gap. A future phase could add secondary ISDs for SJ and Sacramento. | ✓ |
| Add secondary ISDs now | Expand scope to include East Side Union, Evergreen, Natomas, Twin Rivers, etc. alongside the named districts. Bigger phase but more complete coverage. | |
| You decide | Claude handles it — use your judgment on the right tradeoff. | |

**User's choice:** Document the gap, stay in scope
**Notes:** SJUSD doesn't cover all of San Jose; Sacramento City Unified doesn't cover all of Sacramento. A future phase can expand if needed.

---

## Plan Structure

| Option | Description | Selected |
|--------|-------------|----------|
| 2 plans — seed + headshots | Plan 1 (migration 257): all 6 government bodies + officials in one SQL + smoke test. Plan 2 (migration 258): headshots audit-only. Matches Phase 86 structure. | ✓ |
| 3 plans — geofence verify + seed + headshots | Add Plan 1 to explicitly verify/document the 6 GEOIDs before seeding. Adds safety gate but extra overhead for a step already confirmed. | |

**User's choice:** 2 plans — seed + headshots
**Notes:** All 6 G5420 geofences confirmed present in production DB on 2026-06-01. No loader script needed. Pure SQL phase.

---

## Claude's Discretion

None — all decisions were made explicitly by the user.

## Key Findings (pre-discussion)

- All 6 CA G5420 geofences already exist (353 total CA TIGER rows). Confirmed GEOIDs: SF=0634410, SD=0634320, Sacramento=0633840, SJ=0634590, Fremont=0614400, Berkeley=0604740.
- San Diego's TIGER name is "San Diego City Unified School District" — official name differs (SDUSD). Researcher uses official name for government body.
- Latest migration is 256. Phase 87 starts at 257.

## Deferred Ideas

- Secondary ISDs for SJ and Sacramento (East Side Union, Evergreen, Natomas, Twin Rivers) — future phase
- School board elections (2026 race rows) — future phase
