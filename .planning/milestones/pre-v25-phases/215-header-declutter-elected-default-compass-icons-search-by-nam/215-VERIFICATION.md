---
phase: 215-header-declutter-elected-default-compass-icons-search-by-nam
verified: 2026-07-23T17:16:00Z
status: passed
score: 4/4 must-haves verified
---

# Phase 215 Verification — Header Declutter (Elected Default, Compass Icons, Search-by-Name Removal)

## Goal

The results header carries only what matters — an honest Elected-by-default type filter that never
silently empties the Judges tab, compact accessible compass-lens icon buttons, and no redundant
name-search box.

## Observable Truths

| # | Truth (success criterion) | Verified | Evidence |
|---|---------------------------|----------|----------|
| 1 | Representatives (and Educators) tabs default to Elected officials, with the All/Appointed dropdown removed | ✅ | Unit: `classify.test.js` TAB_TYPE_DEFAULTS + appointed-filter (12 cases) + 268-test vitest run; source greps (`appointedFilter`==0 in Results.jsx, `TYPE_OPTIONS`/`Dropdown`==0 in FilterBar.jsx). Live UAT (Bloomington, IN, 2026-07-23): Representatives tab lists only elected officials; no type dropdown at desktop or mobile. |
| 2 | The Judges tab still shows appointed officials by default in the same release — verified at a location with real geo-linked judges | ✅ | Live UAT at **Bloomington, IN** (the D-08 geo-linked-judges fixture; CA is invalid per NULL geo_id): Judges tab defaults to a full appointed-judge roster — Monroe County Circuit Court ×9, Indiana Court of Appeals ×7, Indiana Supreme Court (Rush/Massa) — **not empty**, zero manual filter interaction. Per-bucket `TAB_TYPE_DEFAULTS.judges='Appointed'` filtered independently (no shared state), so no other tab can empty it. |
| 3 | Compass lens controls render as icon-only buttons with accessible `aria-label`s and a keyboard/touch-usable tooltip affordance (gavel for Judicial), reclaiming header space | ✅ | Source: `title=`==0, `aria-label`≥1, `@floating-ui/react` import, `getReferenceProps({` handler merge; lint+build clean. Live UAT desktop: lens buttons icon-only; hover shows floating-ui tooltip; gavel icon present for Judicial; all four buttons carry accessible names in the a11y tree. Mobile keeps icon + label. Tooltip copy upgraded this session (name + plain-language focus summary, e.g. "Judicial Lens — How judges & DAs approach the law") — essentials f3c02a9d, verified live. |
| 4 | The "Search by name" results-filter box no longer appears anywhere in the UI | ✅ | Source: `Search by name`==0 in FilterBar.jsx; `searchQuery`/`deferredQuery`/`trimmedSearch`/`visibleList`==0 in Results.jsx. Live UAT: no name-search input in the header on any tab, desktop or mobile. |

## Required Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| `TAB_TYPE_DEFAULTS` + extracted appointed-filter fns | `src/lib/classify.js` | Present (reps/educators='Elected', judges='Appointed') |
| Appointed-filter unit tests | `src/lib/classify.test.js` | Present (12 cases; full suite green) |
| Per-bucket Elected default + dropdown/name-search removal | `src/pages/Results.jsx`, `src/components/FilterBar.jsx` | Present; dead files (LocalFilterSidebar/ResultsHeader/SegmentedControl) deleted |
| Icon-only lens buttons + accessible tooltip | `src/components/LensChipRow.jsx` | Present; tooltip now renders lens name + focus summary (f3c02a9d) |

## Verification Result

**PASSED — 4/4 success criteria met.** All three plans' deliverables are implemented, unit-tested
(279/279 frontend tests pass), and confirmed on production (essentials.empowered.vote) via live UAT
at Bloomington, IN across desktop (1280px) and mobile (390px) widths. The two blocking human-verify
checkpoints (Plan 02 D5 / Plan 03 D2) were performed and operator-approved 2026-07-23.

### Note on the label defect surfaced during UAT

The operator flagged the verbose resolver label ("City of Bloomington, Indiana, US, IN") shown in
the combobox/banner/heading. Root cause was a **Phase 212** resolver defect (`buildLabel` emitted the
raw source name), NOT a Phase 215 regression — 215's own checkpoints were functionally passing. Fixed
this session: `cleanPlaceName()` in accounts-api (`37365399`, deployed to master, live-verified —
label now reads "Bloomington, IN") plus the lens-tooltip copy upgrade (essentials `f3c02a9d`). Both
folded into the v24.0 close.
