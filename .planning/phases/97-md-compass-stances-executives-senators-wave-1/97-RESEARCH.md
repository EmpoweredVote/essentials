# Phase 97: MD Compass Stances — Executives + Senators (Wave 1) - Research

**Researched:** 2026-06-07
**Domain:** Stance data ingestion via gen_migration.py + CSV research workflow
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Scope is all 5 MD executives — Governor Moore, LG Miller, AG Brown, Comptroller Lierman, and State Treasurer Davis (Davis is is_appointed_position=true but is seeded with a profile; compass coverage is valuable). The ROADMAP says "4 exec" but the user confirmed to include Davis.
- **D-02:** Start fresh — ignore `2026-06-06-md-officials.csv` entirely. Run full research for each exec one at a time, aiming for 15-20+ topics per politician. The existing CSV is sparse (3-8 topics per official) and has no politician_ids; fresh research produces better coverage.
- **D-03:** Exec research is one agent per politician (5 sequential runs). After all 5 are done, generate migration 282 via gen_migration.py and apply to production.
- **D-04:** 47 senators split across 3 plans of ~15/16/16 senators each: Plan 97-02 (districts 1–15), Plan 97-03 (districts 16–31), Plan 97-04 (districts 32–47).
- **D-05:** Within each plan: one research agent per senator, sequential. Each plan's research is completed fully before the migration is generated.
- **D-06:** Rolling migrations — one migration per plan: 282 (execs), 283 (batch A), 284 (batch B), 285 (batch C).
- **D-07:** Each migration is generated via `gen_migration.py` in `C:/EV-Accounts/backend/data/stance-research/`. Applied via `mcp__supabase-local__apply_migration`.
- **D-08:** MD state senators and constitutional officers use federal/state topic scope: all compass topics EXCEPT `data-centers`, `local-immigration`, `transportation-priorities` (EXCLUDED_TOPICS_FEDERAL from gen_migration.py). Researchers aim for 15-20+ covered topics per politician using evidence-only stances.
- **D-09:** Not-found senators (no discoverable public stance on any topic) are documented as `-- NOTE: No stances found in CSV for {name}` within the generated migration SQL. No separate log file is required.

### Claude's Discretion

- **Politician IDs for execs:** Researcher queries DB by external_id range (-240001 to -240005) or by name + government filter.
- **Senator district ordering:** Researcher queries DB for batch split order using district name order.
- **Source strategy for MD senators:** Primary sources are mgaleg.maryland.gov (voting record), ballotpedia.org, and ontheissues.org. For senators with minimal online presence, fewer stances are acceptable — cite what exists; don't fabricate.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MD-STANCES-01 | Compass stances for Governor Moore + 3 constitutional officers, cited from public record | Exec IDs confirmed from migration 270; gen_migration.py workflow established; existing CSV (ignored per D-02) confirms topics exist |
| MD-STANCES-02 | Compass stances for all 47 MD state senators, one agent at a time, evidence-only | Full senator roster + external_ids confirmed from generate_md_senate.ps1; politician_ids must be queried from DB before migration generation |
</phase_requirements>

---

## Summary

Phase 97 ingests compass stances for 5 MD constitutional officers (exec wave) and all 47 MD state senators across 3 sequential batches. The tooling is fully established: `gen_migration.py` generates idempotent SQL migrations from per-politician CSV files, and the entire workflow has been executed for CA (migration 216, SF officials) and OR (migration 242, 30 senators). This phase follows those exact precedents.

The MD exec names in production (`Wes Moore`, `Aruna Miller`, `Anthony G. Brown`, `Brooke Lierman`, `Dereck E. Davis`) are confirmed from migration 270. Politician UUIDs must be queried from the DB by external_id range (-240001 to -240005) for the exec candidate_inventory, and by external_id range (-2410001 to -2410047) for senators. The senator roster (47 senators, districts 1–47 by name) is confirmed from `generate_md_senate.ps1` — that file is the ground truth for both senator names and district ordering.

The most important planning constraint is the sequential execution rule: no parallel stance research agents. Rate limit exhaustion from parallel runs destroys usable output. Each plan must explicitly enforce one agent at a time before proceeding to migration generation.

**Primary recommendation:** Follow the gen_migration.py CSV workflow exactly as established in previous batches. The exec wave (Plan 97-01) is the simplest — 5 politicians with high public profiles and broad online stance records. Each senator batch plan (97-02/03/04) follows the same pattern: research sequentially, accumulate CSVs, run gen_migration.py, apply migration.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Stance research (web lookup) | Research agent (Claude) | — | Manual research task; no automation layer |
| CSV accumulation | Local filesystem | — | One CSV per politician named by date+district+name |
| Migration generation | gen_migration.py script | — | Python script bundles CSVs → idempotent SQL |
| Migration application | Supabase (remote) via mcp__supabase-local__apply_migration | — | `inform.politician_answers` + `inform.politician_context` |
| Compass rendering | Frontend (ev-ui) | API (ev-accounts) | Reads from DB tables; no UI changes needed this phase |

---

## Standard Stack

### Core Tools

| Tool | Location | Purpose |
|------|----------|---------|
| `gen_migration.py` | `C:/EV-Accounts/backend/data/stance-research/gen_migration.py` | Generates SQL migration from CSV files |
| `mcp__supabase-local__apply_migration` | MCP tool | Applies generated SQL to production Supabase |
| mgaleg.maryland.gov | Web source | MD General Assembly voting records — primary for senators |
| ballotpedia.org | Web source | Secondary source for both execs and senators |
| ontheissues.org | Web source | Secondary source, best for execs and high-profile senators |

### CSV Format

Every CSV file must follow this exact header and format [VERIFIED: gen_migration.py source]:

```
full_name,topic_key,value,reasoning,source_url_1,source_url_2,source_url_3
```

- `full_name`: must match exactly the `full_name` field in `essentials.politicians` (case-sensitive)
- `topic_key`: must be a key in `TOPIC_UUIDS` dict and not in `EXCLUDED_TOPICS_FEDERAL`
- `value`: integer 1–5 (written as `1`, `2`, etc. — no decimals required; gen_migration.py accepts `float(value)`)
- `reasoning`: plain prose, no double-dollar signs (gen_migration.py wraps in `$$...$$`)
- `source_url_1`: required (non-null citation); source_url_2/3 optional

### Package Legitimacy Audit

> This phase installs no external packages. No package audit required.

---

## Architecture Patterns

### System Architecture Diagram

```
Research Agent (Claude)
        |
        | web lookups: mgaleg.maryland.gov, ballotpedia.org, ontheissues.org
        v
Per-Politician CSV file (e.g., 2026-06-07-md-exec-d01-moore.csv)
        |
        | (accumulate all CSVs in batch)
        v
gen_migration.py  ←── candidate_inventory list (name, uuid) added to __main__ block
        |
        v
282_md_exec_stances.sql  (or 283/284/285 for senator batches)
        |
        v
mcp__supabase-local__apply_migration
        |
        v
inform.politician_answers  +  inform.politician_context  (production DB)
        |
        v
Compass UI (no changes needed — reads from these tables automatically)
```

### Recommended Project Structure

```
C:\EV-Accounts\backend\data\stance-research\
├── 2026-06-07-md-exec-moore.csv           # Gov Moore (Plan 97-01)
├── 2026-06-07-md-exec-miller.csv          # LG Miller
├── 2026-06-07-md-exec-brown.csv           # AG Brown
├── 2026-06-07-md-exec-lierman.csv         # Comptroller Lierman
├── 2026-06-07-md-exec-davis.csv           # Treasurer Davis
├── 2026-06-07-md-senator-d01-mckay.csv    # SD-01 (Plan 97-02)
├── ...                                     # d02 through d15
├── 2026-06-07-md-senator-d16-love.csv     # SD-16 (Plan 97-03)
├── ...                                     # d17 through d31
├── 2026-06-07-md-senator-d32-beidle.csv   # SD-32 (Plan 97-04)
├── ...                                     # d33 through d47
└── gen_migration.py                        # Updated with MD batches in __main__

C:\EV-Accounts\backend\migrations\
├── 282_md_exec_stances.sql
├── 283_md_senators_batch_a.sql
├── 284_md_senators_batch_b.sql
└── 285_md_senators_batch_c.sql
```

### Pattern 1: gen_migration.py `__main__` block extension

**What:** Add four new batch sections to gen_migration.py's `if __name__ == '__main__'` block — one per migration (282–285). Each section defines a `CANDIDATES` list and `CSVS` list, then calls `generate_migration()`.

**Example (exec batch):**
```python
# Source: C:/EV-Accounts/backend/data/stance-research/gen_migration.py (established pattern)

MD_EXEC_CANDIDATES = [
    ("Wes Moore",        "<uuid-from-db>"),
    ("Aruna Miller",     "<uuid-from-db>"),
    ("Anthony G. Brown", "<uuid-from-db>"),
    ("Brooke Lierman",   "<uuid-from-db>"),
    ("Dereck E. Davis",  "<uuid-from-db>"),
]

MD_EXEC_CSVS = [
    r"C:\EV-Accounts\backend\data\stance-research\2026-06-07-md-exec-moore.csv",
    r"C:\EV-Accounts\backend\data\stance-research\2026-06-07-md-exec-miller.csv",
    r"C:\EV-Accounts\backend\data\stance-research\2026-06-07-md-exec-brown.csv",
    r"C:\EV-Accounts\backend\data\stance-research\2026-06-07-md-exec-lierman.csv",
    r"C:\EV-Accounts\backend\data\stance-research\2026-06-07-md-exec-davis.csv",
]

generate_migration(
    migration_num=282,
    batch_label="MD Executive Stances — 5 Constitutional Officers",
    candidate_inventory=MD_EXEC_CANDIDATES,
    csv_files=MD_EXEC_CSVS,
    excluded_topics=EXCLUDED_TOPICS_FEDERAL,
    header_scope_note="Federal/state topics only; data-centers, local-immigration, transportation-priorities excluded.",
    outpath=os.path.join(base, "282_md_exec_stances.sql"),
)
```

### Pattern 2: DB lookup for politician UUIDs

The candidate_inventory for gen_migration.py requires the exact UUID from `essentials.politicians`. The query to get exec UUIDs is [VERIFIED: migration 270]:

```sql
-- Execs: external_id range -240001 to -240005
SELECT id, full_name, external_id
FROM essentials.politicians
WHERE external_id BETWEEN -240005 AND -240001
ORDER BY external_id DESC;

-- Senators: external_id range -2410001 to -2410047
SELECT id, full_name, external_id
FROM essentials.politicians
WHERE external_id BETWEEN -2410047 AND -2410001
ORDER BY external_id DESC;
```

Expected results:
- Wes Moore: external_id=-240001
- Aruna Miller: external_id=-240002
- Anthony G. Brown: external_id=-240003
- Brooke Lierman: external_id=-240004
- Dereck E. Davis: external_id=-240005
- Senators: SD-01 McKay at -2410001 through SD-47 Augustine at -2410047

### Pattern 3: OR senate stances as closest template

Migration 242 (`242_or_senate_stances.sql`) used inline SQL rather than gen_migration.py. MD will use gen_migration.py instead for cleaner batch output — but the OR migration shows the correct SQL pattern (two INSERTs per stance row: one to `inform.politician_answers`, one to `inform.politician_context`, each with `ON CONFLICT DO UPDATE`). [VERIFIED: file at C:/EV-Accounts/backend/migrations/242_or_senate_stances.sql]

### Anti-Patterns to Avoid

- **Running research agents in parallel:** Rate limit exhaustion produces zero usable output. CONTEXT.md memory explicitly enforces one at a time.
- **Using gen_migration.py topic_key `data-centers`:** Not in TOPIC_UUIDS dict — will emit a WARNING and skip silently. Do not include in CSVs.
- **Mismatching `full_name` in CSV:** gen_migration.py groups rows by `(full_name, politician_id)` from the candidate_inventory. A CSV row's `full_name` must exactly match the candidate_inventory name (e.g., `Anthony G. Brown` not `Anthony Brown`). Mismatch = silently ignored rows.
- **Omitting source_url_1:** Evidence-only constraint requires at least one non-null source. gen_migration.py emits `ARRAY[]::text[]` for rows with no sources — these violate the evidence constraint and should not occur.
- **Double dollar signs in reasoning text:** gen_migration.py wraps reasoning in `$$...$$`. If reasoning contains `$$`, it uses the `$REASON$...$REASON$` escape. Don't manually include `$$` in CSV reasoning fields.
- **Not generating migration before applying:** gen_migration.py must be run (Python) to produce the `.sql` file; then `mcp__supabase-local__apply_migration` applies that file's content. The tool does not accept raw Python output.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SQL upsert generation | Custom SQL writer | `gen_migration.py generate_migration()` | Already handles dollar-quoting, source arrays, conflict handling, per-candidate blocks, verification queries |
| Topic UUID lookup | Hardcoded UUID list in plan | `TOPIC_UUIDS` dict in gen_migration.py | Single source of truth; already verified against production DB |
| Not-found documentation | Separate log file | gen_migration.py auto-inserts `-- NOTE: No stances found` comment | Already implemented (D-09) |

**Key insight:** gen_migration.py is the entire ingestion layer. Plans should never reproduce its logic; they only need to populate CSVs and call the script.

---

## Known Politician Data (from Migration 270 + generate_md_senate.ps1)

### MD Executives — Full Names in DB [VERIFIED: migration 270 source]

| Full Name in DB | Title | External ID |
|----------------|-------|-------------|
| `Wes Moore` | Governor | -240001 |
| `Aruna Miller` | Lieutenant Governor | -240002 |
| `Anthony G. Brown` | Attorney General | -240003 |
| `Brooke Lierman` | Comptroller | -240004 |
| `Dereck E. Davis` | State Treasurer (appointed) | -240005 |

**CRITICAL:** The candidate_inventory `full_name` must match these exactly. The existing sparse CSV uses `Anthony G. Brown` — confirmed correct.

### MD Senator Roster — All 47 [VERIFIED: generate_md_senate.ps1, 2026-06-02]

**Batch A (Plan 97-02, districts 1–15):**

| District | Full Name | Party | External ID |
|----------|-----------|-------|-------------|
| SD-01 | Mike McKay | Republican | -2410001 |
| SD-02 | Paul D. Corderman | Republican | -2410002 |
| SD-03 | Karen Lewis Young | Democrat | -2410003 |
| SD-04 | William G. Folden | Republican | -2410004 |
| SD-05 | Justin Ready | Republican | -2410005 |
| SD-06 | Johnny Ray Salling | Republican | -2410006 |
| SD-07 | J.B. Jennings | Republican | -2410007 |
| SD-08 | Carl Jackson | Democrat | -2410008 |
| SD-09 | Katie Fry Hester | Democrat | -2410009 |
| SD-10 | Benjamin Brooks | Democrat | -2410010 |
| SD-11 | Shelly Hettleman | Democrat | -2410011 |
| SD-12 | Clarence K. Lam | Democrat | -2410012 |
| SD-13 | Guy Guzzone | Democrat | -2410013 |
| SD-14 | Craig J. Zucker | Democrat | -2410014 |
| SD-15 | Brian J. Feldman | Democrat | -2410015 |

**Batch B (Plan 97-03, districts 16–31):**

| District | Full Name | Party | External ID |
|----------|-----------|-------|-------------|
| SD-16 | Sara Love | Democrat | -2410016 |
| SD-17 | Cheryl C. Kagan | Democrat | -2410017 |
| SD-18 | Jeff Waldstreicher | Democrat | -2410018 |
| SD-19 | Benjamin F. Kramer | Democrat | -2410019 |
| SD-20 | William C. Smith, Jr. | Democrat | -2410020 |
| SD-21 | Jim Rosapepe | Democrat | -2410021 |
| SD-22 | Alonzo T. Washington | Democrat | -2410022 |
| SD-23 | Ron Watson | Democrat | -2410023 |
| SD-24 | Joanne C. Benson | Democrat | -2410024 |
| SD-25 | Nick Charles | Democrat | -2410025 |
| SD-26 | C. Anthony Muse | Democrat | -2410026 |
| SD-27 | Kevin M. Harris | Democrat | -2410027 |
| SD-28 | Arthur Ellis | Democrat | -2410028 |
| SD-29 | Jack Bailey | Republican | -2410029 |
| SD-30 | Shaneka Henson | Democrat | -2410030 |
| SD-31 | Bryan W. Simonaire | Republican | -2410031 |

**Batch C (Plan 97-04, districts 32–47):**

| District | Full Name | Party | External ID |
|----------|-----------|-------|-------------|
| SD-32 | Pamela Beidle | Democrat | -2410032 |
| SD-33 | Dawn Gile | Democrat | -2410033 |
| SD-34 | Mary-Dulany James | Democrat | -2410034 |
| SD-35 | Jason C. Gallion | Republican | -2410035 |
| SD-36 | Stephen S. Hershey, Jr. | Republican | -2410036 |
| SD-37 | Johnny Mautz | Republican | -2410037 |
| SD-38 | Mary Beth Carozza | Republican | -2410038 |
| SD-39 | Nancy J. King | Democrat | -2410039 |
| SD-40 | Antonio Hayes | Democrat | -2410040 |
| SD-41 | Dalya Attar | Democrat | -2410041 |
| SD-42 | Chris West | Republican | -2410042 |
| SD-43 | Mary Washington | Democrat | -2410043 |
| SD-44 | Charles E. Sydnor, III | Democrat | -2410044 |
| SD-45 | Cory V. McCray | Democrat | -2410045 |
| SD-46 | Bill Ferguson | Democrat | -2410046 |
| SD-47 | Malcolm Augustine | Democrat | -2410047 |

---

## Applicable Compass Topics (Federal/State Scope)

`EXCLUDED_TOPICS_FEDERAL = {'data-centers', 'local-immigration', 'transportation-priorities'}` [VERIFIED: gen_migration.py]

The effective topic list for MD execs and senators (41 topics total from TOPIC_UUIDS after exclusions):

**Federal/state topics (30):** abortion, ai-regulation, campaign-finance, childcare, civil-rights, climate-change, deportation, economic-development, fossil-fuels, healthcare, homelessness, homelessness-response, housing, immigration, jail-capacity, judicial-criminal-justice, judicial-interpretation, medicare/aid, misinformation, public-safety-approach, redistricting, religious-freedom, same-sex-marriage, school-vouchers, social-security, tariffs, taxes, trans-athletes, ukraine-support, voting-rights

**City/local topics still applicable (11, after exclusions):** city-sanitation, growth-and-development, judicial-access-to-justice, judicial-bail-pretrial, judicial-government-deference, judicial-police-accountability, judicial-prosecution-priorities, judicial-transparency, local-environment, rent-regulation, residential-zoning

**Excluded (3):** data-centers (not in TOPIC_UUIDS dict), local-immigration, transportation-priorities

---

## Primary Research Sources for MD Officials

### MD General Assembly Voting Records [ASSUMED: standard Maryland legislative research practice]
- `mgaleg.maryland.gov` — voting record search, bill history, legislator pages
- URL pattern for senator pages: `https://mgaleg.maryland.gov/mgawebsite/Members/Details/[member-id]`
- Voting record URL: `https://mgaleg.maryland.gov/mgawebsite/Members/Details/[member-id]?ys=2025RS`

### Ballotpedia [ASSUMED: established research source used in previous phases]
- `https://ballotpedia.org/[First_Last]`
- Most useful for: political positions, committee memberships, issue stances
- Quality varies: high-profile senators have detailed pages; rural Republican senators may have minimal coverage

### OnTheIssues [ASSUMED: established research source]
- `https://www.ontheissues.org/`
- Best for: governor and constitutional officers (Wes Moore, Anthony Brown have extensive entries)
- Less useful for: state senators (coverage thinner than for federal officials)

### Senator-Specific Considerations [ASSUMED based on OR senate research pattern]

**High public profile (expect 15+ topics):**
- Bill Ferguson (SD-46, Senate President) — extensive record
- Wes Moore, Anthony G. Brown — both former federal officials with rich public records
- Democrat senators from urban districts (Baltimore City: SD-40, SD-41, SD-43, SD-44, SD-45, SD-46; Montgomery County: SD-16–SD-19; Prince George's: SD-21–SD-27)

**Lower public profile (expect 5–10 topics or not-found):**
- Republican senators from rural Western Maryland: SD-01 (McKay), SD-04 (Folden), SD-05 (Ready), SD-06 (Salling)
- Eastern Shore Republican senators: SD-36 (Hershey), SD-37 (Mautz), SD-38 (Carozza)
- Limited online presence senators documented as not-found per D-09

---

## Migration Counter Verification

**Current highest migration file:** `281_md_2026_discovery.sql` [VERIFIED: filesystem listing of C:/EV-Accounts/backend/migrations/]

**Phase 97 target migrations:**
- Migration 282: MD exec stances (Plan 97-01)
- Migration 283: MD senators batch A (Plan 97-02)
- Migration 284: MD senators batch B (Plan 97-03)
- Migration 285: MD senators batch C (Plan 97-04)

**Note on STATE.md:** STATE.md shows "Next migration: 278" which is outdated (migrations 278–281 have been applied by Phase 96). The CONTEXT.md decision D-06 correctly specifies 282–285. The filesystem listing confirms 281 as the current ceiling.

---

## Common Pitfalls

### Pitfall 1: full_name Mismatch Between CSV and Candidate Inventory
**What goes wrong:** A CSV row's `full_name` column doesn't match the `full_name` in `MD_EXEC_CANDIDATES` list. gen_migration.py groups by `(full_name, politician_id)` — a mismatch means all rows for that politician are silently dropped from the migration.
**Why it happens:** Researchers may write "Anthony Brown" instead of "Anthony G. Brown", or "Bill Ferguson" vs. "William Ferguson".
**How to avoid:** Use the exact `full_name` values from the Known Politician Data section above (sourced from migration 270 and generate_md_senate.ps1). The candidate_inventory list in gen_migration.py becomes the authoritative source — CSV values must match it.
**Warning signs:** Migration generates 0 stances for a politician but no error was printed. Check gen_migration.py stderr for "No stances found" comment.

### Pitfall 2: compass-topics-reference.md Does Not Exist
**What goes wrong:** CONTEXT.md references `C:/EV-Accounts/backend/data/stance-research/compass-topics-reference.md` as a canonical reference for building research prompts. This file does not exist on disk.
**Why it happens:** The file was listed in CONTEXT.md as a canonical reference but was never created.
**How to avoid:** Research agents must construct topic prompts from gen_migration.py's TOPIC_UUIDS dict (which lists all 43 topic keys) combined with the Applicable Compass Topics section above. The answer scale (1–5) must be described from memory/training — there is no separate reference file to read.
**Action for Plan 97-01:** Plans should note this gap and either create compass-topics-reference.md as a Wave 0 task, or explicitly instruct the researcher to use gen_migration.py TOPIC_UUIDS + knowledge of the 1–5 scale.

### Pitfall 3: Parallel Agent Runs Exhaust Rate Limit
**What goes wrong:** Multiple stance research agents running in parallel consume the Claude API rate limit within minutes, producing rate-limit errors that terminate all agents with no usable output.
**Why it happens:** Each research agent makes many web fetch + reasoning calls. Even 2 parallel runs can trigger rate limiting.
**How to avoid:** Plans must be explicit: run one agent per senator, wait for SUMMARY before starting the next. The memory file `feedback_stance_research_one_at_a_time.md` reinforces this.

### Pitfall 4: data-centers Topic in CSV
**What goes wrong:** A research agent includes `data-centers` as a topic key in a CSV row. gen_migration.py emits `WARNING: Unknown topic_key 'data-centers' in [file] — skipping`. The row is dropped.
**Why it happens:** `data-centers` appears in `EXCLUDED_TOPICS_FEDERAL` but is not in TOPIC_UUIDS, suggesting it was a deprecated topic. Research agents unaware of this will waste effort.
**How to avoid:** The Applicable Compass Topics section above explicitly lists data-centers as excluded. Plans must tell agents: do not research data-centers.

### Pitfall 5: Missing Verification After Migration Apply
**What goes wrong:** Migration applied but some politicians have 0 stances (full_name mismatch) or context rows are missing (unpaired answers). Phase 97 verification passes visually but data integrity is broken.
**How to avoid:** Run the built-in verification queries that gen_migration.py embeds at the bottom of every migration file:
1. Per-candidate row count — every candidate must have >= 10 topics (or a documented not-found note)
2. Context pairing check — must return 0 (no unpaired answer rows)
These are commented-out SELECT queries at the end of each .sql file; run them after applying.

### Pitfall 6: Not-Found Senators Undocumented
**What goes wrong:** A senator has no findable stances, so no CSV is created for them. gen_migration.py requires a CSV file path in the CSVS list — but an empty or missing CSV will cause a FileNotFoundError.
**How to avoid:** Per D-09, not-found senators still need entries in the candidate_inventory but their CSV file should either be created as an empty CSV (headers only, no data rows) or omitted from the CSVS list while keeping the name in candidate_inventory. The gen_migration.py by_candidate defaultdict returns `[]` for any candidate with no rows — it will auto-emit the `-- NOTE: No stances found` comment correctly. Do NOT pass a nonexistent file path.

---

## DB Schema Reference

### inform.politician_answers [VERIFIED: gen_migration.py + migration 216]
```sql
-- Primary columns used by stance migrations:
politician_id  uuid  (references essentials.politicians.id)
topic_id       uuid  (references inform.compass_topics.id)
value          numeric  (1–5 integer stored as numeric)
UNIQUE (politician_id, topic_id)
```

### inform.politician_context [VERIFIED: gen_migration.py + migration 216]
```sql
politician_id  uuid
topic_id       uuid
reasoning      text
sources        text[]
UNIQUE (politician_id, topic_id)
```

### SQL Pattern Per Stance Row [VERIFIED: migration 216 + gen_migration.py output]
```sql
-- ----- {Name} / {topic_key} -----
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('{politician_uuid}',
        '{topic_uuid}',
        {value})
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('{politician_uuid}',
        '{topic_uuid}',
        $${reasoning}$$,
        ARRAY['{source_url_1}', '{source_url_2}']::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3 | gen_migration.py | Must verify at plan time | — | None — required |
| gen_migration.py | Migration generation | ✓ | Current | — |
| mcp__supabase-local | Migration apply | ✓ (established in prior phases) | — | psql direct |
| mgaleg.maryland.gov | Stance research | ✓ (used in Phase 93/94) | — | ballotpedia.org |
| ballotpedia.org | Stance research | ✓ | — | ontheissues.org |

**Missing dependencies with no fallback:**
- Python 3 must be available to run gen_migration.py. This was confirmed working in prior phases; plans should include a quick `python3 --version` check as Wave 0.

---

## Validation Architecture

> nyquist_validation not explicitly configured in .planning/config.json (key absent = treated as enabled).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | SQL verification queries (embedded in migration file) |
| Config file | None — queries embedded at bottom of each .sql file |
| Quick run command | Run the commented verification SELECTs after `apply_migration` |
| Full suite command | Same + visual compass spot-check on 2–3 senator profiles |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MD-STANCES-01 | 5 exec politicians have >= 1 stance with non-null source | SQL query | `SELECT p.full_name, COUNT(pa.topic_id) FROM essentials.politicians p LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id WHERE p.external_id BETWEEN -240005 AND -240001 GROUP BY p.full_name` | ❌ Wave 0 (generated by gen_migration.py) |
| MD-STANCES-01 | No unpaired answer rows for execs | SQL query | Context pairing query from migration 282 footer | ❌ Wave 0 |
| MD-STANCES-02 | All 47 senators appear in migration (stances or not-found note) | SQL query | Count of distinct politician_ids in inform.politician_answers for senators | ❌ Wave 0 |
| MD-STANCES-02 | Evidence-only: no stance row has empty sources array | SQL query | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN inform.politician_context pc ON pc.politician_id=pa.politician_id AND pc.topic_id=pa.topic_id WHERE pa.politician_id IN (...senator ids...) AND array_length(pc.sources,1) IS NULL` | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] Verification queries (embedded by gen_migration.py) — auto-generated; no manual file needed
- [ ] Wave 0 Python check: `python3 --version && python3 C:/EV-Accounts/backend/data/stance-research/gen_migration.py --help 2>&1` — confirms script is runnable before research begins

---

## Security Domain

This phase has no authentication, authorization, or user-facing input changes. All writes go through `mcp__supabase-local__apply_migration` with vetted, hand-reviewed SQL. No ASVS categories applicable.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | mgaleg.maryland.gov is a reliable primary source for MD senator voting records | Primary Research Sources | Senator stances harder to find; fewer topics covered per senator; not-found rate rises |
| A2 | ballotpedia.org and ontheissues.org have coverage of MD senators | Primary Research Sources | Same as A1 |
| A3 | High-profile Democrat senators from urban districts will yield 15+ topics | Senator-Specific Considerations | Conservative estimate; actual coverage may be lower for lesser-known senators |
| A4 | Rural Republican senators (Western MD / Eastern Shore) will have lower public stance coverage | Senator-Specific Considerations | May be higher or lower; research will determine actual not-found rate |
| A5 | compass-topics-reference.md does not exist | Pitfall 2 | If it does exist at an alternate path not checked, plans can reference it instead |

**If this table is empty:** All claims in this research were verified or cited. (Not empty — A1–A5 are assumed based on research patterns from OR senate phase.)

---

## Open Questions

1. **Python availability for gen_migration.py**
   - What we know: gen_migration.py requires Python 3; it was used in prior phases successfully
   - What's unclear: Plans don't currently include a Python version check as a Wave 0 step
   - Recommendation: Add `python3 --version` as first Wave 0 step in Plan 97-01

2. **compass-topics-reference.md referenced but missing**
   - What we know: CONTEXT.md lists this as a canonical reference at `C:/EV-Accounts/backend/data/stance-research/compass-topics-reference.md`; file does not exist
   - What's unclear: Was it planned to be created? Is there an alternate path?
   - Recommendation: Plan 97-01 Wave 0 should either create this file from gen_migration.py TOPIC_UUIDS, or explicitly note that researchers use gen_migration.py directly. Either way, the 1–5 answer scale for each topic should be documented somewhere accessible to research agents.

3. **Senator not-found rate**
   - What we know: OR senate had some low-profile senators with thin records; MD likely similar
   - What's unclear: What fraction of 47 MD senators will have zero discoverable stances?
   - Recommendation: Plans should not set hard targets per senator; focus on evidence-only quality. ROADMAP success criterion says "at least one compass answer exists for every MD state senator who has a discoverable public stance" — not-found is acceptable and expected.

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/data/stance-research/gen_migration.py` — TOPIC_UUIDS, EXCLUDED_TOPICS_FEDERAL, generate_migration() signature, CSV format
- `C:/EV-Accounts/backend/migrations/270_md_state_executives.sql` — MD exec full_names and external_ids in production
- `C:/EV-Accounts/backend/migrations/generate_md_senate.ps1` — complete 47-senator roster with full_name and external_id (verified mgaleg.maryland.gov 2026-06-02)
- `C:/EV-Accounts/backend/migrations/216_sf_officials_stances.sql` — canonical migration output format (gen_migration.py output)
- `C:/EV-Accounts/backend/migrations/242_or_senate_stances.sql` — OR senate stances (alternate SQL pattern reference)
- `.planning/phases/97-md-compass-stances-executives-senators-wave-1/97-CONTEXT.md` — locked decisions D-01 through D-09
- `ls /c/EV-Accounts/backend/migrations/` sorted listing — confirms migration 281 is current ceiling

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` §MD-STANCES — success criteria for MD-STANCES-01/02
- `.planning/ROADMAP.md` §Phase 97 — success criteria + D-01 override (Davis as 5th exec)
- `.planning/STATE.md` — project context, key decisions, migration counter note

### Tertiary (LOW confidence / ASSUMED)
- mgaleg.maryland.gov, ballotpedia.org, ontheissues.org as research sources for senator stances — established pattern from prior phases but not verified per-senator in this session

---

## Metadata

**Confidence breakdown:**
- Known politician data (names, IDs): HIGH — sourced directly from migration SQL and generator scripts
- gen_migration.py workflow: HIGH — source code reviewed in full
- Migration counter (282–285): HIGH — filesystem listing confirms 281 as ceiling
- compass-topics-reference.md existence: HIGH (confirmed missing) — filesystem search returned no results
- Senator research source coverage: LOW — assumes mgaleg/ballotpedia/ontheissues without per-senator verification

**Research date:** 2026-06-07
**Valid until:** 2026-07-07 (stable tooling; senator roster valid until next election cycle)
