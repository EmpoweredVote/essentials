---
phase: 34-mini-compass-tile-component
plan: "03"
subsystem: ui
tags: [react, compass, elections, representatives, radar-chart, local-lens, tooltip, dark-mode]

# Dependency graph
requires:
  - phase: 34-01
    provides: computeDisplaySpokes() shared algorithm
  - phase: 34-02
    provides: MiniCompass presentational component (label-free RadarChartCore tile)
provides:
  - compassMode auto-activation on Elections page for calibrated users (>= 3 answers)
  - PoliticianCard + MiniCompass overlay tile in ElectionsView and Results (reps) compassMode branch
  - deriveScopedTopics() helper for per-race district scope filtering
  - Portal tooltip (topic name bold + stance text) replacing built-in SVG foreignObject
  - Auto-enable compass on Representatives page for calibrated users (DEFAULT-01 from Phase 36)
affects: [35-elections-compass-ux, 36-compass-toggle-filter-bar]

# Tech tracking
tech-stack:
  added: [createPortal (react-dom), svg.getScreenCTM() for coordinate mapping]
  patterns:
    - "compassMode auto-derived from userAnswers.length >= 3 on Elections page"
    - "compassMode auto-enabled via localStorage on Representatives page when calibrated + no prior pref"
    - "deriveScopedTopics filters allTopics by districtType applies_* flags per-race"
    - "polAnswers converted from short_title map to topic_id array at render time"
    - "Portal tooltip uses getScreenCTM() + transparent overlay to intercept hover; suppresses built-in SVG tooltip"
    - "wrapper div borderRadius:10px + overflow:hidden clips overlay to card boundary — no color-matching needed"
    - "SVG overflow:visible via .mini-compass-host CSS class allows dots and tooltip to escape SVG viewport"

key-files:
  modified:
    - src/pages/Elections.jsx
    - src/components/ElectionsView.jsx
    - src/components/MiniCompass.jsx
    - src/pages/Results.jsx
    - src/index.css
    - src/contexts/CompassContext.jsx

key-decisions:
  - "compassMode auto-derived on Elections (no toggle) — Phase 36 still owns global controls bar"
  - "Representatives page uses compass toggle (existing) but auto-enables it for calibrated users with no prior pref"
  - "Portal tooltip rendered to document.body — completely escapes all ancestor overflow/z-index contexts"
  - "Transparent event-capture overlay inside MiniCompass suppresses RadarChartCore built-in foreignObject tooltip"
  - "ringColor=transparent removes concentric guide rings from mini chart (cleaner at small size)"
  - "Duplicate elections races deduplicated by candidate-ID set before grouping (longer name wins)"
  - "CompassKey Topic=no stance hidden via CSS span:last-of-type — not relevant at label-free scale"

patterns-established:
  - "MiniCompass receives scopedTopics computed at render time from allTopics + districtType"
  - "isDark flows from page (useTheme) down through component props"
  - "Wrapper div overflow:hidden + borderRadius:10px is the correct pattern for overlay tiles — no gradient color-matching"

# Metrics
duration: ~3h (including iterative visual polish and cross-app bug fixes)
completed: 2026-05-13
---

# Phase 34 Plan 03: Wire MiniCompass into ElectionsView — COMPLETE

**Checkpoint approved. Full visual polish delivered across Elections and Representatives pages.**

## Status

**COMPLETE** — All tasks done. Human verification passed during iterative live review session.

## Accomplishments

### Core wiring (original plan scope)
- Elections.jsx computes `compassMode = userAnswers.length >= 3` and passes it with `isDark` to ElectionsView
- ElectionsView compassMode branch: CompassCardVertical removed, horizontal PoliticianCard + MiniCompass overlay rendered with gradient fade
- `deriveScopedTopics()` helper added to filter topic pool per race's districtType
- Stance data converted from `{short_title: value}` to `[{topic_id, value}]` for MiniCompass
- `localLensActive` and `selectedTopics` flow from CompassContext into each MiniCompass tile

### Visual polish (beyond plan scope, delivered during checkpoint review)
- **Portal tooltip**: replaced built-in SVG foreignObject tooltip (clipped by ancestors) with `createPortal` tooltip to `document.body`. Shows bold+underlined topic name above stance text. Uses `getScreenCTM()` for accurate dot hit-detection. Transparent overlay captures events and suppresses built-in tooltip.
- **SVG overflow fix**: `.mini-compass-host svg { overflow: visible }` allows dots and tooltip to escape SVG viewport — no more edge clipping
- **Concentric rings removed**: `ringColor="transparent"` passed to RadarChartCore
- **Circle border removed**: `overflow:hidden`, `borderRadius:50%`, and `border` removed from MiniCompass container
- **Gradient clipping fix**: wrapper divs on both pages use `borderRadius:10px + overflow:hidden` — overlay is clipped to card boundary so it never bleeds against tinted tier section backgrounds (`#EDF6F8` for local)
- **Light mode gradient**: uses `rgba(255,255,255,0.97)` matching `colors.bgWhite = #FFFFFF` from ev-ui
- **CompassKey dark mode**: background `#1a2235`, span text `#d1d5db`, button `#9ca3af` — all `!important` overrides
- **CompassKey cleanup**: `span:last-of-type { display:none }` hides "Topic = no stance" (not meaningful at mini scale)
- **Size tuning**: final size 190px (from initial 120→200→170→190px iteration)

### Representatives page (bonus, partial Phase 36 scope)
- Results.jsx: compassMode branch replaced CompassCardVertical with identical PoliticianCard + MiniCompass overlay
- `localLensActive`, `isDark`, `deriveScopedTopics` added to Results.jsx
- Auto-enable: when calibrated (3+ answers) and no explicit `ev:compassMode` localStorage entry, compass mode enables automatically (DEFAULT-01 from Phase 36 delivered early)
- Candidate-tinted gradient variant (`rgba(255,254,245,0.97)`) for isCandidate cards

### Bug fixes (opportunistic)
- **CompassContext cross-app sync** (Bug A): ev-context authed slice captured as `evCachedAnswers` fallback when API returns empty
- **CompassContext SSO retry** (Bug B): 401 on `/account/me` now retries SSO before falling back to guest
- **Duplicate races**: ElectionsView deduplicates races with identical candidate-ID sets before grouping (longer position name wins)

## Task Commits

- 34-01/02 execution commits: see 34-01-SUMMARY.md and 34-02-SUMMARY.md
- 34-03 and polish commits: `fca5adc` through `82ca916` on main branch

## Files Created/Modified

- `src/pages/Elections.jsx` — useTheme, userAnswers, compassMode derivation, passes props to ElectionsView
- `src/components/ElectionsView.jsx` — MiniCompass import, deriveScopedTopics, overlay pattern, deduplication
- `src/components/MiniCompass.jsx` — portal tooltip, transparent overlay, dot position math, ringColor, overflow
- `src/pages/Results.jsx` — MiniCompass overlay for reps, localLensActive, deriveScopedTopics, auto-enable
- `src/index.css` — CompassKey dark mode, mini-compass SVG overflow, Topic=no stance hide, gradient variables
- `src/contexts/CompassContext.jsx` — Bug A + Bug B fixes

## Deviations from Plan

- MiniCompass portal tooltip (custom hit-detection) added — original plan deferred tooltip to Phase 35
- Representatives page wiring added — original plan scoped to Elections only
- Auto-enable compass for calibrated users added — originally Phase 36 DEFAULT-01

## Next Phase Readiness

- Phase 35 (Hover Modal) can proceed; full compass modal on hover of mini compass tile
- Phase 36 (Global Controls Bar) still owns: Min/Max, Local Lens toggle bar, per-tile Lens icon
- DEFAULT-01 (auto-enable) already shipped — Phase 36 can skip it

---
*Phase: 34-mini-compass-tile-component*
*Completed: 2026-05-13*
