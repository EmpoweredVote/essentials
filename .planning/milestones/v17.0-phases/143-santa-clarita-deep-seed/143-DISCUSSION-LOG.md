# Phase 143: Santa Clarita deep-seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-19
**Phase:** 143-santa-clarita-deep-seed
**Areas discussed:** Chamber consolidation, Mayor modeling, Citywide elected officers, External ID scheme

---

## Pre-discussion DB pre-check (per milestone Key Fact: NOT all greenfield)

Verified Santa Clarita (geo_id `0669088`) is partially seeded and messier than Long Beach:
gov row exists (geo_id NULL); TWO duplicate `'City Council'` chambers (`ext -200978` with
Mayor+2 Council Member offices, only Smyth seated; `ext 11243` `official_count=5` with 3
Councilmembers Gibbs/Weste/Ayala); 4 of 5 council seated; Gibbs has 2 images; 0 stances;
geofence present. Confirmed council-manager form / at-large 5-seat council / rotational mayor.

---

## Chamber consolidation

| Option | Description | Selected |
|--------|-------------|----------|
| Keep B (11243), retire A | Keep B (official_count=5, 'Councilmember', 3 seated); migrate Smyth into B; delete A + empty Mayor/extra offices; normalize titles; run split-section check | ✓ |
| Keep A (-200978), retire B | Keep A (-700xxx scheme, holds Smyth); migrate Gibbs/Weste/Ayala into A | |
| You/researcher decide | Defer keep-which to research after checking browse/FK deps | |

**User's choice:** Keep B (11243), retire A
**Notes:** B is the stronger keeper — canonical count, conventional title, 3 real members.

---

## Mayor modeling

| Option | Description | Selected |
|--------|-------------|----------|
| Rotating role on a council seat | No separate Mayor seat; mark current mayor by title on their Councilmember seat; drop empty Mayor office | ✓ |
| Separate Mayor office | Distinct Mayor office seated by current mayor in addition to council seat | |
| No mayor designation | Just 5 councilmembers, no mayor marking | |

**User's choice:** Rotating role on a council seat
**Notes:** SC mayor rotates annually from the 5; avoids double-counting one person as 2 rows.

---

## Citywide elected officers

| Option | Description | Selected |
|--------|-------------|----------|
| Council-only (confirm in research) | Roster = 5 at-large seats; Manager/Clerk/Treasurer/Attorney appointed → excluded; research confirms none elected | ✓ |
| Council + any elected officers | Actively seat any directly-elected citywide officer (LB-style) | |

**User's choice:** Council-only (confirm in research)
**Notes:** Council-manager general-law city — those officers are appointed, not on the ballot.

---

## External ID scheme

| Option | Description | Selected |
|--------|-------------|----------|
| Reserved -700xxx, keep 665xxx as-is | New seats use reserved -700xxx (pre-flight uniqueness); Smyth keeps -700180; don't renumber existing 665xxx | ✓ |
| Standardize everyone to -700xxx | Renumber Gibbs/Weste/Ayala from 665xxx too | |
| Reuse positive 665xxx scheme | New seats continue positive 665xxx | |

**User's choice:** Reserved -700xxx, keep 665xxx as-is
**Notes:** Consistent with Smyth + LB precedent; existing 665xxx are real source IDs, leave untouched.

---

## Claude's Discretion

- Exact reconciliation SQL ordering (migrate-then-delete vs relink), precise mayor title string,
  and whether the 5th seat is its own INSERT or part of a roster-completion migration — planner's call.

## Deferred Ideas

- William S. Hart Union HSD / local school-district elected boards — out of scope for v17.0;
  future school-board coverage milestone (consistent with LBUSD deferral in Phase 142).
