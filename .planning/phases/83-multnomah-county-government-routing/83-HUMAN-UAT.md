---
status: partial
phase: 83-multnomah-county-government-routing
source: [83-VERIFICATION.md]
started: 2026-05-31T20:00:00Z
updated: 2026-05-31T20:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Commissioner cards display headshots in the UI
expected: Load a Portland, OR address in the app's Representatives tab — 5 Multnomah County Board of Commissioners cards appear (Chair Jessica Vega Pederson + Commissioners Meghan Moyer, Shannon Singleton, Julia Brim-Edwards, Vince Jones-Dixon), each with a correctly cropped headshot photo displayed (not a placeholder or broken image)
result: [pending]

### 2. Unincorporated address routing — no empty LOCAL section
expected: Load an unincorporated Multnomah County address (e.g. Corbett, OR) in the app's Representatives tab — County section shows 5 commissioner cards; no empty "Local" section; state and federal reps also appear
result: [pending]

### 3. Headshot image dimensions spot-check (600×750)
expected: Download one Storage headshot (e.g. `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/27f6b552-0e36-429a-a6fd-bb7108b80b35-headshot.jpg`) — dimensions should be exactly 600×750 JPEG
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
