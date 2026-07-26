---
phase: 221-collin-county-headshots-source-and-attach-photos-for-officia
plan: 04
status: complete
completed: 2026-07-24
---

# 221-04 SUMMARY — Coverage delta, image verification, blank register

## Coverage delta (BEFORE → AFTER, city-scope)
| Metric | 221-01 BEFORE | AFTER | Δ |
|--------|--------------:|------:|--:|
| Total in-scope | 150 | 150 | 0 |
| WITH image | 102 | **110** | **+8** |
| WITHOUT image | 48 | **40** | −8 |

- **9 headshots newly attached this phase** = 8 city-scope (Δ above) + Brandon Smith (Longview D3, outside the Collin city filter but a coverage.js browse city).
- Remaining 40 without-image = the confirmed honest blanks in `221-CONFIRMED-BLANK.md`.

## Image spec verification (machine-checked)
Sampled 5 stored objects from the public CDN (`politician_photos/{pid}-headshot.jpg`), including a low-res-source one and the top-cropped one:
- Mark Hill, Brandon Smith, Escobar, Deffibaugh (low-res source), Rhonda Williams — **all exactly 600×750**, HTTP 200. ✅ crop-then-resize spec held.

## Brandon Smith / Gopal Ponangi final dispositions
- **Brandon Smith** (`c6ec603a…`) — **headshot attached** (longviewtexas.gov, press_use, 993×1250 crisp).
- **Gopal Ponangi** (`d6e0d762…`) — **out of scope, no photo required.** Live DB: `is_active=false`, `office_id=NULL`; un-seated by mig 1409 (corrected mig 1404's erroneous Frisco P4 loser seating). Not a confirmed-blank-with-search — he is simply not a current officeholder. Documented in 221-01 and 221-CONFIRMED-BLANK.md.

## Deliverables
- `221-CONFIRMED-BLANK.md` — 40 blanks by city, each with search evidence + the out-of-scope Ponangi note.
- Phase goal held: every in-scope Collin officeholder with a public photo now has a conforming 600×750 headshot; everyone else is a documented honest blank.
