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
or browser. No API key. Served with `Cache-Control: no-cache`, and Supabase's CDN purges on
overwrite, so the URL is stable and always returns the current image.

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

**Cities with a curated banner** (as of 2026-07-05):

| State | City | URL suffix |
|---|---|---|
| IN | Bloomington | `cities/bloomington.jpg` |
| OR | Beaverton, Hillsboro, Tigard, Tualatin, Forest Grove, Sherwood, Cornelius | `cities/<slug>.jpg` |
| CA | Long Beach, Glendale, Pasadena, West Covina, Downey, Burbank, Norwalk | `cities/<slug>.jpg` |
| CA | Los Angeles, Pomona, Torrance, Carson | `la_county/building_photos/<geoid>.jpg` (legacy — will migrate to `cities/`) |

The CA city list is actively growing (San Francisco, San Diego, San Jose, Sacramento, Berkeley,
Santa Monica, Fremont, and more are queued), followed by MA, UT, TX, OR-metro, ME, NV, and VA cities.

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

- Filenames are **stable**; we update an image by **overwriting the object** in place. Because the
  bucket is `no-cache` and the CDN purges on write, consumers get the new image on next load — no
  action needed on your end, no cache-busting query string required.
- We will **not** silently repurpose a slug for a different place. A given `cities/<slug>.jpg`
  always means that city.

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
