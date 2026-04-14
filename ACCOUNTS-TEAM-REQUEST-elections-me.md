# Request: `GET /essentials/elections/me` — Elections for Connected User's Stored Location

**From:** Essentials Frontend Team
**To:** Accounts API Team
**Date:** 2026-04-13
**Priority:** High — Connected user auto-load on the Elections page is broken without this

---

## Background

The Elections page (`/elections`) launched in Phase 2. For Connected users with a stored jurisdiction, it should auto-load their local election races on arrival — no address input required, same experience as the Representatives page.

The current implementation calls `fetchElectionsByAddress(city + ', ' + state)` using `userJurisdiction.city` and `userJurisdiction.state` from the account profile. This has two compounding problems:

---

## The Problem

### Problem 1 — City+state strings fail geocoding

The Census Geocoder requires a full street address. Passing `"Los Angeles, CA"` returns no results or an unreliable centroid. Connected users with an LA County jurisdiction see the Elections page with **zero results** — the exact same empty state as a user with no coverage area.

### Problem 2 — Even when geocoding succeeds, results are for the wrong slice of the city

If we substitute a representative address (e.g., `500 W Temple St, Los Angeles, CA 90012`) as a workaround, the geocoder returns a specific point in downtown LA. That point falls in Assembly District 54, Senate District 26, and Congressional District 34. A user who lives in the San Fernando Valley (Assembly D46, Senate D18, Congressional D29) would see entirely wrong district races.

City+state geocoding is fundamentally the wrong tool here. The user's precise location is already stored on the account — we just can't access it from the frontend.

---

## What We're Asking For

### Ask — New endpoint: `GET /essentials/elections/me`

Mirror the pattern of `GET /essentials/representatives/me`:

1. Authenticate the request (Bearer token)
2. Look up the user's `connected_profiles` row
3. If no location is set → return `204 No Content`
4. Decrypt `encrypted_lat` / `encrypted_lng`
5. Call `getElectionsByCoordinate(lat, lng)` (already exists in `electionService.ts`)
6. Return the elections response with an `X-Formatted-Address` header containing a display-safe address string (same as `representatives/me` does)

No new geocoding. No Census Geocoder call. The coordinates are already precise and stored — this endpoint just uses them directly.

---

## Expected Request / Response

**Request:**
```
GET /api/essentials/elections/me
Authorization: Bearer {token}
```

**Response (location set):**
```json
HTTP 200
X-Formatted-Address: "12048 Culver Blvd, Los Angeles, CA 90066"

{
  "elections": [
    {
      "election_id": "...",
      "election_name": "2026 LA County Primary",
      "election_date": "2026-06-02",
      "election_type": "primary",
      "races": [ ... ]
    }
  ]
}
```

**Response (no location set):**
```
HTTP 204 No Content
```

**Response (not authenticated):**
```
HTTP 401 Unauthorized
```

---

## Frontend Changes (our side, after endpoint ships)

We'll update `Elections.jsx` to:

1. Add `fetchMyElections()` to `src/lib/api.jsx` — calls `GET /essentials/elections/me`, same shape as `fetchMyRepresentatives()`
2. On mount, when `isLoggedIn && userJurisdiction != null`: call `fetchMyElections()` instead of `fetchElectionsByAddress(city + ', ' + state)`
3. Use the `X-Formatted-Address` response header as `locationLabel` (e.g., "Showing elections for 12048 Culver Blvd, Los Angeles, CA 90066")
4. Fall through to address input if `204` (Connected user with no stored location — same behavior as today)

No other frontend changes required. `ElectionsView` already handles all rendering.

---

## Precedent

This is a direct parallel to `GET /essentials/representatives/me`, which already:
- Authenticates via Bearer token
- Decrypts stored coordinates
- Runs a coordinate-based geofence query
- Returns `204` when no location is set
- Returns `X-Formatted-Address` for the display label

The only difference is calling `getElectionsByCoordinate` instead of the representatives query.

---

## Acceptance Criteria

- `GET /essentials/elections/me` returns the correct election races for the user's **stored home address coordinates** (not a city-level geocode)
- `X-Formatted-Address` header contains a street-level display string
- Returns `204` when the Connected user has no stored location
- Returns `401` when unauthenticated
- The races returned match what `GET /essentials/elections-by-address?address={home_address}` returns for the same user's home address

---

## Questions for the Accounts Team

1. Is `getElectionsByCoordinate(lat, lng)` already a function in `electionService.ts`, or does the `elections-by-address` route geocode first and then call a coordinate function internally?
2. Does `representatives/me` have a reusable decrypt-coordinates utility we can point at the elections query, or does each route implement decryption inline?
3. Any concerns about rate-limiting or caching for this endpoint? The elections dataset is smaller and slower-changing than representatives, so a longer cache TTL may be appropriate.
