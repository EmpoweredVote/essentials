# Phase 188: Location Stats Strip - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-07
**Phase:** 188-location-stats-strip
**Areas discussed:** Data source mechanism, Stat content & format, Federal tier scope, Visual treatment

---

## Data Source Mechanism

### Where should the population data live?

| Option | Description | Selected |
|--------|-------------|----------|
| Static JSON bundle | Generator script fetches Census population for all US places + states, keyed by FIPS, committed as JSON. Instant lookup, no API key/CORS/rate limits. | ✓ |
| Live Census API | Fetch api.census.gov at render time by FIPS. Always current, but CORS/key/rate-limit/latency handling + per-banner fetches on scroll. | |
| Backend proxy endpoint | accounts-api endpoint serving population by geo_id. Cleanest for client, but expands into backend repo (out of frontend-only scope). | |

**User's choice:** Static JSON bundle (Recommended)
**Notes:** Satisfies STAT-02 (keyed by geo_id, generated from Census, not hardcoded per city) with zero runtime latency.

### How should city population resolve in address-search mode (only city name + state known)?

| Option | Description | Selected |
|--------|-------------|----------|
| Name+state index in the bundle | Bundle also carries {city+state → FIPS} index so address-search city banners resolve too. Max coverage, still FIPS-keyed. | ✓ |
| FIPS-only (browse mode only) | City pop shows only when a real FIPS is present (browse-by-area). Address-search city banners omit. | |

**User's choice:** Name+state index in the bundle (Recommended)
**Notes:** State pop always resolves via abbrev→FIPS; unmatched names omit gracefully (STAT-03).

### Which Census dataset should the generator source from?

| Option | Description | Selected |
|--------|-------------|----------|
| Latest ACS 5-year (2023) | Covers all places incl. small towns, updated annually. Best coverage + recency. | ✓ |
| 2020 Decennial | Exact 2020 count, but a fixed snapshot that goes stale (relevant for fast-growing TX/UT cities). | |

**User's choice:** Latest ACS 5-year (Recommended)

---

## Stat Content & Format

### How many stats should the strip show?

| Option | Description | Selected |
|--------|-------------|----------|
| Population only | One fact. Matches requirements + 187's single reserved slot. Guaranteed-available. | ✓ |
| Population + one more | Plus a second Census stat. Richer but adds layout/coverage complexity + expands STAT scope. | |

**User's choice:** Population only (Recommended)

### How should the population read on the banner?

| Option | Description | Selected |
|--------|-------------|----------|
| Label + full number | Uppercase label (`POPULATION`) above the grouped full number. | ✓ |
| Full number + word | Grouped number + "residents"/"people". | |
| Abbreviated | Compact ("Pop. 653K"). Space-saving but loses precision. | |

**User's choice:** Label + full number (Recommended)

---

## Federal Tier Scope

### Should the federal (United States) banner show national population?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — show US population | US banner shows national pop (same ACS source). Consistent across all 3 tiers, no omit case. | ✓ |
| No — city + state only | Only city + state get pop; federal stays bare. Meets 188's literal criteria but looks inconsistent. | |

**User's choice:** Yes — show US population (Recommended)

---

## Visual Treatment

### How should the population stat be styled top-right?

| Option | Description | Selected |
|--------|-------------|----------|
| Plain overlaid text | Right-aligned label + number, no container, relies on banner gradient overlay. | |
| Text on a soft scrim | Same text on a rounded semi-transparent navy panel (echoes 187 chips) for guaranteed legibility. | ✓ (via note) |

**User's choice:** Other → note: "I feel like this is necessary due to the variations on the banners." Interpreted and confirmed as the **soft scrim** treatment (banner art varies — bright/busy/plain — so text-on-gradient alone isn't reliably legible).
**Notes:** Follow-up on mobile behavior — initially proposed dropping the label to number-only when the 120px band is tight; user corrected: **"probably always want to show both lines."** Both lines always show on all tiers/sizes; planner sizes text/scrim to fit 120px without title/icon collision.

---

## Claude's Discretion

- Exact scrim padding, radius, opacity, blur, and label/number font sizing (within legibility + fit + no-overlap constraints).
- Exact JSON bundle file shape and generator script location/structure (must be regenerable, per D-01/D-02/D-03).
- Whether population resolution lives inside `SectionBanner` or is passed via a resolved `stats` prop (keeping Phase 189's shared-component goal in mind).
- Fetch/lookup caching across the 3 stacked banners (static bundle is a synchronous in-memory lookup — likely trivial).

## Deferred Ideas

- Second/third stats (income, area, density) — population-only this phase.
- Live Census API / backend proxy — considered and rejected (static bundle chosen).
- Shared-component consolidation across Results + Elections — Phase 189.
- Reciprocal/enhanced banners on other EV apps — out of v21.0 scope.
