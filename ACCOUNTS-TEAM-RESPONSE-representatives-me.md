# Response: Accounts Team → Essentials Frontend Team

**Date:** 2026-03-29
**Re:** Request document `ACCOUNTS-TEAM-REQUEST-representatives-me.md`

---

## Root Cause Diagnosis

There are two separate bugs, not one.

### Bug 1 — `resolve_user_jurisdiction` queries the wrong geometry table

The RPC decrypts coordinates correctly but runs the `ST_Covers` query against
`inform.district_boundaries`. The essentials geofence data — which powers
`/candidates/search` and returns correct results — lives in
`essentials.geofence_boundaries`. These are two separate tables with independent
data. Based on untracked Tiger files in the repo root,
`inform.district_boundaries` appears to be unpopulated or undercovered for
California — so the `MAX()` aggregation returns nulls for all five keys, all
`geo_ids` stay null, and Path 1 in `representatives/me` is skipped entirely.

### Bug 2 — Census Geocoder returning city-level precision for this address

When Path 1 is skipped, Path 2 runs and re-geocodes `home_address`. The Census
Geocoder is returning a city-center point for `12048 CULVER BLVD, LOS ANGELES,
CA, 90066` rather than a street-level coordinate — explaining both the
`X-Formatted-Address: "LOS ANGELES, CA"` and the ~67-result sweep (every
official whose geofence covers downtown LA, rather than the address's actual
location in 90066).

---

## Answers to Our Four Questions

**Q1 — Is the encrypted coordinate path intentionally bypassed?**
No, it's a bug. `resolve_user_jurisdiction` was written to query
`inform.district_boundaries`, but that table isn't the one with live geofence
coverage. The intent was right; the table reference is wrong.

**Q2 — Is there an existing reverse-geocode utility?**
Yes — `connect.resolve_user_jurisdiction` is exactly that utility, but pointed
at the wrong table. The fix is to rewrite it to query
`essentials.geofence_boundaries` joined to `essentials.districts` (same PostGIS
logic `getRepresentativesByAddress` already uses). No new utility needed.

**Q3 — Would `GET /connect/profile/jurisdiction` be easier?**
No. That would push geofence query responsibility to the Essentials frontend,
add a roundtrip, and weaken the privacy model we've already correctly designed
(coordinates never leave server-side). The right call is to fix the server-side
pipeline and keep the boundary clean.

**Q4 — Key management for `encrypted_lat`/`lng`?**
Vault secret `location_encryption_key`, accessed via `vault.decrypted_secrets`.
The `resolve_user_jurisdiction` RPC already handles this — any new path should
call that RPC rather than implement its own decrypt. The key never touches
Node.js.

---

## What Needs to Happen

### Asks 1 + 2 — Single migration (same fix)

Rewrite `connect.resolve_user_jurisdiction` to query
`essentials.geofence_boundaries` / `essentials.districts` instead of
`inform.district_boundaries`. The decryption logic and geometry math are already
correct — only the `FROM` clause and `district_type` mapping need to change.

**Once that's fixed:**
- `POST /connect/set-location` will populate all five `geo_id` fields correctly
- Path 1 in `representatives/me` will run for all users with a stored address
- `X-Formatted-Address` will return `home_address` (it's the fallback in Path 1
  already: `formattedAddress || homeAddress`)
- Existing users with null `geo_ids` will self-heal on their next `set-location`
  call; a backfill script can cover users who won't call `set-location` again

### Ask 3 — Staleness cron (independent, follow-on work)

New `districts_last_verified_at` column + a weekly cron that calls
`resolve_user_jurisdiction` for each user with `encrypted_lat` set and diffs the
returned `geo_ids` against stored ones. This is new work, independent of Asks
1 & 2. To be added as a phase after the core fix ships.

---

## Privacy Note

The `X-Formatted-Address` in Path 1 currently returns `[city, state].join(', ')`
— that's why `"LOS ANGELES, CA"` is returned even on the fast `geo_id` path.
After the fix, use `home_address` instead (already available in the route, just
not currently passed through Path 1's response header). **No schema change
needed.**

---

## Summary

| Ask | Fix | Scope |
|---|---|---|
| Ask 1 — correct representative list | Rewrite `FROM` clause in `resolve_user_jurisdiction` | Same migration as Ask 2 |
| Ask 2 — populate district geo_ids | Same migration | Single RPC change |
| Ask 3 — staleness cron | New cron + new column | Follow-on phase |

Both Ask 1 and Ask 2 are resolved by a **single migration** that fixes
`connect.resolve_user_jurisdiction` to query live essentials geometry data.

> The frontend workaround commit (`fix(prefilled): update context with search
> results instead of re-calling /representatives/me`, 2026-03-29) can be
> **reverted** once Ask 1 ships.
