---
status: resolved
phase: 84-multnomah-smaller-cities
source: [84-VERIFICATION.md]
started: "2026-06-01T00:00:00.000Z"
updated: "2026-06-01T00:00:00.000Z"
---

## Current Test

[complete]

## Tests

### 1. Gresham City Hall address returns correct officials + headshots
expected: Loading '1333 NW Eastman Pkwy, Gresham, OR 97030' in Representatives tab returns 7 Gresham officials (Mayor Travis Stovall + 6 council members); all 7 have headshot photos (no placeholder avatars)
result: PASS

### 2. Wood Village Mayor ordering (CITIES-04 fix)
expected: Loading a Wood Village address (e.g. '2055 NE 238th Dr, Wood Village, OR 97060') in Representatives tab shows LOCAL section with Mayor Jairo Rios-Campos appearing BEFORE the 'Wood Village City Council' sub-group containing Dara Tan et al.
result: PASS

### 3. Maywood Park routing returns Maywood Park officials (CITIES-05 fix)
expected: Loading '10100 NE Marx St, Maywood Park, OR 97220' returns Maywood Park officials — Jim Akers (Mayor) + Kevin Bussema, Jeff Baltzell, Miriam Berman, Thomas Welander — NOT Portland leadership
result: PASS (after backend deployment)
notes: Two new display observations noted — Mayor appears just before State section rather than first in LOCAL; City section renders after County rather than before. Logged as gaps below.

### 4. Fairview placeholder-avatar render
expected: Loading '300 Main St, Fairview, OR 97024' returns 7 Fairview officials; placeholder avatars display gracefully
result: PASS

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

### Gap 1 — Maywood Park Mayor appears just before State section, not first in LOCAL
status: open
description: Jim Akers (Mayor/LOCAL_EXEC) appears at the bottom of the LOCAL section immediately before the State officials block, rather than first. The district_type guard fix resolved Wood Village but Maywood Park Mayor position still incorrect.
root_cause: Unknown — may be a sub-group sort tie or section boundary issue distinct from the EXECUTIVE_KW score bug.

### Gap 2 — City LOCAL section renders after County officials
status: open
description: For a Maywood Park address, the City of Maywood Park officials appear after the County (Multnomah County) officials rather than before. Expected ordering: City → County → State → Federal.
root_cause: Unknown — section-level ordering in groupHierarchy.js or the results rendering layer.
