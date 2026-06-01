---
phase: 84-multnomah-smaller-cities
plan: "03"
status: fixed
fixed: "2026-06-01"
findings_fixed: [CR-01, WR-01]
findings_deferred: [WR-02]
commit: 11cc399
---

## Fix Report — Phase 84 Plan 03 Code Review

### CR-01 (BLOCKER) — Fixed

**Problem:** `|| state.toLowerCase() === 'or'` in the ENCLAVE_CITY_ALIASES override fired for any Oregon address containing the enclave name, even when the geocoder correctly returned a non-host-city result. A street named "Maywood Park Drive" in Eugene would have been mis-routed to Portland's Maywood Park politicians.

**Fix:** Removed `state` arm entirely. Replaced with `city.toLowerCase() === alias.hostCity` using the `addressComponents.city` field already returned by `geocodeAddress`. Dual-condition is now: raw address contains enclave name AND geocoder returned host city (via matchedAddress OR city field).

**Commit:** `11cc399` in C:/EV-Accounts/backend

### WR-01 (WARNING) — Fixed (same commit as CR-01)

**Problem:** Old Redis cache entries (pre-deployment) may have `matchedAddress: ''`, causing the `matchedAddress.toLowerCase().includes(hostCity)` check to fail silently for valid Maywood Park addresses.

**Fix:** The `city` fallback (`city.toLowerCase() === alias.hostCity`) resolves this — `city` is populated from `addressComponents.city` in the geocodeAddress cache and is more reliable than the formatted matchedAddress string.

### WR-02 (WARNING) — Deferred

**Problem:** The `pols.every(p => p.district_type === 'LOCAL_EXEC')` guard in groupHierarchy.js could theoretically mis-score an appointed mayor (district_type='LOCAL') at 20 instead of 10 in cities where the mayor is not `LOCAL_EXEC` typed.

**Decision:** Deferred. The plan explicitly intended `LOCAL` sub-groups to cap at 20. All current cities in this project have mayors seeded with `district_type='LOCAL_EXEC'`. The appointed-mayor pattern (if it arises) should be addressed when a concrete city with that seeding is onboarded.
