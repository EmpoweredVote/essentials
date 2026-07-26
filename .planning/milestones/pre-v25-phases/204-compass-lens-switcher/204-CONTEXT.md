# Phase 204: Compass Lens Switcher - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the results-grid's binary on/off "Lens" toggle with a single **global, data-driven lens switcher** — a row of lens chips (a "Best Match" overlap default + every lens from `GET /compass/lenses`) each showing a per-lens calibration state — that sets the comparison topic-set for every card at once. Compass-UI-only; no data-seeding or backend scope beyond confirming the lens API shape.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**11 requirements are locked.** See `204-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `204-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- The global lens-switcher chip row on the results grid, inside `CompassControlsBar`, replacing the binary on/off "Lens" toggle.
- N-lens, data-driven rendering from `GET /compass/lenses` + a synthesized default overlap lens.
- Per-lens calibration state (LIT vs greyed+purple-rim) using the `min(8, size)` "fill it" threshold.
- Purple-rim hover prompt + click → calibration handoff to `compass.empowered.vote` (lens-scoped, return URL).
- Global explicit selection applying to all cards; the overlap lens as the default; retiring per-office auto-lensing.
- The overlap algorithm (compass-first, then biggest disagreements, topic-order tie-break).
- Cross-lens "not enough shared topics" fallback for non-matching cards.
- Persisting the selected lens across visits (localStorage).

**Out of scope (from SPEC.md):**
- Per-card lens controls (rejected as overwhelming).
- Building the calibration quiz inside essentials (reuse the Compass app via return-URL handoff).
- Stance Min/Max and CompassKey behavior (unchanged).
- The compass on/off logo toggle in FilterBar (unchanged; still gates the switcher).
- Reworking the standalone `JudicialCompassSection`.
- Authoring new lens content (State/International topic sets — arrive later as API data).
- Backend changes to `GET /compass/lenses` (assumed to return name/description/color/topicIds).

</spec_lock>

<decisions>
## Implementation Decisions

### Chip Design & States
- **D-01:** Chip style = **separate rounded pills** in a row (reuse the existing `stance-btn` pill styling in `CompassControlsBar.jsx`), NOT a segmented control or underlined tabs.
- **D-02:** Active/selected chip = **filled with that lens's own identity color** from the API (`color`) — Federal navy `#1E3A5F`, Local green `#5A9A6E`, Judicial `#C2440A` — with white text. NOT a uniform coral. (Planner: verify white-on-fill contrast per lens, esp. in dark mode; the fills are chip backgrounds so contrast is white-on-dark, generally fine.)
- **D-03:** Needs-calibration chip = **grey/muted fill + purple ~1.5px ring + dimmed label** (clearly "not ready yet"). Purple ring alone was rejected as too subtle.
- **D-04:** Each chip carries a **per-lens icon + label**. Icon source: mirror EV-CompassV2's per-lens glyphs (Capitol dome = Federal, gavel = Judicial, house = Local) — see `C:\EV-CompassV2\src\pages\CombinedPage.jsx` `renderLensIcon` (~line 1325). The default overlap chip uses a viewfinder/target icon.

### "Best Match" (default overlap lens) Framing
- **D-05:** Visible label = **"Best Match"** (communicates the you-and-them overlap behavior). The **internal key stays `custom`** — do not rename the key, only the display label.
- **D-06:** Position = **first / leftmost** in the row (it's the always-LIT baseline; named lenses read as alternatives).
- **D-07:** It is not an API lens, so give it a synthesized treatment: **brand coral `#FF5740`** as its active-fill "color" + a **target/viewfinder icon**, so it's a visual peer of the named lenses but clearly the house default.

### Overflow & Responsive
- **D-08:** Desktop = the pill row **wraps to multiple rows** when it outgrows width (today's `CompassControlsBar` `flexWrap: 'wrap'` behavior).
- **D-09:** Mobile = a **single-row horizontal scroll strip** (swipe). Two behaviors by breakpoint is acceptable; keep one chip component, switch only the container's wrap/scroll.

### Calibration Handoff
- **D-10:** Clicking a purple chip opens **only that lens's UNANSWERED topics** on `compass.empowered.vote` (fastest path to LIT), not the full lens quiz or full compass.
- **D-11:** Mobile/touch behavior for a purple chip = **first tap reveals a "Calibrate this lens?" prompt inline; second tap (or tapping the prompt) navigates** to the Compass app. Mirrors desktop hover→click; prevents accidental navigation.
- **D-12:** On return from calibration, the calibrated lens is **auto-selected and applied** to the grid (the user came back specifically to use it). LIT-but-not-selected was rejected.

### Claude's Discretion
- Exact pill dimensions, spacing, transition timing, focus-ring styling, and the precise dark-mode variants of each lens color (the federal navy dot-contrast fix from the reverted per-card work is a useful reference).
- Whether the "Best Match" default renders visually "selected" at all times or only implicitly when nothing else is chosen.
- PostHog analytics event naming for lens selection (mirror the existing `essentials_compass_local_lens_toggled` convention).
- Empty/loading state of the switcher while `lenses` hydrate from the API (fallback constants are available immediately).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase (locked requirements)
- `.planning/phases/204-compass-lens-switcher/204-SPEC.md` — Locked requirements, boundaries, acceptance criteria. MUST read before planning.

### Essentials compass internals (integration points)
- `src/contexts/CompassContext.jsx` — `lenses` state (hydrated from `GET /compass/lenses`, fallback constants ~L69-73), `lensOverride` (session-only today; must become persisted per D + Req 11), `getEffectiveLens`/`getEffectiveLensKey` (~L78-97, the per-office auto-lensing to RETIRE), `toggleLens`/`toggleLocalLens`/`setLocalLens` (~L100, L428-440).
- `src/lib/compass.js` — `computeDisplaySpokes()` (L486-560, extend for the "Best Match" biggest-disagreement fill + `min(8,size)` calibration check); `LOCAL/FEDERAL/JUDICIAL_LENS_TOPICS` (L378+, L406, L422); `GUEST_COMPASS_KEY` + guest cache (L195-223); `COMPASS_URL` handoff pattern.
- `src/components/CompassControlsBar.jsx` — current single "Lens" toggle (viewfinder icon) to REPLACE; `stance-btn` pill styling + coral-active pattern to reuse; `flexWrap` container.
- `src/components/CompassCard.jsx` — per-card consumer of `getEffectiveLens`/`getEffectiveLensKey` (~L52-69); `COMPASS_URL` + `return` handoff via the "Take the Quiz" `ctaHref` (~L117-118) — the model for the calibration handoff.
- `src/components/FilterBar.jsx` — the compass on/off logo toggle (`compassMode`) that gates whether the switcher shows (unchanged).
- `src/pages/Results.jsx` — owns `compassMode`, renders `CompassControlsBar`, and forwards lens/compass state; `isLocalDistrict()` scope mapping (~L55, L1477).

### Cross-app parity (mirror, do not fork blindly)
- `C:\EV-CompassV2\src\lib\lenses.js` — canonical lens data shape (`{ key, name, description, color, icon?, topicIds, autoDistrictTypes }`), `normalizeApiLens`, `getTopicsForLens`, `isLensTopicSet`.
- `C:\EV-CompassV2\src\pages\CombinedPage.jsx` — lens switcher UI (~L1552-1586), `renderLensIcon` (~L1325), `doStartLens`/`exitToCompass`, `federalLensCalibrated` calibration-state logic (~L1209-1215), auto-federal default (~L1351-1375).
- `C:\EV-CompassV2\src\components\CalibrationOverlay.jsx` + `CompassContext.jsx` `refreshData()` (`GET /compass/lenses` at ~L342) — calibration flow + hydration to mirror.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`stance-btn` pill + coral-active styling** (`CompassControlsBar.jsx`): the visual base for the lens pills (D-01, D-07).
- **`computeDisplaySpokes()`** (`compass.js` L486-560): already does "topics both answered, prefer chosen set, cap 8." Extend — don't fork — for the Best Match biggest-disagreement fill (Req 9) and the `min(8,size)` calibration check (Req 4).
- **`COMPASS_URL` + `return` handoff** (`CompassCard.jsx` `ctaHref`): the exact pattern for the calibration navigation (D-10/D-11/D-12).
- **`lenses` array + fallback constants** (`CompassContext.jsx`): the N-lens registry — the switcher maps over this + synthesizes the Best Match chip (Req 2).
- **The reverted per-card indicator work** (this session): `LENS_META` color map + the federal-navy dark-mode dot-contrast fix (`colorDark`) is a useful reference for D-02's per-lens dark variants.

### Established Patterns
- **`lensOverride` is deliberately session-only today** — Req 11 changes this to persisted (`localStorage['ev:compassLens']`). The planner must migrate the semantics from a null|true|false session flag to a persisted lens key.
- **Per-office auto-lensing via `getEffectiveLensKey`** — this phase RETIRES it (D + Req 8). Trace all consumers (`CompassCard`, `ElectionsView`, `Results`) so removing the auto behavior doesn't regress spoke selection.
- **Guest + logged-in compass** both flow through `userAnswers`/`selectedTopics`; the switcher + persistence must work for guests too.

### Integration Points
- `CompassControlsBar.jsx` — the switcher physically replaces the current Lens toggle here.
- `CompassContext.jsx` — holds the active lens (new persisted state), the `lenses` registry, and the (retired) auto-lens helpers.
- `compass.js#computeDisplaySpokes` — the spoke engine that every card's compass uses; the Best Match algorithm and calibration threshold live here or in its caller.
- `compass.empowered.vote` (EV-CompassV2) — the calibration handoff target; **requires a lens-scoped-unanswered-topics entry point + return-URL contract** (see research flags).

</code_context>

<specifics>
## Specific Ideas

- "**Best Match**" is the user's chosen public name for the overlap default (they had been calling it "custom"); the internal key stays `custom`.
- Active chips should carry **lens identity color**, not a uniform highlight — the user wants each lens visually distinct.
- The purple-rim state should read clearly as "calibrate me," including a **hover prompt (desktop) / tap-to-prompt (mobile)** affordance before navigating away.
- Mirror **EV-CompassV2** lens iconography and calibration semantics for cross-app consistency (the user owns both apps).

</specifics>

<deferred>
## Deferred Ideas

- **State / International lenses** — explicitly future; this phase only guarantees the switcher renders whatever `GET /compass/lenses` returns (data, not code). No new topic-set authoring now.
- **Reworking the standalone `JudicialCompassSection`** — Judicial becomes a grid lens; the separate profile section stays as-is.
- **Bringing the switcher to the profile CompassCard** — this phase is grid-only (per-card was rejected as overwhelming).

## Research / Planning Flags — RESOLVED 2026-07-14
- **✅ API metadata dependency — RESOLVED, no backend work.** `getCompassLenses()` (`C:\EV-Accounts\backend\src\lib\compassService.ts` L190-217) already selects and returns per lens: `{ key, name, description, color, icon, autoDistrictTypes, topicIds }`. So `GET /api/compass/lenses` provides everything the chips need. Essentials' `CompassContext.lenses` currently **drops** `name`/`description`/`icon` on hydration — the only work is to stop dropping them (a frontend change already in Phase 204 scope).
- **✅ Calibrate-URL contract — RESOLVED, bridge built in EV-CompassV2.** Contract: essentials links a purple lens to
  **`compass.empowered.vote/?calibrate=<lensKey>&return=<essentialsResultsUrl>`**.
  EV-CompassV2 (`feat/lenses-from-api`, commit `5d0016c`) now: `App.jsx` stashes `?calibrate=<key>` to `sessionStorage.start_calibrate_lens` on mount (survives the HelpGuard redirect); `CombinedPage` consumes it once (after lenses+topics load) and calls the existing `doCalibrateLens(lensByKey(key))` — generalized to **any** lens key (future State/International included). The `?return=` round-trip (ReturnBanner → back with compass fragment) is unchanged.
  - **Verified (dev):** capture → consume → `doCalibrateLens` dispatch + return-banner all work end-to-end, no errors (build passes; Playwright drive on a dev server).
  - **⚠ Validation item for execute-phase:** confirm with a **real calibrated account** that the federal handoff lands directly on that lens's topics. With an empty simulated guest, CompassV2's overlay showed its generic new-user onboarding intro ("Start with Local Lens") rather than jumping to Federal — this is the overlay's existing new-user branch (our change reuses the same `doCalibrateLens` as CompassV2's internal "Set up Federal Lens" button), but it needs a real-account check to confirm the landing screen. If the intro appears for real users too, that's a follow-up in EV-CompassV2's overlay, not essentials.

</deferred>

---

*Phase: 204-compass-lens-switcher*
*Context gathered: 2026-07-13*
