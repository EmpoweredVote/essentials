---
phase: 187-tethered-feature-icon-row
plan: 01
subsystem: ui
tags: [react, vitest, treasury, feature-icons, deep-linking]

# Dependency graph
requires: []
provides:
  - "findStateTreasuryEntity(state, cities) and findFederalTreasuryEntity(cities) in treasury.js"
  - "Centralized TREASURY_URL export in treasury.js (financials.empowered.vote)"
  - "public/treasury-symbol.svg icon asset"
  - "src/lib/featureIcons.js — PRODUCT_REGISTRY + resolveFeatureIcons({representingCity, userState, treasuryCities}) -> {Local, State, Federal}"
affects: [187-02, 189]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Direct entity_type+state match resolvers (findStateTreasuryEntity/findFederalTreasuryEntity) as siblings to the fuzzy findMatchingMunicipality, left untouched"
    - "Fixed-order product registry with per-product resolve(ctx) returning {key,href,label,iconSrc}|null; unresolved products/tiers omitted (never null/placeholder pushed)"

key-files:
  created: [src/lib/featureIcons.js, src/lib/featureIcons.test.js, public/treasury-symbol.svg]
  modified: [src/lib/treasury.js, src/lib/treasury.test.js, .env.example]

key-decisions:
  - "Centralized TREASURY_URL as a single export of treasury.js, defaulting to financials.empowered.vote — both the existing per-body text link (Results.jsx, wired in 187-02) and the new icon consume the same constant"
  - "Wrapped the resolved slug in encodeURIComponent before interpolation into ?entity= (defense-in-depth over toTreasurySlug's existing /?# stripping — threat T-187-01)"
  - "Reserved compass/readrank registry slots as commented-out entries rather than live resolve()->null entries — zero rendered surface for unwired products (D-02)"

patterns-established:
  - "resolveFeatureIcons mirrors getBuildingImages' {Local,State,Federal} tier-map shape exactly, for parent-resolved + prop-drilled consumption in 187-02"

requirements-completed: [ICON-01, TETH-02, TETH-03, TETH-04]

# Metrics
duration: 35min
completed: 2026-07-07
---

# Phase 187 Plan 01: Treasury Resolvers + Feature-Icon Registry Summary

**State/federal Treasury entity resolvers (findStateTreasuryEntity/findFederalTreasuryEntity) plus a generic product registry (resolveFeatureIcons) that resolves Treasury-only deep-links per tier, omitting the icon entirely when no location match exists.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-07-07T17:29:27Z
- **Tasks:** 2 completed
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments
- `findStateTreasuryEntity('TX', cities)` / `findFederalTreasuryEntity(cities)` added to `treasury.js` as new direct entity_type+state match resolvers, `findMatchingMunicipality` left byte-for-byte unchanged (verified via `git diff`).
- Centralized `TREASURY_URL` export in `treasury.js` (`https://financials.empowered.vote` default per the locked CONTEXT contract); `.env.example` updated to match.
- `public/treasury-symbol.svg` copied byte-identical (4062 bytes, `diff` confirmed) from the ev-landing source, root-relative-path convention.
- `src/lib/featureIcons.js` — `PRODUCT_REGISTRY` (treasury first, only live resolver; compass/readrank reserved as commented slots) + `resolveFeatureIcons({representingCity, userState, treasuryCities}) -> {Local, State, Federal}`, each tier an array of resolved icons, empty when unresolved (TETH-03).
- Full test suite: 23 tests across `treasury.test.js` (15) + `featureIcons.test.js` (8, note: 8 `it` blocks map to the tests below) all green; whole-repo `npm test` 89/89 green (9 files), no regressions.

## Task Commits

Each task followed RED → GREEN (tdd="true"):

1. **Task 1: Extend treasury.js + tests + icon asset + .env.example**
   - `test(187-01): add failing tests for state/federal Treasury resolvers` — `f24b3a22`
   - `feat(187-01): add state/federal Treasury resolvers + centralize TREASURY_URL` — `0e441e6c`
2. **Task 2: Create featureIcons.js registry + resolveFeatureIcons + tests**
   - `test(187-01): add failing tests for featureIcons registry + resolveFeatureIcons` — `6877ce40`
   - `feat(187-01): add featureIcons.js product registry + resolveFeatureIcons` — `a32b5394`

_RED confirmed for both tasks by temporarily reverting/omitting the implementation and observing test failures before restoring and committing GREEN._

## Files Created/Modified
- `src/lib/treasury.js` - added `TREASURY_URL` export, `findStateTreasuryEntity`, `findFederalTreasuryEntity`; `findMatchingMunicipality` untouched
- `src/lib/treasury.test.js` - extended with `findStateTreasuryEntity`/`findFederalTreasuryEntity` describe blocks (TX/US real-record fixtures, no-match/empty/guard cases)
- `src/lib/featureIcons.js` - NEW: `PRODUCT_REGISTRY` + `resolveFeatureIcons`
- `src/lib/featureIcons.test.js` - NEW: registry-order, per-tier resolution, TETH-03 omission, empty/no-args guard tests
- `public/treasury-symbol.svg` - NEW: copied static asset (4062 bytes, byte-identical to source)
- `.env.example` - `VITE_TREASURY_URL` default updated to `https://financials.empowered.vote`

## Decisions Made
- Centralized `TREASURY_URL` in `treasury.js` rather than hardcoding `financials.empowered.vote` directly in `featureIcons.js` — single source of truth for both the existing per-body text link (to be re-imported in 187-02) and the new icon registry, per the plan's "Open question resolved."
- `encodeURIComponent` wraps the slug in `featureIcons.js`'s `resolve()` as defense-in-depth (threat T-187-01), even though `toTreasurySlug` already strips `/?#`.
- Compass/readrank kept as commented-out registry entries (not live `resolve: () => null` entries) to keep the "no rendered surface for unwired products" invariant unambiguous at the data layer, not just at the render layer.

## Deviations from Plan

None - plan executed exactly as written. Both tasks followed the plan's exact function signatures, doc-comment conventions, and test fixture shapes (real Texas/United States/Plano records from RESEARCH.md).

## Issues Encountered

None. All acceptance criteria and verification commands passed on first attempt after the RED/GREEN cycle:
- `npx vitest run src/lib/treasury.test.js src/lib/featureIcons.test.js` — 23/23 green
- `ls public/treasury-symbol.svg` present, byte-identical
- `grep -c "findStateTreasuryEntity\|findFederalTreasuryEntity" src/lib/treasury.js` — 2 (>=2 required)
- `grep -c "compass\|readrank" src/lib/featureIcons.js` — 4 occurrences, all in comments/reserved slots, zero live/rendered entries
- Full repo `npm test` — 89/89 green, 9 files, no regressions

## Known Stubs

None. Every function shipped in this plan is fully wired to real logic — no hardcoded empty defaults, no placeholder text, no unwired data sources. (The UI rendering of `featureIcons` inside `SectionBanner.jsx` and the `Results.jsx`/`ElectionsView.jsx` wiring are explicitly out of scope for this plan — see plan 187-02.)

## Threat Flags

None. This plan's only new surface (`href` construction from a location string) is exactly the T-187-01 threat already registered in this plan's `<threat_model>` and mitigated via `toTreasurySlug()` + `encodeURIComponent`. No new network endpoints, auth paths, or schema changes were introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `src/lib/featureIcons.js` exports `PRODUCT_REGISTRY` and `resolveFeatureIcons` ready for `Results.jsx`/`ElectionsView.jsx`/`SectionBanner.jsx` consumption in plan 187-02.
- `TREASURY_URL` is now a single exported source of truth in `treasury.js` — 187-02 should re-import it in `Results.jsx` (replacing its local `treasurytracker.empowered.vote`-defaulting constant) rather than defining a second one.
- No blockers. All must_haves truths from this plan's frontmatter are verified by the test suite.

---
*Phase: 187-tethered-feature-icon-row*
*Completed: 2026-07-07*
