# Phase Template: Headshots

Use this template when planning a phase that collects and uploads official headshots for politicians.

**Applies to:** Step 6 (Migration step 7) of LOCATION-ONBOARDING.md

---

## Pre-Upload Checklist

- [ ] All politician rows exist (officials-seed phase complete)
- [ ] Photo source identified for each politician
- [ ] Photos downloaded and reviewed for quality issues (no banners, no text over face)
- [ ] Photos cropped to 4:5 ratio BEFORE resizing (crop first, then resize — never stretch)
- [ ] Photos resized to 600×750 using Lanczos filter, quality 90
- [ ] Supabase Storage bucket path confirmed

## Photo Source Priority

1. Official city website members page (e.g., cambridgema.gov/Departments/citycouncil/members)
2. City council meeting recording screenshots (verify identity before using)
3. Official campaign website (if politician has one; use most recent headshot)
4. Local news or civic volunteer sites (e.g., vote.cambridgecivic.com for Cambridge)
5. Wikipedia — use only for state/federal officials with Wikipedia pages; check license (cc-by-sa is acceptable)
6. LinkedIn — last resort; LinkedIn photos are typically lower quality and may be outdated

**NEVER use:**
- Photos with superimposed text or "Re-Elect" banners over the face
- Cropped screenshots from group photos where identity is uncertain
- Photos where the head is cut off or shoulders are not visible

## Crop and Resize Spec

```
Crop to 4:5 ratio (e.g., 480×600, 600×750, 900×1125) — then resize
Resize to exactly 600×750 using Lanczos filter
Save as JPEG at quality 90
Eyes should be approximately 1/3 from the top of the frame
Full head and shoulders visible
```

Python example (using PIL/Pillow):
```python
from PIL import Image
img = Image.open('source.jpg')
# Crop to 4:5 first (calculate crop box based on source dimensions)
# Then resize
img_resized = img.resize((600, 750), Image.LANCZOS)
img_resized.save('output.jpg', 'JPEG', quality=90)
```

## Upload Pattern

Use the existing headshot upload pattern from prior phases. Upload to Supabase Storage, then update the politician row:

```sql
UPDATE essentials.politicians
SET headshot_url = '[supabase storage URL]'
WHERE id = '[politician_uuid]';
```

Verify the URL resolves before updating the row.

> **Cambridge example:**
> - Primary source: https://www.cambridgema.gov/Departments/citycouncil/members (has official council photos for all 9 councillors)
> - School Committee photos: https://www.cpsd.us/school-committee/school-committee-members-subcommittees
> - Backup source: http://vote.cambridgecivic.com (volunteer civic site; useful if official site lacks a photo)
> - City Manager (Yi-An Huang): check cambridgema.gov/Departments/citymanagersoffice
> - All photos must clear the "no banners" rule; Cambridge civic site photos are typically clean

## Verification

After uploading all photos:

```sql
-- Check headshot coverage
SELECT p.full_name, p.headshot_url IS NOT NULL as has_photo
FROM essentials.politicians p
JOIN essentials.governments g ON p.government_id = g.id
WHERE g.geo_id = '[geo_id]'
ORDER BY p.full_name;

-- Count missing photos
SELECT COUNT(*) as missing FROM essentials.politicians p
JOIN essentials.governments g ON p.government_id = g.id
WHERE g.geo_id = '[geo_id]' AND p.headshot_url IS NULL;
```

## State Legislature Headshot Sourcing

State legislature websites typically host member photos, but URL structures vary by state and chamber.

**Before any state:** Visit one senator page and one representative page, inspect the image URL, and determine whether URLs are derivable from member names or are per-person GUIDs (non-derivable).

| Type | URL derivable? | Strategy |
|------|---------------|----------|
| Derivable (name-based) | YES | Build a batch downloader from the official member list |
| Non-derivable (UUID per rep) | NO | Must visit each profile page individually to capture the URL |

**Maine example (mainelegislature.org):**
- **Senate:** `https://legislature.maine.gov/uploads/visual_edit/[FirstLast].jpg` — URL is derivable from the senator's name (lowercase, first+last concatenated). Phase 52-01 batch-downloaded all 35 senator photos from this pattern.
- **House:** `https://legislature.maine.gov/house/Repository/MemberProfiles/[uuid]_[Name]-[year].jpg` — the UUID is assigned per representative and is NOT derivable from their name. Must visit each representative's profile page at `https://legislature.maine.gov/house/house/RepresentativeDistrict/[district]` to capture the URL. Phase 52-02 captured 151 house rep URLs one per profile page.

**For your state:** Check both chambers before building any batch download. Saving a script for the Senate may not work for the House if the URL format differs.

---

## Thumbnail Upscaling (when only low-res source available)

Sometimes the only available headshot source is a small thumbnail (e.g., 152×202 pixels). The question: is a soft upscale better than no photo?

**Decision rule:**
- If the source thumbnail is the ONLY available source (no campaign website, no official site photo) → upscale with Lanczos + unsharp masking is acceptable
- Always get user sign-off before processing the full set — show 1–2 sample upscales for approval
- Document the upscale in the SUMMARY.md: note the source resolution and approval date

**Process:**
1. Pick 2 representative samples (one person with a clear face, one with trickier lighting)
2. Upscale to 600×750 with Lanczos filter + mild unsharp mask (e.g., PIL: `img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))`)
3. Show samples to user; confirm they are acceptable
4. Process full set only after approval

**Maine example:** Phase 52-03 upscaled 150 House representative thumbnails from 152×202 → 600×750 using Lanczos + unsharp masking. Samples shown to user 2026-05-19; user approved before full batch processing. Result: all 150 photos uploaded; quality is acceptable (some softness, but recognizable and usable).

---

## Common Mistakes

- Stretching photo to 600×750 without cropping to 4:5 first → distorted faces
- Using raw originals without resize → browser rendering artifacts
- Uploading photos with "Re-Elect" or name banners → violates display guidelines
- Saving headshot crop to wrong folder when user asks for the raw crop to be saved separately
- Not verifying URL resolves before updating DB row
