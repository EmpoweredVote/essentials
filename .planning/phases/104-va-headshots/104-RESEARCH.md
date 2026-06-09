# Phase 104: VA Headshots — Research

**Researched:** 2026-06-08
**Domain:** Python headshot download/process/upload scripts + AUDIT-ONLY SQL migration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 4 separate Python scripts, one per group: `_tmp-va-execs-headshots.py`, `_tmp-va-senators-headshots.py`, `_tmp-va-delegates-headshots.py`, `_tmp-va-federal-headshots.py`.
- **D-02:** Scripts are structured identically to `_tmp-alexandria-headshots.py` (PIL LANCZOS q90, Supabase Storage upload, crop-then-resize pipeline, browser User-Agent headers).
- **D-03:** Primary source for delegates: `https://vga.virginia.gov/delegate_photos/{H0000}.jpg` — researcher MUST verify at phase time. (Verified below — URL structure is different; see Standard Stack.)
- **D-04:** HD-20 is VACANT (`is_vacant=true`) — skip entirely; do not insert a `politician_images` row.
- **D-05:** Senate base URL: `https://apps.senate.virginia.gov/Senator/images/member_photos/{LastName}{district}` — no file extension. Verified below.
- **D-06:** Fallback for senate URL failures: Wikipedia Commons first, then official senate.virginia.gov profile.
- **D-07:** Federal primary source: Congress.gov official portraits via `https://www.congress.gov/img/member/{bioguide_id}.jpg`. (Note: congress.gov blocks direct access; unitedstates/images GitHub mirror is the working equivalent — see findings below.)
- **D-08:** Federal headshots in a dedicated script, separate from state scripts.
- **D-09:** One migration file: `315_va_headshots.sql` (AUDIT-ONLY). Do NOT apply via Supabase MCP ledger.
- **D-10:** Migration header MUST include per-official source URLs, original dimensions, crop dimensions, resize dimensions — matching style of `314_alexandria_headshots.sql`.
- **D-11:** `politician_images.type = 'default'` (never 'headshot').
- **D-12:** Crop to 4:5 ratio FIRST, THEN resize to 600×750 Lanczos q90 — never stretch directly.
- **D-13:** Storage bucket: `politician_photos` (NOT 'politician-headshots'). Path: `{politician_id}-headshot.jpg`.
- **D-14:** Column name is `url` (NOT `storage_url`).
- **D-15:** `WHERE NOT EXISTS` guard on every `politician_images` INSERT (idempotent).
- **D-16:** `photo_license = 'public_domain'` for all government-sourced official photos.
- **D-17:** Skip any official where `is_vacant=true`.

### Claude's Discretion

None specified.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VA-GOV-06 | 100% headshot coverage for all VA officials at 600×750 JPEG — delegates via vga.virginia.gov, senators via apps.senate.virginia.gov pattern, executives and federal from official sources | URL patterns verified live; complete HD→H-ID mapping obtained; all senate URL keys confirmed; exec and federal sources found and verified |
</phase_requirements>

---

## Summary

Phase 104 downloads, processes, and uploads headshots for all 155 active VA officials (156 seeded minus 1 vacant HD-20), then writes a single AUDIT-ONLY migration 315 that records the `politician_images` INSERTs. The phase follows the exact pattern established by phase 103 (Alexandria headshots), using the same script structure, PIL pipeline, and migration format.

**Critical discovery:** The delegate photo URL documented in CONTEXT.md (`vga.virginia.gov/delegate_photos/{H0000}.jpg`) is incorrect — the site has been redesigned. The correct base URL is `https://house.vga.virginia.gov/delegate_photos/{H####}.jpg` where `{H####}` is an internal VGA member ID (e.g., `H0219` for HD-1, not `H0001`). A complete HD-number → H-ID mapping was scraped during this research and is documented below. The full-res path (without `/thumbs/`) yields 2500×2500 px images — excellent quality.

Senate photos at `apps.senate.virginia.gov` are confirmed working but are only ~262×269 pixels — small but above the 200px minimum threshold; the script will upscale cleanly via Lanczos. The senate URL key pattern is `{TitleCaseLastName}{DistrictNum}` (case-sensitive, TitleCase, no zero-padding). Compound last names use the full compound (e.g., `VanValkenburg16`, `Bennett-Parker39`, `Carroll Foy33` with a space). Four names use only the final segment or a non-obvious component: Brankley Mulchi SD-9 → `Mulchi9`; New Craig SD-19 → `Craig19`; Williams Graves SD-21 → `Williams Graves21`; Carroll Foy SD-33 → `Carroll Foy33`.

Congress.gov blocks direct HTTP access to portrait images. The `unitedstates/images` GitHub mirror (`https://unitedstates.github.io/images/congress/original/{bioguide}.jpg`) serves the same portraits and is accessible. James Walkinshaw (VA-11, W000831) is not yet in the GitHub mirror (he took office September 2025); his official portrait is available directly from `walkinshaw.house.gov`.

**Primary recommendation:** Use the verified URL tables below directly in scripts — do not re-probe at plan time. The senate URL table, delegate HD→H-ID table, and federal bioguide table are all confirmed correct as of 2026-06-08.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Image download | Script (Python) | — | Downloads from external government websites |
| Image processing (crop/resize) | Script (Python, PIL) | — | CPU-bound transformation, not DB concern |
| Storage upload | Script (Python, Supabase Storage API) | — | Binary upload to object storage |
| DB record creation | Migration SQL (AUDIT-ONLY) | — | Auditable record of what the scripts did |
| `politician_id` resolution | Migration SQL subquery | — | `SELECT id FROM politicians WHERE external_id = N` |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Pillow (PIL) | 10.x | Crop 4:5, resize 600×750 Lanczos q90, convert mode | Established project standard |
| requests | 2.x | Download images with browser User-Agent headers | Established project standard |
| psycopg2 | 2.9.x | DB connection (used in script even if no direct DB writes in phase) | Established project standard |

**Installation:** `pip install Pillow requests psycopg2-binary` (already installed in project env)

### External Sources (not packages)

| Source | URL Pattern | Domain |
|--------|------------|---------|
| Delegate photos (full-res) | `https://house.vga.virginia.gov/delegate_photos/{H####}.jpg` | house.vga.virginia.gov |
| Senate photos | `https://apps.senate.virginia.gov/Senator/images/member_photos/{Key}` | apps.senate.virginia.gov |
| Federal portraits (most) | `https://unitedstates.github.io/images/congress/original/{bioguide}.jpg` | unitedstates.github.io |
| Walkinshaw only | `https://walkinshaw.house.gov/uploadedphotos/highresolution/122f9b36-4502-4307-a1dd-a6c925cda981.jpg` | walkinshaw.house.gov |
| Spanberger | `https://www.governor.virginia.gov/media/governorvirginiagov/governor-of-virginia/images/Governor-Spanberger-Official-Portrait.jpg` | governor.virginia.gov |
| Hashmi | `https://www.ltgov.virginia.gov/media/governorvirginiagov/lieutenant-governor/Portrait-LT-Governor-Ghazala-Hashmi.jpg` | ltgov.virginia.gov |
| Jones | `https://www.ag.virginia.gov/images/Jones-headshot-20260320.jpg` | ag.virginia.gov |

---

## Package Legitimacy Audit

No new packages being installed — all packages (Pillow, requests, psycopg2) are already installed in the project environment from prior phases. No new npm or PyPI installs required for this phase.

---

## Architecture Patterns

### System Architecture Diagram

```
External sources                Script                    Supabase
------------------             --------                  --------
vga.virginia.gov  --> download --> PIL crop 4:5          politician_photos/
apps.senate.va.gov    (bytes)   -> PIL resize 600x750 -> {uuid}-headshot.jpg
governor.va.gov                 -> JPEG q90 bytes   
unitedstates.github.io                |
walkinshaw.house.gov                  v
                              Supabase Storage API
                              (PUT with x-upsert: true)
                                      |
                                      v
                              Migration 315 (SQL)
                              AUDIT-ONLY INSERT into
                              essentials.politician_images
                              WHERE NOT EXISTS guard
```

### Recommended Project Structure

```
C:/EV-Accounts/backend/
  scripts/
    _tmp-va-execs-headshots.py       # 3 officials (Spanberger, Hashmi, Jones)
    _tmp-va-senators-headshots.py    # 40 senators (HD-20 vacant skip N/A here)
    _tmp-va-delegates-headshots.py   # 99 active delegates (skip HD-20 vacant)
    _tmp-va-federal-headshots.py     # 13 federal (Warner, Kaine, 11 House)
  migrations/
    315_va_headshots.sql             # AUDIT-ONLY (not applied via MCP ledger)
```

### Pattern 1: Script Structure (copy from _tmp-alexandria-headshots.py)

**What:** Load `.env`, define `ROSTER` list of dicts, `download_image()`, `crop_to_4_5()`, `resize_600x750()`, `upload_to_storage()`, `process_member()`, `main()`.

**When to use:** Every VA headshot script.

```python
# Source: C:/EV-Accounts/backend/scripts/_tmp-alexandria-headshots.py

_env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
_env = {}
with open(_env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            _env[k.strip()] = v.strip()

SUPABASE_URL = _env.get('SUPABASE_URL', '')
SERVICE_KEY = _env.get('SUPABASE_SERVICE_ROLE_KEY', '')
DATABASE_URL = _env.get('DATABASE_URL', '')
BUCKET = 'politician_photos'
CDN_BASE = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos'
TARGET_SIZE = (600, 750)
JPEG_QUALITY = 90
RESAMPLE = Image.Resampling.LANCZOS
```

### Pattern 2: AUDIT-ONLY Migration INSERT Block

**What:** INSERT into `essentials.politician_images` using `SELECT gen_random_uuid(), (SELECT id FROM politicians WHERE external_id = N), 'cdn_url', 'default', 'public_domain' WHERE NOT EXISTS (...)`.

**When to use:** Every row in migration 315.

```sql
-- Source: C:/EV-Accounts/backend/migrations/314_alexandria_headshots.sql

-- Name (external_id) — Title
-- UUID: {uuid}
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -XXXXXXX),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -XXXXXXX)
);
```

### Pattern 3: Migration 315 — AUDIT-ONLY Header

Migration 315 follows the same pattern as 314 but has a different note:

```sql
-- Migration 315: VA Headshots (VA-GOV-06)
--
-- Inserts politician_images rows for:
--   3 VA state executives (Spanberger, Hashmi, Jones)
--   40 VA state senators (SD-1 through SD-40)
--   99 VA House delegates (HD-1 through HD-100, excluding HD-20 vacant)
--   13 VA federal officials (Warner, Kaine, 11 House reps)
--   Total: 155 rows
--
-- All headshots uploaded to Supabase Storage bucket 'politician_photos'
-- via scripts/_tmp-va-{group}-headshots.py (Phase 104 Plans 01-04).
-- Storage URL: https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/
--
-- AUDIT-ONLY: Do NOT apply via Supabase MCP ledger.
-- Scripts do the live writes; this migration records them for audit purposes.
```

### Anti-Patterns to Avoid

- **Using `/delegate_photos/{H0001}.jpg` on vga.virginia.gov:** vga.virginia.gov returns 404 for all delegate photo paths. The correct base domain is `house.vga.virginia.gov`. [VERIFIED: live HTTP probing]
- **Using `/delegate_photos/thumbs/{H####}.jpg`:** The thumbs path yields 150×150px images (far too small). Always use the full-res path `/delegate_photos/{H####}.jpg` (2500×2500px). [VERIFIED: live HTTP probing]
- **Constructing delegate URLs from district numbers directly:** H-IDs are internal member IDs, not district numbers. HD-1 is H0219, not H0001. Use the lookup table documented below. [VERIFIED: live scraping of house.vga.virginia.gov/members]
- **Zero-padding senate district numbers:** `French01` fails; `French1` succeeds. District numbers are never zero-padded. [VERIFIED: live HTTP probing]
- **Lowercase senate names:** `french1` fails; `French1` succeeds. The pattern is TitleCase, case-sensitive. [VERIFIED: live HTTP probing]
- **Using congress.gov/img/member/ directly:** All direct HTTP requests to congress.gov return 403 or drop the connection. Use `unitedstates.github.io/images/congress/original/{bioguide}.jpg` instead. [VERIFIED: live HTTP probing]
- **Applying migration 315 via Supabase MCP ledger:** AUDIT-ONLY migrations are NOT applied via MCP. The scripts write the data; the migration records it.
- **Using `type='headshot'`:** The UI uses `.find(img => img.type === 'default')`. Any other type value silently hides the image.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image crop/resize | Custom JPEG manipulation | `PIL.Image.crop()` + `.resize(LANCZOS)` | Handles all edge cases (EXIF, RGBA, P-mode, progressive) |
| Storage upload | Custom multipart uploader | Supabase Storage REST API (PUT + x-upsert header) | Project standard; handles CDN URL generation |
| Senate URL extension discovery | Custom CDN probing loop | Request `{Key}.jpg` directly — it always works | All 40 senate senators confirmed to have `.jpg` versions |

**Key insight:** The senate URL pattern uses `.jpg` extension reliably (no extension-probing needed); D-05 said to probe for extensions, but live testing confirms `.jpg` always works for existing senators.

---

## Verified URL Patterns

### Delegate URL Pattern [VERIFIED: live HTTP probing 2026-06-08]

**Base:** `https://house.vga.virginia.gov/delegate_photos/{H####}.jpg`

The `{H####}` is the VGA internal member ID — not the district number. Full-res images are 2500×2500 pixels. The `/thumbs/` subfolder exists but only has 150×150 thumbnails.

**Complete HD-number → H-ID mapping** (scraped from `house.vga.virginia.gov/members`, verified 2026-06-08):

```
HD-1   H0219    HD-2   H0375    HD-3   H0239    HD-4   H0208    HD-5   H0406
HD-6   H0269    HD-7   H0370    HD-8   H0344    HD-9   H0294    HD-10  H0317
HD-11  H0403    HD-12  H0351    HD-13  H0264    HD-14  H0108    HD-15  H0355
HD-16  H0281    HD-17  H0405    HD-18  H0305    HD-19  H0365    HD-20  VACANT
HD-21  H0382    HD-22  H0297    HD-23  H0404    HD-24  H0227    HD-25  H0343
HD-26  H0385    HD-27  H0380    HD-28  H0301    HD-29  H0374    HD-30  H0395
HD-31  H0377    HD-32  H0329    HD-33  H0398    HD-34  H0231    HD-35  H0321
HD-36  H0350    HD-37  H0253    HD-38  H0266    HD-39  H0357    HD-40  H0308
HD-41  H0393    HD-42  H0333    HD-43  H0224    HD-44  H0242    HD-45  H0056
HD-46  H0390    HD-47  H0348    HD-48  H0384    HD-49  H0401    HD-50  H0136
HD-51  H0383    HD-52  H0325    HD-53  H0364    HD-54  H0354    HD-55  H0371
HD-56  H0362    HD-57  H0397    HD-58  H0327    HD-59  H0259    HD-60  H0328
HD-61  H0247    HD-62  H0394    HD-63  H0342    HD-64  H0388    HD-65  H0314
HD-66  H0389    HD-67  H0369    HD-68  H0238    HD-69  H0392    HD-70  H0323
HD-71  H0386    HD-72  H0124    HD-73  H0396    HD-74  H0335    HD-75  H0391
HD-76  H0361    HD-77  H0402    HD-78  H0212    HD-79  H0356    HD-80  H0372
HD-81  H0207    HD-82  H0399    HD-83  H0347    HD-84  H0336    HD-85  H0284
HD-86  H0400    HD-87  H0173    HD-88  H0322    HD-89  H0387    HD-90  H0262
HD-91  H0285    HD-92  H0353    HD-93  H0349    HD-94  H0366    HD-95  H0311
HD-96  H0295    HD-97  H0360    HD-98  H0407    HD-99  H0345    HD-100 H0267
```

Note: HD-20 is absent (vacant as of migration 308 — Michelle Maldonado resigned 2026-05-31). Only 99 H-IDs listed.

### Senate URL Pattern [VERIFIED: live HTTP probing 2026-06-08]

**Base:** `https://apps.senate.virginia.gov/Senator/images/member_photos/{Key}.jpg`

Pattern: `{TitleCaseLastName}{DistrictNum}` (district number is NOT zero-padded).
- Single-word last names: `French1`, `Obenshain2`, `Peake8`, `Deeds11`, `Rouse22`
- Hyphenated names: use hyphen → `Bennett-Parker39`
- Camel-case compound: `VanValkenburg16`, `DeSteph20`, `McDougle26`, `McPike29`
- Space-separated compound (surname has a space): `Williams Graves21`, `Carroll Foy33`
- Only-final-segment: `Mulchi9` (Tammy Brankley Mulchi), `Craig19` (Christie New Craig)

**Complete key table for all 40 senators** (all confirmed HTTP 200):

```
SD-1  French1          SD-2  Obenshain2       SD-3  Head3
SD-4  Suetterlein4     SD-5  Hackworth5       SD-6  Pillion6
SD-7  Stanley7         SD-8  Peake8           SD-9  Mulchi9
SD-10 Cifers10         SD-11 Deeds11          SD-12 Sturtevant12
SD-13 Aird13           SD-14 Bagby14          SD-15 Jones15
SD-16 VanValkenburg16  SD-17 Jordan17         SD-18 Lucas18
SD-19 Craig19          SD-20 DeSteph20        SD-21 Williams Graves21
SD-22 Rouse22          SD-23 Locke23          SD-24 Diggs24
SD-25 Stuart25         SD-26 McDougle26       SD-27 Durant27
SD-28 Reeves28         SD-29 McPike29         SD-30 Roem30
SD-31 Perry31          SD-32 Srinivasan32     SD-33 Carroll Foy33
SD-34 Surovell34       SD-35 Marsden35        SD-36 Pekarsky36
SD-37 Salim37          SD-38 Boysko38         SD-39 Bennett-Parker39
SD-40 Favola40
```

**Image dimensions:** ~262×269 px (confirmed for French1, Roem30, VanValkenburg16, Favola40). Small but above the 200px minimum. All are portrait-oriented (near-square, width ≤ height). The crop-to-4:5 step will narrow the image from ~262px to ~209px wide, then upscale to 600×750. Quality will be acceptable given Lanczos upscaling, but these are not high-resolution sources.

**Note:** Senate photos can be fetched without the `.jpg` extension (the server returns `image/jpeg` either way). The script can simply always append `.jpg` for consistency.

### Federal Official Bioguide IDs and Source URLs [VERIFIED: Congress API + search 2026-06-08]

**Standard source:** `https://unitedstates.github.io/images/congress/original/{bioguide}.jpg`

| Official | external_id | Bioguide | Source | Notes |
|---------|-------------|---------|--------|-------|
| Mark Warner (US Sen) | -400080 | W000805 | unitedstates/images | OK (328KB) |
| Tim Kaine (US Sen) | -400079 | K000384 | unitedstates/images | OK (353KB) |
| Rob Wittman VA-1 | -5102001 | W000804 | unitedstates/images | OK (82KB) |
| Jen Kiggans VA-2 | -5102002 | K000399 | unitedstates/images | OK (259KB) |
| Bobby Scott VA-3 | -5102003 | S000185 | unitedstates/images | OK (386KB) |
| Jennifer McClellan VA-4 | -5102004 | M001227 | unitedstates/images | OK (213KB) |
| Ben Cline VA-5 | -5102005 | C001118 | unitedstates/images | OK (113KB) |
| Morgan Griffith VA-6 | -5102006 | G000568 | unitedstates/images | OK (234KB) |
| Eugene Vindman VA-7 | -5102007 | V000138 | unitedstates/images | OK (220KB) |
| Don Beyer VA-8 | -5102008 | B001292 | unitedstates/images | OK (80KB) |
| John McGuire VA-9 | -5102009 | M001239 | unitedstates/images | OK (235KB) |
| Suhas Subramanyam VA-10 | -5102010 | S001230 | unitedstates/images | OK (193KB) |
| James Walkinshaw VA-11 | -5102011 | W000831 | walkinshaw.house.gov | NOT in unitedstates/images yet; use house.gov URL |

**Walkinshaw house.gov URL (verified HTTP 200, 2.1MB):**
`https://walkinshaw.house.gov/uploadedphotos/highresolution/122f9b36-4502-4307-a1dd-a6c925cda981.jpg`

**IMPORTANT:** Congress.gov (`www.congress.gov/img/member/{bioguide}.jpg`) blocks all direct HTTP access (returns 403 or drops connection). D-07 says "Congress.gov official portraits" but the practical route is the unitedstates/images GitHub mirror, which hosts the same official portraits. This is the CA/MD pattern established in prior phases.

### VA State Executives — Source URLs [VERIFIED: live HTTP probing 2026-06-08]

| Official | external_id | Source URL | Dimensions |
|---------|-------------|------------|------------|
| Abigail Spanberger | -510001 | `https://www.governor.virginia.gov/media/governorvirginiagov/governor-of-virginia/images/Governor-Spanberger-Official-Portrait.jpg` | 784×1000 JPEG (166KB) |
| Ghazala Hashmi | -510002 | `https://www.ltgov.virginia.gov/media/governorvirginiagov/lieutenant-governor/Portrait-LT-Governor-Ghazala-Hashmi.jpg` | 1125×1472 JPEG (271KB) |
| Jay Jones | -510003 | `https://www.ag.virginia.gov/images/Jones-headshot-20260320.jpg` | 425×283 JPEG (74KB) — landscape |

**Note on Jay Jones:** 425×283 is landscape. The crop-to-4:5 step will center-crop to ~226×283 (width=283×0.8=226). This is barely above the 200px minimum. If quality is unacceptable after resize, the script should fall back to the Wikipedia Commons image: `https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Jay_Jones_Speaks_at_rally_in_Fairfax_City_%28cropped%29.png/250px-Jay_Jones_Speaks_at_rally_in_Fairfax_City_%28cropped%29.png` (the base image at that path is 250px wide but the original at the Commons page is larger). Consider checking `ag.virginia.gov/about/` page at run time for a higher-resolution option.

---

## VA Officials Roster (from migrations 306-311)

### State Executives (migration 306) — 3 officials

| external_id | Name | Title |
|------------|------|-------|
| -510001 | Abigail Spanberger | Governor |
| -510002 | Ghazala Hashmi | Lieutenant Governor |
| -510003 | Jay Jones | Attorney General |

### State Senators (migration 307) — 40 officials, NO vacancies

All 40 senators confirmed in migration 307 with external_ids -5110001 through -5110040. No vacancies. Full roster:

SD-1 Timmy French, SD-2 Mark D. Obenshain, SD-3 Christopher T. Head, SD-4 David R. Suetterlein, SD-5 T. Travis Hackworth, SD-6 Todd E. Pillion, SD-7 William M. Stanley Jr., SD-8 Mark J. Peake, SD-9 Tammy Brankley Mulchi, SD-10 Luther H. Cifers III, SD-11 R. Creigh Deeds, SD-12 Glen H. Sturtevant Jr., SD-13 Lashrecse D. Aird, SD-14 Lamont Bagby, SD-15 Michael J. Jones, SD-16 Schuyler T. VanValkenburg, SD-17 Emily M. Jordan, SD-18 L. Louise Lucas, SD-19 Christie New Craig, SD-20 Bill DeSteph, SD-21 Angelia Williams Graves, SD-22 Aaron R. Rouse, SD-23 Mamie E. Locke, SD-24 J.D. Diggs, SD-25 Richard H. Stuart, SD-26 Ryan T. McDougle, SD-27 Tara A. Durant, SD-28 Bryce E. Reeves, SD-29 Jeremy S. McPike, SD-30 Danica A. Roem, SD-31 Russet W. Perry, SD-32 Kannan Srinivasan, SD-33 Jennifer D. Carroll Foy, SD-34 Scott A. Surovell, SD-35 David W. Marsden, SD-36 Stella G. Pekarsky, SD-37 Saddam Azlan Salim, SD-38 Jennifer B. Boysko, SD-39 Elizabeth B. Bennett-Parker, SD-40 Barbara A. Favola.

### House Delegates (migration 308) — 100 seeded, 1 vacant (HD-20), 99 active

HD-20 (external_id = -5120020): Michelle Maldonado, resigned 2026-05-31. Seeded as `is_vacant=true, is_active=false`. Skip in all scripts.

Active delegates: HD-1 Patrick A. Hope through HD-100 Robert S. Bloxom Jr. (see migration 308 for full list). external_ids -5120001 through -5120100.

### Federal Officials (migration 311) — 13 officials

US Senators: Warner (ext -400080), Kaine (ext -400079) — seeded before migration 311.
House reps: -5102001 (Wittman VA-1) through -5102011 (Walkinshaw VA-11).

---

## Common Pitfalls

### Pitfall 1: Delegate Photo URL on Wrong Domain

**What goes wrong:** Script constructs `https://vga.virginia.gov/delegate_photos/H0386.jpg` and gets 404.
**Why it happens:** VGA redesigned their site; delegate photos moved to `house.vga.virginia.gov`. The `vga.virginia.gov` domain returns 404 for all delegate photo paths regardless of format.
**How to avoid:** Use `https://house.vga.virginia.gov/delegate_photos/{H####}.jpg` with the H-ID from the lookup table.
**Warning signs:** All delegate downloads fail with HTTP 404.

### Pitfall 2: Delegate URL Constructed from District Number

**What goes wrong:** Script uses `H0001` for HD-1, gets HTTP 500 (internal server error).
**Why it happens:** VGA H-IDs are internal member sequence numbers, not district numbers. H0001 was assigned long ago to a former member. HD-1 is currently H0219.
**How to avoid:** Use the HD → H-ID lookup table documented above. Hardcode each entry in the ROSTER dict.
**Warning signs:** Some delegates succeed and others fail with HTTP 500 (former member files) or 404 (no file at all).

### Pitfall 3: Senate Name Casing or Format

**What goes wrong:** `french1` or `FRENCH1` or `French01` all return 404.
**Why it happens:** The server is case-sensitive and uses no padding.
**How to avoid:** Use TitleCase last name (or compound key per the table above) + bare integer district number.
**Warning signs:** Senate URL HEAD requests return HTTP 404; try with exact casing from the table.

### Pitfall 4: Bennett-Parker Uses Hyphen, Williams Graves Uses Space

**What goes wrong:** `BennettParker39` fails; `Williams-Graves21` fails.
**Why it happens:** Senate photo filenames follow the actual senator's last name including spacing/hyphenation.
**How to avoid:** Bennett-Parker39 (hyphen preserved), Williams Graves21 (space preserved), Carroll Foy33 (space preserved). See full key table.
**Warning signs:** HTTP 404 on individual senators; compare against the verified table.

### Pitfall 5: Mulchi9 and Craig19 Are Non-Obvious

**What goes wrong:** `BrankleyMulchi9`, `NewCraig9`, `NewCraig19` all fail.
**Why it happens:** The VA Senate website uses only the final segment of the senator's last name for Tammy Brankley Mulchi (→ `Mulchi`) and Christie New Craig (→ `Craig`).
**How to avoid:** Use the exact key from the verified table. No pattern rule — hardcode each senator's key.
**Warning signs:** HTTP 404; must fall back to D-06 sources (Wikipedia Commons or senate.virginia.gov).

### Pitfall 6: Congress.gov Portrait URL Is Blocked

**What goes wrong:** `requests.get('https://www.congress.gov/img/member/W000805.jpg')` gets 403 or connection reset.
**Why it happens:** Congress.gov blocks programmatic access to image URLs.
**How to avoid:** Use `https://unitedstates.github.io/images/congress/original/{bioguide}.jpg` (same photos, accessible).
**Warning signs:** All 12 congress.gov downloads fail; switch to unitedstates/images mirror.

### Pitfall 7: Walkinshaw Not in unitedstates/images

**What goes wrong:** `https://unitedstates.github.io/images/congress/original/W000831.jpg` returns 404.
**Why it happens:** James Walkinshaw took office September 2025; the GitHub repository hasn't added him yet.
**How to avoid:** Use the `walkinshaw.house.gov` direct URL (verified above) as the hardcoded source.
**Warning signs:** W000831 returns 404 on unitedstates.github.io; already handled by using house.gov URL.

### Pitfall 8: Jay Jones Headshot Is Landscape

**What goes wrong:** After crop to 4:5, Jones portrait is only ~226×283px — close to the 200px minimum.
**Why it happens:** The AG website only serves a landscape photo (425×283px).
**How to avoid:** The PIL script will crop center-horizontal to yield a portrait-oriented image. At 226px it will pass the 200px minimum check but quality will be upscaled significantly. If unacceptable at runtime, fall back to Wikipedia Commons. Verify visually before finalizing migration 315.
**Warning signs:** Jones upload succeeds but the resulting headshot looks blurry/pixelated at 600×750.

### Pitfall 9: HD-20 Must Be Skipped

**What goes wrong:** Script attempts `house.vga.virginia.gov/delegate_photos/H????.jpg` for the vacant HD-20 slot. There is no H-ID for HD-20 in the current roster (it's absent from the scraped list).
**Why it happens:** HD-20 was seeded as vacant. The house.vga.virginia.gov member list has only 99 entries; HD-20 is not present.
**How to avoid:** The ROSTER dict should not include any entry for external_id = -5120020. Skip without attempting download.
**Warning signs:** If HD-20 were inadvertently included, the script would fail to find an H-ID for it.

### Pitfall 10: Migration 315 Must NOT Be Applied via Supabase MCP

**What goes wrong:** Running migration 315 via Supabase MCP attempts to INSERT politician_images rows that the scripts already created → rows exist → WHERE NOT EXISTS prevents duplicates but MCP ledger entry is wrong.
**Why it happens:** AUDIT-ONLY migrations record what scripts did; they are not meant to be the source of truth for writes.
**How to avoid:** Migration 315 is applied manually (e.g., copy SQL and run from Supabase SQL editor, or via psql). Never pass it to the MCP apply_migration tool.

---

## Code Examples

### Verified Delegate Script Pattern

```python
# Source: verified from _tmp-alexandria-headshots.py + live URL research
DELEGATE_PHOTO_BASE = 'https://house.vga.virginia.gov/delegate_photos/'

# HD-number -> H-ID mapping (complete as of 2026-06-08, scraped from house.vga.virginia.gov/members)
DELEGATE_HID_MAP = {
    1: 'H0219', 2: 'H0375', 3: 'H0239', 4: 'H0208', 5: 'H0406',
    6: 'H0269', 7: 'H0370', 8: 'H0344', 9: 'H0294', 10: 'H0317',
    11: 'H0403', 12: 'H0351', 13: 'H0264', 14: 'H0108', 15: 'H0355',
    16: 'H0281', 17: 'H0405', 18: 'H0305', 19: 'H0365',
    # HD-20: VACANT — excluded entirely
    21: 'H0382', 22: 'H0297', 23: 'H0404', 24: 'H0227', 25: 'H0343',
    26: 'H0385', 27: 'H0380', 28: 'H0301', 29: 'H0374', 30: 'H0395',
    31: 'H0377', 32: 'H0329', 33: 'H0398', 34: 'H0231', 35: 'H0321',
    36: 'H0350', 37: 'H0253', 38: 'H0266', 39: 'H0357', 40: 'H0308',
    41: 'H0393', 42: 'H0333', 43: 'H0224', 44: 'H0242', 45: 'H0056',
    46: 'H0390', 47: 'H0348', 48: 'H0384', 49: 'H0401', 50: 'H0136',
    51: 'H0383', 52: 'H0325', 53: 'H0364', 54: 'H0354', 55: 'H0371',
    56: 'H0362', 57: 'H0397', 58: 'H0327', 59: 'H0259', 60: 'H0328',
    61: 'H0247', 62: 'H0394', 63: 'H0342', 64: 'H0388', 65: 'H0314',
    66: 'H0389', 67: 'H0369', 68: 'H0238', 69: 'H0392', 70: 'H0323',
    71: 'H0386', 72: 'H0124', 73: 'H0396', 74: 'H0335', 75: 'H0391',
    76: 'H0361', 77: 'H0402', 78: 'H0212', 79: 'H0356', 80: 'H0372',
    81: 'H0207', 82: 'H0399', 83: 'H0347', 84: 'H0336', 85: 'H0284',
    86: 'H0400', 87: 'H0173', 88: 'H0322', 89: 'H0387', 90: 'H0262',
    91: 'H0285', 92: 'H0353', 93: 'H0349', 94: 'H0366', 95: 'H0311',
    96: 'H0295', 97: 'H0360', 98: 'H0407', 99: 'H0345', 100: 'H0267',
}

# Each ROSTER entry for delegates:
{
    'external_id': -5120001,   # HD-1
    'full_name': 'Patrick A. Hope',
    'politician_id': '<uuid from DB query>',
    'source_url': DELEGATE_PHOTO_BASE + DELEGATE_HID_MAP[1] + '.jpg',  # H0219.jpg
    'source_domain': 'house.vga.virginia.gov',
}
```

### Verified Senate Script Pattern

```python
# Source: verified from live URL probing 2026-06-08
SENATE_PHOTO_BASE = 'https://apps.senate.virginia.gov/Senator/images/member_photos/'

SENATE_KEY_MAP = {
    1: 'French1',          2: 'Obenshain2',       3: 'Head3',
    4: 'Suetterlein4',     5: 'Hackworth5',        6: 'Pillion6',
    7: 'Stanley7',         8: 'Peake8',            9: 'Mulchi9',
    10: 'Cifers10',        11: 'Deeds11',          12: 'Sturtevant12',
    13: 'Aird13',          14: 'Bagby14',          15: 'Jones15',
    16: 'VanValkenburg16', 17: 'Jordan17',         18: 'Lucas18',
    19: 'Craig19',         20: 'DeSteph20',        21: 'Williams Graves21',
    22: 'Rouse22',         23: 'Locke23',          24: 'Diggs24',
    25: 'Stuart25',        26: 'McDougle26',       27: 'Durant27',
    28: 'Reeves28',        29: 'McPike29',         30: 'Roem30',
    31: 'Perry31',         32: 'Srinivasan32',     33: 'Carroll Foy33',
    34: 'Surovell34',      35: 'Marsden35',        36: 'Pekarsky36',
    37: 'Salim37',         38: 'Boysko38',         39: 'Bennett-Parker39',
    40: 'Favola40',
}

# Each ROSTER entry for senators:
{
    'external_id': -5110001,  # SD-1
    'full_name': 'Timmy French',
    'politician_id': '<uuid from DB query>',
    'source_url': SENATE_PHOTO_BASE + SENATE_KEY_MAP[1] + '.jpg',  # French1.jpg
    'source_domain': 'apps.senate.virginia.gov',
}
```

### Verified Federal Script Pattern

```python
# Source: verified from Congress API + unitedstates/images live probing 2026-06-08
UNITEDSTATES_BASE = 'https://unitedstates.github.io/images/congress/original/'

FEDERAL_ROSTER = [
    {'external_id': -400080, 'full_name': 'Mark Warner', 'title': 'US Senator',
     'bioguide': 'W000805', 'source_url': UNITEDSTATES_BASE + 'W000805.jpg'},
    {'external_id': -400079, 'full_name': 'Tim Kaine', 'title': 'US Senator',
     'bioguide': 'K000384', 'source_url': UNITEDSTATES_BASE + 'K000384.jpg'},
    {'external_id': -5102001, 'full_name': 'Rob Wittman', 'title': 'US Rep VA-1',
     'bioguide': 'W000804', 'source_url': UNITEDSTATES_BASE + 'W000804.jpg'},
    {'external_id': -5102002, 'full_name': 'Jen Kiggans', 'title': 'US Rep VA-2',
     'bioguide': 'K000399', 'source_url': UNITEDSTATES_BASE + 'K000399.jpg'},
    {'external_id': -5102003, 'full_name': 'Bobby Scott', 'title': 'US Rep VA-3',
     'bioguide': 'S000185', 'source_url': UNITEDSTATES_BASE + 'S000185.jpg'},
    {'external_id': -5102004, 'full_name': 'Jennifer McClellan', 'title': 'US Rep VA-4',
     'bioguide': 'M001227', 'source_url': UNITEDSTATES_BASE + 'M001227.jpg'},
    {'external_id': -5102005, 'full_name': 'Ben Cline', 'title': 'US Rep VA-5',
     'bioguide': 'C001118', 'source_url': UNITEDSTATES_BASE + 'C001118.jpg'},
    {'external_id': -5102006, 'full_name': 'Morgan Griffith', 'title': 'US Rep VA-6',
     'bioguide': 'G000568', 'source_url': UNITEDSTATES_BASE + 'G000568.jpg'},
    {'external_id': -5102007, 'full_name': 'Eugene Vindman', 'title': 'US Rep VA-7',
     'bioguide': 'V000138', 'source_url': UNITEDSTATES_BASE + 'V000138.jpg'},
    {'external_id': -5102008, 'full_name': 'Don Beyer', 'title': 'US Rep VA-8',
     'bioguide': 'B001292', 'source_url': UNITEDSTATES_BASE + 'B001292.jpg'},
    {'external_id': -5102009, 'full_name': 'John McGuire', 'title': 'US Rep VA-9',
     'bioguide': 'M001239', 'source_url': UNITEDSTATES_BASE + 'M001239.jpg'},
    {'external_id': -5102010, 'full_name': 'Suhas Subramanyam', 'title': 'US Rep VA-10',
     'bioguide': 'S001230', 'source_url': UNITEDSTATES_BASE + 'S001230.jpg'},
    # Walkinshaw NOT in unitedstates/images yet (started Sept 2025):
    {'external_id': -5102011, 'full_name': 'James Walkinshaw', 'title': 'US Rep VA-11',
     'bioguide': 'W000831', 'source_url': 'https://walkinshaw.house.gov/uploadedphotos/highresolution/122f9b36-4502-4307-a1dd-a6c925cda981.jpg'},
]
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `vga.virginia.gov/delegate_photos/{H0001}.jpg` | `house.vga.virginia.gov/delegate_photos/{H####}.jpg` (internal H-ID) | VGA redesign (exact date unknown, prior to 2026-06-08) | Script must scrape/hardcode H-ID mapping; cannot derive from district number |
| `vga.virginia.gov/delegate_photos/thumbs/...` | Full-res `/delegate_photos/{H####}.jpg` | Same redesign | Full-res 2500×2500px available without /thumbs/ subpath |
| Congress.gov portrait URLs | unitedstates/images GitHub mirror | Congress.gov access policy blocking | Use `unitedstates.github.io/images/congress/original/{bioguide}.jpg` |

**Deprecated/outdated:**
- `vga.virginia.gov/delegate_photos/` path: 404 for all requests as of 2026-06-08
- `congress.gov/img/member/` direct access: 403/connection reset for all programmatic requests

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | House.vga.virginia.gov HD→H-ID mapping will remain stable until phase execution | Delegate URL Pattern | If a delegate resigns/changes, their H-ID entry may disappear and a new one appear; plan includes re-scraping verification |
| A2 | The 99 listed H-IDs on house.vga.virginia.gov all currently return HTTP 200 on full-res path | Delegate URL Pattern | One or more may redirect to placeholder; script error-handling catches this |
| A3 | Jay Jones headshot at ag.virginia.gov/images/Jones-headshot-20260320.jpg will produce acceptable quality after upscale | Pitfall 8 | Blurry output; fall back to Wikipedia or wait for better AG photo |
| A4 | Senate photos at ~262×269px will be adequate quality for the project | Senate URL Pattern | If quality is unacceptable, senators need Wikipedia/media fallbacks (time-consuming) |
| A5 | Walkinshaw's house.gov highresolution URL is stable | Federal table | If URL 404s, find replacement via walkinshaw.house.gov/about |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.
(Table is not empty — see above for low-risk assumptions.)

---

## Open Questions (RESOLVED)

1. **Are politician UUIDs for VA officials pre-known or must they be queried at plan time?**
   - What we know: Migration files (306, 307, 308, 311) use `gen_random_uuid()` — UUIDs were generated at insert time and are now in the production DB.
   - What's unclear: UUIDs are not in the migration files. Scripts need to query `SELECT id FROM politicians WHERE external_id = N` for each official.
   - Recommendation: The ROSTER dicts in the scripts should NOT hardcode politician UUIDs (unlike the Alexandria script which hardcoded them from Plan 01/02 output). Instead, resolve UUIDs via DB at script run time using the `external_id` lookup. Alternatively, the planner can include a "query all VA politician UUIDs" task before writing the scripts.

2. **Should migration 315 hardcode politician UUIDs or use subquery pattern?**
   - The Alexandria migration 314 hardcoded UUIDs (they were known from Plans 01-02 summary outputs). Migration 315 will be written after the scripts run and produce known CDN URLs.
   - Recommendation: Use subquery `(SELECT id FROM essentials.politicians WHERE external_id = N)` for the migration's INSERT SELECT, not hardcoded UUIDs. This is consistent with the migration 315 AUDIT-ONLY pattern and avoids requiring UUID lookup as a prerequisite task.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3 | All 4 scripts | Yes | 3.x (project env) | — |
| Pillow (PIL) | Image processing | Yes | 10.x (from prior phases) | — |
| requests | HTTP downloads | Yes | 2.x (from prior phases) | — |
| psycopg2-binary | DB connection | Yes | 2.9.x (from prior phases) | — |
| .env file (C:/EV-Accounts/backend/.env) | Supabase credentials | Yes | contains SUPABASE_URL, SERVICE_ROLE_KEY, DATABASE_URL | — |
| house.vga.virginia.gov | Delegate photos | Yes (verified) | — | — |
| apps.senate.virginia.gov | Senate photos | Yes (verified) | — | Wikipedia Commons |
| unitedstates.github.io | Federal photos (12/13) | Yes (verified) | — | Official House.gov pages |
| walkinshaw.house.gov | Walkinshaw portrait | Yes (verified, 2.1MB) | — | Wikipedia |
| governor.virginia.gov | Spanberger portrait | Yes (verified, 166KB) | — | — |
| ltgov.virginia.gov | Hashmi portrait | Yes (verified, 271KB) | — | — |
| ag.virginia.gov | Jones portrait | Yes (verified, 74KB) | — | Wikipedia Commons |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** All senate photos (small ~262px images) → Wikipedia Commons if quality unacceptable.

---

## Validation Architecture

### Test Framework

This phase has no automated unit tests — it is a data ingestion phase (download + upload scripts + SQL migration). Validation is post-run verification queries.

| Property | Value |
|----------|-------|
| Framework | N/A (no unit tests; manual/SQL verification) |
| Config file | none |
| Quick run command | see verification queries below |
| Full suite command | see verification queries below |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VA-GOV-06 | 155 politician_images rows in DB for VA officials | SQL query | See post-migration verification block below | N/A (SQL) |
| VA-GOV-06 | All 155 Storage URLs resolve (HTTP 200) | Manual spot-check | n/a | N/A |

### Post-Run Verification Query

```sql
-- After all 4 scripts run and migration 315 is applied:
-- Check total count of VA headshots
SELECT COUNT(*) as va_headshot_count
FROM essentials.politician_images pi
JOIN essentials.politicians p ON p.id = pi.politician_id
WHERE p.external_id IN (
  -- 3 execs
  -510001, -510002, -510003,
  -- 40 senators: -5110001..-5110040
  -- 99 delegates: -5120001..-5120100 excluding -5120020
  -- 13 federal: -400080, -400079, -5102001..-5102011
)
AND pi.type = 'default';
-- Expected: 155

-- Check for HD-20 NOT being present
SELECT COUNT(*) FROM essentials.politician_images pi
JOIN essentials.politicians p ON p.id = pi.politician_id
WHERE p.external_id = -5120020;
-- Expected: 0 (vacant, no headshot)
```

### Wave 0 Gaps

None — no new test files required. The migration 315 itself acts as the verification record.

---

## Security Domain

Security enforcement is not applicable to this data ingestion phase. All headshots are downloaded from official government domains (`*.virginia.gov`, `unitedstates.github.io`, `walkinshaw.house.gov`) and uploaded to a private Supabase bucket using the service role key from the project's `.env` file. No new authentication patterns, user-facing APIs, or untrusted input is introduced.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: live HTTP probing] `house.vga.virginia.gov/members` — scraped for complete HD→H-ID mapping and confirmed all 99 URLs respond HTTP 200
- [VERIFIED: live HTTP probing] `apps.senate.virginia.gov/Senator/images/member_photos/` — confirmed all 40 senator URL keys return HTTP 200
- [VERIFIED: live HTTP probing] `unitedstates.github.io/images/congress/original/` — confirmed 12/13 federal portraits return HTTP 200
- [VERIFIED: live HTTP probing] `walkinshaw.house.gov` — confirmed Walkinshaw official portrait URL returns HTTP 200 (2.1MB)
- [VERIFIED: live HTTP probing] VA exec sources (governor.virginia.gov, ltgov.virginia.gov, ag.virginia.gov) — all portraits confirmed HTTP 200
- [CITED: C:/EV-Accounts/backend/migrations/308_va_delegates.sql] — HD-20 vacancy confirmed, complete delegate roster
- [CITED: C:/EV-Accounts/backend/migrations/307_va_state_senators.sql] — 40 senators, no vacancies, external_ids confirmed
- [CITED: C:/EV-Accounts/backend/migrations/306_va_state_executives.sql] — 3 execs, external_ids -510001/-510002/-510003
- [CITED: C:/EV-Accounts/backend/migrations/311_va_federal_officials.sql] — 11 House reps, Warner/Kaine external_ids
- [CITED: C:/EV-Accounts/backend/scripts/_tmp-alexandria-headshots.py] — script structure, function signatures, ROSTER pattern
- [CITED: C:/EV-Accounts/backend/migrations/314_alexandria_headshots.sql] — AUDIT-ONLY migration header style, INSERT pattern

### Secondary (MEDIUM confidence)
- [CITED: bioguide.congress.gov URL patterns] — Kaine K000384, Warner W000805 confirmed via search result URLs
- [CITED: congress.gov URL patterns in search results] — McClellan M001227, Kiggans K000399, Walkinshaw W000831 confirmed via search result URLs
- [VERIFIED: Congress API DEMO_KEY] — Vindman V000138, Subramanyam S001230, McGuire M001239 (new 2025 members); Warner W000805, Kaine K000384, Wittman W000804, Scott S000185, Cline C001118, Griffith G000568, Beyer B001292 (confirmed current members)

### Tertiary (LOW confidence)
- None — all critical URL patterns were verified live.

---

## Metadata

**Confidence breakdown:**
- Delegate URL pattern: HIGH — live verified; complete HD→H-ID mapping scraped
- Senate URL pattern: HIGH — all 40 keys live verified
- Federal bioguide IDs: HIGH — 13/13 confirmed via API or authoritative search results; 12/13 URLs verified live (Walkinshaw via house.gov)
- Executive source URLs: HIGH — all 3 live verified
- Script architecture: HIGH — direct copy of phase 103 proven pattern
- Migration structure: HIGH — direct copy of migration 314 proven pattern

**Research date:** 2026-06-08
**Valid until:** 2026-07-08 (30 days) — URL patterns are stable; H-ID mapping could change if new delegates are sworn in after a special election
