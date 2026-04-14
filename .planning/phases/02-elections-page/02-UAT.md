---
status: complete
phase: 02-elections-page
source: [02-01-SUMMARY.md]
started: 2026-04-14T00:00:00Z
updated: 2026-04-14T04:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Elections page loads at /elections
expected: Navigating to /elections renders a standalone Elections page — not embedded in Results or any other view. Page heading and content visible.
result: pass

### 2. Inform user sees address input + county shortcuts
expected: As a logged-out (Inform) user, /elections shows an address input field and two shortcut buttons — "Monroe County" and "Los Angeles County" — rather than auto-loading results.
result: pass

### 3. County shortcut loads elections
expected: Clicking "Monroe County" (or "Los Angeles County") shortcut button loads elections for that area without typing an address. Results appear below.
result: pass

### 4. Connected user with jurisdiction auto-loads
expected: As a Connected user with a stored location, navigating to /elections immediately shows your local election results — no address input is shown, no action required. A location label appears identifying the area.
result: pass

### 5. Connected user without jurisdiction sees address input
expected: As a Connected user whose account has no stored location, /elections shows the same address input + county shortcuts as an Inform user (no auto-load).
result: pass

### 6. Change location flow (Connected user)
expected: As a Connected user who already sees auto-loaded results, a "Change" button is visible. Clicking it reveals an address input above the existing results. Entering a new address fetches elections for that location. The page does NOT prompt to save the new address.
result: pass

### 7. State section labels are generic
expected: When viewing state-level races (e.g., LA County elections showing California Governor, State Assembly), the section headers read "State Legislature" and "State Executive" — not "Indiana General Assembly" or "Indiana Executive".
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
