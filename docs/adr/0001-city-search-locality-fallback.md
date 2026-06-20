# City / locality searches fall back to Browse-by-Location

When a user's search resolves to a **locality** (a city/town) rather than a precise street address, Essentials
does **not** error. Instead it routes the query into the existing **Browse-by-Location** flow for that city —
showing every representative whose jurisdiction overlaps the city limits — and shows a banner inviting the user
to enter a full street address for their exact representatives. We chose this over erroring (the previous
behaviour) because a city is a meaningful, common thing for a voter to type, and an empty/error result is a
dead end; routing to Browse-by-Location reuses infrastructure we already have and returns something useful.

## How coverage is determined

Coverage is read **live** from `GET /essentials/browse/states/{abbrev}/areas` (the source of truth — it lists
every browseable county/city/district with a `geo_id`+`mtfcc`), NOT from the curated `COVERAGE_STATES` list in
`Landing.jsx` (that list is only the landing-page showcase and understates real coverage — e.g. Payson is not in
it but IS covered). The geocoder classifies the query; we match the geocoded **city** name against
`area_type: 'city'`, fall back to the **county** against `area_type: 'county'`, and route to Browse-by-Location
for the match. An **empty areas response means the state isn't covered.**

## Consequences

- City/county results are **deliberately imprecise**: a whole-city/county browse can surface officials who
  don't represent the user's exact parcel. The precision banner is load-bearing — it must always render in
  locality-fallback mode so users understand the result is approximate.
- A geocoded **city** prefers its exact city area, then falls back to its county; true county-by-name browse
  works because counties are in the areas list.
- An uncovered state (empty areas list) shows an honest "we don't cover {place} yet" landing banner rather than
  an empty results page.

## Considered alternatives

- **Error / require a street address (previous behaviour)** — rejected: dead end for a reasonable query.
- **Snap to city centroid and run the address lookup** — rejected: the centroid lands in one arbitrary
  district, which is *more* misleading than honestly showing all overlapping reps with a caveat.
