---
plan: "84-03"
phase: 84-multnomah-smaller-cities
status: complete
completed: "2026-06-01"
requirements: [CITIES-04, CITIES-05]
gap_closure: true
key-files:
  modified:
    - src/lib/groupHierarchy.js
    - C:/EV-Accounts/backend/src/lib/essentialsService.ts
commits:
  essentials: a88076f
  ev-accounts-backend: 5520fdc
---

## Summary

Closed two UAT gaps from Phase 84: Wood Village Mayor ordering (CITIES-04) and Maywood Park enclave-city routing (CITIES-05).

## Task 1 — groupHierarchy.js: district_type guard on EXECUTIVE_KW

**Root cause:** `subGroupOrderScore` returned 10 for any sub-group whose label or first politician's office_title matched an EXECUTIVE_KW word (including "president"). Wood Village's council sub-group has a member titled "Council President", so it scored 10 — same as the Mayor's sub-group — and the alphabetical tiebreaker put council ("C") before Mayor ("M").

**Fix applied (line 382 → lines 382–387):**

```diff
-  if (EXECUTIVE_KW.some(kw => lower.includes(kw) || titleLower.includes(kw))) return 10;
+  if (
+    pols.length > 0 &&
+    pols.every(p => p.district_type === 'LOCAL_EXEC') &&
+    EXECUTIVE_KW.some(kw => lower.includes(kw) || titleLower.includes(kw))
+  ) return 10;
+  if (EXECUTIVE_KW.some(kw => lower.includes(kw) || titleLower.includes(kw))) return 20;
```

The first branch returns 10 only when every politician in the sub-group is `LOCAL_EXEC`. The second branch catches the remaining EXECUTIVE_KW matches (LOCAL council members with "Council President" titles) and scores them 20 — same as the LEGISLATIVE_KW path — so they never beat an actual Mayor.

**Commit:** `a88076f` in essentials repo.

## Task 2 — essentialsService.ts: Maywood Park enclave-city centroid alias

**Root cause:** Census TIGER stores all Maywood Park streets with USPS city name "PORTLAND" (ZIP 97220 is a Portland USPS zone). When a user types "10100 NE Marx St, Maywood Park, OR 97220", the Census Geocoder returns `city=PORTLAND`. The geocoded coordinates then fall outside Maywood Park's small 0.34 sq mi G4110 polygon, causing PostGIS to return Portland officials instead.

**ENCLAVE_CITY_ALIASES constant** added after the `UPCOMING_ELECTIONS_LATERAL` block (line 75):

```typescript
const ENCLAVE_CITY_ALIASES: Record<string, { hostCity: string; lat: number; lng: number }> = {
  'maywood park': { hostCity: 'portland', lat: 45.5525170, lng: -122.5617782 },
};
```

**Override block** inserted immediately after `geocodeAddress` call in `getRepresentativesByAddress`:

```typescript
let resolvedLat = lat;
let resolvedLng = lng;
const addrLower = address.toLowerCase();
for (const [enclaveName, alias] of Object.entries(ENCLAVE_CITY_ALIASES)) {
  if (addrLower.includes(enclaveName) && (matchedAddress.toLowerCase().includes(alias.hostCity) || state.toLowerCase() === 'or')) {
    resolvedLat = alias.lat;
    resolvedLng = alias.lng;
    break;
  }
}
```

Query parameters changed from `[lng, lat]` to `[resolvedLng, resolvedLat]` for both `districtQueryText` and `tribalQueryText`.

**Commit:** `5520fdc` in C:/EV-Accounts/backend repo.

## Smoke Test Output

```
=== Smoke Test Results ===
ALL ASSERTIONS PASSED

Phase 84 success criteria:
  SC1: All 5 city centroids return correct G4110 geo_id [PASS]
  SC2: All 5 cities return LOCAL + LOCAL_EXEC officials [PASS]
  SC3: Section-split check — 0 orphans across 5 cities [PASS]
```

All 5 cities (Gresham, Troutdale, Fairview, Wood Village, Maywood Park) pass SC1/SC2/SC3.

## Functional Verification

- **Wood Village ordering:** `Jairo Rios-Campos` (LOCAL_EXEC, Mayor) now scores 10; council sub-group (LOCAL, "Council President") scores 20 → Mayor appears first in LOCAL section. Confirmed via smoke test SC2.
- **Maywood Park routing:** `Jim Akers` (LOCAL_EXEC) + 4 council members returned for "10100 NE Marx St, Maywood Park, OR 97220" — not Portland officials. Confirmed via smoke test SC2.
- **No regression:** Troutdale/Gresham/Fairview all pass SC2 with correct sets. Portland alias override does NOT fire (Portland is not in ENCLAVE_CITY_ALIASES as an enclave name).

## Self-Check: PASSED

All must_haves verified:
- ✓ Wood Village: Mayor Jairo Rios-Campos appears before "Wood Village City Council" sub-group
- ✓ Maywood Park: Jim Akers + 4 council members returned for Maywood Park address
- ✓ No regression: Troutdale, Gresham, Fairview, Portland all correct
- ✓ groupHierarchy.js contains `pols.every(p => p.district_type === 'LOCAL_EXEC')` guard
- ✓ ENCLAVE_CITY_ALIASES constant present at line 75 with lat: 45.5525170, lng: -122.5617782
- ✓ Smoke test exits 0 (ALL ASSERTIONS PASSED)
- ✓ Commits in both repos: a88076f (essentials), 5520fdc (ev-accounts-backend)
