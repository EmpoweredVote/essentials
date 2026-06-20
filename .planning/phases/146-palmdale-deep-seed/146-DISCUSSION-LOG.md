# Phase 146: Palmdale deep-seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-20
**Phase:** 146-palmdale-deep-seed
**Areas discussed:** District modeling, Mayor representation, Headshot scope, Stance scope & sources

---

## District modeling

| Option | Description | Selected |
|--------|-------------|----------|
| Relabel + add D3 | Relabel the 4 existing At-Large district rows to District 1/2/4/5, create District 3, point each office at its correct district. geo_id=city, no per-district boundaries. | ✓ |
| Create 5 fresh district rows | New District 1-5 rows; leave old At-Large rows orphaned. | |
| Keep At-Large, district in title only | Don't model districts as rows; put "District N" in office title. Fails success-criterion #2. | |

**User's choice:** Relabel + add D3
**Notes:** Palmdale is the first by-district city in LA-County Wave 2 (143/144/145 were at-large). DB wrongly types all seats At-Large. This new district-relabel pattern is reusable for later by-district cities.

---

## Mayor representation

| Option | Description | Selected |
|--------|-------------|----------|
| Glendale model | title='Mayor' on Ohlsen's D4 council seat; no separate Mayor office/chamber/LOCAL_EXEC; re-confirm at apply time. | ✓ |
| Separate Mayor seat | Distinct LOCAL_EXEC Mayor office. Wrong — Palmdale's mayor is one of the 5 district members. | |

**User's choice:** Glendale model
**Notes:** Palmdale's mayor-selection method changed April 1 2025 (district-rotation → council majority vote at the December meeting). Current Mayor = Eric Ohlsen (D4) since Jan 1 2026; Mayor Pro Tem = Austin Bishop (D1). Researcher/planner must verify the current mayor live before flagging.

---

## Headshot scope

| Option | Description | Selected |
|--------|-------------|----------|
| Bettencourt only | Create the one missing headshot (Laura Bettencourt, D3); leave existing 4 unless visibly broken. | ✓ |
| Bettencourt + re-verify all 5 | Also re-source/re-process the existing 4. | |

**User's choice:** Bettencourt only
**Notes:** All 4 existing members already have ≥1 image; only D3 (Bettencourt) is a true gap. She must be created as a new politician (`-700657`).

---

## Stance scope & sources

| Option | Description | Selected |
|--------|-------------|----------|
| All 5, current seating only | Evidence-only stances for all 5 current members, all live compass topics; AV-area sources; 2026 election turnover out of scope. | ✓ |
| Defer stances to a later phase | Structure + roster + headshots now; stances separate. Breaks the one-phase deep-seed pattern. | |

**User's choice:** All 5, current seating only
**Notes:** Standard evidence-only conventions (chairs model, one agent at a time, all topics, no defaults, 100% citation, no judicial topics). Sources: cityofpalmdaleca.gov agendas/minutes, avpress.com, campaign sites.

---

## Claude's Discretion

- Migration granularity (one structural file vs. reconcile+complete split like Lancaster 910/911; one stance file per official).
- Whether to re-source any existing image found to be poor quality.

## Deferred Ideas

- **Per-government "how this body is elected" blurb** (user-raised during discussion). Genuinely valuable but a cross-cutting feature needing schema + UI + backfill across all governments — its own future phase. Recommended for REQUIREMENTS.md Future Requirements. Palmdale's election-process facts already captured in CONTEXT.md.
- Cleanup of 5 other cities' split-section defects — future phase.
- Palmdale school district(s) deep-seed — separate government.
- 2026 election (Districts 3/4/5) candidate/results ingestion — future discovery pipeline.
