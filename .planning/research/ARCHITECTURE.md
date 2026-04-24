# Architecture Patterns: Claude-Powered Candidate Discovery Integration

**Domain:** Civic data backend — Claude agent discovery pipeline added to existing Express/Postgres system
**Researched:** 2026-04-23
**Overall confidence:** HIGH — based on direct inspection of the live codebase at /c/EV-Accounts/backend/src

---

## Existing Architecture (Verified)

The backend at `/c/EV-Accounts/backend/src` follows a consistent layered pattern:

```
index.ts
  └── registers routers (one file per feature area)
  └── starts cron jobs (startXxxCron() functions)

routes/*.ts        — HTTP surface only; no DB clients
lib/*Service.ts    — all DB access; called by routes
lib/db.ts          — exports pool (pg.Pool, max:5, Supabase session pooler)
cron/*.ts          — cron registration files (import from lib/*Service or lib/*Scheduler)
middleware/        — auth, requireAdmin, adminTokenAuth, serviceKeyAuth
```

**Key constraints observed:**
- `routes/` files must not reference `supabaseAdmin` directly (enforced by `architecture.test.ts`)
- All DB access uses `pool.query()` — essentials and staging schemas are NOT in PostgREST
- Crons call a named function from a lib service; errors are caught and logged but non-fatal
- Email is sent via `emailService.ts` (Resend API); missing key degrades gracefully to a warning
- Admin mutations require `requireAdmin` middleware (JWT + role check)
- Machine-to-machine endpoints use `requireAdminToken` (pre-shared `ADMIN_INGEST_TOKEN`) or `requireServiceKey`
- Existing schemas: `essentials`, `staging`, `connect`, `inform`, `public`

---

## New Component Map

### New files to create

| File | Type | Purpose |
|------|------|---------|
| `src/lib/discoveryService.ts` | Service | Claude agent logic, jurisdiction DB ops, staging writes |
| `src/lib/discoveryAgentRunner.ts` | Service | Anthropic SDK wrapper; assembles tool use + prompt |
| `src/routes/essentialsDiscovery.ts` | Route | Admin HTTP surface: trigger, queue, approve |
| `src/cron/discoveryCron.ts` | Cron | Scheduled sweep registration |

### New DB tables (all in `essentials` schema)

| Table | Purpose |
|-------|---------|
| `essentials.discovery_jurisdictions` | Registry of known jurisdictions with their election authority URLs |
| `essentials.discovery_runs` | Log of each agent execution (jurisdiction, status, found count, errors) |
| `essentials.candidate_staging` | Discovered candidates awaiting human review before upsert |

### Modified files

| File | Change |
|------|--------|
| `src/index.ts` | Import `essentialsDiscoveryRouter`; call `startDiscoveryCron()` |
| `src/lib/env.ts` | Add `ANTHROPIC_API_KEY: z.string().optional()` |

---

## DB Schema

All tables use `pool.query()` exclusively — same pattern as `essentials.*` and `staging.*`.

### `essentials.discovery_jurisdictions`

```sql
CREATE TABLE IF NOT EXISTS essentials.discovery_jurisdictions (
  id                  uuid        NOT NULL DEFAULT uuid_generate_v4(),
  name                text        NOT NULL,           -- "City of Los Angeles"
  state               char(2)     NOT NULL,
  jurisdiction_level  text        NOT NULL
                      CHECK (jurisdiction_level IN ('city','county','district','state')),
  election_authority_url text     NOT NULL,           -- primary URL agent fetches
  secondary_urls      text[],                         -- additional pages (filing portals, etc.)
  government_id       uuid        REFERENCES essentials.governments(id),
  last_discovered_at  timestamptz,
  discovery_enabled   boolean     NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT discovery_jurisdictions_pkey PRIMARY KEY (id)
);
```

**Notes:**
- `government_id` FK is nullable — a jurisdiction can be registered before its government row exists
- `discovery_enabled = false` pauses a jurisdiction without deletion (useful for off-cycle elections)

### `essentials.discovery_runs`

```sql
CREATE TABLE IF NOT EXISTS essentials.discovery_runs (
  id                  uuid        NOT NULL DEFAULT uuid_generate_v4(),
  jurisdiction_id     uuid        NOT NULL REFERENCES essentials.discovery_jurisdictions(id),
  triggered_by        text        NOT NULL
                      CHECK (triggered_by IN ('cron','manual')),
  status              text        NOT NULL DEFAULT 'running'
                      CHECK (status IN ('running','completed','failed')),
  candidates_found    int         NOT NULL DEFAULT 0,
  candidates_staged   int         NOT NULL DEFAULT 0,
  error_message       text,
  raw_agent_output    jsonb,      -- full agent response for debugging
  started_at          timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT discovery_runs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_discovery_runs_jurisdiction_id
  ON essentials.discovery_runs(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_discovery_runs_status
  ON essentials.discovery_runs(status);
CREATE INDEX IF NOT EXISTS idx_discovery_runs_started_at
  ON essentials.discovery_runs(started_at DESC);
```

**Notes:**
- `raw_agent_output` (JSONB) captures the full Claude response — essential for debugging hallucinations
- A jurisdiction can have multiple runs; query `ORDER BY started_at DESC LIMIT 1` for latest

### `essentials.candidate_staging`

```sql
CREATE TABLE IF NOT EXISTS essentials.candidate_staging (
  id                  uuid        NOT NULL DEFAULT uuid_generate_v4(),
  discovery_run_id    uuid        NOT NULL REFERENCES essentials.discovery_runs(id),
  jurisdiction_id     uuid        NOT NULL REFERENCES essentials.discovery_jurisdictions(id),
  race_id             uuid        REFERENCES essentials.races(id),  -- nullable: race may not exist yet
  full_name           text        NOT NULL,
  first_name          text,
  last_name           text,
  office_name         text        NOT NULL,           -- as discovered, e.g. "City Council District 4"
  election_date       date,
  source_url          text        NOT NULL,           -- page where candidate was found
  source_excerpt      text,                           -- quoted text from page that named the candidate
  is_incumbent        boolean     NOT NULL DEFAULT false,
  external_id         text,                           -- filing ID from election authority if present
  status              text        NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','rejected','duplicate')),
  reviewed_by         text,                           -- admin display_name
  reviewed_at         timestamptz,
  merged_to_race_candidate_id uuid REFERENCES essentials.race_candidates(id),
  flagged             boolean     NOT NULL DEFAULT false,
  flag_reason         text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_staging_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_candidate_staging_status
  ON essentials.candidate_staging(status);
CREATE INDEX IF NOT EXISTS idx_candidate_staging_jurisdiction_id
  ON essentials.candidate_staging(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_candidate_staging_run_id
  ON essentials.candidate_staging(discovery_run_id);

-- Partial unique: prevent staging the same candidate name+office twice within a run
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidate_staging_dedup
  ON essentials.candidate_staging(discovery_run_id, lower(full_name), lower(office_name));
```

**Key design choices:**
- `source_url` and `source_excerpt` are required — every staged candidate must cite where they were found
- `flagged` + `flag_reason` allow the agent to mark uncertain entries without blocking the whole run
- `merged_to_race_candidate_id` records where an approved staging entry landed in production

---

## Component Architecture and Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  index.ts                                                   │
│  ├── app.use('/api/admin/discovery', essentialsDiscoveryRouter)│
│  └── startDiscoveryCron()                                   │
└─────────────────────────────────────────────────────────────┘
          │                          │
          ▼                          ▼
┌──────────────────────┐    ┌────────────────────┐
│ essentialsDiscovery  │    │  discoveryCron.ts  │
│ Router.ts            │    │  (node-cron)       │
│                      │    │  schedule: weekly  │
│ POST /trigger/:id    │    │  calls runDiscovery│
│ GET  /queue          │    │  ForJurisdiction() │
│ PATCH /queue/:id/    │    └────────────────────┘
│       approve        │
│ PATCH /queue/:id/    │
│       reject         │
└──────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────┐
│  discoveryService.ts                                         │
│                                                              │
│  runDiscoveryForJurisdiction(jurisdictionId, triggeredBy)    │
│    1. Load jurisdiction from discovery_jurisdictions         │
│    2. Create discovery_runs row (status='running')           │
│    3. Call discoveryAgentRunner.runAgent(urls, context)      │
│    4. Parse structured output from agent                     │
│    5. Write candidates to candidate_staging                  │
│    6. Flag candidates needing review                         │
│    7. Update discovery_runs (status='completed|failed')      │
│    8. If flagged items > 0: sendEmail() admin notification   │
│                                                              │
│  getQueue(filters)     — list candidate_staging rows         │
│  approveCandidate(id)  — upsert into race_candidates         │
│  rejectCandidate(id)   — mark rejected                       │
└──────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│  discoveryAgentRunner.ts                                    │
│                                                             │
│  runAgent(urls, jurisdictionContext)                        │
│    1. Fetch page content (node-fetch or built-in fetch)     │
│    2. Build system prompt + user message                    │
│    3. Call Anthropic SDK: client.messages.create(...)       │
│    4. Return structured JSON: { candidates: [...] }         │
│                                                             │
│  Anthropic SDK: @anthropic-ai/sdk                          │
│  Model: claude-opus-4 or claude-sonnet-4-5                  │
└─────────────────────────────────────────────────────────────┘
          │ writes
          ▼
┌──────────────────────────────────────────────────────────────┐
│  Postgres (pool.query — essentials schema)                   │
│                                                              │
│  essentials.discovery_jurisdictions  ← registry             │
│  essentials.discovery_runs           ← run log              │
│  essentials.candidate_staging        ← review queue         │
│                                      │                       │
│  On approve:                         ▼                       │
│  essentials.race_candidates  ← upserted (challenger rows)   │
│  essentials.politicians      ← upserted (if new politician) │
└──────────────────────────────────────────────────────────────┘
```

---

## Question-by-Question Answers

### 1. Where does Claude agent logic live — dedicated service module or separate worker?

**Recommendation: In-process service module, not a separate worker.**

The existing pattern (campaign finance scheduler, district staleness service) demonstrates that long-running async work runs as a plain async function called from a cron or route handler. Render's long-running server supports this well. A separate worker process adds operational complexity (two Render services, inter-process communication) that is not warranted at this stage.

Create `src/lib/discoveryService.ts` for DB operations and orchestration, plus `src/lib/discoveryAgentRunner.ts` to isolate the Anthropic SDK call. This keeps concerns separated without requiring a second process.

The only reason to break out a separate worker would be if discovery runs are long enough (> 30 seconds per jurisdiction) to block the request/response cycle. Since the cron path is fire-and-forget (returns void), and the manual trigger endpoint can return 202 Accepted immediately and run async, this is not a problem in-process.

### 2. One agent per jurisdiction, or one per race?

**Recommendation: One agent call per jurisdiction, not per race.**

Election authority pages are jurisdiction-scoped (a city's election page lists all races for that city). Sending one well-crafted prompt per jurisdiction is more efficient and mirrors how the source data is structured. The agent output should be a structured list of `{ office_name, candidates: [...] }` objects — the service layer splits that into `candidate_staging` rows per candidate.

If a jurisdiction has many races and the agent output becomes unwieldy, the agent call can be batched by page/URL within the jurisdiction (e.g., one call per URL in `secondary_urls`), but not by race. Race-level calls would require knowing the races in advance, which defeats the purpose of discovery.

### 3. DB schema for jurisdictions, discovery_runs, and candidate_staging

Specified in full above under **DB Schema**.

Key design decisions:
- All three tables live in `essentials` schema (not `staging`) — they are a first-class operational system, not transient review data
- `candidate_staging` has its own status lifecycle; it is NOT the same as `staging.politicians`
- `discovery_runs` captures `raw_agent_output` as JSONB for hallucination auditing
- `source_url` and `source_excerpt` are required fields — provenance is non-negotiable

### 4. How does the on-demand endpoint relate to the scheduled cron?

**Recommendation: Both call the same `runDiscoveryForJurisdiction()` service function.**

This is the same pattern used by `campaignFinanceCron.ts` + `campaignFinanceAdmin.ts` — the cron calls `runFecScheduledJob()` and the manual trigger also calls it. No logic duplication.

```typescript
// discoveryCron.ts
cron.schedule('0 3 * * 1', async () => {  // Monday 3am UTC
  const jurisdictions = await discoveryService.getEnabledJurisdictions();
  for (const j of jurisdictions) {
    await discoveryService.runDiscoveryForJurisdiction(j.id, 'cron');
  }
});

// essentialsDiscovery.ts (route)
router.post('/trigger/:id', requireAdminToken, async (req, res) => {
  // Return 202 immediately; run async
  res.status(202).json({ message: 'Discovery triggered' });
  void discoveryService.runDiscoveryForJurisdiction(req.params.id, 'manual');
});
```

The `void` on the async call lets the response return immediately while the agent runs in the background. The run status can be polled via `GET /admin/discovery/runs/:jurisdictionId/latest`.

### 5. Upsert path — how discovered candidates flow into existing tables without duplicating Cicero data

**The key insight: discovered candidates are challengers, not incumbents.**

Cicero populates `essentials.politicians` with incumbents (`is_incumbent = true`). The discovery system targets challengers — people who filed to run but don't yet hold office. The existing `race_candidates` table was explicitly designed for this (per migration 042 comment: "challengers: `politician_id = NULL`; carry their own name/photo fields").

**Deduplication strategy:**

On approve in `discoveryService.approveCandidate(stagingId)`:

```
1. Load candidate_staging row
2. Check if a race_candidates row already exists for this person in this race:
     SELECT id FROM essentials.race_candidates
     WHERE race_id = $raceId
       AND lower(full_name) = lower($candidateName)
       AND is_incumbent = false
3. If found: mark staging as 'duplicate', set merged_to_race_candidate_id
4. If not found: INSERT INTO essentials.race_candidates (race_id, full_name, first_name, last_name,
                   is_incumbent=false, candidate_status='filed', source='discovery', external_id, ...)
5. If incumbent match is needed: check essentials.politicians by name for possible link
   (optional step — don't auto-link; flag for manual review)
```

**Protecting Cicero incumbents:**
- Discovery agents should be instructed in their system prompt to skip candidates with `is_incumbent=true` for offices where a politician record already exists
- The approval path only writes `is_incumbent=false` rows — it cannot touch incumbent politicians
- The `candidate_status='filed'` default on new inserts keeps discovered challengers out of the election query path until manually promoted to `'active'`

**Preventing cross-run duplicates:**
- The partial unique index `idx_candidate_staging_dedup` on `(discovery_run_id, lower(full_name), lower(office_name))` prevents the same candidate from appearing twice in a single run
- Cross-run deduplication happens at the approve step via the race_candidates lookup above

### 6. Build order

Build in this sequence. Each step has a clear deliverable and doesn't require the next step to be testable.

**Step 1: DB migrations**
- Migration: `discovery_jurisdictions`, `discovery_runs`, `candidate_staging` tables
- Seed one jurisdiction (e.g., City of LA) for testing
- No code changes needed — tables can be tested with direct SQL

**Step 2: discoveryAgentRunner.ts**
- Install `@anthropic-ai/sdk` as a dependency
- Add `ANTHROPIC_API_KEY` to `env.ts`
- Write `runAgent(urls, context)` — takes URLs, returns structured JSON
- Test standalone with a real election authority page

**Step 3: discoveryService.ts — core functions**
- `runDiscoveryForJurisdiction()` — full orchestration: load jurisdiction → call agent → write staging rows → update run log
- `getEnabledJurisdictions()` — returns jurisdictions where `discovery_enabled = true`
- `getQueue(filters)` — list staging rows
- Test by manually calling with a real jurisdiction ID

**Step 4: essentialsDiscovery route**
- `POST /api/admin/discovery/trigger/:id` — requireAdminToken, 202 response, void async call
- `GET /api/admin/discovery/queue` — requireAdminToken, list staging rows
- `PATCH /api/admin/discovery/queue/:id/approve` — requireAdminToken, upsert into race_candidates
- `PATCH /api/admin/discovery/queue/:id/reject` — requireAdminToken, mark rejected
- Register in `index.ts`

**Step 5: discoveryCron.ts**
- Register weekly sweep
- Call `startDiscoveryCron()` in `index.ts`

**Step 6: Email notification**
- Add email call at end of `runDiscoveryForJurisdiction()` when `flagged > 0`
- Reuse `emailService.sendEmail()` — already integrated, Resend API, gracefully degrades if key absent

---

## Integration Points with Existing Components

| Existing Component | Interaction |
|-------------------|-------------|
| `pool` (db.ts) | All new tables use `pool.query()` — no new DB client needed |
| `emailService.ts` | Import `sendEmail()` for flagged-item admin notifications |
| `requireAdminToken` middleware | Auth for all `/admin/discovery/*` routes (X-Admin-Token header) |
| `electionService.ts` | No direct integration — discovery writes to `race_candidates`, which `electionService` already queries |
| `essentials.politicians` | Incumbents are read-only from discovery perspective; challengers only in `race_candidates` |
| `essentials.race_candidates` | Write target on approve; existing `candidate_status` field (`filed` → `active`) used |
| `index.ts` | Two additions: router registration + cron start |
| `env.ts` | Add `ANTHROPIC_API_KEY` |

---

## Anti-Patterns to Avoid

**Anti-pattern: Writing directly to `essentials.politicians` from the discovery agent**
The discovery agent should never auto-promote candidates into `essentials.politicians`. That table holds incumbents with rich linked data (office, district, chamber, geofence). Challengers discovered by the agent belong in `race_candidates` with `is_incumbent=false`. Conflating these corrupts the data model and breaks geofence-based representative lookup.

**Anti-pattern: Auto-approving agent output**
Agent output must flow through `candidate_staging` and require human approval before entering `race_candidates`. Claude can hallucinate names or misread filing deadlines. The staging queue is the firebreak.

**Anti-pattern: Trusting agent output for incumbent identification**
The agent should report what it sees on the page. If it sees an incumbent's name, that name may already be in `essentials.politicians`. The approval step (not the agent) is responsible for checking for an existing politician match. Do not encode matching logic in the agent prompt.

**Anti-pattern: Running all jurisdictions in parallel on cron**
The cron sweep should run jurisdictions sequentially (or with limited concurrency, e.g., 2 at a time). Parallel Claude API calls across all jurisdictions will exhaust rate limits and produce no useful output. This mirrors the memory note: "Always run stance research agents ONE at a time."

**Anti-pattern: Storing agent output only in application logs**
The `raw_agent_output` JSONB column in `discovery_runs` is required. If an agent misidentifies a candidate and the staging row is approved by mistake, the audit trail must show what the agent returned. Application logs are ephemeral on Render.

**Anti-pattern: Separate Render service for the agent worker**
The existing architecture runs campaign finance ingestion, district staleness, and calibration lapse crons all in-process. Adding a second service for discovery creates operational overhead (separate deploy, separate env vars, inter-service communication) with no benefit at this scale.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|-----------|-------|
| Express service/cron pattern | HIGH | Direct inspection of campaignFinanceCron, districtStaleness, index.ts |
| DB schema design | HIGH | Based on migration 042 (race_candidates), stagingService.ts patterns |
| Deduplication strategy | HIGH | race_candidates table and its `candidate_status` field directly support this |
| Agent granularity (per jurisdiction) | MEDIUM | Reasonable assumption; actual token limits depend on page length |
| Anthropic SDK integration | MEDIUM | SDK is well-documented; specific tool use patterns need phase-level research |
| Rate limit behavior under load | LOW | No Anthropic rate limit values verified; sequential execution is a safe default |

---

## Open Questions for Phase-Level Research

- What is the Anthropic API rate limit for the selected model tier, and does it affect cron sweep frequency?
- Should the agent use tool use (structured output via `tools` parameter) or rely on JSON-in-text with schema enforcement? Tool use is more reliable for structured extraction.
- How long do typical election authority pages take to fetch, and does the page content fit in a single Claude context window? Some SoS pages are large.
- Does the approval path need to create a `race` row if one doesn't yet exist for the discovered election, or should approval require a pre-existing race?
