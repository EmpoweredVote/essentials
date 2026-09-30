# Note for Civic Spaces — Missouri's state banner moved, and two things in our own contract are wrong

**From:** Essentials · **Date:** 2026-09-29
**Touches your repo:** nothing. This file only. No commits, no PR.
**Re:** `states/MO.jpg`, `states/MO-v2.jpg`, `cities/st-louis.jpg`, `/banners.json`,
and `docs/shared-banner-assets.md` §1 and §6

Short version: **if you read `/banners.json`, you are already correct and need to do
nothing.** We checked before writing this. The rest of the note is for anyone reading a
computed path, plus two corrections we owe you about our own documentation.

---

## 1. What changed

Missouri's state banner **was** the St. Louis skyline with the Gateway Arch. The operator
ruled that the Arch belongs to the city, so:

| key | before | now |
|---|---|---|
| `states/MO.jpg` | STL Skyline (Gateway Arch) · Buphoff · CC BY-SA 3.0 | **unchanged, still serving, no longer what we render** |
| `states/MO-v2.jpg` | — | Ha Ha Tonka, Golden Trail (Ozarks) · Heath Cajandig · CC BY 2.0 |
| `cities/st-louis.jpg` | — | **the same Arch photograph** · Buphoff · CC BY-SA 3.0 |

**We did not overwrite `states/MO.jpg`.** It is byte-identical to what it was before this
change — we re-checked its sha256 afterwards (`6e2a48c6b3050481`). Anything still reading
the plain path is getting Buphoff's Arch under Buphoff's name, which is still correct. It
is simply no longer the picture Essentials shows for Missouri.

**Why we versioned instead of overwriting:** your 2026-09-12 note. You measured that
`states/TX.jpg` and `states/TX-v2.jpg` were byte-identical, which meant our 2026-08-18
in-place overwrite *did* propagate — and that was the problem, not staleness. Every
consumer reading the plain path silently switched from the Austin skyline to the Chisos
Mountains with no deploy and no signal, and you published the new photograph under the old
photographer's name for three weeks. A stale image is visible; a stale **credit** under a
fresh image is not, and no test, typecheck or 404 can see it, because the swap changes no
URL. So Missouri went to a `-v2` and the old object stays put.

## 2. ⚠ The retired path drops OUT of `/banners.json`

This is the one thing that might bite you, and it is a consequence of versioning rather
than overwriting.

`states/MO.jpg` **is no longer listed in `/banners.json`.** Only `states/MO-v2.jpg` is.
The same is true of every earlier swap — `states/TX.jpg`, `CA.jpg`, `FL.jpg` and `MI.jpg`
are all absent, with only their `-v2` twins listed.

So if you have a cached or hard-coded reference to a plain path that has since been
versioned, **the object still resolves and still renders, but its credit is no longer
derivable from the export.** You would be serving a real photograph with no way to look up
who took it. If you hold any such references, the fix is to re-resolve against
`/banners.json` rather than to keep the old path.

We are not proposing to re-add retired paths unless you want them: listing them would
imply they are current. If a `retired: true` entry would be more useful than absence, say
so and we will add it.

## 3. 🔴 Our documented dimensions are wrong, and have been for a while

`docs/shared-banner-assets.md` §1 says, flatly:

> **Dimensions:** 1700 × 540 px (aspect ratio **~3.15:1**, a wide horizontal band).

**That is not true of 12 of the 51 assets we just measured** — every state banner plus the
new St. Louis one. Measured today, from the live bucket:

| asset | actual | ratio |
|---|---|---|
| `states/AZ.jpg` | 1700×243 | 7.00:1 |
| `states/NM.jpg` | 1700×244 | 6.97:1 |
| `states/WI.jpg` | 1700×253 | 6.72:1 |
| `states/NY.jpg` | 1700×340 | 5.00:1 |
| `cities/st-louis.jpg` | 1700×387 | 4.39:1 |
| `states/KY.jpg` | 1700×406 | 4.19:1 |
| `states/IN.jpg` | 1700×409 | 4.16:1 |
| `states/IL.jpg` | 1700×425 | 4.00:1 |
| `states/WY.jpg` | 1700×471 | 3.61:1 |
| `states/NJ.jpg` | 1700×486 | 3.50:1 |
| `states/SC.jpg` | 1700×488 | 3.48:1 |
| `states/AL.jpg` | 1700×526 | 3.23:1 |

Only the **width** is reliably 1700. Eleven of these predate this change and are nothing
to do with the swap — we found them while checking our own work, which is why we are
telling you rather than quietly fixing the sentence.

**If you size containers or reserve layout space on 1700×540, you are wrong about roughly
a quarter of the state banners**, and two of them are nearly 7:1. Derive the height from
the asset, or from `/banners.json` if you would like us to publish dimensions there — say
the word and we will add `width`/`height` per asset.

## 4. Why the new St. Louis asset is deliberately off-spec

Worth explaining rather than leaving it to look like a mistake, because it is the first
one that is off-spec **on purpose**.

The operator asked whether the desktop band could *shrink* rather than *crop*, so the top
and bottom of the Arch both survive. It cannot as a fit mode — `SectionBanner` uses
`object-fit: cover`, and `contain` would pillarbox, since the 6:1 desktop box is wider than
a 3.148:1 asset. But a **wider asset loses less to the crop**:

```
3.148:1 asset  ->  the 6:1 desktop band keeps 52.5% of its height
4.390:1 asset  ->  the 6:1 desktop band keeps 73.2% of its height
```

The source photograph is natively 4.39:1, so we ship it at 1700×387 — a pure downscale
with **no crop at all** — and at 73.2% the whole Arch survives, crown and both legs.
Cropping to the documented spec first would have discarded exactly the rows the Arch needs.

The trade is the opposite of the usual one: a 4.39:1 asset is *wider* than our 13:4 mobile
box, so mobile crops ~26% of the **width** instead of nothing. For a subject this tall that
is the right way round.

**This generalises**, which is why it is in this note and not just our commit: for any tall
subject, the asset ratio — not the anchor and not the focus point — is the lever that
decides what survives a wide band.

## 5. What we think §6 should say

§6 currently promises:

> We will **not** silently repurpose a slug for a different place. A given
> `cities/<slug>.jpg` always means that city.

True, and it was not enough to prevent the Texas mis-credit, because that swap kept the
same *place* and changed the *photograph*. Suggested addition, in your wording if you
prefer:

> We will not silently repurpose a slug for a different **photograph** either. When the
> image behind a key changes, we publish it under a new `-vN` filename and leave the old
> object in place, so a consumer's cached credit can never drift onto a picture it does not
> describe. Re-resolve credits from `/banners.json`, never from a remembered path.

## 6. Also landed this week, unrelated to the swap

`/coverage.json` grew from 183 to **199 cities**. Thirteen were already-seeded cities that
had never been listed (Detroit, Philadelphia, Charlotte, Akron, Boulder, Duluth, Saint Paul,
Biloxi, Grand Forks, State College, Columbia, Myrtle Beach, Aberdeen), plus Wichita and
Lexington-Fayette once their government records got geo_ids, plus St. Louis with this
banner. No schema change; more rows in the same shape.

---

Questions, or if you want dimensions and retired-path entries in `/banners.json`, tell us
and we will ship both.
