# City / locality searches fall back to Browse-by-Location

When a user's search resolves to a **locality** (a city/town) rather than a precise street address, Essentials
does **not** error. Instead it routes the query into the existing **Browse-by-Location** flow for that city —
showing every representative whose jurisdiction overlaps the city limits — and shows a banner inviting the user
to enter a full street address for their exact representatives. We chose this over erroring (the previous
behaviour) because a city is a meaningful, common thing for a voter to type, and an empty/error result is a
dead end; routing to Browse-by-Location reuses infrastructure we already have and returns something useful.

## Consequences

- City-level results are **deliberately imprecise**: overlapping jurisdictions (e.g. split state-house
  districts) may surface representatives who do not represent the user's exact parcel. The precision banner is
  load-bearing — it must always render in locality-fallback mode so users understand the result is approximate.
- The fallback only helps for **Alpha Communities** (the only areas Browse-by-Location covers). A locality
  outside coverage must still show an honest "we don't cover {city} yet" message — it must NOT silently show an
  empty browse result that reads as "you have no representatives."

## Considered alternatives

- **Error / require a street address (previous behaviour)** — rejected: dead end for a reasonable query.
- **Snap to city centroid and run the address lookup** — rejected: the centroid lands in one arbitrary
  district, which is *more* misleading than honestly showing all overlapping reps with a caveat.
