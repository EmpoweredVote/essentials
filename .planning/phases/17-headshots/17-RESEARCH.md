# Phase 17: Headshots - Research

**Researched:** 2026-05-01
**Domain:** Photo acquisition, cropping, resizing, and Supabase Storage upload for Collin County politicians
**Confidence:** HIGH — primary tool (`/find-headshots`) is fully built and verified in production; politician roster is confirmed from Phases 13-15; per-city source patterns are known

---

## Summary

Phase 17 uploads official headshot photos for all seeded Collin County politicians into Supabase Storage and inserts `essentials.politician_images` rows. The `/find-headshots` skill (`~/.claude/commands/find-headshots.md`) handles the full workflow: find photo → check headspace → get user approval → download, resize to 600×750 Lanczos q90 → upload to `politician_photos` bucket → insert `politician_images` row → update `politicians.photo_origin_url`.

The politician roster is fully confirmed: 15 rows (Plano/McKinney), 42 rows (Tier 2 cities), 45 rows (Tier 3), 29 rows (Tier 4) = approximately 131 seeded politicians across 26 cities. Several seats were NOT YET SEEDED due to May 3, 2026 election pendency (10 Tier 3 stubs, 9 Tier 4 stubs, plus the Allen/Frisco/Murphy/Celina contested seats from Phase 14) — those politicians don't exist in the DB yet, so skip them.

The most important constraint driving the plan structure is the Frisco city site CloudFlare block: for all 7 Frisco politicians, go directly to Ballotpedia and skip the city site entirely. For all other Tier 1-2 politicians, start at the `urls[]` bio URL already stored in `politicians.urls` — this is the official city bio page and is the ideal photo source.

**Primary recommendation:** Run `/find-headshots` in batches organized by city; use the bio URL from `politicians.urls` as the first source (already stored from Phases 13-15); skip Frisco city site (Ballotpedia first); document gaps per-city in the plan output section.

---

## Standard Stack

This phase uses only the existing skill and tooling — no new libraries are installed.

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `/find-headshots` skill | Built (Phase 14+) | Full workflow: find → approve → crop → upload | Project's established tool; handles headspace check, approval, Supabase upload, DB insert |
| `essentials.politician_images` table | Live | Stores final image URL + license | Existing schema; consumed by essentialsBodiesService.ts |
| Supabase Storage `politician_photos` | Live | CDN-served image storage | Existing bucket; CDN base confirmed |
| Python/Pillow (headspace check) | Available in skill | Auto-crop excessive headspace | Per skill's check_headspace step |
| `curl` + `SUPABASE_SERVICE_ROLE_KEY` | Available in shell | Download + upload binary to Storage | Used in skill's import_image step |

### Supabase Details (HIGH confidence — from find-headshots.md)

| Setting | Value |
|---------|-------|
| Project ID | `kxsdzaojfaibhuzmclfq` |
| Storage bucket | `politician_photos` |
| CDN base URL | `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/` |
| Table | `essentials.politician_images` |
| Columns | `id`, `politician_id`, `url`, `type`, `photo_license` |
| Politician update | `politicians.photo_origin_url` set to source page URL |

### Target Image Spec (HIGH confidence — from CONTEXT.md decisions)

| Setting | Value |
|---------|-------|
| Dimensions | 600×750 (4:5 ratio) |
| Resampling | Lanczos |
| Quality | q90 |
| Aspect ratio rule | Crop only, never stretch |
| Eye position | ~1/3 from top |
| Head inclusion | Full head + shoulders |
| Headspace limit | Auto-crop if >15% above head |
| Minimum source width | 200px (reject smaller) |

---

## Architecture Patterns

### Batch Organization by City-Tier

The plan should organize headshot tasks by city, not by individual politician. Each city task:
1. Queries politicians without images for that city (using the find-headshots DB queries)
2. Runs `/find-headshots` for each person in that city
3. Documents gaps in the plan output section

### Pattern 1: Find-Headshots Skill Invocation

**What:** Invoke the built skill per city or per small group of politicians.
**When to use:** For every politician who needs a headshot.

The skill's DB query already handles finding politicians without images:

```sql
-- Query A used by /find-headshots:
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
ORDER BY p.full_name
LIMIT [N];
```

Note: the skill's WHERE clause filters `photo_origin_url IS NULL`. Politicians who already have a photo from Phase 14 (Jeffrey Prang was mentioned in MEMORY.md, but that's an LA politician, not Collin County) won't appear. The filter correctly skips already-imaged politicians.

### Pattern 2: Source Priority per City

```
For Tier 1 (Plano, McKinney, Allen):
  1. politicians.urls[] bio page (already in DB from Phase 13/14)
  2. Ballotpedia search
  3. Local news/press search

For Frisco (ALL 7 politicians):
  1. SKIP friscotexas.gov — CloudFlare blocks all image extraction
  2. Ballotpedia search (first source)
  3. Local news/press search

For Tier 2 (Murphy, Celina, Prosper, Richardson):
  1. politicians.urls[] bio page
  2. Ballotpedia search
  3. Local news/press search

For Tier 3-4 (all remaining cities):
  1. politicians.urls[] bio page (where available)
  2. Ballotpedia search
  (stop after two sources per politician — document and skip if neither yields acceptable photo)
```

### Pattern 3: Post-Upload Verification

After each city batch completes, verify with:

```sql
SELECT p.full_name, pi.url, pi.photo_license
FROM essentials.politicians p
LEFT JOIN essentials.politician_images pi ON pi.politician_id = p.id
LEFT JOIN essentials.offices o ON o.id = p.office_id
LEFT JOIN essentials.chambers ch ON ch.id = o.chamber_id
LEFT JOIN essentials.governments g ON g.id = ch.government_id
WHERE g.geo_id IN ('<city_geo_id>')
  AND p.is_active = true
ORDER BY o.title;
```

### Pattern 4: Image Filename Convention

From the skill's import_image step:
```bash
SLUG="[politician_id]-headshot"
EXT=".jpg"  # or .png/.webp from source
FILENAME="${SLUG}${EXT}"
```

Result: files stored as `{uuid}-headshot.jpg` in the `politician_photos` bucket.

### Anti-Patterns to Avoid

- **Using LinkedIn:** Explicitly out of scope at all tiers per CONTEXT.md.
- **Inserting null/placeholder rows:** Do NOT insert `politician_images` rows with no valid URL. Only insert when a real photo is found and uploaded.
- **Skipping the approval step:** The `/find-headshots` skill requires user approval before every import. Never bypass it.
- **Importing photos with other people in frame:** Must be solo shot or cropped to individual.
- **Importing photos with superimposed text/banners:** Hard rejection per CONTEXT.md (also project memory rule).
- **Importing photos under 200px wide:** Reject and try next source.
- **More than 2 sources for Tier 3-4:** Hard cap of city site + Ballotpedia per CONTEXT.md.

---

## Don't Hand-Roll

This phase has no hand-rolled solutions — all tooling already exists.

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Photo discovery workflow | Custom search + download script | `/find-headshots` skill | Already built with approval gate, headspace check, DB insert |
| Headspace detection | Custom pixel analysis | Skill's `check_headspace` step | Has hair vs. skin fallback logic; crop threshold built in |
| Storage upload | Direct Supabase JS client | `curl` + `SUPABASE_SERVICE_ROLE_KEY` in skill | Already proven in production |
| DB insert | Custom SQL | Skill's `import_image` step INSERT | Correct schema; also updates `photo_origin_url` |
| Image resizing | Custom Python | 600×750 Lanczos q90 spec (use whatever resize tool produces this) | Match the exact spec — don't invent a different one |

**Key insight:** The `/find-headshots` skill is the single source of truth for the workflow. The plan should invoke it, not reimplement it.

---

## Common Pitfalls

### Pitfall 1: Frisco City Site CloudFlare Block

**What goes wrong:** Agent navigates to `friscotexas.gov/directory.aspx?EID=XXX` to extract a headshot; CloudFlare blocks the browser and returns a CAPTCHA or empty page.

**Why it happens:** Confirmed during Phase 14 research — all Frisco directory bio pages are CloudFlare-protected. Photo extraction via Playwright will fail.

**How to avoid:** For all 7 Frisco politicians (Mayor Jeff Cheney or winner, Places 1-6), skip the city site entirely. Start directly with Ballotpedia.

**Frisco politicians (7):** Mayor (Jeff Cheney/winner), Ann Anderson (Place 1), Burt Thakur (Place 2), Angelia Pelham (Place 3), Jared Elad (Place 4), Laura Rummel or winner (Place 5), Brian Livingston or winner (Place 6).

**Note:** The May 3, 2026 election may have replaced Mayor/Place 5/Place 6 with new people. The NOT-YET-SEEDED stubs from Phase 14 means those rows don't exist yet. Only photograph politicians actually in the DB.

### Pitfall 2: Photographing NOT-YET-SEEDED Politicians

**What goes wrong:** Plan attempts to find headshots for politicians whose DB rows don't exist yet (contested May 3 seats).

**Why it happens:** Phase 14 left stubs for Allen Mayor, Frisco Mayor/Place 5/Place 6, Murphy Place 3/Place 5, and Celina Mayor/Place 4/Place 5. Phase 15 left 10 Tier 3 stubs and 9 Tier 4 stubs.

**How to avoid:** Run the `/find-headshots` DB query first — it only returns politicians who ARE in the DB. Any NOT-YET-SEEDED politician simply won't appear in the results. The plan should note that pending-election seats will be handled in a follow-up after those seats are seeded.

**Estimated DB politicians available for headshots (approximate):**
- Plano: 8, McKinney: 7 = 15 Tier 1
- Allen: 5 (not Mayor — stub), Frisco: 4 (Places 1-4 only), Murphy: 5, Celina: 4, Prosper: 7, Richardson: 7 = ~32 Tier 2
- Tier 3: 45 seeded rows
- Tier 4: 29 seeded rows
- **Total available: ~121 politicians** (some May 3 seats still stubs)

### Pitfall 3: Photo Source Resolution Check Skipped

**What goes wrong:** Agent imports a photo that looks fine in the browser but is only 150px wide; result is blurry at 600×750.

**Why it happens:** Small thumbnails on city websites may appear adequate in a snapshot but fail the 200px minimum.

**How to avoid:** Check the `<img>` src dimensions before accepting. The skill's `extract_image_url` step notes: "Disqualify thumbnails under 100px." Our bar is 200px wide per CONTEXT.md. If the city bio page only offers a small thumbnail, try the next source (Ballotpedia typically has higher-res photos).

### Pitfall 4: Bio URL in politicians.urls[] Doesn't Have an Image

**What goes wrong:** Agent navigates to the stored bio URL but the page has no photo (bio is text-only, or the photo is a small icon).

**Why it happens:** Some cities (Princeton, Lavon, Lucas, most Tier 4) stored the general council page URL rather than an individual bio page. The page may have photos for all members but they're in group layout or thumbnails.

**How to avoid:**
- Check the full council page layout — individual portrait images often appear beside each member's bio text.
- For cities with individual EID URLs (Melissa, Murphy, Frisco), the individual page is most likely to have a photo.
- For cities with only the general council page URL (most Tier 3-4), browse the page to find the per-member photo.
- If only a group photo or no usable photo exists, proceed to the next source.

### Pitfall 5: Accepting Campaign-Style Photos

**What goes wrong:** Agent approves a photo that has "Elect [Name]" or campaign logo text over the face.

**Why it happens:** Google Image results and some Ballotpedia pages may surface campaign material.

**How to avoid:** Explicit rejection rule: no superimposed text, campaign graphics, or banners over the face — regardless of photo quality otherwise. This is also in project memory (`feedback_headshot_no_graphics.md`).

### Pitfall 6: Richardson City Site Returns 403

**What goes wrong:** Agent navigates to `cor.net/government/city-council/who-are-our-city-council-members/{name}` to find headshot; gets 403.

**Why it happens:** Richardson bio pages (cor.net) return 403 when fetched externally — confirmed in Phase 14 research.

**How to avoid:** For Richardson's 7 politicians, skip the cor.net bio pages. Use any photo from the individual bio URL if somehow accessible via Playwright, but expect 403. Fall back to Ballotpedia for Richardson politicians.

### Pitfall 7: Celina Domain Confusion

**What goes wrong:** Agent navigates to `celinatx.gov` (no hyphen) which is wrong.

**Why it happens:** The official site is `celina-tx.gov` (hyphenated); the non-hyphenated domain is different.

**How to avoid:** Always use `celina-tx.gov` for Celina photos. Bio pages follow the pattern `celina-tx.gov/Directory.aspx?did=4`.

---

## Per-City Photo Source Reference

This table summarizes what's in `politicians.urls[]` and expected photo availability, based on Phases 13-15 research:

| City | Tier | Bio URL type | Expected photo availability | Fallback needed? |
|------|------|-------------|---------------------------|-----------------|
| Plano | 1 | Individual bio pages (`plano.gov/NNNN/Name`) | HIGH — Plano always has individual headshots | Rarely |
| McKinney | 1 | In-page anchors on single council page | MEDIUM — council page may have photos | Sometimes Ballotpedia |
| Allen | 1 | Individual bio pages (`cityofallen.org/business_detail_T4_RXXX`) | HIGH — individual pages have photos | Rarely |
| Frisco | 1 | Individual EID pages — CloudFlare blocked | BLOCKED — skip city site | Always Ballotpedia |
| Murphy | 2 | Individual EID pages (`murphytx.org/Directory.aspx?EID=X`) | MEDIUM — EID pages may have photos | Sometimes Ballotpedia |
| Celina | 2 | Council directory page (`celina-tx.gov/Directory.aspx?did=4`) | LOW — shared page only | Often Ballotpedia |
| Prosper | 2 | Individual EID pages (`prospertx.gov/directory.aspx?EID=XX`) | MEDIUM — EID pages may have photos | Sometimes |
| Richardson | 2 | Individual bio pages (`cor.net/...`) — 403 blocked | BLOCKED externally | Always Ballotpedia |
| Anna | 3 | Individual bio pages (`annatexas.gov/NNNN/Name`) | HIGH — Anna has individual pages | Rarely |
| Melissa | 3 | Individual EID pages (`cityofmelissa.com/Directory.aspx?EID=XX`) | MEDIUM | Sometimes |
| Princeton | 3 | None (no individual bio pages found) | LOW — general council page | Often Ballotpedia |
| Lucas | 3 | None found | VERY LOW | Ballotpedia |
| Lavon | 3 | None found | VERY LOW | Ballotpedia |
| Fairview | 3 | General council page only | LOW | Ballotpedia |
| Van Alstyne | 3 | None found | VERY LOW | Ballotpedia |
| Farmersville | 3 | General council page only | LOW | Ballotpedia |
| Parker | 4 | None found | VERY LOW | Ballotpedia |
| Saint Paul | 4 | None found | VERY LOW | Ballotpedia |
| Nevada | 4 | None found | VERY LOW | Ballotpedia |
| Weston | 4 | None found | VERY LOW | Ballotpedia |
| Lowry Crossing | 4 | None found | VERY LOW | Ballotpedia |
| Josephine | 4 | None found | VERY LOW | Ballotpedia |
| Blue Ridge | 4 | None found | VERY LOW | Ballotpedia |

---

## Code Examples

### Verification Query After All City Batches

```sql
-- Count headshots by city after phase completes
SELECT
  g.name AS city,
  COUNT(p.id) AS politicians_in_db,
  COUNT(pi.id) AS with_headshot,
  COUNT(p.id) - COUNT(pi.id) AS missing_headshot
FROM essentials.politicians p
LEFT JOIN essentials.politician_images pi ON pi.politician_id = p.id
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.chambers ch ON ch.id = o.chamber_id
JOIN essentials.governments g ON g.id = ch.government_id
WHERE g.state = 'TX'
  AND p.is_active = true
GROUP BY g.name
ORDER BY missing_headshot DESC, g.name;
```

### Image Verification Query (Confirm 600x750 via metadata)

The skill uploads images to Supabase Storage. There is no server-side metadata for pixel dimensions stored in the DB. Pixel dimension verification requires either:
1. Downloading a sample and checking with `identify` (ImageMagick) or Python PIL
2. Visual spot-check in browser

```bash
# Spot-check a specific image dimensions
curl -sL "https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{filename}" \
  -o /tmp/check.jpg && python3 -c "from PIL import Image; img=Image.open('/tmp/check.jpg'); print(img.size)"
```

### Manual Single Headshot (if skill fails for one person)

```sql
-- Insert after manual download + upload
INSERT INTO essentials.politician_images (politician_id, url, type, photo_license)
VALUES ('[uuid]', 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/[uuid]-headshot.jpg', 'default', 'press_use');

UPDATE essentials.politicians
SET photo_origin_url = '[source_page_url]'
WHERE id = '[uuid]';
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Store external URL directly (photo_origin_url) | Mirror to Supabase Storage bucket | Mirroring avoids broken images if city site changes |
| photo_custom_url / photo_origin_url only | politician_images table with CDN URL | The service layer checks politician_images first in the COALESCE chain |
| Manual resize | 600×750 Lanczos q90 spec in find-headshots skill | Spec enforced in headspace check step |

**Service layer photo resolution order** (from `essentialsBodiesService.ts` line 108-115):
```
1. p.photo_custom_url
2. p.photo_origin_url (if starts with http)
3. politician_images subquery (first by id ASC)
```
Phase 17 inserts into `politician_images` (option 3). The politician's `photo_origin_url` is also set to the source page URL by the skill, which will be picked up by option 2 if photo_custom_url is null. Both fields get written.

---

## Open Questions

1. **May 3, 2026 election seats — pending seed then headshot**
   - What we know: ~19 seats across Allen, Frisco, Murphy, Celina (Phase 14) + 10 Tier 3 stubs + 9 Tier 4 stubs were NOT seeded awaiting election results.
   - What's unclear: Whether those politicians will be seeded before Phase 17 runs.
   - Recommendation: The plan should note that headshots for these politicians are deferred until their `politicians` rows are created. The plan can include a follow-up task template for re-running `/find-headshots` after election seat seeding is complete.

2. **Image pixel dimension verification**
   - What we know: The skill's spec produces 600×750 at Lanczos q90. But the plan's success criterion #1 requires confirmation.
   - What's unclear: There's no automatic dimension metadata in the DB or Storage bucket.
   - Recommendation: Plan should include a spot-check step for a sample of uploaded images using PIL/ImageMagick to confirm 600×750. Full batch verification is impractical; spot-checking 3-5 images per tier is sufficient.

3. **Ballotpedia coverage for small Tier 3-4 cities**
   - What we know: Ballotpedia has reliable coverage for most elected officials nationally, but small cities (Lavon pop. ~6k, Weston pop. ~400, Lowry Crossing pop. ~2k) may have no Ballotpedia entry at all.
   - What's unclear: Which specific Tier 3-4 cities will have zero Ballotpedia results.
   - Recommendation: For cities with no individual bio URLs and expected-low Ballotpedia coverage (Lavon, Weston, Lowry Crossing, Josephine, Nevada, Blue Ridge), expect many "document and skip" outcomes. The plan should normalize this as acceptable — the Tier 3-4 effort ceiling is intentionally low.

---

## Sources

### Primary (HIGH confidence)
- `~/.claude/commands/find-headshots.md` — Full skill workflow, DB queries, upload logic, headspace check algorithm
- `.planning/phases/14-tier-2-officials/14-RESEARCH.md` — Confirmed Frisco CloudFlare block; per-city bio URL patterns
- `.planning/phases/13-tier-1-officials-plano-mckinney/13-RESEARCH.md` — Plano/McKinney bio URL patterns
- `.planning/phases/15-tier-3-4-officials/15-RESEARCH.md` — All 16 Tier 3-4 cities' contact/URL status
- `.planning/phases/15-tier-3-4-officials/15-VERIFICATION.md` — Confirmed 74 Tier 3-4 politician rows live in DB
- `.planning/phases/14-tier-2-officials/14-VERIFICATION.md` — Confirmed 42 Tier 2 politician rows live in DB
- `.planning/phases/13-tier-1-officials-plano-mckinney/13-VERIFICATION.md` — Confirmed 15 Tier 1 politician rows live in DB
- `C:/EV-Accounts/backend/src/lib/essentialsBodiesService.ts` line 107-116 — Confirmed photo_url COALESCE priority (custom > origin > politician_images)
- `C:/EV-Accounts/backend/src/lib/essentialsService.ts` line 33 + 284-306 — Confirmed politician_images schema and batchFetchImages pattern

### Secondary (MEDIUM confidence)
- Phase 17 CONTEXT.md — All decisions locked; source priorities, acceptance bar, resize spec, effort ceiling
- Project memory `feedback_headshot_no_graphics.md` — No superimposed text/graphics rule
- Project memory `feedback_headshot_image_sizing.md` — 600×750 Lanczos q90 spec
- Project memory `feedback_headshot_cropping.md` — Crop rules, eye at 1/3, full head + shoulders

### Tertiary (LOW confidence)
- None — all key claims verified from code or prior phase documentation.

---

## Metadata

**Confidence breakdown:**
- Standard stack (tool/skill): HIGH — `/find-headshots` is built and production-verified
- DB schema and service layer: HIGH — read directly from TypeScript source
- Per-city photo source expectations: HIGH for Tier 1-2 (confirmed from phase research); MEDIUM for Tier 3-4 (estimated from URL coverage data)
- Ballotpedia coverage for small cities: LOW — not verified per city
- Pixel dimension verification approach: MEDIUM — PIL spot-check is standard practice

**Research date:** 2026-05-01
**Valid until:** 2026-05-31 (stable — skill and DB schema don't change; bio URL patterns are stable)
