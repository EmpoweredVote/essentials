# Phase 81: OR Playbook Retrospective + v8.0 Close — Research

**Researched:** 2026-05-31
**Domain:** Documentation update + milestone close (no code or DB changes)
**Confidence:** HIGH — all findings derived directly from OR phase SUMMARYs (phases 72–80) and existing LOCATION-ONBOARDING.md

---

## Summary

Phase 81 has two deliverables: (1) update LOCATION-ONBOARDING.md with all Oregon-specific GOTCHAs discovered during v8.0, and (2) close the v8.0 milestone across ROADMAP.md, STATE.md, and PROJECT.md.

The OR onboarding introduced 9 distinct GOTCHAs not previously in the playbook. The most consequential are the Portland charter reform structure (4-district multi-member RCV council, not in TIGER), the ArcGIS MapServer source for Portland council district boundaries, and the PowerShell Unicode encoding trap with Vietnamese diacriticals. Three GOTCHAs (the cd119 key, districts.state casing, and COUSUB/FUNCSTAT patterns) were already documented from prior states but deserve OR-specific annotations.

The milestone close pattern is identical to Phase 78 (CA): mark shipped in ROADMAP.md top list + v8.0 details block + progress table rows, update STATE.md last_activity + current position, and append v8.0 validated bullets to PROJECT.md while updating the Current Milestone section.

**Primary recommendation:** Directly reuse the Phase 78 two-plan structure — Plan 01 updates LOCATION-ONBOARDING.md (GOTCHAs + Quick Reference + Cities Onboarded rows + pitfall table rows), Plan 02 closes the milestone across the three tracking files.

---

## GOTCHA Inventory

All traps are sourced directly from OR phase SUMMARYs. Each entry includes: source phase, problem encountered, solution applied, OR-specific example.

### GOTCHA OR-1: Portland Council District Boundaries are NOT in TIGER — Use ArcGIS MapServer

**Source:** Phase 76 (76-01-SUMMARY.md)
**Step:** Step 3 (Geofence Sources)
**Problem:** Portland's 2024 charter reform created 4 new multi-member council districts (Districts 1-4, 3 seats each) effective January 2025. These districts are NOT in TIGER 2024. Loading only TIGER data for Portland leaves ALL council district routing broken — a Portland address returns no LOCAL district match.
**Solution:** Source district boundaries from PortlandMaps ArcGIS MapServer Layer 17 using a per-OBJECTID fetch loop (4 HTTP calls, one per district). Load with `outSR=4326` (ArcGIS returns State Plane by default). Apply `ST_MakeValid()` because Districts 1 and 4 have source GeoJSON self-intersections that cause `ST_Covers` to silently return 0 rows.
**OR Example:** `https://www.portlandmaps.com/arcgis/rest/services/Public/Basemap_2011_New/MapServer/17` — OBJECTID 1-4 = Districts 1-4. Field name `DISTRICT` (integer). Loader: `C:/EV-Accounts/backend/scripts/load-portland-council-boundaries.ts`, mtfcc=X0012, geo_ids: `portland-or-council-district-{1-4}`.
**Portland City Hall routing:** (-122.6794, 45.5231) → portland-or-council-district-4 (District 4).
**Pitfall table entry:** `| Portland council district boundaries not in TIGER | Source from PortlandMaps ArcGIS MapServer Layer 17 per-OBJECTID; always add outSR=4326 and ST_MakeValid |`

### GOTCHA OR-2: Portland 4-District RCV Multi-Member Council Structure

**Source:** Phase 77 (077-01-SUMMARY.md, 077-02-SUMMARY.md)
**Step:** Step 1 (Government Structure Research), Step 2 (Election System)
**Problem:** Portland's November 2024 charter reform (effective January 2025) created a radically different council structure. The old 5-member at-large council was replaced by 4 geographic districts with 3 seats each (12 total council seats) elected by RCV. An agent using pre-reform Wikipedia data would model Portland as a 5-seat at-large body with plurality voting — completely wrong. Additionally, the CONTEXT.md D-06 roster (sourced during research) contained 9 wrong names across all 4 districts; the authoritative roster must come from `portland.gov/auditor/elections/elected-city-officials`.
**Solution:** Always verify Portland structure from the 2024 charter document (Article 2-201 lists only 3 elective offices: Mayor, Auditor, 12 Councilors). Use `portland.gov/auditor/elections/elected-city-officials` as the authoritative incumbent roster. Model as: 1 LOCAL_EXEC district for Mayor/Auditor/appointed officials, 4 LOCAL districts (portland-or-council-district-{1-4}) for 12 council offices (3 per district). Set `election_method='rcv'` on the City Council chamber at structure-seed time.
**OR Example:** 5 chambers: City Council (12 offices, RCV) + Mayor (elected, LOCAL_EXEC) + City Auditor (elected, LOCAL_EXEC) + City Administrator (appointed) + City Attorney (appointed). Government name must be `'City of Portland, Oregon, US'` (full form) to distinguish from `'City of Portland, Maine, US'` already in DB.
**Pitfall table entry:** `| Portland council structure seeded from pre-2025 charter | 2024 charter reform: 4 districts × 3 seats = 12 council seats; official roster from portland.gov/auditor/elections/elected-city-officials not Wikipedia |`

### GOTCHA OR-3: portland.gov WAF Blocks Direct File Downloads — Use Drupal 1_1_320w Style URLs

**Source:** Phase 77-03 (077-03-SUMMARY.md)
**Step:** Step 7 (Headshots)
**Problem:** Portland official headshots are on portland.gov but direct file paths at `/sites/default/files/public/{year}/{filename}` return HTTP 404. The WAF blocks all direct access to the `/public/` file tree. Standard WebFetch or curl to the `/public/` path fails silently.
**Solution:** Use Drupal image style derivative URLs: `/sites/default/files/styles/1_1_320w/public/{year}/{filename}?h=XXXXXXXX&itok=XXXXXXXX`. These CDN URLs return HTTP 200 and provide 320x320 WebP images. Extract the `itok` token from each official's profile page HTML. Record the canonical `/public/` path in `photo_origin_url` for audit trail. Processing: center-crop 320x320 → 256x320 (4:5), resize to 600x750 Lanczos q90 JPEG.
**OR Example:** Keith Wilson headshot: download from `portland.gov/sites/default/files/styles/1_1_320w/public/2024/Wilson-Blue-Background_0.png?h=...&itok=...`. All 14 Portland elected officials sourced from portland.gov with photo_license='public_domain'. No Wikimedia fallbacks required.
**Pitfall table entry:** `| portland.gov headshots not downloadable from /public/ direct paths | Use Drupal 1_1_320w style CDN URLs (extract itok token from profile page HTML); photo_origin_url records canonical path |`

### GOTCHA OR-4: PowerShell Unicode Encoding — Vietnamese Diacriticals Require [char]0xNNNN Escape Sequences

**Source:** Phase 75-02 (75-02-SUMMARY.md)
**Step:** Step 6 (Migration Order — PowerShell bulk-seed generators)
**Problem:** Windows PowerShell 5.1 reads script files without BOM as ANSI codepage (not UTF-8). A `.ps1` generator script with UTF-8 multi-byte characters in string literals (e.g., Nguyễn with U+1EBF, Thuy Tran diacriticals) will have those characters mangled when PowerShell reads the script — even if the file is correctly encoded UTF-8. The generated SQL will contain garbage characters instead of the correct Unicode, which inserts wrong data into the DB.
**Solution:** Use `[char]0xNNNN` escape sequences in the roster hashtable for any non-ASCII character in PowerShell generator scripts. Write the output SQL using `[System.IO.File]::WriteAllLines($path, $lines, [System.Text.UTF8Encoding]::new($false))` (the `$false` disables BOM). These escape sequences render correctly in the generated SQL output regardless of how PowerShell reads the script file.
**OR Examples:**
- HD-38 Daniel Nguyễn: `[char]0x1EBF` for ễ (e with circumflex and acute)
- HD-45 Thuy Tran: `[char]0x1EE7` + `[char]0x1EA7` for Vietnamese diacriticals
- HD-22 Lesly Munoz: `[char]0x00F1` for ñ (n-tilde)
**Pitfall table entry:** `| PowerShell Unicode encoding: non-ASCII names mangled in PS 5.1 scripts | Use [char]0xNNNN escape sequences for all diacritical characters in .ps1 roster hashtables |`

### GOTCHA OR-5: OR Constitutional Officers are ALL Voter-Elected (Unlike Maine)

**Source:** Phase 73 (73-01-SUMMARY.md), Phase 74 (74-01-SUMMARY.md)
**Step:** Step 1 (Government Structure Research), Step 5 (Schema Decisions)
**Problem:** In Maine, AG/SoS/Treasurer are legislature-elected — `is_appointed_position=true` and zero race rows. An agent copying the Maine pattern for Oregon would incorrectly mark OR's AG, SoS, and Treasurer as appointed.
**Solution:** Oregon's 5 constitutional officers (Governor, AG, SoS, Treasurer, Labor Commissioner) are ALL voter-elected. Set `is_appointed_position=false` on all 5 office rows. Create race rows for all 5 offices. Always research the state constitution before assuming the Maine pattern applies.
**OR Example:** OR chamber slugs: governor-of-oregon, attorney-general-of-oregon, oregon-secretary-of-state, oregon-state-treasurer, oregon-labor-commissioner. All 5 offices: `is_appointed_position=false`. Migration 223 applied this correctly.
**Note:** Oregon has a 5th executive office (Labor Commissioner) not present in Maine — always verify the full list of constitutional offices from the official state government page, not a template from a prior state.
**Pitfall table entry:** `| OR constitutional officers modeled as appointed (Maine pattern) | All 5 OR officers are voter-elected; is_appointed_position=false and race rows required for all 5 |`

### GOTCHA OR-6: OR Senators Pre-Existed Under Non-Canonical external_ids

**Source:** Phase 74-02 (74-02-SUMMARY.md)
**Step:** Step 5 (Schema Decisions — pre-flight checks)
**Problem:** Ron Wyden (external_id=-400065) and Jeff Merkley (external_id=-400066) already existed in the DB with correct office rows before Phase 74. A standard INSERT migration targeting the canonical -4101001/-4101002 range would silently skip them (NOT EXISTS guard) and leave the canonical external_ids absent.
**Solution:** Run a pre-flight query against the planned external_id range AND against the senator names before writing the INSERT migration. If they pre-exist under different external_ids with correct offices, use UPDATE to reassign external_ids to the canonical scheme rather than INSERT+new office rows.
**OR Example:** `UPDATE essentials.politicians SET external_id=-4101001 WHERE external_id=-400065` (Wyden). `UPDATE essentials.politicians SET external_id=-4101002 WHERE external_id=-400066` (Merkley). Migration 224 used this UPDATE-only pattern for both senators.
**General rule:** Before any federal officials migration, run: `SELECT external_id, full_name FROM essentials.politicians WHERE full_name IN ('Ron Wyden', 'Jeff Merkley')` (or your state's senators) to detect pre-existing rows.
**Pitfall table entry:** `| OR senators pre-existed under non-canonical external_ids | Pre-flight query: SELECT external_id, full_name WHERE full_name IN (senators); if pre-exist with offices, UPDATE external_id — do not INSERT |`

### GOTCHA OR-7: OR G4110 Place Count = 241 (Dry-Run Required to Confirm)

**Source:** Phase 72-01 (72-01-SUMMARY.md)
**Step:** Step 3 (Geofences)
**Problem:** The estimated G4110 place count for Oregon was 242 (from TIGERweb or other sources). The actual TIGER 2024 file has 241 records. If the TIGER loader's pre-flight assertion is set to 242, it blocks the live run with a MtfccAssertionError.
**Solution:** Always do a dry-run of the place layer before the live load. The MtfccAssertionError output from the dry-run gives the actual count. Update the count in all 3 files (loader config, verify SQL, smoke test) before running the live load.
**OR Example:** Dry-run set to 242 → MtfccAssertionError; actual count = 241; updated all 3 files → live run passed with "241 boundaries inserted".
**Pitfall table entry:** `| OR G4110 place count wrong from external estimate | Always dry-run place layer first; MtfccAssertionError gives actual count; update loader + verify SQL + smoke test all 3 |`

### GOTCHA OR-8: Portland Council District 4 Gate — City Hall is in D4, Not D1

**Source:** Phase 76 (76-01-SUMMARY.md), Phase 77 (077-02-SUMMARY.md)
**Step:** Step 6 (Migration Order — verification)
**Problem:** Portland City Hall (-122.6794, 45.5231) routes to District 4, not District 1 as might be assumed from its location near the historic core. Smoke tests or routing verifications written assuming "City Hall = District 1" will silently fail.
**Solution:** Always use the confirmed routing result as the smoke test gate: Portland City Hall → portland-or-council-district-4 (District 4). Commit this value in smoke test assertions, not a derived assumption.
**OR Example:** SC2 smoke gate: `ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-122.6794, 45.5231), 4326))` → `portland-or-council-district-4`. Gateway for Plan 77-02 D4 routing verification: returns Zimmerman + Green + Clark.
**Note:** This is the same "always verify routing from DB, never assume" principle from prior states — just the specific OR value to document.

### GOTCHA OR-9: Portland 2026 Ballot Covers Only D3/D4/Auditor — Not Mayor or D1/D2

**Source:** Phase 79-04 (79-04-SUMMARY.md)
**Step:** Step 2 (Election System Confirmation), Step 6 (Elections + race_candidates)
**Problem:** Portland's 2024 charter reform intentionally staggered council terms. Districts 3 and 4 received 2-year initial terms (up for election November 3, 2026). Mayor Wilson and Districts 1 and 2 received 4-year terms (NOT up in 2026). An agent assuming all 12 council seats are on the 2026 ballot would create 7 wrong race rows for Mayor + D1 + D2 that do not exist.
**Solution:** Research staggered term start date from official charter before creating race rows. 2026 Portland races: D3 Seats A/B/C + D4 Seats A/B/C + City Auditor = 7 races total. Use OFFSET 0/1/2 on ORDER BY o.id to enumerate 3 distinct office_ids per district (no other discriminator exists between the 3 seats within a district).
**OR Example:** Migration 240 created exactly 7 Portland race rows (no Mayor, no D1, no D2, no City Administrator/Attorney). Position names: "Portland City Council District 3 Seat A/B/C", "Portland City Council District 4 Seat A/B/C", "Portland City Auditor".
**Pitfall table entry:** `| Portland 2026 races include all 12 council seats | Staggered terms: D3+D4+Auditor on 2026 ballot; Mayor+D1+D2 on 2028 ballot (4-year terms from 2025 charter reform) |`

### Summary Table

| # | GOTCHA Name | Source Phase | Step | New to Playbook? |
|---|-------------|-------------|------|-----------------|
| OR-1 | Portland council boundaries not in TIGER | Phase 76 | Step 3 | YES — OR-specific |
| OR-2 | Portland 4-district RCV multi-member structure | Phase 77 | Step 1, 2 | YES — OR-specific |
| OR-3 | portland.gov WAF — use Drupal 1_1_320w URLs | Phase 77-03 | Step 7 | YES — OR-specific |
| OR-4 | PowerShell Unicode: [char]0xNNNN for diacriticals | Phase 75-02 | Step 6 | YES — new general GOTCHA |
| OR-5 | OR constitutional officers all voter-elected | Phase 73-74 | Step 1, 5 | YES — OR annotation to existing GOTCHA |
| OR-6 | OR senators pre-existed under wrong external_ids | Phase 74-02 | Step 5 | YES — general pre-flight rule |
| OR-7 | OR G4110 count = 241 (dry-run required) | Phase 72 | Step 3 | YES — annotation to existing GOTCHA |
| OR-8 | Portland City Hall → D4 (not D1) | Phase 76-77 | Step 6 | YES — OR-specific value |
| OR-9 | Portland 2026 ballot: D3/D4/Auditor only | Phase 79 | Step 2, 6 | YES — OR-specific |

**GOTCHAs already in playbook that apply to OR (no new entry needed):**
- cd119 loader key — already documented with the Maine `cd119` example; OR also uses `cd119` (identical trap, same solution, already warned)
- districts.state casing — already documented; OR follows the same lower/UPPER convention as ME
- COUSUB FUNCSTAT — OR COUSUBs are statistical CCDs (FUNCSTAT=S), same as CA; already in Step 3 CA annotation
- section-split check returning 240/346 pre-existing — NOT a GOTCHA to document; it's expected behavior from unseeded cities

---

## Playbook Gap Analysis

### What is Already in LOCATION-ONBOARDING.md (applies to OR)

The current playbook (424 lines, updated Phase 78) already covers:

| Existing GOTCHA | Relevant to OR? | Action |
|----------------|-----------------|--------|
| TIGER cd119 key variation | YES (OR also uses cd119) | Add OR annotation to existing GOTCHA |
| districts.state casing (lower/UPPER) | YES (OR: 'or'/'OR') | Add OR-specific values as annotation |
| CA COUSUB = CCDs (FUNCSTAT=S) | Partly (OR same pattern) | Already covered via CA; note OR in annotation |
| governments WHERE NOT EXISTS | YES | No change needed — general rule |
| slug is GENERATED on chambers | YES | No change needed — general rule |
| senator uniqueness key (district_id, politician_id) | YES | No change needed — general rule |
| legislature-elected vs voter-elected offices | YES (OR contrast to ME) | Add OR annotation to the ME GOTCHA |
| RCV set on chamber at seed time | YES (Portland City Council) | Add OR annotation to existing RCV GOTCHA |
| ArcGIS outSR=4326 required | YES (Portland council loader) | No new CA-specific entry needed; general rule already documented |
| race_candidates WHERE NOT EXISTS | YES | No change needed — general rule |
| PowerShell UTF-8 NoBOM generator | YES (used for OR senate/house/races) | Existing text covers the pattern; add OR example for Unicode specifically |

### What is Missing (requires new content)

| Missing Content | Where to Insert | Type |
|-----------------|----------------|------|
| OR-1: Portland council NOT in TIGER | Step 3, after ArcGIS GOTCHA | New `> [GOTCHA]` blockquote |
| OR-2: Portland 4-district charter structure | Step 1, after CA pre-existing GOTCHA | New `> [GOTCHA]` blockquote |
| OR-3: portland.gov WAF / 1_1_320w URLs | Step 4, after Sacramento AEM/CQ5 GOTCHA | New `> [GOTCHA]` blockquote |
| OR-4: PowerShell Unicode [char]0xNNNN | Step 6 PowerShell pattern | Annotation appended to existing PowerShell GOTCHA |
| OR-5: OR constitutional officers voter-elected | Step 5 legislature-elected GOTCHA | Annotation appended with OR contrast |
| OR-6: Federal officials pre-flight check | Step 5, schema decisions | New inline `[GOTCHA]` bullet |
| OR-7: G4110 dry-run required | Step 3, TIGER cd119 GOTCHA | Annotation appended |
| OR-8: Portland City Hall → D4 | Step 3 / Cities Onboarded | Capture in Portland row + smoke test guidance |
| OR-9: Portland staggered ballot terms | Step 2, elections GOTCHA | New `> [GOTCHA]` blockquote |
| Oregon Quick Reference block | After Cities Onboarded table | New H2 section (like CA Quick Reference) |
| Cities Onboarded: Oregon (state) + Portland | Cities Onboarded table | 2 new rows |
| Step 7 pitfall table: 4 new rows | Step 7 pitfall table | New rows |

### Inline Placement Map

| GOTCHA | Target Location in File |
|--------|------------------------|
| OR-2 (charter structure) | Step 1 — after `> [GOTCHA] [STATE-SPECIFIC: CA] CA government row...` |
| OR-5 annotation | Step 5 — append to `[GOTCHA] Legislature-elected offices...` |
| OR-6 (federal pre-flight) | Step 5 — after OR-5 annotation, before CA external_id GOTCHA |
| OR-1 (Portland not in TIGER) | Step 3 — after `[STATE-SPECIFIC: CA] DataSF vs ArcGIS` GOTCHA |
| OR-7 annotation (G4110 dry-run) | Step 3 — append to TIGER cd119 GOTCHA |
| OR-9 (staggered ballot) | Step 2 — after CA jungle primary GOTCHA |
| OR-4 annotation (Unicode) | Step 6 — append to PowerShell generator GOTCHA |
| OR-3 (portland.gov WAF) | Step 4 — after Sacramento AEM/CQ5 GOTCHA |

---

## Cities Onboarded Table

Two new rows to append after the existing California entries.

### Oregon (state) row

| Field | Value |
|-------|-------|
| City | Oregon (state) |
| State | OR |
| Onboarded | 2026-05-30 |
| Election method | plurality (state + federal); rcv (Portland City Council, Auditor) |
| Notable patterns | All 5 constitutional officers voter-elected (unlike ME); cd119 TIGER key; sos.oregon.gov Blue Book headshot source (500×623, crop to 4:5); external_ids: exec -4100001..-4100005, US Senators -4101001/-4101002, House -4102001..-4102006, State Senate -4110001..-4110030, House -4120001..-4120060; 241 G4110 cities; oregonlegislature.gov MemberPhotos headshot source (non-obvious filenames with disambiguation suffixes) |

### Portland, OR row

| Field | Value |
|-------|-------|
| City | Portland | 
| State | OR |
| Onboarded | 2026-05-30 |
| Election method | rcv (City Council 12 seats, City Auditor) |
| Notable patterns | 2024 charter reform: 4 districts × 3 seats (RCV); boundaries from PortlandMaps ArcGIS MapServer Layer 17 (NOT TIGER), mtfcc=X0012, outSR=4326+ST_MakeValid required; portland.gov WAF blocks /public/ — use Drupal 1_1_320w style URLs for headshots; gov name 'City of Portland, Oregon, US' (disambiguates from Portland ME); D3+D4+Auditor on 2026 ballot; Mayor+D1+D2 on 2028 ballot; ext_ids -690001..-690004 (citywide) + -690010..-690021 (council D1-D4) |

---

## Milestone Close Checklist

This section documents the exact changes needed across the three files, modeled on Phase 78-02 execution.

### ROADMAP.md (4 changes)

1. **Top milestone list** (line ~15): Change `🚧 **v8.0 Oregon** — Phases 72-81 (in progress)` to `✅ **v8.0 Oregon** — Phases 72-81 (shipped 2026-05-31)`

2. **v8.0 details `<summary>` tag** (line ~558): Change `🚧 v8.0 Oregon (Phases 72-81) — IN PROGRESS` to `✅ v8.0 Oregon (Phases 72-81) — SHIPPED 2026-05-31`

3. **Phase 81 plans** (line ~764): Mark both Phase 81 plans as `[x]` when complete.

4. **Progress table rows** (Phase 81 row, line ~887): Change `0/TBD | Pending | -` to `2/2 | Complete | 2026-05-31`

### STATE.md (3 changes)

1. **`last_activity` frontmatter field**: Update to `2026-05-31 -- Phase 81 complete, v8.0 Oregon shipped`

2. **`stopped_at` frontmatter field**: Update to `Phase 81 complete (2/2) — v8.0 Oregon shipped`

3. **Current Position section**: Update Phase from 81 to next (or mark as complete); update Status and Last activity

### PROJECT.md (2 changes)

1. **`### Validated` list**: Append v8.0 Oregon validated bullets after the v7.0 entries. Suggested bullets (5-6):
   - `✓ Oregon TIGER geofences — 241 G4110 cities + 30 SLDU + 60 SLDL + 6 CD + 36 G4020 counties; Portland geo_id=4159000; any OR address routes to correct federal, state, and local representatives; cd119 TIGER key — v8.0`
   - `✓ Oregon state government DB — 5 voter-elected constitutional officers (Kotek/Rayfield/Read/Steiner/Stephenson) + 30 state senators + 60 house reps + 2 US Senators + 6 US House reps; all 90 legislators from oregonlegislature.gov with headshots at 600×750 — v8.0`
   - `✓ Portland deep seed — 2024 charter reform: 4-district × 3-seat RCV council (12 officials) + Mayor + City Auditor + 2 appointed (City Administrator, City Attorney); council district boundaries from PortlandMaps ArcGIS (not TIGER); 14 elected officials with headshots from portland.gov 1_1_320w style URLs — v8.0`
   - `✓ OR 2026 elections + discovery pipeline — 105 race rows (1 Governor + 1 US Senate + 6 US House + 30 OR Senate + 60 OR House + 7 Portland City); discovery_jurisdictions for OR statewide + Portland; armed via election_date 180-day cron window — v8.0`
   - `✓ 321 compass stances across 24 OR officials — Kotek 31, Rayfield 24, Bonamici 24, Bentz 21, Hoyle 20, Steiner 13, Salinas 18, Bynum 13, Read 12, Dexter 12, Stephenson 10, Wilson 10; all cited; compass renders on Kotek profile — v8.0`
   - `✓ OR Playbook retrospective — 9 OR-specific GOTCHAs added to LOCATION-ONBOARDING.md; Oregon Quick Reference block; 2 new Cities Onboarded rows (Oregon state + Portland); v8.0 milestone closed — v8.0`

2. **`### Current Milestone` section**: Replace v8.0 Oregon section with v9.0 (or next planned milestone). Update the Active checklist to reflect all v8.0 phases complete.

### Verification After Close

Run these checks to confirm the close is complete:
```bash
# ROADMAP.md checks
grep "v8.0 Oregon" .planning/ROADMAP.md  # Should show ✅ shipped
grep "Phase 81" .planning/ROADMAP.md | grep "Complete"  # Should show 2/2 Complete

# STATE.md checks  
grep "last_activity" .planning/STATE.md  # Should show 2026-05-31

# PROJECT.md checks
grep "v8.0" .planning/PROJECT.md | grep "✓"  # Should show 5-6 OR validated bullets
```

---

## OR Quick Reference Design

Following the "California Quick Reference" pattern, insert an "## Oregon Quick Reference" H2 section immediately after the Cities Onboarded table's closing `---` separator and before `## Step 1`. The section contains an intro sentence and an 8-row trap table.

### Proposed Content

```markdown
## Oregon Quick Reference

**Read this before starting any OR city or state work.** These traps are OR-specific — general playbook guidance above does not warn for them.

| Trap | See Step | One-Line Summary |
|------|----------|-----------------|
| Portland council NOT in TIGER | Step 3 | Source from PortlandMaps ArcGIS MapServer Layer 17 per-OBJECTID; always use outSR=4326 + ST_MakeValid |
| Portland 2024 charter reform | Step 1, 2 | 4 districts × 3 seats (12 total) elected by RCV; authoritative roster from portland.gov/auditor/elections/elected-city-officials |
| All OR constitutional officers voter-elected | Step 1, 5 | Unlike Maine: all 5 officers (Gov, AG, SoS, Treasurer, Labor) are elected; is_appointed_position=false; race rows required |
| portland.gov WAF blocks headshots | Step 4, 7 | Use Drupal 1_1_320w style CDN URLs; photo_license=public_domain; extract itok token from profile page HTML |
| PowerShell Unicode mangling | Step 6 | Use [char]0xNNNN for all diacriticals (HD-38 Nguyễn, HD-45 Thuy Tran, HD-22 Munoz) in .ps1 generators |
| Federal officials may pre-exist | Step 5 | Pre-flight SELECT before INSERT; OR senators Wyden+Merkley pre-existed under -400065/-400066; UPDATE external_id, not INSERT |
| Portland 2026 ballot: D3/D4/Auditor only | Step 2, 6 | Mayor+D1+D2 have 4-year terms; only D3+D4+Auditor (7 races) are on the November 2026 ballot |
| G4110 count needs dry-run confirmation | Step 3 | OR actual count is 241 (not 242); always dry-run place layer; update count in loader + verify SQL + smoke test |
```

### Design Rationale

- 8 traps (vs 11 for CA) — OR is simpler than CA; fewer historical complexities
- Ordered by severity: geofence source trap first (most blocking), then structure, then officials, then utilities
- The Portland-gov WAF row covers both data sourcing (Step 4) and headshots (Step 7) to avoid duplication
- The PowerShell Unicode trap is OR-specific but relevant to any state with non-ASCII legislator names — keep it in OR QR since it was first discovered in OR

---

## Phase 78 Pattern Reuse

Phase 78 established the canonical pattern for playbook retrospectives. Here is how to directly reuse it for Phase 81.

### Plan 01: Playbook Update (mirrors 78-01)

**Tasks:**
1. Read current LOCATION-ONBOARDING.md in full (already done in research)
2. Add 2 Cities Onboarded rows (Oregon state + Portland)
3. Insert "Oregon Quick Reference" H2 block after Cities Onboarded table
4. Insert OR-specific GOTCHAs inline (8 placements per the gap analysis map)
5. Add 5 new Step 7 pitfall table rows
6. Verify: count `STATE-SPECIFIC: OR` occurrences, confirm Quick Reference exists, confirm both Cities Onboarded rows, confirm all new pitfall rows

**Acceptance criteria (mirrors 78-01 pattern):**
- `STATE-SPECIFIC: OR` count: ≥ 5 occurrences
- `Oregon Quick Reference` string: exactly 1 occurrence
- `Oregon (state)` in Cities Onboarded table: 1 occurrence
- `Portland` + `OR` + `2026-05-30` in Cities Onboarded table: 1 occurrence
- `portland.gov WAF` string: ≥ 1 occurrence (OR-3 GOTCHA)
- `1_1_320w` string: ≥ 1 occurrence (OR-3 example)
- `charter reform` string: ≥ 1 occurrence (OR-2 GOTCHA)
- `PortlandMaps ArcGIS` string: ≥ 1 occurrence (OR-1 GOTCHA)
- `[char]0x` string: ≥ 1 occurrence (OR-4 Unicode example)
- Cambridge content preserved (string `stv_proportional` still present)
- CA content preserved (string `jungle primary` still present)
- Final line count > 424 (current baseline)

### Plan 02: Milestone Close (mirrors 78-02)

**Tasks:**
1. Update ROADMAP.md: top list, v8.0 summary tag, Phase 81 plan checkboxes, progress table row
2. Update STATE.md: last_activity, stopped_at, Current Position
3. Update PROJECT.md: append v8.0 validated bullets, update Current Milestone section

**Verification (mirrors 78-02 pattern):**
- ROADMAP.md: `v8.0 Oregon` shows ✅ shipped
- STATE.md: `last_activity` contains `2026-05-31`
- PROJECT.md: ≥ 5 OR validated bullets in `### Validated` section
- PROJECT.md: `Current Milestone` no longer shows v8.0 Oregon as active

### Key Differences from Phase 78

| Aspect | Phase 78 (CA) | Phase 81 (OR) |
|--------|--------------|--------------|
| Number of GOTCHAs | 11 | 9 (fewer; OR simpler than CA) |
| Cities Onboarded rows | 7 (CA state + 6 CA cities) | 2 (OR state + Portland) |
| Quick Reference rows | 11 | 8 |
| Step 7 pitfall rows | 5 | ~4-5 |
| Files touched | LOCATION-ONBOARDING.md + 3 tracking files | Same |
| Plan count | 2 | 2 (same structure) |

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — Phase 81 is documentation and tracking file updates only; no code, DB migrations, or external tools required).

---

## Validation Architecture

Step 4: SKIPPED — `workflow.nyquist_validation` check: this is a documentation/tracking phase; no test framework applies. Verification is done via grep/string-count checks in the plan tasks themselves (per Phase 78 pattern).

---

## Security Domain

No security-relevant changes. Phase 81 touches only documentation files (LOCATION-ONBOARDING.md) and planning tracking files (ROADMAP.md, STATE.md, PROJECT.md). No new code, endpoints, auth paths, or data.

---

## Sources

All findings derived from local SUMMARY files — no external tools needed.

| Source | What Was Read |
|--------|--------------|
| `LOCATION-ONBOARDING.md` | Full file (424 lines) — existing GOTCHA format, Cities Onboarded table, CA Quick Reference structure |
| `.planning/ROADMAP.md` | v8.0 Oregon section (phases 72-81), progress table, milestone list |
| `.planning/STATE.md` | Current position, last_activity, accumulated context |
| `.planning/PROJECT.md` | Validated list, Current Milestone section |
| `.planning/phases/78-*/78-CONTEXT.md` | CA playbook retrospective decisions — canonical pattern |
| `.planning/phases/78-*/78-01-SUMMARY.md` | CA playbook update execution — deliverable format |
| `.planning/phases/78-*/78-02-SUMMARY.md` | CA milestone close execution — exact file changes |
| `72-01-SUMMARY.md` | cd119 key, G4110 count 241, dry-run pattern |
| `72-02-SUMMARY.md` | Portland geo_id=4159000, districts.state casing |
| `73-01-SUMMARY.md` | OR chamber names, government UUID |
| `74-01-SUMMARY.md` | OR execs voter-elected, STATE_EXEC district |
| `74-02-SUMMARY.md` | Senator pre-existing external_id update pattern |
| `74-03-SUMMARY.md` | sos.oregon.gov Blue Book headshot source |
| `75-01-SUMMARY.md` | OR Senate migration pattern, generator script |
| `75-02-SUMMARY.md` | PowerShell Unicode [char]0xNNNN trap |
| `75-03-SUMMARY.md` | oregonlegislature.gov non-obvious filenames |
| `76-01-SUMMARY.md` | ArcGIS MapServer Layer 17, ST_MakeValid, X0012, City Hall → D4 |
| `077-01-SUMMARY.md` | Portland government structure, 'City of Portland, Oregon, US' naming |
| `077-02-SUMMARY.md` | 4-district 3-seat structure, council title 'City Councilor (District N)', is_appointed corrections |
| `077-03-SUMMARY.md` | portland.gov WAF, 1_1_320w style URLs, itok token |
| `77.1-01-SUMMARY.md` | is_appointed data fix for appointed officials |
| `79-01-SUMMARY.md` | Landing.jsx, election rows, section-split baseline 240 |
| `79-02-SUMMARY.md` | Statewide race rows pattern |
| `79-03-SUMMARY.md` | Legislative race generator, district_type disambiguation |
| `79-04-SUMMARY.md` | Portland staggered ballot (D3/D4/Auditor only), OFFSET 0/1/2 pattern |
| `79-05-SUMMARY.md` | discovery_jurisdictions, no cron_active column |
| `80-04-SUMMARY.md` | Final verification, 321 stances, 24 officials, all 4 SC PASS |

---

## RESEARCH COMPLETE
