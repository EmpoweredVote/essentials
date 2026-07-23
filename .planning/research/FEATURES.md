# Feature Research

**Domain:** Unified civic location search ("one field to a location profile") for an address→officials lookup app
**Researched:** 2026-07-20
**Confidence:** MEDIUM (WAI-ARIA/geocoding mechanics HIGH via W3C/Census docs; competitive UX patterns MEDIUM via multiple corroborating sources; no Context7 library applicable to this domain)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in any "type where you live, get your officials" flow. Missing these makes the new search feel broken relative to Google/Zillow-caliber search boxes users already know.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Single field accepts address, city, city+state, county, state, and ZIP without a mode switch | Users don't self-classify their input type — Google/Zillow/Redfin search boxes all do free-text-in, disambiguate-behind-the-scenes | MEDIUM | Requires an input classifier (regex/heuristic pass: pure digits → ZIP or lat/lng; comma-separated two-number pair → coordinates; contains a number + street suffix → address; else → place name) that routes to the right backend resolver before or instead of Census geocode |
| Typeahead suggestions while typing | Users expect a dropdown of candidates, not a "search" button they must click blind — this is the baseline UX of every modern location box | MEDIUM | Debounce 200–300ms; minLength 2–3 chars; cap suggestions at ~5–8 to avoid overwhelming (industry convention, not a hard standard) — [Autocomplete system design](https://systemdesignschool.io/problems/typeahead/solution), [Debounce timing](https://spin.atomicobject.com/2018/06/04/automplete-timing-debouncing/) |
| Disambiguation of duplicate place names with state (e.g. "Springfield" → Springfield, IL / Springfield, MA / Springfield, OH…) | Springfield is not a joke — there are 41+ US Springfields; any city-name search WILL collide | MEDIUM | Standard geocoder behavior is to return a ranked candidate list, not force a single guess: "geocoders already return multiple results for ambiguous queries" — [Geocode disambiguation discussion](https://groups.google.com/g/google-maps-js-api-v3/c/UAyUg1BWyoo). Suggestion rows must always show `City, ST` (or `County, ST` / `ST`) — never bare city name — so the user disambiguates by reading, not by guessing |
| Graceful "no match" / "not found" state with a next step | Every search box eventually gets garbage input; users expect an explicit message, not a silent blank result or a crash | LOW | Show a "We couldn't find that location — try a full street address or city, state" message; never route to an empty/broken profile page |
| Pressing Enter (without picking a suggestion) still resolves to a best-guess result | Power users type-and-Enter; forcing a dropdown click-only interaction is a common and frustrating anti-pattern | MEDIUM | Standard combobox behavior: Enter either commits the currently-highlighted suggestion or, if none is highlighted, submits the raw text to the resolver for a best-effort match |
| Editable "current location" is pre-filled and instantly editable (not a separate "change location" flow) | This is the milestone's explicit design goal, and it matches best-in-class location bars (Airbnb, Google Maps, Zillow) that always show *where you are* and let you type over it directly | LOW–MEDIUM | Click/tap or focus selects-all or opens edit mode instantly — no extra "edit" button click required first |
| National fallback: any resolvable US input returns *something* (state + federal reps) even where local/city data is thin | Users in a not-yet-deep-seeded city must not hit a dead end — matches the project's own explicit v24.0 goal and the general civic-tech norm (ProPublica/5 Calls/Common Cause all guarantee at least federal-level results from a ZIP) | HIGH | **Dependency gap** — nationwide federal fallback requires TIGER congressional-district (CD) and state-boundary geofences for *every* state, not just the ones already deep-seeded. Confirm 50-state CD/state coverage exists before promising this; if any states lack CD/state geofences, fallback will itself be thin for those states. Coordinate this with the roadmapper explicitly. |
| Loading/pending state on the field while resolving | Any async network round-trip (geocode, name resolver, coordinate lookup) needs a visible pending indicator or the box feels unresponsive | LOW | Simple spinner/skeleton in the suggestion panel is sufficient |
| Keyboard-only operability (arrow keys, Enter, Escape) | Table stakes for any interactive listbox, not just an accessibility nicety — this is baseline expected behavior for anyone who tabs into a form | MEDIUM | Implement per WAI-ARIA APG Combobox pattern (see Accessibility below) |
| Mobile-friendly input (large tap target, no zoom-jump, numeric keyboard hinting where useful) | Majority-mobile traffic for a "look up my rep" tool; a field that's fussy on a phone kills the core use case | LOW | Standard responsive input styling; `inputmode` hints not required but helpful for ZIP-only entry |

### Differentiators (Competitive Advantage)

Features that set this specific search apart from a generic address box, aligned with Essentials' antipartisan/anonymous-first Core Value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| One field truly unifies address / city / county / state / coordinates — no mode toggle at all | Most civic tools (5 Calls, My Reps, house.gov) still ask you to choose ZIP vs. address vs. use-my-location as separate affordances; collapsing this into one intelligent field with silent classification is the actual milestone differentiator | HIGH | This is the whole point of v24.0 — the field itself IS the differentiator, not any single input type. Complexity lives in the backend classifier + fallback chain (name resolver → Census geocode → coordinate parser), not in any one path alone |
| Coordinate paste support (`38.9072, -77.0369`, `38.9072 -77.0369`, or DMS `38°54'25.9"N 77°02'11.7"W`) | Power users copy/paste coordinates from Google Maps, GPS devices, or a "share location" link; almost no civic-lookup competitor accepts raw lat/lng directly in the main search box | MEDIUM | Parse both decimal-degrees (comma OR space separated) and DMS with N/S/E/W suffixes; convert DMS→decimal before hitting the coordinate lookup endpoint. Regex patterns are well-documented — [geo-coordinates-parser npm](https://www.npmjs.com/package/geo-coordinates-parser), [DMS/DD regex gist](https://gist.github.com/pjobson/8f44ea79d1852900457bc257a4c9fcd5) |
| Own-data typeahead (DB place-names + curated catalog) replacing Google Places entirely | No third-party branding, no Google ToS/billing dependency, no ad-tech data leakage on a civic tool that markets itself as antipartisan and privacy-respecting — matches the existing "No Google Places autocomplete" constraint already in PROJECT.md | MEDIUM–HIGH | This is explicitly called out in the milestone; the differentiator is trust/privacy positioning, not novel UX. Suggestion ranking should prioritize (a) exact place-name matches in already-covered geo_ids, then (b) the broader nationwide place-name catalog, then (c) raw address candidates from Census |
| Consistent single profile destination regardless of input granularity | Typing "Texas", "Collin County", or a full Plano street address all land on a coherent, appropriately-scoped profile (state page vs. county page vs. individual address results) rather than three different UI paradigms | MEDIUM | Requires a routing decision table: state name/abbrev → state browse page; county name → county browse page; city/city+state → city browse (existing browse-by-government-list); full address → existing PostGIS address lookup. This reuses existing browse-by-geo_id infrastructure rather than building new pages |
| Anonymous-first — no account, no saved-location requirement, no forced geolocation permission prompt on load | Matches Core Value ("without creating an account") and the project's own EDOC-01 constraint (never re-prompt Connected users); an unsolicited browser geolocation permission popup on page load is a known dark-pattern users resent | LOW | Geolocation (if offered at all) should be an explicit opt-in affordance (an icon/button in the field), never auto-triggered — consistent with the existing `ev:autoOpenMyLocation` opt-in memory pattern already in place for Connected users |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for this specific field, or actively conflict with existing project constraints.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Auto-triggering the browser geolocation prompt on page load | "Just detect where I am automatically, it's more convenient" | Permission-prompt-on-load is a well-documented dark pattern; most users decline or are startled by it, and it conflicts with the project's own opt-in-only geolocation precedent (`ev:autoOpenMyLocation`) and anonymous-first framing | Offer a small optional "use my location" icon/button inside the field that the user must click; never fire it automatically |
| Requiring the user to pick a suggestion before submitting (no free-text Enter) | "Forces clean data, avoids garbage geocode requests" | Breaks the basic combobox contract users expect (type-and-Enter); frustrates power users who know exactly what they want to type and don't want to wait for/click a dropdown | Allow Enter to submit raw text through the same resolver chain used for suggestion clicks; treat it as a "zero-th" suggestion |
| ZIP-code-only lookup as the primary input method | "ZIPs are what everyone remembers" | ZIP codes routinely straddle multiple congressional/state-legislative districts and even multiple cities/counties — a documented low-accuracy source ("zip codes... are very likely to produce low-accuracy results" — [5 Calls API docs](https://5calls.org/representatives-api/)); using ZIP as the *primary* signal risks silently wrong officials, which is especially bad for an antipartisan civic-accuracy product | Accept ZIP as one of several inputs, but weight full street address highest for accuracy, and always disambiguate ZIP-only input to the geographic centroid with a visible caveat that results may span multiple districts |
| Re-adding "Search by name" (politician name filter) inside the location field | "Users might want both in one box" | Explicitly being removed this milestone; conflating politician-name search with location search doubles the field's job and re-introduces exactly the clutter this milestone is designed to eliminate | Keep name-based politician search out of scope entirely (already decided); if ever revisited, it should be a wholly separate control, not merged into the location combobox |
| Restoring the old state→county→city LocationBrowser tree as a "fallback" UI alongside the new field | "Keep the old flow as a safety net" | Reintroduces the exact multi-row, multi-mode clutter this milestone exists to remove; a tree-picker and a smart combobox solving the same problem is redundant surface area to maintain | Fully replace the tree with browse-by-geo_id destinations reached *through* the unified field (typing a state/county/city name routes there) |
| International address support / non-US geocoding | "Might as well be global" | Out of scope — this is explicitly a US civic-officials lookup (Census geocoder is US-only, TIGER geofences are US-only, all seeded government data is US-only); building for international inputs adds classifier complexity for zero addressable users | Explicitly scope the classifier and all resolvers to US-only inputs; return the "not found" state for anything that looks non-US |
| Third-party ad-supported/branded autocomplete widgets (Google Places, Mapbox Search, etc.) | "Fastest way to get good typeahead quality" | Explicitly ruled out this milestone — third-party ads/branding on the form, external billing dependency, and a data-sharing relationship inconsistent with an antipartisan/privacy-respecting positioning (already an enforced anti-pattern in PROJECT.md: "No Google Places autocomplete") | Own the stack: DB place-names + curated catalog + free US Census geocoder + a new backend name resolver + coordinate lookup endpoint (as the milestone already specifies) |

## Feature Dependencies

```
Unified location search field (one input, free text)
    ├──requires──> Input classifier (address vs place-name vs ZIP vs coordinates)
    │                  ├──requires──> Coordinate parser (decimal + DMS, comma/space separated)
    │                  │                  └──requires──> NEW coordinate lookup endpoint (reverse-geocode coords → PostGIS ST_Covers)
    │                  ├──requires──> NEW backend place-name resolver (city/city+state/county/state → geo_id)
    │                  │                  └──requires──> DB place-name catalog (own data, replaces Google Places)
    │                  └──enhances-existing──> US Census geocoder (already used for full-address lookup)
    │
    ├──requires──> Disambiguation UI (ranked suggestion list, always shows City, ST / County, ST / ST)
    │
    └──requires──> National fallback (state + federal officials guaranteed for any resolvable US input)
                       └──requires──> Nationwide TIGER congressional-district + state-boundary geofences
                                          [GAP: only confirmed complete for states already onboarded —
                                           verify 50-state CD/state coverage before roadmap commits to
                                           "any US input" as a launch claim]

Editable pre-filled current-location affordance ──enhances──> Unified location search field
    (same input widget, just seeded with the resolved location's display string on load)

Accessible combobox (ARIA) ──wraps──> Unified location search field
    (not a separate feature — the field's implementation must satisfy this from day one,
     not bolted on after)

"Search by name" removal ──conflicts-would-be-wrong-to-combine-with──> Unified location search field
    (keeping them separate is the correct call; do not merge in a later phase)

Browse-by-government-list (geo_id) [EXISTING] ──consumed-by──> Place-name resolver's routing layer
Address→reps via Census geocode + PostGIS ST_Covers [EXISTING] ──consumed-by──> Input classifier's address path
Curated city/state typeahead (coverage.js) [EXISTING, LIMITED] ──superseded-by──> DB place-name catalog + curated catalog (broader)
```

### Dependency Notes

- **Input classifier requires a coordinate parser, a place-name resolver, and the existing Census geocoder to coexist:** the field's core intelligence is *routing*, not any single lookup. Build the classifier as a thin dispatcher so each path (address / place / coordinates) can be developed and tested independently before wiring them together.
- **National fallback requires nationwide CD + state geofences, which may not fully exist yet:** this is the single biggest hidden dependency for the roadmap. The project has deep-seeded roughly a dozen states in detail, but "any resolvable US input returns at least state + federal officials" implies congressional-district and state-boundary polygon coverage for **all 50 states**, not just the deep-seeded ones. If any states are missing CD/state TIGER geofences, the national-fallback promise is false for those states until that gap is closed — flag this explicitly for the roadmapper as a pre-flight audit item, not an assumption.
- **DB place-name catalog supersedes coverage.js, but should absorb it rather than discard it:** the existing curated typeahead already encodes hand-verified "this place is actually covered end-to-end" knowledge. The new catalog should be a superset (nationwide place names for routing/fallback + the existing curated list surfaced with higher suggestion-ranking priority, since those are the areas with full local depth).
- **Accessible combobox is not a bolt-on:** ARIA roles/states (`combobox`, `listbox`, `aria-expanded`, `aria-activedescendant`, `aria-autocomplete`) must be present in the first implementation, because retrofitting ARIA onto a working-but-inaccessible custom dropdown is materially harder than building it in from the WAI-ARIA APG example pattern.
- **"Search by name" removal is independent, not a merge target:** the milestone's decision to remove politician-name search rather than fold it into the location field is correct and should not be revisited inside this same field's design — combining "where do I live" and "who is this person" search semantics in one box would recreate the ambiguity problem this milestone is solving.

## MVP Definition

### Launch With (v1)

Minimum viable set for the v24.0 milestone's own stated scope.

- [ ] Single field accepting full street address, city/city+state/county/state name, and lat/lng — this is the milestone's explicit deliverable
- [ ] Typeahead suggestions from DB place-names + curated catalog, ranked with covered/deep-seeded areas first
- [ ] Disambiguation via `City, ST` / `County, ST` / `ST` labels in every suggestion row — non-negotiable given the Springfield problem
- [ ] Coordinate input support for decimal-degrees (comma- or space-separated); DMS is a stretch goal, not MVP-blocking
- [ ] National fallback to state + federal officials for any resolvable US input (pending the 50-state CD/state geofence audit above)
- [ ] Pre-filled, click-to-edit current-location affordance replacing the old multi-row header
- [ ] Enter-to-submit raw text (best-effort resolve) in addition to suggestion-click
- [ ] "Not found" graceful state with a retry hint
- [ ] Basic ARIA combobox semantics (role, aria-expanded, aria-controls, aria-activedescendant, keyboard arrow/Enter/Escape)

### Add After Validation (v1.x)

- [ ] DMS coordinate format support (`40°42'51"N 74°00'21"W`) — add once decimal-degree support is confirmed working and real user paste-behavior is observed
- [ ] "Use my location" opt-in geolocation icon inside the field (explicit click, never auto-fire)
- [ ] Suggestion-list virtualization/windowing if the place-name catalog grows large enough that render performance degrades (unlikely at launch scale, per typeahead system-design guidance capping visible results at 5–10)

### Future Consideration (v2+)

- [ ] "Near me" fuzzy disambiguation (e.g., ranking "Springfield" candidates by proximity to a previously-known location) — defer until there's a signal for what proximity data is even available anonymously
- [ ] Cross-street/intersection input parsing — a 5 Calls-documented accuracy improvement over ZIP-only, but a new input grammar not requested in this milestone's scope
- [ ] Promoting the unified search component into `@empoweredvote/ev-ui` for reuse by sibling EV apps — defer until the pattern is proven and stable inside Essentials, matching the project's own precedent of promoting shared components only after in-app validation (see `buildBannerProps`/`SectionBanner` decision history)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Single unified field (address/place/coords, no mode toggle) | HIGH | HIGH | P1 |
| Disambiguation via City/County, ST labels | HIGH | LOW | P1 |
| Typeahead from own DB place-names + curated catalog | HIGH | MEDIUM | P1 |
| National fallback (state + federal guaranteed) | HIGH | HIGH (contingent on geofence audit) | P1 |
| Pre-filled, click-to-edit current-location affordance | HIGH | LOW | P1 |
| ARIA combobox semantics + keyboard nav | HIGH (accessibility is non-negotiable) | MEDIUM | P1 |
| Enter-to-submit raw text without dropdown selection | MEDIUM | LOW | P1 |
| Decimal-degree coordinate parsing | MEDIUM | LOW | P1 |
| DMS coordinate parsing | LOW–MEDIUM | LOW | P2 |
| Opt-in "use my location" geolocation button | MEDIUM | LOW | P2 |
| Suggestion-list virtualization | LOW (at current scale) | LOW | P3 |
| Cross-street/intersection parsing | LOW | MEDIUM | P3 |
| Promote component to `@empoweredvote/ev-ui` | LOW (now), MEDIUM (later) | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | house.gov "Find Your Representative" | 5 Calls | My Reps (DataMade) | Our Approach |
|---------|----------------------------------------|---------|----------------------|--------------|
| Input types accepted | ZIP code only | Address, ZIP, or browser geolocation | Full address (Google Civic API) | One field: address, city/county/state name, ZIP, or lat/lng — broadest of all four |
| Disambiguation | N/A (ZIP maps to a single district lookup form) | Notes ZIP inaccuracy explicitly in docs; recommends address/cross-streets for accuracy | Relies on Google Civic's address parsing | Explicit `City, ST` / `County, ST` disambiguation rows; never a bare ambiguous name |
| Geolocation | Not offered | Offered, opt-in ("finds your location for you, or enter manually") | Not offered | Opt-in-only geolocation icon inside the field (v1.x), never auto-triggered on load |
| National/fallback coverage | Federal only (by design — house.gov's own scope) | Federal + state, nationwide (their API's whole purpose) | Federal + state + county + local, wherever Google Civic has data | Federal + state guaranteed nationwide (pending geofence audit); local depth wherever a city/county has been deep-seeded |
| Accessibility | Basic form, not a rich combobox | Standard web form | Standard web form | Full WAI-ARIA APG combobox pattern (role, aria-expanded/controls/activedescendant, keyboard nav) — none of the three competitors surfaced ARIA-combobox-level detail in available docs, this is a chance to lead |
| Branding/privacy | Government site, no ads | Explicitly "never sells data," privacy-first | Powered by Google Civic API (third-party dependency) | Zero third-party autocomplete branding; own DB + free Census geocoder — strongest privacy/antipartisan positioning of the group |

## Sources

- [W3C WAI-ARIA APG — Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) — HIGH confidence, authoritative spec
- [W3C WAI-ARIA APG — Editable Combobox With List Autocomplete Example](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/) — HIGH confidence, reference implementation
- [MDN — ARIA combobox role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/combobox_role) — HIGH confidence
- [US Census Geocoding Services API](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html) — HIGH confidence, official docs; confirms city+state-without-street partial-address handling and batch limits
- [Census Geocoder FAQ](https://www2.census.gov/geo/pdfs/maps-data/data/Census_Geocoder_FAQ.pdf) — HIGH confidence, official
- [5 Calls Representatives API docs](https://5calls.org/representatives-api/) — MEDIUM confidence; explicitly documents ZIP-code low-accuracy risk and address/cross-street accuracy improvement
- [5 Calls Getting Started](https://5calls.org/getting-started/) — MEDIUM confidence; confirms opt-in geolocation + privacy stance
- [My Reps (DataMade) — GitHub](https://github.com/datamade/my-reps) — MEDIUM confidence; example of address-only civic lookup powered by (deprecated) Google Civic Information API
- [house.gov — Find Your Representative](https://www.house.gov/representatives/find-your-representative) — MEDIUM confidence; ZIP-only baseline competitor
- [Common Cause — Find Your Representatives](https://www.commoncause.org/find-your-representative/) — MEDIUM confidence
- [Google Maps JS API forum — geocode disambiguation](https://groups.google.com/g/google-maps-js-api-v3/c/UAyUg1BWyoo) — MEDIUM confidence; corroborates ranked-candidate-list disambiguation norm
- [Wikipedia — Address geocoding](https://en.wikipedia.org/wiki/Address_geocoding) — MEDIUM confidence; corroborates the "41 Springfields" ambiguity problem and city+state disambiguation need
- [Map UI Patterns — Search](https://mapuipatterns.com/search/) and [Location finder](https://mapuipatterns.com/location-finder/) — MEDIUM confidence, curated UX pattern library
- [UXmatters — Understanding Location](https://www.uxmatters.com/mt/archives/2018/03/understanding-location.php) — MEDIUM confidence; source for "allow lots of methods of specifying location" and don't-require-ZIP guidance
- [Yext — 4 Tips to Improve Geolocation UX](https://www.yext.com/blog/2019/02/4-tips-to-improve-geolocation-ux) — MEDIUM confidence
- [geo-coordinates-parser (npm)](https://www.npmjs.com/package/geo-coordinates-parser) — MEDIUM confidence; practical DMS/DD parsing reference
- [Lat/Long DMS/DDM/DD regex gist](https://gist.github.com/pjobson/8f44ea79d1852900457bc257a4c9fcd5) — MEDIUM confidence, community reference
- [SystemDesignSchool — Typeahead/Autocomplete solution](https://systemdesignschool.io/problems/typeahead/solution) and [Atomic Object — Autocomplete timing/debouncing](https://spin.atomicobject.com/2018/06/04/automplete-timing-debouncing/) — MEDIUM confidence; corroborate debounce (~150–300ms) and minLength (2–3 char) conventions
- Internal project context: `.planning/PROJECT.md` — existing constraints (No Google Places, EDOC-01 no re-prompt for Connected users, antipartisan display rules, `ev:autoOpenMyLocation` opt-in precedent)

---
*Feature research for: unified civic location search / "one field to a location profile"*
*Researched: 2026-07-20*
