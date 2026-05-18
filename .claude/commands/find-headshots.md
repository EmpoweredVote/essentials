---
name: find-headshots
description: Find and import headshot photos for politicians who are missing one
argument-hint: [politician name or number of candidates to process]
allowed-tools:
  - mcp__supabase-local__execute_sql
  - WebSearch
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_take_screenshot
  - mcp__playwright__browser_click
  - mcp__playwright__browser_close
  - Bash
  - AskUserQuestion
---

<objective>
Find flattering, freely-usable headshot photos for politicians and election candidates in the database who currently have no image, then import them into Supabase with user approval for each photo.

Supports two types of subjects:
- **Politicians** — have a `politicians` record with `politician_id`; image attaches directly
- **Candidates** — exist only in `race_candidates` with no linked `politician_id`; a minimal politician record is created first, then the image is attached and the race_candidate is linked
</objective>

<context>
- Supabase project: `kxsdzaojfaibhuzmclfq`
- Storage bucket: `politician_photos`
- CDN base: `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/`
- Table: `essentials.politician_images` — columns: `id`, `politician_id`, `url`, `type`, `photo_license`
- `politicians.photo_origin_url` — source page where the photo was found
</context>

<process>

<step name="fetch_candidates">
Query for both politicians and election candidates who have no image.

**Query A — politicians without images:**

```sql
SELECT p.id AS politician_id, p.full_name, p.first_name, p.last_name,
       p.urls, p.photo_origin_url,
       o.title AS role, o.representing_state, o.representing_city,
       'politician' AS subject_type,
       NULL AS race_candidate_id, NULL AS position_name, NULL AS election_name
FROM essentials.politicians p
LEFT JOIN essentials.offices o ON o.id = p.office_id
LEFT JOIN essentials.politician_images pi ON pi.politician_id = p.id
WHERE pi.id IS NULL
  AND p.photo_origin_url IS NULL
  AND p.is_active = true
  AND p.is_vacant = false
[NAME_FILTER]
ORDER BY p.full_name
LIMIT [N];
```

**Query B — election candidates without a linked politician record:**

```sql
SELECT NULL AS politician_id, rc.full_name, rc.first_name, rc.last_name,
       NULL AS urls, NULL AS photo_origin_url,
       r.position_name AS role, e.name AS election_name,
       'candidate' AS subject_type,
       rc.id AS race_candidate_id, r.position_name, e.name AS election_name
FROM essentials.race_candidates rc
JOIN essentials.races r ON r.id = rc.race_id
JOIN essentials.elections e ON e.id = r.election_id
LEFT JOIN essentials.politicians p ON p.id = rc.politician_id
LEFT JOIN essentials.politician_images pi ON pi.politician_id = rc.politician_id
WHERE rc.politician_id IS NULL
  AND rc.candidate_status = 'active'
[NAME_FILTER]
ORDER BY rc.full_name
LIMIT [N];
```

Run both queries. If a specific name was given as the argument, apply a name filter to both (`AND full_name ILIKE '%[name]%'`). Otherwise default to 5 from each, deduplicating by name.

If no subjects found in either query, report "All active politicians and candidates already have images on file." and stop.

Display the combined list, marking type:
```
Found [N] people without headshots:
  1. [Full Name] — [Role], [Election/State]  (politician)
  2. [Full Name] — [Position], [Election]     (candidate — no record yet)
```
</step>

<step name="process_each_candidate">
For each candidate, run the full search → review → import flow described in the following steps.

Process one candidate at a time so the user can approve before moving to the next.
</step>

<step name="search_for_image">
For the current subject, search the web to find their official photo or a high-quality press headshot.

**Search strategy (try in order):**

1. **Their URLs from DB** — if `urls` is populated, start there (campaign site or official government bio)
2. **Web search:**
   - For politicians: `"[full_name]" "[office_title]" "[city/state]" official photo site:*.gov OR site:*.org OR wikipedia`
   - For candidates: `"[full_name]" "[position_name]" "[election_name]" candidate headshot OR photo OR ballotpedia`
3. **Wikipedia** — `"[full_name]" politician wikipedia headshot`
4. **Ballotpedia** — `"[full_name]" site:ballotpedia.org`
5. **Campaign site** — search for their official campaign website if not already in `urls`

Pick the 2–3 most promising URLs from search results and navigate to each with Playwright.
</step>

<step name="extract_image_url">
For each page visited with Playwright:

1. Navigate to the page: `mcp__playwright__browser_navigate`
2. Take a snapshot: `mcp__playwright__browser_snapshot`
3. Look for:
   - `<img>` tags in bio/about sections, sidebars, or infoboxes
   - Portrait-oriented images (taller than wide)
   - Images near the person's name, title, or bio text
   - Wikipedia: the lead image in the infobox
   - Ballotpedia: the profile photo at top
   - Government bio pages: photo near the name/title header

Extract the `src` attribute of the best candidate image. Resolve relative URLs to absolute using the page's base URL.

**Disqualify images that are:**
- Logos, icons, or seals
- Group photos or crowd shots
- Thumbnails under 100px
- Generic silhouettes or placeholder avatars

If the page is JS-heavy and no images load, wait briefly and re-snapshot.
</step>

<step name="determine_license">
Assess license based on source:
- `.gov` official bio page → `"press_use"` (government works are public domain)
- Wikipedia infobox image → check the filename; if it ends in common CC patterns or file page says CC BY-SA → `"cc_by_sa"`. Default Wikipedia photos to `"cc_by_sa"` unless clearly stated otherwise.
- Ballotpedia → `"press_use"` (Ballotpedia uses CC BY-SA)
- Campaign site (`*.com`) → `"press_use"` (standard press kit usage)
- Unclear → `"unknown"`
</step>

<step name="present_for_approval">
Present the found image to the user for review:

```
[Candidate N/N] [Full Name]
Office: [Office Title], [City/State]

Found image:
  Source page: [page URL]
  Image URL:   [image URL]
  License:     [license]

Please open the image URL to verify it's a suitable headshot.
```

Use AskUserQuestion:
- header: "Approve headshot for [Full Name]?"
- question: MUST include the image URL directly in the question text so it remains visible when the dialog opens. Format:
  ```
  [Full Name] — [Office Title], [City/State]

  Image URL to check:
  [image URL]

  [Any notes: auto-cropped X%, tight crop warning, etc.]

  Does this look like a good headshot?
  ```
- options:
  - "Yes, import it" — proceed with import
  - "Skip this person" — move to next candidate
  - "Try another source" — re-run search_for_image with next URL in the list
  - "Enter a URL manually" — ask user to paste an image URL and source URL, then use those

If "Try another source" and no more URLs remain, offer "Skip" or "Enter manually".

If user enters a URL manually, also ask for the source page URL and license.
</step>

<step name="create_politician_record">
**Only applies to subjects with `subject_type = 'candidate'` (no existing politician record).**

After the user approves a headshot but before uploading it, create a minimal politician record so the image has somewhere to attach.

**Multi-step collision guard — run all three checks before creating a new record:**

**Check 1 — exact full_name match with data:**
```sql
SELECT p.id, p.full_name,
       (SELECT COUNT(*) FROM inform.politician_answers pa WHERE pa.politician_id = p.id) AS compass_answers,
       (SELECT COUNT(*) FROM essentials.politician_images pi WHERE pi.politician_id = p.id) AS images
FROM essentials.politicians p
WHERE p.full_name ILIKE '[full_name]'
  AND p.is_active = true
ORDER BY compass_answers DESC, images DESC
LIMIT 5;
```

If any result has `compass_answers > 0` or `images > 0`, that is almost certainly the canonical record — use it regardless of middle initials or punctuation differences.

**Check 2 — fuzzy first+last name match (catches middle initial mismatches):**
```sql
SELECT p.id, p.full_name,
       (SELECT COUNT(*) FROM inform.politician_answers pa WHERE pa.politician_id = p.id) AS compass_answers,
       (SELECT COUNT(*) FROM essentials.politician_images pi WHERE pi.politician_id = p.id) AS images
FROM essentials.politicians p
WHERE p.first_name ILIKE '[first_name]'
  AND p.last_name ILIKE '[last_name]'
  AND p.is_active = true
ORDER BY compass_answers DESC, images DESC
LIMIT 5;
```

If any result has `compass_answers > 0` or `images > 0`, use it as the canonical record and log a warning:
```
⚠ Name mismatch: race_candidate "[full_name]" matched existing politician "[matched_full_name]" ([id]) by first+last name with [N] compass answers. Using existing record.
```

**Check 3 — exact full_name match, no data (safe to use as stub):**
If Check 1 returned results but all had 0 compass_answers and 0 images, use the first result as the politician record (avoid creating yet another empty duplicate).

**Only if all three checks return nothing — insert a new record:**
```sql
INSERT INTO essentials.politicians (
  full_name, first_name, last_name,
  is_active, is_incumbent, source
)
VALUES (
  '[full_name]',
  '[first_name]',
  '[last_name]',
  true,
  false,
  '[source from race_candidates]'
)
RETURNING id;
```

Store the returned `id` as `politician_id` for use in the import step.

**Then link the race_candidate to the politician record:**
```sql
UPDATE essentials.race_candidates
SET politician_id = '[politician_id]'
WHERE id = '[race_candidate_id]';
```

Log:
```
✓ Using politician record for [Full Name] ([politician_id])   ← if existing found
✓ Created politician record for [Full Name] ([politician_id]) ← if new
✓ Linked race_candidate [race_candidate_id] → politician [politician_id]
```
</step>

<step name="check_headspace">
After downloading the image but before uploading, visually inspect the image for headspace issues.

**Do NOT use pixel-based auto-cropping.** Automated hair/skin detection is unreliable on official government photos with grey, white, or plain backgrounds — it misidentifies mid-face as the head top and produces severely over-cropped results.

Instead, use the Read tool to view the image and assess it visually:

```
Read(file_path="[TMPFILE]")
```

**Check for:**
1. **Too much headspace** — more than ~15% of the image height is empty space above the subject's head. Flag to user: `"Note: significant headspace above subject — consider finding a tighter crop or user can provide one."`
2. **Too little headspace** — subject's head is within a few pixels of the top edge, hair may be clipped. Flag to user: `"Warning: subject's head is near the top edge — hair may be clipped."`
3. **Head cut off or torso-only** — image shows only shoulders/body with no face. This is a disqualifying defect — do NOT import. Search for a better source image instead.

**If issues 1 or 2:** present the concern in the approval message and let the user decide whether to proceed or find a better source.

**If issue 3:** skip this source and try the next one automatically; inform the user.

**If no issues:** proceed without any cropping.

The user or a manual crop step can address headspace — automated pixel analysis must not silently alter the image.
</step>

<step name="import_image">
On approval, import the image.

**Option A: Mirror to Supabase Storage (preferred)**

Use Python for all download/upload operations — Windows `curl` does not expand environment variables.

```python
import requests, os
from PIL import Image
from io import BytesIO

key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
tmp = os.environ.get('TEMP', '/tmp')  # Windows-safe temp dir
politician_id = '[politician_id]'
image_url = '[image_url]'

# Download
r = requests.get(image_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
img = Image.open(BytesIO(r.content)).convert('RGB')
w, h = img.size

# Crop to 4:5 ratio (center horizontally, no vertical auto-crop)
target_ratio = 4/5
if w/h > target_ratio:
    new_w = int(h * target_ratio)
    left = (w - new_w) // 2
    img = img.crop((left, 0, left + new_w, h))
else:
    new_h = int(w / target_ratio)
    top = (h - new_h) // 2
    img = img.crop((0, top, w, top + new_h))

# Resize to 600x750 (4:5, Lanczos, q90)
img = img.resize((600, 750), Image.LANCZOS)

filename = f'{politician_id}-headshot.jpg'
tmpfile = os.path.join(tmp, filename)
img.save(tmpfile, 'JPEG', quality=90)

# Upload with upsert (overwrites if already exists)
with open(tmpfile, 'rb') as f:
    data = f.read()

upload_r = requests.post(
    f'https://kxsdzaojfaibhuzmclfq.supabase.co/storage/v1/object/politician_photos/{filename}',
    headers={
        'Authorization': f'Bearer {key}',
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true',
    },
    data=data,
    timeout=30,
)
print(f'Upload: {upload_r.status_code}')

FINAL_URL = f'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{filename}'
```

Use `FINAL_URL` as the `url` value below.

**Option B: Store external URL directly (fallback)**

If `SUPABASE_SERVICE_ROLE_KEY` is not set, use the original image URL directly as `FINAL_URL`.

**Insert the image record:**

```sql
INSERT INTO essentials.politician_images (politician_id, url, type, photo_license)
VALUES ('[politician_id]', '[FINAL_URL]', 'default', '[license]');
```

**Update photo_origin_url on the politician:**

```sql
UPDATE essentials.politicians
SET photo_origin_url = '[source_page_url]'
WHERE id = '[politician_id]';
```

Confirm:
```
✓ Imported headshot for [Full Name]
  Stored at: [FINAL_URL]
  Source: [source_page_url]
```
</step>

<step name="summary">
After processing all candidates, display a summary:

```
Headshot import complete.

  Imported:  [N] politicians
  Skipped:   [N] politicians
  Errors:    [N] (if any)

Run /find-headshots again to process more.
```

Close Playwright browser if still open:
```
mcp__playwright__browser_close
```
</step>

</process>

<anti_patterns>
- Never import a photo without user approval
- Don't use social media profile photos (Twitter/X, LinkedIn, Facebook) — license is unclear
- Don't import group or campaign event photos — must be a clear individual headshot
- Don't guess at image URLs — navigate to the actual page and extract them
- If Playwright fails to load a page after one retry, skip that source rather than looping
- Don't import photos with superimposed text or graphics over the face (e.g. "Re-Elect" banners)
- Don't auto-crop images with pixel detection — it is unreliable on grey/white backgrounds and causes over-cropping; use visual inspection via Read tool instead
- Don't import photos where the subject's head is cut off (torso-only) — find a better source
</anti_patterns>

<success_criteria>
- [ ] Both politicians (existing records) and candidates (race_candidates without politician_id) are surfaced
- [ ] Every imported image was shown to and approved by the user
- [ ] For candidates: politician record created before image import; race_candidate linked via politician_id
- [ ] `politician_images` row inserted with correct `politician_id`, `url`, `type`, `photo_license`
- [ ] `politicians.photo_origin_url` updated with the source page
- [ ] License is documented (not left blank)
- [ ] Headspace above subject does not exceed 15% of image height (auto-cropped if needed)
</success_criteria>
