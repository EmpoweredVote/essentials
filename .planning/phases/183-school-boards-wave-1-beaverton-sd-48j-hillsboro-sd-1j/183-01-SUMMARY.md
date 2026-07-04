---
phase: 183-school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j
plan: 01
subsystem: database
tags: [postgres, supabase, school-boards, oregon, wave-0-verification]

# Dependency graph
requires:
  - phase: 174-west-metro-school-district-geofences
    provides: "G5420 geofences geo_id 4101920 (Beaverton SD 48J) and geo_id 4100023 (Hillsboro SD 1J), source tiger_unsd_or_2024_westmetro, both valid geometry"
provides:
  - "Wave-0 verification: both geofences confirmed present/valid/correctly-named; greenfield confirmed (0 governments, 0 SCHOOL districts, 0 ext_id collisions); next migration numbers locked (1203 structural / 1204 headshots); lowercase 'or' casing confirmed via Portland Public Schools precedent"
  - "Both 7-director rosters re-confirmed unchanged via live district-site fetch; both boards confirmed WHOLE-DISTRICT at-large (overturns CONTEXT.md's stale 'Beaverton is zone-voted' assumption — no sub-zone geofence work required for either district)"
  - "Hillsboro exclusions re-confirmed: 3 student representatives (Hernandez Jimenez, Sayre, Woods) + Board Secretary Rose Roman are NOT directors — exactly 7 elected seats"
  - "All 14 finalsite headshot source URLs re-confirmed HTTP 200 with native pixel dimensions recorded; Hillsboro CDN-upscale trap documented for plan 03 (genuine originals are sub-600x750 but already 4:5 — use Lanczos to 600x750 from genuine originals, not the interpolated t_image_size_6 upscale)"
  - "Verbatim chamber and office-title naming locked for plans 02/03"
affects: [183-02, 183-03, 183-04, 184-school-boards-wave-2]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wave-0 read-only probe file (_tmp-*, gitignored, orchestrator-run via psql) as a pre-structural-write gate, reused from the Cornelius 182-01 analog"
    - "On-disk migration-file MAX (via `ls`) treated as authoritative over the DB schema_migrations ledger MAX, which lags and is a known trap"

key-files:
  created:
    - "C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-probe.sql (gitignored, not committed to this repo; 7 labeled read-only probes A-G)"
  modified: []

key-decisions:
  - "Both Beaverton SD 48J and Hillsboro SD 1J are WHOLE-DISTRICT at-large (7 directors each, single G5420 geofence per district) — the D-Z1 zone-voted branch does not fire for either district; no sub-zone geofences of any kind"
  - "Verbatim chamber names locked: Beaverton = 'School Board', Hillsboro = 'Board of Directors' (per-district verbatim, not the 254_or blanket 'Board of Education')"
  - "Verbatim office titles locked: Beaverton 'Director, Zone N' (N=1-7, HIGH confidence), Hillsboro 'Director, Position N' (N=1-7, MEDIUM confidence, proceeding without further confirmation per Open Question 1)"
  - "Chair/Vice-Chair are title-on-seat suffixes, not separate rows — 7 offices per district, not 8/9"
  - "Next migration numbers locked from on-disk MAX (1202), not the DB ledger MAX (1196, a known lag): 1203 = structural, 1204 = headshots"
  - "Plan 03 must build Hillsboro headshots from the genuine small originals (e.g. 256x320, 320x400) with Lanczos upscale to 600x750, NOT from the CDN's t_image_size_6 rendition, which is an interpolated upscale of the same small originals and would fabricate detail"

patterns-established:
  - "Pattern: Wave-0 verification plan with a checkpoint:human-verify gate blocking all structural writes until DB + roster + headshot-source probes pass — reusable for phase 184 (school boards wave 2)"

requirements-completed: []  # WSCH-01/WSCH-02 require the full roster+headshot deep-seed (plans 02-03); not yet complete after this verification-only plan

# Metrics
duration: 6min
completed: 2026-07-04
---

# Phase 183 Plan 01: Wave-0 Verification Summary

**All 7 Wave-0 gates PASS: both G5420 school-district geofences confirmed valid, greenfield status confirmed, next migration numbers locked (1203/1204), and both 7-director boards re-confirmed whole-district at-large with verbatim naming locked for plans 02/03**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-04T15:26:00Z
- **Completed:** 2026-07-04T15:32:00Z
- **Tasks:** 2 (1 auto + 1 checkpoint:human-verify)
- **Files modified:** 1 (gitignored helper, not committed to this repo)

## Accomplishments
- Authored the 7-probe (`A`-`G`) Wave-0 verification SQL file gating all structural writes for this phase
- Orchestrator ran all probes against production plus live roster re-fetches and 14 headshot re-downloads; all gates PASS
- Locked the whole-district-at-large finding for BOTH districts, overturning the stale CONTEXT.md zone-voted assumption for Beaverton
- Locked verbatim chamber/office-title naming strings for plans 02/03
- Documented a Hillsboro CDN-upscale trap for plan 03's headshot sourcing

## Task Commits

Each task was committed atomically:

1. **Task 1: Author the Wave-0 probe file** - N/A (gitignored `_tmp-*` orchestrator-run helper at `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-probe.sql`, not committed per plan instructions — a separate git repo in any case)
2. **Task 2: Orchestrator runs probes, re-fetches rosters, re-downloads headshots** - checkpoint:human-verify, resolved "approved" (no code commit; DB read-only, no writes)

**Plan metadata:** (this commit) `docs(183-01): complete Wave-0 verification plan`

_Note: This plan produced no structural database writes — it is a verification gate only._

## Wave-0 Results (recorded from orchestrator verification, 2026-07-04)

### A. Probe run (psql against production, all 7 gates PASS)

| Probe | Result | Status |
|-------|--------|--------|
| A — Geofence existence/name | 2 rows: `4101920`='Beaverton School District 48J', `4100023`='Hillsboro School District 1J', both `mtfcc`='G5420', both `source`='tiger_unsd_or_2024_westmetro', both `ST_IsValid`=t | PASS |
| B — Greenfield governments | 0 pre-existing governments | PASS |
| C — Greenfield SCHOOL districts | 0 pre-existing SCHOOL districts on either geo_id | PASS |
| D — Ext_id collision | 0 rows in `-4101930..-4101920` and `-4100030..-4100020` | PASS |
| E — Migration ledger | DB ledger MAX=1196 (known lag, NOT authoritative) — on-disk `ls` MAX confirmed **1202** → next structural = **1203**, headshots = **1204** | PASS (on-disk authoritative) |
| F — Casing precedent | Portland Public Schools `districts.state` = `'or'` (lowercase) | PASS |
| G — 0-stance baseline | 0 stance rows across both ext_id ranges | PASS (baseline by design) |

### B. Roster re-fetch (both HTTP 200, no WAF, rosters unchanged from research)

**Beaverton SD 48J — School Board (7/7, whole-district at-large CONFIRMED):**
| Seat | Director | Title suffix |
|------|----------|---------------|
| Zone 1 | Van Truong | |
| Zone 2 | Karen Pérez | |
| Zone 3 | Melissa Potter | Vice-Chair |
| Zone 4 | Sunita Garg | |
| Zone 5 | Syed Qasim | |
| Zone 6 | Justice Rajee | Chair |
| Zone 7 | Tammy Carpenter | |

District's own election language re-confirmed verbatim: "elect them at-large" → whole-district at-large confirmed; the D-Z1 zone-voted branch does NOT fire; D-Z2 fallback moot; no sub-zone geofences.

**Hillsboro SD 1J — Board of Directors (7/7, exclusions confirmed):**
| Seat | Director | Title suffix |
|------|----------|---------------|
| Position 1 | Yessica Hardin Mercado | |
| Position 2 | Mark Watson | |
| Position 3 | Nancy Thomas | |
| Position 4 | See Eun Kim | Vice-Chair |
| Position 5 | Ivette Pantoja | Chair |
| Position 6 | Katie Rhyne | |
| Position 7 | Patrick Maguire | |

Excluded non-directors confirmed present on page but NOT seated: student representatives Ethan Hernandez Jimenez, Keeton Sayre, Ma'Kaia Woods; Board Secretary Rose Roman.

### C. Headshot re-download (14/14 HTTP 200, native dimensions recorded)

**Beaverton (all genuinely high-res, ready for crop→600x750, no upscale needed):**
- Truong 1333x2000
- Pérez 2200x2750 (full URL: `f_auto,q_auto,t_image_size_6/v1626359642/beavertonk12orus/kkfbpkjcgoptqklptu2c/Karen-2.jpg`)
- Potter 1501x1876
- Garg 2200x2750 (full URL: `f_auto,q_auto,t_image_size_6/v1626359628/beavertonk12orus/cxmy5aec9caj2sa7fpp3/Sunita-2.jpg`)
- Qasim 2171x3256
- Rajee 1827x2364 (full URL: `f_auto,q_auto/v1689276791/beavertonk12orus/impb49q1tkrzqqgcgzra/JusticeRageeHeadshot.jpg`)
- Carpenter 1155x1444

**Hillsboro (IMPORTANT finding for plan 03 — CDN-upscale trap):**
All 7 genuine originals are below 600x750 but already exactly 4:5 aspect: Hardin Mercado 256x320, Watson 256x320, Thomas 256x320, Kim 320x400, Pantoja 320x400, Maguire 320x400, Rhyne 172x215. The CDN's `t_image_size_6` variant returns 2200x2750 for these, but that is a confirmed **interpolated upscale** of the small originals (verified by fetching the untransformed `/images/v{ver}/...` originals directly) — it is NOT a genuine high-res source. **Plan 03 must use the genuine small originals + Lanczos to 600x750** and document the Hillsboro partial-quality note per D-R5 (no fabricated detail from the CDN upscale). One Ballotpedia/fallback-chain attempt for Rhyne (172x215, the smallest) is worth trying before accepting the soft upscale.

### D. Verbatim naming LOCKED for plans 02/03

| District | Chamber name | Office title | Chair | Vice-Chair |
|----------|--------------|---------------|-------|------------|
| Beaverton SD 48J | "School Board" | "Director, Zone N" (N=1-7) | Rajee (Zone 6) | Potter (Zone 3) |
| Hillsboro SD 1J | "Board of Directors" | "Director, Position N" (N=1-7) | Pantoja (Position 5) | Kim (Position 4) |

NOT the 254_or blanket "Board of Education" naming. Chair/Vice-Chair are title-on-seat suffixes, not separate offices — 7 offices per district.

## Files Created/Modified
- `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-probe.sql` - Wave-0 read-only verification probes A-G (gitignored helper in a separate repo; not committed to this repo)

## Decisions Made
- Both districts are whole-district at-large — no sub-zone geofences for either (overturns CONTEXT.md's stale Beaverton zone-voted assumption)
- Next migration numbers locked at 1203 (structural) / 1204 (headshots) from on-disk MAX, not the lagging DB ledger MAX
- Verbatim chamber/office-title naming locked as recorded above for plans 02/03
- Hillsboro headshot sourcing must use genuine small originals + Lanczos upscale, not the CDN's interpolated `t_image_size_6` rendition

## Deviations from Plan

None - plan executed exactly as written. Task 1 authored the probe file; Task 2's checkpoint was resolved by the orchestrator running all verification steps directly (DB probes, live roster re-fetch, headshot re-download) and approving with full recorded results.

## Issues Encountered

None. All 7 probe gates passed on first run; both rosters unchanged from research; all 14 headshot URLs returned HTTP 200. The Hillsboro CDN-upscale finding was surfaced during headshot verification and documented as a forward-looking note for plan 03 rather than treated as a blocking issue.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 02 (structural migration: governments, chambers, districts, offices, roster) may proceed using:
- geo_id 4101920 (Beaverton) / geo_id 4100023 (Hillsboro), both G5420, pre-loaded — do NOT re-load
- Next structural migration number: 1203
- Casing: `'or'` (lowercase)
- Whole-district at-large routing for both — no sub-zone geofence work
- Verbatim chamber/office-title naming as locked above
- Ext_id blocks: Beaverton `-4101921..-4101927`, Hillsboro `-4100024..-4100030` (unshifted — probe D found 0 collisions)

Plan 03 (headshots, migration 1204) may proceed using the 14 confirmed HTTP-200 URLs and dimensions above, with the Hillsboro genuine-original + Lanczos approach (not the CDN upscale) for all 7 Hillsboro directors.

No blockers.

---
*Phase: 183-school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j*
*Completed: 2026-07-04*
