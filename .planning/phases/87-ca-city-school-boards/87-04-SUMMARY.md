---
phase: 87-ca-city-school-boards
plan: 04
status: complete
---

## What Was Built

### Task 1: Greyscale rejection guard in 3 headshot scripts

Added a `ValueError` guard before the RGB conversion in all three headshot processing scripts. When a source image is in greyscale mode (`L` or `LA`), the script now raises immediately instead of silently converting, forcing the operator to find a color photo.

Scripts modified:
- `scripts/_tmp-ca-school-headshots.py` — `crop_and_resize()` at line 134
- `scripts/ca_senate_headshots.py` — `crop_and_resize()` at line 123
- `scripts/lausd-headshots/process.py` — `process_image()` at line 116

In `lausd-headshots/process.py`, `LA` was also removed from the `RGBA/P` composite branch (no longer needed since `LA` is caught by the guard above it).

All three callers already have `try/except Exception` blocks in `main()` that log the error and continue — no new exception handling was added.

### Task 2: Migration 259 — Normalize SJUSD name

Investigation revealed the accent appears in two tables (not `politicians.government_name` as the plan assumed — that column does not exist):

- `essentials.governments.name` = `'San José Unified School District, California, US'`
- `essentials.chambers.name_formal` = `'San José Unified School District Board of Education'`

Migration file created at `C:/EV-Accounts/backend/migrations/259_normalize_sjusd_government_name.sql` and both UPDATEs applied to production.

## Verification Results

### Greyscale guard grep:
```
scripts/_tmp-ca-school-headshots.py:134:        raise ValueError(f"Greyscale image rejected (mode={img.mode}) — find a color source photo")
scripts/ca_senate_headshots.py:123:        raise ValueError(f"Greyscale image rejected (mode={img.mode}) — find a color source photo")
scripts/lausd-headshots/process.py:116:            raise ValueError(f"Greyscale image rejected (mode={img.mode}) — find a color source photo")
```
3 lines, one per file — confirmed.

### Migration 259 results:
- `essentials.governments` WHERE id=027c982c → `name = 'San Jose Unified School District, California, US'` (accent removed)
- `essentials.chambers` WHERE id=19353ba6 → `name_formal = 'San Jose Unified School District Board of Education'` (accent removed)
- 5 SJUSD politicians remain linked via chamber_id (unchanged, correct)
- No accented é rows remain in either table

## Success Criteria Met

- [x] `grep "Greyscale image rejected"` returns exactly 3 lines
- [x] Greyscale guard fires before RGB conversion (ValueError propagates to existing try/except)
- [x] `LA` mode removed from RGBA/P branch in `lausd-headshots/process.py`
- [x] Migration file written at correct path in C:/EV-Accounts/backend/migrations/
- [x] `governments.name` updated — 'San José' → 'San Jose' (no accent)
- [x] `chambers.name_formal` updated — 'San José' → 'San Jose' (no accent)
- [x] No accented rows remain in production DB
