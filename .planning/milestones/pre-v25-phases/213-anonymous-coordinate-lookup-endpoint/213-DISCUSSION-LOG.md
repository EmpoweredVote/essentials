# Phase 213: Anonymous Coordinate Lookup Endpoint - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-20
**Phase:** 213-anonymous-coordinate-lookup-endpoint
**Areas discussed:** Request shape & log-privacy, US bounding box + swap guard, Response contract & fallback floor, Errors & telemetry

---

## Request shape & log-privacy

| Option | Description | Selected |
|--------|-------------|----------|
| POST JSON body | POST with `{lat, lng}` body; matches roadmap "Posting" wording; keeps coords out of access logs (Criterion 3) | ✓ |
| GET query params | Mirror existing `/essentials/elections?lat=&lng=`; but coords land in access logs, needs extra scrubbing | |

**User's choice:** POST JSON body
**Notes:** Criterion 3 (no raw coords in logs) drove the recommendation — GET query params are logged verbatim by Render/proxies.

---

## US bounding box + swap guard

| Option | Description | Selected |
|--------|-------------|----------|
| 50 states + DC + PR/territories | Generous bbox; won't reject AK/HI/PR users; swap guard rejects points only valid when swapped | ✓ |
| Contiguous 48 + DC only | Tighter box; simpler but rejects legitimate Alaska/Hawaii/PR lookups | |

**User's choice:** 50 states + DC + PR/territories
**Notes:** Exact bbox constants left to planner (mind Aleutians crossing the antimeridian).

---

## Response contract & fallback floor

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse address shape + 212 floor | Same `getRepresentativesByAddress` shape (exact House rep, RSLV-05) + Phase 212 state+federal floor so a valid point never returns empty | ✓ |
| Reuse address shape, ST_Covers hits only | Same shape, no fallback floor; simpler/independent but unseeded points may be sparse/empty | |

**User's choice:** Reuse address shape + 212 floor
**Notes:** A coordinate is a pre-geocoded address; factor a coordinate-only core so it doesn't re-geocode. Confirmed `AddressSearchResult` carries no raw lat/lng (Criterion 3 holds if `matchedAddress` left empty).

---

## Errors & telemetry

| Option | Description | Selected |
|--------|-------------|----------|
| Distinct codes, zero coord telemetry | Separate 422 codes (OUTSIDE_US_BOUNDS / SWAPPED_COORDINATES / INVALID_COORDINATES); no analytics event carrying coords | ✓ |
| Generic 422 + count-only event | One VALIDATION_ERROR code + coordinate-free count event | |

**User's choice:** Distinct codes, zero coord telemetry
**Notes:** Strictest reading of Criterion 3; distinct codes let the Phase 214 frontend message precisely.

---

## Claude's Discretion

- Exact route path/name (e.g. `POST /api/essentials/coordinate-lookup`).
- The precise refactor exposing a coordinate-only core of `getRepresentativesByAddress`.
- Exact US bbox numeric constants.
- Whether to add `express-rate-limit` abuse protection (middleware already used on other anonymous routes).

## Deferred Ideas

- Reverse-geocoding a human-readable place label for the coordinate (deliberately omitted to avoid deriving location text).
- Usage analytics for coordinate lookups (deferred; must be coordinate-free if ever added).
- Rate-limiting / abuse hardening (available but not locked).
