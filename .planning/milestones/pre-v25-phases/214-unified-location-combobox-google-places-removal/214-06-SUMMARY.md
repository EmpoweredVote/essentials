---
phase: 214-unified-location-combobox-google-places-removal
plan: 06
type: execute
status: complete
autonomous: false
requirements: [SRCH-01, SRCH-02, SRCH-04, SRCH-05, SRCH-06]
completed: 2026-07-21
---

# Plan 214-06 Summary — Human Verification of Shared LocationCombobox

## Self-Check: PASSED

## Outcome

**Operator sign-off: APPROVED.** All interactive behaviors of the shared
`<LocationCombobox>` verified working against the running app (`npm run dev`,
localhost:5173) on both the Results header and the Landing search bar, in light
and dark mode, after Google Places removal.

Verified by operator:
- **SRCH-02 (WAI-ARIA / keyboard):** ArrowDown/Up move the highlight with focus
  retained in the input; Enter selects and navigates; Escape dismisses.
- **SRCH-03/04/05 (three classified input paths):** place-name → ranked
  `/location-search` candidate dropdown (≥3 chars, ~250ms debounce, state-qualified
  rows + Stances badge on covered areas); full street address → no dropdown, inline
  Enter-hint, Census resolve; decimal coordinates → coordinate hint, officials render.
- **SRCH-04 (disambiguation):** same-named places (e.g. "Los Angeles" / "Los Alamos")
  list multiple state-qualified rows; never auto-picks.
- **D-05 (coordinate privacy label):** after a coordinate lookup the resting label
  is exactly the client-typed `lat, lng` — never a server-echoed address. Banner is
  plausible for the point.
- **Coordinate 422 handling:** out-of-US / swapped pairs show the inline coral error;
  the field neither navigates nor clears.
- **SRCH-01/06 (shared-component parity):** identical behavior on Landing (same
  component instance); coverage list still browses (D-04); the separate
  search-candidates-by-name box is untouched.
- **Dark mode:** input, dropdown, hint row, and coral error row all theme correctly
  with readable contrast.

## Deviations / Notes

None to the component behavior. During verification the operator surfaced three
observations that were triaged and confirmed to be **outside Phase 214's scope**
(the combobox faithfully renders resolver data; these are upstream data or new
design scope). All three were captured as follow-up work rather than reopening 214:

1. **Mojibake in resolver labels** — e.g. `CaÃ±ada de los Alamos CDP, NM`
   (`geo_id 3510470`). Confirmed present in the **live `/location-search` API
   response bytes**, i.e. upstream in the Phase 212 gazetteer ingestion
   (UTF-8-read-as-Latin-1). Not a client bug. → captured as Phase-212 data-quality
   follow-up.
2. **Per-type color-coding of city/county/state** — a new design request. The 214
   UI-SPEC color contract reserves teal/coral and forbids decorative color fills, so
   this requires a UI-SPEC revision. → captured as a UI enhancement.
3. **Questionable place records + MTFCC/label mismatch** — e.g. `Los Angeles CDP, TX`
   (`geo_id 4844062`, `mtfcc G4110` = incorporated place, yet name suffixed "CDP").
   Phase 212 gazetteer data quality. → captured with item 1 for a data audit.

## Requirements

SRCH-01, SRCH-02, SRCH-04, SRCH-05, SRCH-06 verified by operator sign-off.
