# Phase 78: CA Playbook Retrospective - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 78-ca-playbook-retrospective
**Areas discussed:** GOTCHA scope, Placement strategy, Cities Onboarded table, Milestone close scope

---

## GOTCHA scope

| Option | Description | Selected |
|--------|-------------|----------|
| All extras (recommended) | Include all CA-specific traps: pre-existing seed, state casing, mtfcc swap, external_id conflict, DataSF vs ArcGIS, SF consolidated city-county, Berkeley RCV punt — plus the 6 roadmap-required topics | ✓ |
| Only the silent-fail traps | Just the traps producing no error but wrong data: pre-existing seed, state casing, mtfcc swap | |
| Roadmap 6 only | Stick exactly to the 6 success-criteria topics | |

**User's choice:** All extras
**Notes:** User selected the recommended option — document all CA-specific traps, not just the roadmap minimum. The silent-fail traps (pre-existing seed with NULL geo_id, mtfcc swap, state casing) are the most dangerous because they produce no error but yield routing bugs or constraint violations.

---

## Placement strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Both — inline + CA summary section (recommended) | CA annotations woven into relevant steps + "California Quick Reference" block near top | ✓ |
| Inline only | CA examples inside relevant step checkboxes only | |
| New CA section only — at the end | One consolidated section after Step 8 | |

**User's choice:** Both — inline + CA summary section
**Notes:** Dual approach captures both the step-by-step (so agents working linearly encounter GOTCHAs at the right moment) and the scanning mode (quick reference for agents jumping into a CA city mid-stream).

---

## Cities Onboarded table

| Option | Description | Selected |
|--------|-------------|----------|
| All 6 CA cities + CA state row (recommended) | Individual rows for SF, San Jose, Sacramento, Berkeley, Fremont, San Diego + CA state | ✓ |
| CA state row only | Just one 'California (state)' row; city details in CA section | |
| Skip table update | Leave table as-is; all CA patterns go in CA section | |

**User's choice:** All 6 CA cities + CA state row
**Notes:** Individual rows allow future agents to see city-level patterns (headshot source, geofence loader type, election method) that are useful when starting a similar new city.

---

## Milestone close scope

| Option | Description | Selected |
|--------|-------------|----------|
| ROADMAP.md + STATE.md + PROJECT.md (recommended) | Full close: all three files updated | ✓ |
| ROADMAP.md only | Minimal close | |
| ROADMAP.md + STATE.md | Skip PROJECT.md validated requirements | |

**User's choice:** Full close — ROADMAP.md + STATE.md + PROJECT.md
**Notes:** Matches the close pattern used for v5.0 and v6.0 milestones. Ensures future sessions have a clean milestone boundary.

---

## Claude's Discretion

- Exact wording and formatting of the "California Quick Reference" block
- Which specific step numbers get inline CA annotations (based on reading playbook content)
- Ordering of CA cities in the Cities Onboarded table
- How to abbreviate Notable Patterns column to fit table format

## Deferred Ideas

- lavote.gov election ID auto-detection script — recurring topic; still not worth building in this phase
- Board of Equalization (BOE) district geofences — separate shapefile source needed, deferred from Phase 59
- Any new CA city data work (Oakland, Long Beach, etc.) — this phase is documentation only
