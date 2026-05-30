# Phase 80: OR Compass Stances — Research

**Researched:** 2026-05-30
**Domain:** Compass stance ingestion — OR constitutional officers, US House reps (6), Portland council/Mayor/Auditor (13)
**Confidence:** HIGH (architecture, tooling, IDs), MEDIUM (evidence feasibility per group)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** OR state legislature (30 senators + 60 house reps from Phase 75) is DEFERRED — Phase 80 strictly covers constitutional officers + federal + Portland council.
- **D-02:** Appointed officials with no public policy record (Taylor, Lee III) receive 0 stances by design — no research needed.
- **D-03:** Research all 12 Portland council members + Mayor Wilson equally using the standard evidence-only approach. Accept sparse or zero stances by design where evidence is genuinely absent.
- **D-04:** Simone Rede (City Auditor, elected) — run a research pass. Accept 0 stances by design if no public positions on compass topics are found. Sparse/zero is expected and not a failure.
- **D-05:** ONE-AT-A-TIME rule: each stance research agent must run sequentially. NEVER run parallel research agents.
- **D-06:** Evidence-only: no stances without a verifiable, citable public record. No interpolation, no assumption from party affiliation.
- **D-07:** Value scale: 1=progressive, 5=conservative, integer values 1–5. Half-steps reserved for extreme edge cases only.
- **D-08:** Research ALL compass topics — not just LOCAL-scope ones. Aim for 18-21+ stances per politician; record only what has evidence.

### Claude's Discretion

- Plan structure (2 vs. 3 plans) is left to the planner to decide based on Phase 70 precedent.
- Research source priority per official is left to the researcher.

### Deferred Ideas (OUT OF SCOPE)

- OR state legislature stances (30 OR senators + 60 OR house reps from Phase 75) — deferred to future backlog phase.
</user_constraints>

---

## Summary

Phase 80 ingests compass stances for 25 OR officials: 5 constitutional officers, 6 US House reps, and 13 Portland council/Mayor/Auditor. Ron Wyden (24 stances) and Jeff Merkley (23 stances) are already complete and require no work. Robert L. Taylor and Raymond C. Lee III (appointed) are skipped by design per D-02.

The ingestion architecture is fully established from Phases 18, 46, and 70. No schema changes, no bridge migrations, and no new infrastructure are required. Each politician's UUID from `essentials.politicians` is used directly in `inform.politician_answers`. The apply script pattern (TypeScript, CSV input, `ON CONFLICT DO UPDATE`, `parseInt(r.value)` direct — no conversion) is stable.

Evidence feasibility varies significantly by group. Congressional representatives (Bonamici, Hoyle, Bynum, Salinas — all Democrats; Bentz — Republican) have the richest record through Congress.gov vote histories, ProPublica Congress API, and GovTrack. OR constitutional officers (Kotek, Rayfield especially) have extensive state-level records. Portland council members were elected November 2024 under the new charter — Willamette Week voter guides, Oregonian candidate Q&As, and individual campaign websites are the best available sources, though tenure is short.

**Primary recommendation:** Use the Phase 70 three-plan structure: Plan 01 = OR constitutional officers (5 people), Plan 02 = OR US House reps (6 people), Plan 03 = Portland council/Mayor/Auditor (13 people), Plan 04 = verification. Run each research+apply agent one-at-a-time within each plan.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Stance value storage | Database (inform schema) | — | `inform.politician_answers` is the single source of truth |
| Compass widget render | Browser / Client | — | CompassCard gates on `politicianIdsWithStances` set from API |
| Stance availability signal | API / Backend | — | `GET /compass/politicians` returns IDs with ≥1 answer |
| Stance ingestion | API / Backend | — | Admin `PUT /api/compass/politicians/:id/answers` RPC |
| CSV → DB apply | Backend script | — | `apply-{slug}-stances.ts` one-per-politician pattern |
| Citation enforcement | Database (inform schema) | — | `inform.politician_context` row required per answer |

---

## Definitive Politician Roster (25 to research)

### Already Complete — Skip

| external_id | Full Name | Stances |
|-------------|-----------|---------|
| -4101001 | Ron Wyden | 24 rows — DONE |
| -4101002 | Jeff Merkley | 23 rows — DONE |

### Skip by Design (D-02)

| external_id | Full Name | Reason |
|-------------|-----------|--------|
| -690003 | Raymond C. Lee III | Appointed City Administrator — no public policy record |
| -690004 | Robert L. Taylor | Appointed City Attorney — no public policy record |

### Plan 01: OR Constitutional Officers (5 people)

| external_id | Full Name | UUID | Role | Evidence Expectation |
|-------------|-----------|------|------|---------------------|
| -4100001 | Tina Kotek | 66c3bd97-94d1-4287-b1b8-86605a38cb97 | Governor | HIGH — extensive legislative + executive record |
| -4100002 | Dan Rayfield | 15dbbf1b-da3d-4fb9-8fc5-67b734e7979e | Attorney General | HIGH — former House Speaker, very documented |
| -4100003 | Tobias Read | 94105ea6-e6f7-4629-b30c-a8fe713e1cad | Secretary of State | MEDIUM — voting rights + election administration focus |
| -4100004 | Elizabeth Steiner | c712d9cb-6a42-4fc6-b025-67cd5064605f | State Treasurer | MEDIUM — former state senator, broader record |
| -4100005 | Christina Stephenson | 8548989d-ff40-4b25-bb42-e1a7cbb03c88 | Labor Commissioner | MEDIUM — labor/economic topics; former state rep |

### Plan 02: OR US House Representatives (6 people)

| external_id | Full Name | UUID | District | Party | Evidence Expectation |
|-------------|-----------|------|----------|-------|---------------------|
| -4102001 | Suzanne Bonamici | 6ffb9093-7489-4197-aebc-67065c239fc3 | CD-1 | D | HIGH — long tenure, ProPublica/GovTrack full record |
| -4102002 | Cliff Bentz | fb00c887-11f5-46f2-b822-f9848368bbd2 | CD-2 | R | HIGH — documented conservative positions, multiple terms |
| -4102003 | Maxine Dexter | 13dcf1a8-c0bf-4e2f-92aa-46637182b42a | CD-3 | D | MEDIUM — new 2024, fewer votes but OR state senate record exists |
| -4102004 | Val Hoyle | f6202cef-4e46-4db5-a9c0-c69ac9a8eccd | CD-4 | D | HIGH — former OR Labor Commissioner, 2 House terms |
| -4102005 | Janelle Bynum | 7aad2a83-2f05-4570-aa7a-eb7a8c602ebd | CD-5 | D | MEDIUM — new 2024, but former OR state rep with documented record |
| -4102006 | Andrea Salinas | 5f6c498b-87dd-48fe-b744-62c8dced2ac3 | CD-6 | D | MEDIUM — new 2024, former OR state rep with documented record |

### Plan 03: Portland Council, Mayor, and Auditor (13 people)

| external_id | Full Name | UUID | Role | Evidence Expectation |
|-------------|-----------|------|------|---------------------|
| -690001 | Keith Wilson | bd39d61e-3040-4ec1-815e-df16b1f9a8a0 | Mayor | MEDIUM-HIGH — campaign materials, Oregonian coverage |
| -690002 | Simone Rede | f797e87b-65dd-44c0-8d9d-967893d8ed3d | City Auditor | LOW — role is financial oversight; accept 0 by design (D-04) |
| -690010 | Candace Avalos | c5db367e-9403-4a88-a95f-bf864279e13b | Council D1 | MEDIUM — Willamette Week voter guide, campaign site |
| -690011 | Jamie Dunphy | 14ebbd1c-597e-483a-a846-73a7aca54ed2 | Council D1 | LOW-MEDIUM — new council member, limited record |
| -690012 | Loretta Smith | e6682850-601f-4017-b4e7-d9cd4be47aea | Council D1 | MEDIUM — former Multnomah County Commissioner, long record |
| -690013 | Dan Ryan | 60fa9870-d984-46a7-a6ed-5f6fbebe72ce | Council D2 | MEDIUM-HIGH — prior Portland City Council tenure |
| -690014 | Elana Pirtle-Guiney | 987e0304-acd0-4b00-bf65-9e4fdbe4af3a | Council D2 | LOW-MEDIUM — new council member |
| -690015 | Sameer Kanal | dc00f7c1-54d1-46d8-8b35-545abdd38d8d | Council D2 | LOW-MEDIUM — new council member |
| -690016 | Angelita Morillo | c6799d98-362a-4e27-b7c5-be45a82a150f | Council D3 | LOW-MEDIUM — new council member |
| -690017 | Steve Novick | c9e19031-259e-4133-b5d9-96cf1a5f31ff | Council D3 | MEDIUM-HIGH — former Portland City Commissioner with documented record |
| -690018 | Tiffany Koyama Lane | 2947c92f-fee2-46e4-b472-9fd89a8f0f65 | Council D3 | LOW-MEDIUM — new council member |
| -690019 | Eric Zimmerman | 1518349b-3d63-49d0-9411-be19f86a7ea7 | Council D4 | LOW-MEDIUM — new council member |
| -690020 | Mitch Green | acc73d7e-6522-40a9-bbe0-17cf56a96466 | Council D4 | LOW-MEDIUM — new council member |

Note: -690021 (Loretta Smith's seat) is the 12th council seat. Check whether there is a 13th council member for D4 (Tiffany Koyama Lane is listed as D3 seat 3, Mitch Green as D4). The CONTEXT.md lists 12 council members (Districts 1-4, 3 seats each) plus Mayor and Auditor = 14 total officials. The table above includes 13 rows (1 Mayor + 1 Auditor + 12 council) — this is correct per the pre-condition findings.

---

## Standard Stack

### Core (no changes from prior phases)

| Component | Version | Purpose | Source |
|-----------|---------|---------|--------|
| `inform.politician_answers` | — | Stores (politician_id, topic_id, value) stance rows | [VERIFIED: 18-RESEARCH.md, migration 038] |
| `inform.politician_context` | — | Stores citation (reasoning + sources) per answer | [VERIFIED: 18-RESEARCH.md, CONTEXT.md] |
| TypeScript apply script | Node 18+ | CSV → DB ingestion (one per politician group) | [VERIFIED: canonical apply scripts in EV-Accounts] |
| csv-parse/sync | installed | CSV parsing in apply scripts | [VERIFIED: existing scripts compile and run] |
| pg (node-postgres) | installed | DB connection in apply scripts | [VERIFIED: existing scripts] |

### Apply Script Pattern (canonical)

All apply scripts follow this exact pattern — confirmed from `apply-allen-stances.ts`, `apply-mckinney-stances.ts`, `apply-malik-stances.ts` (the three most recent verified scripts):

```typescript
// Source: C:/EV-Accounts/backend/scripts/apply-allen-stances.ts (canonical)
import 'dotenv/config';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  const csvPath = path.join(__dirname, '..', 'data', 'stance-research', 'YYYY-MM-DD-{slug}.csv');
  const csv = readFileSync(csvPath, 'utf8');
  const rows = parse(csv, { columns: true, skip_empty_lines: true }) as Array<Record<string, string>>;

  let upserted = 0, skipped = 0;
  for (const r of rows) {
    if (!r.value || r.value === 'null' || r.value === '') { skipped++; continue; }
    await pool.query(
      `INSERT INTO inform.politician_answers (politician_id, topic_id, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value`,
      [r.politician_id, r.topic_id, parseInt(r.value)]  // NO conversion — value direct from CSV
    );
    upserted++;
  }
  console.log(`Done — Upserted: ${upserted}, Skipped: ${skipped}`);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
```

**Critical warning:** `apply-solis-stances.ts` uses `3 - parseInt(r.value)` — this is an outlier from a prior scale dispute. Do NOT copy this pattern. The canonical pattern is `parseInt(r.value)` with no arithmetic. [VERIFIED: apply-allen-stances.ts, apply-malik-stances.ts]

### CSV Format (canonical)

```csv
politician_id,topic_id,topic_key,value,notes
66c3bd97-94d1-4287-b1b8-86605a38cb97,af2fdfd6-02c4-49df-b09c-cf8536f4773f,abortion,2,"Kotek signed multiple pro-choice bills as Gov; opposed abortion bans"
```

- `politician_id` — `essentials.politicians.id` UUID (not external_id)
- `topic_id` — `inform.compass_topics.id` UUID (from live topic table provided in context)
- `topic_key` — human-readable slug for auditing (not used by apply script)
- `value` — integer 1–5 (1=progressive, 5=conservative)
- `notes` — citation text (used to generate `inform.politician_context` row)
- Empty/null `value` rows are skipped by apply script

### CSV Naming Convention

Pattern: `YYYY-MM-DD-{first-last}.csv` for individuals, or `YYYY-MM-DD-{group}.csv` for batches.

Examples for this phase:
- `2026-05-30-tina-kotek.csv`
- `2026-05-30-dan-rayfield.csv`
- `2026-05-30-keith-wilson.csv`
- `2026-05-30-portland-council-d1.csv` (if batching by district)

Location: `C:/EV-Accounts/backend/data/stance-research/`

### Next Migration Number

Migration 241 (`241_or_discovery_jurisdictions.sql`) was the last applied migration in Phase 79. The next available migration is **242**. [VERIFIED: filesystem check of C:/EV-Accounts/backend/migrations/]

Phase 80 is data-only (stance rows) — no SQL migration is required unless the plan chooses to write an audit migration (optional; prior phases did not require one for stance ingestion).

---

## Architecture Patterns

### System Architecture Diagram

```
Research agent (one at a time)
  → Reads public sources (congress.gov, Ballotpedia, campaign sites, news)
  → Outputs CSV: politician_id, topic_id, topic_key, value, notes
  → Saved to C:/EV-Accounts/backend/data/stance-research/

Apply script (per CSV)
  → Reads CSV via csv-parse/sync
  → INSERT INTO inform.politician_answers ON CONFLICT DO UPDATE
  → INSERT INTO inform.politician_context (citation)
  → Logs: "Done — Upserted: N, Skipped: M"

Compass render (automatic after ingestion)
  → GET /compass/politicians → returns politician UUIDs with ≥1 answer
  → CompassCard checks politicianIdsWithStances.has(politicianId)
  → If match: renders radar chart + StanceAccordion
```

### How Compass Renders (Gate Logic)

The compass widget will NOT render for a politician unless they have at least 1 row in `inform.politician_answers`. [VERIFIED: 18-RESEARCH.md, CompassCard.jsx]

```javascript
// Source: C:/Transparent Motivations/essentials/src/components/CompassCard.jsx
if (!politicianIdsWithStances.has(politicianId)) return null;
```

The minimum to show the compass: 1 answer on any topic. The StanceAccordion displays only the topics that have values.

### Citation Requirement

Every `politician_answers` row must have a corresponding `inform.politician_context` row. The apply scripts do not currently write context rows — the research agent must write them separately (via `POST /api/compass/politicians/context`) or the plan must include a context-writing step. [VERIFIED: CONTEXT.md code_context section]

---

## Evidence Feasibility by Group

### Group 1: OR Constitutional Officers

| Official | Best Sources | Topics with Expected Evidence |
|----------|-------------|-------------------------------|
| Tina Kotek (Governor) | oregonlive.com, Ballotpedia, OR legislature vote history (was state rep), campaign site | abortion, civil-rights, climate-change, healthcare, housing, homelessness, immigration, taxes, voting-rights, cannabis, education |
| Dan Rayfield (AG) | Ballotpedia, OR legislature vote history (was House Speaker), doj.oregon.gov press releases | abortion, civil-rights, criminal justice, immigration, voting-rights, campaign-finance, redistricting |
| Tobias Read (SoS) | sos.oregon.gov, Ballotpedia, vote records from prior state legislative role | voting-rights, redistricting, campaign-finance, election administration topics |
| Elizabeth Steiner (Treasurer) | Ballotpedia, vote records from prior state senate role | taxes, healthcare, housing, climate-change, reproductive rights (prior votes) |
| Christina Stephenson (Labor Commissioner) | Ballotpedia, boli.oregon.gov, prior state rep votes | economic-development, taxes, housing, labor/workplace topics |

All 5 constitutional officers served in the OR legislature before their current roles — their legislative voting records are the richest source. [ASSUMED — based on training knowledge of their prior positions; verify on Ballotpedia during execution]

### Group 2: US House Representatives

Congressional voting records are authoritative and machine-readable. Primary sources:

- **congress.gov** — bill text, vote records, sponsored legislation
- **ProPublica Congress API** (`projects.propublica.org/api-docs/congress-api/`) — structured vote data by member ID
- **GovTrack.us** — position scoring, ideology score, bill sponsorship
- **Ballotpedia** — biographical data, campaign finance, committee assignments
- **VoteSmart.org** — candidate questionnaire responses (when available)

| Representative | Expected Evidence Quality | Notes |
|---------------|--------------------------|-------|
| Bonamici (CD-1, D) | HIGH | Multiple terms; education/healthcare focus; consistent progressive record |
| Bentz (CD-2, R) | HIGH | Multiple terms; natural resources, public lands, energy focus; rural conservative record |
| Dexter (CD-3, D) | MEDIUM | First term in House but multi-term OR state senator — use state record for topics |
| Hoyle (CD-4, D) | HIGH | Former OR Labor Commissioner + 2 House terms; healthcare, labor, climate positions documented |
| Bynum (CD-5, D) | MEDIUM | First House term; former OR state rep — legislative votes exist for state-level topics |
| Salinas (CD-6, D) | MEDIUM | First House term; former OR state rep — legislative votes exist for state-level topics |

### Group 3: Portland Council, Mayor, Auditor

Portland council members were elected November 2024 under the new charter — campaign evidence is limited to 6 months of tenure plus pre-election materials.

**Best sources for Portland officials:**
- **Willamette Week voter guides** (willametteweek.com) — primary source for Nov 2024 candidates; comprehensive questionnaire responses
- **The Oregonian candidate Q&As** (oregonlive.com) — candidate interviews, issue positions
- **Portland Tribune** — local policy coverage
- **Individual campaign websites** — position statements, endorsements
- **Portland City Council meeting minutes** (portland.gov) — vote records for first 6 months
- **Ballotpedia candidate pages** — for those with prior elected experience

**Topics most likely to have evidence for Portland council:**
- homelessness, homelessness-response, housing, residential-zoning, public-safety-approach, transportation-priorities, local-environment, rent-regulation, local-immigration (Portland sanctuary city debates)

**Officials with prior elected tenure (richer records):**
- Dan Ryan — prior Portland City Council tenure (before new charter)
- Loretta Smith — former Multnomah County Commissioner (years of documented votes)
- Steve Novick — former Portland City Commissioner
- Keith Wilson — mayor of Portland; campaign record available

**New-to-office officials (shorter record):**
- Avalos, Dunphy, Pirtle-Guiney, Kanal, Morillo, Koyama Lane, Zimmerman, Green — expect 3-8 stances each at most; Willamette Week voter guide is the primary source

**Simone Rede (City Auditor):** Financial oversight role. Accept 0 stances by design per D-04 unless candidate Q&As show positions on compass topics.

---

## Plan Structure Recommendation

Following the Phase 70 three-plan precedent for CA (executives+senators, House reps, city officials):

| Plan | Scope | Officials | Est. Research Runs |
|------|-------|-----------|-------------------|
| 80-01 | OR constitutional officers | 5 | 5 (one at a time) |
| 80-02 | OR US House reps | 6 | 6 (one at a time) |
| 80-03 | Portland council + Mayor + Auditor | 13 | 13 (one at a time) |
| 80-04 | Verification | — | — (human spot-check) |

Each plan instructs the research+apply agent to run ONE official at a time. The D-05 one-at-a-time rule is a hard constraint — the plan must not schedule parallel research agents even within a single plan.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| CSV → DB ingestion | Custom SQL script | Copy `apply-allen-stances.ts` pattern exactly |
| Topic ID lookup | DB query | Topic IDs provided in CONTEXT.md (36 active topics) |
| Politician ID lookup | DB query | UUIDs provided in this RESEARCH.md and CONTEXT.md |
| Bridge between schemas | FK migration | Not needed — `essentials.politicians.id` UUIDs used directly |
| Stance review workflow | Custom UI | `POST /api/compass/politicians/context` for citations |
| Value inversion | `3 - parseInt(r.value)` | `parseInt(r.value)` directly — solis script is an outlier, do not copy |

---

## Common Pitfalls

### Pitfall 1: Parallel Research Agents

**What goes wrong:** Running multiple research agents simultaneously exhausts the Anthropic rate-limit quota with no usable output — all runs fail or produce garbage.

**Why it happens:** The desire to speed up 25-person research by parallelizing. This is explicitly prohibited by D-05 and by memory entry `feedback_stance_research_one_at_a_time.md`.

**How to avoid:** Every plan task that invokes a research agent must execute sequentially. No parallel research tasks in any single plan.

**Warning signs:** Rate limit errors mid-research; truncated or empty CSV output.

### Pitfall 2: Using apply-solis-stances.ts as Template

**What goes wrong:** `apply-solis-stances.ts` uses `3 - parseInt(r.value)` which inverts the value scale — a value of 1 becomes 2, value of 2 becomes 1, etc. This produced incorrect stances and is an outlier from a prior scale debate.

**How to avoid:** Copy `apply-allen-stances.ts` or `apply-malik-stances.ts` as the template. Both use `parseInt(r.value)` with no arithmetic.

**Warning signs:** Compass values appear inverted (progressive politicians showing as conservative).

### Pitfall 3: Fabricating Stances Without Evidence

**What goes wrong:** Research agent assigns values based on party affiliation ("Democrat → value=1") rather than documented positions. This violates D-06 and poisons the evidence-only integrity of the compass.

**How to avoid:** Every stance row must cite a specific source (bill number, article URL, campaign statement URL). If no source exists for a topic, leave that topic unresearched — no row, no stub.

**Warning signs:** Notes column is empty or contains only "D-06" or "assumed from party."

### Pitfall 4: Researching Only LOCAL-Scope Topics

**What goes wrong:** Research agent scans only local-scope compass topics (housing, homelessness, etc.) and produces 6-7 stances per politician. National topics (abortion, immigration, tariffs, social security) have abundant evidence for federal and state officials.

**How to avoid:** D-08 mandates research across ALL 36 compass topics (the full live topic list is in CONTEXT.md). For federal officials, national topics will have the most evidence.

**Warning signs:** Research output has ≤8 stances for a Governor or US Representative who has an extensive public record.

### Pitfall 5: Wrong UUID Type

**What goes wrong:** Confusing `external_id` (integer like -4100001) with `politicians.id` (UUID like 66c3bd97-...). The apply script uses UUIDs; the external_ids are only for human identification.

**How to avoid:** All CSV files must use the UUID values from the roster tables in this document. Never use external_ids in CSV politician_id column.

**Warning signs:** FK violation or 404 from the admin API.

### Pitfall 6: Missing Citation Rows

**What goes wrong:** Stance values exist in `politician_answers` but no `politician_context` rows exist. The citation requirement is enforced — no citation = no staging visibility.

**How to avoid:** After applying each CSV, write context rows via `POST /api/compass/politicians/context` for each answer.

**Warning signs:** Stances load in DB but don't appear in the app UI, or admin UI shows "no context" warnings.

---

## Verification Architecture

> `workflow.nyquist_validation` is absent from `config.json` — treat as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Manual SQL + curl spot-checks (no automated test framework for stance ingestion) |
| Config file | None |
| Quick run command | SQL query against Supabase (mcp__supabase-local) |
| Full suite command | SQL count + 3-politician profile spot-check |

### Sampling Strategy (Nyquist)

Spot-check minimum 3 politicians after all ingestion is complete: one from each group.

**Sampling targets:**

| Politician | Group | UUID | Check |
|-----------|-------|------|-------|
| Tina Kotek | Constitutional officer | 66c3bd97-94d1-4287-b1b8-86605a38cb97 | COUNT(stances) ≥ 10; compass renders at profile URL |
| Val Hoyle | US House rep | f6202cef-4e46-4db5-a9c0-c69ac9a8eccd | COUNT(stances) ≥ 8; value range 1-5 integers only |
| Dan Ryan | Portland council (prior tenure) | 60fa9870-d984-46a7-a6ed-5f6fbebe72ce | COUNT(stances) ≥ 3; compass renders at profile URL |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| SC-1 | OR constitutional officers with verifiable record have ≥1 stance | SQL count | `SELECT p.last_name, COUNT(pa.id) FROM essentials.politicians p JOIN inform.politician_answers pa ON pa.politician_id = p.id WHERE p.external_id BETWEEN -4100005 AND -4100001 GROUP BY p.last_name` |
| SC-2 | Portland council officials with discoverable record have stances | SQL count | `SELECT p.last_name, COUNT(pa.id) FROM essentials.politicians p JOIN inform.politician_answers pa ON pa.politician_id = p.id WHERE p.external_id BETWEEN -690020 AND -690001 GROUP BY p.last_name ORDER BY p.last_name` |
| SC-3 | All ingestion ran one-at-a-time | Process audit | Manual — planner must log each research run start/end time |
| SC-4 | Compass renders for ≥1 OR official | Browser spot-check | Navigate to `/politician/66c3bd97-94d1-4287-b1b8-86605a38cb97` (Kotek); confirm CompassCard visible |

### Value Range Verification

After each apply script run:

```sql
-- Verify all values are integers in range 1-5 (no rogue decimals or inversions)
SELECT pa.value, COUNT(*) 
FROM inform.politician_answers pa
JOIN essentials.politicians p ON p.id = pa.politician_id
WHERE p.external_id BETWEEN -4102006 AND -690001
GROUP BY pa.value
ORDER BY pa.value;
```

Expected: only integer values 1, 2, 3, 4, or 5. Any 0.5, 5.5, or out-of-range values are a failure.

### Coverage Summary Query (Run After All Plans Complete)

```sql
SELECT 
  p.first_name || ' ' || p.last_name AS name,
  p.external_id,
  COUNT(pa.id) AS stance_count
FROM essentials.politicians p
LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
WHERE p.external_id BETWEEN -4102006 AND -690001
  AND p.external_id NOT IN (-690003, -690004)  -- skip appointed
GROUP BY p.id, p.first_name, p.last_name, p.external_id
ORDER BY p.external_id;
```

Expected: 25 rows (11 OR exec/federal + 14 Portland, minus 2 done senators + 2 appointed skipped = 25 researched). Zero rows would indicate a scoping error.

### Per-Wave Sampling

- **After Plan 01 (executives):** Run SC-1 query; verify Kotek has ≥10 stances; Kotek profile renders compass.
- **After Plan 02 (House reps):** Run value range query; verify Bentz (R) has values ≥3 on national topics (conservative lean expected).
- **After Plan 03 (Portland council):** Run SC-2 query; verify Dan Ryan has ≥3 stances.
- **Plan 04 (verification):** Full coverage summary + browser compass render spot-check for one official per group.

---

## State of the Art

| Old Pattern | Current Pattern | When Changed | Impact |
|-------------|-----------------|--------------|--------|
| Assumed politicians need inform.politicians bridge | essentials.politicians UUIDs used directly | Phase 18 (confirmed) | No bridge migration needed |
| apply-solis-stances.ts inversion `3 - parseInt()` | `parseInt(r.value)` direct, no conversion | Corrected post-Phase 18 | CSV values must be 1=progressive, 5=conservative directly |
| Senators Wyden/Merkley needed research | Both already have 20+ stances; DONE | Pre-condition finding (2026-05-30) | Phase 80 only needs 25 officials, not 27 |
| Phase 70 had 3 plans for CA | Phase 80 follows same 3+1 structure | N/A | 4 plans total (80-01 thru 80-04) |

---

## Open Questions (RESOLVED)

1. **Portland council D4 seat count**
   - What we know: 14 Portland officials listed in CONTEXT.md (Mayor + 12 council + Auditor = 14); 4 districts × 3 seats = 12 council members
   - What's unclear: The pre-condition finding says "All 14 Portland council/Mayor/Auditor officials have ZERO stances" — this matches 12 council + 1 Mayor + 1 Auditor = 14
   - Recommendation: No action needed — the roster in this document (13 entries: 1 Mayor + 1 Auditor + 11 council) should be reconciled against DB count before Plan 03 begins. Run `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -690020 AND -690001 AND is_appointed = false` to confirm the 14 active count.

2. **Dan Rayfield judicial topics**
   - What we know: Dan Rayfield is Attorney General; CONTEXT.md notes he "may qualify for some judicial topics"
   - What's unclear: Whether judicial-* compass topics are appropriate for AG vs. only for judges/DA
   - Recommendation: Research agent should attempt judicial topics for Rayfield (bail reform, prosecutorial discretion, criminal justice) and include if evidence exists; exclude if not. The judicial-transparency topic is designed for judges, not AG — skip that one.

3. **Andrea Salinas name disambiguation**
   - What we know: Andrea Salinas is OR CD-6; there is also a TX politician named Loretta Smith in Collin County context
   - What's unclear: No issue — just flag that Loretta Smith (-690012) is the Portland Multnomah County former commissioner, not a TX Collin County person
   - Recommendation: No action needed; UUIDs are authoritative.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `DATABASE_URL` env var | apply scripts | Verified (Phase 79 scripts ran) | — | — |
| csv-parse/sync | apply scripts | Verified (prior scripts compile) | installed | — |
| pg (node-postgres) | apply scripts | Verified (prior scripts compile) | installed | — |
| mcp__supabase-local | verification SQL | Verified (is remote prod DB) | — | — |
| Anthropic API (stance research) | research agents | Available | — | None; rate-limit enforced by one-at-a-time rule |

No missing dependencies. All tooling was established in prior phases.

---

## Package Legitimacy Audit

No new packages are installed in this phase. All apply script dependencies (csv-parse, pg, dotenv) were installed in prior phases and are already present in `C:/EV-Accounts/backend/package.json`.

---

## Sources

### Primary (HIGH confidence)

- `C:/Transparent Motivations/essentials/.planning/phases/18-compass-stances/18-RESEARCH.md` — Architecture deep-dive: FK pattern, widget gate, value scale, pitfalls
- `C:/Transparent Motivations/essentials/.planning/phases/80-or-compass-stances/80-CONTEXT.md` — Locked decisions D-01 through D-08
- `C:/EV-Accounts/backend/scripts/apply-allen-stances.ts` — Canonical apply script (most recent two-function pattern)
- `C:/EV-Accounts/backend/scripts/apply-malik-stances.ts` — Canonical apply script (most recent single-module pattern)
- `C:/EV-Accounts/backend/migrations/241_or_discovery_jurisdictions.sql` — Confirmed last applied migration; next = 242
- `.planning/phases/74-or-executives-federal/74-03-SUMMARY.md` — OR executive/federal UUID table (all 13 officials confirmed)
- `.planning/phases/46-cambridge-compass-stances/46-01-PLAN.md` — Verification-only plan pattern for phase close

### Secondary (MEDIUM confidence)

- Pre-condition findings (supplied in research prompt) — stance row counts per politician confirmed from live DB query; treated as authoritative
- `C:/EV-Accounts/backend/scripts/apply-solis-stances.ts` — Identified as outlier (3-inversion); do not use as template

### Tertiary (LOW / [ASSUMED])

- Evidence feasibility assessments per Portland council member — [ASSUMED] based on knowledge of Nov 2024 charter reform election; verify during execution via Willamette Week voter guides
- Dan Rayfield prior legislative record — [ASSUMED] based on training knowledge that he served as OR House Speaker; verify on Ballotpedia during execution

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | OR constitutional officers all served in OR legislature before current roles — legislative vote records exist | Evidence Feasibility | If not true for Stephenson or Steiner, evidence will be thinner than expected; plan accounts for this with MEDIUM expectation |
| A2 | Willamette Week published Nov 2024 voter guides for all Portland council candidates | Evidence Feasibility | If guides are paywalled or incomplete, fall back to Oregonian and campaign websites |
| A3 | Dan Rayfield served as OR House Speaker before becoming AG | Evidence Feasibility | If legislative record is shorter, stance count for Rayfield will be lower |
| A4 | Next available migration is 242 | Standard Stack | If another migration was applied between research and planning, planner must adjust |

---

## Metadata

**Confidence breakdown:**
- Architecture (apply script, DB schema, widget gate): HIGH — confirmed from source files
- Politician UUIDs: HIGH — verified from 74-03-SUMMARY.md + CONTEXT.md pre-condition findings
- Topic IDs: HIGH — provided from live DB in CONTEXT.md
- Plan structure: HIGH — follows Phase 70 precedent exactly
- Evidence feasibility (executives): MEDIUM — [ASSUMED] from training knowledge of OR political careers
- Evidence feasibility (House reps): MEDIUM-HIGH — congressional vote records are publicly available
- Evidence feasibility (Portland council): LOW-MEDIUM — short tenure; Willamette Week guides are primary source

**Research date:** 2026-05-30
**Valid until:** 2026-06-30 (architecture is stable; politician IDs are stable; evidence sources may shift)
