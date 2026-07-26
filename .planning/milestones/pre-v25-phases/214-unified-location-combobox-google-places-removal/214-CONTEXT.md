# Phase 214: Unified Location Combobox & Google Places Removal - Context

**Gathered:** 2026-07-21
**Status:** Ready for planning

<domain>
## Phase Boundary

One accessible, always-editable **location combobox** — a single shared component powering **both** the Results header and the Landing-page search bar — that silently classifies typed input (full street address / bare place-name / decimal `lat, lng` coordinates), dispatches to the correct resolver with no manual mode switch, and surfaces disambiguated candidates before navigating. It **replaces** the Results Address/Browse mode toggle and the state→county→city `LocationBrowser` tree, and **fully retires Google Places**.

**Frontend repo:** `C:\Transparent Motivations\essentials` (Render deploy on push to `main`). This phase is **frontend-only** and consumes the two backend endpoints already shipped + live-smoke-tested in Phases 212 and 213:
- `GET /essentials/location-search` (ranked, state-qualified place-name candidates with a `has_local_data` coverage signal) + `/resolve` (national-fallback floor) — Phase 212.
- `POST /essentials/coordinate-lookup` (`{lat,lng}` → officials; empty `matchedAddress`; `OUTSIDE_US_BOUNDS`/`SWAPPED_COORDINATES`/`INVALID_COORDINATES` 422 taxonomy) — Phase 213.

Neither endpoint is wired into the frontend `src/lib/api.jsx` yet — adding those client functions is part of this phase.

**This phase does NOT:** default the type filter to Elected, collapse compass lenses to icons, or remove the "Search by name" results filter — all of that is **Phase 215**. It does not change backend contracts (212/213 are locked). It does not add reverse-geocoding or any new capability beyond the combobox + Google removal.

**Landing.jsx rides along INSIDE this phase** (milestone convention) — it shares the exact Google-bound modules being retired, so a partial removal would break it or leave Google Places only half-dropped.

</domain>

<decisions>
## Implementation Decisions

### Address autocomplete gap (SRCH-03; consequence of SRCH-08)
- **D-01:** **Accept the loss of live street-address autocomplete + show an Enter-hint.** Google Places was the only live street-address suggester; there is no free backend replacement (the new `/location-search` is place-names only, and the Census one-line geocoder is submit-time only and MUST NOT be fed bare names — milestone convention). Full addresses therefore have **no live dropdown**: the user types the address and submits (Enter/button), and Census geocodes it on submit via the existing address path. When the input **looks like a street address**, render a subtle inline hint row (e.g. "Press Enter to look up this address") so the field never reads as broken/unresponsive.

### Input classification & typeahead firing (SRCH-02, SRCH-03, SRCH-05)
- **D-02:** **Client-side heuristic classification + debounced DB query for names only.**
  - **Coordinates:** recognized locally by a decimal `lat, lng` regex → NOT sent to `/location-search`; dispatched to `POST /essentials/coordinate-lookup` on submit.
  - **Street addresses:** recognized locally (leading street number / digits) → NOT sent to the resolver; handled on submit through the existing address search path (Census geocode). This is where the D-01 Enter-hint appears.
  - **Bare place-names:** everything name-like → debounce-queries `GET /essentials/location-search` (~250 ms debounce, ~3-char minimum — planner may tune) for **live candidate suggestions** in the dropdown.
- **D-06:** Exact regexes, debounce ms, and min-char threshold are planner/researcher discretion; the split (coords + addresses local, names → resolver) is locked.

### Results resting & edit state (SRCH-01)
- **D-03:** **One always-editable text input**, pre-filled with the current location label; **focus selects-all** for easy replacement. No pill→input display/edit toggle (rejected — adds a state machine for no real gain and reads less honestly against "always-editable"). The field itself IS the resting state.
- **D-07:** **Resting label text** (Claude's discretion, follow existing Results logic): after an **address** resolve show the formatted address (title-cased, via the existing `toAddressTitleCase`); after a **place-name** resolve show the place label (`City, ST`); after a **coordinate** resolve show the typed coordinates (see D-05).

### Empty-field discovery (replaces LocationBrowser)
- **D-04:** **Nothing on empty focus — keep it clean.** No dropdown until the user types. Discovery moves to typing; **Landing keeps its existing coverage list** as the browse entry point. This matches the milestone's declutter intent — the state→county→city tree is retired, not reincarnated as an empty-state panel.

### Candidate picker + error/empty states (SRCH-04)
- **D-08:** **Inline dropdown, reuse the `LocalityMatches` listbox pattern.** Ambiguous candidates render **in the combobox listbox** (not a separate step/screen). Each row shows: the **state qualifier** (`City, ST` / `County, ST` / `ST`), an **area-type tag**, and a **"Stances" badge when `has_local_data` is true** (the coverage signal from the 212 response). No silent best-guess — the user always picks. Coordinate-lookup `422`s (the 3 codes) and no-match/uncovered results render as an **inline message row** under the field.

### Coordinate result label (privacy-aware)
- **D-05:** **Echo the typed `lat, lng` as the field label — client-side only.** Phase 213 deliberately never returns the coordinates (empty `matchedAddress`), so the label MUST come from what the user typed in the browser, **never** from the server response. This keeps the resting state from going blank after a coordinate lookup without violating the 213 no-echo privacy contract.

### Google Places removal (SRCH-08 — audited at phase end)
- **D-09:** **Full retirement, verified by grep.** Delete `src/hooks/useGooglePlacesAutocomplete.js`; remove the Google Geocoder `classifyQuery` path from `src/lib/localitySearch.js` (replace its classification role with D-02's client heuristic + the DB resolver, or delete/replace the module); drop the `.pac-container { display:none }` workaround CSS (in `LocalityMatches.jsx`) once the combobox owns its own keyboard/dropdown; and **uninstall `@googlemaps/js-api-loader`** from `package.json`/lockfile. End-of-phase acceptance: a full-repo grep for `google` / `pac-container` / `window.google` returns **zero hits outside deleted files** (milestone convention).

### Claude's Discretion
- Exact classification regexes, debounce interval, min-char threshold (D-06).
- Whether `localitySearch.js` is refactored in place or deleted and replaced (D-09) — as long as no Google dependency survives and covered-city/county/state routing still works via the new resolver.
- Component name/location for the shared combobox, its internal WAI-ARIA implementation (roles, `aria-activedescendant`, keyboard handling), and how it supersedes `LocalityMatches`' document-level key-capture hack (which existed only to beat Google's listener — no longer needed).
- Exact friendly copy for the Enter-hint (D-01), the 3 coordinate-error messages (D-08), and the no-match/uncovered message.
- How the coordinate path renders results on Results (it returns an `AddressSearchResult`-shaped payload with empty `matchedAddress` and no `browse_geo_id`) — dispatch mechanics are planner discretion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` §SRCH — SRCH-01 through SRCH-06 + SRCH-08 (this phase). Note SRCH-07 + HDR-* are **Phase 215**, not here.
- `.planning/ROADMAP.md` §"Phase 214" — goal + 5 success criteria, and the milestone-wide conventions (**backend-before-frontend hard dependency** [satisfied — 212/213 live]; **never route bare place-names through the Census geocoder**; **ambiguity always surfaces a candidate list, never a silent best guess**; **Landing.jsx rides along inside Phase 214**; **Google removal audited at phase end with a full-repo grep**).

### Backend contracts this phase consumes (already live — backend repo `C:\EV-Accounts`)
- `.planning/phases/212-backend-place-name-resolver-national-fallback/212-CONTEXT.md` — `/essentials/location-search` candidate shape `{geo_id, mtfcc, label, state, has_local_data}` (D-05/D-07 there: label = `Name, ST · <City|County|State>`; `has_local_data` = seeded roster exists), `/resolve` national-fallback floor, curated-boosted ranking, wrong-state guard.
- `.planning/phases/213-anonymous-coordinate-lookup-endpoint/213-CONTEXT.md` — `POST /essentials/coordinate-lookup` `{lat,lng}` contract: empty `matchedAddress` (no coord echo — D-05/D-06 there), the `OUTSIDE_US_BOUNDS` / `SWAPPED_COORDINATES` / `INVALID_COORDINATES` 422 taxonomy (D-07 there) that D-08 above maps to user messaging.

### Existing frontend code to replace/extend (this repo)
- `src/pages/Results.jsx` — the Address/Browse `searchMode` toggle, `addressInput`/`addressInputRef` state, `handleAddressSearch` (lines ~969), `useGooglePlacesAutocomplete` wiring (~1007), `resolveLocalityRoute` fallback (~982), and the resting-label derivation (`toAddressTitleCase`, browse_label). The combobox replaces the toggle + `LocationBrowser` render here.
- `src/pages/Landing.jsx` — `handleSearch` (~83), `useGooglePlacesAutocomplete` (~50), `resolveLocalityRoute` (~97), `LocalityMatches` (~307), `coverageAreaToPath`. Must adopt the SAME shared combobox (SRCH-06) and keep its coverage list as the browse entry point (D-04).
- `src/components/LocalityMatches.jsx` — the listbox row styling + state-qualifier/`kind`/`hasContext`-badge markup to **reuse** for D-08; its document-level ArrowUp/Down/Enter capture + `.pac-container` hide exist **only** to beat Google's listener and can be dropped (D-09).
- `src/lib/localitySearch.js` — the Google-Geocoder `classifyQuery` + `resolveLocalityRoute` to **replace** with the D-02 client heuristic + DB resolver (D-09).
- `src/hooks/useGooglePlacesAutocomplete.js` — **delete** (D-09).
- `src/components/LocationBrowser.jsx` — the state→county→city tree being **removed** from Results (D-04); confirm no other consumer before deleting.
- `src/lib/api.jsx` — where new `location-search` / `coordinate-lookup` client functions land (alongside `searchPoliticians`, `browseByArea`, `fetchElectionsByAddress`, etc.).
- `package.json` — `@googlemaps/js-api-loader` (^2.0.2) to uninstall (D-09).

### Related memories (project GOTCHAs)
- `project_representing_city_banner_hijack.md` — Results.jsx already skips `NATIONAL_*/STATE_*` for the city banner; the resolver-driven flow must not reintroduce the stray-`representing_city` banner hijack.
- `project_search_api_contract.md` — POST `/candidates/search {query}` requires a full street address; the new combobox must keep bare-name traffic off that address path (feeds D-02).
- `feedback_no_google_places.md` — no Places autocomplete; address inputs are plain text (this phase's whole premise).
- `feedback_discuss_phase_format.md` — followed here (explain-why + recommend before each question).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LocalityMatches.jsx` listbox markup — the `role="listbox"`/`role="option"` rows, teal label + `, ST` qualifier, `kind` pill, and `hasContext`→"Stances" badge are the exact D-08 candidate-row pattern; lift the visual pattern into the shared combobox and drop the Google-specific key-capture/`pac-container` scaffolding.
- `toAddressTitleCase` (`Results.jsx:114`) — reuse for the D-07 address resting-label.
- `coverageAreaToPath` / `searchCoverageAreas` / `normalizePlace` (`src/lib/coverage.js`) — coverage routing + name normalization already used by Landing; reuse for covered-area dispatch.
- Existing browse/elections dispatch (`browseByArea`, `fetchElectionsByArea`, `fetchElectionsByAddress` in `api.jsx`, and the `browse_geo_id`/`browse_mtfcc`/`from_locality` route params) — the candidate-selection navigation target once a place resolves.

### Established Patterns
- `apiFetch` / `publicFetch` wrappers (`src/lib/auth.jsx`) — all new endpoint calls go through these (Bearer/public handling), matching every function in `api.jsx`.
- Results routes state through `/results?…` query params (`q=`, `browse_geo_id=`, `mode=browse`, `prefilled=true`); the combobox dispatch continues that convention rather than inventing new client-only state.
- Dark-mode + `var(--ev-teal)` token styling throughout; the combobox must theme both modes (per `feedback_dark_mode_ev_ui_important`).

### Integration Points
- Two new `api.jsx` client functions: place-name search (`GET /essentials/location-search`) and coordinate lookup (`POST /essentials/coordinate-lookup`).
- One shared combobox component consumed by both `Results.jsx` (header, pre-filled/editable) and `Landing.jsx` (search bar) — SRCH-06.
- Deletions: `useGooglePlacesAutocomplete.js`, the Google path in `localitySearch.js`, `LocationBrowser.jsx` (from Results), `@googlemaps/js-api-loader` dep.

</code_context>

<specifics>
## Specific Ideas

- The combobox is the frontend seam that unifies Phase 212's fuzzy place-name search and Phase 213's precise-point coordinate lookup behind one field — the "own the search stack, drop Google" thesis of v24.0.
- Privacy nuance the planner must respect: the coordinate label the user sees (D-05) is reconstructed **client-side** from their own keystrokes — the server contract (213) intentionally returns no coordinates, and this phase must not undermine that.
- Address input intentionally becomes plain-text-submit (D-01) — this is the accepted, deliberate downgrade from Google's live suggestions, softened only by the Enter-hint, not by resurrecting an autocomplete provider.

</specifics>

<deferred>
## Deferred Ideas

- **Type-filter Elected default, compass-lens icon buttons, "Search by name" removal** — all **Phase 215** (SRCH-07, HDR-01/02/03). Not this phase.
- **Live street-address autocomplete replacement** — no provider in scope; explicitly accepted as a gap (D-01). Revisit only if a licensable/DB-backed address suggester is ever added (would be its own phase).
- **Empty-state discovery panel on Results** (recent/popular/covered hints) — rejected for now (D-04, keep clean); could be a future enhancement if discovery proves weak post-launch.

None of these expand the phase boundary — discussion stayed within scope.

</deferred>

---

*Phase: 214-unified-location-combobox-google-places-removal*
*Context gathered: 2026-07-21*
