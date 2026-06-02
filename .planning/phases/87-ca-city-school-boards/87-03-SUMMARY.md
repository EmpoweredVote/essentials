---
phase: 87-ca-city-school-boards
plan: 03
status: complete
---

## What Was Built

Two surgical edits to `src/pages/Results.jsx` to fix visual bugs affecting all six CA school board sections on the Reps tab:

**Fix 1 — cardTitle SCHOOL branch** (line ~1170):
Replaced the old branch that assembled a card title from `government_name` + `cleanChamber` with a single line: `return qualify(cleanTitle, pol)`. SCHOOL cards now display the actual office title (e.g. "Board Member", "Trustee", "Director") instead of the full district name (e.g. "Los Angeles Unified").

**Fix 2 — deriveSeatSubtitle for SCHOOL** (line ~252):
- Updated the early-exit guard from `!dt.startsWith('LOCAL') && dt !== 'COUNTY'` to also pass `dt !== 'SCHOOL'`, allowing SCHOOL types through.
- Added a SCHOOL-specific parenthetical extractor after the existing Ward/District matchers: titles like "Board Member (Area 1)" yield subtitle "Area 1"; plain titles like "Commissioner" or "Director" yield null.
- This gives SCHOOL tiles the same minimum height as council cards (subtitle slot occupied when area info is present).

## Verification Results

```
$ grep -n "qualify(cleanTitle, pol)" src/pages/Results.jsx
1172:        return qualify(cleanTitle, pol);   ← LOCAL named officers
1179:        return qualify(cleanTitle, pol);   ← SCHOOL branch (new)

$ grep -n "pm\[1\].trim()" src/pages/Results.jsx
263:    return pm ? pm[1].trim() : null;   ← parenthetical extractor

$ grep -n "SCHOOL" src/pages/Results.jsx
43:   ... || upper === 'SCHOOL') ? 'applies_local'
252:  if (!dt.startsWith('LOCAL') && dt !== 'COUNTY' && dt !== 'SCHOOL') return null;
259:  // SCHOOL: extract parenthetical area label e.g. "Board Member (Area 1)" → "Area 1"
261:  if (dt === 'SCHOOL') {
325:  if (pol.district_type === 'SCHOOL') {
784:  //   browse_school_filter — for SCHOOL, ...
813:          if (dt === 'SCHOOL') {
1170:      // SCHOOL: use office_title (e.g. "Board Member", "Trustee")
1171:      if (pol.district_type === 'SCHOOL')
```

## Success Criteria Met

- SCHOOL cardTitle branch uses `qualify(cleanTitle, pol)` — no `government_name` guard
- `deriveSeatSubtitle` guard extended to include `dt !== 'SCHOOL'`
- Parenthetical extractor added after Ward/District matchers with correct comment
- LOCAL / COUNTY / JUDICIAL branches untouched
- Existing Ward/District matchers untouched
- Committed: `4c7dee3` — fix(87-03): fix SCHOOL card title and tile height on Reps tab
