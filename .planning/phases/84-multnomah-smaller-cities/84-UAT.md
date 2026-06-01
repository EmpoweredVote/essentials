---
status: complete
phase: 84-multnomah-smaller-cities
source: [84-01-SUMMARY.md, 84-02-SUMMARY.md]
started: 2026-06-01T07:30:00Z
updated: 2026-06-01T08:00:00Z
---

## Current Test

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Run `npx tsx C:/EV-Accounts/backend/scripts/smoke-multnomah-cities.ts` cold. It should exit 0 with SC1/SC2/SC3 all PASS for all 5 Multnomah cities.
result: pass

### 2. Gresham — 7 officials with headshots
expected: Load a Gresham, OR address (e.g. "200 NE Russell St, Gresham, OR 97030") in the app's Representatives tab. A LOCAL section appears with Mayor Travis Stovall and 6 council members (Kayla Brown, Eddy Morales, Cathy Keathley, Jerry Hinton, Sue Piazza, Janine Gladfelter). All 7 display headshot photos (not broken images or placeholders).
result: issue
reported: "No, it says we couldn't find that address. No results found."
severity: major

### 3. Troutdale — 7 officials with headshots
expected: Load a Troutdale, OR address (e.g. "219 E Columbia River Hwy, Troutdale, OR 97060") — LOCAL section shows Mayor David Ripma and 6 council members. All 7 display headshot photos.
result: pass

### 4. Wood Village — 5 officials with headshots
expected: Load a Wood Village, OR address (e.g. "2055 NE 238th Dr, Wood Village, OR 97060") — LOCAL section shows Mayor Jairo Rios-Campos and 4 council members (Dara Tan, John Miner, Charlene Gothard, Patricia Smith). All 5 display headshot photos.
result: issue
reported: "This one worked, but the Mayor came after the Wood Village City Council, which is not what I was expecting or desired."
severity: major

### 5. Fairview — 7 officials (no headshots expected)
expected: Load a Fairview, OR address (e.g. "1300 NE Main Ave, Fairview, OR 97024") — LOCAL section shows Mayor Keith Kudrna and 6 council members. Since no photos exist for Fairview, officials show a placeholder avatar (not broken images). The section still renders correctly.
result: issue
reported: "This one did not work... curiously, it also had an NE section in the address."
severity: major

### 6. Maywood Park — 5 officials (no headshots expected)
expected: Load a Maywood Park, OR address (e.g. "10100 NE Marx St, Maywood Park, OR 97220") — LOCAL section shows Mayor Jim Akers and 4 council members (Kevin Bussema, Jeff Baltzell, Miriam Berman, Thomas Welander). No photos available — officials show placeholder avatar. Section renders correctly.
result: issue
reported: "Typed 10100 NE Marx St, Maywood Park, OR 97220 — geocoder autocorrected to Portland, OR 97220 and returned Portland leadership. No Maywood Park officials shown."
severity: major

### 7. Headshot dimensions spot-check
expected: Open this URL in a browser: `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/8152aa41-5920-4b77-9b4b-14c5bde40c44-headshot.jpg` (Travis Stovall, Gresham Mayor). The image loads cleanly at 600×750 pixels — portrait orientation, correctly cropped with head and shoulders visible, no distortion or artifacts.
result: pass
note: "Image appears large in browser at native 600x750 resolution (source was only 91px wide WebP, upscaled via Lanczos). Crop and proportions are correct. Will display fine at card size in app."

## Summary

total: 7
passed: 3
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "Load a Gresham, OR address — LOCAL section with 7 officials and headshots should appear"
  status: failed
  reason: "User reported: No, it says we couldn't find that address. No results found."
  severity: major
  test: 2
  artifacts: []
  missing: []
- truth: "Wood Village LOCAL section should show Mayor (LOCAL_EXEC) first, then council members (LOCAL)"
  status: failed
  reason: "User reported: Mayor came after the Wood Village City Council, not before."
  severity: major
  test: 4
  artifacts: []
  missing: []
- truth: "Load a Fairview, OR address — LOCAL section with 7 officials should appear (placeholder avatars, no headshots)"
  status: failed
  reason: "User reported: This one did not work. User observed both failing addresses (Gresham, Fairview) had 'NE' directional prefix in the street address."
  severity: major
  test: 5
  artifacts: []
  missing: []
- truth: "Load a Maywood Park, OR address — LOCAL section with 5 Maywood Park officials should appear"
  status: failed
  reason: "Geocoder autocorrected 'Maywood Park, OR' to 'Portland, OR 97220' and returned Portland leadership instead. Maywood Park is a tiny enclave city (~750 residents) entirely surrounded by Portland — geocoder does not recognize it as a distinct city, so coordinates land outside the Maywood Park G4110 geofence."
  severity: major
  test: 6
  artifacts: []
  missing: []
