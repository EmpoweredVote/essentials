---
phase: 187-tethered-feature-icon-row
verified: 2026-07-07T18:45:00Z
status: passed
score: 11/11 must-haves verified
overrides_applied: 0
---

# Phase 187: Tethered Feature-Icon Row Verification Report

**Phase Goal:** Every section banner shows a row of EV-product logo icons that deep-link into THAT
banner's own location in other EV products — never the user's saved/broker location — and an icon
appears only when a valid per-location link actually exists.

**Verified:** 2026-07-07T18:45:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `findStateTreasuryEntity('TX', cities)` returns the Texas state entity; a state with no entity returns null | VERIFIED | `src/lib/treasury.js:120-132`; `treasury.test.js:78-99` (5 cases incl. wrong-state, empty list, null guards) — `npx vitest run` 23/23 green |
| 2 | `findFederalTreasuryEntity(cities)` returns the 'United States' federal entity; empty list returns null | VERIFIED | `src/lib/treasury.js:141-151`; `treasury.test.js:103-115` |
| 3 | `resolveFeatureIcons` returns an empty array for a tier with no matching entity (TETH-03) | VERIFIED | `src/lib/featureIcons.js:61-82` filters non-null only; `featureIcons.test.js:66-76` explicit no-match case |
| 4 | Treasury deep-link slug is `<name>-<state>` lowercase-dash (texas-tx, united-states-us) | VERIFIED | `treasury.js:36-45` `toTreasurySlug`; asserted in both test files |
| 5 | Product registry lists treasury first `[treasury, compass, readrank]`, only live resolver renders | VERIFIED | `featureIcons.js:21-48` — treasury live, compass/readrank commented/reserved; `featureIcons.test.js:23-33` asserts `liveKeys === ['treasury']` |
| 6 | TX-based banner resolves state-tier link; federal-tier resolves United States link | VERIFIED | `featureIcons.test.js:36-54` (unit) + human checkpoint step 3 (tether test), approved 2026-07-07 |
| 7 | Banner with no matching Treasury entity resolves no icon at all (no greyed placeholder) | VERIFIED | `SectionBanner.jsx:219` guard `featureIcons?.length > 0`; `resolveFeatureIcons` never pushes null; human checkpoint step 5 (absence test) approved |
| 8 | A banner whose location has Treasury data shows a Treasury chip bottom-right | VERIFIED | `SectionBanner.jsx:216-235` chip row `position:absolute; bottom:16px; right:16px`; human checkpoint step 1 approved |
| 9 | Hovering/keyboard-focusing the chip shows a "Treasury Tracker" tooltip; link has aria-label, no native `title=` | VERIFIED | `SectionBanner.jsx:58-131` `FeatureIconChip` uses `useHover`+`useFocus`+`useRole('tooltip')`+`FloatingPortal`; `aria-label={icon.label}` on `<a>`; no `title=` attr present; human checkpoint step 2 approved |
| 10 | Clicking the chip opens `financials.empowered.vote/?entity=<banner-location>` for the banner's OWN location, never the user's | VERIFIED | `Results.jsx:1071-1129` `representingCity`/`userState` derived from viewed page context (browse label / politician records / address) — no import of any saved/broker location; `resolveFeatureIcons` consumes only these; independently confirmed by code review (187-REVIEW.md: "No code path was found where a saved/home location leaks into the resolver"); human checkpoint step 3 (tether test) approved |
| 11 | The chip row never overlaps the bottom-left title; top-right stays free for Phase 188 | VERIFIED | `SectionBanner.jsx:194-211` title `bottom:0,left:0` vs chip row `bottom:16px,right:16px` — disjoint corners; human checkpoint step 6 approved |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/treasury.js` | `findStateTreasuryEntity`, `findFederalTreasuryEntity`, `TREASURY_URL` exported; `findMatchingMunicipality` untouched | VERIFIED | All three present (lines 9-10, 120-132, 141-151); `findMatchingMunicipality` body (75-108) unmodified per plan constraint, confirmed by SUMMARY git-diff claim and independent code review |
| `src/lib/featureIcons.js` | `PRODUCT_REGISTRY` + `resolveFeatureIcons` | VERIFIED | Present, matches plan's exact contract (`{Local,State,Federal}` shape) |
| `src/lib/treasury.test.js` | New describe blocks for state/federal resolvers | VERIFIED | 15 tests, covers TX hit, wrong/absent state, empty datasets, federal hit, empty list, slug format |
| `src/lib/featureIcons.test.js` | Registry-ordering + TETH-03 omission tests | VERIFIED | 8 tests, all scenarios from plan's `<behavior>` block covered |
| `public/treasury-symbol.svg` | Byte-identical icon asset at root-relative path | VERIFIED | `ls -la` confirms 4062 bytes, identical to `C:/ev-landing/ev-landing-main/icons/treasury-symbol.svg` (4062 bytes) |
| `src/components/SectionBanner.jsx` | Bottom-right chip row + accessible tooltip, fills inert slot | VERIFIED | `featureIcons` prop rendered via `FeatureIconChip`; inert `sr-only` slot fully replaced |
| `src/pages/Results.jsx` | `featureIconMap` useMemo + 3 banner props + `ElectionsView` prop + centralized `TREASURY_URL` import | VERIFIED | Lines 32-33 imports, 1136-1139 useMemo, 1946/1953/1960 props, 2074 ElectionsView prop; local `TREASURY_URL` const removed |
| `src/components/ElectionsView.jsx` | `featureIconMap` prop drilled to its own 3 banner calls | VERIFIED | Line 286 default `{}`, lines 582/589/596 `featureIcons={featureIconMap?.X}` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `featureIcons.js` | `treasury.js` | `import { findMatchingMunicipality, findStateTreasuryEntity, findFederalTreasuryEntity, toTreasurySlug, TREASURY_URL } from './treasury'` | WIRED | `featureIcons.js:2-8`, all 5 names imported and used |
| `Results.jsx` | `featureIcons.js` | `resolveFeatureIcons` in `useMemo` keyed on `[representingCity, userState, treasuryCities]` | WIRED | Lines 1136-1139, single useMemo, no second fetch (reuses existing `treasuryCities` state at line 530) |
| `Results.jsx` | `SectionBanner.jsx` | `featureIcons={featureIconMap.Local\|State\|Federal}` | WIRED | Lines 1946/1953/1960, exact match |
| `ElectionsView.jsx` | `SectionBanner.jsx` | `featureIcons={featureIconMap?.Local\|State\|Federal}` drilled to its own 3 calls | WIRED | Lines 582/589/596 |
| `SectionBanner.jsx` | `financials.empowered.vote` | `<a href={icon.href} target=_blank rel="noopener noreferrer">` | WIRED | `SectionBanner.jsx:83-105`, `rel="noopener noreferrer"` present |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `SectionBanner.jsx` chip row | `featureIcons` prop | `Results.jsx`/`ElectionsView.jsx` → `featureIconMap` → `resolveFeatureIcons({representingCity, userState, treasuryCities})` | Yes — `treasuryCities` sourced from `fetchTreasuryCities()` real API call (`treasury.js:16-25`, existing pre-187 fetch, reused not duplicated); `representingCity`/`userState` derived from live page context (browse params, politician records, address parse) | FLOWING |

No hardcoded/static fallback found; `resolveFeatureIcons` default params (`representingCity=null, userState=null, treasuryCities=[]`) only apply pre-fetch/pre-context, and all three tiers correctly render `[]` in that state (verified by test: "returns all-empty arrays when called with no arguments").

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Treasury resolver pure-logic suite | `npx vitest run src/lib/treasury.test.js src/lib/featureIcons.test.js` | 2 files, 23/23 passed | PASS |
| Full repo regression suite | `npm test` | 9 files, 89/89 passed | PASS |
| Production build compiles (asset paths resolve) | `npm run build` | Built in 6.99s, no errors | PASS |
| Icon asset byte-identical to source | `ls -la public/treasury-symbol.svg` vs ev-landing source | Both 4062 bytes | PASS |
| Chip/tooltip interaction, cross-location tether, absence-when-no-data | N/A — no jsdom/render harness in repo | Human checkpoint (187-02 Task 3) executed against running dev server, approved 2026-07-07 ("it worked! Looks like it's working great") | PASS (human-verified) |

### Probe Execution

Not applicable — this phase is a UI/logic feature phase, not a migration/tooling phase. No `scripts/*/tests/probe-*.sh` files declared in PLAN/SUMMARY and none found in the repo's `scripts/` tree for this phase.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| ICON-01 | 187-01, 187-02 | Row of EV-product logo icons on section banner when a valid per-location link exists | SATISFIED | `resolveFeatureIcons` produces the row data; `SectionBanner.jsx` renders it; human checkpoint step 1 confirmed |
| ICON-02 | 187-02 | Hover/keyboard-focus tooltip naming the product | SATISFIED | `FeatureIconChip` @floating-ui hover+focus+role('tooltip'); human checkpoint step 2 confirmed |
| ICON-03 | 187-01, 187-02 | Icons from shared ev-landing symbol set, dark-banner-legible, never obscure title | SATISFIED | `public/treasury-symbol.svg` copied from `ev-landing-main/icons/`; treasury-symbol.svg has no dark/light variant (confirmed: only file in that dir without `-dark`/`-light` suffix) — legibility guaranteed via semi-transparent chip background instead (documented design decision, RESEARCH Pitfall 3); bottom-right vs bottom-left placement confirmed disjoint |
| TETH-01 | 187-02 | Icon opens product at banner's own location, not user's | SATISFIED | Architecturally verified: `representingCity`/`userState` sourced only from viewed-page context, never from `useCompass()` ev-context/broker fields (independently confirmed in 187-REVIEW.md code review); human checkpoint step 3 tether test confirmed |
| TETH-02 | 187-01, 187-02 | Treasury links via `financials.empowered.vote/?entity=<name-state>` slug contract | SATISFIED | `TREASURY_URL` centralized in `treasury.js`; chip href built in `featureIcons.js:36-42`; verified by test assertions and human checkpoint step 4 (domain consistency) |
| TETH-03 | 187-01, 187-02 | Icon appears only when valid per-location link exists; otherwise omitted entirely | SATISFIED | `resolveFeatureIcons` filters nulls; `SectionBanner.jsx` guards `?.length > 0`; unit-tested; human checkpoint step 5 confirmed |
| TETH-04 | 187-01 | State/federal-tier banners resolve their Treasury entity at the correct tier | SATISFIED | `findStateTreasuryEntity`/`findFederalTreasuryEntity` direct entity_type match, tested with real Texas/United States record shapes; human checkpoint step 3 confirmed for state+federal tiers |

No orphaned requirements — all 7 IDs (ICON-01/02/03, TETH-01/02/03/04) declared across the two plans' frontmatter match exactly the 7 IDs mapped to Phase 187 in REQUIREMENTS.md (lines 113-119).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/pages/Results.jsx` | 1991 | Pre-existing per-body Treasury text link does NOT wrap the slug in `encodeURIComponent`, while the new `featureIcons.js` chip link does (`featureIcons.js:36`) | WARNING (info) | Both now share the same domain (TETH-02 domain-consistency requirement is met), but for municipality names containing characters `toTreasurySlug` doesn't strip (apostrophes, periods — e.g. "St. Louis", "Coeur d'Alene") the two links could diverge in exact query value. Flagged independently by code review (187-REVIEW.md WR-02). Does not fail any stated must-have truth for this phase (which concerns the new chip's own href correctness, verified correct) — recommended as a follow-up fix, not a phase blocker. |
| `src/lib/treasury.js` | 75-108 | `findMatchingMunicipality` (pre-existing, unmodified per plan constraint) has no `entity_type` filter unlike its new siblings, and browse-mode `representingCity` can originate from an unvalidated URL query param | WARNING (info) | Pre-existing code, explicitly required by plan NOT to be modified this phase. Theoretical mis-tether edge case for uncommon browse labels; not observed in current curated browse shortcuts. Flagged by code review (187-REVIEW.md WR-01), not a regression introduced by 187 and does not fail any of this phase's stated truths. |
| `src/pages/Results.jsx` | 1104-1129 | `userState` for multi-jurisdiction government-list browses derives from "first government ID wins," a pre-existing derivation now also backing the TETH-01 tether guarantee | WARNING (info) | Pre-existing code reused unchanged. Theoretical wrong-state tether only if a government list ever spans multiple states (not currently possible in the app's browse UX). Flagged by code review (187-REVIEW.md WR-03); informational, not blocking. |

No TBD/FIXME/XXX debt markers found in any of the 7 files modified by this phase. No TODO/HACK/PLACEHOLDER markers found. No empty-implementation or hardcoded-empty-data patterns found flowing to rendered output.

### Human Verification Required

None outstanding. The phase's single blocking human-verify checkpoint (187-02 Task 3) was executed against a running dev server and explicitly approved by the developer on 2026-07-07 ("it worked! Looks like it's working great"), covering all interaction/visual/tether truths that this repo's test harness cannot assert (no jsdom/React-render harness exists — confirmed by `SectionBanner.test.js`'s own header comment and `187-VALIDATION.md`'s documented harness constraint). Per task instructions, this approved checkpoint is treated as satisfying the ICON-01/02/03 and TETH-01 runtime-behavior truths.

### Gaps Summary

No gaps. All 7 requirement IDs (ICON-01, ICON-02, ICON-03, TETH-01, TETH-02, TETH-03, TETH-04) are implemented, wired end-to-end, covered by 23 passing pure-logic unit tests (89/89 full-repo regression), and the interaction/visual/tether behaviors that cannot be asserted by this repo's jsdom-less test harness were confirmed via an executed and approved human checkpoint. Three informational code-review warnings (WR-01/02/03) were independently re-confirmed against the current codebase — none of them fail a stated must-have truth for this phase; they concern pre-existing code paths (two) and a minor encoding inconsistency on the pre-existing text link (one), all recommended as low-priority follow-ups rather than phase blockers.

---

_Verified: 2026-07-07T18:45:00Z_
_Verifier: Claude (gsd-verifier)_
