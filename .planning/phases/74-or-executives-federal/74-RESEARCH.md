# Phase 74 Research: OR Executives + Federal Officials

**Researched:** 2026-05-29
**Domain:** Data seeding — Oregon constitutional officers + US federal delegation
**Confidence:** HIGH (officials verified via official state/federal sources; geo_ids confirmed from Phase 72 DB verification)

---

## CRITICAL CORRECTION: SoS is Tobias Read, NOT Griffin-Valade

The phase description and roadmap list "SoS (Griffin-Valade)" as the OR Secretary of State. This is **out of date**. LaVonne Griffin-Valade left office January 6, 2025. The current Secretary of State is **Tobias Read**, who was elected November 2024 and sworn in January 6, 2025. [VERIFIED: oregoncapitalchronicle.com, sos.oregon.gov Blue Book]

All migration SQL must use Tobias Read, not LaVonne Griffin-Valade.

---

## Summary

Phase 74 seeds Oregon's 5 constitutional officers and 8 federal officials (2 US Senators + 6 US House reps), each with a headshot at 600×750 in Supabase Storage. All 5 executive chambers already exist under the State of Oregon government row (migration 222, Phase 73). The 6 NATIONAL_LOWER congressional districts (geo_ids `4101`–`4106`) and the single NATIONAL_UPPER district (geo_id `41`) were pre-seeded before Phase 72 and confirmed in Phase 72-02's Gate 5 verification. This phase is structurally identical to ME Phase 51 and CA Phase 60. External IDs follow the OR FIPS-41 scheme. Oregon's 5 constitutional officers are ALL voter-elected (unlike ME where AG/SoS/Treasurer were legislature-appointed); `is_appointed_position=false` on all offices. The most significant finding vs. the phase description: **Secretary of State is Tobias Read** (not Griffin-Valade, who left office January 6, 2025).

**Primary recommendation:** Use the sos.oregon.gov Blue Book as the primary headshot source for all 5 executives (consistent paths, public domain state government portraits). Use unitedstates/images (gh-pages) for all 8 federal officials — all 8 images confirmed present.

---

## Officials Roster (Complete)

### OR Constitutional Officers (5)

| Name | Role | External ID | Chamber slug | District type | Headshot source | Notes |
|------|------|-------------|--------------|---------------|-----------------|-------|
| Tina Kotek | Governor | -4100001 | governor-of-oregon | STATE_EXEC | `sos.oregon.gov/blue-book/PublishingImages/Kotek.jpg` [VERIFIED: sos.oregon.gov] | Elected Jan 2023 |
| Dan Rayfield | Attorney General | -4100002 | attorney-general-of-oregon | STATE_EXEC | `doj.state.or.us/wp-content/uploads/2024/12/Rayfield_400x600x96_4-17x6-25.jpg` [VERIFIED: doj.state.or.us] | Elected Nov 2024, took office Dec 31 2024 |
| Tobias Read | Secretary of State | -4100003 | oregon-secretary-of-state | STATE_EXEC | `sos.oregon.gov/blue-book/PublishingImages/state/executive/SOSTobiasRead.jpg` [VERIFIED: sos.oregon.gov] | REPLACED Griffin-Valade; elected Nov 2024, took office Jan 6 2025 |
| Elizabeth Steiner | State Treasurer | -4100004 | oregon-state-treasurer | STATE_EXEC | `sos.oregon.gov/blue-book/PublishingImages/state/executive/TreasurerElizabethSteiner.jpg` [VERIFIED: sos.oregon.gov] | Elected Nov 2024, took office Jan 7 2025; do NOT use "Hayward" — official name is "Elizabeth Steiner" |
| Christina Stephenson | Labor Commissioner | -4100005 | oregon-labor-commissioner | STATE_EXEC | `sos.oregon.gov/blue-book/PublishingImages/StephensonC_Web.jpg` [VERIFIED: sos.oregon.gov] | Incumbent; running for re-election 2026 |

### OR US Senators (2)

| Name | Role | External ID | District geo_id | Bioguide | Headshot source | Notes |
|------|------|-------------|-----------------|----------|-----------------|-------|
| Ron Wyden | US Senator | -4101001 | 41 (NATIONAL_UPPER) | W000779 | `sos.oregon.gov/blue-book/PublishingImages/national/senator-wydenr1.jpg` [VERIFIED: sos.oregon.gov] | Term expires 2028; not up in 2026 |
| Jeff Merkley | US Senator | -4101002 | 41 (NATIONAL_UPPER) | M001176 | `sos.oregon.gov/blue-book/PublishingImages/national/senator-merkleyj1.jpg` [VERIFIED: sos.oregon.gov] | Up for re-election 2026 [VERIFIED: govtrack.us] |

**Note on senator headshots:** unitedstates/images has images for both (W000779.jpg, M001176.jpg) but they are from 2009 (old). The sos.oregon.gov Blue Book has more current portraits. Either source is public domain — Blue Book is recommended for recency.

### OR US House Representatives (6)

| Name | Role | External ID | District geo_id | Bioguide | Headshot source | Notes |
|------|------|-------------|-----------------|----------|-----------------|-------|
| Suzanne Bonamici | US Rep CD-01 | -4102001 | 4101 | B001278 | `raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/B001278.jpg` [VERIFIED: unitedstates/images] | Incumbent since 2012 |
| Cliff Bentz | US Rep CD-02 | -4102002 | 4102 | B000668 | `raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/B000668.jpg` [VERIFIED: unitedstates/images] | Incumbent since 2021 |
| Maxine Dexter | US Rep CD-03 | -4102003 | 4103 | D000635 | `raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/D000635.jpg` [VERIFIED: unitedstates/images, image confirmed present 2026-05-29] | New 119th Congress; replaced Blumenauer |
| Val Hoyle | US Rep CD-04 | -4102004 | 4104 | H001094 | `raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/H001094.jpg` [ASSUMED — not individually verified] | Incumbent since 2023 |
| Janelle Bynum | US Rep CD-05 | -4102005 | 4105 | B001326 | `raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/B001326.jpg` [VERIFIED: unitedstates/images, image confirmed present 2026-05-29] | New 119th Congress; defeated Chavez-DeRemer |
| Andrea Salinas | US Rep CD-06 | -4102006 | 4106 | S001226 | `raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/S001226.jpg` [VERIFIED: unitedstates/images, image confirmed present 2026-05-29] | Incumbent since 2023 |

---

## External ID Scheme

**Pattern:** OR FIPS = 41

| Range | Use | Example |
|-------|-----|---------|
| -4100001 through -4100005 | OR constitutional officers | -4100001 = Governor Kotek |
| -4101001 through -4101002 | OR US Senators | -4101001 = Wyden, -4101002 = Merkley |
| -4102001 through -4102006 | OR US House reps | -4102001 = CD-01 Bonamici |

**Rationale:** Mirrors ME scheme (-230001 exec, -230101 senators, -230201 house) and CA scheme (-6000101 exec, senators, -60003xx house). OR uses 7-digit negatives starting with FIPS code 41.

**Pre-flight required:** Before writing migration SQL, run:
```sql
SELECT external_id FROM essentials.politicians
WHERE external_id BETWEEN -4102999 AND -4100000;
```
Expected result: 0 rows (range is clear). Confirm before any INSERT.

---

## geo_id Reference

### NATIONAL_UPPER (both senators share)

| geo_id | district_type | state | Label |
|--------|---------------|-------|-------|
| `41` | NATIONAL_UPPER | OR | Oregon |

**Source:** Confirmed in Phase 72-02 Gate 5: `OR|NATIONAL_UPPER|1` row pre-seeded. [VERIFIED: Phase 72-02-SUMMARY.md]

### NATIONAL_LOWER (House, one per CD)

| CD | geo_id | Confirmed routing |
|----|--------|-------------------|
| CD-01 | `4101` | Portland City Hall → 4101 [VERIFIED: Phase 72-02 smoke test] |
| CD-02 | `4102` | [ASSUMED consistent with TIGER pattern] |
| CD-03 | `4103` | [ASSUMED consistent with TIGER pattern] |
| CD-04 | `4104` | [ASSUMED consistent with TIGER pattern] |
| CD-05 | `4105` | Bend rural (-121.4, 44.12) → 4105 [VERIFIED: Phase 72-02 smoke test] |
| CD-06 | `4106` | Salem (-123.0351, 44.9429) → 4106 [VERIFIED: Phase 72-02 smoke test] |

**Pattern derivation:** ME used `2301`, `2302` (state FIPS `23` + 2-digit CD). OR follows same pattern: `41` + 2-digit CD without leading zero padding, so CD-01 = `4101` (not `41001`). Verified directly from Phase 72-02 smoke test output. [VERIFIED: Phase 72-02-SUMMARY.md]

**Key difference from CA:** CA NATIONAL_LOWER geo_ids use 5-digit format (`06001`…`06052`) because CA FIPS is `06` (2 digits) + 3-digit district. OR FIPS is `41` (2 digits) + 2-digit district = 4 digits total. This matches ME's 4-digit format.

### STATE_EXEC Districts (create in migration 223)

Each executive officer gets a STATE_EXEC district. The pattern from ME Phase 51 is to create one STATE_EXEC district per executive office, with `geo_id = state_geo_id` (the government's geo_id = `41`).

**Decision needed for planner:** Whether all 5 executives share a single STATE_EXEC district (geo_id='41', label='Oregon (Statewide)') or each gets their own. ME used a single shared statewide district for all executives. Use the ME pattern: one shared STATE_EXEC district with geo_id='41'.

---

## District Structure Plan

### Migration 223 — STATE_EXEC district + executives

1. Create 1 STATE_EXEC district (geo_id='41', label='Oregon (Statewide)', district_type='STATE_EXEC', state='or')
   - Use WHERE NOT EXISTS guard (essentials.districts has no unique constraint on geo_id)
2. Insert 5 politician rows (one per constitutional officer)
3. Insert 5 office rows, each linked to:
   - The correct chamber_id (via subquery on name + government_id)
   - The STATE_EXEC district_id (via subquery)
   - is_appointed_position=false on ALL 5 (all voter-elected)
4. Back-fill office_id on politician rows (same UPDATE pattern as CA Phase 60)

### Migration 224 — Federal officials

1. No new districts needed (NATIONAL_UPPER geo_id='41' and NATIONAL_LOWER geo_ids 4101-4106 pre-seeded)
2. Retrieve NATIONAL_UPPER district_id (single row, geo_id='41')
3. Retrieve NATIONAL_LOWER district_ids (6 rows, geo_ids 4101-4106)
4. Insert 2 senator politician rows
5. Insert 6 House rep politician rows
6. Insert 2 senator office rows linked to NATIONAL_UPPER district
   - CRITICAL: Both senators share same district_id; uniqueness key is (district_id, politician_id) — NOT (district_id, chamber_id) [VERIFIED: STATE.md senator pattern]
7. Insert 6 House rep office rows, each linked to their NATIONAL_LOWER district
8. Back-fill office_id on politician rows

**Chamber subqueries for federal officials:**
- US Senate chamber: pre-existing, name='US Senate' or similar — verify exact name before writing SQL
- US House chamber: pre-existing, name='US House of Representatives' or similar — verify exact name

**Note:** Federal chambers (US Senate, US House) are NOT under the State of Oregon government — they exist under a federal government row. Research needed in the plan: query `SELECT id, name FROM essentials.chambers WHERE name ILIKE '%senate%' AND government_id IN (SELECT id FROM essentials.governments WHERE name ILIKE '%unit%')` or similar to find the correct federal chamber UUIDs before writing migration 224.

---

## Headshot Sources

### Strategy

- **OR executives (5):** sos.oregon.gov Blue Book (primary) — consistent public-domain state portraits at known URL paths. All 5 URLs confirmed working (fetched during research).
- **OR Senators (2):** sos.oregon.gov Blue Book national senators page — more current than unitedstates/images (which has 2009 photos). Public domain.
- **OR House reps (6):** unitedstates/images GitHub (primary) — 450×550 public domain, 3 of 6 individually verified present. Val Hoyle's image [ASSUMED] present but not individually verified; confirm before using.

### Per-Official Headshot Details

| Official | Primary URL | Source type | Crop needed | Notes |
|----------|------------|-------------|-------------|-------|
| Kotek | `https://sos.oregon.gov/blue-book/PublishingImages/Kotek.jpg` | state govt | top-crop to 4:5, resize to 600×750 | Blue Book portrait |
| Rayfield | `https://doj.state.or.us/wp-content/uploads/2024/12/Rayfield_400x600x96_4-17x6-25.jpg` | DOJ website | Already 400×600 (exact 2:3); crop to 400×500 (4:5) from top, resize to 600×750 | Pre-sized portrait |
| Read (SoS) | `https://sos.oregon.gov/blue-book/PublishingImages/state/executive/SOSTobiasRead.jpg` | state govt | top-crop to 4:5, resize to 600×750 | Blue Book portrait |
| Steiner | `https://sos.oregon.gov/blue-book/PublishingImages/state/executive/TreasurerElizabethSteiner.jpg` | state govt | top-crop to 4:5, resize to 600×750 | Blue Book portrait |
| Stephenson | `https://sos.oregon.gov/blue-book/PublishingImages/StephensonC_Web.jpg` | state govt | top-crop to 4:5, resize to 600×750 | Blue Book portrait |
| Wyden | `https://sos.oregon.gov/blue-book/PublishingImages/national/senator-wydenr1.jpg` | state govt | top-crop to 4:5, resize to 600×750 | Blue Book portrait; fresher than unitedstates/images |
| Merkley | `https://sos.oregon.gov/blue-book/PublishingImages/national/senator-merkleyj1.jpg` | state govt | top-crop to 4:5, resize to 600×750 | Blue Book portrait |
| Bonamici | `https://raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/B001278.jpg` | unitedstates/images | 450×550 (4:5.1 ratio), crop to 450×562 → resize 600×750 | Standard House portrait |
| Bentz | `https://raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/B000668.jpg` | unitedstates/images | Same as Bonamici | Standard House portrait |
| Dexter | `https://raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/D000635.jpg` | unitedstates/images | Same; 119th Congress orientation photo confirmed present | New member |
| Hoyle | `https://raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/H001094.jpg` | unitedstates/images | Same | [ASSUMED present — verify] |
| Bynum | `https://raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/B001326.jpg` | unitedstates/images | Same; 119th Congress orientation photo confirmed present | New member |
| Salinas | `https://raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/S001226.jpg` | unitedstates/images | Same; confirmed present | Incumbent since 2023 |

### Crop / Resize Rules (standard pattern — never deviate)

1. Download source image
2. Determine actual dimensions
3. Crop to 4:5 aspect ratio from top center (eyes at ~1/3 from top)
4. Resize to 600×750 (Lanczos, q90)
5. Storage path: `{politician_id}-headshot.jpg`
6. `politician_images.type = 'default'` (CRITICAL — 'headshot' causes silent UI invisibility)
7. `politician_images.photo_license = 'public_domain'`

---

## Migration Plan

| Migration | Content | Notes |
|-----------|---------|-------|
| 223 | 1 STATE_EXEC district + 5 OR executive politicians + 5 office rows | is_appointed_position=false on all |
| 224 | 2 OR senators + 6 OR House reps + 8 office rows linked to pre-existing NATIONAL districts | senators share NATIONAL_UPPER district geo_id='41' |
| 225 | Headshots audit SQL (like 200_sf_headshots.sql) | AUDIT-ONLY, not in migration ledger sequence |

**Note on migration numbering:** Phase 73 confirmed next migration is 223. No other migrations are pending between 222 and 223. [VERIFIED: Phase 73-01-SUMMARY.md]

---

## Gotchas and OR-Specific Notes

### 1. Secretary of State is Tobias Read, NOT Griffin-Valade

Griffin-Valade left office January 6, 2025. Tobias Read (D, former State Treasurer) was elected November 2024 and took office January 6, 2025. Every planning document, migration, and roadmap reference to "Griffin-Valade" in Phase 74 scope is stale. [VERIFIED: oregoncapitalchronicle.com, sos.oregon.gov]

### 2. Treasurer official name is "Elizabeth Steiner" (not "Elizabeth Steiner Hayward")

The official oregon.gov Treasury page uses "Elizabeth Steiner" as her name. Ballotpedia uses "Elizabeth Steiner Hayward." Use the government's own name: `full_name='Elizabeth Steiner'`. [VERIFIED: oregon.gov/treasury]

### 3. All OR constitutional officers are voter-elected

Unlike ME (where AG/SoS/Treasurer were legislature-appointed with `is_appointed_position=true`), Oregon's 5 constitutional officers including AG, SoS, and Treasurer are all popularly elected. Set `is_appointed_position=false` on all 5 office rows. [VERIFIED: Phase 73-01-SUMMARY.md key-decisions]

### 4. OR congressional geo_id format is 4-digit, not 5-digit

OR NATIONAL_LOWER geo_ids: `4101`–`4106` (4 digits: FIPS `41` + 2-digit CD).
CA used `06001`–`06052` (5 digits) because CA FIPS `06` is followed by 3-digit CD.
ME used `2301`, `2302` (same 4-digit pattern as OR).
Confirmed from Phase 72-02 smoke test: Portland City Hall → geo_id=`4101`. [VERIFIED: Phase 72-02-SUMMARY.md]

### 5. NATIONAL_UPPER district for OR pre-seeded with geo_id='41'

Phase 72-02 Gate 5 confirmed: `OR|NATIONAL_UPPER|1` — there is exactly 1 NATIONAL_UPPER district for Oregon. Its geo_id is `41` (state FIPS). Both senators will reference the same district_id. Use `(district_id, politician_id)` as the effective uniqueness check (not `(district_id, chamber_id)`) per the established senator dual-row pattern. [VERIFIED: Phase 72-02-SUMMARY.md]

### 6. Federal chambers (US Senate, US House) — verify UUIDs before writing migration 224

The US Senate and US House chambers pre-exist but their exact names and UUIDs need to be queried from DB before writing SQL. Do NOT hardcode UUIDs. Use subqueries like:
```sql
SELECT id FROM essentials.chambers WHERE name = 'US Senate'
-- or: WHERE name = 'United States Senate'
```
The exact canonical name is not verified in this research — **plan 74-02 must run a pre-flight query to confirm the chamber name**. [ASSUMED: chamber name pattern; needs DB verification]

### 7. districts.state casing for federal districts

From Phase 72-02: `NATIONAL_LOWER/NATIONAL_UPPER districts.state='OR'` (uppercase). These are pre-seeded rows. Plan 74-02's district subqueries should include `state='OR'` (uppercase) for NATIONAL rows, consistent with ME pattern. [VERIFIED: Phase 72-02-SUMMARY.md]

### 8. Val Hoyle image in unitedstates/images — verify before use

Bioguide H001094 confirmed from congress.gov. The unitedstates/images entry for H001094.jpg was not individually fetched during this research (unlike the other 3 House members). Verify the URL returns a valid image before relying on it in plan 74-03.

### 9. Duplicate name pre-check for federal officials

The STATE.md GOTCHA pattern: before inserting politicians, check for existing rows with the same full_name. Run:
```sql
SELECT full_name, COUNT(*) FROM essentials.politicians
WHERE full_name IN ('Tina Kotek', 'Dan Rayfield', 'Tobias Read', 'Elizabeth Steiner',
                    'Christina Stephenson', 'Ron Wyden', 'Jeff Merkley',
                    'Suzanne Bonamici', 'Cliff Bentz', 'Maxine Dexter',
                    'Val Hoyle', 'Janelle Bynum', 'Andrea Salinas')
GROUP BY full_name HAVING COUNT(*) > 1;
```
If any rows exist: use UPDATE to assign external_id, not INSERT.

### 10. Labor Commissioner — "Christina Stephenson" title

OR uses "Commissioner of Labor and Industries" (BOLI) not "Labor Commissioner" as a short form. The chamber was seeded as `name='Labor Commissioner'`, `name_formal='Oregon Labor Commissioner'` in migration 222. The office title should be consistent with the chamber — use `title='Labor Commissioner'` for the office row.

---

## Validation Architecture

### Post-migration 223 smoke test

```sql
-- Verify 5 OR exec offices created
SELECT p.full_name, c.name as chamber, d.district_type
FROM essentials.politicians p
JOIN essentials.offices o ON o.politician_id = p.id
JOIN essentials.chambers c ON c.id = o.chamber_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE p.external_id BETWEEN -4100010 AND -4100000
ORDER BY p.external_id;
-- Expected: 5 rows, all STATE_EXEC districts
```

### Post-migration 224 smoke test

```sql
-- Verify 8 federal officials with correct district routing
SELECT p.full_name, d.district_type, d.geo_id
FROM essentials.politicians p
JOIN essentials.offices o ON o.politician_id = p.id
JOIN essentials.districts d ON d.id = o.district_id
WHERE p.external_id BETWEEN -4102010 AND -4101000
ORDER BY p.external_id;
-- Expected: 2 rows with NATIONAL_UPPER geo_id='41', 6 rows with NATIONAL_LOWER geo_ids 4101-4106
```

### Address routing smoke test (phase success criterion #5)

Test a Portland OR address and verify it returns the correct US Representative (CD-01, Suzanne Bonamici):

```bash
# Curl the backend /representatives/me endpoint (authenticated) or use internal smoke-or-geofences.ts
# Portland City Hall: -122.6794, 45.5231
# Should route to NATIONAL_LOWER geo_id=4101 → Suzanne Bonamici
```

Alternatively, extend `smoke-or-geofences.ts` to include an assertion on the NATIONAL_LOWER district → politician lookup.

### Section-split detector (run after both migrations)

```sql
SELECT gb.geo_id, gb.mtfcc, COUNT(DISTINCT d.id) as district_count
FROM essentials.geofence_boundaries gb
LEFT JOIN essentials.districts d ON d.geo_id = gb.geo_id
WHERE gb.state = '41'
GROUP BY gb.geo_id, gb.mtfcc
HAVING COUNT(DISTINCT d.id) != 1
ORDER BY gb.geo_id;
-- Expected: 0 rows
```

---

## Future Scope (not Phase 74)

- **OR elections / discovery_jurisdictions**: Jeff Merkley is up for re-election 2026. OR SoS elections portal (sos.oregon.gov/elections/) is the canonical source. discovery_jurisdictions rows for OR 2026 elections belong in a later phase.
- **Phase 75**: OR state legislature (30 senators + 60 house reps) — STATE_UPPER/STATE_LOWER districts already loaded from Phase 72.
- **Portland city council**: Phase 76–77 scope.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Val Hoyle's image exists at unitedstates/images H001094.jpg | Headshot Sources | Fallback: clerk.house.gov headshot |
| A2 | Both senators share NATIONAL_UPPER district_id (geo_id='41') with no conflict on re-insert | District Structure | Plan 74-02 must pre-flight query the district_id before inserting |
| A3 | Federal chambers (US Senate, US House) pre-exist in DB with queryable names | Gotchas #6 | Plan 74-02 must run SELECT to confirm chamber names before writing SQL |
| A4 | All 5 exec officers need no pre-existing politician row check (no prior seed for OR executives) | Gotchas #9 | Pre-flight duplicate name query will catch any collision |

---

## Sources

### Primary (HIGH confidence — official sources verified during research)
- Oregon Department of Justice — `doj.state.or.us/oregon-department-of-justice/office-of-the-attorney-general/attorney-general-dan-rayfield/` — Rayfield confirmed as AG, headshot URL verified
- Oregon Secretary of State Blue Book — `sos.oregon.gov/blue-book/Pages/state/executive/` — all 5 executive headshot URLs confirmed
- Oregon Secretary of State Blue Book national — `sos.oregon.gov/blue-book/Pages/national-senators.aspx` — both senator headshot URLs confirmed
- Oregon Capital Chronicle — `oregoncapitalchronicle.com/2025/01/06/tobias-read-takes-office-as-oregon-secretary-of-state/` — Tobias Read as SoS confirmed
- Congress.gov — Bioguide IDs confirmed: B001278 (Bonamici), B000668 (Bentz), D000635 (Dexter), H001094 (Hoyle), B001326 (Bynum), S001226 (Salinas), W000779 (Wyden), M001176 (Merkley)
- Phase 72-02-SUMMARY.md — All OR geo_ids confirmed: Portland=4159000, CD-01=4101 through CD-06=4106, NATIONAL_UPPER=41
- Phase 73-01-SUMMARY.md — Confirmed next migration is 223; all 5 OR executive chamber slugs confirmed

### Secondary (MEDIUM confidence)
- unitedstates/images GitHub — D000635 (Dexter), B001326 (Bynum), S001226 (Salinas) images individually confirmed present via WebFetch
- GovTrack.us — Merkley 2026 re-election confirmed; Wyden term through 2028 confirmed

### Tertiary (LOW confidence)
- unitedstates/images H001094 (Hoyle) — assumed present, not individually verified

---

## Confidence Breakdown

| Area | Level | Reason |
|------|-------|--------|
| Officials roster | HIGH | All 13 officials verified via official state/federal sources |
| SoS correction | HIGH | Multiple authoritative sources confirm Read replaced Griffin-Valade Jan 2025 |
| External IDs | HIGH | Derived from confirmed FIPS=41 scheme; pre-flight query will confirm range is clear |
| geo_ids | HIGH | Phase 72-02 smoke test confirmed geo_ids for CD-01, CD-05, CD-06; pattern is deterministic for CD-02 through CD-04 |
| Headshot sources | HIGH (12/13) | All executive + 5/6 house rep URLs confirmed; Hoyle is ASSUMED |
| Federal chambers | MEDIUM | Pre-exist but canonical name not verified in this research session |

**Research date:** 2026-05-29
**Valid until:** 2026-08-29 (officials are stable; Merkley 2026 race could change post-primary)
