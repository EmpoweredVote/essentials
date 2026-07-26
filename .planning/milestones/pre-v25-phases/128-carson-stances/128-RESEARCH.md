# Phase 128: Carson Stances - Research

**Researched:** 2026-06-16
**Domain:** Evidence-only compass stance ingestion for Carson Mayor + City Council (5 officials)
**Confidence:** HIGH

---

## Summary

Phase 128 applies evidence-only compass stances for Carson Mayor Lula Davis-Holmes and 4 City Council members: Jawane Hilton (D1), Jim Dear (D2), Cedric L. Hicks Sr. (D3), and Arleen B. Rojas (D4). City Clerk Khaleah K. Bradshaw (external_id -700305) and City Treasurer Monica Cooper (external_id -700306) are explicitly excluded — administrative roles, no policy stances expected. All 7 Carson officials were seeded in v7.0. The stance pattern is fully established from Phases 106, 111–115, 122–127.

Carson (~90,000 pop.) is a diverse, working-class/middle-class city in the South Bay area of LA County, incorporated 1968. The city is majority Black and Latino. Carson has local press coverage in the Daily Breeze (South Bay regional paper), Precinct Reporter (Black community newspaper), Patch (carson.patch.com), and the LA Times South Bay bureau. Carson has a separately elected Mayor (Lula Davis-Holmes) — not a rotational system — plus four district council seats. Expected evidence yield per official is moderate — 4–9 stances per person is realistic, with Davis-Holmes and Dear likely having the richest records.

**Carson Mayor note:** Lula Davis-Holmes holds the Mayor title as a distinct LOCAL_EXEC office (external_id -700300, UUID confirmed in Wave 0). She is NOT a rotational council-selected Mayor — she is directly elected. Reasoning text should use "Mayor Davis-Holmes" with no "rotational" qualifier. This is identical to the Beverly Hills pattern (Friedman), not the Alhambra rotational-Mayor pattern.

The migration format is identical to the canonical pattern from 282_md_exec_stances.sql / 574_boston_stances.sql / 703_lee_stances.sql: one migration file per politician, paired INSERT INTO inform.politician_answers + INSERT INTO inform.politician_context blocks with ON CONFLICT DO UPDATE, float literals, dollar-quoting for reasoning, and ARRAY[...]::text[]::text[] for sources.

**CRITICAL: Migration numbering.** STATE.md last_activity says "next migration 719" (after 718_wells_stances.sql applied). DB-applied MAX confirmed as 718. The Wave 0 pre-flight MUST confirm the actual MAX applied integer migration before writing any file, but 719 is the expected starting number.

**Schema note (Phase 126 confirmed):** `inform.compass_topics` has `topic_key` column, NOT `slug`. The Q4 verification query must use `ct.topic_key`, not `ct.slug`.

**Primary recommendation:** Follow the exact migration pattern from 718_wells_stances.sql (most recent canonical example, same city tier). Research officials in order: Davis-Holmes → Hilton → Dear → Hicks → Rojas; apply each migration immediately. Run Wave 0 pre-flight first to confirm actual next migration number, verify all 5 target UUIDs, confirm active topic count is 44, and confirm excluded officials' UUIDs.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Stance data storage | Database (Supabase) | — | `inform.politician_answers` + `inform.politician_context` tables |
| Stance evidence research | Research agent (Claude) | Web sources | Agent reads public records, produces SQL output |
| Migration application | psql CLI (DATABASE_URL from .env) | mcp__supabase-local (if available) | Phase 126 confirmed psql CLI works; mcp__supabase-local may not be callable from bash executor |
| Compass rendering | Frontend (ev-ui) | — | `computeDisplaySpokes()` in src/lib/compass.js reads from DB |

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CARSON-01 | Compass shows evidence-only stance data for Carson Mayor + City Council (5 officials: Davis-Holmes, Hilton, Dear, Hicks, Rojas; City Clerk Bradshaw + City Treasurer Cooper excluded — administrative roles); sequential research, 100% citation rate | Fully supported by established stance pattern (282, 574, 703–718 canonical analogs); external_ids confirmed from Wave 0 DB query; Carson Mayor is directly elected (no rotational pitfall) |
</phase_requirements>

---

## Standard Stack

### Core

No new packages. This phase uses only:

| Tool | Version | Purpose |
|------|---------|---------|
| psql CLI (DATABASE_URL from C:/EV-Accounts/backend/.env) | live | Apply SQL migrations to remote production DB |
| mcp__supabase-local | live (if available in executor context) | Alternative apply path |
| PostgreSQL SQL | — | Migration files: paired INSERT + upsert pattern |
| inform.politician_answers | — | Stores stance value (1.0–5.0 float) |
| inform.politician_context | — | Stores reasoning text + sources array |

### No Installation Needed

All tools already in use. No npm install, pip install, or external package installs required.

---

## Package Legitimacy Audit

No external packages are installed in this phase. Section not applicable.

---

## Architecture Patterns

### System Architecture Diagram

```
Research agent (Claude)
     |
     v (web search + public records)
Migration SQL file (C:/EV-Accounts/backend/migrations/NNN_name_stances.sql)
     |
     v (psql CLI apply)
inform.politician_answers + inform.politician_context (Supabase production)
     |
     v (ev-ui frontend read)
Compass spoke rendering on politician profile page
```

### Migration File Pattern (canonical — copy from 718_wells_stances.sql)

```sql
-- Migration NNN: [Full Name] Stances
BEGIN;

-- Topic UUID reference block (44 entries)
-- abortion = af2fdfd6-02c4-49df-b09c-cf8536f4773f
-- ...

INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('{uuid}', '{topic_uuid}', {N}.0)
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('{uuid}', '{topic_uuid}', $$reasoning text here$$,
        ARRAY['https://source.com/specific/path']::text[]::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

COMMIT;
```

Hard rules (from 282_md_exec_stances.sql + Phase 126 confirmed):
- value is float literal (4.0), NEVER bare integer (4), NEVER string ('4')
- sources double-cast ::text[]::text[] (project standard from 282), never single cast
- wrap whole file in BEGIN; ... COMMIT;
- reasoning uses plain $$...$$ dollar-quoting (never named $body$)
- at least 1 source URL, must include a path segment (no bare domains)
- NO row written for a topic with no evidence — blank spoke is correct, never default 3.0
- If an official has zero findable stances, still create the migration file with header + BEGIN;/COMMIT; + zero INSERTs (Phase 115 ledger-consistency precedent)

---

## Carson Official Roster (Confirmed from DB — 2026-06-16)

| external_id | full_name | UUID | title | chamber | district_type | Phase 128 role |
|-------------|-----------|------|-------|---------|---------------|----------------|
| -700300 | Lula Davis-Holmes | 94de05c6-d1bc-4cd5-ae9a-7c292ec8149e | Mayor | Mayor | LOCAL_EXEC | Target → migration 719 [Plan 01] |
| -700301 | Jawane Hilton | d1b1bc73-575f-444e-a2f8-46c04b07d3f8 | Council Member (District 1) | City Council | LOCAL | Target → migration 720 [Plan 01] |
| -700302 | Jim Dear | 1581974b-2a8c-4439-acae-377bc06e1788 | Council Member (District 2) | City Council | LOCAL | Target → migration 721 [Plan 02] |
| -700303 | Cedric L. Hicks Sr. | 3cb334b2-fa31-46e4-8dcc-5fec75dd0fe5 | Council Member (District 3) | City Council | LOCAL | Target → migration 722 [Plan 02] |
| -700304 | Arleen B. Rojas | 258b185a-5b28-45a0-9e7f-a05a58080197 | Council Member (District 4) | City Council | LOCAL | Target → migration 723 [Plan 02] |
| -700305 | Khaleah K. Bradshaw | 8523d499-9b27-4fbc-8a53-a65374ed07cb | City Clerk | City Clerk | LOCAL_EXEC | **EXCLUDED** — administrative role |
| -700306 | Monica Cooper | 702d8439-cfc7-42dc-972b-1e05ce293144 | City Treasurer | City Treasurer | LOCAL_EXEC | **EXCLUDED** — administrative role |

**5 target officials:** Davis-Holmes, Hilton, Dear, Hicks, Rojas
**2 excluded officials:** Bradshaw (City Clerk), Cooper (City Treasurer)

---

## Per-Official Research Notes

### Lula Davis-Holmes (Mayor, external_id -700300)

Davis-Holmes is Carson's directly elected Mayor. She has been active in South Bay civic affairs and has a public record on city development, public safety, and housing. Expected yield: 5–9 stances.

**High-probability topics:**
- `homelessness-response`: Carson has had ongoing encampment issues; Davis-Holmes has spoken on enforcement vs. services
- `housing`: Carson's RHNA compliance, ADU policies, affordable housing projects
- `public-safety-approach`: Carson PD, community policing stances
- `economic-development`: Amazon logistics hub debates, retail/commercial development
- `local-environment`: Tesoro/Alon refinery pollution, air quality near industrial corridors
- `growth-and-development`: New development proposals, stadium area (Dignity Health Sports Park)
- `taxes`: Local utility tax, business license tax positions
- `transportation-priorities`: I-405 corridor, bus service, bike infrastructure

**Sources:** carsonca.gov/government/mayor, dailybreeze.com (search "Lula Davis-Holmes"), precinctreporter.com, latimes.com (search "Carson Mayor"), ballotpedia.org/Lula_Davis-Holmes, carson.patch.com

### Jawane Hilton (D1, external_id -700301)

Hilton represents District 1 (northwest Carson). Expected yield: 4–7 stances.

**High-probability topics:**
- `housing` / `residential-zoning`: D1 includes residential neighborhoods with ADU and density debate
- `homelessness-response`: Regional camp clearance policies
- `public-safety-approach`: Police accountability votes
- `local-environment`: Proximity to industrial zones in northwest Carson
- `economic-development`: D1 commercial corridors

**Sources:** carsonca.gov/council-members, dailybreeze.com (search "Jawane Hilton Carson"), carson.patch.com

### Jim Dear (D2, external_id -700302)

Jim Dear is a long-tenured council member and former Mayor of Carson (served as Mayor in earlier cycles). Well-known in South Bay politics. Expected yield: 6–10 stances — likely richest record of the D1-D4 group.

**High-probability topics:**
- `housing` / `residential-zoning`: Involved in housing element compliance
- `homelessness-response`: Well-documented positions on encampment enforcement
- `public-safety-approach`: Vocal on police issues
- `economic-development`: Amazon facility debates, Carson Marketplace development
- `local-environment`: Refinery/air quality issues
- `growth-and-development`: Long tenure means many development votes on record
- `taxes`: City budget and tax measure positions

**Sources:** dailybreeze.com (search "Jim Dear Carson"), latimes.com, carson.patch.com, ballotpedia.org/Jim_Dear, carsonca.gov

### Cedric L. Hicks Sr. (D3, external_id -700303)

Hicks represents District 3 (central/eastern Carson). Expected yield: 4–7 stances.

**High-probability topics:**
- `housing`: D3 neighborhoods with active rezoning discussions
- `homelessness-response`: Carson-wide policy votes
- `public-safety-approach`: Carson PD funding/oversight votes
- `economic-development`: D3 commercial development
- `local-environment`: Industrial boundary issues

**Sources:** carsonca.gov/council-members, dailybreeze.com (search "Cedric Hicks Carson"), carson.patch.com

### Arleen B. Rojas (D4, external_id -700304)

Rojas represents District 4 (southern Carson). Expected yield: 4–7 stances.

**High-probability topics:**
- `housing` / `residential-zoning`: Southern Carson residential density
- `homelessness-response`: D4 encampment proximity issues
- `local-environment`: D4 proximity to industrial areas
- `public-safety-approach`: Police votes
- `economic-development`: Southern industrial/commercial corridor

**Sources:** carsonca.gov/council-members, dailybreeze.com (search "Arleen Rojas Carson"), carson.patch.com

---

## Source Map

| Source | Type | Best For |
|--------|------|----------|
| carsonca.gov/government/mayor | City official | Davis-Holmes official positions, press releases |
| carsonca.gov/government/city-council/city-council-agendas-and-minutes | City official | All council votes, meeting minutes |
| dailybreeze.com | Regional newspaper | All officials — South Bay coverage, vote records |
| precinctreporter.com | Community newspaper | Davis-Holmes, Hicks, Hilton — Black community focus |
| latimes.com | Major newspaper | Davis-Holmes, Jim Dear — high-profile coverage |
| carson.patch.com | Local news | All officials — local stories, budget coverage |
| ballotpedia.org | Voter info | All officials — candidate profiles, election history |
| la.curbed.com / LA Curbed | Housing/development | Housing and zoning topics |

---

## Migration Numbering

| Official | Migration file | Status |
|----------|---------------|--------|
| Lula Davis-Holmes (Mayor) | 719_davis_holmes_stances.sql | Plan 01 |
| Jawane Hilton (D1) | 720_hilton_stances.sql | Plan 01 |
| Jim Dear (D2) | 721_dear_stances.sql | Plan 02 |
| Cedric L. Hicks Sr. (D3) | 722_hicks_stances.sql | Plan 02 |
| Arleen B. Rojas (D4) | 723_rojas_stances.sql | Plan 02 |

**DB-confirmed max applied:** 718 (as of 2026-06-16)
**Expected starting migration:** 719

Wave 0 MUST confirm with: `SELECT MAX(version::int) FROM supabase_migrations.schema_migrations WHERE version ~ '^[0-9]{3}$';`

---

## Wave 0 Pre-Flight Queries

Run all before writing any migration SQL. These establish the authoritative values used across all 3 plans.

```sql
-- Q1: Confirm highest applied integer migration
SELECT MAX(version::int) AS max_applied
FROM supabase_migrations.schema_migrations
WHERE version ~ '^[0-9]{3}$';
-- Expected: 718. If higher, adjust all migration numbers accordingly.

-- Q2: Confirm 716-718 are applied
SELECT version FROM supabase_migrations.schema_migrations
WHERE version IN ('716', '717', '718') AND version ~ '^[0-9]{3}$'
ORDER BY version;
-- Expected: 3 rows. If fewer, note which are missing.

-- Q3: Confirm active topic count
SELECT COUNT(*) FROM inform.compass_topics WHERE is_active = true;
-- Expected: 44. If different, capture the live list.

-- Q4: Resolve all 5 Carson target UUIDs
SELECT external_id, full_name, id
FROM essentials.politicians
WHERE external_id IN (-700300, -700301, -700302, -700303, -700304)
ORDER BY external_id;
-- Expected 5 rows. Capture UUIDs for migrations 719–723.

-- Q5: Confirm excluded officials' UUIDs (for explicit DO-NOT-WRITE record)
SELECT external_id, full_name, id
FROM essentials.politicians
WHERE external_id IN (-700305, -700306);
-- Expected 2 rows: Bradshaw (City Clerk) + Cooper (City Treasurer).
-- Record both UUIDs explicitly in SUMMARY as DO-NOT-WRITE exclusions.

-- Q6: Check for pre-existing Carson stance rows (informational)
SELECT COUNT(*) FROM inform.politician_answers
WHERE politician_id IN (
  SELECT id FROM essentials.politicians
  WHERE external_id IN (-700300, -700301, -700302, -700303, -700304)
);

-- Q7: Confirm Davis-Holmes Mayor office is LOCAL_EXEC (directly elected)
SELECT d.district_type, o.title, p.full_name
FROM essentials.offices o
JOIN essentials.districts d ON d.id = o.district_id
JOIN essentials.politicians p ON p.id = o.politician_id
WHERE p.external_id = -700300;
-- Expected: district_type=LOCAL_EXEC, title='Mayor', full_name='Lula Davis-Holmes'
-- This confirms "Mayor Davis-Holmes" is correct (directly elected).

-- Q8: Confirm Carson City Council chamber
SELECT c.name FROM essentials.chambers c
JOIN essentials.governments g ON g.id = c.government_id
WHERE g.geo_id = '0611530';
-- Expected: rows for Mayor, City Council, City Clerk, City Treasurer.
```

---

## Pitfalls

**Pitfall 1 — Integer-format filter for migration MAX:** Always use `WHERE version ~ '^[0-9]{3}$'` on the schema_migrations query. Without it, timestamp-format versions overflow the ::int cast.

**Pitfall 2 — Float literals required:** value must be written as `4.0` not `4` or `'4'`. The application reads it as a float. An integer-typed INSERT will fail or produce wrong compass placement.

**Pitfall 3 — Double-cast sources:** `ARRAY['https://...']::text[]::text[]` is the project standard. Single cast `::text[]` was the pre-282 pattern — do NOT use it.

**Pitfall 4 — Dollar-quoting for reasoning:** Use plain `$$reasoning$$`, never `$body$reasoning$body$` or other named dollar-quoting. Some editors auto-convert; verify in the final SQL.

**Pitfall 5 — No evidence = no INSERT:** A blank spoke is an honest "no public record found." Never insert a neutral default value. If zero evidence found for an official, still create the migration file with only BEGIN;/COMMIT; (ledger-consistency).

**Pitfall 6 — topic_key not slug:** The column in inform.compass_topics is `topic_key`, NOT `slug`. Phase 126 confirmed this. All reference lookups and verification queries must use `topic_key`.

**Pitfall 7 — Davis-Holmes is directly elected (not rotational):** Carson has a separately elected Mayor position. Davis-Holmes holds LOCAL_EXEC district. She is NOT a council member who rotates the Mayor title. "Mayor Davis-Holmes" is CORRECT. Do NOT add any "rotational" qualifier.

**Pitfall 8 — Excluded officials:** Khaleah K. Bradshaw (-700305, City Clerk) and Monica Cooper (-700306, City Treasurer) receive ZERO stance rows. Never research or write INSERTs for these external_ids. Record both UUIDs explicitly in Plan 01 SUMMARY.

**Pitfall 9 — Do NOT create new offices/districts/chambers:** All Carson officials are already seeded. No INSERT INTO essentials.offices, essentials.districts, or essentials.chambers is needed in this phase.

**Pitfall 10 — Non-contiguous external_ids:** Carson external_ids are -700300 through -700306. Use an IN list, not a BETWEEN range. (-700300 through -700304 are targets; -700305 and -700306 are excluded.)

**Pitfall 11 — .env location:** Carson env path is C:/EV-Accounts/backend/.env (NOT C:/EV-Accounts/.env which doesn't exist). Run `grep '^DATABASE_URL=' /c/EV-Accounts/backend/.env` to extract DATABASE_URL.

---

## Topic UUID Reference Block

(Confirmed from DB as of 2026-06-16 — all 44 active topics)

```
-- abortion                        = af2fdfd6-02c4-49df-b09c-cf8536f4773f
-- ai-regulation                   = 666bf03d-81fc-4138-ab15-69ae734c9023
-- campaign-finance                = 92730f69-ae57-401c-8ad1-2d07834a895d
-- childcare                       = c1ac1330-47f7-44ec-baf3-c913d926b97c
-- city-sanitation                 = 7687de4f-4d0b-462a-b803-bdfb23b16b42
-- civil-rights                    = 0bc588c6-39e1-4084-b5de-cac909b8b762
-- climate-change                  = f1e44d66-5d27-4b51-b54f-b7ace86f6a3c
-- data-centers                    = 4559b513-0fd8-4ed1-babd-f3b554162f40
-- deportation                     = 44905f3b-e105-4f6c-afc7-5d223813dbac
-- economic-development            = eb3d1247-0de1-4b7f-baec-7259861efd53
-- fossil-fuels                    = a22215c3-6693-4bc2-b248-01aebba14570
-- growth-and-development          = fb25c1ac-91cc-49bf-8afc-c7fa22ef45e4
-- healthcare                      = e8dad4a8-eb93-4931-91f5-d8fb5d7dd529
-- homelessness                    = 4938766b-b45a-46e3-93bd-b8b30651271a
-- homelessness-response           = 6fbf39ae-6b19-4182-b4c2-6a8d25c86c0f
-- housing                         = 669cac97-66a6-4087-b036-936fbe62efb3
-- immigration                     = 4e2c69ce-591e-4197-9cd5-7aceff79d390
-- jail-capacity                   = c267e137-0ff9-4e7d-9d13-e3cea1756cd0
-- judicial-access-to-justice      = 9d45acaf-1ba4-4cb8-95e1-5ed985223b91
-- judicial-bail-pretrial          = 1fab5edf-6151-4da0-9704-a7f2113ba54c
-- judicial-criminal-justice       = 9db07b16-1076-4b7d-ad89-ebe7b51f4336
-- judicial-government-deference   = e5e48f0e-8f3a-40e1-8080-889fea389603
-- judicial-interpretation         = 448b1c9a-b6f3-42b8-8f39-d3bbb5bfa9ee
-- judicial-police-accountability  = 7bad33eb-e93e-4d94-8822-97212d49bde5
-- judicial-prosecution-priorities = abb99d95-cbb1-4617-8f8b-f220ef6028ca
-- judicial-transparency           = 6674d87e-999d-433a-aab7-3f626f59fd5f
-- local-environment               = 1935979c-b290-42e4-baa5-8cb0138b4ffa
-- local-immigration               = b9ccee94-ad96-4f10-b655-889d8e5abe92
-- medicare/aid                    = cab61e8a-64fe-4bbd-bc08-fe9914d0091b
-- misinformation                  = ddd65d64-9dc7-4208-a30f-59f4b9c0653d
-- public-safety-approach          = e9ebefcd-c496-45e8-b816-a79f8442ba85
-- redistricting                   = 48cc9585-ec22-4f53-8d42-6839828dd36f
-- religious-freedom               = 6b9ba6d9-1001-43f5-b073-4d37130696fd
-- rent-regulation                 = c308e8e8-caac-44f5-ab04-dbfecf40bbe2
-- residential-zoning              = d4f18138-a2e0-4110-b925-7387d9d0d16d
-- same-sex-marriage               = c5ab4eab-702f-49b8-9277-8ea53f3835c6
-- school-vouchers                 = 00b95a6a-75db-4521-b523-3326bba938de
-- social-security                 = 87d20824-a6e9-407b-983c-65440084a0ab
-- tariffs                         = 683c8084-2281-4920-a07c-18439b2dd413
-- taxes                           = f7e5678d-dadd-4556-a2fc-446e24642ceb
-- trans-athletes                  = d1618b9c-0b9e-45af-b986-bb33d270b8e4
-- transportation-priorities       = ba59337e-30e2-4aba-a39a-426b3366eb27
-- ukraine-support                 = 24e9212c-b011-422a-865c-093e35050901
-- voting-rights                   = d1792200-1d3b-4955-a0b7-0e6980d7a7b2
```

---

## Anti-Patterns (never do these)

- `INSERT INTO essentials.offices` — all offices already exist for Carson officials
- Value as integer: `VALUES (..., 4)` — must be `4.0`
- Single-cast sources: `ARRAY[...]::text[]` — must be `ARRAY[...]::text[]::text[]`
- Named dollar-quoting: `$body$...$body$` — use plain `$$...$$`
- Researching or writing stances for -700305 (Bradshaw) or -700306 (Cooper)
- Any INSERT with a UUID not in the 5-target set
- Defaulting to 3.0 when evidence is uncertain — blank is correct
- Using BETWEEN for external_id range — these are non-sequential; use IN list
- Reading .env from C:/EV-Accounts/.env — correct path is C:/EV-Accounts/backend/.env
