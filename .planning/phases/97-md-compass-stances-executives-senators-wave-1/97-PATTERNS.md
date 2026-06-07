# Phase 97: MD Compass Stances — Executives + Senators (Wave 1) - Pattern Map

**Mapped:** 2026-06-07
**Files analyzed:** 9 (5 exec CSVs + 4 migration SQL files; gen_migration.py __main__ extension)
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `2026-06-07-md-exec-moore.csv` (+ 4 more exec CSVs) | data | batch | `2026-05-22-sf-lurie.csv` | exact |
| `2026-06-07-md-senator-d01-mckay.csv` (+ 46 more senator CSVs) | data | batch | `2026-05-22-batch2-booker.csv` (federal batch pattern) | exact |
| `gen_migration.py` (`__main__` block extension — MD sections added) | config/script | batch | Existing `__main__` block: BATCH2/BATCH3/SF sections | exact |
| `282_md_exec_stances.sql` | migration | batch | `216_sf_officials_stances.sql` | exact |
| `283_md_senators_batch_a.sql` | migration | batch | `242_or_senate_stances.sql` | exact |
| `284_md_senators_batch_b.sql` | migration | batch | `242_or_senate_stances.sql` | exact |
| `285_md_senators_batch_c.sql` | migration | batch | `242_or_senate_stances.sql` | exact |

---

## Pattern Assignments

### Exec CSVs: `2026-06-07-md-exec-{lastname}.csv` x5 (data, batch)

**Analog:** `C:\EV-Accounts\backend\data\stance-research\2026-05-22-sf-lurie.csv`

**CSV header format** (line 1 of every CSV):
```
full_name,politician_id,topic_key,topic_id,value,reasoning,source_url_1,source_url_2,source_url_3
```

**Note:** `politician_id` and `topic_id` CSV columns are read by gen_migration.py via `row.get()` but the authoritative politician UUID comes from the `candidate_inventory` tuple passed to `generate_migration()`. You may include or omit those columns — the candidate_inventory is what matters. The RESEARCH.md simplified format (`full_name,topic_key,value,reasoning,source_url_1,source_url_2,source_url_3`) is also acceptable.

**Sample data row format** (from `2026-05-22-sf-lurie.csv` line 2):
```
Daniel Lurie,708db738-...,homelessness,4938766b-...,3,"Lurie's approach combines enforcement...",https://www.sf.gov/...,https://missionlocal.org/...,https://missionlocal.org/...
```

**Critical constraints:**
- `full_name` must exactly match the candidate_inventory name (e.g., `Anthony G. Brown` not `Anthony Brown`)
- `value` is integer 1–5 (stored as string in CSV; gen_migration.py calls `float()` on it)
- `source_url_1` must be non-null for every row (evidence-only constraint)
- `reasoning` must NOT contain `$$` (gen_migration.py wraps in `$$...$$`; if reasoning contains `$$`, use `$REASON$...$REASON$` — but the script handles this automatically via `dollar_quote()`)
- Do NOT include `data-centers`, `local-immigration`, or `transportation-priorities` as `topic_key` for exec/senator CSVs

**Exec full_names (must match exactly — sourced from migration 270):**
```
Wes Moore
Aruna Miller
Anthony G. Brown
Brooke Lierman
Dereck E. Davis
```

---

### Senator CSVs: `2026-06-07-md-senator-d{NN}-{lastname}.csv` x47 (data, batch)

**Analog:** Same CSV format as exec CSVs above. Closest senator analog is the OR senate research pattern.

**Naming convention** (from RESEARCH.md recommended structure):
```
2026-06-07-md-senator-d01-mckay.csv
2026-06-07-md-senator-d02-corderman.csv
...
2026-06-07-md-senator-d47-augustine.csv
```

**Full names must match exactly** (sourced from `generate_md_senate.ps1`, confirmed in RESEARCH.md):
- Names with suffixes: `J.B. Jennings`, `William C. Smith, Jr.`, `Stephen S. Hershey, Jr.`, `Charles E. Sydnor, III`, `Cory V. McCray`, `Jason C. Gallion`, etc.
- Middle initials matter: `Craig J. Zucker`, `Bryan W. Simonaire`, `Joanne C. Benson`, `Arthur Ellis`, etc.

**Not-found handling:** If a senator has no discoverable stances, create an empty CSV (header row only, no data rows) — do NOT omit the file from CSVS list. gen_migration.py auto-emits `-- NOTE: No stances found in CSV for {name} ({pid})` when a candidate has 0 rows in the defaultdict.

---

### `gen_migration.py` `__main__` block extension (config/script, batch)

**Analog:** Existing `__main__` block — specifically the `SF_CANDIDATES` / `SF_CSVS` / `generate_migration()` call pattern for local officials (lines 317–406 of gen_migration.py).

**Pattern to copy for exec section** (lines 363–406, gen_migration.py):
```python
# Add four new sections to the if __name__ == '__main__': block

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

**Senator batch pattern** (copy structure for each of the 3 senator batches — adjust names, districts, migration numbers):
```python
MD_SENATORS_A_CANDIDATES = [
    ("Mike McKay",           "<uuid-from-db>"),   # SD-01
    ("Paul D. Corderman",    "<uuid-from-db>"),   # SD-02
    # ... through SD-15
    ("Brian J. Feldman",     "<uuid-from-db>"),   # SD-15
]

MD_SENATORS_A_CSVS = [
    r"C:\EV-Accounts\backend\data\stance-research\2026-06-07-md-senator-d01-mckay.csv",
    # ... one path per senator in batch
]

generate_migration(
    migration_num=283,
    batch_label="MD Senators Batch A — Districts 1-15",
    candidate_inventory=MD_SENATORS_A_CANDIDATES,
    csv_files=MD_SENATORS_A_CSVS,
    excluded_topics=EXCLUDED_TOPICS_FEDERAL,
    header_scope_note="Federal/state topics only; data-centers, local-immigration, transportation-priorities excluded.",
    outpath=os.path.join(base, "283_md_senators_batch_a.sql"),
)
```

**Key detail:** `generate_migration()` sorts candidates by `x[0].split()[-1]` (last name). The output SQL will group stances by politician sorted by last name, regardless of input order. This is cosmetic only; data integrity is unaffected.

**`base` variable** (already defined at top of `__main__` block — do not redefine):
```python
base = r"C:\EV-Accounts\backend\migrations"
```

---

### `282_md_exec_stances.sql` (migration, batch)

**Analog:** `C:\EV-Accounts\backend\migrations\216_sf_officials_stances.sql`

**This file is generated output — do not hand-write.** Run gen_migration.py to produce it. The output format is exactly:

**Header block** (lines 1–13 of `216_sf_officials_stances.sql`):
```sql
-- ============================================================================
-- Migration 282: MD Executive Stances — 5 Constitutional Officers
-- ============================================================================
-- Purpose: Insert/upsert stance data for 5 politicians.
--
-- Topic scope: Federal/state topics only; data-centers, local-immigration, transportation-priorities excluded.
--
-- Post-state: ~{N} rows expected
--
-- Idempotency: ON CONFLICT (politician_id, topic_id) DO UPDATE on both tables.
-- Apply to remote Supabase via psql.
-- ============================================================================
```

**Per-stance SQL block** (lines 65–79 of `216_sf_officials_stances.sql`):
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
        ARRAY['{source_url_1}', '{source_url_2}']::text[]::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```

**Not-found block** (gen_migration.py lines 161–164):
```sql
-- ============================================================
-- {Name}
-- ============================================================

-- NOTE: No stances found in CSV for {name} ({pid})
```

**Verification footer** (gen_migration.py lines 196–212 — appended automatically):
```sql
-- ============================================================================
-- Verification queries (run after applying):
-- ============================================================================
--
-- Per-candidate row count (every candidate must have >= 10 topics):
-- SELECT p.full_name, COUNT(pa.topic_id) AS topic_count
-- FROM essentials.politicians p
-- LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
-- WHERE p.id IN ({uuid list})
-- GROUP BY p.id, p.full_name ORDER BY topic_count;
--
-- Context pairing (must return 0):
-- SELECT COUNT(*) FROM inform.politician_answers pa
-- LEFT JOIN inform.politician_context pc
--   ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
-- WHERE pa.politician_id IN ({uuid list})
--   AND pc.politician_id IS NULL;
```

---

### `283_md_senators_batch_a.sql`, `284_md_senators_batch_b.sql`, `285_md_senators_batch_c.sql` (migration, batch)

**Analog:** `C:\EV-Accounts\backend\migrations\242_or_senate_stances.sql`

**These files are also generated output — do not hand-write.** Same SQL pattern as 282 above. The OR migration 242 shows inline SQL (without gen_migration.py) for reference:

**OR migration SQL pattern** (lines 12–21 of `242_or_senate_stances.sql`):
```sql
-- David Brock Smith, SD-01
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('5350c0ba-0ef4-4021-a620-90820df859b7', 'af2fdfd6-02c4-49df-b09c-cf8536f4773f', 5)
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('5350c0ba-0ef4-4021-a620-90820df859b7', 'af2fdfd6-02c4-49df-b09c-cf8536f4773f',
$$Voted NO on HB 2002 (2023 Oregon session)...$$,
ARRAY['https://olis.oregonlegislature.gov/...']::text[])
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```

**MD uses gen_migration.py output format** (migration 216 style) — more verbose but identical semantics. Do NOT hand-roll senator SQL; use gen_migration.py.

---

## Shared Patterns

### DB UUID Lookup (applies to all 4 plans — Wave 0 step)
**Source:** `RESEARCH.md` Pattern 2 (verified against migration 270 and `generate_md_senate.ps1`)

```sql
-- Exec UUIDs (run before Plan 97-01 migration generation):
SELECT id, full_name, external_id
FROM essentials.politicians
WHERE external_id BETWEEN -240005 AND -240001
ORDER BY external_id DESC;
-- Expected: Moore=-240001, Miller=-240002, Brown=-240003, Lierman=-240004, Davis=-240005

-- Senator UUIDs (run before each senator batch migration generation):
SELECT id, full_name, external_id
FROM essentials.politicians
WHERE external_id BETWEEN -2410047 AND -2410001
ORDER BY external_id DESC;
-- Expected: 47 rows, McKay=-2410001 through Augustine=-2410047
```

### Evidence-Only Constraint (applies to all CSV rows)
**Source:** `gen_migration.py` `build_sources_array()` function (lines 72–83)

Every stance row must have at least one non-null `source_url_1`. gen_migration.py emits `ARRAY[]::text[]` for rows with no sources — these violate the evidence constraint and must never appear. The verification query (embedded in migration footer) checks for unpaired context rows.

### EXCLUDED_TOPICS_FEDERAL (applies to all MD exec and senator CSVs)
**Source:** `gen_migration.py` line 58

```python
EXCLUDED_TOPICS_FEDERAL = {'data-centers', 'local-immigration', 'transportation-priorities'}
```

Do not research or include these three topic keys in any exec or senator CSV. Pass `excluded_topics=EXCLUDED_TOPICS_FEDERAL` in every `generate_migration()` call for this phase.

### Migration Apply Workflow (applies to all 4 plans)
**Source:** Established in prior phases (migration 216, 242)

```
1. Research agents produce CSVs (one per politician, sequential)
2. Update gen_migration.py __main__ block with candidate_inventory + CSV paths
3. Run: python3 C:/EV-Accounts/backend/data/stance-research/gen_migration.py
4. Review generated .sql file header (row count, candidate list)
5. Apply: mcp__supabase-local__apply_migration with the generated SQL content
6. Run verification queries from migration footer (per-candidate count + context pairing)
```

### Sequential Research Enforcement (applies to all 4 plans)
**Source:** MEMORY.md `feedback_stance_research_one_at_a_time.md`

Plans must explicitly enforce: run one research agent per politician, wait for full SUMMARY before starting the next. Do not run agents in parallel. This is a hard constraint from prior rate-limit failures.

---

## TOPIC_UUIDS Reference (from gen_migration.py lines 9–55)

Full mapping for planners and research agents — 41 applicable topics after EXCLUDED_TOPICS_FEDERAL:

| topic_key | UUID |
|-----------|------|
| abortion | af2fdfd6-02c4-49df-b09c-cf8536f4773f |
| ai-regulation | 666bf03d-81fc-4138-ab15-69ae734c9023 |
| campaign-finance | 92730f69-ae57-401c-8ad1-2d07834a895d |
| childcare | c1ac1330-47f7-44ec-baf3-c913d926b97c |
| city-sanitation | 7687de4f-4d0b-462a-b803-bdfb23b16b42 |
| civil-rights | 0bc588c6-39e1-4084-b5de-cac909b8b762 |
| climate-change | f1e44d66-5d27-4b51-b54f-b7ace86f6a3c |
| deportation | 44905f3b-e105-4f6c-afc7-5d223813dbac |
| economic-development | eb3d1247-0de1-4b7f-baec-7259861efd53 |
| fossil-fuels | a22215c3-6693-4bc2-b248-01aebba14570 |
| growth-and-development | fb25c1ac-91cc-49bf-8afc-c7fa22ef45e4 |
| healthcare | e8dad4a8-eb93-4931-91f5-d8fb5d7dd529 |
| homelessness | 4938766b-b45a-46e3-93bd-b8b30651271a |
| homelessness-response | 6fbf39ae-6b19-4182-b4c2-6a8d25c86c0f |
| housing | 669cac97-66a6-4087-b036-936fbe62efb3 |
| immigration | 4e2c69ce-591e-4197-9cd5-7aceff79d390 |
| jail-capacity | c267e137-0ff9-4e7d-9d13-e3cea1756cd0 |
| judicial-access-to-justice | 9d45acaf-1ba4-4cb8-95e1-5ed985223b91 |
| judicial-bail-pretrial | 1fab5edf-6151-4da0-9704-a7f2113ba54c |
| judicial-criminal-justice | 9db07b16-1076-4b7d-ad89-ebe7b51f4336 |
| judicial-government-deference | e5e48f0e-8f3a-40e1-8080-889fea389603 |
| judicial-interpretation | 448b1c9a-b6f3-42b8-8f39-d3bbb5bfa9ee |
| judicial-police-accountability | 7bad33eb-e93e-4d94-8822-97212d49bde5 |
| judicial-prosecution-priorities | abb99d95-cbb1-4617-8f8b-f220ef6028ca |
| judicial-transparency | 6674d87e-999d-433a-aab7-3f626f59fd5f |
| local-environment | 1935979c-b290-42e4-baa5-8cb0138b4ffa |
| medicare/aid | cab61e8a-64fe-4bbd-bc08-fe9914d0091b |
| misinformation | ddd65d64-9dc7-4208-a30f-59f4b9c0653d |
| public-safety-approach | e9ebefcd-c496-45e8-b816-a79f8442ba85 |
| redistricting | 48cc9585-ec22-4f53-8d42-6839828dd36f |
| religious-freedom | 6b9ba6d9-1001-43f5-b073-4d37130696fd |
| rent-regulation | c308e8e8-caac-44f5-ab04-dbfecf40bbe2 |
| residential-zoning | d4f18138-a2e0-4110-b925-7387d9d0d16d |
| same-sex-marriage | c5ab4eab-702f-49b8-9277-8ea53f3835c6 |
| school-vouchers | 00b95a6a-75db-4521-b523-3326bba938de |
| social-security | 87d20824-a6e9-407b-983c-65440084a0ab |
| tariffs | 683c8084-2281-4920-a07c-18439b2dd413 |
| taxes | f7e5678d-dadd-4556-a2fc-446e24642ceb |
| trans-athletes | d1618b9c-0b9e-45af-b986-bb33d270b8e4 |
| ukraine-support | 24e9212c-b011-422a-865c-093e35050901 |
| voting-rights | d1792200-1d3b-4955-a0b7-0e6980d7a7b2 |

**EXCLUDED (do not use in MD exec/senator CSVs):**
- `data-centers` — not in TOPIC_UUIDS dict (deprecated); emits WARNING and drops row
- `local-immigration` — excluded from EXCLUDED_TOPICS_FEDERAL
- `transportation-priorities` — excluded from EXCLUDED_TOPICS_FEDERAL

---

## No Analog Found

No files in this phase lack analogs. All patterns are fully established from prior phases:
- Exec CSV pattern: exact match from SF officials wave (migration 216)
- Senator CSV pattern: exact match from BATCH2/BATCH3 federal senator waves
- gen_migration.py extension: exact pattern from existing `__main__` sections
- SQL migration output: generated — no hand-authoring needed

---

## Metadata

**Analog search scope:** `C:\EV-Accounts\backend\data\stance-research\`, `C:\EV-Accounts\backend\migrations\`
**Files scanned:** gen_migration.py (407 lines, full read), 216_sf_officials_stances.sql (80 lines), 242_or_senate_stances.sql (60 lines), 270_md_state_executives.sql (50 lines), 2026-05-22-sf-lurie.csv (10 lines)
**Pattern extraction date:** 2026-06-07

**Key gap noted in RESEARCH.md (Pitfall 2):** `compass-topics-reference.md` does not exist at `C:/EV-Accounts/backend/data/stance-research/compass-topics-reference.md`. Research agents must use gen_migration.py TOPIC_UUIDS dict + the TOPIC_UUIDS table above for topic key enumeration. Plan 97-01 Wave 0 should either create this file or explicitly note that agents use gen_migration.py directly.
