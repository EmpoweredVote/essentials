# 189-03 SUMMARY — Live spot-check: D-05 placement, cross-page parity, SBAN-04 empty-state

**Plan:** 189-03 (checkpoint:human-verify, blocking)
**Requirements:** SBAN-01, SBAN-04
**Status:** COMPLETE — operator approved 2026-07-08
**Files modified:** none (verification-only)

## What was verified

Live QA driven by the orchestrator via a fresh Playwright session against a local `npm run dev`
build (post-Wave-2 wiring), then operator-approved.

### Spot-check locations used
- **Covered city (D-05 placement + cross-page parity):** Los Angeles, CA — `/results?browse_geo_id=0644000&browse_mtfcc=G4110&browse_label=Los Angeles, CA`
- **No-data city (SBAN-04 empty-state):** Los Angeles County local/county banner — `/results?browse_government_list=06037&browse_state=CA&browse_label=Los Angeles County` (a county geo is not a Census place → no population; no Treasury municipal entity → no icon)

### A) D-05 placement (SBAN-01) — PASS
Measured via `getBoundingClientRect` on the live DOM:
- **Desktop (1280px):** all three tiers (city 3,857,897 / state 39,242,785 / federal 332,387,540) render the POPULATION scrim at `statLeftInset = 48px` (matches title `px-12`), `statVCenterOffset = 0` (vertically centered on the left edge). Treasury icon present bottom-right on state + federal.
- **Mobile (390px, 120px banner):** scrim at top inset 16px (`top-4`, upper-left), left inset 24px (`px-6`), gap above title = 11px, `collision = false`.

### A) Cross-page parity (SBAN-01/02) — PASS
Elections page (`&view=elections`), same location: city banner renders IDENTICAL population (3,857,897), identical left inset (48) + vCenter (0), identical icon set — no page-specific divergence. Both pages render through `buildBannerProps`, so any rendered tier matches by construction.

### B) SBAN-04 empty-state — PASS
"Los Angeles County, CA" local banner: `hasStat = false`, `iconCount = 0` — renders title + art only, no stat scrim, no empty icon container, no layout shift (v19.0 parity). State (California) and Federal (United States) banners on the same page still render normally (stat + icon). Verified identical on Results and Elections.

### Console
No banner-related errors. The 3 console errors present are pre-existing and unrelated to this phase:
- `401 /api/auth/session` — local session not authenticated (expected in dev).
- `net::ERR_UNKNOWN_URL_SCHEME @ searched:no_results` / `searched:circular_crop_only` — headshot-placeholder sentinel image `src` values from LA County officials' photo data; present regardless of banner treatment, orthogonal to 189.

## Acceptance criteria — all met
- [x] Stat scrim left-anchored (not top-right), desktop-centered / mobile-upper-left, clear of title + icon row at 390px and 1280px.
- [x] Results and Elections show identical population + icon set per tier for the same location.
- [x] No-data city banner renders title + art only — no empty containers, no layout shift, no banner-related console errors — on both pages.

## Self-Check: PASSED
Operator sign-off recorded; no fixes required.
