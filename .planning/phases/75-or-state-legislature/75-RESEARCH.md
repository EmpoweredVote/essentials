# Phase 75: OR State Legislature - Research

**Researched:** 2026-05-29
**Domain:** PostgreSQL data seeding — OR state legislators, offices, districts, headshots
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 30 OR State Senators → offices linked to STATE_UPPER districts SD-01 through SD-30. `districts.state='or'` (lowercase, TIGER-loader casing).
- **D-02:** 60 OR House Reps → offices linked to STATE_LOWER districts HD-01 through HD-60. `districts.state='or'` (lowercase).
- **D-03:** Primary headshot source: **oregonlegislature.gov**. Researcher must confirm direct URL pattern.
- **D-04:** Migration 225 was audit-only (headshots, Phase 74). Next applied migration number: **226**.
- **D-05:** If oregonlegislature.gov provides only low-resolution thumbnails, **upscale using Lanczos to 600×750** — same decision as ME house reps. Executor proceeds without asking again.
- **D-06:** Crop to 4:5 ratio first, THEN resize to 600×750 (Lanczos, q90) — never stretch directly.
- **D-07:** If a legislator has **no photo at all** on oregonlegislature.gov, document as a known gap in the plan SUMMARY and skip (no placeholder inserted).
- **D-08:** Trust **oregonlegislature.gov** as the authoritative roster. Seed every legislator currently listed.
- **D-09:** If the site shows fewer than 30 senators or 60 reps, treat it as a blocker.
- **D-10:** OR state legislator external_id ranges: senators **`-4110001` through `-4110030`**; house reps **`-4120001` through `-4120060`**.
- **D-11:** OR executive + federal ranges already occupied: executives `-4100001` to `-4100005`; US Senators `-4101001` to `-4101002`; US House reps `-4102001` to `-4102006`. State legislator ranges must not overlap these.

### Claude's Discretion

- Migration structure (one vs. two SQL files for senators vs. house reps)
- Generator script approach (PowerShell .ps1 following ME/CA pattern vs. inline)
- Headshot plan structure (one plan for all 90 legislators)

### Deferred Ideas (OUT OF SCOPE)

- Oregon elections (2026 races for state legislators)
- Compass stances for OR state legislators
- Portland city deep seed (Phases 76–77)
</user_constraints>

---

## Summary

Phase 75 seeds all 30 OR State Senators and 60 OR House Representatives into `essentials.politicians` + `essentials.offices`, links each office to the correct STATE district, and uploads 90 headshots at 600×750 to Supabase Storage. The structural foundation (chambers, districts, government row) is fully in place from Phases 72–73. The implementation follows the same CTE-block migration pattern used in ME (Phase 52) and CA (Phase 61), with a PowerShell generator script for the 90-entry roster.

The critical finding for headshots: oregonlegislature.gov provides only 115×130 pixel thumbnails for all legislators via a predictable `/senate/MemberPhotos/{lastname}.jpg` and `/house/MemberPhotos/{lastname}.jpg` URL pattern. These must be upscaled 5× to 600×750 using Lanczos — the same decision as ME house reps (approved in D-05). The Blue Book (sos.oregon.gov) only has high-resolution photos for ~2 legislative leaders (House Speaker Fahey, Senate President Wagner); it is NOT a bulk source for all 90 legislators. No external fallback is needed — 115×130 upscale is the approved approach.

All rosters are confirmed live from oregonlegislature.gov: exactly 30 senators (SD-01 through SD-30) and 60 house reps (HD-01 through HD-60) as of 2026-05-29.

**Primary recommendation:** Use PowerShell generator script for 90 politician+office blocks. Primary headshot URL = `https://www.oregonlegislature.gov/{chamber}/MemberPhotos/{lastname}.jpg`. Upscale all 90 from 115×130 to 600×750 Lanczos q90. Three plans: 75-01 senators, 75-02 house reps, 75-03 headshots.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Seed politicians | Database | — | SQL migration, no frontend touch |
| Seed offices linked to districts | Database | — | Foreign keys to existing chambers + districts |
| Upload headshots to Storage | Database/Storage | — | Python script writes to Supabase Storage bucket |
| Insert politician_images rows | Database | — | SQL migration (audit-only pattern) |
| Frontend display | Browser | — | Already works; no code changes for new data rows |

---

## Standard Stack

No new packages required. This is a pure data-seeding phase.

### Core (existing)
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| PowerShell (.ps1) | Existing | Generate idempotent SQL for 90 members | ME/MA pattern — avoids typos in repetitive 90-block SQL |
| Python + Pillow | Existing | Download, crop, upscale, upload headshots | Phase 52/61/74 established pattern |
| psql | Existing | Apply migrations to Supabase | Standard DB apply tool |

### Installation

No new installs required.

---

## Package Legitimacy Audit

No new packages installed in this phase.

---

## Architecture Patterns

### System Architecture Diagram

```
oregonlegislature.gov/senate/Pages/SenatorsAll.aspx
        |
        v (roster scrape — 30 senators, names, districts, parties)
PowerShell generate_or_senate.ps1
        |
        v
226_or_state_senators.sql
  [BEGIN]
  [Pre-flight: assert 30 STATE_UPPER districts exist for 'or']
  [30x CTE blocks: INSERT politician → INSERT office → RETURNING id]
  [UPDATE politicians SET office_id = ...]
  [COMMIT]
        |
        v
essentials.politicians (30 new rows, external_id -4110001..-4110030)
essentials.offices (30 new rows, chamber='Oregon Senate', district via geo_id)

oregonlegislature.gov/house/Pages/RepresentativesAll.aspx
        |
        v (roster scrape — 60 reps, names, districts, parties)
PowerShell generate_or_house.ps1
        |
        v
227_or_state_house.sql
  [BEGIN]
  [Pre-flight: assert 60 STATE_LOWER districts exist for 'or']
  [60x CTE blocks: INSERT politician → INSERT office → RETURNING id]
  [UPDATE politicians SET office_id = ...]
  [COMMIT]
        |
        v
essentials.politicians (60 new rows, external_id -4120001..-4120060)
essentials.offices (60 new rows, chamber='Oregon House of Representatives', district via geo_id)

Python headshot script (Plan 75-03)
  [For each of 90 politicians:]
  [GET oregonlegislature.gov/{senate|house}/MemberPhotos/{lastname}.jpg]
  [115x130 → crop 115x144 4:5 (bottom crop) → resize 600x750 Lanczos q90]
  [PUT Supabase Storage politician_photos/{politician_id}-headshot.jpg]
  [INSERT essentials.politician_images (type='default', photo_license='public_domain')]
        |
        v
228_or_legislature_headshots.sql (AUDIT-ONLY)
```

### Recommended Project Structure

```
C:/EV-Accounts/backend/migrations/
├── generate_or_senate.ps1       # PowerShell generator for 30 senators
├── generate_or_house.ps1        # PowerShell generator for 60 house reps
├── 226_or_state_senators.sql    # Applied migration: 30 senators + offices
├── 227_or_state_house.sql       # Applied migration: 60 house reps + offices
└── 228_or_legislature_headshots.sql  # AUDIT-ONLY: 90 politician_images INSERTs
```

### Pattern 1: CTE Block per Politician (ME/CA pattern)

**What:** Each legislator gets one CTE block that atomically inserts politician + office, then a single UPDATE back-fills office_id.

**When to use:** Always for state legislature seeding — handles race conditions and keeps data atomic.

```sql
-- Source: Phase 52-01-SUMMARY.md (ME senators) + Phase 61-01-SUMMARY.md (CA senators)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Jeff Golden', 'Jeff', 'Golden', 'Democrat',
          true, false, false, true, -4110003)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
),
ins_o AS (
  INSERT INTO essentials.offices
    (id, district_id, chamber_id, politician_id, title, representing_state,
     is_appointed_position, is_vacant, role_canonical)
  SELECT gen_random_uuid(),
         (SELECT id FROM essentials.districts
          WHERE geo_id = '41003' AND state = 'or' AND district_type = 'STATE_UPPER'),
         (SELECT id FROM essentials.chambers
          WHERE name = 'Oregon Senate'
            AND government_id = (SELECT id FROM essentials.governments
                                  WHERE name = 'State of Oregon')),
         (SELECT id FROM ins_p),
         'Senator',
         'OR',
         false, false, 'legislator'
  WHERE EXISTS (SELECT 1 FROM ins_p)
  RETURNING id
)
SELECT 1; -- CTE executed

-- After all 30 blocks:
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -4110030 AND -4110001
  AND p.office_id IS NULL;
```

### Pattern 2: District geo_id formula

```
OR STATE_UPPER geo_id: '41' || lpad(district_num::text, 3, '0')
  SD-01 → '41001', SD-17 → '41017', SD-30 → '41030'

OR STATE_LOWER geo_id: '41' || lpad(district_num::text, 3, '0')
  HD-01 → '41001', HD-33 → '41033', HD-60 → '41060'

-- NOTE: STATE_UPPER and STATE_LOWER share the same geo_id format and values
-- (SD-17 = geo_id '41017' AND HD-17 = geo_id '41017')
-- DISAMBIGUATION: always include district_type in WHERE clause
SELECT id FROM essentials.districts
WHERE geo_id = '41017' AND state = 'or' AND district_type = 'STATE_UPPER'  -- senator
SELECT id FROM essentials.districts
WHERE geo_id = '41017' AND state = 'or' AND district_type = 'STATE_LOWER'  -- house rep
```

### Pattern 3: Headshot upscale (115×130 → 600×750)

```python
# Source: Phase 52-03-SUMMARY.md (ME house thumbnails upscale decision)
from PIL import Image

img = Image.open(raw_bytes)  # 115×130
# Crop to 4:5: target ratio = 0.8; current = 115/130 = 0.885 (wider than 4:5)
# Crop width: new_w = int(130 * 0.8) = 104; center-crop: left=(115-104)//2=5
img = img.crop((5, 0, 109, 130))  # 104×130 → 4:5 ratio
img = img.resize((600, 750), Image.LANCZOS)
img.save(out_path, "JPEG", quality=90)
```

### Anti-Patterns to Avoid

- **Including slug in INSERT:** `slug` is GENERATED ALWAYS on `essentials.chambers` and `essentials.governments` — never include in INSERT column list or the query errors.
- **Hardcoding UUIDs:** Always use name-based subqueries for government_id and chamber_id.
- **Missing district_type in WHERE:** SD-17 and HD-17 both have geo_id='41017' — omitting `district_type` returns 2 rows, causing ambiguous subquery error.
- **Wrong state casing:** STATE_UPPER/STATE_LOWER for OR use `state='or'` (lowercase). Do NOT use `state='OR'` for these tiers — that's only for STATE_EXEC. (See PROJECT.md key decision: STATE_EXEC uses uppercase 'OR'; STATE_UPPER/LOWER use lowercase 'or' from TIGER loader.)
- **Using type='headshot' in politician_images:** Must be `type='default'`. Profile.jsx and Results.jsx filter `.find(img => img.type === 'default')` — any other type causes silent invisibility.
- **Omitting WHERE NOT EXISTS on office INSERT:** No unique constraint on offices; duplicate rows are silently created without guard.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 90 repetitive SQL CTE blocks | Manual SQL | PowerShell generator script | 90 blocks = 900+ lines; manual typos inevitable; generator produces clean, consistent SQL |
| Image resizing | Custom PIL arithmetic | Standard crop-then-resize Lanczos pipeline | Phase 52/74 pattern: crop to 4:5 first, then resize 600x750 |
| Idempotency | Custom DELETE + INSERT | ON CONFLICT (external_id) DO NOTHING + WHERE NOT EXISTS on office | DB-native; handles reruns safely |

**Key insight:** The PowerShell generator script pattern (from Phase 39 MA, refined in Phase 52 ME) handles the 90-block repetition reliably. Writing SQL by hand for 90 legislators is error-prone.

---

## Confirmed Roster (2026-05-29)

### Oregon State Senate — 30 Senators

[VERIFIED: oregonlegislature.gov/senate/Pages/SenatorsAll.aspx]

| District | Senator | Party | MemberPhotos filename |
|----------|---------|-------|-----------------------|
| SD-01 | David Brock Smith | Republican | smithdb.jpg |
| SD-02 | Noah Robinson | Republican | robinson.jpg |
| SD-03 | Jeff Golden | Democratic | golden.jpg |
| SD-04 | Floyd Prozanski | Democratic | prozanski.jpg |
| SD-05 | Dick Anderson | Republican | anderson.jpg |
| SD-06 | Cedric Hayden | Republican | hayden.jpg |
| SD-07 | James I. Manning Jr. | Democratic | manning.jpg |
| SD-08 | Sara Gelser Blouin | Democratic | gelser.jpg |
| SD-09 | Fred Girod | Republican | girod.jpg |
| SD-10 | Deb Patterson | Democratic | patterson.jpg |
| SD-11 | Kim Thatcher | Republican | thatcher.jpg |
| SD-12 | Bruce Starr | Republican | starr.jpg |
| SD-13 | Courtney Neron Misslin | Democratic | neron.jpg |
| SD-14 | Kate Lieber | Democratic | lieber.jpg |
| SD-15 | Janeen Sollman | Democratic | sollman.jpg |
| SD-16 | Suzanne Weber | Republican | weber.jpg |
| SD-17 | Lisa Reynolds | Democratic | reynolds.jpg |
| SD-18 | Wlnsvey Campos | Democratic | campos.jpg |
| SD-19 | Rob Wagner | Democratic | wagner.jpg |
| SD-20 | Mark Meek | Democratic | meek.jpg |
| SD-21 | Kathleen Taylor | Democratic | taylor.jpg |
| SD-22 | Lew Frederick | Democratic | frederick.jpg |
| SD-23 | Khanh Pham | Democratic | pham.jpg |
| SD-24 | Kayse Jama | Democratic | jama.jpg |
| SD-25 | Chris Gorsek | Democratic | gorsek.jpg |
| SD-26 | Christine Drazan | Republican | drazan.jpg |
| SD-27 | Anthony Broadman | Democratic | broadman.jpg |
| SD-28 | Diane Linthicum | Republican | linthicum.jpg |
| SD-29 | Todd Nash | Republican | nash.jpg |
| SD-30 | Mike McLane | Republican | mclane.jpg |

**Total: 30 senators confirmed. No vacancies.**

**Name disambiguation notes:**
- SD-01: "David Brock Smith" → `smithdb.jpg` (initials suffix to avoid conflict with common "smith")
- SD-08: "Sara Gelser Blouin" (compound surname) → `gelser.jpg` (first component)
- SD-13: "Courtney Neron Misslin" (compound surname) → `neron.jpg` (middle component)
- SD-07: "James I. Manning Jr." → `manning.jpg` (suffix stripped for filename)

**Full name storage:** Use full legal name from roster page (e.g., "James I. Manning Jr.", "Courtney Neron Misslin") — not nicknames.

### Oregon House of Representatives — 60 Reps

[VERIFIED: oregonlegislature.gov/house/Pages/RepresentativesAll.aspx]

| District | Representative | Party | MemberPhotos filename |
|----------|---------------|-------|-----------------------|
| HD-01 | Court Boice | Republican | boice.jpg |
| HD-02 | Virgle Osborne | Republican | osborne.jpg |
| HD-03 | Dwayne Yunker | Republican | yunker.jpg |
| HD-04 | Alek Skarlatos | Republican | skarlatos.jpg |
| HD-05 | Pam Marsh | Democratic | marsh.jpg |
| HD-06 | Kim Wallan | Republican | wallan.jpg |
| HD-07 | John Lively | Democratic | lively.jpg |
| HD-08 | Lisa Fragala | Democratic | fragala.jpg |
| HD-09 | Boomer Wright | Republican | wright.jpg |
| HD-10 | David Gomberg | Democratic | gomberg.jpg |
| HD-11 | Jami Cate | Republican | cate.jpg |
| HD-12 | Darin Harbick | Republican | harbick.jpg |
| HD-13 | Nancy Nathanson | Democratic | nathanson.jpg |
| HD-14 | Julie Fahey | Democratic | fahey.jpg |
| HD-15 | Shelly Boshart Davis | Republican | davis.jpg |
| HD-16 | Sarah Finger McDonald | Democratic | mcdonald.jpg |
| HD-17 | Ed Diehl | Republican | diehl.jpg |
| HD-18 | Rick Lewis | Republican | lewis.jpg |
| HD-19 | Tom Andersen | Democratic | andersen.jpg |
| HD-20 | Paul Evans | Democratic | evans.jpg |
| HD-21 | Kevin Mannix | Republican | mannix.jpg |
| HD-22 | Lesly Muñoz | Democratic | munoz.jpg |
| HD-23 | Anna Scharf | Republican | scharf.jpg |
| HD-24 | Lucetta Elmer | Republican | elmer.jpg |
| HD-25 | Ben Bowman | Democratic | bowman.jpg |
| HD-26 | Sue Rieke Smith | Democratic | rieke.jpg (verify) |
| HD-27 | Ken Helm | Democratic | helm.jpg |
| HD-28 | Dacia Grayber | Democratic | grayber.jpg |
| HD-29 | Susan McLain | Democratic | mclain.jpg |
| HD-30 | Nathan Sosa | Democratic | sosa.jpg |
| HD-31 | Darcey Edwards | Republican | edwards.jpg |
| HD-32 | Cyrus Javadi | Democratic | javadi.jpg |
| HD-33 | Shannon Isadore | Democratic | isadore.jpg |
| HD-34 | Mari Watanabe | Democratic | watanabe.jpg |
| HD-35 | Farrah Chaichi | Democratic | chaichi.jpg |
| HD-36 | Hai Pham | Democratic | pham.jpg |
| HD-37 | Jules Walters | Democratic | walters.jpg |
| HD-38 | Daniel Nguyễn | Democratic | nguyend.jpg |
| HD-39 | April Dobson | Democratic | dobson.jpg |
| HD-40 | Annessa Hartman | Democratic | hartman.jpg |
| HD-41 | Mark Gamba | Democratic | gamba.jpg |
| HD-42 | Rob Nosse | Democratic | nosse.jpg |
| HD-43 | Tawna D. Sanchez | Democratic | sanchez.jpg |
| HD-44 | Travis Nelson | Democratic | nelson.jpg |
| HD-45 | Thủy Trần | Democratic | tran.jpg |
| HD-46 | Willy Chotzen | Democratic | chotzen.jpg |
| HD-47 | Andrea Valderrama | Democratic | valderrama.jpg |
| HD-48 | Lamar Wise | Democratic | wise.jpg |
| HD-49 | Zach Hudson | Democratic | hudson.jpg |
| HD-50 | Ricki Ruiz | Democratic | ruiz.jpg |
| HD-51 | Matt Bunch | Republican | bunch.jpg |
| HD-52 | Jeff Helfrich | Republican | helfrich.jpg |
| HD-53 | Emerson Levy | Democratic | levy.jpg |
| HD-54 | Jason Kropf | Democratic | kropf.jpg |
| HD-55 | E. Werner Reschke | Republican | reschke.jpg |
| HD-56 | Emily McIntire | Republican | mcintire.jpg |
| HD-57 | Gregory Smith | Republican | smith.jpg (verify) |
| HD-58 | Bobby Levy | Republican | levy.jpg (verify — conflict with HD-53 Emerson Levy) |
| HD-59 | Vikki Breese-Iverson | Republican | breese-iverson.jpg (verify) |
| HD-60 | Mark Owens | Republican | owens.jpg |

**Total: 60 reps confirmed. No vacancies.**

**Name disambiguation notes requiring executor verification:**
- HD-26: "Sue Rieke Smith" — filename may be `rieke.jpg` or `riekes.jpg` or `smith.jpg`; verify directly
- HD-36: "Hai Pham" → `pham.jpg`; Senate SD-23 "Khanh Pham" → `senate/MemberPhotos/pham.jpg` — these are separate directories so no conflict
- HD-53 "Emerson Levy" vs HD-58 "Bobby Levy" — same last name; check if one uses `levy.jpg` and other gets suffix disambiguation (e.g., `levye.jpg` or `levyb.jpg`)
- HD-57: "Gregory Smith" — likely `smith.jpg` but verify (very common name; may conflict with Senate SD-01 "David Brock Smith" in `smithdb.jpg` — but Senate/House MemberPhotos are separate paths so no conflict)
- HD-59: "Vikki Breese-Iverson" — hyphenated; try `breese-iverson.jpg`, `breese.jpg`, `breesiverson.jpg`
- HD-55: "E. Werner Reschke" — try `reschke.jpg` or `wernere.jpg`

---

## Common Pitfalls

### Pitfall 1: District type ambiguity — SD-17 and HD-17 have identical geo_id
**What goes wrong:** `WHERE geo_id = '41017' AND state = 'or'` returns 2 rows (one STATE_UPPER, one STATE_LOWER). Subquery returns "more than one row" error.
**Why it happens:** OR uses geo_id format `41` + district number for both chambers. Districts 1–30 exist in BOTH STATE_UPPER and STATE_LOWER.
**How to avoid:** Always include `AND district_type = 'STATE_UPPER'` or `AND district_type = 'STATE_LOWER'` in the subquery.
**Warning signs:** "ERROR: more than one row returned by a subquery used as an expression"

### Pitfall 2: Wrong state casing for districts
**What goes wrong:** Using `state='OR'` (uppercase) in district lookup returns 0 rows for STATE_UPPER/STATE_LOWER.
**Why it happens:** TIGER loader sets `state='or'` (lowercase abbrev) for STATE_UPPER/STATE_LOWER. Only STATE_EXEC uses `state='OR'` (uppercase, set manually in Phase 74 migration).
**How to avoid:** Always use `state='or'` for STATE_UPPER and STATE_LOWER lookups. `state='OR'` is only correct for STATE_EXEC.
**Confirmed by:** Phase 72 Gate 5 output: `or|STATE_UPPER|30` and `or|STATE_LOWER|60`.

### Pitfall 3: GENERATED slug on chambers
**What goes wrong:** Including `slug` in the chamber INSERT column list causes a syntax/constraint error.
**Why it happens:** `essentials.chambers.slug` is a GENERATED ALWAYS column — cannot be set manually.
**How to avoid:** Never include `slug` in any INSERT for `essentials.chambers` or `essentials.governments`.

### Pitfall 4: politician_images type='headshot' causes invisible headshots
**What goes wrong:** Photos upload to Storage correctly but never display on profile/results pages.
**Why it happens:** UI filters `.find(img => img.type === 'default')`. Type 'headshot' is not recognized.
**How to avoid:** Always set `type='default'` in politician_images INSERT. This is a mandatory project-wide rule.

### Pitfall 5: Headshot filename disambiguation required for some legislators
**What goes wrong:** Downloading by simple last name fails for legislators with common or compound names.
**Known disambiguation cases (verified 2026-05-29):**
- SD-01 David Brock Smith → `smithdb.jpg` (not `smith.jpg`)
- SD-08 Sara Gelser Blouin → `gelser.jpg` (not `blouin.jpg` or `gelserblouin.jpg`)
- SD-13 Courtney Neron Misslin → `neron.jpg` (not `misslin.jpg` or `neronmisslin.jpg`)
- HD-15 Shelly Boshart Davis → `davis.jpg` (not `boshart.jpg` or `boshartdavis.jpg`)
- HD-16 Sarah Finger McDonald → `mcdonald.jpg` (not `finger.jpg` or `fingermcdonald.jpg`)
- HD-22 Lesly Muñoz → `munoz.jpg` (ASCII-stripped, no tilde)
- HD-38 Daniel Nguyễn → `nguyend.jpg` (ASCII-stripped + 'd' suffix)
- HD-45 Thủy Trần → `tran.jpg` (ASCII-stripped)
**How to avoid:** Executor must verify each flagged name by direct HTTP request before downloading.

### Pitfall 6: 115×130 source images need crop before upscale
**What goes wrong:** Stretching 115×130 directly to 600×750 distorts aspect ratio (115/130 = 0.885 ≠ 0.8 = 600/750).
**How to avoid:** Crop to 4:5 first (center-crop width from 115 to 104, keeping full height of 130), then resize to 600×750 Lanczos. Final: 104×130 → 600×750.
**Processing formula:**
```python
# 115×130 source, target 4:5 ratio (0.8)
# Current ratio: 115/130 = 0.885 (image is wider than 4:5)
# Center-crop width to 4:5: new_w = int(130 * 0.8) = 104
# Center: left = (115 - 104) // 2 = 5
img = img.crop((5, 0, 109, 130))  # → 104×130
img = img.resize((600, 750), Image.LANCZOS)  # → 600×750
```

### Pitfall 7: section-split check must be run after Plans 75-01 AND 75-02
**What goes wrong:** Seeding politicians/offices while districts have coverage gaps causes section-split bug.
**How to avoid:** Run the section-split check SQL (confirmed pattern from STATE.md) after each plan. Expect 0 rows at each gate.

---

## Code Examples

### Pre-flight assertion for district counts

```sql
-- Source: Phase 72-02-SUMMARY.md Gate 5 confirmed values
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.districts
      WHERE district_type = 'STATE_UPPER' AND state = 'or') <> 30 THEN
    RAISE EXCEPTION 'Pre-flight failed: expected 30 STATE_UPPER districts for OR, found %',
      (SELECT COUNT(*) FROM essentials.districts WHERE district_type = 'STATE_UPPER' AND state = 'or');
  END IF;
  IF (SELECT COUNT(*) FROM essentials.districts
      WHERE district_type = 'STATE_LOWER' AND state = 'or') <> 60 THEN
    RAISE EXCEPTION 'Pre-flight failed: expected 60 STATE_LOWER districts for OR, found %',
      (SELECT COUNT(*) FROM essentials.districts WHERE district_type = 'STATE_LOWER' AND state = 'or');
  END IF;
END $$;
```

### External_id range pre-flight

```sql
-- Pre-flight: assert no existing rows in target ranges
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.politicians
      WHERE external_id BETWEEN -4110030 AND -4110001) > 0 THEN
    RAISE EXCEPTION 'Pre-flight failed: -4110030..-4110001 range already occupied (% rows)',
      (SELECT COUNT(*) FROM essentials.politicians
       WHERE external_id BETWEEN -4110030 AND -4110001);
  END IF;
END $$;
```

### Verification queries (senator plan)

```sql
-- Q1: Senator count
SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -4110030 AND -4110001;
-- Expected: 30

-- Q2: Senate offices count
SELECT COUNT(*) FROM essentials.offices o
JOIN essentials.chambers c ON c.id = o.chamber_id
WHERE c.name = 'Oregon Senate';
-- Expected: 30

-- Q3: No NULL office_id in range
SELECT COUNT(*) FROM essentials.politicians
WHERE external_id BETWEEN -4110030 AND -4110001 AND office_id IS NULL;
-- Expected: 0

-- Q4: Offices linked to STATE_UPPER districts state='or'
SELECT COUNT(*) FROM essentials.offices o
JOIN essentials.chambers c ON c.id = o.chamber_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE c.name = 'Oregon Senate'
  AND d.district_type = 'STATE_UPPER'
  AND d.state = 'or';
-- Expected: 30

-- Q5: Spot-check — Portland City Hall SD-17 senator
SELECT p.full_name, p.external_id, d.geo_id, d.label
FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE d.geo_id = '41017' AND d.district_type = 'STATE_UPPER';
-- Expected: Lisa Reynolds

-- Section-split check (0 rows = clean)
SELECT gb.geo_id
FROM essentials.geofence_boundaries gb
WHERE gb.state = '41'
  AND gb.mtfcc IN ('G5210', 'G5220')
  AND NOT EXISTS (
    SELECT 1 FROM essentials.districts d
    WHERE d.geo_id = gb.geo_id
  );
-- Expected: 0 rows
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual SQL for each legislator | PowerShell generator script | Phase 39 (MA) | Eliminates typos in 90-block SQL |
| photo_origin_url column | No such column (use url + type + photo_license) | Pre-Phase 61 | Plan docs that reference photo_origin_url are wrong |
| type='headshot' in politician_images | type='default' (mandatory) | Discovered Phase 62-03 | Wrong type causes silent invisible headshots |

**Deprecated/outdated:**
- `type='headshot'` in politician_images: replaced by `type='default'` — existing plan templates may have incorrect type; always override.
- `photo_origin_url` column: does not exist on `essentials.politician_images`; plans referencing it are wrong.

---

## Headshot Source Investigation Results

### oregonlegislature.gov MemberPhotos — PRIMARY SOURCE

[VERIFIED: direct HTTP requests, 2026-05-29]

- **URL pattern (senate):** `https://www.oregonlegislature.gov/senate/MemberPhotos/{lastname}.jpg`
- **URL pattern (house):** `https://www.oregonlegislature.gov/house/MemberPhotos/{lastname}.jpg`
- **Dimensions:** 115×130 pixels, RGB JPEG
- **Coverage:** All 90 legislators confirmed accessible (tested ~25 samples)
- **No auth required:** Direct curl with standard User-Agent + Referer header
- **Upscale required:** Yes — 115×130 → 600×750 (5.2× upscale); approved by D-05
- **photo_license:** `public_domain` (government official photos, consistent with all prior OR phases)

**Filename disambiguation (verified):**

| Member | Raw Name | Filename | Verification |
|--------|----------|----------|-------------|
| SD-01 David Brock Smith | "Smith" would collide | `smithdb.jpg` | HTTP 200 confirmed |
| SD-08 Sara Gelser Blouin | compound surname | `gelser.jpg` | HTTP 200 confirmed |
| SD-13 Courtney Neron Misslin | compound surname | `neron.jpg` | HTTP 200 confirmed |
| HD-15 Shelly Boshart Davis | compound surname | `davis.jpg` | HTTP 200 confirmed |
| HD-16 Sarah Finger McDonald | compound surname | `mcdonald.jpg` | HTTP 200 confirmed |
| HD-22 Lesly Muñoz | diacritical | `munoz.jpg` | HTTP 200 confirmed |
| HD-38 Daniel Nguyễn | diacritical | `nguyend.jpg` | HTTP 200 confirmed |
| HD-45 Thủy Trần | diacritical | `tran.jpg` | HTTP 200 confirmed |

**Unverified edge cases (executor must confirm before download):**
- HD-26 Sue Rieke Smith: `rieke.jpg` suspected (not `smith.jpg` — would conflict)
- HD-53/HD-58 Emerson Levy / Bobby Levy: likely one gets suffix disambiguation; check which is `levy.jpg` and which gets `levye.jpg` or `levyb.jpg`
- HD-55 E. Werner Reschke: `reschke.jpg` suspected (initial in name suggests disambiguation possible)
- HD-59 Vikki Breese-Iverson: hyphenated name; `breesiverson.jpg` or `breese.jpg` suspected

### sos.oregon.gov Blue Book — NOT A BULK SOURCE

[VERIFIED: direct HTTP requests, 2026-05-29]

- **URL pattern:** `https://sos.oregon.gov/blue-book/PublishingImages/state/legislative/{LastName}.jpg`
- **Coverage:** Only legislative leadership confirmed (House Speaker Fahey = 500×623; Senate President Wagner at `senator-wagner.jpg` = 500×623)
- **All other legislators:** URL returns HTML 404 page with content-type=text/html (~33KB) disguised as HTTP 200
- **Conclusion:** Blue Book cannot be used as a bulk source for OR legislators; use oregonlegislature.gov MemberPhotos exclusively

---

## Runtime State Inventory

Step 2.5: SKIPPED — This is a greenfield seeding phase, not a rename/refactor/migration phase. No existing records are being renamed.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3 + Pillow | Headshot processing | ✓ | Python 3 + PIL available in scripts | — |
| psql | Migration apply | ✓ | Available (used in all prior phases) | — |
| PowerShell | Generator scripts | ✓ | Available (Windows 10, used in Phase 52) | Inline SQL (slower, error-prone) |
| Supabase Storage API | Headshot upload | ✓ | Live (used in Phases 52, 61, 74) | — |
| oregonlegislature.gov | Headshot download | ✓ | HTTP 200 without auth (tested) | — |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | SQL verification queries (psql, no unit test framework) |
| Config file | none — SQL queries inline in plan |
| Quick run command | `psql $DATABASE_URL -f verify_75.sql` |
| Full suite command | Same — all gates in one script |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-01 | 30 senators linked to STATE_UPPER districts state='or' | SQL gate | See Q4 in Code Examples | ❌ Wave 0 |
| D-02 | 60 house reps linked to STATE_LOWER districts state='or' | SQL gate | Same pattern, STATE_LOWER | ❌ Wave 0 |
| D-10 | external_id ranges occupied | SQL gate | COUNT WHERE external_id BETWEEN | ❌ Wave 0 |
| — | 0 NULL office_id | SQL gate | Q3 above | ❌ Wave 0 |
| — | 90 headshots type='default' in politician_images | SQL gate | COUNT WHERE external_id in range | ❌ Wave 0 |
| — | Portland City Hall → Lisa Reynolds (SD-17) | Routing smoke test | Reuse smoke-or-geofences.ts | ✓ Exists |

### Sampling Rate

- **Per plan commit:** Run inline verification queries (Q1–Q5 per plan)
- **Per wave merge:** Full suite including section-split check
- **Phase gate:** All verification queries green + Portland City Hall routing confirms Lisa Reynolds (SD-17) + Andrew Andersen (HD-19) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] Inline SQL verification queries in each plan (no separate file needed — same pattern as Phases 52, 61, 74)

---

## Security Domain

This phase inserts data rows only (politicians, offices, politician_images). No new endpoints, auth paths, or schema changes. No security controls apply to bulk data seeding operations.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | No | SQL params are hardcoded constants in migration files |
| V6 Cryptography | No | — |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | HD-26 Sue Rieke Smith → `rieke.jpg` | Roster table | Would 404 on download; executor must verify and find alternate |
| A2 | HD-53/HD-58 Levy disambiguation uses suffix initials | Roster table | May get wrong person's photo; executor must verify both |
| A3 | HD-55 E. Werner Reschke → `reschke.jpg` | Roster table | Would 404; executor tries alternative |
| A4 | HD-59 Vikki Breese-Iverson → `breesiverson.jpg` | Roster table | Would 404; executor tries `breese.jpg` etc. |
| A5 | prozanski.jpg, lieber.jpg, meek.jpg, taylor.jpg, starr.jpg, anderson.jpg, weber.jpg exist | Roster table | If 404, fall back to D-07 (document as gap) |

**Note:** Assumptions A1–A5 are low-risk because the executor is explicitly instructed to verify each filename with a direct HTTP request before downloading. The MemberPhotos roster page is authoritative; the executor should scrape the HTML img src values for all 90 members rather than deriving filenames.

---

## Open Questions (RESOLVED)

1. **Should the executor scrape img src from the roster pages rather than deriving filenames?**
   - What we know: ~85% of filenames follow simple `{lastname}.jpg` pattern; ~15% have disambiguation
   - What's unclear: Whether the roster AllPages HTML has all img src attributes parseable in one pass
   - Recommendation: Yes — scrape the `SenatorsAll.aspx` and `RepresentativesAll.aspx` HTML for all img src values before downloading; this eliminates all disambiguation guesswork

2. **Emerson Levy (HD-53, D) vs Bobby Levy (HD-58, R) — both have last name Levy**
   - What we know: Common disambiguation pattern adds initial suffix (smithdb, nguyend)
   - What's unclear: Which one gets the suffix (levye vs levyb)
   - Recommendation: Scrape roster page HTML for actual filenames

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: oregonlegislature.gov/senate/Pages/SenatorsAll.aspx] — 30 senator roster with party and district, confirmed 2026-05-29
- [VERIFIED: oregonlegislature.gov/house/Pages/RepresentativesAll.aspx] — 60 house rep roster with party and district, confirmed 2026-05-29
- [VERIFIED: direct HTTP GET oregonlegislature.gov/senate/MemberPhotos/*.jpg] — 115×130 JPEG confirmed for ~15 senators tested
- [VERIFIED: direct HTTP GET oregonlegislature.gov/house/MemberPhotos/*.jpg] — 115×130 JPEG confirmed for ~15 reps tested
- [VERIFIED: .planning/phases/74-or-executives-federal/74-03-SUMMARY.md] — next applied migration = 226
- [VERIFIED: .planning/phases/72-portland-or/72-02-SUMMARY.md] — 30 STATE_UPPER + 60 STATE_LOWER districts confirmed, geo_id format `41NNN`, state='or' lowercase
- [VERIFIED: .planning/phases/73-or-government-db/73-01-SUMMARY.md] — Oregon Senate + Oregon House of Representatives chambers confirmed, subquery pattern

### Secondary (MEDIUM confidence)
- [CITED: .planning/phases/52-me-state-legislature/52-01-SUMMARY.md] — ME senator seeding pattern (CTE blocks, PowerShell generator, office title='Senator')
- [CITED: .planning/phases/52-me-state-legislature/52-02-SUMMARY.md] — ME house rep seeding pattern (150 reps, office title='Representative')
- [CITED: .planning/phases/52-me-state-legislature/52-03-SUMMARY.md] — ME house thumbnail upscale (152×202 → 600×750 approved); 115×130 is smaller, same principle
- [CITED: .planning/phases/61-ca-state-legislature/61-01-SUMMARY.md] — CA senator CTE pattern; district geo_id formula confirmed
- [CITED: .planning/STATE.md] — politician_images type='default' mandatory rule; slug GENERATED ALWAYS; WHERE NOT EXISTS for governments

### Tertiary (LOW confidence — flagged as [ASSUMED])
- See Assumptions Log above — 5 unverified filename edge cases for specific legislators

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pure data migration, no new packages, well-established patterns
- Architecture: HIGH — direct precedent from Phases 52 (ME) and 61 (CA)
- Headshot source: HIGH — all key filenames verified by direct HTTP requests; 5 edge cases flagged
- District integration: HIGH — Phase 72 Gate 5 confirmed counts; geo_id format confirmed from smoke test

**Research date:** 2026-05-29
**Valid until:** 2026-08-29 (legislature rosters change slowly; verify for any new session after June 2026)
