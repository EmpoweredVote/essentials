# Phase 167: NV 2026 Elections & Discovery - Research

**Researched:** 2026-06-29
**Domain:** Elections/races data seeding + candidate discovery pipeline arming
**Confidence:** HIGH

## Summary

Phase 167 is a pure backend/data phase: seed one `elections` row, seed ~59 `races` rows
(6 statewide exec + 11 Senate + 42 Assembly + 4 US House), seed one `discovery_jurisdictions`
row for the Nov 3 general, and execute one real discovery test run that completes without error.
No new frontend. No new offices, chambers, or politicians — all FK targets already exist from
Phases 159–160.

The single most important factual deliverable — which 11 NV Senate districts are up in 2026 —
is now fully resolved from the official Nevada Legislature roster. The discovery trigger
mechanism is a live HTTP endpoint (`POST /discover/jurisdiction/:id` with `X-Admin-Token`),
not a script. A discovery run writes a `discovery_runs` row with `status='completed'` as its
completion proof. The NVSoS website returns HTTP 403 to automated fetches, so the discovery
`source_url` should use the Ballotpedia 2026-NV-elections page (VA precedent) with
`nvsos.gov` in `allowed_domains`.

**Primary recommendation:** Follow migration 1109 for elections+races (no schema_migrations
ledger row, `NOT EXISTS` guards, `BEGIN/COMMIT`, ILIKE casing); follow migration 281/325 for
discovery row (ON CONFLICT, post-verify DO block). Plan split: 01 elections row → 02 races
rows → 03 discovery row + test run.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 Statewide office scope:** All 6 statewide constitutional executives (Gov, Lt Gov, AG,
SoS, Treasurer, Controller) get race rows. "Governor" in ROADMAP = shorthand for full slate.

**D-02 Primary handling:** General Election only. Seed `NV 2026 Statewide General` (Nov 3,
2026). No primary row (June 9 primary already past).

**D-03 Discovery test run:** After seeding the `discovery_jurisdictions` row, execute ONE
real discovery run. Acceptance bar: run COMPLETES without error. Candidate count may be zero.
How the runner is invoked is open for research/planning.

**D-04 Discovery source:** `source_url` = NVSoS canonical if parseable; fall back to
Ballotpedia 2026-NV-elections page. `allowed_domains` includes `ballotpedia.org` as secondary.

**D-05 No `cron_active` column:** `discovery_jurisdictions` has no such column; eligibility
is date-based (180-day window). Nov 3 2026 is ~127 days out — inside the window.

**D-06 3-plan shape:** (01) elections row → (02) races rows → (03) discovery + test run.

**D-07 Race rows anchor on office, not incumbent.** Idempotency via `NOT EXISTS` on
`(election_id, office_id)`. No `ON CONFLICT` (no DB unique constraint).

**D-08 Migration mechanics:** `C:/EV-Accounts/backend/migrations/`. Next = **1111**.
1109+1110 taken by parallel v2.20. `BEGIN;/COMMIT;`. Paired `_apply-migration-NNN.ts`
smoke-test. Recent 2026 election migrations (1109) do NOT write schema_migrations ledger —
confirm and recommend explicitly.

**D-09 Live schema reconciliation (supersedes VA/MD specifics):**
- `essentials.elections`: `id, name, election_date (date), election_type, jurisdiction_level
  NOT NULL, state (char nullable), description`. Name = `NV 2026 Statewide General`.
- `essentials.races`: `id, election_id NOT NULL, office_id nullable, position_name NOT NULL,
  primary_party nullable, seats NOT NULL int, description`. No `geo_id` column.
  `primary_party` = NULL (antipartisan). `seats` = 1 per race.
- `essentials.discovery_jurisdictions`: `jurisdiction_geoid, jurisdiction_name, state,
  election_date, source_url, allowed_domains[]`. No `cron_active` column.
- **Mixed-casing trap:** `districts.state` has both `'nv'` and `'NV'` — use `ILIKE 'nv'`.

### Claude's Discretion
- Exact zero-padding/position_name strings for state-legislative races (follow MD `280`
  legislative pattern; e.g. `Nevada Assembly District 01` … `42`,
  `Nevada State Senate District NN`).
- Whether statewide + legislative + federal races land in one migration or split across Plan-02
  migration set — planner's call, kept idempotent either way.

### Deferred Ideas (OUT OF SCOPE)
- Surfacing NV jurisdictions on `coverage.js` / Landing wiring → Phase 168.
- Seeding actual 2026 candidate rows / headshots / stances → discovery downstream.
- Any 2026 primary archival rows → intentionally dropped.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NV-ELEC-01 | NV 2026 elections seeded (Governor, all 42 Assembly seats, the ~10 Senate seats up, 4 US House races) + discovery pipeline armed (`discovery_jurisdictions` rows, cron active). NV's two US Senators are not up in 2026. | Senate districts resolved (11 confirmed, see below). All FK targets verified live. Discovery trigger mechanism identified. source_url fallback decided. |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Elections row seed | Database / Storage | — | Pure SQL data, no API change |
| Race rows seed | Database / Storage | — | FK resolution via SQL subqueries |
| Discovery jurisdiction row | Database / Storage | — | Config row consumed by backend cron |
| Discovery test run | API / Backend | — | HTTP endpoint trigger on live Render service; uses Anthropic web_search internally |
| `/elections` page display | Frontend Server (SSR) | API / Backend | Frontend reads races via API; no change needed this phase — data drives display |

---

## CRITICAL FACTUAL DELIVERABLE: NV Senate Districts Up in 2026

**Source:** `https://www.leg.state.nv.us/App/Legislator/A/senate/current` — official Nevada
Legislature roster, queried 2026-06-29. [VERIFIED: official Nevada Legislature website]

**11 districts with terms expiring 2026 (on the Nov 3 general ballot):**

| District | Incumbent | Term Ends |
|----------|-----------|-----------|
| 2 | Edgar Flores | 2026 |
| 8 | Marilyn Dondero Loop | 2026 |
| 9 | Melanie Scheible | 2026 |
| 10 | Fabian Doñate | 2026 |
| 12 | Julie Pazina | 2026 |
| 13 | Skip Daly | 2026 |
| 14 | Ira Hansen | 2026 |
| 16 | Lisa Krasner | 2026 |
| 17 | Robin L. Titus | 2026 |
| 20 | Jeff Stone | 2026 |
| 21 | James Ohrenschall | 2026 |

**Not up in 2026 (confirmed 2028 terms):** Districts 1, 3, 4, 5, 6, 7, 11, 15, 18, 19.

**Important disambiguation:** District 15 = Angela D. Taylor (term expires 2028, NOT 2026).
District 16 = Lisa Krasner (term expires 2026). Earlier web results naming D15 or D17 instead
of D16 in the "11 up" list were wrong; the official legislature roster is authoritative.

Cross-reference: The June 9 2026 primary results page (nvsos.gov) showed contested primaries
in Districts 2, 8, 16, and 21. District 16 appearing in primaries confirms it is up in 2026
(a data point that directly contradicts any "District 15 instead of 16" reading). [VERIFIED:
NVSoS 2026 primary results]

**Race count summary:**
- 6 statewide execs (STATE_EXEC)
- 11 State Senate districts (STATE_UPPER)
- 42 Assembly districts (STATE_LOWER)
- 4 US House districts (NATIONAL_LOWER)
- **Total: 63 race rows** for migration 1112 (races).

---

## Standard Stack

### Core (no new packages — all existing)
| Component | Location | Purpose |
|-----------|----------|---------|
| psql | CLI | Apply `*.sql` migrations via `psql -f` |
| tsx | `node_modules/tsx/dist/cli.mjs` | Run `_apply-migration-NNN.ts` smoke scripts |
| pg Pool | Backend runtime | Discovery service DB access |
| Anthropic SDK | Backend runtime | Claude web_search in discovery agent |

No new npm packages required this phase. All infrastructure already deployed.

**Migration counter:** Next free = **1111**. Plan:
- 1111 — elections row (structural → ledger or not? see below)
- 1112 — races rows (structural → ledger or not? see below)
- 1113 — discovery jurisdiction row + test run (structural → ledger or not? see below)

---

## Package Legitimacy Audit

> No new external packages are installed this phase. All tooling is pre-existing.

Not applicable.

---

## Architecture Patterns

### System Architecture Diagram

```
Operator (psql / tsx)
  │
  ├─► Migration 1111: INSERT essentials.elections (NV 2026 Statewide General)
  │
  ├─► Migration 1112: INSERT essentials.races (63 rows)
  │     ├─ 6 STATE_EXEC races → offices via districts.geo_id + district_type='STATE_EXEC'
  │     │    ILIKE 'nv' casing guard
  │     ├─ 11 STATE_UPPER races → offices via district_type='STATE_UPPER', ILIKE 'nv'
  │     ├─ 42 STATE_LOWER races → offices via district_type='STATE_LOWER', ILIKE 'nv'
  │     └─ 4 NATIONAL_LOWER races → offices via district geo_ids 3201..3204
  │
  ├─► Migration 1113: INSERT essentials.discovery_jurisdictions (1 row, state='NV')
  │
  └─► Discovery test run
        Operator: curl POST /discover/jurisdiction/:uuid X-Admin-Token: $ADMIN_INGEST_TOKEN
        → essentialsDiscovery router → runDiscoveryForJurisdiction()
        → INSERT discovery_runs (status='running')
        → runDiscoveryAgent() — Anthropic claude-sonnet-4-6 + web_search
        → UPDATE discovery_runs (status='completed')
        → Completion evidence: SELECT status FROM essentials.discovery_runs WHERE id = $run_id
```

### Recommended Migration File Structure
```
C:/EV-Accounts/backend/
├── migrations/
│   ├── 1111_nv_2026_general_election.sql          # elections row
│   ├── 1112_nv_2026_races.sql                      # 63 race rows
│   └── 1113_nv_2026_discovery.sql                  # discovery_jurisdictions row
└── scripts/
    ├── _apply-migration-1111.ts                    # smoke test
    ├── _apply-migration-1112.ts                    # smoke test
    └── _apply-migration-1113.ts                    # smoke test
```

### Pattern 1: Elections Row (mirrors migration 1109)
```sql
-- Source: C:/EV-Accounts/backend/migrations/1109_seed_tx_ny_2026_house_elections_races.sql
BEGIN;

INSERT INTO essentials.elections (id, name, election_date, election_type, jurisdiction_level, state)
SELECT gen_random_uuid(), 'NV 2026 Statewide General', '2026-11-03T08:00:00.000Z'::timestamptz,
       'general', 'state', 'NV'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.elections WHERE name = 'NV 2026 Statewide General'
);

-- Post-verify
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM essentials.elections WHERE name = 'NV 2026 Statewide General';
  IF n <> 1 THEN RAISE EXCEPTION 'Expected 1 NV election, found %', n; END IF;
END $$;

COMMIT;
```

### Pattern 2: Races Rows — ILIKE + NOT EXISTS (supersedes MD ON CONFLICT)
```sql
-- Source: D-09 + migration 1109 NOT EXISTS guard pattern
-- Key: NO ON CONFLICT (no DB unique constraint per D-07)
-- Key: ILIKE 'nv' for districts.state (mixed-casing trap D-09)
-- Key: Resolve office_id via districts.geo_id joined to offices

INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
SELECT gen_random_uuid(), el.id, o.id, 'Nevada State Senate District 02', NULL, 1
FROM essentials.elections el
JOIN essentials.districts d ON d.geo_id = '32002' AND d.district_type = 'STATE_UPPER'
  AND d.state ILIKE 'nv'
JOIN essentials.offices o ON o.district_id = d.id
WHERE el.name = 'NV 2026 Statewide General'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.races r
    WHERE r.election_id = el.id AND r.office_id = o.id
  );
```

### Pattern 3: Discovery Row (mirrors migrations 281 + 325)
```sql
-- Source: C:/EV-Accounts/backend/migrations/325_va_2026_discovery.sql
-- jurisdiction_geoid = '32' (Nevada FIPS state code, 2-digit bare, matching MD='24' / VA='51')
-- ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING (this constraint EXISTS on discovery_jurisdictions)

INSERT INTO essentials.discovery_jurisdictions
  (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  ('32', 'State of Nevada', 'NV', '2026-11-03',
   'https://ballotpedia.org/Nevada_elections,_2026',
   ARRAY['ballotpedia.org', 'nvsos.gov', 'nevada.gov', 'leg.state.nv.us'])
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;
```

### Anti-Patterns to Avoid

- **Using `ON CONFLICT` for races:** No unique constraint on `(election_id, office_id)` — use
  `NOT EXISTS` guards (D-07). MD migration 280 used `ON CONFLICT` against
  `(election_id, position_name)` partial index; that pattern is stale for races.
- **Exact-case `d.state = 'nv'`:** Districts table has mixed `'nv'` and `'NV'` — always use
  `ILIKE 'nv'` (D-09 mixed-casing trap).
- **`ON CONFLICT` for elections:** Use `NOT EXISTS` per migration 1109, not `ON CONFLICT`.
- **Hardcoding a state senate office_id:** Resolve via `districts.geo_id` subquery at
  migration time; don't bake in UUIDs that could rotate.
- **Seeding a primary election row:** June 9 2026 primary is past. General only (D-02).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Candidate discovery | Custom scraper/parser | `runDiscoveryForJurisdiction()` (discoveryService.ts) | Already handles agent loop, staging, withdrawal diff, email |
| Discovery trigger | tsx script | POST endpoint + curl (see below) | Endpoint exists in prod; tsx script would need DB + Anthropic env |
| Race idempotency | Custom upsert logic | NOT EXISTS guard | No unique constraint exists; ON CONFLICT would fail |

---

## Open Research Questions (all resolved below)

### A. NV Senate districts up in 2026 — RESOLVED
**Answer:** Districts 2, 8, 9, 10, 12, 13, 14, 16, 17, 20, 21 (11 districts).
Source: `leg.state.nv.us/App/Legislator/A/senate/current` [VERIFIED]

### B. Statewide execs all up in 2026 — CONFIRMED
All 6 NV constitutional officers (Governor, Lt. Governor, AG, Secretary of State, Treasurer,
Controller) are 4-year offices elected in NV midterm cycles (2022 last, 2026 next).
All 6 have active incumbent offices from Phase 159.
Gov Lombardo (Republican, elected 2022), Lt Gov Stavros Anthony, AG Aaron Ford, SoS Cisco
Aguilar, Treasurer Zach Conine, Controller Andy Matthews (-3200006). [ASSUMED: election-year
confirmation; all 6 are standard NV constitutional offices up on the same 4-year midterm cycle]

### C. Discovery runner mechanism — RESOLVED
**Trigger:** `POST /discover/jurisdiction/:id` via HTTP to the live Render-deployed backend.
Auth: `X-Admin-Token: $ADMIN_INGEST_TOKEN` (env var in C:/EV-Accounts/backend/.env).
Mounted at `/api/admin/discover/jurisdiction/:id` in essentialsDiscovery router.
[VERIFIED: src/routes/essentialsDiscovery.ts line 46]

**Exact curl command to trigger:**
```bash
# Step 1: Get the discovery_jurisdictions UUID after seeding migration 1113
# (query via mcp__supabase-local or psql)
DISC_ID=$(psql $DATABASE_URL -At -c \
  "SELECT id FROM essentials.discovery_jurisdictions WHERE state='NV' AND election_date='2026-11-03'")

# Step 2: Trigger the discovery run
curl -s -X POST \
  "https://accounts-api.onrender.com/api/admin/discover/jurisdiction/$DISC_ID" \
  -H "X-Admin-Token: $ADMIN_INGEST_TOKEN" \
  -H "Content-Type: application/json"
# Expected response: {"status":"accepted","jurisdictionId":"<uuid>"}  (HTTP 202)
```

**Completion evidence (poll after ~60 seconds):**
```sql
SELECT id, status, candidates_found, error_message
FROM essentials.discovery_runs
WHERE discovery_jurisdiction_id = '<disc_uuid>'
ORDER BY started_at DESC LIMIT 1;
-- Acceptance: status = 'completed' (candidates_found may be 0)
```

**What "completes" means:** `discovery_runs.status = 'completed'`. The run:
1. INSERTs a `discovery_runs` row (`status='running'`)
2. Calls `runDiscoveryAgent()` — Claude web_search on Anthropic (may take 30-90s)
3. Stages any discovered candidates in `candidate_staging`
4. UPDATEs `discovery_runs` to `status='completed'`

If error: `status='failed'` with `error_message` set. [VERIFIED: discoveryService.ts lines 357-664]

**Alternative JWT trigger** (discoveryDashboard.ts): `POST /api/admin/discovery/trigger/:id`
with Bearer JWT. Both routes call the same `runDiscoveryForJurisdiction()`. The admin-token
route is simpler for executor invocation.

### D. Discovery source URL — RESOLVED
**Primary concern:** `nvsos.gov` returns HTTP 403 to automated web fetches (confirmed in
research: WebFetch returned 403 Forbidden on every nvsos.gov URL attempted). The discovery
pre-fetch step (`fetchPageContent()` in discoveryService) will silently fall back to web_search
when pre-fetch fails, so nvsos.gov as `source_url` is viable but suboptimal (wastes a fetch
attempt before falling back).

**Recommendation:** Use the Ballotpedia NV elections page as `source_url` (VA precedent —
migration 325 used Ballotpedia for VA). This is a web page the discovery agent can read.

```
source_url: 'https://ballotpedia.org/Nevada_elections,_2026'
allowed_domains: ARRAY['ballotpedia.org', 'nvsos.gov', 'nevada.gov', 'leg.state.nv.us']
```

`nvsos.gov` stays in `allowed_domains` so that any citation URL the agent finds there
counts as `confidence='official'` (higher than `'matched'` or `'uncertain'`).

**jurisdiction_geoid:** `'32'` — Nevada state FIPS code, 2-digit bare string. Pattern
confirmed: MD='24', VA='51' both use 2-digit FIPS. [VERIFIED: migration 281, migration 325]

**jurisdiction_name:** `'State of Nevada'`

### E. US Senate correctly absent — CONFIRMED
Catherine Cortez Masto (D): elected 2022, next up 2028. Jacky Rosen (D): elected 2024,
next up 2030. Neither senator is up in 2026. No US Senate race row. [VERIFIED: CONTEXT.md,
REQUIREMENTS.md NV-ELEC-01, FEC.gov search result shows 2026 US Senate NV = empty]

### F. Schema_migrations ledger — RESOLVED with explicit recommendation
**Observation:** Migration 1109 (today's TX/NY House races, the current canonical prior-art)
does NOT write to `supabase_migrations.schema_migrations`. Migrations 281 (MD discovery) and
325 (VA discovery) both DO write to the ledger.

**Pattern reconciled:** The 2026-election-era migrations authored by the v2.20 parallel effort
(1109, 1110) omit the ledger INSERT. The earlier state-seeding migrations (280s, 320s) include
it. Both conventions coexist in the codebase.

**Explicit recommendation for this phase:** Do NOT write a `schema_migrations` ledger row for
any of migrations 1111/1112/1113. Rationale: (a) D-08 explicitly notes recent 2026 election
migrations don't ledger; (b) migration 1109 is the designated canonical prior-art (D-09);
(c) the on-disk counter is authoritative anyway; (d) adding a ledger row to a discovery
migration breaks the "audit-only" / structural distinction used across this codebase.
[ASSUMED: this is a recommendation, not a live-verified policy; operator can override]

---

## Position_name Strings (Copy-Ready)

Derived from migration 1109 pattern for US House, MD migration 280 for legislative, and
NV office title conventions. [ASSUMED: exact wording — follow this unless office titles
in DB suggest otherwise; verify with `SELECT title FROM essentials.offices JOIN ...`]

| Race tier | position_name format | Example |
|-----------|---------------------|---------|
| Statewide exec | `{title} of Nevada` | `Governor of Nevada` |
| US House | `U.S. Representative District {N}` | `U.S. Representative District 1` |
| State Senate | `Nevada State Senate District {NN}` | `Nevada State Senate District 02` |
| State Assembly | `Nevada State Assembly District {NN}` | `Nevada State Assembly District 01` |

**Zero-padding:** Use 2-digit zero-padded district numbers for Senate and Assembly
(e.g. `02`, `09`, `10`, `42`). US House uses no padding (1-digit). Statewide execs have
no district number.

**Statewide exec position_names (all 6):**
1. `Governor of Nevada`
2. `Lieutenant Governor of Nevada`
3. `Attorney General of Nevada`
4. `Secretary of State of Nevada`
5. `State Treasurer of Nevada`
6. `State Controller of Nevada`

The executor must verify these against `SELECT o.title FROM essentials.offices o JOIN
essentials.districts d ON d.id=o.district_id WHERE d.state ILIKE 'nv' AND
d.district_type='STATE_EXEC'` to ensure position_name wording is consistent with office
titles already in the DB.

---

## Common Pitfalls

### Pitfall 1: Mixed-casing on `districts.state`
**What goes wrong:** `WHERE d.state = 'nv'` returns 0 rows for offices seeded with `'NV'`
(or vice versa), causing races to be inserted with `office_id = NULL`.
**Why it happens:** NV district rows were seeded with lowercase `state='nv'` (Phase 160
pattern for SLDU/SLDL), but some may use uppercase from earlier seeds.
**How to avoid:** Always `WHERE d.state ILIKE 'nv'` in all race-seeding subqueries.
**Warning signs:** `n_nulloff <> 0` in the post-verify DO $$ block.

### Pitfall 2: Using `ON CONFLICT` for races
**What goes wrong:** Migration fails with `ERROR: there is no unique constraint matching
the ON CONFLICT specification`.
**Why it happens:** `essentials.races` has no unique index on `(election_id, office_id)`.
**How to avoid:** Use `NOT EXISTS` guards on `(election_id, office_id)` pair (D-07).
**Warning signs:** Postgres error on first apply.

### Pitfall 3: STATE_EXEC office resolution
**What goes wrong:** Multiple STATE_EXEC offices returned per district (e.g. if old inactive
offices exist), or zero returned (if district FK is wrong).
**Why it happens:** NV statewide officers share a single STATE_EXEC district per office type;
if office table has duplicate rows from migration corrections, the LIMIT 1 subquery hides it.
**How to avoid:** Pre-verify with `SELECT count(*) FROM offices JOIN districts WHERE
district_type='STATE_EXEC' AND state ILIKE 'nv'` — should return exactly 6.
**Warning signs:** Race count != 6 after exec migration.

### Pitfall 4: Discovery run timing — async fire-and-forget
**What goes wrong:** Executor curls the trigger, gets 202, then immediately queries
`discovery_runs` and sees nothing yet (or `status='running'`).
**Why it happens:** `POST /discover/jurisdiction/:id` returns 202 immediately; run is
backgrounded. Claude's web_search takes 30–90 seconds.
**How to avoid:** Wait ~90 seconds after the 202 response before querying `discovery_runs`.
The apply script for migration 1113 can include a polling loop or a manual wait instruction.
**Warning signs:** `discovery_runs` row shows `status='running'` — not yet complete.

### Pitfall 5: NVSoS 403 on pre-fetch
**What goes wrong:** Discovery run logs `pre-fetch failed for nvsos.gov` if nvsos.gov is
used as `source_url`; falls back to web_search (still works, but wastes a fetch attempt).
**Why it happens:** nvsos.gov blocks automated HTTP clients with WAF/Cloudflare.
**How to avoid:** Use Ballotpedia as `source_url` (already recommended above).
**Warning signs:** Log line `[discovery] pre-fetch failed` in Render logs.

### Pitfall 6: Senate District 15 vs 16 confusion
**What goes wrong:** Seeding a race for District 15 instead of District 16.
**Why it happens:** Early web results named "District 15" (Angela Taylor, who has a 2028
term). District 16 (Lisa Krasner, 2026 term) is the correct one.
**How to avoid:** The authoritative list above (from leg.state.nv.us) shows D16, not D15.
The NVSoS primary results confirm D16 had a contested Republican primary.
**Warning signs:** The plan lists 11 senate districts including D15 instead of D16.

---

## Code Examples

### Full election row migration structure (from 1109)
```sql
-- Source: C:/EV-Accounts/backend/migrations/1109_seed_tx_ny_2026_house_elections_races.sql
BEGIN;

INSERT INTO essentials.elections (id, name, election_date, election_type, jurisdiction_level, state)
SELECT gen_random_uuid(), 'NV 2026 Statewide General',
       '2026-11-03T08:00:00.000Z'::timestamptz, 'general', 'state', 'NV'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.elections WHERE name = 'NV 2026 Statewide General'
);

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM essentials.elections WHERE name = 'NV 2026 Statewide General';
  IF n <> 1 THEN RAISE EXCEPTION 'Expected 1 NV election, found %', n; END IF;
  RAISE NOTICE 'OK: NV 2026 Statewide General election row present';
END $$;

COMMIT;
-- NO schema_migrations ledger INSERT (matches 1109 pattern per D-08)
```

### State Senate race row (ILIKE + NOT EXISTS, from D-09 pattern)
```sql
-- Source: D-09 spec + 1109 NOT EXISTS pattern
-- NV SLDU geo_ids are 5-char numeric: district N → geo_id = '32' + zero-pad to 3 → e.g. '32002'
-- Verify NV SLDU geo_id format with:
--   SELECT geo_id FROM essentials.districts WHERE district_type='STATE_UPPER' AND state ILIKE 'nv' LIMIT 5

INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
SELECT gen_random_uuid(), el.id, o.id, 'Nevada State Senate District 02', NULL, 1
FROM essentials.elections el
JOIN essentials.districts d
  ON d.geo_id = '32002'
 AND d.district_type = 'STATE_UPPER'
 AND d.state ILIKE 'nv'
JOIN essentials.offices o ON o.district_id = d.id
WHERE el.name = 'NV 2026 Statewide General'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.races r WHERE r.election_id = el.id AND r.office_id = o.id
  );
```

**IMPORTANT — NV SLDU geo_id format must be verified before writing migration 1112.**
NV TIGER SLDU geo_ids loaded in Phase 158 may use a different format than the 5-char pattern
above. The executor must run:
```sql
SELECT geo_id, label FROM essentials.districts
WHERE district_type = 'STATE_UPPER' AND state ILIKE 'nv'
ORDER BY geo_id;
```
and use the actual geo_id values from the DB, not assumed patterns.

Similarly for STATE_LOWER (Assembly) and NATIONAL_LOWER (US House NV-01..04):
```sql
SELECT geo_id, label FROM essentials.districts
WHERE district_type = 'STATE_LOWER' AND state ILIKE 'nv' ORDER BY geo_id;

SELECT geo_id, label FROM essentials.districts
WHERE district_type = 'NATIONAL_LOWER' AND state ILIKE 'nv' ORDER BY geo_id;
```

### Discovery jurisdiction row
```sql
-- Source: C:/EV-Accounts/backend/migrations/325_va_2026_discovery.sql (adapted)
INSERT INTO essentials.discovery_jurisdictions
  (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  ('32', 'State of Nevada', 'NV', '2026-11-03',
   'https://ballotpedia.org/Nevada_elections,_2026',
   ARRAY['ballotpedia.org', 'nvsos.gov', 'nevada.gov', 'leg.state.nv.us'])
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;
```

### _apply-migration-1113.ts pattern (from _apply-migration-325.ts)
```typescript
// Source: C:/EV-Accounts/backend/scripts/_apply-migration-325.ts (adapted)
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });
const sql = readFileSync(path.join(process.cwd(), 'migrations', '1113_nv_2026_discovery.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('Migration 1113 applied successfully');
  // Smoke test 1: Row count — expect 1
  const r1 = await pool.query(`SELECT COUNT(*) as cnt FROM essentials.discovery_jurisdictions WHERE state='NV'`);
  console.log('NV discovery_jurisdictions rows:', r1.rows[0].cnt, '(expected 1)');
  // Smoke test 2: Election date correct
  const r2 = await pool.query(`SELECT election_date::text FROM essentials.discovery_jurisdictions WHERE state='NV'`);
  console.log('NV election date:', r2.rows[0]?.election_date, '(expected 2026-11-03)');
  // Smoke test 3: allowed_domains
  const r3 = await pool.query(`SELECT array_length(allowed_domains,1) as n FROM essentials.discovery_jurisdictions WHERE state='NV'`);
  console.log('allowed_domains length:', r3.rows[0]?.n, '(expected 4)');
  // NOTE: No ledger smoke test (no ledger insert per recommendation)
} catch (e: any) {
  console.error('Error applying migration 1113:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
```

### Discovery trigger and completion verification
```bash
# Trigger (from backend dir or anywhere with ADMIN_INGEST_TOKEN + DATABASE_URL)
DISC_ID=$(psql $DATABASE_URL -At -c \
  "SELECT id FROM essentials.discovery_jurisdictions WHERE state='NV' AND election_date='2026-11-03'")

curl -s -X POST \
  "https://accounts-api.onrender.com/api/admin/discover/jurisdiction/$DISC_ID" \
  -H "X-Admin-Token: $ADMIN_INGEST_TOKEN" \
  -H "Content-Type: application/json"
# Returns HTTP 202: {"status":"accepted","jurisdictionId":"<uuid>"}

# Wait ~90 seconds for agent to complete, then verify:
psql $DATABASE_URL -c \
  "SELECT id, status, candidates_found, candidates_new, error_message, completed_at
   FROM essentials.discovery_runs
   WHERE discovery_jurisdiction_id = '$DISC_ID'
   ORDER BY started_at DESC LIMIT 1;"
# Acceptance: status = 'completed', error_message = NULL
# candidates_found may be 0 — that is OK per D-03
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| VA/MD ON CONFLICT for races | NOT EXISTS guards (no DB unique constraint) | Migration 1109 (2026-06-29) | Plan must use NOT EXISTS, not ON CONFLICT |
| `cron_active=true` ROADMAP language | Date-based horizon (180-day window) | Migration 281 (MD) | No column to set; eligibility is automatic |
| Primary + general both seeded | General only when primary is past | This phase (D-02) | No primary row; one election row only |
| MD per-district DO $$ DECLARE blocks | Single-file bulk INSERT with VALUES(...) | Migration 1109 | More concise; same idempotency guarantee |
| schema_migrations ledger in election migs | No ledger (on-disk counter authoritative) | Migration 1109 | Match 1109 pattern for this phase |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | All 6 NV statewide exec offices are 4-year offices up in 2026 (same midterm cycle) | Open Questions B | Low — NV constitution sets 4-year terms for all statewide execs; 2022 was last election; 2026 is next. Would require a vacancy/appointment to be wrong. |
| A2 | No ledger INSERT for migrations 1111/1112/1113 | Ledger recommendation | Low — on-disk counter is authoritative either way; ledger is audit convenience. Operator can add INSERT if desired. |
| A3 | `position_name` strings (e.g. "Governor of Nevada", "Nevada State Senate District 02") | Position_name section | Low — executor must verify against DB `offices.title`; strings may need minor tuning |
| A4 | NV SLDU geo_id format `'32NNN'` (5-char) | Code Examples | MEDIUM — executor MUST run the geo_id verification query before writing 1112; if Phase 158 used a different format, the JOIN silently returns 0 rows |
| A5 | Ballotpedia NV elections page is publicly accessible and parseable by the discovery agent | Discovery source | Medium — confirmed it returns content via web searches; the agent may find few candidates since filings are recent and the page may not list all general-election candidates yet (zero candidate count is acceptable per D-03) |
| A6 | `discovery_jurisdictions` ON CONFLICT clause is `(jurisdiction_geoid, election_date)` | Discovery row pattern | HIGH confidence — confirmed from migrations 281 and 325 |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| psql CLI | Apply migrations | ✓ | (project standard) | — |
| tsx | Run apply scripts | ✓ | (node_modules/tsx/dist/cli.mjs) | — |
| Render backend (prod) | Discovery trigger | ✓ | Live on accounts-api.onrender.com | — |
| ADMIN_INGEST_TOKEN env | Discovery trigger auth | ✓ | In C:/EV-Accounts/backend/.env | — |
| Anthropic API (web_search) | Discovery agent | ✓ | Org-wide web search enabled | — |
| supabase-local MCP | DB verification | ✓ | (project standard) | psql direct |

**No missing dependencies.** All required infrastructure is deployed and available.

---

## Validation Architecture

`workflow.nyquist_validation` absent from `.planning/config.json` — treat as enabled.

This phase produces only SQL migrations and HTTP side effects. There are no application code
changes, no test files, and no test framework applies to SQL migrations in this project.
The validation model is:

### Test Framework
| Property | Value |
|----------|-------|
| Framework | No Jest/pytest — SQL migrations use `_apply-migration-NNN.ts` smoke scripts |
| Config file | none |
| Quick run command | `node node_modules/tsx/dist/cli.mjs scripts/_apply-migration-1111.ts` |
| Full suite command | Run all three apply scripts sequentially + discovery run verification |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NV-ELEC-01 | 1 NV election row | smoke | `_apply-migration-1111.ts` DO $$ count check | ❌ Wave 0 |
| NV-ELEC-01 | 63 races (6+11+42+4) | smoke | `_apply-migration-1112.ts` race count assertions | ❌ Wave 0 |
| NV-ELEC-01 | 1 discovery_jurisdictions row | smoke | `_apply-migration-1113.ts` row count + date check | ❌ Wave 0 |
| NV-ELEC-01 | discovery run completes | manual | poll discovery_runs.status after curl trigger | manual-only |

### Sampling Rate
- **Per migration apply:** Run `_apply-migration-NNN.ts` immediately after `psql -f`
- **Phase gate:** All 3 smoke scripts pass + discovery_runs row shows `status='completed'`

### Wave 0 Gaps
- [ ] `scripts/_apply-migration-1111.ts` — covers election row assertions
- [ ] `scripts/_apply-migration-1112.ts` — covers race count assertions (expected: 6+11+42+4=63)
- [ ] `scripts/_apply-migration-1113.ts` — covers discovery_jurisdictions row assertions

*(No existing test infrastructure covers elections/races/discovery for NV)*

---

## Security Domain

> This phase makes no auth, session, or input validation changes. All writes are operator-
> executed SQL migrations against the production DB. The only external-facing component is
> the existing discovery trigger endpoint (already deployed and gated by X-Admin-Token).

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | No | — (SQL is parameterized; no user input) |
| V6 Cryptography | No | — |

The discovery trigger endpoint (`POST /discover/jurisdiction/:id`) is already gated by
`requireAdminToken` (X-Admin-Token == ADMIN_INGEST_TOKEN env var). No new security surface
is introduced by this phase.

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/migrations/1109_seed_tx_ny_2026_house_elections_races.sql` — authoritative elections+races schema + patterns (read this session)
- `C:/EV-Accounts/backend/migrations/281_md_2026_discovery.sql` — discovery_jurisdictions ON CONFLICT pattern (read this session)
- `C:/EV-Accounts/backend/migrations/325_va_2026_discovery.sql` — VA discovery pattern, jurisdiction_geoid='51' precedent (read this session)
- `C:/EV-Accounts/backend/src/routes/essentialsDiscovery.ts` — discovery trigger endpoint POST /discover/jurisdiction/:id (read this session)
- `C:/EV-Accounts/backend/src/lib/discoveryService.ts` — runDiscoveryForJurisdiction() logic, discovery_runs table write (read this session)
- `C:/EV-Accounts/backend/src/lib/discoveryCron.ts` — sweep horizon + lock mechanism (read this session)
- `https://www.leg.state.nv.us/App/Legislator/A/senate/current` — Nevada Legislature official roster, all 21 senators with term-end years (fetched this session)
- `C:/EV-Accounts/backend/src/routes/discoveryDashboard.ts` — JWT trigger route POST /discovery/trigger/:id (read this session)

### Secondary (MEDIUM confidence)
- `https://www.nvsos.gov/SOSelectionPages/results/2026StateWidePrimary/ElectionSummary.aspx` — confirmed Districts 2, 8, 16, 21 had 2026 primaries (cross-validates leg.nv.us roster for D16)
- Wikipedia Nevada State Senate article — confirmed 11 of 21 districts up in 2026, term-end data consistent with official roster

### Tertiary (LOW confidence)
- General Ballotpedia search results — "11 districts up in 2026" count confirmed; specific district list not parseable from Ballotpedia directly

---

## Metadata

**Confidence breakdown:**
- NV Senate districts (11): HIGH — verified from official legislature roster + primary results cross-check
- Elections/races schema: HIGH — read directly from canonical migration 1109
- Discovery trigger mechanism: HIGH — read directly from source code
- Discovery source URL: MEDIUM — nvsos.gov 403 confirmed; Ballotpedia as fallback is VA precedent; actual parseability untested
- position_name strings: MEDIUM — reasonable convention, executor must verify against DB office titles
- NV SLDU geo_id format: LOW — executor must query DB before writing migration 1112

**Research date:** 2026-06-29
**Valid until:** 2026-08-01 (senate districts list is stable; NV filing period closed March 13)
