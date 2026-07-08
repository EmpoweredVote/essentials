---
phase: 187-tethered-feature-icon-row
reviewed: 2026-07-07T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/lib/treasury.js
  - src/lib/treasury.test.js
  - src/lib/featureIcons.js
  - src/lib/featureIcons.test.js
  - src/components/SectionBanner.jsx
  - src/pages/Results.jsx
  - src/components/ElectionsView.jsx
  - .env.example
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 187: Code Review Report

**Reviewed:** 2026-07-07
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed the 187-01 Treasury resolver/product-registry additions (`treasury.js`, `featureIcons.js` +
tests) and the 187-02 `SectionBanner` chip row wired through `Results.jsx`/`ElectionsView.jsx`.

**What holds up well:**
- The TETH-01 core contract is architecturally sound: `resolveFeatureIcons()` is fed exclusively by
  `representingCity`/`userState` — both derived from the currently-viewed location (address search,
  browse params, or the browsed area's own politician records) — never from `useCompass()`'s
  ev-context/broker fields (`myRepresentativesAddress`, `userJurisdiction`, etc.). No code path was
  found where a saved/home location leaks into the resolver.
- Reverse-tabnabbing is correctly mitigated: the new `FeatureIconChip`'s `<a target="_blank">` carries
  `rel="noopener noreferrer"`, matching the existing per-body Treasury text link.
- `TETH-03` (no dead/placeholder icons) is correctly implemented — `featureIcons?.length > 0` gates the
  whole row, and `resolveFeatureIcons` only pushes an entry when `resolve()` returns non-null.
- `findStateTreasuryEntity`/`findFederalTreasuryEntity` correctly guard on `entity_type` +
  non-empty `available_datasets`, with solid null/empty-array/invalid-input test coverage.
- No hardcoded secrets, `eval`, `innerHTML`, empty catches, or debug artifacts (`console.log`,
  `TODO`/`FIXME`) in any of the 8 files.

**Where it's soft:** the tether contract's correctness ultimately rests on `findMatchingMunicipality`
(reused, unmodified from before this phase) and on the *existing* `representingCity`/`userState`
derivation in `Results.jsx`, neither of which was hardened for the new consumer. See CR/WR items below
for the concrete gaps this creates.

## Warnings

### WR-01: `findMatchingMunicipality` has no `entity_type` filter, unlike its two new siblings

**File:** `src/lib/treasury.js:75-108` (consumed by `src/lib/featureIcons.js:29`)
**Issue:** `findStateTreasuryEntity` and `findFederalTreasuryEntity` (both new, 187-01) explicitly filter
on `c.entity_type === 'state' | 'federal'`. `findMatchingMunicipality` (pre-existing, now also driving
the Local-tier chip) does **not** filter by `entity_type` at all — it matches purely on normalized-name
prefix + an `ENTITY_TYPE_WORDS` deny-list (`township, county, village, borough, town, parish`) that is
missing common qualifiers like `school`, `district`, `city`, `independent`. In `Results.jsx`,
`representingCity` for browse-mode pages is sourced directly from the unvalidated `browse_label` URL
query parameter (`searchParams.get('browse_label')`), and that same string is passed straight into the
Local-tier resolver. If a browse label happens to name a region (e.g. a school district or county) whose
normalized text prefix-matches an unrelated municipality/entity in the live Treasury dataset, the chip
would render a "Treasury Tracker" link to that wrong entity — silently violating the "banner's own
location, never a look-alike" guarantee the tether is supposed to provide. Today's hardcoded browse
shortcuts are curated single-city labels, so this isn't observed in practice, but the resolver itself
offers no structural protection against it.
**Fix:**
```js
// treasury.js — require the matched candidate to actually be municipality-shaped,
// mirroring the entity_type guard already used by findStateTreasuryEntity.
const candidates = cities.filter((c) => {
  if (!c.available_datasets || c.available_datasets.length === 0) return false;
  if (c.entity_type && !['municipality', 'city', 'town', 'village'].includes(c.entity_type)) return false;
  if (wantState && (c.state || '').toUpperCase() !== wantState) return false;
  // ...existing name-prefix logic...
});
```

### WR-02: Slug encoding is inconsistent between the two Treasury link call sites

**File:** `src/pages/Results.jsx:1990-1991` vs `src/lib/featureIcons.js:36`
**Issue:** `treasury.js`'s `TREASURY_URL` docblock (line 4-8) explicitly claims to be the "single source
of truth consumed by both the existing per-body text link (Results.jsx) and the tethered feature-icon
row." In practice the two consumers build the `?entity=` value differently: the new
`featureIcons.js` wraps the slug in `encodeURIComponent(toTreasurySlug(entity))`, while the pre-existing
per-body link in `Results.jsx` interpolates `toTreasurySlug(treasuryMatch)` raw, with no
`encodeURIComponent`. `toTreasurySlug` only strips `/`, `?`, `#` — it does not touch apostrophes,
periods, or other characters that can appear in municipality names (e.g. `Coeur d'Alene`, `St. Louis`).
For such names the two "single source of truth" links can now diverge in exactly what request is sent to
`financials.empowered.vote`, undermining the "domain consistency" guarantee this phase's own
verification checklist calls for (187-02-PLAN.md step 4).
**Fix:** Wrap both call sites identically — either encode in both places, or move the
`encodeURIComponent` call inside `toTreasurySlug` itself so every consumer gets it for free:
```js
// Results.jsx
href={`${TREASURY_URL}/?entity=${encodeURIComponent(toTreasurySlug(treasuryMatch))}`}
```

### WR-03: State/city tether depends on "first government id wins" state derivation for multi-jurisdiction browses

**File:** `src/pages/Results.jsx:1104-1129` (consumed by `featureIconMap` at `1136-1139`)
**Issue:** `userState` — passed straight into `findMatchingMunicipality(..., userState)` and
`findStateTreasuryEntity(userState, ...)` — falls back to
`stateAbbrevFromGeoId(govList.split(',')[0])` for `browse_government_list` pages, i.e. it derives the
State/Local tether purely from the **first** government ID in a potentially multi-jurisdiction list. If
a government-list browse ever spans more than one state (nothing today prevents this — the parameter is
a plain comma-separated string with no single-state validation), the State-tier banner's Treasury chip
could tether to the wrong state's General Fund page for governments later in the list, even though the
banner visually claims to represent all of them. This is a pre-existing derivation reused unchanged by
187, but it now backs a stated hard invariant (TETH-01) rather than just cosmetic banner art.
**Fix:** Either validate that all IDs in a `browse_government_list` share a state FIPS prefix before
trusting the derived `userState` for the tether (and suppress the chip if they don't), or thread a more
authoritative per-government state signal through `browseByGovernmentList`'s response instead of
inferring it from the URL param.

## Info

### IN-01: `TREASURY_URL` has no trailing-slash guard

**File:** `src/lib/treasury.js:9-10`
**Issue:** `TREASURY_URL = import.meta.env.VITE_TREASURY_URL || 'https://financials.empowered.vote'` is
concatenated as `` `${TREASURY_URL}/?entity=${slug}` `` in both consumers. If an operator ever sets
`VITE_TREASURY_URL` with a trailing slash (a natural way to write a base-URL env var), every resolved
href gets a double slash (`.../?entity=` → `..//?entity=`).
**Fix:** `const TREASURY_URL = (import.meta.env.VITE_TREASURY_URL || 'https://financials.empowered.vote').replace(/\/$/, '');`

### IN-02: No analytics event on the new Treasury chip click

**File:** `src/components/SectionBanner.jsx:83-105`
**Issue:** Nearly every other interactive control in `Results.jsx`/`ElectionsView.jsx` (tab switches,
candidate clicks, compass CTA, stance-alignment buttons) fires a `posthog?.capture(...)` event.
`FeatureIconChip`'s `<a>` has no click tracking, so product usage of the new tethered icon row is
invisible to analytics — a gap worth closing given this is a new, measurable growth surface for
cross-product traffic.
**Fix:** Add an `onClick` that fires `posthog?.capture('essentials_feature_icon_clicked', { key: icon.key, tier })` before the native navigation proceeds (an `<a>` click handler doesn't need to call `preventDefault()`).

### IN-03: Reserved `compass`/`readrank` registry slots ship as commented-out code

**File:** `src/lib/featureIcons.js:45-47`
**Issue:** Two full object literals for future products are left commented out in `PRODUCT_REGISTRY`.
The accompanying comment explains the rationale (D-02: no per-location contract yet), which is better
than an unexplained dead block, but it's still commented-out code that will need to be kept in sync by
hand as the real resolver contracts land in later phases.
**Fix:** Low priority — consider replacing with a short inline list of reserved keys (e.g.
`const RESERVED_ORDER = ['treasury', 'compass', 'readrank'];`) plus a comment, rather than commented-out
object literals that could silently drift from the real shape once implemented.

---

_Reviewed: 2026-07-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
