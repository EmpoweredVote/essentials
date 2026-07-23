# Phase 212: Backend Place-Name Resolver & National Fallback - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-20
**Phase:** 212-backend-place-name-resolver-national-fallback
**Areas discussed:** Fallback floor (gate vs. caveat), Candidate ranking & labeling, Coverage signal in response, Gazetteer ingest scope

---

## Fallback floor: gate vs. caveat

| Option | Description | Selected |
|--------|-------------|----------|
| Senate + state execs floor; rest honest-noted | Guarantee Senators + Governor/state execs; House + county render where data exists, honest note otherwise; no gate | (basis) |
| County officials in the hard floor | Guarantee county officials → seed county rows nationwide before shipping; gates milestone | |
| Gate on nationwide CD + county coverage first | Pre-flight audit blocks 212 until all 50 states' CDs AND county rosters loaded | |

**User's choice:** Free-text — *"Can we do all the congress, and wait for county?"*
**Notes:** Resolved to a hybrid: **House is completed to a nationwide guarantee** (cheap — all 435 districts ship in one national `cd119` TIGER file, folded into 212 scope) while **county officials stay best-effort** (expensive — ~3,143 real rosters; not gated). Hard floor = Senators + Governor/state execs + US House. RSLV-05's "county officials" softens to "where available." → CONTEXT D-01–D-04.

---

## Candidate ranking & labeling

| Option | Description | Selected |
|--------|-------------|----------|
| State-qualified + area-type, curated boosted | `Name, ST · <City\|County\|State>`; trigram score with curated/deep-seeded boost; ties → exact-match then population | ✓ |
| Pure similarity + population, no curated boost | Same labels, strict trigram+population ranking; Gazetteer place can bury a deep-seeded one | |
| Minimal label ('Name, ST' only) | Drop area-type tag; leaves city/county collisions ambiguous | |

**User's choice:** State-qualified + area-type, curated boosted (Recommended)
**Notes:** Area-type tag mandatory to disambiguate Baltimore city vs. county. Curated boost ensures fully-seeded locations surface first. → CONTEXT D-05, D-06.

---

## Coverage signal in response

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — add has_local_data flag now | Extend RSLV-01 shape with `local` vs `fallback` coverage signal per candidate; Phase 214 uses it | ✓ |
| Defer — keep contract minimal | Return only `{geo_id, mtfcc, label, state}`; Phase 214 re-derives coverage | |

**User's choice:** Yes — add has_local_data flag now (Recommended)
**Notes:** Nearly free since ranking already computes curated status; avoids a 214 contract re-do. Finer stances-badge styling deferred to 214. → CONTEXT D-07.

---

## Gazetteer ingest scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full Places (incl. CDPs) + Counties | Whole Places file (incorporated + CDPs) + Counties; idempotent/re-runnable; TIGER-matched vintage; exclude townships | ✓ |
| Incorporated Places + Counties only | Drop CDPs; unincorporated community names won't match | |
| Places + Counties + County Subdivisions | Also ingest township/MCD file; broadest but heavier, no fallback benefit yet | |

**User's choice:** Full Places (incl. CDPs) + Counties (Recommended)
**Notes:** CDPs ship in the same Places file — free coverage of unincorporated communities. County subdivisions excluded/deferred. → CONTEXT D-08–D-11.

---

## Claude's Discretion

- Exact SQL/index shape, Gazetteer table/column naming, numeric ranking-boost weights (follow `campaignFinanceSearchService.ts` idioms).
- Exact JSON key for the coverage signal (`has_local_data` vs `coverage` enum) — single honest binary at the 212 layer.

## Deferred Ideas

- County-subdivision / township (MCD) Gazetteer ingest.
- Nationwide county roster seeding (would make RSLV-05 literally guaranteed).
- DB-only-fallback landing UX (badge copy, chip styling) — Phase 214.
- Stances/`hasContext` badge granularity in resolver response — Phase 214.
