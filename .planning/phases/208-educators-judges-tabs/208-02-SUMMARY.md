---
phase: 208-educators-judges-tabs
plan: 02
subsystem: ui
tags: [human-verify, results-page, tabs, classify, header, ev-ui]

# Dependency graph
requires:
  - phase: 208-educators-judges-tabs
    plan: 01
    provides: Four-tab officials view (Representatives, Educators, Judges, Elections) in src/pages/Results.jsx
provides:
  - Operator sign-off (approved on live) of TAB-01/TAB-02/TAB-03 behaviors
  - Punch-list fixes applied during verification (classification, tab threshold, header layout, mobile header)
affects: [210-per-tab-lens-shift]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Judge-bucket threshold: a location's Judges tab requires a NON-federal (state/local) judge; when only the universal U.S. Supreme Court is present, the federal judges fold back into the representative bucket so SCOTUS still renders under Representatives -> Federal Judiciary without summoning an always-on tab"
    - "essentials overrides ev-ui Header inline styles via CSS (:has + !important) to remove the redundant mobile hamburger and reveal the Account/theme cluster on mobile — production-safe against published ev-ui, no ev-ui release required"

key-files:
  modified:
    - src/pages/Results.jsx: "SCOTUS-only fold-back in the bucketed useMemo; 3-zone location header (location left / election center / pencil right); classifyCategory import for tier check"
    - src/lib/classify.js: "prosecutors/public defenders no longer route to judge (reverses 207-D-02); Judges tab is adjudicators-only"
    - src/index.css: "hide redundant mobile hamburger + reveal Account/theme cluster on mobile"

# Verification
verification:
  method: human-verify (operator), confirmed on production (essentials.empowered.vote)
  result: approved
---

# Plan 208-02 Summary — Human-Verify (four-tab officials view)

## Outcome: APPROVED (on live)

The operator verified the four-tab officials view and approved it on production
(essentials.empowered.vote) after a punch-list of refinements was applied. Task 1
(build + dev server) completed clean; Task 2 (human-verify checkpoint) returned a
punch-list, which was addressed and re-verified.

## Verified behaviors (TAB-01 / TAB-02 / TAB-03)
- Tab row reads Representatives · Educators · Judges · Elections when all buckets populate.
- Educators lists only school-board office-holders; Judges lists only judicial office-holders.
- Representatives is decluttered (no school-board / judicial officials).
- Empty Educators/Judges tabs are hidden; stale `?view=` falls back to Representatives.
- Election summary + yellow day-pill render in the location header, persisting across tabs.
- Compass control works on all people-tabs; 280px reachability holds.

## Punch-list applied during verification (deviations beyond Plan 208-01)
These were operator-requested corrections discovered at the checkpoint. Each is a
deliberate scope refinement, committed separately from the 208-01 implementation.

1. **DA out of the Judges tab** (`src/lib/classify.js`) — prosecutors and public
   defenders no longer route to the `judge` bucket (reverses 207-D-02). The Judges
   tab is for adjudicators only; DAs fall to the `representative` catch-all
   (County/Local Officials). Commit `7065ad02`.

2. **U.S. Supreme Court must not un-hide the Judges tab** (`src/pages/Results.jsx`)
   — the Judges tab now requires a non-federal (state/local) judge. When the only
   judges are the universal SCOTUS (Federal Judiciary), they fold back into the
   representative bucket so they still render under Representatives → Federal
   Judiciary without producing an always-on tab. Verified against live LA data
   (LA's only judges are the 9 SCOTUS justices → Judges tab correctly hidden).
   Commit `7065ad02`.

3. **Election info centered** (`src/pages/Results.jsx`) — the location header is now
   a 3-zone row: location left, election summary centered, edit pencil right (was
   left-adjacent to the address). Commit `7065ad02`.

4. **Redundant mobile hamburger removed** (`src/index.css`) — essentials passes
   `navItems=[]`, so ev-ui's mobile hamburger only re-listed the Account menu +
   theme toggle. Hidden via CSS, with the right-side cluster revealed on mobile
   (`:has` + `!important` overriding ev-ui inline styles). Production-safe against
   published ev-ui 0.9.8; no ev-ui release required. Commit `fd91f1b0`.

## Investigated — no change needed
- **LA school-board completeness (TAB-02):** queried the live API. LA city
  (`0644000`) returns 7 LAUSD board seats + CA Superintendent; LA County (`06037`)
  returns ~390 school-board members, **zero** misclassified and **zero** leaking
  into Representatives. Classification is complete; the visible count is a function
  of browse scope (city = one LAUSD board of 7 seats; county = all districts).
  Community-college district boards remain under Representatives by design (not
  titled "board of education") — flagged as a possible future scope call.

## Deployment
Pushed to `main` (`c4524d0f..fd91f1b0`) → Netlify deploy. Operator confirmed on
live.

## Notes / follow-ups
- ev-ui local dev checkout (`../ev-ui`) is a stale v0.7.2 dev copy; production uses
  published 0.9.8 from node_modules (CI ignores the local alias). During
  investigation the local `dist` was rebuilt (gitignored) and a missing
  `PlaceholderRadar` re-export was added to `../ev-ui/src/index.js` to keep the dev
  build whole. No ev-ui publish was performed; pre-existing dark-mode ev-ui edits
  untouched.
