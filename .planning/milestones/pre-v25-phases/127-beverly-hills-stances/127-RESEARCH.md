# Phase 127: Beverly Hills Stances - Research

**Researched:** 2026-06-16
**Domain:** Evidence-only compass stance ingestion for Beverly Hills Mayor + City Council (5 officials)
**Confidence:** HIGH

---

## Summary

Phase 127 applies evidence-only compass stances for Beverly Hills Mayor Lester Friedman and 4 City Council members: Craig A. Corman, John A. Mirisch, Sharona Nazarian, and Mary N. Wells. City Treasurer Howard Fisher (external_id -700011) is explicitly excluded — administrative role, no policy stances expected. All 5 target officials were seeded in v7.0 across migrations 300 (original 4) and 301 (Nazarian gap-fill). The pattern is fully established from Phases 106, 111–115, 122–126.

Beverly Hills is a high-profile, affluent suburb (~34,000 pop.) with significantly more local press coverage than Alhambra. The Beverly Hills Courier is the city's primary local paper with detailed council coverage going back decades. Additional sources include Patch, the LA Times (Beverly Hills bureau), and Beverly Hills Weekly. The five officials range from very long-tenured (John Mirisch has served since 2009, one of the longest-tenured council members in California) to moderately recent (Nazarian, Wells). Expected evidence yield per official is meaningfully higher than the Alhambra tier — 5–12 stances per person is realistic, with Mirisch likely the richest record.

Beverly Hills has a directly-elected Mayor — unlike Alhambra's rotational model. Lester Friedman holds the Mayor title as a distinct LOCAL_EXEC office (external_id -200589), not a rotating ceremonial title. This is confirmed by migration 300's pre-flight results: "LOCAL_EXEC district: Lester Friedman (-200589) as Mayor." There is NO rotational Mayor pitfall here — the Alhambra-specific warning does not apply.

The migration format is identical to the canonical pattern from 282_md_exec_stances.sql / 574_boston_stances.sql / 703_lee_stances.sql: one migration file per politician, paired INSERT INTO inform.politician_answers + INSERT INTO inform.politician_context blocks with ON CONFLICT DO UPDATE, float literals, dollar-quoting for reasoning, and ARRAY[...]::text[]::text[] for sources.

**CRITICAL: Migration numbering note.** STATE.md last_activity says "next migration 714" (after 713_alhambra_dedup.sql applied). On-disk verification confirms 713 is the highest migration file. The Wave 0 pre-flight MUST confirm the actual MAX applied integer migration before writing any file, but 714 is the expected starting number.

**Schema note from Phase 126:** `inform.compass_topics` has `topic_key` column, NOT `slug`. Phase 126 Plan 03 Summary documents this schema fix. The Q4 verification query must use `ct.topic_key`, not `ct.slug`.

**Primary recommendation:** Follow the exact migration pattern from 703_lee_stances.sql (the most recent canonical example, same city tier). Research officials in external_id order (Friedman → Corman → Mirisch → Nazarian → Wells); apply each migration immediately. Run Wave 0 pre-flight first to confirm actual next migration number, verify all 5 UUIDs, confirm active topic count is still 44, and confirm no pre-existing BH stances.

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
| BEVHILLS-01 | Compass shows evidence-only stance data for Beverly Hills Mayor + City Council (5 officials: Friedman, Corman, Mirisch, Nazarian, Wells; City Treasurer Fisher excluded — administrative role); sequential research, 100% citation rate | Fully supported by established stance pattern (282, 574, 703–705 canonical analogs); external_ids confirmed from migrations 300–301; Beverly Hills Mayor is directly elected (no rotational pitfall) |
</phase_requirements>

---

## Standard Stack

### Core

No new packages. This phase uses only:

| Tool | Version | Purpose |
|------|---------|---------|
| psql CLI (DATABASE_URL from C:/EV-Accounts/.env) | live | Apply SQL migrations to remote production DB |
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
     | reads public web sources (BH Courier, Patch, LAT, council minutes)
     v
Evidence (city council votes, statements, press coverage, official bios)
     |
     | produces value (1.0-5.0) + reasoning + URL(s)
     v
SQL migration file (NNN_friedman_stances.sql, etc.)
     |
     | psql CLI with DATABASE_URL (or mcp__supabase-local if available)
     v
inform.politician_answers  (politician_id, topic_id, value)
inform.politician_context  (politician_id, topic_id, reasoning, sources[])
     |
     | computeDisplaySpokes() in ev-ui reads these rows
     v
Compass spoke chart on politician profile page
```

### Recommended Project Structure

```
C:/EV-Accounts/backend/migrations/
├── 714_friedman_stances.sql       # Lester Friedman (Mayor) — migration 714
├── 715_corman_stances.sql         # Craig A. Corman — migration 715
├── 716_mirisch_stances.sql        # John A. Mirisch — migration 716
├── 717_nazarian_stances.sql       # Sharona Nazarian — migration 717
└── 718_wells_stances.sql          # Mary N. Wells — migration 718
```

Note: 714 = expected starting migration per STATE.md. Wave 0 pre-flight MUST verify with `SELECT MAX(version::int) AS max_applied FROM supabase_migrations.schema_migrations WHERE version ~ '^[0-9]{3}$';`

### Pattern 1: Per-Individual Stance Migration (canonical)

[VERIFIED: 282_md_exec_stances.sql, 574_boston_stances.sql, 703_lee_stances.sql, 704_maza_stances.sql, 705_maloney_stances.sql]

```sql
-- ============================================================================
-- Migration NNN: {FirstName LastName} Stances
-- ============================================================================
-- Purpose: Insert/upsert stance data for {FirstName LastName} ({title}).
--
-- Topic scope: All active compass topics attempted; evidence-only.
--
-- Idempotency: ON CONFLICT (politician_id, topic_id) DO UPDATE on both tables.
-- Apply via psql CLI: psql $DATABASE_URL -f NNN_name_stances.sql
-- ============================================================================

BEGIN;

-- ----- {FirstName LastName} / {topic-key} -----
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('{politician_uuid}',
        '{topic_uuid}',
        {N}.0)
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('{politician_uuid}',
        '{topic_uuid}',
        $$[2-5 sentences of evidence-anchored reasoning with specific votes/statements/actions]$$,
        ARRAY['https://url1/path', 'https://url2/path']::text[]::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

-- [repeat for each topic with evidence]

COMMIT;
```

### Anti-Patterns to Avoid

- **Bare integer values:** Using `4` instead of `4.0` — always use float literals
- **Parallel research:** Never launch two research agents simultaneously — burns rate limit quota
- **Default neutral values:** Inserting `3.0` for topics with no evidence — blank spoke is honest
- **Missing BEGIN/COMMIT:** Every file must be wrapped in transaction
- **Citing domain-only URLs:** sources must include path, not just domain (e.g. `https://beverlyhills.org/council` not `https://beverlyhill.org`)
- **Single-cast sources array:** Must use `::text[]::text[]` double-cast — project standard from 282
- **Using ct.slug in Q4 query:** `inform.compass_topics` has `topic_key` not `slug` (Phase 126 schema fix)
- **Skipping Howard Fisher:** Fisher (external_id -700011) is explicitly excluded; do NOT write any stances for him

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Compass position scale | Custom scoring algorithm | Research agent places on 1–5 scale per topic axis definition | Scale semantics defined in topic; must be consistent |
| Citation storage | Custom citation table | `inform.politician_context.sources` array (already exists) | Schema is fixed |
| Politician UUID resolution | Hard-coded guesses | Wave 0 pre-flight UUID resolution query | UUIDs are random at insert time |
| Topic UUID lookup | Hard-coded topic names | Topic UUID reference block below | Topics have UUID primary keys |

---

## Politician Roster and External IDs

All external IDs are [VERIFIED: migration 300_la_wave2_preflight.sql Q1 RESULTS section; migration 301_la_wave2_beverly_hills.sql header comments — read directly from migration files].

| external_id | Name (as seeded) | Title | Notes |
|-------------|------------------|-------|-------|
| -200589 | Lester Friedman | Mayor | LOCAL_EXEC district; directly elected Mayor (not rotational) |
| -201154 | Craig A. Corman | Council Member | LOCAL district |
| -201153 | John A. Mirisch | Council Member | LOCAL district; longest-tenured — richest expected record |
| -700010 | Sharona R. Nazarian | Council Member | LOCAL district; added in migration 301 |
| -201155 | Mary N. Wells | Council Member | LOCAL district |
| -700011 | Howard Fisher | City Treasurer | **EXCLUDED** — administrative role; do NOT write any stances |

**Beverly Hills Mayor is directly elected** (not a rotational title). Lester Friedman holds the LOCAL_EXEC district as a distinct office. This is the opposite of the Alhambra pattern — "Mayor Friedman" is correct in all reasoning text.

**UUID resolution query (run at Wave 0 pre-flight):**
```sql
-- Resolve all 5 target Beverly Hills officials at once:
SELECT external_id, full_name, id
FROM essentials.politicians
WHERE external_id IN (-200589, -201153, -201154, -201155, -700010)
ORDER BY external_id;
```

Expected rows:
- -200589: Lester Friedman (Mayor)
- -201153: John A. Mirisch
- -201154: Craig A. Corman
- -201155: Mary N. Wells
- -700010: Sharona R. Nazarian

**Also verify Fisher is NOT in scope (informational check):**
```sql
SELECT external_id, full_name FROM essentials.politicians WHERE external_id = -700011;
-- Expected: Howard Fisher — confirm NOT included in any stance write
```

---

## Migration Numbering

[VERIFIED from STATE.md last_activity (2026-06-16) and disk listing]

- Migration 713 (713_alhambra_dedup.sql) is the highest on disk [VERIFIED: ls /c/EV-Accounts/backend/migrations/]
- STATE.md last_activity confirms: "next migration 714" [VERIFIED: STATE.md]
- 5 officials → migrations 714–718 (one per official)

**Wave 0 MUST verify:**
```sql
-- Confirm highest applied integer migration:
SELECT MAX(version::int) AS max_applied
FROM supabase_migrations.schema_migrations
WHERE version ~ '^[0-9]{3}$';
-- Expected: 713. If different, use MAX+1 as starting number.

-- Also confirm 710-713 specifically applied:
SELECT version FROM supabase_migrations.schema_migrations
WHERE version IN ('710', '711', '712', '713')
  AND version ~ '^[0-9]{3}$'
ORDER BY version;
```

Note the `WHERE version ~ '^[0-9]{3}$'` filter — Phase 126 Plan 01 SUMMARY documents that `version::int` cast fails for timestamp-format versions (e.g. 20260602031258 exceeds integer range). This filter was established to isolate integer-format versions.

---

## Topic UUID Reference Block

[VERIFIED: 126-RESEARCH.md topic UUID block, confirmed active count = 44 in Phase 126 Wave 0 pre-flight]

Expected count: 44 active topics. Wave 0 pre-flight must verify `SELECT COUNT(*) FROM inform.compass_topics WHERE is_active = true;` still returns 44.

```sql
-- Topic UUID reference (inform.compass_topics):
-- abortion                         af2fdfd6-02c4-49df-b09c-cf8536f4773f
-- ai-regulation                    666bf03d-81fc-4138-ab15-69ae734c9023
-- campaign-finance                 92730f69-ae57-401c-8ad1-2d07834a895d
-- childcare                        c1ac1330-47f7-44ec-baf3-c913d926b97c
-- city-sanitation                  7687de4f-4d0b-462a-b803-bdfb23b16b42
-- civil-rights                     0bc588c6-39e1-4084-b5de-cac909b8b762
-- climate-change                   f1e44d66-5d27-4b51-b54f-b7ace86f6a3c
-- deportation                      44905f3b-e105-4f6c-afc7-5d223813dbac
-- economic-development             eb3d1247-0de1-4b7f-baec-7259861efd53
-- fossil-fuels                     a22215c3-6693-4bc2-b248-01aebba14570
-- growth-and-development           fb25c1ac-91cc-49bf-8afc-c7fa22ef45e4
-- healthcare                       e8dad4a8-eb93-4931-91f5-d8fb5d7dd529
-- homelessness                     4938766b-b45a-46e3-93bd-b8b30651271a
-- homelessness-response            6fbf39ae-6b19-4182-b4c2-6a8d25c86c0f
-- housing                          669cac97-66a6-4087-b036-936fbe62efb3
-- immigration                      4e2c69ce-591e-4197-9cd5-7aceff79d390
-- jail-capacity                    c267e137-0ff9-4e7d-9d13-e3cea1756cd0
-- judicial-access-to-justice       9d45acaf-1ba4-4cb8-95e1-5ed985223b91
-- judicial-bail-pretrial           1fab5edf-6151-4da0-9704-a7f2113ba54c
-- judicial-criminal-justice        9db07b16-1076-4b7d-ad89-ebe7b51f4336
-- judicial-government-deference    e5e48f0e-8f3a-40e1-8080-889fea389603
-- judicial-interpretation          448b1c9a-b6f3-42b8-8f39-d3bbb5bfa9ee
-- judicial-police-accountability   7bad33eb-e93e-4d94-8822-97212d49bde5
-- judicial-prosecution-priorities  abb99d95-cbb1-4617-8f8b-f220ef6028ca
-- judicial-transparency            6674d87e-999d-433a-aab7-3f626f59fd5f
-- local-environment                1935979c-b290-42e4-baa5-8cb0138b4ffa
-- local-immigration                b9ccee94-ad96-4f10-b655-889d8e5abe92
-- medicare/aid                     cab61e8a-64fe-4bbd-bc08-fe9914d0091b
-- misinformation                   ddd65d64-9dc7-4208-a30f-59f4b9c0653d
-- public-safety-approach           e9ebefcd-c496-45e8-b816-a79f8442ba85
-- redistricting                    48cc9585-ec22-4f53-8d42-6839828dd36f
-- religious-freedom                6b9ba6d9-1001-43f5-b073-4d37130696fd
-- rent-regulation                  c308e8e8-caac-44f5-ab04-dbfecf40bbe2
-- residential-zoning               d4f18138-a2e0-4110-b925-7387d9d0d16d
-- same-sex-marriage                c5ab4eab-702f-49b8-9277-8ea53f3835c6
-- school-vouchers                  00b95a6a-75db-4521-b523-3326bba938de
-- social-security                  87d20824-a6e9-407b-983c-65440084a0ab
-- tariffs                          683c8084-2281-4920-a07c-18439b2dd413
-- taxes                            f7e5678d-dadd-4556-a2fc-446e24642ceb
-- trans-athletes                   d1618b9c-0b9e-45af-b986-bb33d270b8e4
-- transportation-priorities        ba59337e-30e2-4aba-a39a-426b3366eb27
-- ukraine-support                  24e9212c-b011-422a-865c-093e35050901
-- voting-rights                    d1792200-1d3b-4955-a0b7-0e6980d7a7b2
-- data-centers                     4559b513-[verify at Wave 0 if 44th topic]
```

**Note on 44th topic:** The topic block above from Phase 126-RESEARCH.md lists 43 explicit entries. The 44th active topic (`data-centers`, UUID `4559b513-...`) was discovered in Phase 111 and added to all MA House reps. Wave 0 must run `SELECT topic_key, id FROM inform.compass_topics WHERE is_active = true ORDER BY topic_key;` if count differs from 44, to capture the live list.

---

## Expected Evidence Quality by Official

[ASSUMED — based on Beverly Hills media footprint, official tenure lengths, and prior LA-area city patterns. Beverly Hills Courier has detailed council archives; evidence yield will be higher than Alhambra tier.]

### Lester Friedman (Mayor) — external_id -200589

[ASSUMED] Directly elected Mayor with a high-visibility role. Beverly Hills Mayor is distinct from council members (LOCAL_EXEC office). Friedman has served on the council since approximately 2013 and as Mayor by direct election. Expected yield: 7–12 stances. Likely topics: homelessness-response (Beverly Hills has taken notable positions on encampments in city limits), housing/residential-zoning (BH has resisted high-density development), growth-and-development (Rodeo Drive area development decisions), public-safety-approach (BHPD is a full independent police department). Beverly Hills Courier archives will be the primary source.

### Craig A. Corman — external_id -201154

[ASSUMED] Long-tenured council member. Expected yield: 5–9 stances. Focus on council votes (housing element compliance, zoning, homelessness response). Beverly Hills Courier has per-vote coverage.

### John A. Mirisch — external_id -201153

[ASSUMED] Longest-serving current council member (~2009–present). Very rich public record — Mirisch is an outspoken council member who regularly writes op-eds for Beverly Hills Courier and Patch. He has taken documented positions on a wider range of topics than typical local officials (campaign-finance reform, climate change, housing density). Expected yield: 10–15 stances. His record on campaign finance (he supports local campaign contribution limits) and housing density (has resisted RHNA mandates) is well-documented.

### Sharona Nazarian — external_id -700010

[ASSUMED] Seeded in migration 301 as a gap-fill (was missing from original v7.0 load). Has served on council for several terms. Notable for her advocacy on civil rights and diversity issues. Expected yield: 4–9 stances. Beverly Hills Courier and Patch have her voting record.

### Mary N. Wells — external_id -201155

[ASSUMED] Council member with a moderate tenure. Expected yield: 4–8 stances. Focus on local-scope topics from council votes.

### Overall Phase Yield Estimate

[ASSUMED] Total expected: 30–55 stance rows across all 5 officials. This is substantially higher than Alhambra (26 rows) due to Beverly Hills' richer press coverage and longer official tenures, particularly Mirisch. Beverly Hills is not a progressive activist city — positions will skew moderate-to-conservative on housing density, homelessness enforcement, and fiscal topics.

---

## Local Press Sources for Research

Primary sources (in order of expected evidence density):

1. **Beverly Hills Courier** — bhcourier.com — primary local newspaper; full council vote coverage; archives searchable; best individual official quotes and positions

2. **Beverly Hills Weekly** — beverlyhillsweekly.com — secondary local paper; redundant coverage with Courier; useful for second-sourcing

3. **Patch (Beverly Hills)** — patch.com/california/beverlyhills — council meeting coverage; member statements

4. **Beverly Hills City Council meeting minutes/agendas** — beverlyhills.org/government/city-council/meetings-agendas — official vote records; most authoritative for position evidence

5. **LA Times (Beverly Hills coverage)** — latimes.com — covers major BH issues (housing element lawsuits, homelessness, Measure S topics)

6. **John Mirisch personal blog/social media** — Mirisch is known for detailed public writings; search "John Mirisch Beverly Hills" + specific topic

7. **Ballotpedia** — ballotpedia.org — candidate profiles for Friedman/Corman/Mirisch; platform statements for election years

8. **California city council vote databases** — LegiStar (if BH uses it) or city clerk agenda PDFs for specific resolution votes

**Topics with highest evidence probability for Beverly Hills:**

- `housing` — Beverly Hills has resisted state housing mandates (RHNA); council votes are documented
- `residential-zoning` — anti-density positions; Prop HH / Beverly Hills General Plan debates
- `homelessness-response` — strong enforcement approach in a wealthy enclave city; well-documented
- `growth-and-development` — Rodeo Drive, hotel development, Beverly Hilton redevelopment debates
- `public-safety-approach` — BHPD has its own PD; council positions on policing funding well documented
- `local-environment` — tree canopy preservation, green building rules
- `taxes` — BH is low-tax municipality; council fiscal positions frequently documented
- `transportation-priorities` — Purple Line extension debates; parking; Wilshire Blvd. bike lanes
- `campaign-finance` — Mirisch specifically; local contribution limit history
- `local-immigration` — BH is NOT a sanctuary city; council positions documented

**Topics with lowest evidence probability for Beverly Hills:**

- `ukraine-support` — city council resolutions on foreign policy very rare
- `judicial-*` (6 topics) — applies only if a member commented on courts; unlikely for city council
- `tariffs` — national trade policy not a city council topic
- `same-sex-marriage` — legally settled; no recent council position
- `school-vouchers` — BHUSD is independent of city council
- `redistricting` — applies at state level; BH council won't comment

---

## Common Pitfalls

### Pitfall 1 (Inherited): Float vs. Integer Value

**What goes wrong:** Writing `value = 4` instead of `value = 4.0`
**Why it happens:** Files 589/597 in project history use bare integers; executor may follow that pattern
**How to avoid:** Use float literals always: `1.0`, `2.0`, `3.0`, `4.0`, `5.0`
**Warning signs:** `VALUES ('uuid', 'topic_uuid', 4)` without `.0`

### Pitfall 2 (Inherited): Parallel Research Sessions

**What goes wrong:** Research agent for official N+1 starts before official N's migration is applied
**Why it happens:** Impatience; planner may queue multiple agents
**How to avoid:** Sequential: research → write SQL → apply migration → verify → next person
**Warning signs:** Two active Claude research sub-tasks in the same session

### Pitfall 3 (Inherited): Fabricating Evidence for Sparse Records

**What goes wrong:** Writing `3.0` (neutral) for a council member with no public record
**Why it happens:** Pressure to "fill in" the compass
**How to avoid:** No INSERT if no direct statement, vote, or action found. Blank spoke is correct.
**Warning signs:** Sources array contains only generic city website links with no specific statements

### Pitfall 4 (Inherited): Missing BEGIN/COMMIT

**What goes wrong:** Migration runs but partial data written on failure
**Why it happens:** Copying format from anomalous older files that omit transaction wrappers
**How to avoid:** Every file uses `BEGIN; ... COMMIT;` wrapping all INSERT blocks
**Warning signs:** File jumps from header to first INSERT with no `BEGIN;`

### Pitfall 5 (Inherited): Sources Array Single-Cast

**What goes wrong:** Writing `ARRAY['url']::text[]` instead of `ARRAY['url']::text[]::text[]`
**Why it happens:** The double-cast looks redundant
**How to avoid:** Always double-cast — project standard from 282_md_exec_stances.sql
**Warning signs:** Only one `::text[]` in sources array

### Pitfall 6 (Phase 126 schema fix): Using `ct.slug` in Q4 Verification Query

**What goes wrong:** Q4 phase-wide verification query uses `ct.slug` which does not exist on `inform.compass_topics`
**Why it happens:** The column is `topic_key` not `slug`; Phase 126 Plan 03 Summary documents this fix
**How to avoid:** Q4 query must reference `ct.topic_key`
**Warning signs:** Q4 query contains `ct.slug`; will fail with "column does not exist"

### Pitfall 7 (Phase 126 schema fix): Integer Cast Range Error on Migration Version Check

**What goes wrong:** `SELECT MAX(version::int) FROM supabase_migrations.schema_migrations` throws integer overflow for timestamp-format versions
**Why it happens:** Some migrations use timestamp-format version strings (e.g. 20260602031258) which exceed integer range
**How to avoid:** Add `WHERE version ~ '^[0-9]{3}$'` filter to isolate integer-format versions
**Warning signs:** Query returns error about integer overflow; omit the WHERE clause guard

### Pitfall 8 (Beverly Hills specific): Confusing Mayor with Rotational Council Chair

**What goes wrong:** Treating Lester Friedman's Mayor title as ceremonial/rotational (like Alhambra's Wang)
**Why it happens:** Phase 126 RESEARCH.md prominently warns about rotational Mayors; executor may apply that warning incorrectly to Beverly Hills
**How to avoid:** Beverly Hills has a DIRECTLY ELECTED Mayor with a LOCAL_EXEC district (confirmed in migration 300 preflight Q1 RESULTS). Friedman IS the Mayor by election, not rotation. Use "Mayor Friedman" without any rotational caveats.
**Warning signs:** Migration reasoning text says "rotational Mayor" or "as ceremonial Mayor" for Friedman

### Pitfall 9 (Beverly Hills specific): Writing Stances for Howard Fisher

**What goes wrong:** Including City Treasurer Fisher (external_id -700011) in the stance research
**Why it happens:** Fisher appears in BH migration history and may appear in BH government query results
**How to avoid:** Fisher is administratively elected — no policy stances expected; BEVHILLS-01 explicitly excludes him; do not write any INSERT for -700011
**Warning signs:** Migration contains `politician_id` matching Fisher's UUID, or research searches for "Howard Fisher Beverly Hills"

---

## Verification Queries

### Wave 0 Pre-Flight (run before writing any migration)

```sql
-- 1. Confirm highest applied integer migration (determines starting number):
SELECT MAX(version::int) AS max_applied
FROM supabase_migrations.schema_migrations
WHERE version ~ '^[0-9]{3}$';
-- Expected: 713. Starting migration = MAX + 1.

-- 2. Confirm 710-713 are specifically applied:
SELECT version FROM supabase_migrations.schema_migrations
WHERE version IN ('710', '711', '712', '713')
  AND version ~ '^[0-9]{3}$'
ORDER BY version;
-- Expected: 4 rows (710, 711, 712, 713).

-- 3. Confirm active topic count (must be 44):
SELECT COUNT(*) FROM inform.compass_topics WHERE is_active = true;
-- If not 44, run full list: SELECT topic_key, id FROM inform.compass_topics WHERE is_active = true ORDER BY topic_key;

-- 4. Resolve all 5 Beverly Hills target UUIDs:
SELECT external_id, full_name, id
FROM essentials.politicians
WHERE external_id IN (-200589, -201153, -201154, -201155, -700010)
ORDER BY external_id;
-- Expected 5 rows: Friedman (-200589), Mirisch (-201153), Corman (-201154), Wells (-201155), Nazarian (-700010)

-- 5. Confirm Howard Fisher UUID (to exclude from any stances):
SELECT external_id, full_name, id FROM essentials.politicians WHERE external_id = -700011;
-- Informational only — confirms Fisher exists but must NOT receive any stance rows

-- 6. Check for pre-existing BH stance rows (upsert handles them; informational only):
SELECT COUNT(*) FROM inform.politician_answers
WHERE politician_id IN (
  SELECT id FROM essentials.politicians
  WHERE external_id IN (-200589, -201153, -201154, -201155, -700010)
);

-- 7. Confirm Beverly Hills Mayor office exists as LOCAL_EXEC (Friedman is directly elected):
SELECT d.district_type, d.label, o.title, p.full_name
FROM essentials.offices o
JOIN essentials.districts d ON d.id = o.district_id
JOIN essentials.politicians p ON p.id = o.politician_id
WHERE p.external_id = -200589;
-- Expected: district_type=LOCAL_EXEC, title='Mayor'

-- 8. Confirm BH City Council chamber:
SELECT c.name FROM essentials.chambers c
JOIN essentials.governments g ON g.id = c.government_id
WHERE g.geo_id = '0606308'
  AND c.name != 'City Treasurer';
-- Expected: at least 1 row 'City Council' (City Treasurer chamber also exists — it's fine)
```

### Per-Person Verification (after each migration)

```sql
-- Row count:
SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id = '{uuid}';

-- Unpaired check (must return 0):
SELECT COUNT(*) FROM inform.politician_answers pa
LEFT JOIN inform.politician_context pc
  ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
WHERE pa.politician_id = '{uuid}' AND pc.politician_id IS NULL;

-- Citation check (must return 0):
SELECT COUNT(*) FROM inform.politician_context
WHERE politician_id = '{uuid}'
  AND (sources IS NULL OR array_length(sources, 1) IS NULL OR array_length(sources, 1) = 0);
```

### Phase-Wide Closure Verification (run at phase close)

```sql
-- Q1: Stance count per official (all 5 BH target officials):
SELECT p.full_name, p.external_id, COUNT(pa.topic_id) AS stances
FROM essentials.politicians p
LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
WHERE p.external_id IN (-200589, -201153, -201154, -201155, -700010)
GROUP BY p.full_name, p.external_id
ORDER BY p.external_id;

-- Q2: Uncited rows — must return 0:
SELECT COUNT(*) FROM inform.politician_context pc
WHERE pc.politician_id IN (
  SELECT id FROM essentials.politicians
  WHERE external_id IN (-200589, -201153, -201154, -201155, -700010)
)
AND (sources IS NULL
     OR array_length(sources, 1) IS NULL
     OR array_length(sources, 1) = 0);

-- Q3: Unpaired answers — must return 0:
SELECT COUNT(*) FROM inform.politician_answers pa
LEFT JOIN inform.politician_context pc
  ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
WHERE pa.politician_id IN (
  SELECT id FROM essentials.politicians
  WHERE external_id IN (-200589, -201153, -201154, -201155, -700010)
)
AND pc.politician_id IS NULL;

-- Q4: Dead topic check — must return 0 (NOTE: use topic_key not slug):
SELECT pa.topic_id, ct.topic_key, ct.is_active, COUNT(*) as rows
FROM inform.politician_answers pa
JOIN inform.compass_topics ct ON ct.id = pa.topic_id
WHERE pa.politician_id IN (
  SELECT id FROM essentials.politicians
  WHERE external_id IN (-200589, -201153, -201154, -201155, -700010)
)
AND ct.is_active = false
GROUP BY pa.topic_id, ct.topic_key, ct.is_active;
-- Expected: 0 rows

-- Q5: Confirm Fisher has NO stance rows (safety check):
SELECT COUNT(*) FROM inform.politician_answers
WHERE politician_id = (
  SELECT id FROM essentials.politicians WHERE external_id = -700011
);
-- Expected: 0 (Fisher excluded per BEVHILLS-01)
```

---

## Beverly Hills Government Context (for research agent)

**City of Beverly Hills** — geo_id=0606308; government UUID=d319e00d-07c4-44b3-99f5-390ea6453d59 [VERIFIED: migration 301 header]

Beverly Hills is an independent city in LA County (~34,000 residents, ~15.8 sq mi). It is one of the most affluent cities in the US and is home to the Beverly Hills Police Department (independent — not LASD contract). The city has historically resisted state housing mandates (RHNA compliance was a major public controversy 2021–2024) and takes a strong enforcement approach to homelessness (encampment clearance program). The council tends to be fiscally conservative and pro-business. Notable policy debates: Purple Line extension through BH, development around Beverly Hills Hotel and Beverly Hilton, state housing element lawsuits.

Beverly Hills City Government structure [VERIFIED: migrations 300–301]:
- Mayor: Lester Friedman (directly elected LOCAL_EXEC office)
- City Council: 4 members (LOCAL district, at-large)
- City Treasurer: Howard Fisher (EXCLUDED from stances)
- City Clerk: (administrative, not a policy office)

The Beverly Hills City Council rotates the "Mayor Pro Tem" (deputy mayor) title, but Friedman's Mayor title is his direct election, not a rotation. Do not confuse "Mayor Pro Tem" rotation with Alhambra's full rotational Mayor model.

---

## Runtime State Inventory

Step 2.5: SKIPPED — this is a stance ingestion phase, not a rename/refactor/migration of existing data. No stored keys, collection names, or OS-registered state are being renamed.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| psql CLI with DATABASE_URL | All migrations | Yes (confirmed in Phase 126 Plan 01 SUMMARY) | — | None — primary apply path |
| `mcp__supabase-local` | All migrations (alternate) | Conditionally (not available in bash executor context per Phase 126) | — | psql CLI (primary) |
| `inform.politician_answers` table | Stance storage | Yes (pre-existing) | — | None — required |
| `inform.politician_context` table | Citation storage | Yes (pre-existing) | — | None — required |
| `essentials.politicians` (BH -200589, -201153, -201154, -201155, -700010) | UUID resolution | Yes (seeded in migrations 300–301, v7.0) | — | None — required |

**Missing dependencies with no fallback:** None.

**Note on apply path:** Phase 126 Plan 01 SUMMARY documents "Supabase MCP not directly callable via bash — used psql CLI with DATABASE_URL from C:/EV-Accounts/.env as fallback." The planner should use psql CLI as the primary apply path, not mcp__supabase-local, for executor consistency.

---

## Validation Architecture

`workflow.nyquist_validation` not set (absent = enabled), but this phase has no automated test framework — stance migrations are verified through SQL verification queries run inline in each plan task.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| BEVHILLS-01 | 5 officials attempted; 100% citation; no defaults; Fisher excluded | SQL verification | Per-person queries (row count + unpaired + uncited) + phase-wide Q1–Q5 |

### Sampling Rate

- **Per migration applied:** Run per-person Q1 (row count), Q2 (unpaired), Q3 (uncited) — three queries
- **Per wave merge:** Run full phase-wide Q1–Q5 across all 5 officials
- **Phase gate:** Full suite green + compass render checkpoint on at least one BH official profile before marking BEVHILLS-01 closed

### Wave 0 Gaps

None — no new test infrastructure needed; SQL verification queries are inline in plan tasks.

---

## Security Domain

This phase writes only to `inform.politician_answers` and `inform.politician_context` — existing tables with established RLS. No new auth paths, endpoints, storage buckets, or external integrations. ASVS V2/V3/V4 do not apply. V5 (input validation) is satisfied by the evidence-only rule.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-----------------|--------------|--------|
| Batch multiple politicians in one migration | One migration per politician | Phase 106 onwards | Rollback is per-person; easier to debug |
| No transaction wrapper (589, 597 anomaly) | BEGIN/COMMIT per migration | Phase 574 canonical | Partial writes prevented |
| Bare integer values (589, 597) | Float literals `N.0` | Phase 282 canonical | Schema consistency |
| `version::int` cast on all migrations | `WHERE version ~ '^[0-9]{3}$'` filter for integer-format check | Phase 126 Plan 01 | Avoids integer overflow for timestamp-format versions |
| `ct.slug` in Q4 dead-topic check | `ct.topic_key` | Phase 126 Plan 03 | Column name is topic_key; slug doesn't exist |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Migration 713 is the highest applied integer migration (Wave 0 starting number = 714) | Migration Numbering | MEDIUM — Wave 0 pre-flight resolves this definitively |
| A2 | Active compass topic count is still 44 | Topic UUID Reference | MEDIUM — Wave 0 pre-flight resolves; if different, live list must be captured |
| A3 | John Mirisch has 10–15 stances available (richest record) | Expected Evidence Quality | LOW — blank spokes acceptable; doesn't affect correctness |
| A4 | Beverly Hills Mayor is directly elected (not rotational) | Pitfall 8, Roster | LOW — confirmed by migration 300 pre-flight Q1 showing LOCAL_EXEC district for Friedman; confirmed by Pitfall 8 reasoning |
| A5 | BH Courier archives at bhcourier.com are searchable and accessible | Local Press Sources | LOW — check at execution time; if blocked, Patch + LAT are fallbacks |
| A6 | Sharona Nazarian's DB full_name is "Sharona R. Nazarian" (with middle initial) | Roster | MEDIUM — Wave 0 UUID resolution query will confirm exact full_name as stored |
| A7 | No pre-existing stance rows exist for the 5 BH officials | Wave 0 pre-flight Q6 | LOW — upsert handles pre-existing rows; informational only |

**If this table is empty of HIGH-risk items after Wave 0 runs:** All claims verified.

---

## Open Questions

1. **Actual next migration number**
   - What we know: STATE.md says 714; disk shows 713 as highest
   - What's unclear: Whether 710–713 are all applied to the DB
   - Recommendation: Wave 0 pre-flight resolves with `SELECT MAX(version::int) ... WHERE version ~ '^[0-9]{3}$'`

2. **Sharona Nazarian middle initial in DB**
   - What we know: Migration 301 seeds her as "Sharona R. Nazarian"
   - What's unclear: Whether ON CONFLICT DO NOTHING preserved the "R." middle initial
   - Recommendation: Wave 0 UUID resolution query will return the exact stored full_name

3. **44th topic (data-centers)**
   - What we know: data-centers topic UUID 4559b513-... was discovered in Phase 111 and confirmed active
   - What's unclear: Whether it is in the RESEARCH.md topic block (the block lists 43 named entries + implies 44)
   - Recommendation: Wave 0 topic count query confirms 44; if count = 44, the existing reference block is correct; if executor needs data-centers UUID, run `SELECT topic_key, id FROM inform.compass_topics WHERE is_active = true ORDER BY topic_key;`

---

## Sources

### Primary (HIGH confidence)

- `C:/EV-Accounts/backend/migrations/300_la_wave2_preflight.sql` Q1 RESULTS — Beverly Hills external_ids (-200589 Friedman, -201153 Mirisch, -201154 Corman, -201155 Wells), LOCAL_EXEC vs LOCAL district types, government UUID d319e00d; read directly from file
- `C:/EV-Accounts/backend/migrations/301_la_wave2_beverly_hills.sql` — Nazarian external_id -700010, Fisher external_id -700011, BH City Council chamber UUID 9c1ac8de, government UUID d319e00d; read directly from file
- `C:/EV-Accounts/backend/migrations/310_la_wave4_geo_id_audit.sql` — Confirms BH 6 politicians, geo_id=0606308, Nazarian/Fisher as -700010/-700011 gap-fills; read directly from file
- `C:/EV-Accounts/backend/migrations/703_lee_stances.sql` — Most recent canonical stance format (same city tier, immediately prior phase)
- `C:/EV-Accounts/backend/migrations/282_md_exec_stances.sql` — Canonical float/BEGIN/COMMIT/double-cast stance format
- `.planning/phases/126-alhambra-stances/126-01-SUMMARY.md` — Phase 126 Wave 0 pre-flight results; confirmed schema fix for version integer cast; confirmed topic count 44
- `.planning/phases/126-alhambra-stances/126-03-SUMMARY.md` — Schema fix: `topic_key` not `slug` on inform.compass_topics
- STATE.md — Migration counter (next: 714), Beverly Hills phase position, v15.0 scope

### Secondary (MEDIUM confidence)

- ROADMAP.md Phase 127 section — Confirmed roster (Friedman/Corman/Mirisch/Nazarian/Wells), geo_id=0606308
- REQUIREMENTS.md BEVHILLS-01 — Requirement text confirmed; Fisher exclusion explicitly documented
- `.planning/phases/126-alhambra-stances/126-RESEARCH.md` — Topic UUID reference block (44 topics); carried forward from Phase 126

### Tertiary (LOW confidence)

- [ASSUMED] Evidence yield estimates for each official — based on city characteristics, known tenure lengths, and Beverly Hills press footprint; not verified against live sources in this session

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — fully established pattern, confirmed from multiple prior phases including Phase 126 (immediately prior)
- Architecture: HIGH — identical to prior city council stance phases (106, 122–126)
- Politician rosters and external IDs: HIGH — read directly from migration SQL files (300, 301, 310)
- Migration numbering: MEDIUM — STATE.md says 714 and disk confirms 713 is highest; Wave 0 pre-flight required to confirm DB applied state
- Beverly Hills Mayor directly-elected (vs. rotational): HIGH — confirmed from migration 300 pre-flight
- Expected evidence yield by official: LOW — based on training knowledge of Beverly Hills city politics

**Research date:** 2026-06-16
**Valid until:** 2026-07-16 (migration format stable; topic UUIDs rarely change; verify active count at Wave 0)
