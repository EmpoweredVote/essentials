# Banner Asset Pipeline — Operator Runbook

A step-by-step procedure for adding a new section banner (city, state, or federal)
to the Essentials section-banner system. Follow these 8 stages in order.

**Scope:** Any jurisdiction not yet in `buildingImages.js` — a new standalone city,
a new state, or an updated federal image. The ~10 remaining covered states and any
future standalone cities can be onboarded by repeating this procedure without
re-deriving the process.

**Tools required:** Python 3, Pillow (`pip install pillow`), requests (`pip install requests`),
`curl` (system), git.

**Scripts committed at:** `scripts/banners/` —

| script | stage | what it is for |
|---|---|---|
| `commons_sweep.mjs` | 1, sourcing | find candidates on Wikimedia Commons, filtered on width, aspect and licence |
| `certify_banner.py` | 2, certification | render every candidate in the **6:1 desktop band**, measure it, and write one approval sheet |
| `process_banner.py` | 3, treatment | crop and resize the winner to the 1700x540 spec |
| `upload_banner.py` | 4, upload | push the asset to Supabase Storage |

🔴 **Certify in the 6:1 DESKTOP BAND, never on the full frame.** `SectionBanner.jsx`
renders a responsive aspect *pair*: 13/4 on mobile keeps 96.9% of the asset, but 6/1 at
`md`+ keeps only **52.4%** — rows 128–411 of 540. A banner approved on the full frame was
approved on a picture desktop visitors never see, which is exactly how the Bend banner
shipped broken. `certify_banner.py` exists to make that band the thing you look at.

---

## Stage 1 — Sourcing

Find a **real, wide-format, licensed** photo of the target jurisdiction. AI image
generation is intentionally **NOT** part of this pipeline (see note below).

### Where to search

- **Wikimedia Commons** (`commons.wikimedia.org`) — preferred; perpetual free license,
  attribution easy to verify. Use `scripts/banners/commons_sweep.mjs` rather than the
  website search, because it filters on width, aspect and licence and can hand its
  results straight to `certify_banner.py`.

  🔴 **DO NOT GUESS CATEGORY NAMES, AND DO NOT WALK THE CITY TREE.** Both fail, and both
  have cost real time: seven guessed Charlotte category names returned **0 files**
  (`Category:Skylines of Charlotte, North Carolina` and friends do not exist), and a
  recursive walk of `Category:Charlotte, North Carolina` to depth 3 drifted into US-74
  **highway photography** without surfacing a single skyline. The real category was
  `Category:Charlotte skylines` — plural. The Bend original was likewise missed by
  keyword search, by three plausible categories, and by the Wikipedia article images.

  ▶ **The method that works: find ONE good file, then ask that file which categories it
  belongs to, then sweep those.**

  ```bash
  # 1. find one good file
  node scripts/banners/commons_sweep.mjs --search "Charlotte North Carolina skyline"

  # 2. ask IT where it lives  (> marks the subject categories)
  node scripts/banners/commons_sweep.mjs --categories-of "File:Charlotte Skyline - panoramio (1).jpg"

  # 3. sweep the real category, and write a candidates file for certification
  node scripts/banners/commons_sweep.mjs --category "Category:Charlotte skylines"       --json /tmp/charlotte-candidates.json
  ```
- **Unsplash** (`unsplash.com`) — free for commercial/editorial use (Unsplash License);
  check individual photo terms. Search: city name + "skyline" or "cityscape".

### Photo requirements

| Requirement | Notes |
|-------------|-------|
| Landscape orientation | Portrait shots cannot be cropped to 3.15:1 without severe quality loss |
| Wide angle / panoramic | The banner renders at ~3:1 aspect — a tight crop will not work |
| Min ~1700 px wide | Native resolution at or above the 1700 px target is preferred |
| Daytime, well-lit | Consistent with the 50 live state panoramas (no night shots) |
| Usable license | CC BY, CC BY-SA, CC0, Public Domain, or Unsplash License — record it |

### Framing guidance for standalone cities

Subject should be **the city** — downtown skyline, waterfront, or a landmark square.
For cities with a university (e.g. Bloomington/IU), use a view where the city or
downtown is the subject and the campus is only the foreground or framing, not the
primary subject.

### Note on AI image generation

**AI image generation is NOT part of this pipeline (D-09, intentional divergence).**
The ASST-01 requirement text mentions "AI fallback" but that option was explicitly
dropped. Rationale:

- Real licensed photos are strictly better for civic legitimacy.
- An AI-fabricated cityscape risks inventing landmarks or misrepresenting a community.
- Every covered jurisdiction already has a real-photo option available.

This is a documented intentional divergence from the ASST-01 requirement text, not a
gap. A verifier reading the absence of AI tooling should treat it as expected.

The graceful fallback for jurisdictions without a banner photo is the tier-gradient
CSS fallback built into `SectionBanner.jsx` (`onError` handler). No AI intermediate.

---

## Stage 1b — Certification

Before treating anything, render every candidate in the band an operator will actually
see and look at them side by side. `certify_banner.py` writes one self-contained HTML
sheet: the proposal at full asset size **and** in the 6:1 band, the live banners it has to
sit beside, and every refusal with its measured reason.

```bash
python scripts/banners/certify_banner.py   --candidates /tmp/charlotte-candidates.json   --title "Charlotte - cities/charlotte.jpg"   --baseline states/NC.jpg   --baseline cities/asheville.jpg   --baseline cities/durham.jpg   --sheet /tmp/charlotte-certification.html
```

It measures the things neither a licence check nor an aspect check can catch:

| measurement | why it exists |
|---|---|
| channel spread | **Greyscale detector.** Milledgeville's two widest and most permissively licensed candidates — federal HABS work, public domain — measured 100% greyscale. |
| band luminance | too dark to read a title over, or blown flat |
| anchor travel | whether `--vertical-anchor` is even a lever on this source (see Stage 3) |
| upscale factor | whether the asset carries real pixels or interpolated ones |

🔴 **Pass `--baseline` for every banner that can appear on the same page.** Adjacency lives
in the **composition** — camera height, subject scale, what fills the frame — never in the
subject noun, so the live bands have to sit beside the candidate to be judged. The rule of
thumb "the state banner is a skyline, so the city must not be" gave the *wrong* answer on
Asheville and inverted the ranking of four candidates. A later city in the same state has
fewer compositions left than an earlier one: Durham was the first to clear two, and
Charlotte needed a fourth distinct North Carolina framing.

---

## Stage 2 — Treatment

**Do NOT pre-darken the source image.** `SectionBanner.jsx` applies its own mandatory
dark gradient overlay (`IMAGE_OVERLAY_GRADIENT`) at render time. All 50 live state
panoramas in production Storage are untreated — the component handles the overlay.

Pre-darkening the JPEG would cause double-darkening compared to the live banner set
and break visual consistency.

The `--overlay` flag in `process_banner.py` is available if you need to bake the
gradient in for a specific source (e.g. an unusually bright image that needs extra
legibility), but it is **off by default** for this reason.

---

## Stage 3 — Optimize

Run `process_banner.py` to crop, resize, and optimize the source photo to the banner
spec:

```bash
# From a local file
python scripts/banners/process_banner.py \
  --input /path/to/source-photo.jpg \
  --output /tmp/bloomington.jpg

# OR download directly from a URL (uses descriptive EmpoweredVote/1.0 User-Agent)
python scripts/banners/process_banner.py \
  --url "https://upload.wikimedia.org/wikipedia/commons/..." \
  --output /tmp/bloomington.jpg

# Lift skyline/landmarks toward the top third by trimming sky (see --vertical-anchor below)
python scripts/banners/process_banner.py \
  --input /path/to/source-photo.jpg \
  --output /tmp/bloomington.jpg \
  --vertical-anchor 0.85
```

The script will:
1. Crop the source to the 3.15:1 banner aspect ratio (no distortion/stretching).
2. Resize to **1700 x 540 px** using LANCZOS resampling.
3. Save as JPEG quality 90, optimize=True.
4. Print the output dimensions and file size (expect ~100–300 KB for a well-compressed source).

**Framing tip — `--vertical-anchor`** (default `0.5`): when the source is taller than the
banner, this controls which horizontal band is kept — `0.0` keeps the top, `0.5` centers,
`1.0` keeps the bottom. Raise it to trim sky and lift a skyline, flag, or dome toward the
top third. The Bloomington exemplar shipped at `--vertical-anchor 0.85`. Preview the output
before uploading and adjust as needed.

🔴 **THE ANCHOR CANNOT CHOOSE THE BAND ON A SOURCE NARROWER THAN 3.148:1 — use
`--crop-width` instead.** A full-width crop of such a source leaves almost no vertical
slack, so the anchor has nothing to travel through and the subject stays wherever it fell.
`process_banner.py` now prints the slack and warns when it is under about a third of the
283px desktop window:

```
Vertical slack: 105 source rows (~46px of the 540 asset).
  WARNING: THAT IS TOO LITTLE FOR THE ANCHOR TO CHOOSE THE BAND (46px against a 283px
  desktop window). Pass --crop-width to narrow the source instead.
```

Narrowing the source is **lossless while the result is still wider than 1700px**, and it
buys back framing freedom: `cities/charlotte.jpg` went from 105 rows of slack at its full
3881px width to 385 rows at `--crop-width 3000`, and still shipped as a 0.57x downscale.
`states/CA.jpg` needed the same correction — its subject sat above the desktop window and a
*wider* crop could not have rescued it. `--horizontal-anchor` says where the narrower
window sits (`0.0` left, `0.5` centre, `1.0` right).

**Target spec** (measured from live production assets):

| Dimension | 1700 x 540 px |
|-----------|---------------|
| Aspect    | ~3.15:1 ultra-wide landscape |
| Format    | JPEG |
| Quality   | 90 |
| Size      | ~100–300 KB |

---

## Stage 4 — Upload

Export the Supabase service-role key and run `upload_banner.py`.

The key is in the EV-Accounts backend env file. In a code fence for path safety:

```bash
# 1. Export the service-role key from the EV-Accounts env file
#    (path uses forward slashes to avoid Tailwind build hazards):
#    C:/EV-Accounts/backend/.env
#    Look for the line: SUPABASE_SERVICE_ROLE_KEY=<long-jwt>
export SUPABASE_SERVICE_ROLE_KEY=<paste-key-here>

# 2. Upload (example: a standalone city)
python scripts/banners/upload_banner.py \
  --file /tmp/bloomington.jpg \
  --dest cities/bloomington.jpg

# Example: a state banner
python scripts/banners/upload_banner.py \
  --file /tmp/nevada.jpg \
  --dest states/NV.jpg
```

On success the script prints the public CDN URL. On failure it prints the Storage
error and exits 1.

The key is **never hardcoded** in the script and is **never printed** in output —
all uploads use the environment variable only.

---

## Stage 5 — Path Conventions

All banner assets live in the `politician_photos` Storage bucket:

```
https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/
```

Four path schemes are in use. Use the scheme matching the jurisdiction tier:

| Tier | Path scheme | Example |
|------|-------------|---------|
| State | `states/<ABBR>.jpg` | `states/NV.jpg` |
| Federal | `national/<name>.jpg` | `national/us-capitol-banner.jpg` |
| LA County cities | `la_county/building_photos/<geoid>.jpg` | `la_county/building_photos/0644000.jpg` |
| Standalone cities | `cities/<slug>.jpg` | `cities/bloomington.jpg` (D-05) |

**Standalone-city slug rules (D-05):**
- Lowercase the `CURATED_LOCAL` key in `buildingImages.js`.
- Replace spaces with `-` (e.g. `"los angeles"` → `cities/los-angeles.jpg`).
- Must match the key used in the `CURATED_LOCAL` wiring step below.

---

## Stage 6 — Wiring

Open `src/lib/buildingImages.js` and wire the new asset.

### Standalone city (add to `CURATED_LOCAL`)

```javascript
const CURATED_LOCAL = {
  // existing entries ...
  bloomington: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bloomington.jpg',
};
```

The `getBuildingImages()` function already matches cities by substring (`city.includes(key)`)
and returns the URL as-is to `SectionBanner`. No other code changes needed for a city.

### State (add abbreviation to `STATE_PANORAMAS`)

```javascript
const STATE_PANORAMAS = new Set([
  // existing abbrevs ...
  'NV', // add the new state
]);
```

The `STATE_PANORAMA_BASE` constant constructs the full URL automatically:
`https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/states/<ABBR>.jpg`

---

## Stage 7 — Attribution

Add an attribution comment in `buildingImages.js` immediately above the relevant
constant. Follow the existing `// <KEY> - Title | Author | License` convention.

**For standalone cities** — add near `CURATED_LOCAL`:

```javascript
// Curated standalone-city banners - title | author | license:
//   bloomington - Bloomington, Indiana from Sample Gates | Author Name | CC BY-SA 4.0
```

**For state panoramas** — add to the existing attribution block above `STATE_PANORAMA_BASE`
(lines 95–145 of `buildingImages.js`):

```javascript
//   NV - Las Vegas Strip (daytime) | Author Name | CC BY 2.0
```

Attribution fields:
- **KEY** — the state abbreviation or city slug (matches the Storage path / CURATED_LOCAL key).
- **Title** — the Wikimedia Commons file title or Unsplash photo title.
- **Author** — photographer name as listed on the source page.
- **License** — exact license name (CC BY 2.0, CC BY-SA 4.0, CC0, Public Domain, Unsplash License, etc.).

---

## Stage 8 — Verify Live

Browse the jurisdiction in the live app and confirm the banner renders (not the
gradient fallback).

**Standalone city (e.g. Bloomington):**

```
https://essentials.empowered.vote/results?browse_geo_id=1805765&browse_mtfcc=G4110
```

Replace `browse_geo_id` and `browse_mtfcc` with the correct Census GEOID and MTFCC for the target city.

**State officials:**

```
https://essentials.empowered.vote/results?browse_state_officials=IN
```

**What to check:**
1. The State section banner shows a wide photographic panorama (not a plain gradient).
2. The Local section banner shows the city photo (not a gradient).
3. No JavaScript console errors related to banner image loading.
4. The `onError` fallback is NOT triggering (meaning the Storage URL is reachable).

If the banner shows the gradient fallback, check:
- The Storage path in `CURATED_LOCAL` or `STATE_PANORAMAS` matches the exact uploaded path.
- The `politician_photos` bucket has public read access (it should — no change needed).
- The CDN URL was printed correctly by `upload_banner.py` and matches what you pasted into `buildingImages.js`.
