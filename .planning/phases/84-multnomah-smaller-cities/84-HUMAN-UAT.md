---
status: partial
phase: 84-multnomah-smaller-cities
source: [84-VERIFICATION.md]
started: "2026-06-01T00:00:00.000Z"
updated: "2026-06-01T00:00:00.000Z"
---

## Current Test

[awaiting human testing]

## Tests

### 1. Gresham City Hall address returns correct officials + headshots
expected: Loading '1333 NW Eastman Pkwy, Gresham, OR 97030' in Representatives tab returns 7 Gresham officials (Mayor Travis Stovall + 6 council members); all 7 have headshot photos (no placeholder avatars)
result: [pending]

### 2. Wood Village Mayor ordering (CITIES-04 fix)
expected: Loading a Wood Village address (e.g. '2055 NE 238th Dr, Wood Village, OR 97060') in Representatives tab shows LOCAL section with Mayor Jairo Rios-Campos appearing BEFORE the 'Wood Village City Council' sub-group containing Dara Tan et al.
result: [pending]

### 3. Maywood Park routing returns Maywood Park officials (CITIES-05 fix)
expected: Loading '10100 NE Marx St, Maywood Park, OR 97220' (or calling the /representatives endpoint directly) returns Maywood Park officials — Jim Akers (Mayor) + Kevin Bussema, Jeff Baltzell, Miriam Berman, Thomas Welander — NOT Portland leadership
result: [pending]

### 4. Fairview placeholder-avatar render
expected: Loading '300 Main St, Fairview, OR 97024' returns 7 Fairview officials; placeholder avatars display gracefully (no broken images or layout breaks) since Fairview officials have no headshots yet
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
