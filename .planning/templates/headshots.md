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

## Common Mistakes

- Stretching photo to 600×750 without cropping to 4:5 first → distorted faces
- Using raw originals without resize → browser rendering artifacts
- Uploading photos with "Re-Elect" or name banners → violates display guidelines
- Saving headshot crop to wrong folder when user asks for the raw crop to be saved separately
- Not verifying URL resolves before updating DB row
