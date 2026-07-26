# Phase 215: Header Declutter — Elected Default, Compass Icons, Search-by-Name Removal - Context

**Gathered:** 2026-07-21
**Status:** Ready for planning

<domain>
## Phase Boundary

The results-page header carries only what matters: an honest Elected-by-default type filter that never silently empties the Judges tab, compact accessible compass-lens icon buttons, and no redundant name-search box. Touches the header/filter controls only (`FilterBar.jsx`, `CompassControlsBar.jsx`, `LensChipRow.jsx`, and the filter surfaces in `Results.jsx` / `LocalFilterSidebar.jsx` / `ResultsHeader.jsx`). No dependency on the search-rewrite phases (212–214). Requirements: SRCH-07, HDR-01, HDR-02, HDR-03.

</domain>

<decisions>
## Implementation Decisions

### Compass Lens Display (HDR-03)
- **D-01:** Responsive treatment — **desktop: icon-only** lens buttons (reclaims the empty header space); **mobile: keep icon + text label** (mobile is already a cramped horizontal scroll strip, and a tap already selects a lens so tap-to-reveal tooltips would conflict).
- **D-02:** Tooltip affordance must be **keyboard-focus- and hover-accessible on desktop** with an `aria-label` on every button — NOT the native `title` attribute (fails keyboard/touch and is the current mechanism in `LensChipRow`). Judicial lens uses the existing gavel icon.
- **D-03:** Partially honors prior VA compass feedback ([[project_va_compass_ui_feedback]] — wanted tooltips + larger labels): tooltips are added and labels survive on mobile; desktop trades visible labels for the decluttered icon-only row.

### Officials Type Filter (HDR-01 / HDR-02)
- **D-04:** **Remove the All/Appointed type dropdown entirely** from every surface it appears on (`FilterBar.jsx`, `LocalFilterSidebar.jsx`, `ResultsHeader.jsx`).
- **D-05:** **Per-tab default matrix:** Representatives = Elected, Educators = Elected, Judges = Appointed. The Judges override is what keeps HDR-01's Elected default from emptying the Judges tab.
- **D-06:** **Accepted trade-off:** with the dropdown gone, appointed *non-judge* officials become unreachable on the Reps/Educators tabs (elected-only there). This is intended per the "honest default" goal; appointed officials remain visible on the Judges tab.

### Search-by-Name (SRCH-07)
- **D-07:** **Remove the in-list "Search by name" box entirely** — do not relocate the capability. Redundant now that the Phase-214 LocationCombobox handles finding places and per-location result lists are short enough to scan.

### Verification
- **D-08:** Prove the Judges tab is not silently emptied by the Elected default at **Bloomington, IN** — a location with real geo-linked judges. (CA judicial districts have NULL geo_id and empty the Judges tab, per [[project_ca_judicial_districts_null_geoid]], so CA is not a valid test location.)

### Claude's Discretion
- Exact tooltip implementation (custom lightweight component vs an ev-ui primitive) — as long as it satisfies D-02 (focus + hover + `aria-label`).
- How the new tab-aware Elected default reconciles with the **cached** `appointedFilter` value (`Results.jsx:505`) — planner/researcher to determine whether the cache is cleared, migrated, or made tab-scoped.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` — Phase 215 section (goal, success criteria, "Depends on: nothing" note).
- `.planning/REQUIREMENTS.md` §SRCH-07, §HDR-01, §HDR-02, §HDR-03 — the four requirements this phase closes.

No external ADRs/specs — requirements are fully captured in the decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/LensChipRow.jsx` → `renderLensIcon(lens)`: already maps each lens key to an icon (Capitol dome=federal, **gavel=judicial**, house=local, viewfinder=custom, dot fallback). Icon-only mode reuses this directly.
- `.stance-btn` button class and the opaque chip surface (`#FFFFFF` / `#161b22`) — icon buttons must stay opaque because they overlay the location banner.
- `useMediaQuery` from `@empoweredvote/ev-ui` (already used in `FilterBar.jsx`) for the desktop/mobile split in D-01.

### Established Patterns
- **Opaque-surface rule:** lens controls overlay the banner photo, so every state needs an opaque fill (see `LensChipRow` comments) — an icon-only variant must preserve this.
- **Dark-mode color handling:** `lightenForDark()` keeps dark lens colors (federal navy) legible on the dark chip surface — reuse for icon strokes/borders.

### Integration Points
- `src/pages/Results.jsx:505` — `appointedFilter` `useState` defaults to `'All'` (per old FILT-03) and is cache-seeded. HDR-01/HDR-02 change this to a **tab-aware default** (Elected, except Judges=Appointed).
- Filter controls render in **three** surfaces — `FilterBar.jsx`, `LocalFilterSidebar.jsx`, `ResultsHeader.jsx` — dropdown + search removal must cover all three, not just `FilterBar`.
- Tab state: `effectiveActiveView` ∈ `representatives|educators|judges` (`Results.jsx:2041-2056`), rendered via `renderPeopleTab(..., '<view>')` — the hook point for the per-tab default matrix.
- `CompassControlsBar.jsx` renders `LensChipRow` (desktop `flexWrap` row vs mobile `overflowX:auto` strip) — the D-01 responsive split lives here + in `LensChipRow`.
- `Results.jsx:2130` / `:2235` — empty-state and fallback-list logic branch on `appointedFilter !== 'All'`; revisit once the default is no longer `'All'`.
- **Out of scope:** `FilterBar.jsx` also contains a separate **Compass on/off toggle** (lines ~126-160). It is not part of HDR-01/02/03 or SRCH-07 — leave it untouched.

</code_context>

<specifics>
## Specific Ideas

The lens tooltip should read as a genuine label/description on hover+focus (e.g. lens name/description already available via `lens.description || lens.name`), replacing the current native `title`. Gavel icon for Judicial is explicitly called out in the ROADMAP success criteria and already exists in `renderLensIcon`.

</specifics>

<deferred>
## Deferred Ideas

- **Compass on/off toggle restyle** — the FilterBar Compass toggle is a header element but outside this phase's four requirements; any restyle is its own future work.

### Reviewed Todos (not folded)
All three matched todos are Phase-214 search/combobox domain, not header declutter — considered and deferred:
- **LocationCombobox non-blocking search refinements** (from 214 review) — belongs to the search track.
- **Color-code city/county/state area-type in LocationCombobox rows** — combobox rows, not header controls.
- **Audit Phase 212 gazetteer place data (encoding + invalid records)** — backend data audit, unrelated to the header.

</deferred>

---

*Phase: 215-header-declutter-elected-default-compass-icons-search-by-name-removal*
*Context gathered: 2026-07-21*
