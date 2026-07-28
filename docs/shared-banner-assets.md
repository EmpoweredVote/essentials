# Shared Banner Assets — Consumer Guide (Treasury Tracker, CTC, others)

**Audience:** any Empowered Vote app that wants to display a place banner (a state, a city,
or the federal band) without sourcing and licensing its own imagery.

**TL;DR:** We host licensed, QA'd, wide place banners in a **public Supabase Storage bucket**.
`GET` the public URL, drop it behind `object-fit: cover`, done — no auth, no SDK, no build step.
This is the authoritative image library for the org; prefer consuming these over bundling your own.

---

## 1. Where the images live

Public base URL (Supabase Storage, bucket `politician_photos`):

```
https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/
```

The bucket is **public and unauthenticated** — a plain HTTPS `GET` works from any origin, server
or browser. No API key. Served with `Cache-Control: no-cache`. Filenames are stable — but see
§6 before assuming an overwrite is immediately visible; an edge cache outlived one on 2026-07-27.

### Folder / naming convention

| Path pattern | What it is | Example |
|---|---|---|
| `states/<ABBR>.jpg` | US state banner (uppercase 2-letter USPS code) | `states/CA.jpg`, `states/TX.jpg` |
| `cities/<slug>.jpg` | curated city banner (lowercase, hyphenated slug) | `cities/santa-monica.jpg`, `cities/long-beach.jpg` |
| `national/<name>.jpg` | federal band | `national/us-capitol-banner-v2.jpg` |
| `la_county/building_photos/<geoid>.jpg` | legacy LA-county city shots (being migrated to `cities/`) | `la_county/building_photos/0644000-skyline.jpg` |

City slug rule: lowercase the city name and replace spaces with hyphens
(`West Covina` → `west-covina`, `San Diego` → `san-diego`).

---

## 2. Image spec

- **Dimensions:** 1700 × 540 px (aspect ratio **~3.15:1**, a wide horizontal band).
- **Format:** JPEG, quality ~90, progressive.
- **Composition:** cropped so the subject reads with a **bottom-weighted dark gradient** applied on
  top (our banners always overlay `linear-gradient(to top, rgba(13,17,23,.9), .4 @50%, .1)` and place
  a label bottom-left). If you overlay text at the bottom, the imagery already tolerates it.
- These are **banners, not tiles.** They're wider than a typical card. Consuming apps should
  `object-fit: cover` them into whatever box they need — cropping the sides for a squarer slot is
  expected and fine (the subject is centered/anchored to survive a cover crop).

---

## 3. How to consume

### Plain HTML/CSS
```html
<div class="banner">
  <img src="https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/santa-monica.jpg"
       alt="Santa Monica" loading="lazy">
</div>
<style>
  .banner { position: relative; height: 180px; overflow: hidden; }
  .banner img { width: 100%; height: 100%; object-fit: cover; }
</style>
```

### Build the URL from a place
```js
const BASE =
  'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos';

const stateBanner = (abbr) => `${BASE}/states/${abbr.toUpperCase()}.jpg`;
const cityBanner  = (name) => `${BASE}/cities/${name.toLowerCase().trim().replace(/\s+/g, '-')}.jpg`;
```

### Handle the "no banner" case (important)
Not every place has a curated banner (see the catalog below). A state without a banner or a city
that isn't in the catalog **won't have an object at that URL (404)**. Two safe patterns:

- **Known-list gate (recommended):** only build a URL for places you know are covered — keep a copy
  of the covered lists (Section 4) or ask us for the current set. Otherwise show your own
  gradient/placeholder.
- **Graceful fallback:** on `<img onerror>` (or a HEAD check server-side), swap to a solid color or
  gradient. Don't show a broken-image icon.

Our own app returns `null` for uncovered places and renders a neutral tier-gradient — mirror that.

---

## 4. Current catalog (snapshot)

> **Authoritative source:** `src/lib/buildingImages.js` in the `essentials` repo
> (`STATE_PANORAMAS` set + `CURATED_LOCAL` map). This snapshot will drift as we add cities —
> ask for the current list or read that file if you need certainty.

**States — all 50** are available at `states/<ABBR>.jpg`:
`AK AL AR AZ CA CO CT DE FL GA HI IA ID IL IN KS KY LA MA MD ME MI MN MO MS MT NC ND NE NH NJ NM NV NY OH OK OR PA RI SC SD TN TX UT VA VT WA WI WV WY`

**Cities with a curated banner — 145 entries across 13 states** (recount 2026-07-28):

| State | entries | State | entries |
|---|---|---|---|
| CA | 39 | AZ | 6 |
| UT | 36 | NV | 4 |
| TX | 20 | VA | 2 |
| OR | 14 | IN, WI, MO, MD | 1 each |
| MA | 14 | | |
| ME | 6 | | |

**Do not hardcode this table** — it was ~19 cities as of 2026-07-05 and is 145 now. Read
`CURATED_LOCAL` in `src/lib/buildingImages.js`, or ask us for a current export.

Two things that will bite a consumer building URLs from a city name:

- **Entries are STATE-SCOPED, and some slugs are ambiguous.** `CURATED_LOCAL` keys on the city name
  but each entry carries a `state`, and a name that recurs across states (Portland OR vs Portland
  ME; Sherwood OR vs Sherwood AR; Glendale CA vs Glendale AZ) stores an **array of variants**. You
  must disambiguate by state — `cities/portland.jpg` alone is not well-defined. Where a
  disambiguated file exists it is suffixed (`cities/portland-me.jpg`).
- **A few CA cities are still on the legacy path** `la_county/building_photos/<geoid>.jpg`
  (Los Angeles, Pomona, Torrance, Carson) pending migration to `cities/`.

---

## 5. Licensing & attribution (please read)

Every banner is sourced from **Wikimedia Commons** under a free license (CC BY, CC BY-SA, CC0, or
Public Domain) — **no AI-generated imagery.** The **per-image credit registry** (title · author ·
license) lives in the comment block above `CURATED_LOCAL` / `STATE_PANORAMAS` in
`src/lib/buildingImages.js`.

CC BY / CC BY-SA licenses **require visible attribution.** If Treasury Tracker displays these
publicly, carry the credit — either an on-page credit line, an "image credits" page, or a tooltip.
If you need a machine-readable credits list (JSON of `{ path, title, author, license }`) to render
attribution automatically, ask and we'll export one from the registry.

---

## 6. Updates & versioning

- Filenames are **stable**; we update an image by **overwriting the object** in place — *or, since
  2026-07-27, by bumping a `-vN` suffix.* See the caveat below before relying on overwrite.
- ⚠ **Overwrite-in-place is NOT reliably visible. Verified 2026-07-27.** This section previously said
  the bucket is `no-cache` and "the CDN purges on write", so consumers get the new image on next
  load. That did not hold: after overwriting `cities/bend.jpg`, the plain public URL kept returning
  the **previous** 346 KB file while a cache-busted request (`?v=<ts>`) returned the new 309 KB one —
  confirmed by sha256 on both responses, with `cache-control: no-cache` present in the headers. The
  object *was* replaced; an edge copy simply persisted.
  - **If you publish banners:** version the filename (`cities/bend-v2.jpg`) and update the reference,
    rather than trusting a purge. Bend now does this.
  - **If you consume banners:** a stale image after a known update is the cache, not a bad file.
    Append a cache-busting query string to confirm before reporting it.
- We will **not** silently repurpose a slug for a different place. A given `cities/<slug>.jpg`
  always means that city.
- 🔴 **THE FULL FRAME IS NOT WHAT USERS SEE. Compose for the SAFE ZONE, not the whole image.**
  (Corrected 2026-07-28 — an earlier revision of this section claimed the box matches the asset's
  1700/540 and "nothing is cropped." That described an intermediate fix and was never true of the
  shipped code.)

  `SectionBanner` originally used a **fixed-height** box (`h-[120px] md:h-[180px]`) at full width, so
  `object-fit: cover` kept only the **middle ~44%** of the height on desktop while a phone kept ~97%
  — the same file rendered as two different pictures, and a banner reviewed on a phone was wrong on
  a desktop. That is not hypothetical: it shipped the Bend, OR banner as a wall of trees, because it
  was certified on the full frame with its subject in the upper third.

  It is now a **responsive aspect pair**, `aspect-[13/4] md:aspect-[6/1]`:

  | breakpoint | box ratio | visible slice of the 1700×540 asset |
  |---|---|---|
  | mobile | 13/4 = 3.25:1 | **96.9%** (near the full frame) |
  | `md`+ | 6/1 = 6.0:1 | **52.5%** (middle band only) |

  **So on desktop, the top and bottom ~24% each are never seen.** Keep the subject in the
  **middle ~52% horizontal band**. A subject distributed *vertically* (mountain peaks up top, water
  at the bottom) will not survive; a subject that reads as a *horizontal band* (a skyline on a
  horizon) survives any crop.

  - **Cropping depends ONLY on the box's aspect ratio, never its pixel size.** A bigger box at the
    same ratio shows exactly the same slice. Do not reason about heights.
  - **If you consume these in your own app:** `object-fit: cover` into a box **wider** than 3.15:1
    crops top and bottom; into a **narrower** box crops the sides. Choose deliberately — an
    `aspect-[1700/540]` box shows the whole composition; anything wider trades frame for a slimmer
    band. Judge a candidate image by the slice *your* box will render, not by the full file.

---

## 7. Requesting assets / reporting issues

- **Need a place we don't have yet?** Tell us the city/state; we run it through the banner pipeline
  (`docs/banner-asset-pipeline.md`) and publish to the bucket. Turnaround is fast for anything with
  a licensable Wikimedia source.
- **A banner looks wrong in your layout?** Because these are 3.15:1 and you may be cropping to a
  different shape, tell us the target aspect ratio — we can anchor the crop differently or provide
  an alternate.
- Owner / source of truth: the `essentials` app (`src/lib/buildingImages.js`, `scripts/banners/`).

---

## Appendix — note for CTC

CTC currently bundles its own tiles in `frontend/public/images/collections/<slug>.jpg` (Wikimedia,
≥800px). Those overlap several of our covered places (e.g. `santa-monica-ca`, `fremont-ca`,
`portland-or`, `cambridge-ma`, `plano-tx`, `springfield-mo`). Our banners are higher-res (1700px)
and licensing-tracked, so where a place overlaps you can point CTC at our bucket URL instead of
maintaining a separate file — downscaling ours into a tile is lossless-enough; upscaling an 800px
tile into our banner is not. Same guidance applies to Treasury Tracker.
