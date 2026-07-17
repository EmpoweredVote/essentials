# Phase 198 · Plan 02 — Summary

**Plan:** 198-02 — City of South Tucson council headshots
**Requirement:** SUB-04 (headshot portion)
**Status:** ✅ Complete — applied to production 2026-07-17
**Autonomous:** true (orchestrator-run sourcing/upload/apply)

## What was built

All **7/7** seated South Tucson officials now serve a 600×750 (4:5, Lanczos q90) headshot from the
`politician_photos` Storage bucket, bound via audit-only migration
`C:/EV-Accounts/backend/migrations/1364_city_of_south_tucson_headshots.sql` (disk MAX 1363 → 1364,
unregistered in the ledger). Pipeline: `backend/scripts/_tmp-south-tucson-headshots.py` (gitignored
`backend/scripts/_*`, never committed).

## Source acquisition (Pitfall 4 — Cloudflare, not Akamai/CivicPlus)

- southtucsonaz.gov **HTML** pages (`/citycouncil`, `/directory`, individual `directory-listing` pages)
  are Cloudflare-JS-challenge-blocked (HTTP 403 "Just a moment...") to curl/WebFetch — confirmed live.
- Cleared the challenge via the **/find-headshots Playwright flow** (`mcp__playwright__browser_navigate`).
  The individual directory-listing pages carry **no** portrait; the `/citycouncil` page's **lazy-loaded
  council carousel** exposes all 7 official municipal portraits under
  `/files/media/citycouncil/image/{id}/{file}`.
- Those static image **assets are NOT challenge-gated** — a byte-count-verified `curl` of each full-size
  original returned an HTTP 200 real image. So **all 7 authentic municipal portraits were sourced from the
  official site**; no Ballotpedia/Wikimedia/news fallback and **no honest blanks** were needed.
- No header-spoofing / evasive logic used (T-198-CF).

## Manifest (external_id → UUID → CDN url → license)

All 7 share one honest license: **`City of South Tucson official municipal portrait (southtucsonaz.gov,
press use)`** (single genuine source; the per-image rule guards against defaulting when sources *differ*).

| ext_id | Name | Title | Source orig | CDN 200 / bytes |
|--------|------|-------|-------------|-----------------|
| -4015001 | Roxanna Valenzuela | Mayor | 1080×1080 jpg | 200 / 71,370 |
| -4015002 | Melissa Brown-Dominguez | Vice Mayor | 760×507 jpg | 200 / 81,928 |
| -4015003 | Pablo Robles | Acting Mayor | 1066×1599 jpg | 200 / 85,419 |
| -4015004 | Dulce Jimenez | Council Member | 308×413 png | 200 / 92,150 |
| -4015005 | Paul Diaz | Council Member | 478×317 png | 200 / 54,131 |
| -4015006 | Brian Flagg | Council Member | 395×385 png | 200 / 79,635 |
| -4015007 | Cesar Aguirre | Council Member | 103×130 png | 200 / 50,289 |

## Post-verify gates — ALL PASSED

- `politician_images` count for the 7 South Tucson ext_ids = **7**.
- Migration **1364 NOT registered** in the ledger (audit-only) ✓.
- All 7 CDN URLs return **HTTP 200** with non-zero Content-Length; PIL sample (Valenzuela Mayor + Aguirre
  council) = exactly **600×750** ✓.
- Roster re-confirmed live 2026-07-17 against southtucsonaz.gov before binding (T-198-BIND).

## Notes / caveats

- ⚠️ **Aguirre low-res:** the city's own upload for Cesar Aguirre is only **103×130** (a thumbnail); it is
  his authentic official portrait and is bound as such, but upscales ~5.8× to 600×750 (visibly soft). A
  future higher-res re-source is optional (honest-blank was not chosen since a genuine portrait exists).
- ⚠️ **POST-JULY-21 RECONCILE** (inherited from Plan 01): 3 seats (Valenzuela, Flagg, Aguirre) are up in the
  July 21, 2026 primary; re-verify membership + title holders + re-bind any changed seat after the canvass.

## Self-Check: PASSED
