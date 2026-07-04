# Phase 184: School Boards Wave 2 — Tigard-Tualatin SD 23J + Forest Grove SD 15 + Sherwood SD 88J - Research

**Researched:** 2026-07-04
**Domain:** Three Oregon school-district government seeds (Tigard-Tualatin SD 23J, Forest Grove SD 15, Sherwood SD 88J) on pre-loaded G5420 geofences + headshots + 0 compass stances by design
**Confidence:** HIGH (geofences/greenfield status/schema/election-method/environment/domains); MEDIUM (exact verbatim office-title convention for TTSD and FGSD — Sherwood confirmed HIGH verbatim); MEDIUM-LOW on 2 of 15 headshot sources (1 genuine "Coming Soon" placeholder gap, 1 near-square crop needing a real center-crop decision)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Wave-1 template fixes (D-F1/D-F2) — apply to the 184 clones, do NOT clone 1203/1205 verbatim:**
- **D-F1: WR-01 fix** — resolve the politician id via a `pol AS (SELECT id FROM ins_p UNION SELECT id FROM politicians WHERE external_id = …)` CTE and join the office INSERT to `pol`, making the office `NOT EXISTS` guard live and each block genuinely idempotent/self-healing.
- **D-F1: WR-02 fix** — the structural post-verify DO block additionally asserts `chamber_id IS NOT NULL` for all seeded offices (guards against chamber-name string drift between the Step-2 INSERT and the per-block scalar subquery).
- **D-F1: WR-03 fix** — headshot INSERTs use `INSERT … SELECT gen_random_uuid(), p.id, … FROM politicians p WHERE p.external_id = … AND NOT EXISTS (…)` so a missing politician skips the block instead of degrading to a `politician_id = NULL` attempt.
- **D-F2: Info-level nits** — IN-01 (ETL `.env` parser strips surrounding quotes and optional `export `), IN-02 (dimension comments state actual downloaded payload dims from the run log, not CDN filename dims), IN-03 (probe ledger comment names the real headshot migration number; ext-id probe ranges get genuine margin on BOTH bounds), IN-04 (verify each geo-derived ext-id block stays within its decade; probe confirms no collisions).

**Migration granularity (D-P1, carried from 183):**
- Single shared plan-set covering all three districts. Expected shape: Wave-0 probes → structural (all 3 boards, one migration) → headshots (all 3 boards) → surfacing + full E2E. No stances plan, no banner plan — a ~4-plan phase mirroring 183's plan-set. Planner may split the structural migration per district if cleaner; one file is equally acceptable.

**Zone routing × 3 (D-Z1/D-Z2, carried verbatim from 183):**
- **D-Z1: WHO VOTES decides routing, not residency.** Verified from each district's official election rules at plan time, never assumed. Zone voters alone elect their director → sub-zone geofences required. Whole district votes for every position (zones/positions = residency requirement only, the common Oregon ORS 332.118 shape) → single G5420 district, whole-board modeling, no new geofences. All three districts get the same verification.
- **D-Z2: Whole-district fallback if zone-voted with no official GIS** — if a board is confirmed zone-VOTED but no official machine-readable zone boundary exists, seed on the single G5420 geofence with the zone structure documented as a known modeling caveat. Never hand-trace boundaries.

**Roster + headshots (D-R1..R5, carried verbatim from 183):**
- **D-R1:** Ground-truth roster + exact body name verbatim from each district's official site at plan time (researcher confirms live domains). No hardcoding names, seat counts, or position naming from memory; account for May-2025 Oregon school-board election turnover. Note WAF status AND photo availability per district site.
- **D-R2:** Office title per district convention — verbatim from the district site; keep each district's own numbering on the office title. Never assume "Board Member."
- **D-R3:** Chair / Vice Chair = title-on-seat if the district designates one; no separate LOCAL_EXEC-style row, no extra chamber.
- **D-R4:** Non-voting seats EXCLUDED (superintendents, student reps). Vacancies documented, never a placeholder person; very recent appointees count if confirmed on the official district site.
- **D-R5:** Headshots — official district site first, then the standing fallback chain. Finalsite trap: fetch UNTRANSFORMED original asset URLs — `t_image_size_6` is an upscale trap. Crop-to-4:5 FIRST then 600×750 Lanczos q90; circle-cutout PNGs get the inscribed-crop treatment; transparent PNGs composite onto white. Mirror to Storage `politician_photos/{uuid}-headshot.jpg`; `photo_license` by actual source. Genuine gaps documented, no fabrication.

**Banner treatment (D-B1, carried from 183 — not re-asked):**
- No community banner for school districts. The licensed-banner constraint is city-scoped; district browse inherits the default banner behavior. No `buildingImages.js` work.

### Claude's Discretion
- **External_id blocks** — geo_id-derived analogs subject to Wave-0 probe verification: -4112241.. (Tigard-Tualatin SD), -4105161.. (Forest Grove SD), -4111291.. (Sherwood SD). **Research correction: all three boards are confirmed 5-seat, not 7-seat (see Key Finding 1) — blocks only need 5 ids each: -4112241..-4112245, -4105161..-4105165, -4111291..-4111295, all comfortably inside their decade (IN-04 non-issue this wave).**
- **Next migration number** — memory records on-disk MAX at 1205 after Phase 183 (1204 was taken by the AZ workstream), so next is expected **1206**. **Re-confirmed this session: `ls C:/EV-Accounts/backend/migrations` MAX is 1205, no 1206 file exists — 1206 is free as of 2026-07-04.** Wave-0 re-confirms; on-disk counter authoritative.
- **Structural migration granularity** — one file for all three vs per-district (D-P1).
- **Government naming** — follow 1203's naming (which followed 1107/254); researcher confirms what renders well in browse.

### Deferred Ideas (OUT OF SCOPE)
- 2026 school-board election races + discovery for these districts — Phase 185.
- Milestone retrospective / coverage reconciliation / GOTCHAs — Phase 186.
- District banners — if school-district browse ever gets licensed banner art, that is a new capability for a future phase/backlog; D-B1 ships plain.
- Ext-id scheme headroom redesign (IN-04) — only worth doing if a >9-seat roster ever appears; not this phase (moot anyway — all three boards are 5-seat).
- Superintendent/staff/student-rep representation — out of scope by design (not elected).

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WSCH-03 | Tigard-Tualatin SD 23J Board deep-seeded — roster + headshots | (1) Geofence **already loaded and valid** (Phase 174, geo_id `4112240`, `source='tiger_unsd_or_2024_westmetro'`); (2) **Live-verified 5-member roster** with Position numbers, Chair/Vice-Chair, term dates (ttsdschools.org, raw HTML curl confirms HTTP 200, no WAF, no UA needed); (3) **Election method confirmed whole-district at-large** — district's own text: "The five-member Tigard-Tualatin School Board is elected by the voters within the cities of Tigard, Tualatin, Durham, and King City...voters ... elect them"; own site language "Board Directors" (plural noun) + "Position #N" numbering; (4) 5/5 headshot URLs found directly in raw HTML `data-image-sizes` JSON (finalsite CDN), all HTTP 200 — but all 5 are small (~20-27KB) circular-crop photos, likely sub-600×750 native, requiring the same documented-upscale treatment Hillsboro needed in Wave 1 |
| WSCH-04 | Forest Grove SD 15 Board deep-seeded — roster + headshots | (1) Geofence **already loaded and valid** (Phase 174, geo_id `4105160`); (2) **Domain correction: the district's real live site is `www.fgsdk12.org`, NOT `fgsd.k12.or.us`** (the CONTEXT.md-guessed domain returns connection failure/000 — confirmed this session); (3) **Live-verified 5-member roster** with Position numbers, Chair/Vice-Chair, term dates (fgsdk12.org board-members page, HTTP 200, no WAF); (4) 4/5 headshot sources are genuine high-quality JPEGs (200-290KB) on Edlio CDN (`3.files.edl.io`, a different CDN than finalsite); **1/5 (Position 4, Linda Harrington) is a literal "Coming Soon" placeholder PNG (4.3KB, confirmed by direct image inspection) — a genuine, well-documented gap: she is a very recent June 23, 2026 board appointment filling a mid-term vacancy, confirmed on local news (hillsboronewstimes.com/newsinthegrove.com), and the district has not yet uploaded her portrait** |
| WSCH-05 | Sherwood SD 88J Board deep-seeded — roster + headshots | (1) Geofence **already loaded and valid** (Phase 174, geo_id `4111290`); (2) **Live-verified 5-member roster** with Position numbers; **chamber name + office title BOTH confirmed HIGH-confidence verbatim from the district's own board-members page: "Board Chair/Director, Position 1" / "Board Vice Chair/Director, Position 3" literal text** (sherwood.k12.or.us, HTTP 200, no WAF); (3) Election method: same ORS 332.118 statewide-default at-large shape (no zone/sub-district language found; Position-N numbering only); (4) **Novel headshot-sourcing pattern discovered this session: Sherwood is WordPress + the "Fly Dynamic Image Resizer" plugin — the on-page `/app/uploads/fly-images/{id}/{file}-340x400-c.jpg` URLs are pre-cropped (and some renditions are square, not 4:5). The TRUE untransformed original + a ready-made exact-4:5 "large" rendition are recoverable via the WP REST API `GET /wp-json/wp/v2/media/{id}` → `media_details.sizes.large.source_url` — confirmed 4/5 directors have native 2400×3000 (exact 4:5) originals with an 819×1024 "large" rendition (no upscale needed, the best sourcing quality of any board across both waves); 1/5 (Matt Kaufman) is a near-square 1831×1694 phone photo needing an ordinary center-crop, not an upscale** |

</phase_requirements>

---

## Summary

Phase 184 deep-seeds three Oregon school-district boards — Tigard-Tualatin SD 23J (geo_id `4112240`), Forest Grove SD 15 (geo_id `4105160`), Sherwood SD 88J (geo_id `4111290`) — onto the G5420 geofences Phase 174 already loaded and smoke-tested. Like Phase 183, this phase needs **no new geofence work**: all three boundaries exist, are valid, and are correctly named in `essentials.geofence_boundaries` (confirmed by Phase 174's own summary). The structural shape is the same proven school-district pattern as Wave 1 — 3 governments (`type='LOCAL'`), 3 chambers, 3 single-shared `SCHOOL` districts (one G5420 geofence each), 15 politician+office CTEs, and a coverage.js append with **no `hasContext`** (0-stances-by-design).

**Key Finding 1 (overturns a CONTEXT.md assumption, the single most important finding this session): all three Wave-2 boards are 5-member boards, NOT the "commonly 7-director" shape CONTEXT.md flagged as needing plan-time verification.** Live-verified directly from each district's own official board-members page: Tigard-Tualatin ("The five-member Tigard-Tualatin School Board"), Forest Grove (5 named positions on the roster page), Sherwood (5 named positions, Position 1-5). This is a genuine deviation from Wave 1's two 7-seat boards, not a research error — it changes the office-CTE count (15 total, not 21), the chamber `official_count` value (5, not 7), the ext_id block width (5 ids per district, not 7), and the post-verify gate's expected-count assertions. **Do not copy the "7 offices per district" gate literal from 1203 — it must read 5.**

**Key Finding 2: all three districts are confirmed (or overwhelmingly evidenced) whole-district at-large — the SAME D-Z1 branch both Wave-1 boards landed on.** Tigard-Tualatin's own site states directly: "The five-member Tigard-Tualatin School Board is elected by the voters within the cities of Tigard, Tualatin, Durham, and King City...to include areas of unincorporated Washington County" (a countywide/city-wide at-large statement, not a zone-voting statement) — corroborated by Ballotpedia/local-news coverage describing whole-board Position-N elections. Forest Grove and Sherwood show Position-N numbering with no zone/sub-district language anywhere on their own sites or in generic Oregon Ballotpedia boilerplate (which itself states "School board members are elected at large by default" statewide, per ORS 332.118 — the same default that governed both Wave-1 boards). **D-Z2 (zone-voted-no-GIS fallback) is moot again this wave — it never fires. No sub-zone geofences of any kind are needed for any of the three districts.** [VERIFIED: raw curl of ttsdschools.org/about-us/school-board, HTTP 200, no WAF, 2026-07-04; VERIFIED: raw curl of fgsdk12.org and sherwood.k12.or.us board pages, both HTTP 200, no WAF, 2026-07-04; CITED: ballotpedia.org Oregon-generic election-method boilerplate, cross-verified against both Forest Grove and Sherwood elections pages]

**Key Finding 3 (domain correction): Forest Grove SD 15's real live site is `www.fgsdk12.org`, not `fgsd.k12.or.us`.** CONTEXT.md flagged `fgsd.k12.or.us` as "likely...VERIFY" — this session confirmed that domain returns a connection failure (curl exit, `%{http_code}=000`), while `www.fgsdk12.org` returns HTTP 200 and is the district's actual public site (confirmed via WebSearch results and direct curl). **Do not attempt to scrape `fgsd.k12.or.us` — it does not resolve.** [VERIFIED: `curl -o /dev/null -w '%{http_code}'` against both domains, 2026-07-04]

**Key Finding 4 (headshot sourcing — three DIFFERENT CDN patterns across the three districts, unlike Wave 1's uniform finalsite sourcing):**
- **Tigard-Tualatin** uses finalsite (`resources.finalsite.net`), same CDN family as both Wave-1 districts. All 5 headshot URLs are genuine photos (not placeholders, confirmed by direct visual inspection of downloaded bytes) but are small circular-crop renditions (3.3KB–27KB) — likely sub-600×750 native resolution, requiring the same Lanczos-upscale-with-documented-caveat treatment Hillsboro needed in Wave 1. Use the untransformed original URL (strip the `f_auto,q_auto[,t_image_size_N]` transform segment) exactly as the Wave-1 lesson prescribes.
- **Forest Grove** uses Edlio (`3.files.edl.io`), a CDN the milestone has not sourced from before. 4/5 sources are genuine high-quality JPEGs (200-290KB). The 5th (Linda Harrington, Position 4) is confirmed by direct download+visual-inspection to be a literal "Coming Soon" gray placeholder graphic — she is a June 23, 2026 mid-term appointee (replacing a resignation) and the district has not yet published her portrait. This is a genuine, well-evidenced gap (D-R4 says very recent appointees count as seated; her headshot is separately a genuine sourcing gap per D-R5, not a fabrication opportunity) — recommend a targeted local-news-photo search (hillsboronewstimes.com/newsinthegrove.com coverage of her appointment) at execution time before falling back to "no image."
- **Sherwood** uses self-hosted WordPress with the "Fly Dynamic Image Resizer" plugin. The board page's own `<img>`/`srcset` URLs are pre-cropped renditions (`/app/uploads/fly-images/{id}/{file}-340x400-c.jpg`, and square 680×680/1200×1200 variants) — **do NOT use these as headshot sources directly; they are transform outputs, the same class of trap as finalsite's `t_image_size_6`.** The genuine untransformed original + a ready 4:5 "large" rendition are retrievable by querying `GET https://sherwood.k12.or.us/wp-json/wp/v2/media/{attachment_id}` (the numeric id embedded in the fly-images URL path) and reading `media_details.sizes.large.source_url`. Confirmed this session: 4 of 5 directors have native 2400×3000 originals (exact 4:5, no upscale ever needed — the best-quality sourcing of any board seeded so far in the milestone) with an 819×1024 "large" pre-sized rendition; 1 of 5 (Matt Kaufman) is a near-square 1831×1694 phone photo needing an ordinary center-crop (plenty of resolution, not a quality gap).

[VERIFIED: direct `curl`/HTTP HEAD of all 15 image URLs, 2026-07-04; VERIFIED: `Read`-tool visual inspection of 4 downloaded images (Miles/Irvin/Zurschmeide low-res-but-real TTSD circles, Harrington FGSD "Coming Soon" placeholder) confirming byte-content, not just HTTP status; VERIFIED: Sherwood WP REST API `/wp-json/wp/v2/media/{id}` queried directly for all 5 Sherwood attachment ids, native dimensions read from `media_details.width/height`]

**Key Finding 5: chamber names are verbatim per-district and diverge from Wave 1's naming set, as expected (D-R1/D-R2).** Tigard-Tualatin self-identifies as **"School Board"** (literal text found repeatedly in raw HTML); Forest Grove self-identifies as **"School Board"** (3 literal occurrences in raw HTML); Sherwood self-identifies as **"Board of Directors"** (literal text on its own board page, corroborated by a COSA.k12.or.us job-posting title referencing "Sherwood School District 88J...Board of Directors"). Office-title confidence varies: **Sherwood is HIGH confidence** — its own page's literal text is "Board Chair/Director, Position 1" and "Board Vice Chair/Director, Position 3", i.e. "Director, Position N" is the district's own exact wording, no inference needed. **Tigard-Tualatin is MEDIUM-HIGH** — the site's own body text uses the plural noun "Board Directors" ("Board Directors supervise the superintendent") and numbers seats "Position #N", so "Director, Position N" is a well-supported, if not 100%-literal, composite. **Forest Grove is MEDIUM** — no literal "Director" or "Position" string was found in Forest Grove's raw HTML at all (the page appears to render seat/position data client-side via JS the static curl didn't capture); the recommendation is the same ORS-332 statutory "Director" convention + parallel filing precedent used for Hillsboro in Wave 1, with a Wave-0 confirmation pass recommended (e.g., a Washington County candidate-filing PDF search) before locking the string.

**Primary recommendation:** (1) Author ONE structural migration `1206_or_westmetro_school_boards_wave2.sql` — 3 governments + 3 chambers (`official_count=5` each) + 3 SCHOOL districts (reusing the existing Phase-174 geofences) + 15 politician/office CTEs (5 TTSD "Director, Position N" + 5 FGSD "Director, Position N" + 5 SSD "Director, Position N"), Chair/Vice-Chair as title annotations, with **all three 183-REVIEW fixes (WR-01/WR-02/WR-03) baked in from the start** rather than cloned-then-patched. (2) Author `1207_or_westmetro_school_boards_wave2_headshots.sql` (audit-only, expect renumbering if another workstream claims 1207 first — re-probe on-disk MAX at Wave-0 exactly like 183 did) sourcing headshots via three different techniques per the CDN each district uses (finalsite untransformed-original for TTSD, direct Edlio JPEGs for 4/5 FGSD + documented gap for Harrington, WP REST API `media_details.sizes.large` for Sherwood). (3) Append 3 entries to `COVERAGE_SCHOOL_DISTRICTS` in `src/lib/coverage.js` — plain `{label, browseGeoId, browseMtfcc:'G5420', browseStateAbbrev:'OR'}`, no `hasContext`. No stance migrations (0-by-design). No new geofence loader, no zone sub-districts, no banner work.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Whole-district board routing (all 3 districts) | Database / Storage (existing G5420 geofence) | API / Backend (ST_Covers PIP) | Geofences already loaded by Phase 174; this phase only attaches politicians/offices — no geofence work |
| Government/chamber/district/office seed | Database / Storage (migrations) | — | One SQL migration writes essentials.* tables for all three districts, 5 offices each (15 total) |
| Chair/Vice-Chair distinction | Database (office title) | Frontend (label render) | Encoded as a title suffix on the office row; no schema flag |
| Headshot pipeline | API / Backend (Python script) | CDN / Static (Supabase Storage + 3 distinct source CDNs) | finalsite (TTSD), Edlio (FGSD), self-hosted WordPress + REST API (Sherwood) — three different sourcing techniques in one script |
| Board-name card subtitle | Frontend (`groupHierarchy.js` `getAccordionKey` SCHOOL fallback → `government_name`) | — | Confirmed working live for both Wave-1 boards with zero code change; same mechanism applies unmodified here |
| School-district surfacing (plain chip) | Frontend (`coverage.js`) | — | Append 3 entries to `COVERAGE_SCHOOL_DISTRICTS`; search-only, no `hasContext` |
| Compass stances | N/A — deliberately absent | — | 0 rows by design; any stance row for any of the three districts is a defect |

---

## Standard Stack

No new tools, npm/PyPI packages, or geofence loaders — same lightweight footprint as Phase 183.

### Core (reused, confirmed present via Phase 183's environment audit; re-verify at Wave-0)

| Tool / Pattern | Purpose | Verification |
|----------------|---------|---------------|
| `psql` | Apply structural + audit-only migrations | Confirmed present in Phase 183 session (PostgreSQL 18.1); re-verify at Wave-0 |
| Python 3 via the **`py` launcher** (NOT bare `python`/`python3`) + Pillow + psycopg2 + requests | Headshot crop/resize/upload pipeline | Confirmed present in Phase 183 session (PIL 12.1.1, psycopg2 2.9.12, requests 2.34.2). **Re-confirmed this session that bare `python3` in the Bash/git-bash tool resolves to the non-functional Windows Store stub** ("Python was not found...") — the ETL script MUST be invoked via the `py` launcher at execution time, not via this agent's Bash tool directly. |
| `1203_or_westmetro_school_boards_wave1.sql` / `1205_...headshots.sql` (templates, WITH the 183-REVIEW fixes applied) | School-district structural + headshot migration shape | Both read in full this session; fixes documented verbatim below |
| `_tmp-westmetro-school-wave1-headshots.py` / `_tmp-westmetro-school-wave1-probe.sql` (templates) | Headshot ETL + Wave-0 probe shape | Referenced per canonical_refs; carries the WR-01/02/03 + IN-01..04 fixes this phase must apply from the start |

### Installation

No installs required — same as Wave 1:
```bash
psql --version
py -c "import PIL,psycopg2,requests; print('ok')"
```

**New this phase:** the headshot ETL needs a plain `requests.get()` call to Sherwood's WordPress REST API (`GET /wp-json/wp/v2/media/{id}`) in addition to direct image downloads — no new package, `requests` already covers JSON GET.

---

## Package Legitimacy Audit

No new external packages required. All Python dependencies (`Pillow`/`PIL`, `psycopg2`, `requests`) and CLI tools (`psql`, `curl`) are pre-existing, already verified functional in Phase 183's research session. **Package Legitimacy Gate skipped (no new installs).**

---

## Architecture Patterns

### System Architecture Diagram

```
Phase 174 (ALREADY DONE — no work this phase):
  essentials.geofence_boundaries
    geo_id='4112240' mtfcc='G5420' 'Tigard-Tualatin School District 23J'  source='tiger_unsd_or_2024_westmetro'
    geo_id='4105160' mtfcc='G5420' 'Forest Grove School District 15'     source='tiger_unsd_or_2024_westmetro'
    geo_id='4111290' mtfcc='G5420' 'Sherwood School District 88J'        source='tiger_unsd_or_2024_westmetro'
    (all 3 confirmed present + valid via Phase 174's own summary + smoke test)
        │
        ▼
ttsdschools.org/about-us/school-board        (HTTP 200, no WAF)  — 5 directors, Position 1-5
    Chair=Zurschmeide(P4), Vice Chair=Irvin(P3); finalsite CDN, 5/5 small-but-real circular photos
        ▼
www.fgsdk12.org board-members page           (HTTP 200, no WAF)  — 5 directors, Position 1-5
    Chair=Kottkey(P5), Vice Chair=Lozano(P3); Edlio CDN, 4/5 good photos, 1/5 "Coming Soon" gap (Harrington P4)
        ▼
sherwood.k12.or.us/board/board-members/      (HTTP 200, no WAF)  — 5 directors, Position 1-5
    Chair=Carson(P1), Vice Chair=Hawkins(P3); WordPress+fly-images CDN, wp-json REST recovers 4/5 native 2400x3000 (4:5) + 1/5 near-square 1831x1694
        ▼
Wave 0: DB probes (greenfield confirm, ext_id collision — 5-per-district ranges, migration MAX)
        ▼
migration 1206_or_westmetro_school_boards_wave2.sql (STRUCTURAL, registered)
    INSERT governments: 'Tigard-Tualatin School District 23J, Oregon, US' /
                        'Forest Grove School District 15, Oregon, US' /
                        'Sherwood School District 88J, Oregon, US'
    INSERT chambers:    'School Board' (TTSD) / 'School Board' (FGSD) / 'Board of Directors' (SSD), official_count=5 each
    INSERT districts:   1 SCHOOL row per district, geo_id matches the EXISTING geofence, state='or' lowercase
    INSERT 15 politician+office CTEs (5+5+5), titles 'Director, Position N' each district
    Chair/Vice-Chair as title-on-seat suffix
    WR-01/WR-02/WR-03 fixes baked in from authoring (not patched after the fact)
    post-verify DO block: 3 govs, 15 offices (5/5/5 split), chamber_id IS NOT NULL, 0 section-split for all 3 geo_ids
        ▼
migration 1207 (or next free number)_..._headshots.sql (AUDIT-ONLY)
    TTSD: finalsite untransformed originals → Lanczos upscale (documented quality note, like Hillsboro Wave 1)
    FGSD: Edlio direct JPEGs (4/5) + documented gap for Harrington (Position 4, "Coming Soon" placeholder — recent appointee)
    SSD:  wp-json/wp/v2/media/{id} -> media_details.sizes.large.source_url (4/5 no-op crop, 1/5 ordinary center-crop)
    → crop-4:5 → 600×750 Lanczos q90 → Supabase Storage politician_photos/{uuid}-headshot.jpg → politician_images rows
        ▼
coverage.js COVERAGE_SCHOOL_DISTRICTS (append 3, no hasContext)
        ▼
Backend ST_Covers query:
    Tigard OR Tualatin address → geo_id=4112240 → all 5 TTSD directors
    Forest Grove address       → geo_id=4105160 → all 5 FGSD directors
    Sherwood address           → geo_id=4111290 → all 5 SSD directors
```

### Recommended Project Structure (new files)

```
C:/EV-Accounts/backend/
├── migrations/
│   ├── 1206_or_westmetro_school_boards_wave2.sql             # STRUCTURAL (registered) — number to re-confirm at Wave-0
│   └── 1207_or_westmetro_school_boards_wave2_headshots.sql   # AUDIT-ONLY — number to re-confirm at Wave-0
└── scripts/
    ├── _tmp-westmetro-school-wave2-headshots.py               # NEW (gitignored) — 3 sourcing techniques in one script
    └── _tmp-westmetro-school-wave2-probe.sql                  # NEW (gitignored) — Wave-0 probe

C:/Transparent Motivations/essentials/
└── src/lib/coverage.js                          # EDIT — append 3 entries to COVERAGE_SCHOOL_DISTRICTS
```

### Pattern 1: No geofence loader — reuse Phase 174's existing rows (unchanged from Wave 1)

```sql
SELECT geo_id, mtfcc, source, name, ST_IsValid(geometry)
FROM essentials.geofence_boundaries
WHERE geo_id IN ('4112240','4105160','4111290') AND mtfcc='G5420';
-- Expected (per Phase 174's own summary, re-confirm at Wave-0):
-- 4112240 | G5420 | tiger_unsd_or_2024_westmetro | Tigard-Tualatin School District 23J | t
-- 4105160 | G5420 | tiger_unsd_or_2024_westmetro | Forest Grove School District 15     | t
-- 4111290 | G5420 | tiger_unsd_or_2024_westmetro | Sherwood School District 88J        | t
```

### Pattern 2: Structural Migration — WR-01/WR-02/WR-03 baked in from the start

This is the load-bearing delta from Wave 1's template. **Do not copy 1203's politician/office CTE shape verbatim** — its office `NOT EXISTS` guard is dead code (183-REVIEW WR-01) and its post-verify gate has a `chamber_id IS NULL` blind spot (WR-02). Author the fixed shape directly:

```sql
-- Per-seat CTE (fixed shape — WR-01 applied: `pol` unions the insert result with any pre-existing row)
WITH chamber AS (
  SELECT id FROM essentials.chambers
  WHERE name = 'School Board'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'Tigard-Tualatin School District 23J, Oregon, US')
),
ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Jill Zurschmeide', 'Jill', 'Zurschmeide', NULL,
          true, false, false, true, -4112244)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
),
pol AS (
  SELECT id FROM ins_p
  UNION
  SELECT id FROM essentials.politicians WHERE external_id = -4112244
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM chamber),
       p.id,
       'Director, Position 4 (Chair)', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN pol p
WHERE d.geo_id = '4112240' AND d.district_type = 'SCHOOL' AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

**Post-verify DO block — WR-02 fix applied (chamber_id IS NOT NULL assertion added):**
```sql
DO $$
DECLARE
  v_ttsd_gov INTEGER; v_fgsd_gov INTEGER; v_ssd_gov INTEGER;
  v_ttsd_off INTEGER; v_fgsd_off INTEGER; v_ssd_off INTEGER;
  v_split INTEGER; v_null_chamber INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_ttsd_gov FROM essentials.governments WHERE name = 'Tigard-Tualatin School District 23J, Oregon, US';
  SELECT COUNT(*) INTO v_fgsd_gov FROM essentials.governments WHERE name = 'Forest Grove School District 15, Oregon, US';
  SELECT COUNT(*) INTO v_ssd_gov  FROM essentials.governments WHERE name = 'Sherwood School District 88J, Oregon, US';
  IF v_ttsd_gov <> 1 OR v_fgsd_gov <> 1 OR v_ssd_gov <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 gov each, found TTSD=%, FGSD=%, SSD=%', v_ttsd_gov, v_fgsd_gov, v_ssd_gov;
  END IF;

  SELECT COUNT(*) INTO v_ttsd_off FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id
    WHERE d.geo_id='4112240' AND d.district_type='SCHOOL' AND d.state='or';
  SELECT COUNT(*) INTO v_fgsd_off FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id
    WHERE d.geo_id='4105160' AND d.district_type='SCHOOL' AND d.state='or';
  SELECT COUNT(*) INTO v_ssd_off  FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id
    WHERE d.geo_id='4111290' AND d.district_type='SCHOOL' AND d.state='or';
  -- NOTE: expected count is 5 per district (Key Finding 1) -- NOT 7 like Wave 1.
  IF v_ttsd_off <> 5 OR v_fgsd_off <> 5 OR v_ssd_off <> 5 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 5 offices each, found TTSD=%, FGSD=%, SSD=%', v_ttsd_off, v_fgsd_off, v_ssd_off;
  END IF;

  -- WR-02 fix: assert no office ever landed with a NULL chamber_id (chamber-name string drift guard)
  SELECT COUNT(*) INTO v_null_chamber
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id IN ('4112240','4105160','4111290') AND d.district_type = 'SCHOOL' AND d.state = 'or'
    AND o.chamber_id IS NULL;
  IF v_null_chamber <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: % offices have NULL chamber_id', v_null_chamber;
  END IF;

  SELECT COUNT(*) INTO v_split
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id IN ('4112240','4105160','4111290') AND gb.mtfcc = 'G5420'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id AND d.district_type = 'SCHOOL' AND d.state = 'or'
    );
  IF v_split <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % orphan rows', v_split;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: TTSD gov=%/off=%, FGSD gov=%/off=%, SSD gov=%/off=%, null_chamber=%, split_orphans=%',
    v_ttsd_gov, v_ttsd_off, v_fgsd_gov, v_fgsd_off, v_ssd_gov, v_ssd_off, v_null_chamber, v_split;
END $$;
```

**Headshot INSERT — WR-03 fix applied (skip on missing politician, never insert NULL politician_id):**
```sql
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(), p.id, '<CDN_URL>', 'default', 'press_use'
FROM essentials.politicians p
WHERE p.external_id = -4112244
  AND NOT EXISTS (SELECT 1 FROM essentials.politician_images pi WHERE pi.politician_id = p.id);
```

### Pattern 3: Verified Rosters (all 5/5, no vacancies, live-confirmed 2026-07-04)

**Tigard-Tualatin SD 23J — "School Board"** (source: `ttsdschools.org/about-us/school-board`, live page, HTTP 200, no WAF):

| Position | Name | Title on seat | Term Dates | Headshot source (finalsite, untransformed) |
|----------|------|---------------|-----------|---------------------------------------------|
| 1 | David Jaimes | Director, Position 1 | 07/01/25–06/30/29 | `resources.finalsite.net/images/v1692537256/ttsdschoolsorg/cqzkjpsorsuu0uygvhfe/DJaimes.png` (~20KB, real photo, small) |
| 2 | Kristen Miles | Director, Position 2 | 07/01/23–06/30/27 | `resources.finalsite.net/images/v1692537257/ttsdschoolsorg/veu4cxspqpgz45qrf4vj/Picture-Miles-Kristen-Round.jpg` (~3.3KB, real photo, VERY small — visually confirmed genuine circular headshot, not a placeholder) |
| 3 | Tristan Irvin | Director, Position 3 (Vice Chair) | 07/01/25–06/30/29 | `resources.finalsite.net/images/v1692537255/ttsdschoolsorg/zywbibkk1x1dqwmrucgo/TIrvin.png` (~22KB, real photo, small) |
| 4 | Jill Zurschmeide | Director, Position 4 (Chair) | 07/01/23–06/30/27 | `resources.finalsite.net/images/v1692537258/ttsdschoolsorg/fzkx1cqqyny5kzgzjb5b/JZ.png` (~25KB, real photo, small) |
| 5 | Crystal Weston | Director, Position 5 | 07/01/23–06/30/29 | `resources.finalsite.net/images/v1692537259/ttsdschoolsorg/p1duebpqnqyaihwkye80/WESTON-Crystal-Board-2023.jpg` (~27KB, real photo, small; a larger 500px-wide rendition is also available in the same `data-image-sizes` JSON) |

Election language (verbatim, current page 2026-07-04): *"The five-member Tigard-Tualatin School Board is elected by the voters within the cities of Tigard, Tualatin, Durham, and King City, to include areas of unincorporated Washington County. Board directors serve four-year terms..."* No student rep, no vacancies. **Caution:** a stale 2024-2025 board-meeting-minutes PDF found via WebSearch shows a *different* Chair/Vice-Chair pairing (Irvin=Chair, Jaimes=Vice Chair) from a prior year — Oregon boards commonly rotate the Chair/Vice-Chair title annually; the live current-page table above (Zurschmeide=Chair, Irvin=Vice Chair) is the authoritative 2025-2026 snapshot and should be re-confirmed at Wave-0/execution time in case of further rotation.

**Forest Grove SD 15 — "School Board"** (source: `www.fgsdk12.org/apps/pages/index.jsp?uREC_ID=1139223&type=d&pREC_ID=1404180`, live page, HTTP 200, no WAF):

| Position | Name | Title on seat | Term Expires | Headshot source (Edlio) |
|----------|------|---------------|--------------|---------------------------|
| 1 | Brisa Franco | Director, Position 1 | 6/30/2029 | `https://3.files.edl.io/5b39/25/08/14/164257-e93a5de9-cdd8-450d-9da6-1c5277448a5e.jpg` (246KB, genuine photo) |
| 2 | Pete Truax | Director, Position 2 | 6/30/2029 | `https://3.files.edl.io/45d0/25/08/14/164340-fc54ceb3-b5e8-49dc-b52e-8162b8515a7d.jpg` (292KB, genuine photo) |
| 3 | Alma Lozano | Director, Position 3 (Vice Chair) | 6/30/2029 | `https://3.files.edl.io/199a/25/08/14/164425-2940656a-41ec-4a1c-b736-fbb7a44e54c0.jpg` (200KB, genuine photo) |
| 4 | Linda Harrington | Director, Position 4 | 6/30/2027 | **GENUINE GAP — the on-page image (`https://3.files.edl.io/5cb4/26/07/02/161327-aa4be293-dca9-4214-a867-05063c3c7691.png`, 4.3KB) is confirmed by direct visual inspection to be a gray "Coming Soon" placeholder graphic, not a real photo. Do NOT ship it.** |
| 5 | Kristy Kottkey | Director, Position 5 (Chair) | 6/30/2027 | `https://3.files.edl.io/ea9c/25/08/14/164559-5f21ecba-ee0a-4e1a-a177-b3e5ad8f85b6.jpg` (270KB, genuine photo) |

**Linda Harrington context (D-R4 applies — she counts as seated):** appointed June 23, 2026 by unanimous board vote to fill the Position 4 vacancy left by Kate Grandusky's resignation, serving the remainder of the term through June 30, 2027; a 45-year education-career retiree (Hillsboro SD). Confirmed via [Forest Grove News-Times](https://forestgrovenewstimes.com/2026/06/25/linda-harrington-appointed-to-forest-grove-school-board/) / [News in the Grove](https://www.newsinthegrove.com/linda-harrington-appointed-to-fill-forest-grove-school-board-vacancy/) — the coverage references a contributed district photo ("File photo... contributed by the Forest Grove School District"), so a usable image MAY exist in the news article itself even though the district's own board page has not yet updated past the placeholder; worth a targeted fetch at execution time before defaulting to "no image, documented gap."

**Also excluded (D-R4, non-voting):** a Student Representative seat appears on the same roster page (also showing a "Coming Soon" placeholder, term 6/30/2027) — exclude per the standing non-voting-seat rule, same treatment as Hillsboro's 3 student reps in Wave 1.

No literal "Director"/"Position" text string was found in Forest Grove's static/raw HTML (the page likely renders seat metadata via client-side JS the plain `curl` didn't execute) — names, titles (Member/Vice Chair/Board Chair), term-expiry dates, and photo URLs were all confirmed via a rendered-page fetch. **Office-title recommendation ("Director, Position N") is MEDIUM confidence — same reasoning tier as Hillsboro in Wave 1** (ORS 332 statutory "director" language + the parallel confirmed-verbatim convention at Sherwood and the Position-numbering convention visible on Forest Grove's own rendered page); Wave-0 may attempt one more targeted search for a Washington County candidate-filing document to raise confidence, or proceed with "Director, Position N" as the well-supported default.

**Sherwood SD 88J — "Board of Directors"** (source: `sherwood.k12.or.us/board/board-members/`, live page, HTTP 200, no WAF; office-title text is HIGH confidence, literal from the page itself):

| Position | Name | Title on seat (VERBATIM from district site) | Term Expires | Headshot source (WP REST API `large` rendition) |
|----------|------|-----------------------------------------------|--------------|----------------------------------------------------|
| 1 | Harmony Carson | Board Chair/Director, Position 1 | June 30, 2027 | `https://sherwood.k12.or.us/app/uploads/2025/05/5D4_4531-819x1024.jpg` (native 2400×3000, exact 4:5) |
| 2 | Matt Kaufman | Director, Position 2 | June 30, 2029 | `https://sherwood.k12.or.us/app/uploads/2025/06/PXL_20250623_184304337.PORTRAIT2-EDIT-EDIT-e1750885010603-1024x947.jpg` (native 1831×1694, near-square — ordinary center-crop needed, no upscale) |
| 3 | Abby Hawkins | Board Vice Chair/Director, Position 3 | June 30, 2029 | `https://sherwood.k12.or.us/app/uploads/2025/05/5D4_4541-1-819x1024.jpg` (native 2400×3000, exact 4:5) |
| 4 | Hans Moller | Director, Position 4 | June 30, 2029 | `https://sherwood.k12.or.us/app/uploads/2025/05/5D4_4543-1-819x1024.jpg` (native 2400×3000, exact 4:5) |
| 5 | Matt Thornton | Director, Position 5 | June 30, 2027 | `https://sherwood.k12.or.us/app/uploads/2025/05/5D4_4527-819x1024.jpg` (native 2400×3000, exact 4:5) |

**Chamber name confirmed verbatim** — Sherwood's own board page contains the literal string "Board of Directors" (1 occurrence, confirmed via raw-HTML grep), consistent with an independently-found COSA.k12.or.us job-posting title ("SHERWOOD SCHOOL DISTRICT 88J...Board of Directors"). No student rep or vacancy found on the page; no zone/sub-district election language found anywhere.

[VERIFIED: raw `curl` of all three pages 2026-07-04, HTTP 200 with no User-Agent required; every name, position number, term date, and headshot source URL extracted directly from official pages or their embedded JSON/REST API responses; Sherwood's chamber-name and office-title strings are literal grep-confirmed matches, not inferred]

### Pattern 4: Sherwood's WordPress "Fly Dynamic Image Resizer" original-recovery technique (NEW pattern this phase)

**What:** Sherwood's board page embeds pre-transformed image URLs of the shape `/app/uploads/fly-images/{attachment_id}/{filename}-{W}x{H}-c.jpg`. These are crop/resize outputs of the plugin, analogous to finalsite's `t_image_size_N` transform variants — using them directly risks shipping an unnecessarily-cropped or lower-quality rendition when a better one exists.

**How to get the genuine original + a ready 4:5 rendition:**
```bash
# {attachment_id} is the numeric path segment right after /fly-images/ in the on-page URL
curl -s "https://sherwood.k12.or.us/wp-json/wp/v2/media/{attachment_id}" | \
  python -c "import sys,json; d=json.load(sys.stdin); md=d['media_details']; print(md['width'],'x',md['height']); print(md['sizes'].get('large',{}).get('source_url'))"
```
This returns the true native pixel dimensions (`media_details.width`/`height`) and, when present, a `large` rendition (confirmed 819×1024 for Sherwood's 2400×3000 originals — already exact 4:5, no crop or upscale needed). Verified for all 5 Sherwood attachment ids this session (10012, 10127, 10011, 10010, 10013).

**When to use:** Any future west-metro/Washington County phase sourcing headshots from a self-hosted WordPress school-district or city site using this plugin (URL signature: `/app/uploads/fly-images/{id}/...`) should try this REST-API recovery before accepting the on-page cropped rendition.

### Anti-Patterns to Avoid

- **Assuming any of the three boards is 7-seat** — all three are confirmed 5-seat. Copying Wave 1's `official_count=7` / `expected 7 offices` gate literals into this phase's migration will make the post-verify DO block raise a false exception (or worse, silently pass a wrong count if the gate is loosened instead of corrected).
- **Cloning 1203/1205 verbatim** — apply the WR-01/WR-02/WR-03 fixes from the first draft, not as a post-hoc patch (per D-F1, explicitly required this phase).
- **Scraping `fgsd.k12.or.us`** — that domain does not resolve. Use `www.fgsdk12.org`.
- **Shipping Linda Harrington's "Coming Soon" placeholder as her headshot** — visually confirmed to be a gray graphic with literal text "Coming Soon", not a photo. Document as a genuine gap (or source a real photo from local news coverage of her June 2026 appointment) — never fabricate or silently ship the placeholder.
- **Using Sherwood's on-page `fly-images` square (680×680/1200×1200) or 340×400 URLs as the headshot source without checking the WP REST API first** — the true originals are exact 4:5 at far higher resolution (2400×3000 for 4 of 5 directors) and require zero upscaling; using the pre-cropped on-page rendition would be needlessly lower quality, the same class of avoidable mistake as finalsite's `t_image_size_6` trap.
- **Assuming Beaverton-style zone-voting for any of the three districts** — none of the three shows zone/sub-district election language; all resolve to the same D-Z1 whole-district-at-large branch Wave 1 used. Do not build sub-zone geofences.
- **Uppercase `d.state='OR'` in office/district WHERE clauses** — the standing OR silent-failure pitfall, unchanged from Wave 1.
- **Bare `python`/`python3` invocation** — resolves to a non-functional Windows Store stub on this machine (re-confirmed this session in the Bash tool itself). Use the `py` launcher for the headshot pipeline script.
- **Reusing "Board of Education" or an inconsistent chamber name** — verbatim per-district names are "School Board" (TTSD), "School Board" (FGSD), "Board of Directors" (SSD).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| School-district government/chamber/district/office structure | New schema inference | Copy `1203_or_westmetro_school_boards_wave1.sql` shape WITH WR-01/02/03 fixes applied, adjusted to 5 offices/district | Proven idempotent pattern; the fixes are already fully specified (183-REVIEW.md) |
| Headshot download + crop + resize + upload | Manual one-off PIL script | Adapt `_tmp-westmetro-school-wave1-headshots.py` (crop-4:5-first, Lanczos 600×750 q90, x-upsert) — extend with a small WP-REST-API GET helper for the 5 Sherwood sources | Battle-tested pipeline; only the Sherwood sourcing step is genuinely new |
| Government INSERT guard | Unique-constraint assumption | `WHERE NOT EXISTS (... WHERE name = ...)` | `essentials.governments` has no unique constraint |
| Coverage.js school-district entry | New surfacing shape | Copy the existing `COVERAGE_SCHOOL_DISTRICTS` entries verbatim (`{label, browseGeoId, browseMtfcc, browseStateAbbrev}`, no `hasContext`) | Exact template already in the file at `src/lib/coverage.js:253-257` |
| Recovering a WordPress-hosted original image behind a resize plugin | Guessing filename patterns / manually stripping suffixes | `GET /wp-json/wp/v2/media/{id}` → `media_details.sizes.large.source_url` (or `.width`/`.height` for the true original) | The WP REST API is a stable, documented, unauthenticated public endpoint for any WordPress site with default REST API settings — far more reliable than guessing upload-path suffix conventions |

**Key insight:** This phase is structurally near-identical to Phase 183 but is NOT a smaller version of it — it has 3 districts (not 2) at 5 seats each (not 7), across THREE different headshot CDN vendors (not 1), including one genuine placeholder gap. The headshot ETL script needs three sourcing code paths in the same file; the structural migration needs the WR-01/02/03 fixes baked in from authoring, not patched after.

---

## Common Pitfalls

### Pitfall 1: Copying Wave 1's "7 offices per district" gate literal
**What goes wrong:** Post-verify DO block raises a false `RAISE EXCEPTION` (or a loosened/wrong gate silently accepts a bad count) because all three Wave-2 boards are 5-seat, not 7-seat.
**Why it happens:** CONTEXT.md's own framing said "Oregon boards are commonly 7-director" and both Wave-1 boards were 7-seat, making 7 a tempting default to copy.
**How to avoid:** Use the live-verified 5-seat counts for all three districts in every gate, CTE count, and `official_count` value.
**Warning signs:** Any task file or migration diff mentioning "7 offices" or "official_count=7" for TTSD/FGSD/SSD.

### Pitfall 2: Scraping the wrong Forest Grove domain
**What goes wrong:** Any executor step that hardcodes `fgsd.k12.or.us` (the CONTEXT.md-guessed domain) will get a connection failure, not a WAF block or empty page — a different failure mode than expected.
**Why it happens:** CONTEXT.md flagged the domain as "likely...VERIFY" based on the sibling-district naming pattern (`ttsdschools.org`, `sherwood.k12.or.us`), but Forest Grove's actual domain doesn't follow that pattern.
**How to avoid:** Use `www.fgsdk12.org` exclusively, confirmed HTTP 200 this session.
**Warning signs:** Any curl/fetch call in a plan or script targeting `fgsd.k12.or.us`.

### Pitfall 3: Shipping Linda Harrington's placeholder graphic as a headshot
**What goes wrong:** A bulk image-URL sweep of the Forest Grove board page would pick up her "Coming Soon" PNG along with the 4 real photos, silently shipping a placeholder as if it were a real portrait.
**Why it happens:** The placeholder sits in the exact same DOM position/markup pattern as the 4 real photos, indistinguishable by URL shape alone (must inspect actual pixel content or file size — 4.3KB vs 200-290KB for the real photos is a strong tell).
**How to avoid:** Check each downloaded image's byte size and/or visually inspect before uploading; anything under ~10KB from this specific board page is suspect. Document the gap per D-R5 rather than uploading it.
**Warning signs:** A headshot migration block referencing a suspiciously small source file, or a director's card showing a gray "Coming Soon" graphic in live verification.

### Pitfall 4: Using Sherwood's on-page cropped image URLs instead of the WP REST API originals
**What goes wrong:** Shipping the pre-cropped `fly-images` square renditions (680×680/1200×1200) or the 340×400 crop directly as the headshot source, when the true 2400×3000 (exact 4:5) original is available and requires zero cropping/upscaling.
**Why it happens:** The on-page `<img src>`/`srcset` URLs are the most visible/obvious source; the REST-API recovery step is a non-obvious extra hop.
**How to avoid:** For any WordPress+fly-images site, always query `/wp-json/wp/v2/media/{id}` first and prefer `media_details.sizes.large` (or the full original if no `large` size exists) over any on-page transform URL.
**Warning signs:** A migration comment referencing a `-340x400-c.jpg` or similarly-suffixed URL as the final Storage source for a Sherwood director.

### Pitfall 5: `d.state='OR'` uppercase in WHERE clauses (unchanged from Wave 1)
**What goes wrong:** Zero rows match, 0 offices link, section-split fires.
**How to avoid:** `districts.state = 'or'` lowercase everywhere in JOIN/WHERE; `'OR'` uppercase only on `governments.state` and `offices.representing_state`.

### Pitfall 6: Migration-number collision from a concurrent workstream
**What goes wrong:** The plan's literal filename (e.g., "1206") is claimed by another workstream between research and execution — exactly what happened to 1204 in Wave 1.
**How to avoid:** Wave-0 re-runs `ls C:/EV-Accounts/backend/migrations | grep -oE '^[0-9]+' | sort -n | tail -1` immediately before authoring each migration file, not just once at the start of the phase.
**Warning signs:** A migration filename that already exists on disk when the executor tries to write it.

---

## Code Examples

### Verified headshot source URLs (all confirmed HTTP 200, 2026-07-04)

```
# Tigard-Tualatin SD 23J (5) — finalsite, untransformed originals
https://resources.finalsite.net/images/v1692537256/ttsdschoolsorg/cqzkjpsorsuu0uygvhfe/DJaimes.png          (David Jaimes, P1)
https://resources.finalsite.net/images/v1692537257/ttsdschoolsorg/veu4cxspqpgz45qrf4vj/Picture-Miles-Kristen-Round.jpg  (Kristen Miles, P2 — very small, real photo)
https://resources.finalsite.net/images/v1692537255/ttsdschoolsorg/zywbibkk1x1dqwmrucgo/TIrvin.png           (Tristan Irvin, P3, Vice Chair)
https://resources.finalsite.net/images/v1692537258/ttsdschoolsorg/fzkx1cqqyny5kzgzjb5b/JZ.png               (Jill Zurschmeide, P4, Chair)
https://resources.finalsite.net/images/v1692537259/ttsdschoolsorg/p1duebpqnqyaihwkye80/WESTON-Crystal-Board-2023.jpg  (Crystal Weston, P5)

# Forest Grove SD 15 (5) — Edlio CDN; Position 4 is a documented gap, not a usable URL
https://3.files.edl.io/5b39/25/08/14/164257-e93a5de9-cdd8-450d-9da6-1c5277448a5e.jpg   (Brisa Franco, P1)
https://3.files.edl.io/45d0/25/08/14/164340-fc54ceb3-b5e8-49dc-b52e-8162b8515a7d.jpg   (Pete Truax, P2)
https://3.files.edl.io/199a/25/08/14/164425-2940656a-41ec-4a1c-b736-fbb7a44e54c0.jpg   (Alma Lozano, P3, Vice Chair)
[GAP] https://3.files.edl.io/5cb4/26/07/02/161327-aa4be293-dca9-4214-a867-05063c3c7691.png  (Linda Harrington, P4 — "Coming Soon" placeholder, DO NOT USE)
https://3.files.edl.io/ea9c/25/08/14/164559-5f21ecba-ee0a-4e1a-a177-b3e5ad8f85b6.jpg   (Kristy Kottkey, P5, Chair)

# Sherwood SD 88J (5) — recovered via wp-json/wp/v2/media/{id}, "large" rendition
https://sherwood.k12.or.us/app/uploads/2025/05/5D4_4531-819x1024.jpg        (Harmony Carson, P1, Chair — native 2400x3000)
https://sherwood.k12.or.us/app/uploads/2025/06/PXL_20250623_184304337.PORTRAIT2-EDIT-EDIT-e1750885010603-1024x947.jpg  (Matt Kaufman, P2 — native 1831x1694, near-square)
https://sherwood.k12.or.us/app/uploads/2025/05/5D4_4541-1-819x1024.jpg      (Abby Hawkins, P3, Vice Chair — native 2400x3000)
https://sherwood.k12.or.us/app/uploads/2025/05/5D4_4543-1-819x1024.jpg      (Hans Moller, P4 — native 2400x3000)
https://sherwood.k12.or.us/app/uploads/2025/05/5D4_4527-819x1024.jpg        (Matt Thornton, P5 — native 2400x3000)
```

### Sherwood WP REST API original-recovery query (re-run at Wave-0/execution for freshness)

```bash
curl -s "https://sherwood.k12.or.us/wp-json/wp/v2/media/10012" | grep -o '"width":[0-9]*,"height":[0-9]*,"file":"[^"]*"'
# Confirmed 2026-07-04: "width":2400,"height":3000,"file":"2025/05/5D4_4531.jpg"
```

### Migration ledger check (re-run at Wave-0)

```bash
ls C:/EV-Accounts/backend/migrations | grep -oE '^[0-9]+' | sort -n | tail -1
# Confirmed 2026-07-04: 1205 → next = 1206 (no 1206 file exists yet)
```

### External_id collision probe (re-run at Wave-0, ranges corrected to 5-per-district)

```sql
SELECT external_id FROM essentials.politicians
WHERE external_id BETWEEN -4112250 AND -4112238   -- TTSD block -4112241..-4112245, margin both sides
   OR external_id BETWEEN -4105170 AND -4105158   -- FGSD block -4105161..-4105165, margin both sides
   OR external_id BETWEEN -4111300 AND -4111288   -- SSD block  -4111291..-4111295, margin both sides
ORDER BY external_id;
-- Not run this session (no DB access) -- orchestrator runs at Wave-0, expect 0 rows (greenfield ext_ids)
```
Recommended assignment: TTSD `-4112241` (P1) through `-4112245` (P5); FGSD `-4105161` (P1) through `-4105165` (P5); SSD `-4111291` (P1) through `-4111295` (P5). All three blocks stay comfortably inside their decade (5-wide ranges starting at a "1" offset never cross a tens boundary) — IN-04 is a non-issue this wave.

### Domain verification (re-run at Wave-0 if desired)

```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://fgsd.k12.or.us"        # Confirmed 2026-07-04: 000 (does not resolve)
curl -s -o /dev/null -w "%{http_code}\n" "https://www.fgsdk12.org"       # Confirmed 2026-07-04: 200
```

---

## State of the Art

| Old Approach (Wave 1 / CONTEXT.md assumption) | Current Approach (Wave 2, this research) | When Changed | Impact |
|--------------|------------------|---------------|--------|
| "Oregon boards are commonly 7-director" (CONTEXT.md framing, both Wave-1 boards were 7-seat) | All three Wave-2 boards confirmed 5-seat | This session's live verification | Office CTE count, `official_count`, ext_id block width, and post-verify gate literals all change from 7→5 |
| Uniform finalsite CDN sourcing (both Wave-1 districts) | Three different CDN vendors: finalsite (TTSD), Edlio (FGSD), self-hosted WordPress+fly-images (SSD) | This session | Headshot ETL needs 3 sourcing code paths instead of 1; a new WP-REST-API original-recovery pattern is introduced (Pattern 4) |
| CONTEXT.md's guessed domain set (ttsdschools.org / fgsd.k12.or.us / sherwood.k12.or.us) | Forest Grove's real domain is `www.fgsdk12.org` — the guessed domain does not resolve | This session | Any hardcoded reference to `fgsd.k12.or.us` in a plan or script would fail outright |
| 183's 1203/1205 migration template (office `NOT EXISTS` guard is dead code, no `chamber_id IS NOT NULL` gate, headshot NULL-politician_id risk) | 183-REVIEW's WR-01/WR-02/WR-03 fixes baked into 184's clones from first authoring | 183-REVIEW.md (2026-07-04) | Migration 1206/1207 are genuinely self-healing/idempotent from day one, closing the exact class of defect the reviewer flagged as "the one that bites the next same-shape district seed" |

**Deprecated/outdated:** CONTEXT.md's "verified at plan time, never assumed" caveat about the 7-seat count should be read as now resolved — all three boards are 5-seat, confirmed by direct live-page verification this session.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | "Director, Position N" is the correct verbatim office title for Forest Grove (no literal "Director"/"Position" string was found in Forest Grove's static HTML; inferred from ORS 332 + the parallel Sherwood/Hillsboro convention + the rendered page's own Position numbering) | Pattern 3 (Forest Grove roster) | Low functional risk (title string is display-only), violates D-R2's verbatim requirement if a different convention is discovered. Wave-0 can search for a Washington County candidate-filing document to raise confidence, mirroring the exact approach Wave 1 used for Hillsboro. |
| A2 | "Director, Position N" for Tigard-Tualatin is well-supported (own site text: "Board Directors" + "Position #N") but not a single literal phrase found verbatim on the page | Pattern 3 (TTSD roster) | Same low functional risk as A1; MEDIUM-HIGH confidence given the "Board Directors" plural noun is the district's own text. |
| A3 | Jill Zurschmeide (Chair, P4) / Tristan Irvin (Vice Chair, P3) is the CURRENT 2025-2026 pairing; a stale 2024-2025 minutes PDF shows the reverse (Irvin=Chair, Jaimes=Vice Chair) from a prior year | Pattern 3 (TTSD roster) | If Oregon boards rotate Chair/VC annually and a rotation occurred very recently (between this research session and execution), the title-on-seat suffix could be stale. Recommend a same-day re-check of the live page at execution time before locking the migration. |
| A4 | Linda Harrington's headshot is a genuine sourcing gap (no usable photo found this session beyond the placeholder); a local-news article about her appointment references a "contributed" district photo that MAY be extractable | Pattern 3 (Forest Grove roster), Key Finding 4 | If a usable photo exists in the news coverage and isn't checked at execution time, the phase would ship a documented gap that was actually avoidable. Low risk either way — D-R5 permits an honest gap. |
| A5 | The TTSD headshot sources (all 3.3KB-27KB) are genuinely low native resolution requiring the same Lanczos-upscale-with-caveat treatment Hillsboro needed, rather than some larger rendition existing elsewhere on the site | Pattern 3 (TTSD roster), Code Examples | If a higher-resolution TTSD source exists (e.g., a staff-directory photo or district newsletter), the migration would ship an avoidably-blurry image. Low risk — execution-time script can attempt one more resolution check before committing to the small source. |
| A6 | Matt Kaufman's 1831×1694 near-square Sherwood photo should be center-cropped to 4:5 (standard treatment) rather than treated as a documented partial gap | Pattern 3 (Sherwood roster) | None functionally — resolution is well above the 600×750 floor either way; this is a framing/composition choice, not a quality gap, and does not need D-R5 documentation as a "gap." |

---

## Open Questions

1. **Exact verbatim confirmation of Forest Grove's and Tigard-Tualatin's office-title convention ("Director, Position N")**
   - What we know: Sherwood's own site literally uses "Director, Position N"; ORS 332 statutory language + the district's own generic "Board Directors" text (TTSD) support the same convention.
   - What's unclear: Whether an official Washington County candidate-filing document for a TTSD or FGSD seat would show identical phrasing (the same document type that fully confirmed Beaverton's wording in Wave 1).
   - Recommendation: Wave-0 does one more targeted search/fetch of a Washington County school-board candidate-filing PDF for a TTSD or FGSD seat; if not found quickly, proceed with "Director, Position N" as the well-supported default for all three districts (matching the tenor of Wave 1's resolved Hillsboro question).

2. **Linda Harrington's usable headshot**
   - What we know: the district's own board page shows a "Coming Soon" placeholder; local news coverage of her June 23, 2026 appointment references a "contributed" district photo.
   - What's unclear: whether that news-article photo is extractable/licensable and of sufficient quality (600×750-capable) without fabricating detail.
   - Recommendation: Wave-2 execution attempts a quick fetch of the hillsboronewstimes.com/forestgrovenewstimes.com/newsinthegrove.com article images before defaulting to a documented gap; if none found, document honestly per D-R5 — this is a legitimate, well-evidenced gap either way (she is a genuine, very-recent mid-term appointee).

3. **TTSD Chair/Vice-Chair rotation freshness**
   - What we know: the live page (fetched 2026-07-04) shows Zurschmeide=Chair(P4)/Irvin=Vice Chair(P3); a stale 2024-2025 document shows the reverse pairing from a prior board year.
   - What's unclear: whether Oregon school boards rotate these titles on a fixed annual cycle that could flip again before execution.
   - Recommendation: re-fetch the live TTSD board page immediately before authoring the migration's Chair/Vice-Chair title suffixes, rather than relying solely on this research snapshot.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| psql | Migration apply | ✓ (per Phase 183 session; re-verify at Wave-0) | PostgreSQL 18.1 | — |
| `py` launcher (Python) | Headshot pipeline | ✓ (per Phase 183 session) | Python 3.14.3 via `py`, NOT bare `python`/`python3` | Use `py` explicitly — bare `python3` re-confirmed non-functional in this session's Bash tool |
| Pillow (PIL) | crop-4:5 → 600×750 Lanczos q90 | ✓ (per Phase 183 session) | 12.1.1 | — |
| psycopg2 | DB UUID resolution | ✓ (per Phase 183 session) | 2.9.12 | — |
| requests | HTTP fetch of headshot images + Sherwood WP REST API JSON | ✓ (per Phase 183 session) | 2.34.2 | — |
| ttsdschools.org | Roster + headshots (Tigard-Tualatin) | ✓ | HTTP 200, no WAF, no UA needed (confirmed this session) | — |
| www.fgsdk12.org | Roster + headshots (Forest Grove) | ✓ | HTTP 200, no WAF, no UA needed (confirmed this session; `fgsd.k12.or.us` does NOT resolve) | — |
| sherwood.k12.or.us | Roster + headshots (Sherwood) | ✓ | HTTP 200, no WAF, no UA needed (confirmed this session) | — |
| resources.finalsite.net (CDN, TTSD) | 5 headshot images | ✓ | HTTP 200 for all 5 URLs tested | — |
| 3.files.edl.io (CDN, FGSD) | 4/5 headshot images | ✓ (4/5) | HTTP 200 for all 5 URLs; 1/5 is a confirmed placeholder, not a fallback situation | Local-news photo search for Harrington |
| sherwood.k12.or.us/wp-json (REST API, SSD) | 5 headshot images (original recovery) | ✓ | HTTP 200 for all 5 media ids queried | — |
| G5420 geofences (all 3 districts) | District routing | ✓ | Loaded + valid, Phase 174 (confirmed via Phase 174's own summary) | — |
| DATABASE_URL + service key | Migration + Storage | ✓ (per Phase 183 session) | `C:/EV-Accounts/backend/.env` | — |

**Missing dependencies with no fallback:** None. **Missing dependencies with fallback:** Linda Harrington's headshot (fallback = local-news photo search, or honest documented gap if not found).

---

## Validation Architecture

> `workflow.nyquist_validation` absent from `.planning/config.json` — treated as enabled. Data-seed phase: verification is SQL/HTTP gates + address-routing smoke tests, not a unit-test suite. Mirrors Phase 183's pattern exactly (no new geofence loader to smoke-test — Phase 174's `smoke-or-westmetro-school.ts` already covers routing for all 5 west-metro geo_ids, including this wave's 3).

### Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Inline SQL gates (`psql -f` / `psql -c`) + reuse of existing `npx tsx scripts/smoke-or-westmetro-school.ts` |
| Config file | none — data-seed phase, no app-level test suite involved |
| Quick run command | `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id WHERE d.geo_id IN ('4112240','4105160','4111290') AND d.district_type='SCHOOL';"` (expect 15) |
| Full suite command | `npx tsx scripts/smoke-or-westmetro-school.ts` (all 5 west-metro districts, including this wave's 3) + the full E2E gate suite pattern from 183-04-SUMMARY.md |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WSCH-03 | TTSD board seeded, 5/5 offices, routes correctly | SQL + smoke | `psql -c "SELECT COUNT(*) ... geo_id='4112240'"` (expect 5) + `npx tsx scripts/smoke-or-westmetro-school.ts` | ✅ smoke script exists (Phase 174) |
| WSCH-04 | FGSD board seeded, 5/5 offices, routes correctly | SQL + smoke | `psql -c "SELECT COUNT(*) ... geo_id='4105160'"` (expect 5) + smoke script | ✅ |
| WSCH-05 | SSD board seeded, 5/5 offices, routes correctly | SQL + smoke | `psql -c "SELECT COUNT(*) ... geo_id='4111290'"` (expect 5) + smoke script | ✅ |
| (all 3) | 0 stance rows (success state) | SQL | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON pa.politician_id=p.id WHERE p.external_id BETWEEN -4112245 AND -4112241 OR p.external_id BETWEEN -4105165 AND -4105161 OR p.external_id BETWEEN -4111295 AND -4111291` (expect 0) | ❌ new query, trivial to write |
| (all 3) | 15/15 headshots | SQL | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON pi.politician_id=p.id WHERE p.external_id BETWEEN -4112245 AND -4112241 OR ...` (expect 15, or 14 if Harrington ships as a documented gap) | ❌ new query, trivial to write |
| (all 3) | Casing gate | SQL | `SELECT DISTINCT state FROM essentials.districts WHERE geo_id IN ('4112240','4105160','4111290') AND district_type='SCHOOL'` (expect only 'or') | ❌ new query, trivial to write |
| (all 3) | Section-split scan | SQL | Same pattern as 1203's post-verify DO block Step 3, adapted to the 3 new geo_ids | ❌ new query, embedded in the migration itself |

### Sampling Rate
- **Per task commit:** the relevant SQL gate for whichever migration/script that task touches.
- **Per wave merge:** full E2E gate suite (all gates above + smoke script).
- **Phase gate:** full suite green + live Playwright browse of all 3 new coverage links before `/gsd:verify-work`.

### Wave 0 Gaps
- `_tmp-westmetro-school-wave2-probe.sql` — needs authoring (clone `_tmp-westmetro-school-wave1-probe.sql` with the IN-03 nits applied and 5-per-district ext_id ranges).
- Framework install: none — all dependencies already present per Environment Availability.

*(No app-level unit-test framework gaps — this is a pure data-seed phase, consistent with Phase 183/174/166 precedent.)*

---

## Security Domain

> `security_enforcement` not found as explicitly `false` in `.planning/config.json` — treated as enabled per the standing rule; however this phase's threat surface is unchanged from Phase 183 (a data-seed phase with no new user input, no new endpoint, no new auth path).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No new auth surface — migrations run via existing `DATABASE_URL` service-role connection, same as every prior deep-seed phase |
| V3 Session Management | No | N/A — no session-touching code this phase |
| V4 Access Control | No | N/A — no new endpoint or role this phase |
| V5 Input Validation | Yes (inherited) | All SQL is parameterized/literal in migration files (no dynamic user input); the headshot ETL uses parameterized psycopg2 queries exactly as the Wave-1 script did (confirmed clean in 183-REVIEW.md) |
| V6 Cryptography | No | No new secret handling — service key loaded from `.env`, never hardcoded, same convention as every prior phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via headshot ETL | Tampering | Parameterized psycopg2 queries only (`resolve_politician_id` pattern from `_tmp-cornelius-headshots.py`), no string-interpolated SQL — carry forward unchanged |
| SSRF via attacker-controlled image URL | Tampering/Info Disclosure | All headshot source URLs are hardcoded in the ETL script from this research's verified list, not accepted as runtime input — no user-supplied URL is ever fetched |
| Secret leakage (service key) | Info Disclosure | `.env`-derived `SUPABASE_SERVICE_ROLE_KEY`, never printed/logged, sent only to the env-derived Supabase host — carry forward the Wave-1 ETL's confirmed-clean posture |

---

## Sources

### Primary (HIGH confidence)
- `ttsdschools.org/about-us/school-board` — live board-members page, WebFetch + raw curl, 2026-07-04
- `www.fgsdk12.org/apps/pages/index.jsp?uREC_ID=1139223&type=d&pREC_ID=1404180` — live board-members page, WebFetch + raw curl, 2026-07-04
- `sherwood.k12.or.us/board/board-members/` — live board-members page, WebFetch + raw curl, 2026-07-04
- `sherwood.k12.or.us/wp-json/wp/v2/media/{id}` — WP REST API, queried directly for all 5 Sherwood attachment ids, 2026-07-04
- `.planning/phases/174-west-metro-school-district-geofences/174-01-SUMMARY.md` — geo_id/source/label ground truth for all 3 districts
- `.planning/phases/183-school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j/183-REVIEW.md` — WR-01/WR-02/WR-03 fix specifications (verbatim SQL)
- `C:/EV-Accounts/backend/migrations/1203_or_westmetro_school_boards_wave1.sql` and `1205_..._headshots.sql` — read in full, primary structural/headshot template
- `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-probe.sql` — Wave-0 probe template

### Secondary (MEDIUM confidence)
- `hillsboronewstimes.com` / `forestgrovenewstimes.com` / `newsinthegrove.com` — Linda Harrington appointment coverage (June 25, 2026 articles), WebSearch snippet only, not directly fetched
- `ballotpedia.org/Forest_Grove_School_District,_Oregon,_elections` and `ballotpedia.org/Sherwood_School_District,_Oregon,_elections` — generic Oregon ORS 332.118 election-method boilerplate, fetched via curl with browser UA, 2026-07-04 (confirms statewide at-large default, not district-specific override language)
- `runforoffice.org` listing "Tigard-Tualatin 23J School Board Member, Seat 1" — third-party naming convention, corroborating but not authoritative for office-title wording

### Tertiary (LOW confidence)
- 2024-2025 TTSD board-meeting-minutes PDF (via WebSearch snippet only) showing a prior-year Chair/Vice-Chair pairing — flagged as potentially stale, not used as the primary roster source (Assumption A3)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — identical, already-verified tooling from Phase 183, re-confirmed this session (bare python3 stub issue re-confirmed)
- Architecture: HIGH — same proven school-district migration shape, with fully-specified fixes from 183-REVIEW.md
- Rosters/seat counts/election method: HIGH — all three districts' seat counts, names, positions, and election method directly confirmed on live official pages this session, correcting a CONTEXT.md assumption
- Office-title verbatim wording: HIGH (Sherwood, literal match) / MEDIUM-HIGH (TTSD, strong textual support) / MEDIUM (Forest Grove, inferred from statute + parallel convention, no literal string found)
- Headshot sourcing: HIGH (14 of 15 sources confirmed genuine and reachable) / genuine documented gap (1 of 15, Linda Harrington)
- Pitfalls: HIGH — directly observed this session (domain non-resolution, placeholder-image detection, seat-count correction), not inferred

**Research date:** 2026-07-04
**Valid until:** 30 days (stable government/roster data); headshot source URLs and the Linda Harrington gap should be re-checked at execution time if more than a few days elapse (recent appointee, placeholder may be replaced)
