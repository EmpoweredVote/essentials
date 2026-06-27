# Phase 171: Banner Asset Pipeline & Exemplar Art - Pattern Map

**Mapped:** 2026-06-27
**Files analyzed:** 5 (2 created, 2 modified, 1 read-only reference)
**Analogs found:** 4 / 5 (1 has no direct analog — see "No Analog Found")

This phase has **no RESEARCH.md** (workflow proven in Phase 170). File list extracted from
`171-CONTEXT.md` `<decisions>` (D-01..D-09) and `<canonical_refs>`.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/buildingImages.js` (modify) | config / location→art map | transform (lookup) | self (existing `STATE_PANORAMAS` + `FEDERAL_IMAGE` entries) | exact (in-file precedent) |
| `scripts/banners/<source-process>.py` (create) | utility (PIL image processing) | file-I/O + transform | `scripts/batch_wiki_photos.py` | role-match (headshot, not banner) |
| `scripts/banners/<upload>.py` (create, or merged) | utility (Storage upload) | file-I/O + request-response | `scripts/upload_wiki_photos.py` | role-match (headshot, not banner) |
| `docs/banner-asset-pipeline.md` (create) | doc (procedure) | n/a | none (no procedure docs exist) | no analog — see below |
| `public/images/state-capitols/*.jpg`, `bloomington-city-hall.jpg`, generic SVGs (delete) | asset cleanup | n/a | reachability traced below | exact (verified dead) |
| `src/components/SectionBanner.jsx` (READ-ONLY) | component | request-response | locked in 170 — DO NOT MODIFY | n/a |

---

## Ground-Truth Findings (planner: these resolve the open D-* questions)

### Banner dimensions (resolves D-92 "confirm panorama dims and reuse" + Bloomington target)
Live assets fetched from production Storage and measured with PIL:

| Live asset | Pixels | Aspect | Size |
|------------|--------|--------|------|
| `states/CA.jpg` | **1700 × 540** | 3.15:1 | 294 KB |
| `national/us-capitol-banner.jpg` | **1700 × 560** | 3.04:1 | 140 KB |
| `la_county/building_photos/0644000-skyline.jpg` (LA skyline) | **1600 × 520** | 3.08:1 | 111 KB |

**De facto banner convention: ~1700 × 540, ultra-wide ~3:1, JPEG q~85-90, ~100-300 KB.**
The Bloomington exemplar (D-01/D-02) must match this — target **1700 × 540** to sit in the
same panoramic family as the 50 state banners.

> NOTE: the OLD `public/images/state-capitols/*.jpg` files are NOT the live banners — they are
> the superseded portrait/varied-aspect capitol photos (e.g. `california.jpg` is 618×800 portrait,
> `indiana.jpg` 800×562). They are the assets D-04 deletes. Do not measure them for target dims.

The consumer `SectionBanner.jsx` renders into a full-bleed band `h-[120px] md:h-[180px]`
(`src/components/SectionBanner.jsx:56`) with `objectFit: 'cover'` (line 71) — so the source
just needs to be wide and high-res; the component crops. The component also applies its own
mandatory dark overlay at render (`IMAGE_OVERLAY_GRADIENT`, line 33-34). See "Dark-overlay
treatment" below for whether to ALSO bake overlay into the source.

### Dead-code reachability (resolves D-04 — VERIFIED, with one important caveat)
Set-difference computed over both maps (all 50 abbrevs):

- `STATE_PANORAMAS` (line 148-153) **fully covers all 50 `STATE_CAPITOLS` keys** — the diff is
  empty in both directions. Therefore in `getBuildingImages` the `else if (STATE_CAPITOLS[abbrev])`
  branch (`buildingImages.js:178-179`) building `/images/state-capitols/${stem}.jpg` is
  **provably unreachable** — every valid abbrev satisfies `STATE_PANORAMAS.has(abbrev)` first
  (line 176). SAFE TO DELETE the `else if` branch + the 50 `public/images/state-capitols/*.jpg`.

- `FALLBACK_LOCAL` (line 89) and `FALLBACK_STATE` (line 90) are **declared but never referenced**
  anywhere (grep confirms zero reads). **SAFE TO DELETE both constants** + their SVGs
  `public/images/city-hall-generic.svg`, `public/images/state-capitol-generic.svg`.

- ⚠️ **`STATE_CAPITOLS` the object itself is NOT removable.** Although its *image-path use* is
  dead, the object is still the data source for two live consumers:
  - `STATE_NAME_TO_ABBREV` (line 63-64) — used by `parseCityFromAddress` (line 230) and
    `parseStateFromAddress` (line 257).
  - `VALID_STATE_ABBREVS` (line 197) — used by both parsers (lines 220, 244, 249).

  **Planner: keep the `STATE_CAPITOLS` object; delete only the dead `else if` branch and the two
  `FALLBACK_*` constants.** Consider renaming/recommenting `STATE_CAPITOLS` (its stems are now
  used only for name↔abbrev derivation, not capitol images) but that is optional polish.

- All deletable public-asset references are confined to `buildingImages.js` (grep across
  `src/ public/ index.html`). No other consumer breaks.

> Adjacent orphans (out of D-04 scope, FYI only): `public/images/us-capitol.{jpg,svg}`,
> `la-city-hall.{jpg,svg}`, `indiana-state-house.jpg`, `indiana-state-capitol.svg`,
> `california-state-capitol.{jpg,svg}`, `bloomington-city-hall.svg` also have zero code refs.
> D-04 only names the state-capitols set, the bloomington jpg, and the two generic SVGs — stay in
> scope unless the planner explicitly widens it.

### Storage path schemes in use (resolves D-05 — new standalone-city prefix)
Enumerated from `buildingImages.js`:

| Tier | Scheme | Example |
|------|--------|---------|
| State | `states/<ABBR>.jpg` | `states/CA.jpg` (`STATE_PANORAMA_BASE` + abbrev, line 146-147, 177) |
| Federal | `national/<name>.jpg` | `national/us-capitol-banner.jpg` (`FEDERAL_IMAGE`, line 72) |
| LA-county city | `la_county/building_photos/<geoid>.jpg` | `la_county/building_photos/0644000-skyline.jpg` (line 76) |

All under the same bucket base
`https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/`.

**Recommended standalone-city prefix (D-05, planner discretion): `cities/<slug>.jpg`** — e.g.
`cities/bloomington.jpg`. Consistent with the lowercase, tier-grouped existing schemes; the slug
matches the existing `CURATED_LOCAL` key style (`bloomington`, `los angeles` → slugify spaces to
`-`). Record this in `docs/banner-asset-pipeline.md`.

---

## Pattern Assignments

### `src/lib/buildingImages.js` (config, transform) — MODIFY

**Analog:** self — the existing `FEDERAL_IMAGE` / `STATE_PANORAMA_BASE` / LA-county entries are the
precedent for the Bloomington rewrite and the attribution-comment convention.

**1. Bloomington rewire (D-01) — copy the LA-county Storage-URL pattern.**
Current (line 75): `bloomington: '/images/bloomington-city-hall.jpg',` (local path — replace).
Mirror the sibling LA entries (lines 76-86), which are full Storage URLs:
```javascript
'los angeles': 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0644000-skyline.jpg',
```
New Bloomington value (using the D-05 `cities/` prefix):
```javascript
bloomington: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bloomington.jpg',
```
The lookup logic (`getBuildingImages`, lines 161-187) needs **no change** — `CURATED_LOCAL` is
matched by `city.includes(key)` (line 167) and returns the URL as-is; `SectionBanner` consumes it.

**2. Attribution comment convention (mirror for Bloomington).**
The established format is an inline block above the panorama set
(`buildingImages.js:95-145`), one line per asset:
```javascript
// Attribution (all Wikimedia Commons) - title | author | license:
//   CA - Golden Gate Bridge and San Francisco | Brocken Inaglory | CC BY-SA 4.0
//   IN - Downtown Indianapolis skyline | Momoneymoproblemz | CC BY-SA 4.0
```
Format = `// <KEY> - <Image Title> | <Author> | <License>`. Add a Bloomington line in the same
style, near `CURATED_LOCAL` (the LA-county entries currently have NO attribution comments — D-01's
procedure should establish the comment for new curated city art). Example:
```javascript
// Curated standalone-city banners - title | author | license:
//   bloomington - <real Wikimedia/Unsplash title> | <author> | <license>
```

**3. Dead-code removal (D-04) — delete ONLY:**
- The `else if (STATE_CAPITOLS[abbrev]) { stateImage = ... }` branch, lines 178-180.
- `const FALLBACK_LOCAL = ...` line 89 and `const FALLBACK_STATE = ...` line 90.
- KEEP `STATE_CAPITOLS` object (lines 9-60) — still feeds `STATE_NAME_TO_ABBREV` +
  `VALID_STATE_ABBREVS`. Update the file's top doc-comment (lines 1-6) which still says
  "State: real capitol building per state, fallback to generic SVG" — no longer true.

---

### `scripts/banners/<process>.py` (utility, file-I/O + transform) — CREATE

**Analog:** `scripts/batch_wiki_photos.py` (source → PIL → save).

**Imports + PIL setup pattern** (`batch_wiki_photos.py:5-11`):
```python
import requests, json, pickle, os, time
from PIL import Image
from io import BytesIO

TEMP = os.environ.get('TEMP', '/tmp')
OUT_DIR = os.path.join(TEMP, 'ma_wiki_legislators')
os.makedirs(OUT_DIR, exist_ok=True)
```

**Wikimedia fetch with required descriptive User-Agent** (`batch_wiki_photos.py:61`, also
memory `project_phase159_complete` — Wikimedia 429s on browser UA, needs descriptive UA):
```python
HEADERS = {'User-Agent': 'EmpoweredVote/1.0 (info@empowered.vote)'}
```

**PIL crop + resize + save pattern** to ADAPT (`batch_wiki_photos.py:141-176, 218`). The analog
crops to 4:5 portrait at 600×750 for headshots — the banner script must instead crop to the
**~3:1 landscape at 1700×540** found above (crop to target ratio, then `resize(..., Image.LANCZOS)`,
then `save(out, 'JPEG', quality=90)`):
```python
img = Image.open(BytesIO(img_bytes)).convert('RGB')
# ... crop to target ratio (banner: 1700/540 ≈ 3.15) instead of 4/5 ...
img = img.resize((1700, 540), Image.LANCZOS)
img.save(out_path, 'JPEG', quality=90)
```
The 600×750 + headspace-detection logic (`check_headspace`, lines 104-133) is headshot-specific —
**do NOT carry it over** to banners.

**Dark-overlay treatment (D-01, procedure must cover).** No existing PIL overlay code in the repo
(170 applied overlay only at render via the component). Two valid approaches — planner picks one
and documents it:
- (a) Rely on `SectionBanner`'s render-time `IMAGE_OVERLAY_GRADIENT`
  (`SectionBanner.jsx:33-34`) and DON'T bake into source (simplest; matches how the 50 live
  panoramas work — they are NOT pre-darkened).
- (b) Optionally bake a bottom-up dark gradient into the JPEG with PIL
  (`Image.alpha_composite` / a generated `linear` alpha mask) for extra legibility.
- **Recommendation: (a)** — match the existing 50 panoramas (the component already guarantees the
  overlay; double-darkening would diverge from the live set). The script's "overlay" step can be a
  documented no-op/optional flag.

---

### `scripts/banners/<upload>.py` (utility, file-I/O + request-response) — CREATE (or merge into above)

**Analog:** `scripts/upload_wiki_photos.py` (curl POST to Storage).

**Service-role key from env (D-08 — never hardcode)** (`upload_wiki_photos.py:5-11`):
```python
SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
BUCKET_BASE = "https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object"
if not SERVICE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set")
    exit(1)
```
Operator points this at `C:/EV-Accounts/backend/.env` (memory `project_phase170_complete`:
prod upload uses the service-role key there). **D-08 hazard: in the doc, keep that Windows path in a
code fence / use forward slashes** — raw `C:\...` backslashes crash the Tailwind v4 prod build
(memory `feedback_tailwind_scans_planning_md`).

**Upload-via-curl pattern to ADAPT** (`upload_wiki_photos.py:30-44`). The analog uploads to
`politician_photos/<pid>-headshot.jpg`; the banner script targets the D-05 city path
`politician_photos/cities/<slug>.jpg` (and could be parameterized for `states/`, `national/`,
`la_county/...`). Use POST for new, **`-X PUT` for overwrite/re-source** (D-01 replaces, so prefer
PUT or POST-then-upsert; the analog only POSTs new keys):
```python
filename = f"cities/{slug}.jpg"            # was f"{pid}-headshot.jpg"
upload_url = f"{BUCKET_BASE}/politician_photos/{filename}"
result = subprocess.run([
    'curl', '-s', '-X', 'POST', upload_url,   # use PUT to overwrite existing
    '-H', f'Authorization: Bearer {SERVICE_KEY}',
    '-H', 'Content-Type: image/jpeg',
    '--data-binary', f'@{local_file}'
], capture_output=True, text=True, timeout=30)
```
The success check (`'Key' in resp or 'Id' in resp`, line 42) is the right pattern to reuse.

> Note: the `gsd-executor` has NO Supabase MCP / DB access (memory `project_v170_complete`,
> `project_phase160_complete`) — uploads run via this curl-to-Storage script with the env key, not
> via MCP. The script is the canonical mechanism.

---

### `docs/banner-asset-pipeline.md` (doc, procedure) — CREATE

**Analog:** NONE — no procedure/runbook docs exist under `docs/` (only `docs/adr/` and
`docs/superpowers/`). Planner writes this fresh, structured as an operator runbook (per
`<specifics>`: "write it for an operator repeating the task, not as prose").

**Must cover end-to-end (D-06, D-07, and the `<decisions>` checklist):**
1. **Source** a real licensed photo (Wikimedia Commons / Unsplash) — wide cityscape; for cities,
   the city-as-subject framing (D-02). NO AI (D-09 — explicitly dropped).
2. **PIL optimize** → crop to ~3:1, resize to **1700×540** LANCZOS, JPEG q90 (the dims found above;
   17MB→~2MB precedent in 170 summary line 54).
3. **Dark-overlay** decision (recommend: rely on component overlay; document it).
4. **Upload** to Storage via the `scripts/banners/` script reading `SUPABASE_SERVICE_ROLE_KEY` from
   env (operator sources `C:/EV-Accounts/backend/.env`). Keep that path in a code fence (D-08).
5. **Path conventions** — `states/<ABBR>.jpg`, `national/<name>.jpg`,
   `la_county/building_photos/<geoid>.jpg`, and the new **`cities/<slug>.jpg`** (D-05).
6. **Wire** `buildingImages.js` (`CURATED_LOCAL[slug]` = full Storage URL; or add to
   `STATE_PANORAMAS` for a state).
7. **Attribution** — add the `// <KEY> - Title | Author | License` comment (the
   `buildingImages.js:95-145` convention).
8. **Verify live** — browse link
   `essentials.empowered.vote/results?...` for the address; confirm banner renders (not the
   gradient fallback). (memory `feedback_provide_city_browse_links`.)

**Tailwind hazard reminder for whoever writes the doc:** `docs/` is NOT under `.planning/` but
Tailwind v4 also scans root docs — keep every `C:\...` path in code fences / forward slashes
(D-08, memory `feedback_tailwind_scans_planning_md`).

---

## Shared Patterns

### Wikimedia source + descriptive User-Agent
**Source:** `scripts/batch_wiki_photos.py:61`; reinforced by memory `project_phase159_complete`.
**Apply to:** the `scripts/banners/` source step + the doc.
```python
HEADERS = {'User-Agent': 'EmpoweredVote/1.0 (info@empowered.vote)'}
```

### PIL optimize → JPEG q90
**Source:** `scripts/batch_wiki_photos.py:175-176` (resize LANCZOS + `save('JPEG', quality=90)`).
**Apply to:** banner processing — but target landscape **1700×540**, not the headshot 600×750.

### Service-role key from env, never hardcoded
**Source:** `scripts/upload_wiki_photos.py:5-11`.
**Apply to:** the banner upload script + documented in the procedure (D-08).
```python
SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
if not SERVICE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set"); exit(1)
```

### Storage upload via curl --data-binary
**Source:** `scripts/upload_wiki_photos.py:30-44`.
**Apply to:** banner upload (swap path to `cities/<slug>.jpg`; PUT to overwrite).

### Attribution as inline comment
**Source:** `src/lib/buildingImages.js:95-145`.
**Apply to:** every new curated asset (`// <KEY> - Title | Author | License`).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `docs/banner-asset-pipeline.md` | doc | n/a | No procedure/runbook docs exist (`docs/` has only `adr/`, `superpowers/`). Write fresh as an operator runbook. |
| Banner-specific PIL processing (3:1 landscape + optional overlay) | utility logic | transform | All existing PIL scripts are headshot 4:5/600×750 with face/headspace detection. The 170 banner resize was done ad hoc (no committed script). The new script formalizes it — adapt the headshot scripts' I/O scaffolding but replace the crop/resize math. |

---

## Metadata

**Analog search scope:** `src/lib/`, `src/components/`, `src/pages/`, `scripts/`, `public/images/`,
`docs/`, `C:/EV-Accounts/backend/scripts/`.
**Files scanned / measured:** `buildingImages.js`, `SectionBanner.jsx`, `Results.jsx`,
`batch_wiki_photos.py`, `upload_wiki_photos.py`, `reprocess_squares.py`; live Storage assets
`states/CA.jpg`, `national/us-capitol-banner.jpg`, `la_county/.../0644000-skyline.jpg`;
local `state-capitols/{california,indiana,texas}.jpg`.
**Reachability verification:** set-difference STATE_PANORAMAS vs STATE_CAPITOLS (empty both ways);
grep of FALLBACK_*/STATE_CAPITOLS/asset-path references across `src public index.html`.
**Pattern extraction date:** 2026-06-27
