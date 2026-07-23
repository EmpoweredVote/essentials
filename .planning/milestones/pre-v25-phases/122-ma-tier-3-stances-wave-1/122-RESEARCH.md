# Phase 122: MA Tier 3 Stances Wave 1 - Research

**Researched:** 2026-06-15
**Domain:** Evidence-only compass stance ingestion for Newton + Somerville city officials
**Confidence:** HIGH

---

## Summary

Phase 122 applies evidence-only compass stances for all Newton city officials (Mayor Laredo + 24 City Councillors = 25 total) and all Somerville city officials (Mayor Wilson + 11 City Councillors = 12 total), for 37 politicians in total. The pattern is fully established from Phases 106, 111, 112, 113, 114, 115, and the recent Tier 2 local-official stances (migrations 574, 589, 597). No new technology, schema, or SQL patterns are introduced — this is pure research-then-migrate execution.

The migration format is identical to the Boston city officials pattern (migration 574): one migration file per politician, each containing paired `INSERT INTO inform.politician_answers` + `INSERT INTO inform.politician_context` blocks using `ON CONFLICT DO UPDATE`, dollar-quoting for reasoning, and `ARRAY[...]::text[]::text[]` for sources. The key constraints are: one politician researched at a time, evidence-only (no row inserted when no evidence found), and 100% citation rate on all written values.

Next migration number: **598** (Phase 121 used 590–596; migration 597 is Quincy stances from a parallel track). The Somerville Mayor and several Somerville councillors have rich progressive policy records and should yield 10–20+ stances each. Newton Mayor Laredo has a shorter tenure (inaugurated January 1, 2026) so his record is thinner; senior councillors like Albright, Krintzman, and Baker have multi-year records. Most ward councillors for both cities will have sparse public records — blank spokes are the correct outcome.

**Primary recommendation:** Follow the exact migration pattern from 574_boston_stances.sql (float values `2.0` not bare `2`; BEGIN/COMMIT wrapper; dollar-quoted reasoning; double-cast sources array). Research Mayor first for each city, then councillors in external_id order. Apply immediately after each research session. 37 migration files total (migrations 598–634).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Stance data storage | Database (Supabase) | — | `inform.politician_answers` + `inform.politician_context` tables |
| Stance evidence research | Research agent (Claude) | Web sources | Agent reads public records, produces CSV/SQL output |
| Migration application | Supabase MCP (`mcp__supabase-local`) | — | `mcp__supabase-local` IS remote production |
| Compass rendering | Frontend (ev-ui) | — | `computeDisplaySpokes()` in src/lib/compass.js reads from DB |

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NEWTON-03 | Compass shows evidence-only stance data for Newton Mayor + council members; sequential research, 100% citation rate, no blank-default values | Fully supported by established pattern (migrations 574, 589, 597); external IDs confirmed from migration 578 |
| SOMERVILLE-03 | Compass shows evidence-only stance data for Somerville Mayor + City Councillors; sequential research, 100% citation rate | Fully supported; external IDs confirmed from migration 581; Mayor Wilson has strong progressive record |
</phase_requirements>

---

## Standard Stack

### Core

No new packages. This phase uses only:

| Tool | Version | Purpose |
|------|---------|---------|
| Supabase MCP (`mcp__supabase-local`) | live | Apply SQL migrations to remote production DB |
| PostgreSQL SQL | — | Migration files: paired INSERT + upsert pattern |
| inform.politician_answers | — | Stores stance value (1.0–5.0 float) |
| inform.politician_context | — | Stores reasoning text + sources array |

### No Installation Needed

All tools in use. No `npm install`, `pip install`, or external package installs required for this phase.

---

## Package Legitimacy Audit

No external packages are installed in this phase. Section not applicable.

---

## Architecture Patterns

### System Architecture Diagram

```
Research agent (Claude)
     |
     | reads public web sources
     v
Evidence (bills, votes, statements, news)
     |
     | produces value (1.0-5.0) + reasoning + URL(s)
     v
SQL migration file (NNN_lastname_stances.sql)
     |
     | mcp__supabase-local__execute_sql
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
├── 598_laredo_stances.sql          # Mayor Marc C. Laredo (Newton)
├── 599_albright_stances.sql        # Councillor Susan Albright
├── ...                             # one file per Newton councillor
├── 622_micley_stances.sql          # Last Newton councillor (24th)
├── 623_wilson_stances.sql          # Mayor Jake Wilson (Somerville)
├── 624_link_stances.sql            # Councillor Jon Link
├── ...                             # one Somerville councillor per migration
└── 634_hardt_stances.sql           # Last Somerville councillor (11th)
```

Note: exact migration numbers above are illustrative — some Newton councillors may share a migration file if they have zero stances (blank = no file needed; file still created with header + COMMIT and 0 INSERT blocks, or skip entirely per project precedent). The planner must decide whether to create an empty migration for zero-stance officials or skip the file number. Prior precedent (Phase 106 ACPS, Phase 115 Boston SC): individual files are created even for zero-stance results to keep the ledger consistent.

### Pattern 1: Per-Individual Stance Migration (canonical)

[VERIFIED: 574_boston_stances.sql, 106-PATTERNS.md, 111-PATTERNS.md]

```sql
-- ============================================================================
-- Migration NNN: {FirstName LastName} Stances
-- ============================================================================
-- Purpose: Insert/upsert stance data for {FirstName LastName} ({title}).
--
-- Topic scope: All active compass topics attempted; evidence-only — topics with
--   no evidence are omitted entirely (no neutral defaults per D-01).
--
-- Idempotency: ON CONFLICT (politician_id, topic_id) DO UPDATE on both tables.
-- Apply to remote Supabase via Supabase MCP (mcp__supabase-local is remote production).
-- ============================================================================

-- Topic UUID reference (inform.compass_topics):
-- [paste full active topic block — verify count via SELECT COUNT(*) FROM inform.compass_topics WHERE is_active = true]

BEGIN;

-- ============================================================
-- {FirstName LastName}
-- ============================================================

-- ----- {FirstName LastName} / {topic-slug} -----
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('{politician_uuid}',
        '{topic_uuid}',
        {N}.0)
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('{politician_uuid}',
        '{topic_uuid}',
        $$[2-5 sentences of evidence-anchored reasoning with specific bills/votes/statements]$$,
        ARRAY['https://url1/path', 'https://url2/path']::text[]::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

-- [repeat for each topic with evidence]

COMMIT;

-- ============================================================================
-- Verification queries (run after applying):
-- ============================================================================
-- SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id = '{uuid}';
-- SELECT COUNT(*) FROM inform.politician_answers pa
-- LEFT JOIN inform.politician_context pc
--   ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
-- WHERE pa.politician_id = '{uuid}' AND pc.politician_id IS NULL;
-- SELECT COUNT(*) FROM inform.politician_context
-- WHERE politician_id = '{uuid}'
--   AND (sources IS NULL OR array_length(sources, 1) IS NULL OR array_length(sources, 1) = 0);
```

**Key rules (all [VERIFIED: 574_boston_stances.sql + 106-PATTERNS.md]):**
- `value` is a float literal: `1.0`, `2.0`, `3.0`, `4.0`, or `5.0` — NEVER bare integer `4`, NEVER quoted string `'4'`
- Both INSERTs use `ON CONFLICT ... DO UPDATE SET` — full upsert, idempotent
- `reasoning` uses PostgreSQL dollar-quoting (`$$...$$`) — handles apostrophes without escaping
- `sources` typed as `ARRAY['url1', 'url2']::text[]::text[]` — the double `::text[]` cast is project standard; copy verbatim
- At least 1 URL required in `sources` per project rule. No bare-domain URLs; must include path
- `BEGIN; ... COMMIT;` wrapper around all INSERT blocks for the politician
- Politician section header inside the transaction

### Anti-Patterns to Avoid

- **Bare integer values:** Using `4` instead of `4.0` — the apply script uses `parseInt(r.value)` but the DB column expects float; 574_boston_stances.sql uses floats throughout; 597_quincy_stances.sql and 589_brockton_stances.sql deviate (bare integers) — treat 574 as canonical
- **Parallel research:** Never launch two research sub-agents simultaneously — burns rate limit quota with no usable output (project constraint, multiple violations logged)
- **Default neutral values:** Inserting `3.0` (neutral) for topics with no evidence — this destroys trust; blank spoke is honest
- **Missing BEGIN/COMMIT:** Each file must be wrapped in a transaction; 597/589 omit this — treat 574 as canonical
- **Citing domain-only URLs:** `sources` must include path (`/news/article-slug`, not just `wgbh.org`)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Compass position scale | Custom scoring algorithm | Research agent reads topic axis definition and places on 1–5 scale |
| Citation storage | Custom citation table | `inform.politician_context.sources` array (already exists) |
| Politician UUID resolution | Hard-coded guesses | `SELECT id FROM essentials.politicians WHERE external_id = {N}` at runtime |
| Topic UUID lookup | Hard-coded topic names | Topic UUID reference block from 111-PATTERNS.md (copy verbatim into each migration header) |

---

## Politician Roster and External IDs

All external IDs are [VERIFIED: migration 578 for Newton city, migration 579 for Newton SC, migration 581 for Somerville city].

### Newton City Officials (25 politicians, migration 578)

| external_id | Name | Title |
|-------------|------|-------|
| -2545560001 | Marc C. Laredo | Mayor |
| -2545560002 | Susan Albright | City Councilor (Ward 2 AL) |
| -2545560003 | Brittany Hume Charm | City Councilor (Ward 5 AL) |
| -2545560004 | Cyrus Dahmubed | City Councilor (Ward 4 AL) |
| -2545560005 | Rena Getz | City Councilor (Ward 5 AL) |
| -2545560006 | Brian Golden | City Councilor (Ward 7 AL) |
| -2545560007 | Lisa Gordon | City Councilor (Ward 6 AL) |
| -2545560008 | Becky Grossman | City Councilor (Ward 7 AL) |
| -2545560009 | David Kalis | City Councilor (Ward 8 AL) |
| -2545560010 | Andrea Kelley | City Councilor (Ward 3 AL) |
| -2545560011 | Josh Krintzman | City Councilor (Ward 4 AL) |
| -2545560012 | Allison Leary | City Councilor (Ward 1 AL) |
| -2545560013 | Tarik Lucas | City Councilor (Ward 2 AL) |
| -2545560014 | John Oliver | City Councilor (Ward 1 AL) |
| -2545560015 | Sean Roche | City Councilor (Ward 6 AL) |
| -2545560016 | Jacob Silber | City Councilor (Ward 8 AL) |
| -2545560017 | Pamela Wright | City Councilor (Ward 3 AL) |
| -2545560018 | R. Lisle Baker | City Councilor (Ward 7) |
| -2545560019 | Martha Bixby | City Councilor (Ward 6) |
| -2545560020 | Randy Block | City Councilor (Ward 4) |
| -2545560021 | Stephen Farrell | City Councilor (Ward 8) |
| -2545560022 | Maria S. Greenberg | City Councilor (Ward 1) |
| -2545560023 | Julie Irish | City Councilor (Ward 5) |
| -2545560024 | Julia Malakie | City Councilor (Ward 3) |
| -2545560025 | David Micley | City Councilor (Ward 2) |

**UUID resolution query (run at execution time for each person):**
```sql
SELECT id FROM essentials.politicians WHERE external_id = -2545560001;
-- (substitute external_id for each politician)
```

**Scope note:** NEWTON-03 covers Mayor + council members. The Newton School Committee (migration 579, external IDs -2508610001 through -2508610008) is NOT in scope for Phase 122. School committee stances are not required by NEWTON-03.

### Somerville City Officials (12 politicians, migration 581)

| external_id | Name | Title |
|-------------|------|-------|
| -2562535001 | Jake Wilson | Mayor |
| -2562535002 | Jon Link | City Councilor (At-Large) |
| -2562535003 | Wilfred N. Mbah | City Councilor (At-Large) |
| -2562535004 | Kristen E. Strezo | City Councilor (At-Large) |
| -2562535005 | Ben Wheeler | City Councilor (At-Large) |
| -2562535006 | Matthew McLaughlin | City Councilor (Ward 1) |
| -2562535007 | Jefferson Thomas Scott | City Councilor (Ward 2) |
| -2562535008 | Ben Ewen-Campen | City Councilor (Ward 3) |
| -2562535009 | Jesse Clingan | City Councilor (Ward 4) |
| -2562535010 | Naima Sait | City Councilor (Ward 5) |
| -2562535011 | Lance L. Davis | City Councilor (Ward 6) |
| -2562535012 | Emily Hardt | City Councilor (Ward 7) |

**Scope note:** SOMERVILLE-03 covers Mayor + City Councillors. The Somerville School Committee (migration 582, external IDs -2510890001 through -2510890007) is NOT in scope for Phase 122.

---

## Migration Numbering

[VERIFIED: migration file listing, Phase 121 SUMMARY]

- Phase 121 used migrations 590–596
- Migration 597 = Quincy stances (Phase 117-03 parallel track, already on disk)
- **Next migration for Phase 122: 598**
- 37 officials total → migrations 598–634 (inclusive), assuming one migration file per official
- Some officials with zero evidence may share a migration or the planner may choose to skip file numbers for zero-stance officials — precedent varies; Phase 115 Boston SC created individual files even for blanks

---

## Topic UUID Reference Block

[VERIFIED: 111-PATTERNS.md — confirmed against live DB pattern; planner must verify active count before first migration via `SELECT COUNT(*) FROM inform.compass_topics WHERE is_active = true`]

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
```

---

## Expected Evidence Quality by Official

[ASSUMED — based on city size, mayoral tenure, and known progressive activism patterns]

### Newton Mayor Marc C. Laredo

Laredo was inaugurated January 1, 2026 (very new Mayor). His prior public record is limited to whatever he said as a candidate. Senior-councillor-level topics like housing, zoning, and local environment are the most likely to have evidence from his campaign or first months. Expect 3–8 stances. If no statement found, blank spoke is correct.

### Newton City Councillors

- **Richer records (multi-term, policy-active):** Susan Albright (Ward 2 AL — long-serving), Josh Krintzman (Ward 4 AL — former City Council President), Brian Golden (Ward 7 AL — brother of former MA House Speaker, public policy voice), Becky Grossman (Ward 7 AL — active on housing), R. Lisle Baker (Ward 7 — professor, written extensively)
- **Thin records (newer or less public-facing):** Cyrus Dahmubed, Rena Getz, Jacob Silber, Tarik Lucas, Julie Irish, David Micley — expect 0–3 stances, blank spokes common
- **Key topics for Newton:** housing, residential-zoning, local-environment, growth-and-development, public-safety-approach, transportation-priorities

### Somerville Mayor Jake Wilson

Wilson was a progressive State Representative before becoming Mayor (37th Mayor, inaugurated January 2, 2026). He has a multi-year legislative record from Beacon Hill. Expect 10–20+ stances across housing, climate, criminal justice, healthcare, immigration, and local topics. Primary sources: malegislature.gov bill sponsorships + Somerville Journal + local media.

### Somerville City Councillors

- **Richer records:** Ben Ewen-Campen (Ward 3 — co-authored multiple Somerville resolutions, outspoken on housing/climate), Lance L. Davis (Ward 6 — Council President, policy-active), Jesse Clingan (Ward 4 — involved in housing/zoning debates), Wilfred Mbah (At-Large — immigration/civil rights focus)
- **Moderate records:** Jon Link, Kristen Strezo, Matthew McLaughlin, Naima Sait
- **Potentially thin:** Ben Wheeler, Jefferson Thomas Scott ("J.T."), Emily Hardt (newest member, elected Nov 2025)
- **Key topics for Somerville:** housing, rent-regulation, residential-zoning, local-environment, immigration, local-immigration, public-safety-approach, homelessness-response

---

## Common Pitfalls

### Pitfall 1: Float vs. Integer Value

**What goes wrong:** Writing `value = 4` instead of `value = 4.0`
**Why it happens:** Migration 597 (Quincy) and 589 (Brockton) use bare integers; executor may follow that pattern
**How to avoid:** Canonical pattern is `574_boston_stances.sql` which uses `2.0`, `3.0` etc. Always use float literal
**Warning signs:** Reviewer sees `VALUES ('uuid', 'topic_uuid', 4)` without `.0`

### Pitfall 2: Parallel Research Sessions

**What goes wrong:** Research agent for councillor N+1 starts before councillor N's migration is applied
**Why it happens:** Impatience; planner may queue multiple agents
**How to avoid:** Each plan wave must be sequential: research → write SQL → apply migration → verify → next person
**Warning signs:** Two active Claude research sub-tasks in the same session

### Pitfall 3: Fabricating Evidence for Sparse Records

**What goes wrong:** Writing `3.0` (neutral/center) for a junior councillor with no public record, citing a generic article that doesn't actually state their position
**Why it happens:** Pressure to "fill in" the compass
**How to avoid:** The project rule is absolute: if no direct statement, vote, or action found — no INSERT. Blank spoke is correct.
**Warning signs:** Sources array contains only vague city website links, no specific statements

### Pitfall 4: Missing BEGIN/COMMIT

**What goes wrong:** Migration runs but if it fails partway through, partial data is written
**Why it happens:** Copying format from 597/589 which lack transaction wrappers
**How to avoid:** Every per-individual migration file uses `BEGIN; ... COMMIT;` wrapping all INSERT blocks
**Warning signs:** File jumps straight from header comments to first INSERT with no `BEGIN;`

### Pitfall 5: Newton SC Scope Creep

**What goes wrong:** Research also includes Newton School Committee members (Proia, Swain, Bhardwaj, etc.)
**Why it happens:** Phase 117 seeded both city council AND school committee
**How to avoid:** NEWTON-03 requirement text says "Newton Mayor + council members" — SC is not in scope
**Warning signs:** Migration file created with external_id in -2508610xxx range

### Pitfall 6: Somerville SC Scope Creep

**What goes wrong:** Research includes Somerville School Committee members
**Why it happens:** Phase 118 seeded both city council AND school committee
**How to avoid:** SOMERVILLE-03 says "Mayor + City Councillors" — SC not in scope
**Warning signs:** External_id in -2510890xxx range

### Pitfall 7: Sources Array Single-Cast

**What goes wrong:** Writing `ARRAY['url']::text[]` instead of `ARRAY['url']::text[]::text[]`
**Why it happens:** The double-cast looks redundant
**How to avoid:** Project standard (from 282_md_exec_stances.sql, propagated to all stance files): always double-cast `::text[]::text[]`
**Warning signs:** Only one `::text[]` in sources array

---

## Code Examples

### UUID Resolution (run before writing each migration)

```sql
-- Resolve Newton Mayor
SELECT id FROM essentials.politicians WHERE external_id = -2545560001;

-- Resolve all Newton officials at once
SELECT external_id, full_name, id
FROM essentials.politicians
WHERE external_id BETWEEN -2545560025 AND -2545560001
ORDER BY external_id DESC;

-- Resolve all Somerville officials at once
SELECT external_id, full_name, id
FROM essentials.politicians
WHERE external_id BETWEEN -2562535012 AND -2562535001
ORDER BY external_id DESC;
```

### Phase-Wide Verification Query (run at closure)

```sql
-- Count stances for all Newton officials
SELECT p.full_name, COUNT(pa.topic_id) as stances
FROM essentials.politicians p
LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
WHERE p.external_id BETWEEN -2545560025 AND -2545560001
GROUP BY p.full_name, p.external_id
ORDER BY p.external_id DESC;

-- Count stances for all Somerville officials
SELECT p.full_name, COUNT(pa.topic_id) as stances
FROM essentials.politicians p
LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
WHERE p.external_id BETWEEN -2562535012 AND -2562535001
GROUP BY p.full_name, p.external_id
ORDER BY p.external_id DESC;

-- 100% citation check — must return 0
SELECT COUNT(*) FROM inform.politician_context pc
WHERE pc.politician_id IN (
  SELECT id FROM essentials.politicians
  WHERE external_id BETWEEN -2545560025 AND -2545560001
     OR external_id BETWEEN -2562535012 AND -2562535001
)
AND (sources IS NULL
     OR array_length(sources, 1) IS NULL
     OR array_length(sources, 1) = 0);

-- Unpaired answers check — must return 0
SELECT COUNT(*) FROM inform.politician_answers pa
LEFT JOIN inform.politician_context pc
  ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
WHERE pa.politician_id IN (
  SELECT id FROM essentials.politicians
  WHERE external_id BETWEEN -2545560025 AND -2545560001
     OR external_id BETWEEN -2562535012 AND -2562535001
)
AND pc.politician_id IS NULL;
```

### Per-Person Verification (after each migration)

```sql
-- Row count (substitute uuid):
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

---

## Research Execution Order

The planner must enforce sequential execution. Recommended ordering:

**Newton batch (25 politicians, migrations 598–622):**
1. Mayor Laredo (-2545560001)
2. Councillors in external_id order: Albright, Hume Charm, Dahmubed, Getz, Golden, Gordon, Grossman, Kalis, Kelley, Krintzman, Leary, Lucas, Oliver, Roche, Silber, Wright, Baker, Bixby, Block, Farrell, Greenberg, Irish, Malakie, Micley

**Somerville batch (12 politicians, migrations 623–634):**
1. Mayor Wilson (-2562535001)
2. Councillors in external_id order: Link, Mbah, Strezo, Wheeler, McLaughlin, Scott, Ewen-Campen, Clingan, Sait, Davis, Hardt

Each batch can be broken into plan files of 5–10 politicians for context-window management (following Phase 115 Boston pattern: one plan per ~10–15 officials).

---

## Common Pitfalls

### Pitfall 8: Migration Counter Confusion

**What goes wrong:** Using migration number 598 for a second file, or skipping a number, causing ledger gaps
**Why it happens:** Multiple officials being tracked across plans; easy to mis-count
**How to avoid:** Each plan file should explicitly list its migration range. The PATTERNS.md file for Phase 122 should track the next available migration number as a running counter.
**Warning signs:** `supabase_migrations.schema_migrations` shows gaps in numeric sequence

---

## Runtime State Inventory

Step 2.5: SKIPPED — this is a stance ingestion phase, not a rename/refactor/migration of existing data. No stored keys, collection names, or OS-registered state are being renamed.

---

## Environment Availability

| Dependency | Required By | Available | Fallback |
|------------|------------|-----------|----------|
| `mcp__supabase-local` | All migrations | Yes (confirmed live) | None — required |
| `inform.politician_answers` table | Stance storage | Yes (pre-existing) | None — required |
| `inform.politician_context` table | Citation storage | Yes (pre-existing) | None — required |
| `essentials.politicians` (Newton range) | UUID resolution | Yes (migration 578 applied) | None — required |
| `essentials.politicians` (Somerville range) | UUID resolution | Yes (migration 581 applied) | None — required |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

`workflow.nyquist_validation` not set (absent = enabled), but this phase has no automated test framework — stance migrations are verified through SQL verification queries run inline in each plan task, not via a test suite. Phase-wide closure verification (Q1/Q2/Q3/Q4 queries) is the testing mechanism.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| NEWTON-03 | All Newton officials attempted; 100% citation; no defaults | SQL verification | Per-person queries + phase-wide Q1/Q2/Q3 queries |
| SOMERVILLE-03 | All Somerville officials attempted; 100% citation; no defaults | SQL verification | Per-person queries + phase-wide Q1/Q2/Q3 queries |

### Sampling Rate

- **Per migration applied:** Run per-person Q1 (row count), Q2 (unpaired), Q3 (uncited) — three queries
- **Per wave merge:** Run full phase-wide Q1/Q2/Q3 across all politicians in batch
- **Phase gate:** Full suite green + compass render checkpoint on Mayor Laredo + Mayor Wilson profiles

### Wave 0 Gaps

None — no new test infrastructure needed; SQL verification queries are inline in plan tasks.

---

## Security Domain

This phase writes only to `inform.politician_answers` and `inform.politician_context` — existing tables with established RLS. No new auth paths, endpoints, or storage buckets. No security domain changes. ASVS categories V2/V3/V4 do not apply; V5 (input validation) is satisfied by the evidence-only rule (no user input accepted).

---

## State of the Art

| Old Approach | Current Approach |
|--------------|-----------------|
| Batch multiple politicians in one migration (Phase 115 initial Boston pattern) | One migration per politician (Phase 106 onwards) |
| No transaction wrapper (Phases 589, 597 anomaly) | BEGIN/COMMIT per migration (canonical: Phase 574, 106) |
| Bare integer values (Phases 589, 597) | Float literals `N.0` (canonical: Phase 574, 106) |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Mayor Laredo has 3–8 stances available from campaign statements and first months | Expected Evidence Quality | Low — blank spokes are acceptable; doesn't affect migration correctness |
| A2 | Mayor Wilson has 10–20+ stances from his State Representative record | Expected Evidence Quality | Low — more stances possible if he's more prolific; fewer acceptable |
| A3 | External IDs -2562535002 through -2562535012 correspond to the councillors listed (Jon Link, Mbah, Strezo, Wheeler, McLaughlin, Scott, Ewen-Campen, Clingan, Sait, Davis, Hardt) in that order | Politician Roster | HIGH risk — executor must verify via DB query before writing migrations |
| A4 | Migration 597 (Quincy) is the last migration on disk; next available is 598 | Migration Numbering | Medium — another migration may have been applied via a different path; executor must verify via `SELECT MAX(version::int) FROM supabase_migrations.schema_migrations` |

---

## Open Questions (RESOLVED)

1. **Migration 597 applied or only on disk?** — RESOLVED by Plan 01 Task 1 (Wave 0 pre-flight): executor runs `SELECT version FROM supabase_migrations.schema_migrations WHERE version IN ('596', '597')` to confirm applied status before writing any migration.

2. **Active compass topic count changed?** — RESOLVED by Plan 01 Task 1 (Wave 0 pre-flight): executor runs `SELECT COUNT(*) FROM inform.compass_topics WHERE is_active = true` and uses the live list if count differs from expected 44.

3. **Pre-existing stance rows for Newton/Somerville officials?** — RESOLVED by Plan 01 Task 1 (Wave 0 pre-flight): executor runs pre-check query; upsert (`ON CONFLICT DO UPDATE`) handles pre-existing rows correctly either way.

---

## Sources

### Primary (HIGH confidence)

- `578_newton_city_government.sql` — Newton roster, external IDs -2545560001 to -2545560025, confirmed from migration file directly
- `579_newton_school_committee.sql` — Newton SC external IDs (out of scope); Mayor ex-officio pattern confirmed
- `581_somerville_city_government.sql` — Somerville roster, external IDs -2562535001 to -2562535012
- `574_boston_stances.sql` — Canonical stance migration format: float values, BEGIN/COMMIT, dollar-quoting, double-cast sources
- `106-PATTERNS.md` — Full per-individual stance migration template + shared rules
- `111-PATTERNS.md` — Topic UUID reference block (44 topics)
- Phase 121 05-SUMMARY.md — Confirms migrations 590–596 used; last migration on disk = 597

### Secondary (MEDIUM confidence)

- `597_quincy_stances.sql` — Recent local-official stances example (but deviates on float format; not canonical)
- `589_brockton_stances.sql` — Recent local-official stances (also deviates on float format; not canonical)
- ROADMAP.md Phase 122 section — Confirms scope: Newton Mayor + council, Somerville Mayor + City Councillors

### Tertiary (LOW confidence)

- [ASSUMED] Evidence quality estimates for individual officials based on city-size, progressiveness of city, and known tenure lengths

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — fully established pattern, confirmed from multiple prior phases
- Architecture: HIGH — identical to 21 VA stances + 43 MA exec/senator/rep stances + 162 Boston city official stances
- Politician rosters and external IDs: HIGH — read directly from migration SQL files
- Expected evidence yield by official: LOW — based on training knowledge of city politics

**Research date:** 2026-06-15
**Valid until:** 2026-07-15 (migration format is stable; topic UUIDs rarely change but verify active count at execution time)
