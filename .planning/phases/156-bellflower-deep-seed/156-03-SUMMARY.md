# 156-03 SUMMARY — Bellflower headshots (Wave 3)

**Plan:** 156-03-PLAN.md | **Requirement:** BLFL-01 | **Status:** ✓ Complete — operator-approved 2026-06-22 ("Headshots look good for bellflower")
**Migration:** `1044_bellflower_headshots.sql` (AUDIT-ONLY, NOT registered) — applied live + committed to EV-Accounts (`fc65f12d`)
**Self-Check:** PASSED (orchestrator first-pass visual check passed; final human sign-off pending)

## What was built

All 5 current officials now have exactly one `type='default'` 600×750 headshot sourced from the official city site, with `photo_origin_url` recorded. Santa Ines (D3) is a new image; the other 4 were re-downloaded from source and re-processed to spec.

## Pipeline
- Source: `bellflower.ca.gov/photo_gallery/Government/City Council/{name} web.jpg` (NO-WAF Revize CMS; all HTTP 200). Santa Ines via `/photo_gallery/` (the `/revize_photo_gallery/` variant 404s).
- Process: PIL — 4:5 crop FIRST (center horizontal, top-biased vertical so eyes sit ~⅓), then resize 600×750 Lanczos q90. Source was 500×700 for all 5.
- Upload: Supabase Storage `politician_photos/{uuid}-headshot.jpg` (x-upsert, SERVICE_ROLE_KEY) — all HTTP 200.
- DB: idempotent UPDATE-or-INSERT one `type='default'` `politician_images` row per member + `politicians.photo_origin_url`.

## First-pass visual check (orchestrator, via image render — wrong-person guard)
All 5 are clean official council portraits: correct head framing, neutral blue-gray backdrop, City of Bellflower lapel pins, **no superimposed text/graphics**.
- Santa Ines (Mayor, D3) — Asian-American man, glasses, green tie ✓
- Dunton (D5) — older man, gray hair, navy suit, red tie ✓
- Koops (D2) — older man, brown hair, blue striped tie; **lapel pin reads "Council Member"** (corroborates NOT Mayor — the stale `dan_koops_mayor.php` bio URL) ✓
- Morse (D1) — woman, blonde, black glasses, dark blazer ✓
- Sanchez (Mayor Pro Tem, D4) — younger man, dark hair/beard, dark suit ✓

## Verification (DB)
5 rows, each `img_ct=1`, url ends `{uuid}-headshot.jpg`, `photo_origin_url` = bellflower.ca.gov source. (Note: replaces the prior `{pol_uuid}/default.jpeg` URLs for the 4 existing members; origin_url was previously NULL for all.)

## ⚠ Blocking human-verify checkpoint
Per the autonomous:false plan, operator should confirm each portrait is the correct Bellflower official (no name-collision) at:
`https://essentials.empowered.vote/results?browse_geo_id=0604982&browse_mtfcc=G4110`

## Operator-requested follow-up fix (browse ordering/labeling — success criterion 5)
Operator noted the rendered roster showed a **"Mayor Pro Tem" section with Mayor Pro Tem listed before the Mayor**. Root cause (shared frontend logic, NOT Bellflower data): `src/lib/groupHierarchy.js` groups any "mayor"-titled official into an exec sub-group, but `execTitlePriority()` only demoted `vice|deputy` — not `pro tem` — so Mayor and Mayor Pro Tem tied and alphabetical tie-break ("Sanchez" < "Santa Ines") put Mayor Pro Tem first; the sub-group label was then taken from the raw-unsorted first record.
Fix (commit `a235f25`): (1) `pro tem` now demotes to priority 1 (like vice/deputy); (2) the sub-group label is derived from the **sorted** pols so it reflects the lead (Mayor). Now: section label "Mayor", Mayor first. Affects all rotational-mayor cities. Regression test added (`groupHierarchy.test.js`, 8/8 pass). **Requires an essentials-app deploy to show live.**

## key-files.created
- `C:/EV-Accounts/backend/migrations/1044_bellflower_headshots.sql`
- `src/lib/groupHierarchy.js` + `src/lib/groupHierarchy.test.js` (browse ordering/label fix)
- scratchpad: `{label}_600x750.jpg` ×5 (processed), `{label}_raw.jpg` ×5 (originals)
