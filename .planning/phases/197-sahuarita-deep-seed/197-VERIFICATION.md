---
phase: 197-sahuarita-deep-seed
verified: 2026-07-17T04:25:20Z
status: passed
score: 6/6 must-haves verified
overrides_applied: 0
---

# Phase 197: Sahuarita Deep-Seed Verification Report

**Phase Goal:** Sahuarita residents can see their council with a compass, and the Town of Sahuarita carries its own licensed community banner surfaced with a DB-honest coverage chip.
**Requirements:** SUB-03, BANR-01
**Verified:** 2026-07-17T04:25:20Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Town of Sahuarita government + Town Council chamber + 7 at-large offices on ONE shared LOCAL/G4110 district (0462140), Mayor/Vice-Mayor as title annotations (NO separate LOCAL_EXEC), party NULL | ✓ VERIFIED | psql: 1 government (`Town of Sahuarita, Arizona, US`, type=Town, geo_id=0462140); 1 chamber matching `%Council%`; exactly 1 `LOCAL` district for geo_id 0462140, 0 `LOCAL_EXEC` rows; all 7 offices (`o.district_id`) point to the identical district UUID `ff0ee3ae-fce1-405a-a351-78418cce9890`; `p.party` empty on all 7; `is_appointed=false` on all 7; titles = exactly 1 "Mayor" (Murphy) + 1 "Vice Mayor" (Egbert) + 5 "Council Member" |
| 2 | All 7 seated officials have 600×750 headshots | ✓ VERIFIED | psql: 7 `essentials.politician_images` rows (`type='default'`) for the 7 external_ids, each with a distinct CDN url. Downloaded all 7 CDN files and measured with PIL: all 7 = exactly `(600, 750)` RGB. All 7 URLs return HTTP 200. |
| 3 | Evidence-only compass stances for the 7 officials — 100% cited, ZERO neutral-default rows, ZERO judicial-* rows, honest blanks allowed | ✓ VERIFIED | psql: 14 total `inform.politician_answers` rows across 6 of 7 officials (Lytle = 0, documented honest blank in SUMMARY); 0 answer rows missing a matching `politician_context` row; 0 context rows with NULL/empty `sources` array; 0 rows joined to a `judicial-%` `topic_key`. Sampled reasoning text is substantive (specific dated events, named sources) — not placeholder/generic text. |
| 4 | Banner `cities/sahuarita.jpg` returns HTTP 200 at 1700×540; wired into `buildingImages.js` `CURATED_LOCAL` as single-word `sahuarita` | ✓ VERIFIED | `curl -sI` → HTTP/1.1 200 OK, image/jpeg, 256547 bytes. Downloaded + measured with PIL: exactly `(1700, 540)`, ratio 3.148 (matches claimed 3.15:1 spec). `grep` on `src/lib/buildingImages.js` line 476: `sahuarita: { state: 'AZ', src: '.../cities/sahuarita.jpg' }` present in `CURATED_LOCAL` with an attribution comment. |
| 5 | 'Sahuarita' appended to the EXISTING Arizona `COVERAGE_STATES` block (exactly ONE Arizona block), `hasContext:true`, browse `0462140`; NOT in `COVERAGE_COUNTIES` | ✓ VERIFIED | `grep -c "name: 'Arizona'"` on `src/lib/coverage.js` = **1**. Sahuarita entry at line 219: `{ label: 'Sahuarita', browseGovernmentList: ['0462140'], browseStateAbbrev: 'AZ', hasContext: true }` inside that single Arizona block. `COVERAGE_COUNTIES` (lines 254-273) contains only `Pima County` (geo_id `04019`) for AZ — no Sahuarita entry. |
| 6 | End-to-end: a real Sahuarita address → live search API returns all 7 at-large council members on the one Town of Sahuarita government | ✓ VERIFIED | Live `POST https://api.empowered.vote/api/essentials/candidates/search` with `{"query":"375 W Sahuarita Center Way, Sahuarita, AZ 85629"}` → HTTP 200. Response JSON filtered to `external_id` starting with `-4014`: exactly 7 rows (Murphy/Egbert/Morales/Gillespie/Priolo/Lisk/Lytle), each with `government_name: "Town of Sahuarita, Arizona, US"`, `district_type: "LOCAL"`, `district_label: "Town of Sahuarita (At-Large)"`. No LOCAL_EXEC phantom, no duplicate/wrong-jurisdiction rows. |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `essentials.governments` row (geo_id 0462140) | Town of Sahuarita, type='Town' | ✓ VERIFIED | 1 row, name/type/geo_id all match |
| `essentials.chambers` (Town Council) | official_count=7 | ✓ VERIFIED | 1 chamber matched `%Council%` |
| `essentials.districts` (LOCAL, geo_id 0462140) | exactly 1 shared district, no LOCAL_EXEC | ✓ VERIFIED | 1 LOCAL, 0 LOCAL_EXEC |
| `essentials.politicians` × 7 (ext_id -4014001..-4014007) | party NULL, is_appointed false | ✓ VERIFIED | 7 rows, all party empty, all is_appointed=f |
| `essentials.politician_images` × 7 | type='default', 600×750 | ✓ VERIFIED | 7 rows; all 7 CDN files measured 600×750 |
| `inform.politician_answers` / `politician_context` (14 rows) | 100% cited, no judicial | ✓ VERIFIED | 14/14 have matching cited context; 0 judicial |
| `cities/sahuarita.jpg` (Storage) | 1700×540, licensed photo | ✓ VERIFIED | HTTP 200, measured 1700×540 |
| `src/lib/buildingImages.js` `CURATED_LOCAL.sahuarita` | wired entry + attribution | ✓ VERIFIED | present, line 476 |
| `src/lib/coverage.js` Arizona block Sahuarita entry | appended, hasContext:true | ✓ VERIFIED | present, line 219; exactly 1 Arizona block |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| Live address search | DB roster | `POST /api/essentials/candidates/search` → geofence → offices | ✓ WIRED | Live API call returned all 7 officials on the correct government |
| `buildingImages.js` `sahuarita` key | Storage CDN | `src` URL fetch | ✓ WIRED | CDN URL returns 200, correct dimensions |
| `coverage.js` Sahuarita chip | DB stance rows | `hasContext:true` claim | ✓ WIRED (DB-honest) | 14 stance rows exist for the town's officials, so the `true` claim is accurate (not a stale/optimistic flag) |
| Offices → shared LOCAL district | `district_id` FK | join | ✓ WIRED | All 7 offices share the identical district UUID |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| Search API response | `politicians[]` filtered by government | Live `api.empowered.vote` → Supabase-backed geofence query | Yes — 7 real named officials, real district labels, real photo URLs | ✓ FLOWING |
| Coverage chip `hasContext:true` | stance-row existence | `inform.politician_answers` count | Yes — 14 real cited rows, not a hardcoded flag | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Banner CDN reachable at correct dimensions | `curl -sI` + PIL size check | HTTP 200, 1700×540 | ✓ PASS |
| All 7 headshot CDN URLs reachable at 600×750 | `curl -sI` ×7 + PIL size check ×7 | 7/7 HTTP 200, 7/7 (600,750) | ✓ PASS |
| Live search API returns Sahuarita roster for a real address | `curl -X POST .../candidates/search` | HTTP 200, 7/7 officials on correct government | ✓ PASS |
| No section-split on geo_id 0462140 | psql group-by on government/offices | 1 government row, 7 offices, no split | ✓ PASS |

### Probe Execution

Not applicable — this is a data-seeding phase (SQL migrations + asset wiring), not a runnable-app phase with `scripts/*/tests/probe-*.sh` conventions. No probes declared in PLAN/SUMMARY files. Verification instead used direct DB/HTTP checks per the phase's own validation strategy (197-VALIDATION.md).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SUB-03 | 197-01 through 197-04 | Sahuarita deep-seed (govt+roster+headshots+stances+banner+coverage) | ✓ SATISFIED | All 6 observable truths verified above |
| BANR-01 | 197-04 | Licensed community banner for Sahuarita | ✓ SATISFIED | Banner live at correct spec, wired |

**Note:** `.planning/REQUIREMENTS.md` traceability table (lines 120, 122) still shows `SUB-03 | Phase 197 | Pending` and the `SUB-03` checkbox unchecked, despite `BANR-01`'s "Complete" marker already listing Phase 197. This document also shows `SUB-02` (Phase 196, already-shipped Marana) and `TUC-01` (Phase 194, shipped) as "Pending" — consistent with this being a tracker reconciled only at the milestone retrospective (Phase 200, per `AZ-RETRO-01`), not per-phase. This is a documentation-lag artifact, not a code/data gap — flagged as informational only, does not affect phase 197's PASS status.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `C:/EV-Accounts/backend/migrations/1355_town_of_sahuarita_headshots.sql` | 36-38 | Header comment references a drafting-stage "placeholder text" for `photo_license` | ℹ️ Info | Verified the actual applied `photo_license` value in production is the real string (`Town of Sahuarita official municipal portrait (sahuaritaaz.gov, press use)`), not a placeholder — the comment describes a resolved intermediate step, not a live defect. No action needed. |
| `.planning/REQUIREMENTS.md` | 44, 120 | SUB-03 marked unchecked/"Pending" | ℹ️ Info | Documentation-lag (see Requirements Coverage note above); not a functional gap. |

No debt markers (TBD/FIXME/XXX) found unresolved in any of the 9 Sahuarita migration SQL files or the 2 modified frontend files.

### Human Verification Required

None. All 6 truths were verified programmatically via live DB queries, live HTTP checks (banner + headshot CDN + live search API), and direct pixel-dimension measurement. The phase's own 197-VALIDATION.md correctly scoped this as a DB/grep-verifiable data-seeding phase with no UI surface requiring visual/manual judgment beyond the banner sourcing decision, which was already approved at the blocking visual-QA gate documented in 197-04-SUMMARY.md.

### Gaps Summary

No gaps. All 5 ROADMAP success criteria for Phase 197 are observably true in production:
1. Structural model verified exactly as claimed (hybrid title-on-seat, no phantom LOCAL_EXEC).
2. 7/7 headshots confirmed at exact 600×750 pixel dimensions via direct measurement (not just HTTP 200).
3. 14 evidence-only stance rows, 100% cited, 0 judicial-topic rows, 0 uncited context — honest blanks for Lytle (0 rows) and partial coverage for others are consistent with "no defaults" policy.
4. Banner confirmed live at exact claimed 1700×540 dimensions, correctly wired into `buildingImages.js`.
5. Coverage chip confirmed in the single existing Arizona `COVERAGE_STATES` block, DB-honest `hasContext:true` backed by real stance rows, correctly absent from `COVERAGE_COUNTIES`.
6. End-to-end live search API test against a real Sahuarita street address returned exactly the 7 expected council members bound to the correct government/chamber/district — this is the strongest evidence available (bypasses trust in any intermediate layer).

One pre-existing follow-up is explicitly flagged (not a gap of this phase): a post-July-21-2026-primary roster/title reconcile is owed once the primary is certified (documented in 197-01-SUMMARY.md and consistent with the milestone-wide "2026 is an active election year" convention). This is scheduled future work, not a phase-197 deficiency — the phase correctly seeded the live-confirmed roster as of its 2026-07-16 apply date.

---

*Verified: 2026-07-17T04:25:20Z*
*Verifier: Claude (gsd-verifier)*
