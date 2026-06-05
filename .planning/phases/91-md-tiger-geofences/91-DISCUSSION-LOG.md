# Phase 91: MD TIGER Geofences - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-05
**Phase:** 91-md-tiger-geofences
**Areas discussed:** Baltimore City handling, SLDL sub-district boundaries, COUSUB scope

---

## Baltimore City Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — both tiers | A Baltimore resident sees both LOCAL officials (city-level) and COUNTY officials (city-county). Mirrors the SF pattern. Smoke test asserts both G4110 + G4020 rows. | ✓ |
| G4110 only | Treat Baltimore City as a city only, not a county. COUNTY tier returns nothing for Baltimore addresses. Simpler, but Phase 92+ won't have COUNTY-level officials to link. | |

**User's choice:** Yes — both tiers (G4110 + G4020)
**Notes:** Same as SF in CA. Baltimore City has been an independent city since 1851, coextensive with its own county-level entity in TIGER.

---

## SLDL Sub-District Boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| One row per letter-district | Load 47A and 47B as separate geofence_boundaries rows. Phase 93 links delegates to their precise sub-district. Matches TIGER file structure. May result in ~50+ rows instead of 47. | ✓ |
| Merge sub-districts to parent | Combine 47A + 47B into a single row for district 47. Simpler, but delegates in A/B sub-districts can't be distinguished by address lookup. | |
| Researcher decides | Let the researcher check the actual TIGER file structure and recommend. | |

**User's choice:** One row per letter-district
**Notes:** Researcher must confirm actual count of SLDL rows in the TIGER file (expected: more than 47). Pre-flight assertion must use confirmed count.

---

## COUSUB Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Quick check only | Researcher runs FUNCSTAT check on MD G4040 shapes. If statistical (FUNCSTAT=S), skip. If functional towns exist, document in research but don't load this phase. | |
| Skip entirely | MD is primarily G4110 cities. COUSUB is explicitly out of scope for v11.0. Don't spend research time on it. If a gap surfaces later, it goes in v12.0. | ✓ |

**User's choice:** Skip entirely
**Notes:** Matches REQUIREMENTS.md "Out of Scope" decision. No research time invested.

---

## Claude's Discretion

- Specific smoke test addresses (Baltimore City, Leonardtown/St. Mary's County, rural MD county suggested as good candidates)
- Exact MTFCC codes to assign per layer (follow established pattern)
- Pre-flight assertion structure (follow OR/MA dry-run pattern)

## Deferred Ideas

- MD COUSUB (G4040 towns) — explicitly deferred to v12.0 per REQUIREMENTS.md Future Requirements
- MD COUSUB coverage gap analysis — skipped per user decision; revisit if routing gaps surface post-v11.0
