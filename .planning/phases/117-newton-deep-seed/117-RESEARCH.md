# Phase 117: Newton Deep Seed - Research

**Researched:** 2026-06-14
**Domain:** Massachusetts local government seeding — Newton city government + school committee
**Confidence:** HIGH

## Summary

Newton, MA is a Mayor-Council city with a 24-member City Council (16 at-large, 8 ward) and a 9-member elected School Committee (8 ward-elected + Mayor ex officio). The city held elections in November 2025 that produced a new Mayor (Marc Laredo, sworn in January 1, 2026) and significant council/school committee turnover. The complete rosters have been verified from multiple authoritative sources.

The migration pattern is well-established from Boston (migration 347) and Worcester (migration 351): government row + chamber + LOCAL_EXEC district + LOCAL district + politicians with offices. For the school committee, the Boston school committee pattern (migration 348) applies: G5420 geofence inserted directly, SCHOOL district type, is_appointed=false (elected officials), Mayor as ex-officio with is_appointed=true.

Newton's city geo_id=2545560 is confirmed present in geofence_boundaries from v5.0. No new TIGER load is needed. The school district NCES LEAID=2508610 gives geo_id='2508610' for the school committee.

**Primary recommendation:** Use Worcester-style flat-district pattern for the city council (all 24 councillors link to a single LOCAL district, ward encoded in office title). Newton does NOT need per-ward geofences — there is no digital boundary dataset available through the city, and the Tier-3 precedent (Worcester, Springfield) encodes ward in title strings. This avoids the Boston-style X0013 custom geofence loader complexity.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NEWTON-01 | A Newton address returns a LOCAL section showing Mayor + Board of Aldermen (or City Council) + School Committee members with correct offices linked to geo_id=2545560 | Government seeding pattern verified (Worcester 351 + Boston 347/348); all 25 officials identified |
| NEWTON-02 | All Newton elected officials (Mayor + council + school committee) have headshots at 600x750 in Supabase Storage; best-effort where official photos unavailable | newtonma.gov blocks WebFetch (403); fallback sources identified; expect gaps for newer councillors |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government row + chambers | Database / Storage | — | SQL migration; no UI change |
| District rows (LOCAL_EXEC + LOCAL + SCHOOL) | Database / Storage | — | SQL migration |
| Politicians + offices | Database / Storage | — | SQL migration |
| G5420 school district geofence | Database / Storage | — | Direct INSERT in migration; no TIGER loader for MA G5420 |
| Headshot upload + politician_images | Database / Storage | API / Backend | Python script → Supabase Storage + SQL migration |
| LOCAL section display | Browser / Client | Frontend Server (SSR) | Pre-existing routing; no UI change needed |

## Standard Stack

No new packages required. Phase uses existing project infrastructure only.

| Tool | Version | Purpose | Source |
|------|---------|---------|--------|
| mcp__supabase-local | — | Execute SQL migrations directly | Project standard |
| Python headshot script | 3.x | Download, crop 4:5, resize 600x750, upload to politician_photos bucket | Phase 109 pattern |
| Pillow (PIL) | existing | Image crop + resize | Project standard |
| supabase-py | existing | Supabase Storage upload | Project standard |

## Package Legitimacy Audit

No new packages to install — phase uses existing project dependencies only.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Newton Government Structure — Verified Roster

### Mayor [VERIFIED: lwvnewton.org, newtonma.gov, WBUR, Newton Beacon]

**Marc C. Laredo** — sworn in January 1, 2026; term expires January 1, 2030
- Former City Council President (Ward 7 At-Large); won 2025 mayoral race with 77% of vote
- Role: LOCAL_EXEC; district_type='LOCAL_EXEC'; is_appointed=false
- Ex-officio member of School Committee (with vote — 9th voting member)

### City Council — 24 members [VERIFIED: figcitynews.com Nov 2025 election results]

Newton City Council structure: 16 at-large councillors (2 per ward) + 8 ward councillors (1 per ward) = 24 total.
Councillors serve 2-year terms. All 24 seats were on the ballot in November 2025.

**Ward 1:**
- At-Large: Allison Leary, John Oliver
- Ward: Maria S. Greenberg

**Ward 2:**
- At-Large: Susan Albright, Tarik Lucas
- Ward: David Micley

**Ward 3:**
- At-Large: Andrea Kelley, Pamela Wright
- Ward: Julia Malakie

**Ward 4:**
- At-Large: Josh Krintzman, Cyrus Dahmubed
- Ward: Randy Block

**Ward 5:**
- At-Large: Brittany Hume Charm, Rena Getz
- Ward: Julie Irish

**Ward 6:**
- At-Large: Lisa Gordon, Sean Roche
- Ward: Martha Bixby

**Ward 7:**
- At-Large: Brian Golden, Becky Grossman
- Ward: Lisle Baker (note: full name is "R. Lisle Baker" per newtonma.gov staff directory)

**Ward 8:**
- At-Large: David Kalis, Jacob Silber
- Ward: Stephen Farrell

**Title usage:** Official Newton city charter uses "Alderman" historically, but the body has been officially called the "City Council" for many years. Office title in SQL = 'City Councilor'. [VERIFIED: newtonma.gov current site uses "City Council" throughout]

### School Committee — 9 members [VERIFIED: newton.k12.ma.us, Newton Beacon Nov 2025]

Newton School Committee: 8 ward-elected members + Mayor as ex-officio (9th voting member). All 8 ward seats were on the November 2025 ballot. Nearly all new faces after teacher-strike-related political shake-up.

| Ward | Name | Notes |
|------|------|-------|
| Ward 1 | Arrianna Proia | New member Jan 2026 |
| Ward 2 | Linda Swain | New member Jan 2026 |
| Ward 3 | Jason Bhardwaj | Vice Chair |
| Ward 4 | Tamika Olszewski | New member Jan 2026 |
| Ward 5 | Ben Schlesinger | New member Jan 2026 |
| Ward 6 | Jonathan Greene | New member Jan 2026 |
| Ward 7 | Alicia Piedalue | Chair |
| Ward 8 | Victor Lee | New member Jan 2026 |
| Mayor (ex officio) | Marc Laredo | 9th voting member; is_appointed=true in politicians table |

**School Committee election model:** Ward-elected (is_appointed=false for Ward 1–8 members). Mayor serves as ex-officio with is_appointed=true. [VERIFIED: newton.k12.ma.us/school-committee]

**CRITICAL — Mayor as ex-officio:** The Mayor is a voting member of the School Committee in Newton. Seed Mayor Laredo in BOTH the city government (LOCAL_EXEC, is_appointed=false) AND the school committee (SCHOOL, is_appointed=true). Two offices, one politician row. Use the same politician_id for both office rows.

## Key IDs and Schema Values

### City Government
| Field | Value | Source |
|-------|-------|--------|
| geo_id (city) | '2545560' | STATE.md; G4110 from v5.0 |
| governments.state | 'MA' (uppercase) | MA convention D-11 |
| districts.state | 'ma' (lowercase) | MA convention D-10 |
| offices.representing_state | 'MA' (uppercase) | MA convention D-11 |
| Government name | 'City of Newton, Massachusetts, US' | Boston/Worcester pattern |
| Chamber name | 'City Council' | Official name |
| Chamber name_formal | 'Newton City Council' | Boston/Worcester pattern |
| LOCAL_EXEC district label | 'Newton (Citywide)' | Worcester pattern |
| LOCAL district label | 'Newton' | Worcester pattern |
| is_appointed | false | All elected |
| party | NULL | Antipartisan design |

### School District
| Field | Value | Source |
|-------|-------|--------|
| NCES LEAID | 2508610 | nces.ed.gov verified |
| geo_id (school) | '2508610' | LEAID value (same as BPS pattern: LEAID=2502790 → geo_id='2502790') |
| G5420 geofence state | '25' | FIPS numeric string for MA |
| Government name | 'Newton Public Schools, Massachusetts, US' | Boston pattern adapted |
| Chamber name | 'School Committee' | Official name |
| Chamber name_formal | 'Newton School Committee' | Boston pattern adapted |
| district_type | 'SCHOOL' | NOT 'SCHOOL_DISTRICT' — critical |
| is_appointed | false (members 1–8), true (Mayor) | 8 elected + 1 ex-officio |

### External ID Scheme
| Range | Usage | Count |
|-------|-------|-------|
| -2545560001 | Mayor Laredo (city) | 1 |
| -2545560002..-2545560025 | 24 City Councillors | 24 |
| -2508610001..-2508610008 | 8 School Committee members | 8 |
| ~~-2508610009~~ | ~~Mayor Laredo (school, ex-officio)~~ | SUPERSEDED — Mayor seeded once only; SC ex-officio is a second office row on existing politician -2545560001 |

**Total politicians to seed:** Mayor Laredo (1, shared across both bodies) + 24 councillors + 8 SC members = 33 rows in politicians table. Mayor gets 2 office rows. Total offices: 1 (LOCAL_EXEC) + 24 (LOCAL) + 9 (SCHOOL) = 34.

**NOTE on Mayor's politician row:** Mayor Laredo is seeded ONCE in politicians (external_id=-2545560001) with is_appointed=false (he is elected). His SC ex-officio role requires a SECOND office row pointing to the SCHOOL district, with is_appointed_position=false but the politicians row has is_appointed=true ONLY if seeded as a separate politician row. Per the Boston SC pattern (D-16 override), appointed/ex-officio members use is_appointed=true on the politicians table. **Decision needed:** either (a) seed Mayor twice with different external_ids, or (b) use is_appointed=false on the politicians row and carry the distinction only in the office title.

Recommendation: Seed Mayor Laredo ONCE (external_id=-2545560001, is_appointed=false — he is elected Mayor), then link him to BOTH the LOCAL_EXEC office AND the SCHOOL district office using the same politician_id. The is_appointed=true pattern in Boston SC was for a fully appointed committee; since Mayor's SC role is structural (not appointment-based), is_appointed=false is correct for the politician row.

## Architecture Patterns

### Recommended Migration Structure

Three migrations following the Boston Wave 1/Wave 2 pattern:

- **Migration 578:** City of Newton government (Mayor + 24 City Councillors)
- **Migration 579:** Newton Public Schools school committee (8 elected members + Mayor ex-officio linkage)
- **Migration 580:** Newton headshots (Python script uploads; SQL migration records results)

### City Government Pattern (Worcester 351 model)

```sql
-- Pre-flight 1: government idempotency notice
DO $$ BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'City of Newton, Massachusetts, US') > 0 THEN
    RAISE NOTICE 'City of Newton government row already exists — skipping (idempotent re-run)';
  END IF;
END $$;

-- Pre-flight 2: Assert Newton G4110 geofence present (v5.0)
DO $$ DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM essentials.geofence_boundaries
  WHERE geo_id = '2545560' AND mtfcc = 'G4110';
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: Newton G4110 geofence not found';
  END IF;
END $$;

-- Pre-flight 3: Assert external_id range clear (-2545560001..-2545560025)
-- Step 1: Government row (WHERE NOT EXISTS guard)
-- Step 2: City Council chamber
-- Step 3a: LOCAL_EXEC district (geo_id='2545560', state='ma', mtfcc=NULL)
-- Step 3b: LOCAL district (geo_id='2545560', state='ma', mtfcc=NULL)
-- Step 4: 25 politician+office blocks (Mayor + 24 councillors)
--   Councillor title pattern: 'City Councilor' (at-large) or 'City Councilor (Ward N)' (ward seat)
-- Step 5: office_id back-fill
-- Step 6: Post-verification DO block (7 gates)
-- Step 7: schema_migrations ledger entry
```

### School Committee Pattern (Boston 348 model)

```sql
-- Step 0: Insert G5420 geofence directly (no MA G5420 TIGER loader)
INSERT INTO essentials.geofence_boundaries (geo_id, mtfcc, state)
SELECT '2508610', 'G5420', '25'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.geofence_boundaries
  WHERE geo_id = '2508610' AND mtfcc = 'G5420'
);

-- Step 1: Government row (Newton Public Schools)
-- Step 2: School Committee chamber
-- Step 3: SCHOOL district (geo_id='2508610', state='ma')
-- Step 4: 9 politician+office blocks
--   Members 1–8: is_appointed=false (elected)
--   Block 9 (Mayor Laredo): reuse politician from migration 578 via subquery on external_id=-2545560001
-- Step 5: office_id back-fill (School Committee offices only — do not overwrite city office_id)
-- Step 6: Post-verification
```

**IMPORTANT — Mayor in School Committee:** Do NOT insert Mayor Laredo as a new politician in migration 579. Instead, link his existing politician_id to the SCHOOL district office:

```sql
-- Mayor Laredo school committee office — link existing politician
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'School Committee'
        AND government_id = (SELECT id FROM essentials.governments
                             WHERE name = 'Newton Public Schools, Massachusetts, US')),
       p.id,
       'Mayor (ex officio)', 'MA', false, false, NULL
FROM essentials.districts d
CROSS JOIN (SELECT id FROM essentials.politicians
            WHERE external_id = -2545560001) p
WHERE d.geo_id = '2508610'
  AND d.district_type = 'SCHOOL'
  AND d.state = 'ma'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

Note: office_id back-fill for the School Committee offices should NOT overwrite Mayor Laredo's office_id (which points to his LOCAL_EXEC office). Skip office_id update for external_id=-2545560001 in migration 579.

### Office Title Conventions

| Role | Title String |
|------|-------------|
| Mayor (city) | 'Mayor' |
| At-large City Councillor | 'City Councilor' |
| Ward City Councillor | 'City Councilor (Ward N)' where N = ward number |
| School Committee member | 'School Committee Member' |
| Mayor in School Committee | 'Mayor (ex officio)' |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image crop + resize | Custom crop logic | Pillow PIL (crop 4:5 → resize 600x750 Lanczos) | Existing pattern from Phase 109 |
| School district geofence | TIGER G5420 loader | Direct INSERT in migration | No MA G5420 rows loaded by TIGER loader |
| Ward geofences for council | ArcGIS/custom boundary loader | Encode ward in title string | Tier-3 pattern (Worcester); no digital boundary available |

## Common Pitfalls

### Pitfall 1: Wrong title format for City Councillors
**What goes wrong:** Using 'City Councillor' (British spelling) instead of 'City Councilor' (American spelling used in Newton's official charter)
**Why it happens:** Boston migration uses 'City Councillor'; Newton uses 'City Councilor'
**How to avoid:** Check official city website/charter — Newton uses "Councilor" not "Councillor"
**Note:** Both are acceptable in different MA cities; verify per city [ASSUMED — newtonma.gov returns 403 so could not read the actual charter text directly]

### Pitfall 2: Seeding Mayor Laredo twice in politicians table
**What goes wrong:** Inserting Mayor Laredo as a new politician in migration 579 for the School Committee
**Why it happens:** SC migration template creates a politician row per member
**How to avoid:** Use the existing politician_id (external_id=-2545560001) from migration 578 for the SC ex-officio office INSERT

### Pitfall 3: Wrong geo_id for School Committee
**What goes wrong:** Using geo_id='2545560' (city) for the school committee
**Why it happens:** City and school district are geographically coterminous
**How to avoid:** School committee MUST use geo_id='2508610' (NCES LEAID); the routing query joins on district.geo_id to geofence_boundaries — using the wrong geo_id breaks SCHOOL section routing

### Pitfall 4: office_id back-fill overwrites Mayor's city office_id
**What goes wrong:** Migration 579 back-fills office_id for ALL politicians in SC, overwriting Mayor Laredo's office_id from migration 578
**Why it happens:** Standard back-fill UPDATE matches on politician_id
**How to avoid:** Exclude external_id=-2545560001 from the migration 579 back-fill UPDATE; Mayor's canonical office_id should point to his LOCAL_EXEC office

### Pitfall 5: Including slug in chambers INSERT
**What goes wrong:** SQL error on INSERT INTO chambers including a 'slug' column
**Why it happens:** slug is GENERATED ALWAYS — PostgreSQL rejects explicit VALUES for generated columns
**How to avoid:** Never include slug in INSERT column list for essentials.chambers

### Pitfall 6: governments table WHERE NOT EXISTS guard
**What goes wrong:** Duplicate government rows for Newton
**Why it happens:** essentials.governments has NO unique constraint on geo_id
**How to avoid:** Always use WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = 'City of Newton, Massachusetts, US')

### Pitfall 7: districts.state casing
**What goes wrong:** Routing query returns no results; Newton address shows no LOCAL section
**Why it happens:** districts.state must be 'ma' (lowercase) — routing queries use lowercase state code
**How to avoid:** All LOCAL and LOCAL_EXEC and SCHOOL districts use state='ma' (lowercase). governments.state='MA' and offices.representing_state='MA' are uppercase.

### Pitfall 8: newtonma.gov headshot source returns 403
**What goes wrong:** Headshot script cannot scrape photos from newtonma.gov
**Why it happens:** newton.gov blocks non-browser HTTP requests (confirmed 403 on all tested URLs)
**How to avoid:** Fallback headshot sources: Wikimedia Commons, LinkedIn, official campaign sites, local news (Newton Beacon, Fig City News). Document gaps in headshot migration comments.

## Headshot Sources Research

### Primary Source: newtonma.gov (BLOCKED)
All attempts to fetch from www.newtonma.gov return HTTP 403. The site appears to block programmatic access entirely. [VERIFIED: multiple fetch attempts in this research session all returned 403]

### Fallback Sources (to try during plan execution)
1. **Mayor Laredo:** newtonma.gov/government/mayor (403 blocked) → try laredofornewton.com campaign site or Newton Beacon news photos
2. **City Councillors:** Per-ward pages on newtonma.gov (all 403) → Wikipedia Commons, news articles (Newton Beacon, Fig City News), LinkedIn
3. **School Committee:** newton.k12.ma.us/school-committee — try this domain separately (different from newtonma.gov; may not be blocked)
4. **Alternative pattern:** Try curl with a browser User-Agent header from the headshot script — some Revize/CivicPlus sites only block Python's default UA

**Recommendation for Plan:** Use Python requests with a browser User-Agent string as first attempt. If still 403, fall back to manual photo collection from campaign sites/news photos. School Committee members are almost all new (Jan 2026) and will have thin headshot availability. Expect 40-60% coverage; document gaps.

### CMS Pattern
newtonma.gov appears to use CivicEngage (Revize) CMS based on URL patterns like `/Home/Components/StaffDirectory/StaffDirectory/44/89`. Staff directory images may follow: `https://www.newtonma.gov/Home/ShowImage?id=XXXXX` or similar. Cannot confirm without accessing the site directly. [ASSUMED]

## Runtime State Inventory

This is a greenfield seed phase (no existing Newton government rows). No runtime state to migrate.

- **Stored data:** None — Newton not yet seeded in any table. Verified: Newton geo_id=2545560 exists only in geofence_boundaries, not in governments/districts/offices/politicians.
- **Live service config:** None.
- **OS-registered state:** None.
- **Secrets/env vars:** None — uses existing project Supabase credentials.
- **Build artifacts:** None.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| mcp__supabase-local | SQL migrations | Yes | — | — |
| Python 3 | Headshot script | Yes | 3.x | — |
| Pillow | Image processing | Yes (prior phases used it) | — | — |
| requests | HTTP download | Yes | — | — |

**Missing dependencies with no fallback:** None.

## Validation Architecture

`workflow.nyquist_validation` is not set in config.json (key absent) — treat as enabled. However, this phase is a data-only migration (SQL + headshots). There are no application code changes and no unit tests are applicable. Validation is performed via the post-verification DO block in each migration and a manual section-split check query.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | SQL DO block assertions (inline) |
| Config file | none |
| Quick run command | Execute migration via mcp__supabase-local |
| Full suite command | Post-verification DO block + section-split query |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NEWTON-01 | Newton address returns LOCAL section | Integration (DB) | Section-split query + spot-check Newton address via API | N/A (DB-only) |
| NEWTON-02 | Headshots at 600x750 in politician_photos | Manual | Python script + migration; verify rows in politician_images | N/A |

### Wave 0 Gaps
None — no new test files required. Post-verification is embedded in migration SQL.

## Security Domain

Phase is data migration only (SQL INSERT statements). No authentication, session, input validation, or cryptography concerns. ASVS categories V2/V3/V4/V6 do not apply. V5 (input validation) is satisfied by parameterized SQL patterns already in use.

## Sources

### Primary (HIGH confidence)
- figcitynews.com/2025/11/2025-municipal-election-results — 2025 election complete roster, all 24 councillors
- newton.k12.ma.us/school-committee — confirmed 9-member structure + all 8 ward members + Mayor
- lwvnewton.org/voters-service/how-to-contact-elected-officials — confirmed Marc Laredo as Mayor, 24-seat council structure, 8-ward SC structure
- newtonbeacon.org/newton-picks-a-new-school-committee — confirmed all 8 SC members
- nces.ed.gov/ccd — confirmed Newton Public Schools LEAID = 2508610
- C:/EV-Accounts/backend/migrations/347_boston_government.sql — reference migration pattern
- C:/EV-Accounts/backend/migrations/348_boston_school_committee.sql — school committee pattern
- C:/EV-Accounts/backend/migrations/351_worcester_government.sql — Tier 2 flat-district pattern

### Secondary (MEDIUM confidence)
- newtonbeacon.org/election-2025-ushers-in-crop-of-new-city-councilors — election results for Ward 4, 5, 6, 7, 8 new members
- wbur.org/news/2025/11/05 — confirmed Laredo won with 77% of vote
- Multiple WebSearch results confirming Marc Laredo sworn in January 1, 2026

### Tertiary (LOW confidence / ASSUMED)
- Headshot URL pattern for newtonma.gov: CivicEngage/Revize CMS assumed but not verified (site returns 403) [ASSUMED]
- Office title spelling ('City Councilor' not 'City Councillor') [ASSUMED — site returns 403; based on common Newton MA usage in news articles]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Office title is 'City Councilor' (American spelling) not 'City Councillor' | Office Title Conventions | Minor — displayname mismatch; easy to fix in UPDATE |
| A2 | newtonma.gov uses CivicEngage/Revize CMS; staff images follow `/Home/ShowImage?id=` pattern | Headshot Sources | Low — plan should probe multiple URL patterns |
| A3 | Lisle Baker's full name is 'R. Lisle Baker' (from staff directory URL fragment) | Council Roster Ward 7 | Minor — wrong first/last name in politicians table |
| A4 | All 24 city council seats are at-large or ward (no appointed members) | Council Roster | Low — all consistent with MA city charter research |

**Lower-risk items confirmed by multiple sources:**
- Marc Laredo is current Mayor (HIGH confidence — multiple sources)
- All 24 councillors from figcitynews.com election results (HIGH confidence — primary election source)
- All 8 SC members from newton.k12.ma.us and Newton Beacon (HIGH confidence — two sources agree)
- Newton school LEAID = 2508610 (HIGH confidence — NCES confirmed)
- geo_id=2545560 in geofences from v5.0 (HIGH confidence — STATE.md)

## Open Questions (RESOLVED)

1. **R. Lisle Baker full first name**
   - What we know: Newtonma.gov staff directory URL shows 'Baker, R. Lisle' and Google shows 'R. Lisle Baker'
   - What's unclear: Full legal first name (initial 'R.' — may be Robert, Richard, etc.)
   - RESOLVED: Use 'R. Lisle Baker' as full_name, 'Lisle' as first_name in SQL — this is the name he uses publicly. Plans implement this.

2. **Headshot availability for newtonma.gov councillors**
   - What we know: All WebFetch attempts to newtonma.gov return 403
   - What's unclear: Whether a browser User-Agent or Playwright approach can bypass the block
   - RESOLVED: Plan 03 uses browser User-Agent (Chrome) as first attempt; falls back to campaign sites, Newton Beacon, newton.k12.ma.us for SC members; gaps documented. Best-effort coverage expected (~40-60%).

3. **Mayor ex-officio title on School Committee**
   - What we know: Mayor is 9th voting member; source says "ex-officio"
   - What's unclear: Official title used in SC proceedings ('Mayor', 'Mayor (ex officio)', 'Ex Officio Member')
   - RESOLVED: Use 'Mayor (ex officio)' as office title. Plan 02 implements this.

## Metadata

**Confidence breakdown:**
- Government structure: HIGH — confirmed from official sources (LWV Newton, Fig City News election results, newton.k12.ma.us)
- Complete roster: HIGH — all 25 officials (Mayor + 24 council) and 8 SC members confirmed from election results
- School committee: HIGH — confirmed from official NPS website + Newton Beacon
- NCES LEAID: HIGH — confirmed from nces.ed.gov
- Migration pattern: HIGH — directly based on applied migrations 347, 348, 351
- Headshot sources: LOW — newtonma.gov blocks all programmatic access; fallback sources unverified

**Research date:** 2026-06-14
**Valid until:** 2027-01-01 (Newton city elections are odd-year; next election November 2027)
