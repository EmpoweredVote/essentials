# Plan 197-02 Summary — Sahuarita Headshots

**Status:** ✅ Complete — applied to production 2026-07-16
**Requirement:** SUB-03 · ROADMAP success criterion #2 (all seated officials have 600×750 headshots)
**Files:** `_tmp-sahuarita-headshots.py` (gitignored, not committed) · `1355_town_of_sahuarita_headshots.sql` (audit-only, committed `99dca12c`, applied, unregistered)

## What was built

7/7 headshots for the Sahuarita Town Council, each 600×750 (4:5, Lanczos q90, centered crop `anchor_x=0.5`), uploaded to the `politician_photos` Storage bucket and bound via 7 `essentials.politician_images` rows (`type='default'`).

## Sourcing (Pitfall 4 — CivicPlus soft-block)

`sahuaritaaz.gov/274/Town-Council` serves the 7 official portraits via `/ImageRepository/Document?documentID=N`. A raw request soft-blocks (HTTP 200 + 0-byte body), so the images were retrieved through the **Playwright browser context** (`fetch(..., {credentials:'include'})` in-page → base64 → local scratchpad files → PIL pipeline). All 7 came back as valid `image/jpeg` at 1920px. documentIDs were mapped to members by DOM document order (image immediately followed by that member's `@sahuaritaaz.gov` email):

| ext_id | Name | documentID | UUID | CDN 200 / 600×750 |
|--------|------|-----------|------|-------------------|
| -4014001 | Tom Murphy (Mayor) | 13714 | f32cba1e-…9f40 | ✅ |
| -4014002 | Kara Egbert (Vice Mayor) | 13712 | 071e2a28-…ee51 | ✅ |
| -4014003 | Deborah Morales | 13710 | c2553fba-…f15d | ✅ |
| -4014004 | Steven Gillespie | 13713 | 9f846d00-…531c | ✅ |
| -4014005 | Diane Priolo | 13711 | b9ea3ef0-…6ae4 | ✅ |
| -4014006 | Kim Lisk | 13715 | 866f1db3-…7091 | ✅ |
| -4014007 | Edgar Lytle | 13716 | bbfcbd5f-…9571 | ✅ |

- **License:** uniform `Town of Sahuarita official municipal portrait (sahuaritaaz.gov, press use)` — honest, single source (all 7 are the Town's own portraits, shot at the same plaza).
- **No operator-supplied fallbacks needed;** no Ballotpedia/Wikimedia fallback used.
- **No header-spoofing** — the browser context legitimately retrieved the bytes.

## Verification

- Pipeline script exited 0: `7/7 uploaded, 0 gaps`.
- `politician_images` count for the 7 ext_ids = **7**.
- `curl -sI` on Murphy/Lisk/Lytle CDN URLs → HTTP 200, non-zero Content-Length.
- PIL on CDN-fetched Murphy + Lytle = exactly **600×750** JPEG.
- Migration audit-only (no `supabase_migrations` ledger row); committed to `C:/EV-Accounts`.

## Note

Bound to the Plan-01 pre-primary roster. If the July 21 2026 primary changes any of the 3 contested seats (Murphy/Egbert/Morales), the post-primary reconcile must re-source the incoming member's portrait and rebind (`politician_images` idempotency guards on `politician_id`).
