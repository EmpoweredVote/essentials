# Phase 5: DB Foundation + Agent Core - Research

**Researched:** 2026-04-23
**Domain:** PostgreSQL schema design, Anthropic SDK tool_use, fuzzy string matching, Express service patterns
**Confidence:** HIGH (codebase patterns), HIGH (Anthropic SDK tool_use), MEDIUM (fuzzy library selection)

## Summary

This phase adds three new tables to the essentials schema (migration 070+), wraps the Anthropic SDK to run a discovery agent, and orchestrates name normalization, confidence scoring, withdrawal detection, and staging writes in a service layer. An on-demand trigger endpoint and approve/dismiss endpoints complete the phase.

The Anthropic SDK's server-side `web_search` tool (`web_search_20250305`) is available and handles URL fetching as a server-side tool. The agent uses `tool_choice: { type: "tool", name: "report_candidates" }` with a user-defined structured output tool to force citation-required structured results back. Fuzzy matching uses `fastest-levenshtein` — the fastest Levenshtein implementation in the ecosystem — to compute the 85% similarity threshold as `1 - distance(a, b) / Math.max(a.length, b.length)`. Web search must be enabled org-wide in Claude Console before Phase 5 execution.

The codebase is mature and consistent: all DB writes use `pool.query()` (essentials schema is not in PostgREST), services are named `*Service.ts` in `src/lib/`, routes mirror `*Route.ts` or noun plurals in `src/routes/`, cron jobs live in `src/cron/`, and migrations use `BEGIN/COMMIT` blocks with numbered prefix starting at 070.

**Primary recommendation:** Use `tool_choice: { type: "tool", name: "report_candidates" }` with a user-defined `report_candidates` tool whose `input_schema` defines a `candidates` array of objects — each with `full_name`, `citation_url`, `race_hint` required fields. This is the only reliable way to prevent hallucination of citation URLs. Pair it with `web_search_20250305` (server-side) for URL fetch and bounded search.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | ^0.90.0 (latest is 0.90.0 as of 2026-04-23) | Anthropic API client — messages.create, tool_use, web_search | Official SDK, ESM-first, full TypeScript types |
| `fastest-levenshtein` | 1.0.16 | Levenshtein distance for 85% fuzzy match threshold | Fastest JS/TS implementation; Myers 32-bit + Myers X algorithms |
| `pg` (pool) | already installed ^8.13.0 | All essentials schema writes | essentials not in PostgREST; direct SQL required |
| `zod` | already installed ^3.23.0 | Validate trigger endpoint request body | Existing project standard |

### Already Installed (No New Install Needed)

| Library | Version | Purpose |
|---------|---------|---------|
| `node-cron` | ^4.2.1 | Cron job registration (used by campaignFinanceCron already) |
| `node-html-parser` | devDependency ^7.1.0 | HTML parsing if needed for page scraping (already in devDeps) |

### Supporting (New)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `fastest-levenshtein` | ^1.0.16 | Name fuzzy matching | 85% threshold check for confidence scoring and withdrawal detection |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `fastest-levenshtein` | `fuse.js` | Fuse.js is better for collection search (returns ranked results); fastest-levenshtein is better for pairwise comparison with a threshold, which is this use case |
| `fastest-levenshtein` | `natural` (NLP lib) | natural has Jaro-Winkler and other algorithms but much heavier; not needed for simple threshold check |

**Installation:**
```bash
npm install @anthropic-ai/sdk fastest-levenshtein
```

Note: The prior state decisions said `@anthropic-ai/sdk v0.91.0` but as of 2026-04-23 the latest published version is `0.90.0`. Use `^0.90.0` and install what resolves — the SDK is actively maintained and minor version gaps are not breaking.

## Architecture Patterns

### File Layout (follows existing project conventions)

```
backend/src/
├── lib/
│   ├── discoveryAgentRunner.ts    # Anthropic SDK wrapper — one API call, structured output
│   └── discoveryService.ts        # Orchestration: normalize, score, diff, stage, log
├── routes/
│   └── essentialsDiscovery.ts     # POST /admin/discover/jurisdiction/:id + approve/dismiss
├── cron/
│   └── discoveryCron.ts           # node-cron registration (Phase 7 will actually schedule)
backend/migrations/
│   ├── 070_discovery_tables.sql   # discovery_jurisdictions, candidate_staging, discovery_runs
```

### Pattern 1: Forced Tool Use for Structured Output

The agent runner uses two tools together:
1. `web_search_20250305` — Anthropic server-side tool for URL fetch and web search
2. A user-defined `report_candidates` tool — the structured output trap

`tool_choice: { type: "tool", name: "report_candidates" }` forces Claude to call `report_candidates` as its final act, guaranteeing a structured array. The web search tool runs freely during the turn (Claude decides when to search/fetch). At the end, Claude must call `report_candidates`.

```typescript
// Source: Anthropic official docs — tool_choice "tool" type
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await client.messages.create({
  model: 'claude-opus-4-6',
  max_tokens: 4096,
  tools: [
    {
      type: 'web_search_20250305',
      name: 'web_search',
      max_uses: 2,
      allowed_domains: allowedDomains.length > 0 ? allowedDomains : undefined,
    },
    {
      name: 'report_candidates',
      description: 'Report all candidates found. MUST be called with every candidate you found. citation_url MUST be the exact URL where the candidate name appears verbatim.',
      input_schema: {
        type: 'object',
        properties: {
          candidates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                full_name:    { type: 'string', description: 'Candidate full name as it appears on the source' },
                citation_url: { type: 'string', description: 'Exact URL where this candidate name appears verbatim' },
                race_hint:    { type: 'string', description: 'Free-text race description, e.g. "Los Angeles Mayor"' },
              },
              required: ['full_name', 'citation_url', 'race_hint'],
            },
          },
        },
        required: ['candidates'],
      },
    },
  ],
  tool_choice: { type: 'tool', name: 'report_candidates' },
  messages: [{ role: 'user', content: systemPrompt }],
});
```

**Extracting the result:**
```typescript
const toolUseBlock = response.content.find(
  (block): block is Anthropic.ToolUseBlock =>
    block.type === 'tool_use' && block.name === 'report_candidates'
);
if (!toolUseBlock) throw new Error('Agent did not call report_candidates');
const result = toolUseBlock.input as { candidates: AgentCandidate[] };
```

### Pattern 2: Name Normalization

Apply before any fuzzy comparison. Normalize both the agent's output and existing DB names.

```typescript
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    // Remove common suffixes: Jr, Sr, II, III, IV, Esq, PhD, etc.
    .replace(/\b(jr\.?|sr\.?|ii|iii|iv|v|esq\.?|ph\.?d\.?|md\.?)\s*$/i, '')
    .trim();
}
```

### Pattern 3: Fuzzy Similarity with fastest-levenshtein

```typescript
import { distance } from 'fastest-levenshtein';

function similarity(a: string, b: string): number {
  const normA = normalizeName(a);
  const normB = normalizeName(b);
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1.0;
  return 1 - distance(normA, normB) / maxLen;
}

// 85% threshold check:
const THRESHOLD = 0.85;
const isMatch = similarity(agentName, dbName) >= THRESHOLD;
```

### Pattern 4: Migration Format

Follows existing migration conventions:
- File: `070_discovery_tables.sql`
- Header comment block explaining purpose
- `BEGIN;` / `COMMIT;` wrapper
- `CREATE TABLE IF NOT EXISTS essentials.<name>` for idempotency
- `CREATE INDEX IF NOT EXISTS` for all indexes
- Schema: `essentials.*` (not `public.*`)
- Note: `CREATE INDEX CONCURRENTLY` cannot run inside a transaction — if trigram indexes are needed, they must be outside `BEGIN/COMMIT` like migration 069

### Pattern 5: Service Layer Pattern

Following `stagingService.ts` conventions:
- Export named async functions (no class instances)
- Use `pool.query()` for all essentials/staging writes — NOT supabase client
- Return typed interfaces, never raw DB rows
- Row mappers are private functions named `map*Row(row: any)`
- Error shaping: attach `err.httpStatus` for route-layer handling

### Pattern 6: Route Pattern

Following `admin.ts` conventions:
- `router.use(requireAuth as any, requireAdmin as any)` at top of file
- Zod schema validation before service call
- `handleServiceError(err, context, res)` helper for err.httpStatus propagation
- 202 for async fire-and-start-processing responses

### Anti-Patterns to Avoid

- **Don't use supabase client for essentials writes**: `supabaseAnon.schema('essentials')` fails at runtime — essentials is not in PostgREST. Use `pool.query()` always.
- **Don't pass `tool_choice: { type: "any" }` with web_search + report_candidates**: `any` lets Claude pick which tool to call last. Use `{ type: "tool", name: "report_candidates" }` to guarantee the output tool is called.
- **Don't rely on stop_reason alone**: With server-side tools, `stop_reason` can be `end_turn` even when a `tool_use` block exists. Always scan `response.content` for the `report_candidates` block.
- **Don't run `CREATE INDEX CONCURRENTLY` inside a transaction**: PostgreSQL disallows this. Use `IF NOT EXISTS` outside `BEGIN/COMMIT` for trigram indexes, or use regular `CREATE INDEX IF NOT EXISTS` inside the transaction.
- **Don't use Supabase client for essentials-schema DB reads either**: `pool.query()` for everything essentials-schema-related.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy string matching at 85% | Custom Levenshtein | `fastest-levenshtein` | Edge cases (empty strings, normalization), performance; fastest-levenshtein uses Myers bit-parallel algorithm |
| HTTP fetch of source pages | Custom fetch + HTML parse | Anthropic `web_search_20250305` server tool (server-side URL fetch) | Handles JS-rendered pages, rate limiting, TLS, redirects at Anthropic's infra |
| Web search | Custom search API integration | Anthropic `web_search_20250305` | Already provides domain filtering via `allowed_domains`; no extra API key needed |
| Structured output from LLM | Regex parsing of Claude's text | `tool_choice: { type: "tool" }` with user-defined tool schema | JSON schema validation baked in; tool_use blocks are always parseable |

**Key insight:** The Anthropic SDK's server-side web_search tool handles both "fetch this URL" and "search the web for X" in a single tool type. Claude decides whether to fetch a URL directly or run a search based on context. This eliminates a separate fetch library for the agent path.

## Common Pitfalls

### Pitfall 1: Web Search Not Enabled in Claude Console

**What goes wrong:** API calls including `web_search_20250305` return a 400 error: "web search tool not enabled for organization."
**Why it happens:** Anthropic requires org-admin opt-in to web search in Claude Console settings → Privacy.
**How to avoid:** Confirm web search is enabled in Claude Console before Phase 5 execution begins. This is a known requirement documented in the phase prior decisions.
**Warning signs:** First API test call fails with 400 before any agent logic runs.

### Pitfall 2: Forcing tool_choice with web_search Conflicts

**What goes wrong:** Setting `tool_choice: { type: "tool", name: "web_search" }` makes Claude only call web_search, never the output tool. Setting `tool_choice: { type: "any" }` doesn't guarantee `report_candidates` is the final call.
**Why it happens:** `tool_choice: { type: "tool" }` forces only that exact tool on the first tool call. With two tools, we want Claude to use web_search freely AND then be forced to call `report_candidates`.
**How to avoid:** Use `tool_choice: { type: "tool", name: "report_candidates" }`. This tells Claude it MUST call `report_candidates`. Claude can still decide to call `web_search` first as part of its reasoning, but its final structured call must be `report_candidates`. The model will use web search during its agentic loop as needed, then finalize with `report_candidates`.
**Warning signs:** Response has `stop_reason: "end_turn"` but no `report_candidates` block in `content`.

### Pitfall 3: tool_choice Incompatibility Note

**What goes wrong:** According to official docs (verified 2026-04-23), `tool_choice: { type: "any" }` and `tool_choice: { type: "tool" }` are NOT supported when using extended thinking. Since this agent does not use extended thinking, this is not a concern — but if extended thinking is ever added, this would break.
**How to avoid:** Do not add `thinking: { type: "enabled" }` to the agent runner call.

### Pitfall 4: Bigint Columns Returned as Strings by pg Driver

**What goes wrong:** Any `bigint` or `bigserial` column in PostgreSQL is returned as a JavaScript string by the `pg` driver, not a number. Code doing `row.count > 0` would always be false (string comparison).
**Why it happens:** pg driver behavior — JavaScript numbers cannot represent full 64-bit integers.
**How to avoid:** Use `Number(row.bigint_col)` on any count or bigint column. Follow the existing pattern in `stagingService.ts`: `reviewCount: Number(row.review_count)`.
**Warning signs:** Counts are strings in JSON responses; comparisons like `runs_count > 0` always evaluate unexpectedly.

### Pitfall 5: Withdrawal Detection Scope Bug

**What goes wrong:** Marking existing candidates as withdrawn even for races the agent never looked at.
**Why it happens:** Querying all `race_candidates` rows for a jurisdiction and comparing against the full agent output — if agent didn't touch a race, all its candidates appear "missing."
**How to avoid:** Implement the scope guard: only perform withdrawal detection on races where the agent returned ≥1 candidate (i.e., group agent output by race_hint, match to DB races, only diff those matched races). Races with zero agent candidates are untouched.
**Warning signs:** `candidate_staging` rows with `action='withdrawal'` for races where the agent found no candidates at all.

### Pitfall 6: confidence vs flagged Independence

**What goes wrong:** Assuming `confidence='official'` means `flagged=false`. A candidate from an official domain with no matching race in the DB should be `confidence='official', flagged=true, flag_reason='no matching race in DB'`.
**Why it happens:** Treating confidence and flagged as a combined enum rather than independent fields.
**How to avoid:** Compute confidence and flagged in separate steps in `discoveryService.ts`. Confidence scoring is domain + fuzzy match. Flagging is a separate check: does a matching race exist in DB?

### Pitfall 7: No Anthropic API Key Environment Variable

**What goes wrong:** `new Anthropic()` constructor throws at startup if `ANTHROPIC_API_KEY` is missing.
**How to avoid:** Add `ANTHROPIC_API_KEY` to `env.ts` Zod schema as `z.string().optional()` (optional so existing environments don't break at startup; absent key degrades discovery gracefully). Or make it required and document that it must be set. Check what makes sense with existing `env.ts` pattern where optional keys log warnings.

## DB Schema Design

### Table 1: essentials.discovery_jurisdictions

```sql
CREATE TABLE IF NOT EXISTS essentials.discovery_jurisdictions (
  id              uuid        NOT NULL DEFAULT uuid_generate_v4(),
  jurisdiction_id uuid        NOT NULL
                  REFERENCES essentials.jurisdictions(id) ON DELETE CASCADE,
  -- NOTE: if essentials.jurisdictions doesn't exist yet, this FK must be
  -- adjusted. See Open Questions below.
  election_date   date        NOT NULL,
  source_url      text,                   -- nullable; absent = web search fallback
  allowed_domains text[],                 -- nullable; absent = all citations → ceiling 'matched'
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT discovery_jurisdictions_pkey PRIMARY KEY (id)
);
```

### Table 2: essentials.candidate_staging

```sql
CREATE TABLE IF NOT EXISTS essentials.candidate_staging (
  id              uuid        NOT NULL DEFAULT uuid_generate_v4(),
  run_id          uuid        NOT NULL
                  REFERENCES essentials.discovery_runs(id) ON DELETE CASCADE,
  jurisdiction_id uuid        NOT NULL,
  full_name       text        NOT NULL,
  normalized_name text        NOT NULL,
  citation_url    text        NOT NULL,
  race_hint       text        NOT NULL,
  race_id         uuid
                  REFERENCES essentials.races(id),      -- NULL if no race match found
  matched_candidate_id uuid
                  REFERENCES essentials.race_candidates(id), -- NULL if new candidate
  confidence      text        NOT NULL
                  CHECK (confidence IN ('official', 'matched', 'uncertain')),
  action          text        NOT NULL DEFAULT 'new'
                  CHECK (action IN ('new', 'withdrawal')),
  flagged         boolean     NOT NULL DEFAULT false,
  flag_reason     text,                               -- NULL if not flagged
  status          text        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'dismissed')),
  dismissed_reason text,                              -- NULL unless status='dismissed'
  reviewed_at     timestamptz,
  reviewed_by     text,                               -- display_name of reviewer
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT candidate_staging_pkey PRIMARY KEY (id)
);
```

### Table 3: essentials.discovery_runs

```sql
CREATE TABLE IF NOT EXISTS essentials.discovery_runs (
  id                uuid        NOT NULL DEFAULT uuid_generate_v4(),
  jurisdiction_id   uuid        NOT NULL,
  election_date     date        NOT NULL,
  status            text        NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running', 'completed', 'failed')),
  started_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz,
  candidates_found  int         NOT NULL DEFAULT 0,
  candidates_new    int         NOT NULL DEFAULT 0,
  candidates_withdrawn int      NOT NULL DEFAULT 0,
  error_message     text,
  raw_output        jsonb,      -- agent's full tool_use input block, as-is

  CONSTRAINT discovery_runs_pkey PRIMARY KEY (id)
);
```

**raw_output JSONB schema** (Claude's discretion per CONTEXT.md):
```json
{
  "model": "claude-opus-4-6",
  "input_tokens": 1234,
  "output_tokens": 567,
  "candidates": [
    { "full_name": "Jane Smith", "citation_url": "https://...", "race_hint": "LA Mayor" }
  ]
}
```

### Migration Note

- Migration number starts at 070 (highest existing: 069_donor_name_normalized.sql).
- `discovery_runs` must be created before `candidate_staging` (FK dependency: `candidate_staging.run_id → discovery_runs.id`).
- The `discovery_jurisdictions.jurisdiction_id` FK depends on what the `essentials.jurisdictions` table looks like. Codebase search found no existing `essentials.jurisdictions` table — only `jurisdiction_geoid` text columns on other tables. See Open Questions.

## Code Examples

### Agent Runner: Initialization and API Call Pattern

```typescript
// Source: Anthropic official docs (platform.claude.com) + codebase pattern
import Anthropic from '@anthropic-ai/sdk';
import { env } from './env.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface AgentCandidate {
  full_name: string;
  citation_url: string;
  race_hint: string;
}

export interface AgentRunResult {
  candidates: AgentCandidate[];
  input_tokens: number;
  output_tokens: number;
}

export async function runDiscoveryAgent(params: {
  jurisdictionName: string;
  state: string;
  electionDate: string;
  sourceUrl?: string | null;
  allowedDomains?: string[] | null;
  knownRaces: string[];   // position_name strings from DB — context, not filter
}): Promise<AgentRunResult> {
  const { jurisdictionName, state, electionDate, sourceUrl, allowedDomains, knownRaces } = params;

  const prompt = buildAgentPrompt(jurisdictionName, state, electionDate, sourceUrl, knownRaces);

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    tools: [
      {
        type: 'web_search_20250305' as const,
        name: 'web_search',
        max_uses: sourceUrl ? 1 : 2,
        allowed_domains: allowedDomains?.length ? allowedDomains : undefined,
      } as any,  // SDK types may need casting for server-side tool union
      {
        name: 'report_candidates',
        description: 'Report ALL candidates found from official election sources. Call this exactly once with your complete findings. citation_url must be the exact URL where the candidate name appears verbatim — never fabricate URLs.',
        input_schema: {
          type: 'object' as const,
          properties: {
            candidates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  full_name:    { type: 'string', description: 'Full name exactly as it appears on the source page' },
                  citation_url: { type: 'string', description: 'Exact URL of the page where this name appears verbatim' },
                  race_hint:    { type: 'string', description: 'Race or office description, e.g. "Los Angeles Mayor" or "City Council District 3"' },
                },
                required: ['full_name', 'citation_url', 'race_hint'],
              },
            },
          },
          required: ['candidates'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'report_candidates' } as any,
    messages: [{ role: 'user', content: prompt }],
  });

  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === 'tool_use' && block.name === 'report_candidates'
  );

  if (!toolUseBlock) {
    throw new Error('Agent did not call report_candidates — check tool_choice configuration');
  }

  const result = toolUseBlock.input as { candidates: AgentCandidate[] };

  return {
    candidates: result.candidates ?? [],
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
  };
}
```

### Confidence Scoring

```typescript
// No external library needed
import { distance } from 'fastest-levenshtein';

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b(jr\.?|sr\.?|ii|iii|iv|v|esq\.?|ph\.?d\.?|md\.?)\s*$/i, '')
    .trim();
}

function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1.0;
  return 1 - distance(na, nb) / maxLen;
}

type Confidence = 'official' | 'matched' | 'uncertain';

function scoreConfidence(
  citationUrl: string,
  candidateName: string,
  allowedDomains: string[] | null,
  existingCandidateNames: string[]
): Confidence {
  // Step 1: Domain check
  if (allowedDomains && allowedDomains.length > 0) {
    try {
      const host = new URL(citationUrl).hostname.replace(/^www\./, '');
      const domainMatch = allowedDomains.some(d => host === d || host.endsWith('.' + d));
      if (domainMatch) return 'official';
    } catch { /* invalid URL — fall through */ }
  }

  // Step 2: Fuzzy name match against known race_candidates
  const THRESHOLD = 0.85;
  const hasNameMatch = existingCandidateNames.some(
    existing => nameSimilarity(candidateName, existing) >= THRESHOLD
  );
  if (hasNameMatch) return 'matched';

  return 'uncertain';
}
```

### Withdrawal Detection

```typescript
function detectWithdrawals(
  agentCandidates: AgentCandidate[],
  dbCandidatesByRace: Map<string, { id: string; full_name: string }[]>
): { raceId: string; candidateId: string; full_name: string }[] {
  const withdrawals: { raceId: string; candidateId: string; full_name: string }[] = [];
  const THRESHOLD = 0.85;

  for (const [raceId, dbCandidates] of dbCandidatesByRace.entries()) {
    // Only check races where agent returned ≥1 candidate
    // (race matching to agent output is done upstream by caller)
    for (const dbCandidate of dbCandidates) {
      const found = agentCandidates.some(
        ac => nameSimilarity(ac.full_name, dbCandidate.full_name) >= THRESHOLD
      );
      if (!found) {
        withdrawals.push({ raceId, candidateId: dbCandidate.id, full_name: dbCandidate.full_name });
      }
    }
  }
  return withdrawals;
}
```

### Route: POST /admin/discover/jurisdiction/:id

```typescript
// Follows admin.ts pattern
router.post('/jurisdiction/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  if (!UUID_REGEX.test(id)) {
    res.status(400).json({ error: 'Invalid jurisdiction config UUID' });
    return;
  }

  // 202 immediately; discovery runs async
  res.status(202).json({ message: 'Discovery started', jurisdictionConfigId: id });

  // Fire-and-forget — errors logged internally
  runDiscovery(id).catch(err => {
    console.error(`[discovery] Unhandled error for jurisdiction ${id}:`, err);
  });
});
```

### Approve/Dismiss Staging Candidate

```typescript
// PATCH /admin/discover/staging/:id/approve
router.patch('/staging/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    await approveCandidate(id, (req as AuthenticatedRequest).userId);
    res.status(200).json({ approved: true });
  } catch (err: any) {
    handleServiceError(err, `PATCH /staging/${id}/approve`, res);
  }
});

// PATCH /admin/discover/staging/:id/dismiss
router.patch('/staging/:id/dismiss', async (req, res) => {
  const schema = z.object({ reason: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'reason required' }); return; }
  try {
    await dismissCandidate(id, parsed.data.reason, (req as AuthenticatedRequest).userId);
    res.status(200).json({ dismissed: true });
  } catch (err: any) {
    handleServiceError(err, `PATCH /staging/${id}/dismiss`, res);
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate fetch library + Claude text output parsing | Anthropic server-side `web_search` tool + `tool_use` structured output | Claude tool_use GA (2024) | No external fetch library needed for agent; citation URLs are schema-validated |
| `claude-3-sonnet` model for tasks | `claude-opus-4-6` for complex agentic tasks | Apr 2026 | Opus handles multi-tool decisions better per official docs |
| `tool_choice: "any"` for forcing output | `tool_choice: { type: "tool", name: "X" }` | tool_choice GA | Guarantees specific tool is called; eliminates ambiguity |

**Deprecated/outdated:**
- `web_search_20250305` has a newer version `web_search_20260209` with dynamic filtering (requires code_execution tool enabled). Use `web_search_20250305` for this phase — simpler, no code_execution dependency.
- `claude-3-*` model family: still available but not recommended for new agentic work; use `claude-opus-4-6` or `claude-haiku-4-5` depending on task complexity.

## Open Questions

1. **`essentials.jurisdictions` table FK target**
   - What we know: `discovery_jurisdictions.jurisdiction_id` FKs to jurisdictions per the CONTEXT.md schema. Codebase search found NO `essentials.jurisdictions` table — jurisdictions appear only as `jurisdiction_geoid text` columns elsewhere.
   - What's unclear: Does an `essentials.jurisdictions` table exist in Supabase but have no migration file? Or does `jurisdiction_id` FK to a different table (e.g., `essentials.offices`)?
   - Recommendation: Before writing the migration, run `SELECT table_name FROM information_schema.tables WHERE table_schema = 'essentials'` in Supabase SQL Editor to confirm. If no `jurisdictions` table exists, the `discovery_jurisdictions` table should store `jurisdiction_geoid text` directly (matching the geo_id pattern used elsewhere) rather than a UUID FK.

2. **SDK TypeScript types for server-side tools**
   - What we know: The `web_search_20250305` server tool has a different shape than user-defined tools (no `input_schema`). The TypeScript SDK may require `as any` casting for the `tools` array union type.
   - What's unclear: Whether `@anthropic-ai/sdk 0.90.0` has first-class TypeScript types for `WebSearchTool20250305` in the `ToolUnionParam` type.
   - Recommendation: Use `as any` for the tools array if TypeScript complains; the runtime behavior is correct per official docs examples.

3. **`ANTHROPIC_API_KEY` in env.ts**
   - What we know: `env.ts` validates all env vars at startup with Zod; missing required vars cause `process.exit(1)`.
   - What's unclear: Whether the key should be `z.string()` (required — breaks startup if absent) or `z.string().optional()` (degrades gracefully).
   - Recommendation: Make it `z.string().optional()` consistent with other optional service keys (`FEC_API_KEY`, `QUEST_SERVICE_KEY`). Log a warning if absent and skip discovery. This matches the existing pattern where optional service keys don't break startup.

## Sources

### Primary (HIGH confidence)
- Anthropic official docs — `platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools` — tool definition format, `input_schema`, `tool_choice`, `input_examples`
- Anthropic official docs — `platform.claude.com/docs/en/agents-and-tools/tool-use/tool-reference` — server tool type strings (`web_search_20250305`, `web_search_20260209`), tool properties table
- Anthropic official docs — `platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool` — web_search tool format, `max_uses`, `allowed_domains`, org-level enable requirement
- Anthropic official docs — `platform.claude.com/docs/en/about-claude/models/overview` — current model IDs (`claude-opus-4-6`, `claude-sonnet-4-6`, `claude-haiku-4-5`), pricing
- Codebase — `C:/EV-Accounts/backend/` — migration format, service patterns, route patterns, env.ts structure, existing tables (elections, races, race_candidates from 042_election_schema.sql)

### Secondary (MEDIUM confidence)
- WebSearch + GitHub README for `fastest-levenshtein`: version 1.0.16, MIT, Myers algorithm; API exports `distance()` and `closest()` — multiple sources agree
- WebSearch: `@anthropic-ai/sdk` latest version is 0.90.0 as of 2026-04-23 (npm search result; npmjs.com page was 403)

### Tertiary (LOW confidence)
- TypeScript SDK `as any` casting workaround for server-tool union types: based on pattern from official docs examples showing SDK union types; exact TypeScript shape for `tools` array with mixed server/client tools not independently verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — SDK from official Anthropic docs; fastest-levenshtein from multiple sources; all other deps already in project
- Architecture: HIGH — patterns directly derived from existing codebase files read verbatim
- DB schema: HIGH — follows existing migration patterns exactly; column names match CONTEXT.md decisions
- Pitfalls: HIGH (Anthropic tool_use) / MEDIUM (SDK TypeScript casting)
- Anthropic SDK version: MEDIUM — 0.90.0 confirmed via web search; exact breaking changes from prior decisions' "0.91.0" not verified (version may not exist yet)

**Research date:** 2026-04-23
**Valid until:** 2026-05-07 (14 days — Anthropic SDK moves fast; web_search tool type strings are stable once versioned)
