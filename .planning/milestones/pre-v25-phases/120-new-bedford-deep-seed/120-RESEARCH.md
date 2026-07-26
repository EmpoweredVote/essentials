# Phase 120: New Bedford Deep Seed - Research

**Researched:** 2026-06-14
**Domain:** Massachusetts local government seeding — New Bedford city government + (optional) school committee + headshots
**Confidence:** HIGH

---

## Summary

New Bedford, MA is a strong-Mayor city (Plan B charter) with an 11-member City Council (6 ward + 5 at-large) and a 7-member School Committee (6 elected at-large + Mayor ex-officio as Chair). Mayor Jonathan F. Mitchell (goes by "Jon Mitchell") is in his sixth term, having been first elected in 2011. The 2026 council has two new faces: James Roy (new at-large) and Scott Pemberton (Ward 2, replaced Maria Giesta who retired). Ward 6 Councilor Ryan Pereira was elected Council President for 2026.

The city's official website (newbedford-ma.gov) is protected by Cloudflare JavaScript challenge — not a simple 403, but a full JS managed challenge that blocks all automated scrapers including curl and WebFetch. Individual bio pages (`/city-council/biographies/{slug}/`) are indexed by Google and have a confirmed URL pattern, but the content is inaccessible without a real browser session. Alternative headshot sources (Wikipedia, news photos, campaign sites) must be investigated at execution time. The newbedfordguide.com local news site carries photos of each councilor, which may serve as a fallback.

The ROADMAP scopes Phase 120 as "Mayor + City Council officials and headshots" without explicitly mentioning School Committee. However, Phase 119 (Lynn) followed the same ROADMAP language and still included School Committee because an elected SC was found. New Bedford has an elected School Committee (6 members, confirmed), and the planner should include it using the same 3-migration pattern as Lynn (587 city gov + 588 school committee + 589 headshots) — or treat SC as deferred if REQUIREMENTS.md does not require it for NEWBED-01/02. This research documents both options; the planner must decide.

**Primary recommendation:** Follow the Lynn 3-migration pattern. Scope = Mayor + City Council (migration 587) + School Committee (migration 588) + headshots (migration 589). newbedford-ma.gov is Cloudflare-blocked; use Python `requests` with Wikimedia-style User-Agent or investigate alternative per-councilor image URLs at execution time.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NEWBED-01 | A New Bedford address returns a LOCAL section showing Mayor + City Council members with correct offices linked to New Bedford's geo_id | geo_id='2545000' confirmed from DB; 11-member council roster fully identified; pattern identical to Lynn 584 |
| NEWBED-02 | New Bedford elected officials have headshots at 600×750 in Supabase Storage; best-effort coverage | newbedford-ma.gov is Cloudflare-blocked; individual bio page URL pattern documented; fallback sources identified |

</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government row + chambers | Database / Storage | — | SQL migration; no UI change |
| District rows (LOCAL_EXEC + LOCAL + SCHOOL) | Database / Storage | — | SQL migration |
| Politicians + offices (city council) | Database / Storage | — | SQL migration 587 |
| Politicians + offices (school committee) | Database / Storage | — | SQL migration 588 (if SC included) |
| G5420 school district geofence | Database / Storage | — | Direct INSERT in migration 588; no MA G5420 TIGER loader |
| Headshot upload + politician_images | Database / Storage | API / Backend | Python script + SQL migration 589 |
| LOCAL section display | Browser / Client | Frontend Server (SSR) | Pre-existing routing; no UI change needed |

---

## DB Verification Results

All queries run against production Supabase via psql 2026-06-14.

| Query | Result |
|-------|--------|
| `SELECT geo_id, name, mtfcc, state FROM essentials.geofence_boundaries WHERE name ILIKE '%New Bedford%' AND state = '25'` | geo_id='2545000', name='New Bedford city', mtfcc='G4110', state='25' — 1 row [VERIFIED: DB query] |
| `SELECT COUNT(*) FROM essentials.governments WHERE name ILIKE '%New Bedford%'` | 0 rows — no existing New Bedford government [VERIFIED: DB query] |
| `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -2545000012 AND -2545000001` | 0 — external_id range is clear [VERIFIED: DB query] |
| `SELECT version FROM supabase_migrations.schema_migrations WHERE LENGTH(version) <= 5 ORDER BY version::bigint DESC LIMIT 5` | 586, 585, 584, 583, 582 — next migration is 587 [VERIFIED: DB query] |
| `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id = '2508430'` | 0 — no G5420 geofence for New Bedford Schools yet [VERIFIED: DB query] |

---

## New Bedford City Government — Verified Roster

### Mayor [VERIFIED: newbedford-ma.gov/mayor/biography/ URL confirmed; full name from Wikipedia Jon_Mitchell_(politician); sixth-term sworn Jan 2024]

**Jonathan F. Mitchell** — goes by "Jon Mitchell"; 38th Mayor of New Bedford; first elected 2011; sworn in for sixth 4-year term January 1, 2024.
- DB convention: first_name='Jon', last_name='Mitchell', full_name='Jon Mitchell'
- Role: LOCAL_EXEC; is_appointed=false
- Serves as Chair of the School Committee (ex-officio)
- external_id: -2545000001

### City Council — 11 members [VERIFIED: aol.com/articles/bedford-city-council-sworn-jan swearing-in article Jan 2026; cross-confirmed with newbedfordguide.com Jan 2026 articles]

New Bedford City Council structure: **5 at-large seats + 6 ward seats (Wards 1–6)** = **11 total**. There is no Ward 7. Plan B charter.

Title convention: **'City Councilor'** (American spelling, single-L) — confirmed by The New Bedford Light headlines and newbedfordguide.com articles. [VERIFIED: newbedfordlight.org/city-councilor-oliver-enters-mass-lieutenant-governor-race/]

At-large title: `'City Councilor'`
Ward title: `'City Councilor (Ward N)'`

**At-Large Councilors (5 seats):**

| # | Name | Status | external_id |
|---|------|--------|-------------|
| 1 | Ian Abreu | Re-elected Nov 2025 | -2545000002 |
| 2 | Shane A. Burgo | Re-elected Nov 2025 (outgoing Council President) | -2545000003 |
| 3 | Naomi R.A. Carney | Re-elected Nov 2025 | -2545000004 |
| 4 | Brian K. Gomes | Re-elected Nov 2025 | -2545000005 |
| 5 | James Roy | Newly elected Nov 2025 (replaced Linda Morad) | -2545000006 |

**Ward Councilors (6 seats):**

| # | Name | Ward | Status | external_id |
|---|------|------|--------|-------------|
| 6 | Leo Choquette | Ward 1 | Re-elected Nov 2025 | -2545000007 |
| 7 | Scott Pemberton | Ward 2 | Newly elected Nov 2025 (replaced Maria Giesta) | -2545000008 |
| 8 | Shawn Oliver | Ward 3 | Re-elected Nov 2025 | -2545000009 |
| 9 | Derek Baptiste | Ward 4 | Re-elected Nov 2025 | -2545000010 |
| 10 | Joseph P. Lopes | Ward 5 | Re-elected Nov 2025 | -2545000011 |
| 11 | Ryan J. Pereira | Ward 6 | Re-elected Nov 2025; Council President 2026 | -2545000012 |

**Council President note:** Ryan Pereira (Ward 6) is Council President for 2026 — but per project convention (D-06 from Lynn, D-06 from Somerville), his office title stays `'City Councilor (Ward 6)'` NOT `'City Council President'`. The President role is council-internal, not a charter office. [VERIFIED: prior-phase decisions 118-01 + 119-01]

**Total politician count (city only):** 12 (1 Mayor + 11 councilors)

---

## School Committee Scope Decision

### Structure [VERIFIED: newbedfordschools.org/school_committee, fetched 2026-06-14]

New Bedford School Committee has **7 members: 6 elected at-large + Mayor ex-officio as Chair**.

| Member | Term Ends | Role |
|--------|-----------|------|
| Mayor Jon Mitchell | — | Chair (ex-officio) |
| Melissa Costa | 2029 | Vice Chairperson |
| Christopher A. Cotter | 2027 | |
| Joaquim "Jack" Livramento, Jr. | 2027 | |
| Von Marie Moniz | 2029 | (note: page shows "VonMarie Moniz") |
| Richard Porter | 2029 | |
| William B. Markey | 2027 | |

NCES LEAID for New Bedford Public Schools: **2508430** [VERIFIED: nces.ed.gov/ccd/districtsearch/district_detail.asp?DistrictID=2508430]

School Committee geo_id (for SCHOOL district + G5420 geofence): `'2508430'`

External IDs for SC members: `-2508430001` through `-2508430006`
(Mayor Mitchell already seeded at -2545000001; ex-officio block uses that existing politician)

### Scope Recommendation

ROADMAP Phase 120 says "Mayor + City Council officials and headshots" — School Committee is NOT explicitly mentioned in REQUIREMENTS NEWBED-01 or NEWBED-02. However:
- Phase 119 (Lynn) used identical ROADMAP language but researcher included SC because it is democratically elected
- New Bedford SC is elected at-large (not appointed) — same pattern
- Consistent with all prior MA deep seeds (Newton, Somerville, Lynn all included SC)

**Planner decision: Include School Committee in Phase 120 (3-migration scope), following the Lynn pattern.** If the planner disagrees, SC can be deferred to a follow-up phase; NEWBED-01/NEWBED-02 do not technically require it.

---

## External ID Scheme

All external IDs use NEGATIVE integers. Prefix = geo_id digits.

```
Mayor:                -2545000001
At-Large Councilor 1: -2545000002  (Ian Abreu)
At-Large Councilor 2: -2545000003  (Shane A. Burgo)
At-Large Councilor 3: -2545000004  (Naomi R.A. Carney)
At-Large Councilor 4: -2545000005  (Brian K. Gomes)
At-Large Councilor 5: -2545000006  (James Roy)
Ward 1 Councilor:     -2545000007  (Leo Choquette)
Ward 2 Councilor:     -2545000008  (Scott Pemberton)
Ward 3 Councilor:     -2545000009  (Shawn Oliver)
Ward 4 Councilor:     -2545000010  (Derek Baptiste)
Ward 5 Councilor:     -2545000011  (Joseph P. Lopes)
Ward 6 Councilor:     -2545000012  (Ryan J. Pereira)

School Committee (if included):
SC Member 1:          -2508430001  (Melissa Costa)
SC Member 2:          -2508430002  (Christopher A. Cotter)
SC Member 3:          -2508430003  (Joaquim "Jack" Livramento, Jr.)
SC Member 4:          -2508430004  (Von Marie Moniz)
SC Member 5:          -2508430005  (Richard Porter)
SC Member 6:          -2508430006  (William B. Markey)
Mayor ex-officio:     -2545000001  (existing politician — no new INSERT)
```

**Note on Livramento name:** Published as `Joaquim "Jack" Livramento, Jr.` — goes by "Jack". DB convention: first_name='Jack', last_name='Livramento', full_name='Jack Livramento' (dropping Jr. per DB convention unless charter requires it; verify). [ASSUMED — confirm at execution whether Jr. suffix belongs in full_name]

---

## Migration Numbering Plan

| Migration | Purpose |
|-----------|---------|
| **587** | New Bedford city government (government row + City Council chamber + 2 districts + 12 politicians + 12 offices + office_id backfill) |
| **588** | New Bedford School Committee (IF included: G5420 geofence insert + Schools government + SCHOOL district + 6 SC politicians + 7 offices including Mayor ex-officio) |
| **589** | New Bedford headshots (Python script + politician_images rows for all officials with confirmed URLs) |

If SC is excluded: 587 = city gov, 588 = headshots (skip 589).

---

## Headshot Source Analysis

### newbedford-ma.gov CMS [VERIFIED: confirmed Cloudflare JS challenge from curl test 2026-06-14]

The official city website uses **Cloudflare "Managed Challenge"** — a full JavaScript-based bot protection that requires a real browser to solve. This is STRONGER than a simple 403 and will block:
- `curl` (any user-agent)
- Python `requests`
- WebFetch tool
- Any headless approach without JS execution

**Bio page URL pattern** (confirmed from Google index): `https://www.newbedford-ma.gov/city-council/biographies/{first-last}/`

Known slugs:
- `ian-abreu`
- `brian-k-gomes`
- `naomi-r-carney`
- `joseph-p-lopes`
- `ryan-j-pereira` (assumed — [ASSUMED])
- `leo-choquette` (assumed — [ASSUMED])
- `scott-pemberton` (assumed — new member, may not have bio page yet — [ASSUMED])
- `james-roy` (assumed — new member — [ASSUMED])

**Conclusion:** newbedford-ma.gov is NOT accessible via Python script. The headshot migration script must source images from alternative URLs.

### Mayor Jon Mitchell — Headshot Sources

1. **Wikipedia Commons**: Jon Mitchell Wikipedia page exists at `en.wikipedia.org/wiki/Jon_Mitchell_(politician)` — check for Wikimedia Commons image. Lynn Mayor Nicholson required Wikimedia; same pattern likely applies.
2. **Official city page** (`/mayor/biography/`): blocked by Cloudflare — unusable.
3. **jonmitchell.com** (campaign site): likely has a professional headshot. [ASSUMED — verify at execution]
4. **News photos**: turnto10.com, newbedfordlight.org, newbedfordguide.com all have photos — editorial use only; avoid.

### Council Members — Alternative Sources

**newbedfordlight.org**: The New Bedford Light local news site publishes staff profiles and council articles with individual photos. These are editorial photos, not official headshots — use only as last resort and check licensing. [ASSUMED — verify at execution]

**newbedfordguide.com**: Local news site with council election coverage including candidate photos. Same editorial caveat. [ASSUMED]

**Facebook/campaign pages**: Standard fallback research approach used in prior phases. [ASSUMED]

**LinkedIn**: Some councilors may have professional headshots on LinkedIn. [ASSUMED]

**Note on Newton CivicEngage block (Phase 117)**: Newton's newtonma.gov uses CivicEngage CMS which blocked images (0/33 uploaded). New Bedford's website uses a different stack (Cloudflare-fronted WordPress/CivicPlus) but the Cloudflare JS challenge means the same practical outcome — direct programmatic access is impossible.

**Expected headshot outcome**: Similar to Lynn (all city officials: moderate success via alternative sources; SC: likely all gaps). Plan for 5–9 of 11 city officials successfully uploaded; School Committee likely 0–2.

---

## Standard Stack

This phase uses no external packages — it follows the established MA deep seed pattern:

- Python 3 stdlib (`requests`, `io`, `os`) for headshot downloads + Supabase Storage API upload
- Supabase REST API for Storage upload (same as prior phases)
- SQL migrations via `mcp__supabase-local__execute_sql`

Reference scripts: `_tmp-lynn-headshots.py` (586), `_tmp-somerville-headshots.py` (583) — copy and adapt.

---

## Package Legitimacy Audit

No new packages are installed in this phase. This section is not applicable.

---

## Architecture Patterns

### Recommended Migration Structure

```
migrations/
├── 587_new_bedford_city_government.sql    # government + chamber + districts + 12 politicians + offices
├── 588_new_bedford_school_committee.sql   # G5420 geofence + SC government + SCHOOL district + 6 SC + ex-officio
└── scripts/
    └── _tmp-new-bedford-headshots.py      # headshot download + upload → feeds migration 589
```

### Migration 587 Pattern (direct copy from 584_lynn_city_government.sql)

```sql
-- Pre-flight 1: Government does not exist
-- Pre-flight 2: geo_id='2545000' G4110 geofence present
-- Pre-flight 3: external_id range -2545000012..-2545000001 is clear
-- BEGIN;
-- Step 1: INSERT governments (WHERE NOT EXISTS on name)
-- Step 2: INSERT chambers (City Council / 'New Bedford City Council')
-- Step 3a: INSERT districts LOCAL_EXEC (state='ma', geo_id='2545000', mtfcc=NULL)
-- Step 3b: INSERT districts LOCAL (state='ma', geo_id='2545000', mtfcc=NULL)
-- Step 4: 12 politician blocks (WITH ins_p AS ... INSERT INTO offices)
-- Step 5: office_id backfill (UPDATE WHERE office_id IS NULL)
-- Step 6: Post-verification DO block (7 gates: gov, chamber, 2 districts, 12 politicians, 12 offices, section-split=0, 0 null office_ids)
-- Step 7: INSERT supabase_migrations.schema_migrations ('587')
-- COMMIT;
```

### Migration 588 Pattern (direct copy from 585_lynn_school_committee.sql, adapt for LEAID=2508430)

```sql
-- Pre-flight 1: SC government does not exist
-- Pre-flight 2: external_id range -2508430001..-2508430006 is clear
-- Pre-flight 3: Mayor Mitchell external_id=-2545000001 exists (seeded in 587)
-- BEGIN;
-- Step 1: INSERT geofence_boundaries (geo_id='2508430', name='New Bedford Public Schools', mtfcc='G5420', state='25')
-- Step 2: INSERT governments ('New Bedford Public Schools, Massachusetts, US', type='LOCAL', state='MA', geo_id='2508430')
-- Step 3: INSERT chambers ('School Committee' / 'New Bedford School Committee')
-- Step 4: INSERT districts SCHOOL (state='ma', geo_id='2508430', mtfcc=NULL)
-- Step 5: 6 SC politician blocks + 1 Mayor ex-officio block (no re-INSERT for Mayor)
-- Step 6: office_id backfill (EXCLUDE -2545000001)
-- Step 7: Post-verification DO block
-- Step 8: INSERT schema_migrations ('588')
-- COMMIT;
```

### Key SQL Invariants (from prior phases)

```sql
-- CRITICAL: slug is GENERATED ALWAYS on essentials.chambers — NEVER include in INSERT
-- CRITICAL: governments.state = 'MA' (uppercase)
-- CRITICAL: districts.state = 'ma' (lowercase) 
-- CRITICAL: offices.representing_state = 'MA' (uppercase)
-- CRITICAL: mtfcc = NULL on LOCAL, LOCAL_EXEC, SCHOOL district rows
-- CRITICAL: party = NULL (antipartisan design)
-- CRITICAL: is_appointed = false (all popularly elected)
-- CRITICAL: WHERE NOT EXISTS guard on governments (no unique constraint on geo_id)
-- CRITICAL: geofence_boundaries.state = '25' (FIPS numeric, NOT 'MA')
-- CRITICAL: politician_images.type = 'default' (NOT 'headshot')
```

### Anti-Patterns to Avoid

- **Including Council President title**: Ryan Pereira's title is `'City Councilor (Ward 6)'` NOT `'City Council President'`. President is a council-internal role, not a charter office.
- **Using 'Councillor' spelling**: New Bedford uses American 'Councilor' (single L) — confirmed by official city press usage.
- **Assuming newbedford-ma.gov is scrapable**: It is Cloudflare JS-challenged. All headshot code must use alternative URLs.
- **Re-inserting Mayor for School Committee**: Use `CROSS JOIN` on existing politician via `WHERE external_id = -2545000001`, same as Lynn 585 Block 7.
- **Adding slug to chambers INSERT**: slug is GENERATED ALWAYS, causes error if included.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Headshot storage upload | Custom multipart upload | Supabase Storage REST API (same as _tmp-lynn-headshots.py) | Pre-tested pattern from 586 |
| Image crop/resize | Manual PIL code | PIL Lanczos crop-then-resize pipeline (4:5 first, then 600×750) | Established pattern; wrong order causes distortion |
| School district geofence | TIGER loader | Direct INSERT into geofence_boundaries | No MA G5420 TIGER loader exists; pattern from 585 |

---

## Common Pitfalls

### Pitfall 1: newbedford-ma.gov Cloudflare Block
**What goes wrong:** Any automated access to newbedford-ma.gov (curl, requests, WebFetch) returns Cloudflare JS challenge page (HTML with `window._cf_chl_opt`), not the bio content.
**Why it happens:** Cloudflare Managed Challenge is site-wide — not just a 403, it requires JS execution.
**How to avoid:** Do NOT attempt to scrape newbedford-ma.gov. Source headshots from Wikipedia Commons (Mayor), Wikimedia, or investigate individual social media / news profiles at execution time.
**Warning signs:** Response body starts with `<!DOCTYPE html><html lang="en-US"><head><title>Just a moment...`

### Pitfall 2: "Councillor" vs "Councilor" Spelling
**What goes wrong:** New Bedford's city charter uses "Councillor" (double-L British/MA traditional spelling) in the formal text, but official press releases, city website bios, and local press all use "Councilor" (single-L American spelling).
**Why it happens:** MA cities historically used "Councillor" but modern web usage has shifted to "Councilor". Somerville and Lynn research also confirmed "Councilor" for those cities.
**How to avoid:** Use `'City Councilor'` and `'City Councilor (Ward N)'` in all title fields — same as Lynn and Somerville.
**Warning signs:** If charter PDF text says "Councillor-at-Large", use "City Councilor" in the DB per modern usage convention.

### Pitfall 3: Ward Count (No Ward 7)
**What goes wrong:** Incorrectly assuming 7 wards because Lynn has 7 wards.
**Why it happens:** Different cities have different ward counts. New Bedford has exactly 6 wards.
**How to avoid:** Wards 1–6 only. No Ward 7 seat exists. Confirmed: 6 ward councillors + 5 at-large = 11 total.
**Warning signs:** If any source mentions a Ward 7, re-verify; it does not exist on current council.

### Pitfall 4: School Committee Livramento Jr. Name
**What goes wrong:** Incorrect rendering of `Joaquim "Jack" Livramento, Jr.` in full_name.
**Why it happens:** Nickname ("Jack"), accented first name, and Jr. suffix create multiple variations.
**How to avoid:** DB convention: first_name='Jack', last_name='Livramento', full_name='Jack Livramento'. Drop "Jr." from full_name per DB convention (no prior phase seeded Jr. suffix). Confirm at execution.
**Warning signs:** N/A — document the decision in the migration header comment.

### Pitfall 5: Carney Middle Initial Variation
**What goes wrong:** Naomi Carney has middle initial "R.A." on the swearing-in article (full: "Naomi R.A. Carney"). Using multiple middle initials in full_name may be inconsistent with DB patterns.
**Why it happens:** Some officials have compound middle initials.
**How to avoid:** Use `full_name='Naomi Carney'`, `first_name='Naomi'`, `last_name='Carney'` — drop middle initials for cleanliness, consistent with prior patterns. Or use `'Naomi R.A. Carney'` if the official source is unambiguous. Decide at execution time based on official bio.

### Pitfall 6: James Roy Bio Page May Not Exist Yet
**What goes wrong:** Newly elected (Nov 2025) councilors may not yet have bio pages on newbedford-ma.gov.
**Why it happens:** City websites lag new officeholders by weeks or months.
**How to avoid:** Scott Pemberton and James Roy are both new as of Jan 2026. Assume bio pages may be absent; use alternative sources for headshots.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CivicEngage scraping (Newton pattern) | Cloudflare bypass not possible; use alternative sources | Phase 117 | Newton: 0/33 headshots uploaded; NB same outcome likely |
| CivicLive CDN direct access (Lynn pattern) | newbedford-ma.gov is not CivicLive — it's Cloudflare-protected | This phase | Cannot use CDN approach; need alternative per-official sources |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Ryan Pereira slug = `ryan-j-pereira` on bio page | Headshot Source Analysis | Script would need different slug; low impact as site is blocked anyway |
| A2 | Leo Choquette slug = `leo-choquette` on bio page | Headshot Source Analysis | Same as A1 |
| A3 | Scott Pemberton slug = `scott-pemberton` (new member, page may not exist) | Headshot Source Analysis | Expected gap; no production risk |
| A4 | James Roy slug = `james-roy` (new member, page may not exist) | Headshot Source Analysis | Expected gap; no production risk |
| A5 | Livramento full_name drops Jr. suffix | External ID Scheme | Minor display difference; confirm at execution from official source |
| A6 | jonmitchell.com campaign site has a suitable headshot for Mayor | Headshot Source Analysis | Would need Wikimedia fallback; low risk |
| A7 | School Committee title = `'School Committee Member'` for elected members | School Committee section | Consistent with Lynn/Newton pattern; verify vs newbedfordschools.org |

---

## Open Questions

1. **School Committee inclusion**
   - What we know: SC has 6 elected at-large members + Mayor ex-officio; ROADMAP says Mayor + City Council only; prior phases included SC when found
   - What's unclear: Whether NEWBED-01/02 implicitly require SC or explicitly exclude it
   - Recommendation: Include SC (3-migration pattern, 587/588/589). Flag in plan if planner disagrees.

2. **Headshot sources for council members**
   - What we know: newbedford-ma.gov is Cloudflare-blocked; individual bio page slugs are partially known
   - What's unclear: Which alternative sources (Wikipedia, newsphoto, social media) will yield 600×750-capable images
   - Recommendation: Python script should attempt Wikipedia Commons first, then fall back to investigating other sources. Document gaps honestly.

3. **Von Marie Moniz name rendering**
   - What we know: newbedfordschools.org renders as "Von Marie Moniz" (two words, not hyphenated)
   - What's unclear: Whether this is first_name='Von Marie' or first_name='Von', middle_name='Marie'
   - Recommendation: first_name='Von Marie', last_name='Moniz', full_name='Von Marie Moniz' — treat as compound first name.

4. **William B. Markey disambiguation**
   - What we know: A "William Brad Markey" appears in Google's index of older newbedford-ma.gov bio pages (Ward 1, 2017); current SC member is "William B. Markey" who won a school committee seat per WBSM
   - What's unclear: Whether this is the same person now on SC or a different person
   - Recommendation: Verify at execution; if Ward 1 councilor Markey is no longer on the council and is now on the SC, note this in the migration header.

---

## Environment Availability

Step 2.6: External dependencies are: Python 3, psql, Supabase Storage REST API.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3 | Headshot upload script | ✓ | (system Python) | — |
| psql | Migration apply audit | ✓ | 18 | — |
| Supabase Storage REST API | Headshot upload | ✓ | (live production) | — |
| newbedford-ma.gov | Bio page headshots | ✗ | Cloudflare-blocked | Alternative per-official sources at execution |

---

## Validation Architecture

nyquist_validation not configured as false — include section.

### Test Framework

This phase has no automated test suite (DB-only migration phase). Verification is inline SQL in each migration's post-verification DO block.

| Property | Value |
|----------|-------|
| Framework | Inline SQL DO blocks (established pattern) |
| Config file | None |
| Quick run command | `psql $DB -c "SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -2545000012 AND -2545000001;"` |
| Full suite command | Migration 587 post-verification block (7 gates) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NEWBED-01 | NB address returns LOCAL section with Mayor + 11 councilors | Integration (SQL gates) | `SELECT COUNT(*) FROM offices o JOIN districts d ON d.id=o.district_id WHERE d.geo_id='2545000'` | ❌ Wave 0 (inside migration) |
| NEWBED-02 | Officials have headshots at 600×750 | Manual/SQL | `SELECT COUNT(*) FROM politician_images pi JOIN politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -2545000012 AND -2545000001 AND pi.type='default'` | ❌ Wave 0 (inside migration 589) |

### Sampling Rate

- **Per migration commit:** Run post-verification DO block (inline in migration SQL)
- **Phase gate:** Full headshot count query + section-split check before closing phase

### Wave 0 Gaps

- [ ] `migrations/587_new_bedford_city_government.sql` — covers NEWBED-01 (government + council)
- [ ] `migrations/588_new_bedford_school_committee.sql` — covers School Committee (if included)
- [ ] `scripts/_tmp-new-bedford-headshots.py` — covers NEWBED-02
- [ ] `migrations/589_new_bedford_headshots.sql` — covers NEWBED-02 (politician_images rows)

---

## Security Domain

This phase writes only to the production Supabase DB via authenticated MCP/psql. No new attack surface is introduced. ASVS categories are not applicable (no new API endpoints, no user-facing auth changes, no input from untrusted sources).

---

## Sources

### Primary (HIGH confidence)
- Production Supabase DB (psql queries, 2026-06-14) — geo_id, migration counter, government existence
- newbedfordschools.org/school_committee — School Committee roster (fetched 2026-06-14)
- aol.com/articles/bedford-city-council-sworn-jan-090157338 — Complete 11-member swearing-in roster Jan 2026
- nces.ed.gov/ccd/districtsearch/district_detail.asp?DistrictID=2508430 — NCES LEAID 2508430 confirmed
- en.wikipedia.org/wiki/New_Bedford,_Massachusetts — FIPS 25-45000 → geo_id 2545000
- 584_lynn_city_government.sql — Lynn migration as template

### Secondary (MEDIUM confidence)
- newbedfordguide.com (Jan 2026 articles) — council roster cross-verification, name spellings
- newbedfordlight.org — "City Councilor" spelling usage, ward designations
- wbsm.com/new-bedford-council-committee-assignments-2026/ — confirms all 11 names (complete list)

### Tertiary (LOW confidence)
- bostonmetroauthority.com/new-bedford-city-government — council structure "3 at-large + 8 ward" INCORRECT; superseded by primary sources
- Initial WebSearch AI summary about "3 at-large" — INCORRECT; corrected by multiple primary sources

---

## Metadata

**Confidence breakdown:**
- geo_id: HIGH — DB-verified
- Migration counter (next=587): HIGH — DB-verified (last=586)
- Mayor name/term: HIGH — Wikipedia + official site search confirmed
- Council roster: HIGH — swearing-in article (Jan 2026) cross-confirmed with multiple sources
- Council structure (5 at-large + 6 ward): HIGH — multiple independent sources agree
- Title "City Councilor" spelling: HIGH — official press usage confirmed
- School Committee roster: HIGH — newbedfordschools.org fetched directly
- Headshot source analysis: MEDIUM — Cloudflare block confirmed; alternative sources are [ASSUMED] until execution
- SC inclusion decision: MEDIUM — pattern strongly implies inclusion; not locked by REQUIREMENTS

**Research date:** 2026-06-14
**Valid until:** 2026-07-14 (stable government — no elections until Nov 2027 cycle; council roster stable)
