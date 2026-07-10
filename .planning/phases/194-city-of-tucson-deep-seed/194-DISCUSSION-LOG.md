# Phase 194: City of Tucson Deep-Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-09
**Phase:** 194-city-of-tucson-deep-seed
**Areas discussed:** Ward routing model, Banner subject, Partisan-election handling, Seat & title modeling

---

## Ward routing model

| Option | Description | Selected |
|--------|-------------|----------|
| Per-ward geofences | Source 6 official ward boundaries as custom X-code LOCAL geofences (Pima X0019 pattern); resident sees their one ward member + Mayor; pause+flag fallback | ✓ |
| Whole-city, all 6 | Attach all 6 council members to the Tucson city boundary 0477000 (literal at-large general) | |
| You decide at plan time | Confirm sourceability first, then pick | |

**User's choice:** Per-ward geofences
**Notes:** Despite Tucson's city-wide (at-large) general election, each ward has one designated member who lives in and represents that ward. Per-ward routing is the honest UX. Mayor (at-large) attaches to city boundary 0477000. Multi-ring loader caveat (WR-01) folded in as a blocking verify checkpoint.

---

## Banner subject

| Option | Description | Selected |
|--------|-------------|----------|
| Downtown streetscape | Downtown Tucson street scene (Congress St / historic district, ideally Sentinel Peak or Catalinas backdrop) | ✓ |
| Mission San Xavier del Bac | Iconic mission; caveat: south of city limits on Tohono O'odham Nation | |
| University of Arizona | U of A / Old Main; caveat: reads as "the university" not "the city" | |
| Source best available | Streetscape-first, best-licensed real photo | |

**User's choice:** Downtown streetscape
**Notes:** Chosen to stay distinct from Pima County's Catalinas/Saguaro banner and the AZ-state Phoenix skyline. Real photo, no AI, no aerial.

---

## Partisan-election handling

| Option | Description | Selected |
|--------|-------------|----------|
| Record, never display | Store party in DB (data-honest) but never render per antipartisan UI policy | ✓ |
| Don't store party at all | Omit party entirely | |
| You decide | Follow existing convention for partisan-office officials | |

**User's choice:** Record, never display
**Notes:** Tucson runs partisan municipal elections (unusual for AZ). Party stored for roster/research honesty; antipartisan display rule means it never shows on profiles — no special-casing.

---

## Seat & title modeling

| Option | Description | Selected |
|--------|-------------|----------|
| 7 offices + VM annotation | One City Council chamber: Mayor (LOCAL_EXEC, at-large) + 6 by-ward offices; Vice Mayor = rotating title annotation; vacancy → vacant office | ✓ |
| Mayor separate chamber | Mayor in own single-seat chamber, 6 wards in Council chamber | |
| You decide at plan time | Confirm roster + pick cleanest structure | |

**User's choice:** 7 offices + VM annotation
**Notes:** Vice Mayor rotates annually among sitting members — modeled as a title annotation (Pima Chair / by-district relabel pattern), not a separate seat. Genuine vacancy → vacant office, never a departed member.

---

## Claude's Discretion

- ext_id numbering range + custom X-code for the 6 ward districts (LV/Pima X00xx convention).
- BLOCKING loader-verify checkpoint (WR-01 multi-ring) before loading Tucson wards.
- BLOCKING roster-currency human-verify checkpoint before seeding (Mayor + 6 members + Vice Mayor).
- Structural-vs-audit migration split and plan/wave breakdown.
- Per-official headshot source selection (official .gov portrait preferred).

## Deferred Ideas

- 10 proposed local compass questions / 8 Local Lens topics — until separately reviewed.
- School-board stances — deferred milestone-wide until a school-board badge exists.
- Oro Valley / Marana / Sahuarita / South Tucson deep-seeds — Phases 195–198.
- 2026 Arizona election shells (incl. Tucson-metro local races) — Phase 199.
