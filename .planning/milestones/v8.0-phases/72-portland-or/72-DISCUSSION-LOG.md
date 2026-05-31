# Phase 72: Portland, OR - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28
**Phase:** 72-portland-or
**Areas discussed:** Phase 72 scope boundary, Portland charter reform structure, Oregon state layer prerequisites, RCV + elections discovery setup

---

## Preliminary: Phase Routing

User originally invoked `/gsd-discuss-phase 70 Portland, OR`. Phase 70 is CA Compass Stances. User clarified they wanted Portland, OR as a new phase, not Phase 70. Phase 71 (CA Playbook Retrospective) is deferred — CA phases 70 and 71 will be completed once stance research is done. Portland, OR is added as Phase 72, first phase of v8.0 Oregon milestone.

---

## Phase 72 Scope Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Full v8.0 Oregon start (playbook pattern) | Phase 72 = OR Geofences only (TIGER state boundaries). 8-10 phases total following ME/CA playbook. | ✓ |
| Accelerated: OR state layer + Portland city in one milestone | Combine TIGER + state government DB + Portland city into fewer, denser phases. | |
| Portland-first: city only with minimum OR prerequisites | Just Portland city, state layer deferred to v8.1. Portland address returns local officials only. | |

**User's choice:** Full v8.0 Oregon start (playbook pattern)
**Notes:** None — clear preference for the established playbook approach.

---

## Portland Custom Council District Boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| TIGER state only (Recommended) | Phase 72 = OR TIGER layers only. Portland's 12 custom council districts go in a later Portland city phase. | ✓ |
| TIGER + Portland custom districts | Include both TIGER state load and Portland's custom council boundaries in Phase 72. | |

**User's choice:** TIGER state only
**Notes:** Portland's council districts are from the 2024 charter reform and require a custom ArcGIS/GeoJSON loader, not the TIGER loader. Keeping them separate maintains the single-unit-of-work principle.

---

## Portland Charter Reform Structure

### Council Seat Title Format

| Option | Description | Selected |
|--------|-------------|----------|
| Councilor (District N, Seat A/B/C) (Recommended) | Matches Portland's official terminology. Unique title per seat. 36 total council titles. | ✓ |
| Councilor (District N, Position 1/2/3) | Numbering instead of A/B/C. Also unique but doesn't match official naming. | |
| Just Councilor (District N) — figure out multi-seat later | Defer complexity. | |

**User's choice:** Councilor (District N, Seat A/B/C)

### Election Method

| Option | Description | Selected |
|--------|-------------|----------|
| 'stv' (Recommended) | Single Transferable Vote — accurate name for Portland's multi-winner system. | ✓ |
| 'rcv' | Simpler, consistent with Berkeley/Portland ME. Less precise. | |
| 'rcv_multi' | Hybrid label, readable but non-standard. | |

**User's choice:** 'stv'
**Notes:** User added important context: "we need to have an explanation of how the voting pattern works, so a person new to town could hop on and not be overwhelmed by STV, but have necessary context." This became a deferred idea — a voter education feature for non-standard voting systems (STV, RCV) needs its own phase or sub-feature.

### City Auditor Chamber

| Option | Description | Selected |
|--------|-------------|----------|
| Own chamber: City Auditor (Recommended) | Independent oversight officer — separate chamber, matches Berkeley pattern. | ✓ |
| Fold into LOCAL_EXEC with Mayor | One LOCAL_EXEC chamber with two office rows. | |

**User's choice:** Own chamber: City Auditor

---

## Oregon State Layer Prerequisites

### Multnomah County Officials

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — county commissioners are relevant local government | 5 elected commissioners, LA County pattern, custom boundaries. | ✓ |
| No — counties as routing only (ME/MA pattern) | Counties as geofence routing only, no officials seeded. | |

**User's choice:** Yes — Multnomah County officials in scope for v8.0

### Multnomah + other counties

| Option | Description | Selected |
|--------|-------------|----------|
| Multnomah only (Recommended) | Portland's primary county. Washington + Clackamas → v8.1+. | ✓ |
| All 3 Portland-area counties | Multnomah + Washington + Clackamas. Full suburban coverage but 3× work. | |

**User's choice:** Multnomah only

---

## RCV + Elections Discovery Setup

### Multi-seat Race Modeling

| Option | Description | Selected |
|--------|-------------|----------|
| 3 race rows per district, one per seat (Recommended) | Matches current schema, no migration. 36 council races total. | ✓ |
| 1 race row per district with schema extension | Voter-experience-aligned but requires schema migration and UI changes. | |

**User's choice:** 3 race rows per district, one per seat

### OR Election Discovery Source

| Option | Description | Selected |
|--------|-------------|----------|
| sos.oregon.gov (OR Secretary of State) | Same SOS pattern as ME and CA prior milestones. | |
| Let researcher find it | Don't lock source here — researcher discovers exact URL. | ✓ |

**User's choice:** Let researcher find it

---

## Claude's Discretion

- Exact TIGER layer counts for OR (G4110 city count, COUSUB FUNCSTAT determination)
- Whether OR G4040 COUSUB needs loading (statistical vs. active MCD determination)
- Migration numbering (verify 221 is still next)
- Loader script naming conventions

## Deferred Ideas

- **Voter education for STV/RCV** — user explicitly requested explanation text for voters unfamiliar with ranked-choice voting systems. Needs schema + frontend work; own phase.
- **Washington County + Clackamas County officials** — v8.1+
- **Portland-area suburban cities** (Beaverton, Gresham, Hillsboro) — v8.1+
- **OR G4040 COUSUB towns** — researcher checks if OR has MA-style town population; COUSUB phase may be needed
