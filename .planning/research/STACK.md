# Technology Stack — Candidate Discovery System

**Project:** EmpoweredVote candidate discovery (milestone addition)
**Researched:** 2026-04-23
**Scope:** NEW additions only. Existing stack (React 19, Vite, Tailwind 4, Express TypeScript, Postgres/PostGIS, Supabase) is validated and unchanged.

---

## Summary of New Dependencies

Three packages need to be added to `C:/EV-Accounts/backend/package.json`. One is already there.

| Package | Status | Purpose |
|---------|--------|---------|
| `@anthropic-ai/sdk` | NOT installed | Claude agents with web search |
| `node-cron` | ALREADY INSTALLED (`^4.2.1`) | Scheduler — no change needed |
| `resend` | NOT installed | Admin email notifications |

No new infrastructure services are required. Everything runs in the existing Render web service.

---

## 1. Claude Agents with Web Search

### Package

```bash
npm install @anthropic-ai/sdk
```

**Current version:** `0.91.0` (released 2026-04-23 — verified against GitHub releases page)

### How the web search tool actually works

The web search tool is a **server-side tool** — Anthropic executes the search on its own infrastructure. You do not call a search API yourself or parse HTML. You pass a tool descriptor in your `messages.create()` call; Claude decides when to invoke it, Anthropic runs the search, and results are returned inline in the response content blocks.

**Two available tool versions:**

| Version | When to use |
|---------|-------------|
| `web_search_20250305` | Standard. Supports `max_uses`, `allowed_domains`, `blocked_domains`, `user_location`. |
| `web_search_20260209` | Adds dynamic filtering — Claude writes code to post-process results before they enter context, reducing token consumption. Requires code execution tool to also be enabled. Best for technical research with high signal-to-noise ratio. |

**Recommendation: use `web_search_20250305` for this system.** The dynamic filtering version (`20260209`) is powerful but adds complexity (requires enabling the code execution tool too) and the cost benefit only materializes when crawling noisy pages. Official election authority pages are relatively structured. Start with `20250305` and upgrade if token costs become a problem.

### TypeScript usage pattern

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 4096,
  messages: [
    {
      role: "user",
      content: `Find all candidates who have filed for the ${race.name} election in ${jurisdiction.name}. 
                Search the official election authority website. Return structured JSON with: 
                name, party, filing_date, website if available.`,
    },
  ],
  tools: [
    {
      type: "web_search_20250305",
      name: "web_search",
      max_uses: 5,
      allowed_domains: jurisdiction.official_election_domains, // string[] from your jurisdictions table
    },
  ],
});
```

**The `allowed_domains` parameter is valuable for this use case.** By pinning searches to known official election authority domains (e.g., `lavote.gov`, `sos.ca.gov`), you prevent Claude from pulling in news articles or unofficial sources. The jurisdictions registry table should store these domains per jurisdiction.

### Pricing

- **Web search:** $10 per 1,000 searches (charged per search invocation, regardless of result count; not charged on error)
- **Token costs:** Web search results count as input tokens. Using `claude-sonnet-4-6` (same model already available), expect 2,000-6,000 input tokens per agent run from search results alone
- **Per-run cost estimate:** A single jurisdiction scan with 5 searches ≈ $0.05 in search fees + ~$0.01-0.03 in token costs = ~$0.06-0.08 per run
- **Weekly cron over 50 jurisdictions:** ~$3-4/week at current rates — negligible

### ANTHROPIC_API_KEY setup

Add to Render environment variables for the backend service. The SDK reads `ANTHROPIC_API_KEY` automatically.

**Important prerequisite:** Web search must be enabled in the Anthropic Console admin settings (`console.anthropic.com/settings/privacy`) before it can be used via API. This is an organization-level toggle.

---

## 2. Scheduler (Cron)

### Package

`node-cron ^4.2.1` is **already installed**. No additional package needed.

`@types/node-cron ^3.0.11` is also already in devDependencies.

### Render deployment: in-process vs separate cron service

**Decision: use in-process `node-cron` inside the existing Express web service.**

Rationale:

- The existing backend deploys as a single Render web service (not a background worker). Adding an in-process scheduler requires zero infrastructure changes.
- A Render Cron Job is a **separate service** that spins up, runs a command, and exits. It costs a minimum of $1/month additional and adds deployment surface. For a weekly job that takes minutes, this overhead is not justified.
- The main risk of in-process scheduling is job duplication across multiple instances. This backend runs as a **single-instance** Render web service (standard tier). Multi-instance risk does not apply.
- The 12-hour Render run limit only applies to Render Cron Job services, not to long-running web services. In-process cron runs are not constrained by this limit.
- If the server restarts (deploy, crash), the cron schedule resets cleanly at startup — which is acceptable for a weekly discovery run. A missed weekly run due to a deploy window is not a critical failure.

### Usage pattern

```typescript
import cron from "node-cron";

// In src/index.ts, after app.listen()
cron.schedule("0 2 * * 1", async () => {
  // Every Monday at 2am UTC
  await runDiscoveryCycle();
});
```

**If multi-instance is ever needed** (scaling up), the pattern to add is a Postgres-backed advisory lock: `SELECT pg_try_advisory_lock(42)` at the start of the cron handler, run the job only if the lock is acquired, release at the end. This prevents duplicate runs without adding BullMQ or Redis locking overhead.

---

## 3. Admin Email Notifications

### Package

```bash
npm install resend
```

**Current version:** `6.12.0` (verified from npm search results, 2026-04-23)

### Why Resend over alternatives

| Option | Verdict | Reason |
|--------|---------|--------|
| **Resend** | Recommended | Permanent free tier (3,000/month, 100/day), TypeScript-first API, minimal setup, `{ data, error }` pattern consistent with existing Supabase client patterns in this codebase |
| SendGrid | Avoid | Free tier was eliminated May 2025; new accounts require paid plan from day one ($19.95/month minimum) |
| Nodemailer | Avoid for this use case | SMTP configuration, deliverability management, and DNS setup are all on you. Fine for self-hosted, wrong choice when Resend/SendGrid handle this |
| Postmark | Viable alternative | Strong deliverability, good DX, but requires paid account setup with no permanent free tier for low-volume internal tools |

**For an internal admin notification tool sending <100 emails/day, Resend's free tier is sufficient indefinitely.** The 100/day cap is only a constraint if discovery runs are triggered very frequently or many notifications fire simultaneously.

### TypeScript usage pattern

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Notify admin of items needing review
const { data, error } = await resend.emails.send({
  from: "Discovery Agent <discovery@empowered.vote>",
  to: ["admin@empowered.vote"],
  subject: `Candidate Discovery: ${stagingCount} items need review`,
  html: `<p>${stagingCount} candidates found and staged for review.</p>
         <p><a href="${ADMIN_URL}/discovery">Open review queue</a></p>`,
});

if (error) {
  logger.error("Email notification failed", { error });
}
```

### Setup requirements

1. Add `RESEND_API_KEY` to Render environment variables
2. Verify the sending domain (`empowered.vote`) in Resend dashboard (DNS TXT record)
3. The `from` address must use the verified domain

---

## 4. Staging/Review Queue

### No additional packages needed

The staging queue is a **database pattern**, not a package. Implement with new Postgres tables in the `essentials` schema alongside the existing elections, races, and candidates tables.

**Recommended table structure:**

```sql
-- Migration 070: candidate discovery infrastructure
CREATE TABLE essentials.discovery_jurisdictions (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  state           TEXT NOT NULL,
  election_authority_url TEXT,
  official_election_domains TEXT[], -- used as allowed_domains in web search
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE essentials.discovery_runs (
  id              SERIAL PRIMARY KEY,
  jurisdiction_id INT REFERENCES essentials.discovery_jurisdictions(id),
  started_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  status          TEXT CHECK (status IN ('running', 'completed', 'failed')),
  searches_used   INT,
  candidates_found INT,
  error_message   TEXT
);

CREATE TABLE essentials.candidate_staging (
  id              SERIAL PRIMARY KEY,
  run_id          INT REFERENCES essentials.discovery_runs(id),
  jurisdiction_id INT REFERENCES essentials.discovery_jurisdictions(id),
  raw_name        TEXT NOT NULL,
  raw_party       TEXT,
  race_name       TEXT,
  election_date   DATE,
  source_url      TEXT,
  confidence      TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  review_status   TEXT CHECK (review_status IN ('pending', 'approved', 'rejected', 'merged')) DEFAULT 'pending',
  reviewed_by     TEXT,
  reviewed_at     TIMESTAMPTZ,
  candidate_id    INT, -- FK to essentials.candidates once merged
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

**Migration numbering:** Current highest migration is `069_donor_name_normalized.sql`. Next migrations start at `070`.

**No migration framework needed.** The existing pattern uses numbered SQL files applied via `backend/scripts/applyMigrations.ts` using the direct Postgres connection. Continue this pattern.

---

## 5. What NOT to Add

| Package | Why not |
|---------|---------|
| BullMQ / Agenda | Overkill for a single weekly job. Adds Redis dependency (Upstash is already used for other things, but BullMQ requires a separate Redis queue, not a KV store). In-process node-cron is sufficient. |
| Playwright / Puppeteer | The Claude web search tool handles fetching. You do not need a headless browser. |
| Cheerio / html-parser | `node-html-parser` is already in devDependencies if ever needed for fallback parsing. Do not add Cheerio separately. |
| LangChain / LlamaIndex | Anthropic SDK handles the agent loop directly. Claude's tool use is native. LangChain adds abstraction with no benefit here. |
| Bull / Celery equivalent | Discovery runs are not a queue of independent tasks. They are a sequential weekly batch. No queue needed. |

---

## Installation Summary

```bash
cd C:/EV-Accounts/backend

# New dependencies (node-cron is already installed)
npm install @anthropic-ai/sdk resend
```

**New environment variables to add in Render:**

| Variable | Value source |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic Console → API Keys |
| `RESEND_API_KEY` | Resend Dashboard → API Keys |

---

## Confidence Assessment

| Area | Confidence | Source |
|------|------------|--------|
| `@anthropic-ai/sdk` version (0.91.0) | HIGH | GitHub releases page, verified 2026-04-23 |
| Web search tool API shape | HIGH | Official Anthropic docs (platform.claude.com), fetched directly |
| `web_search_20250305` vs `20260209` | HIGH | Official docs confirmed both versions and requirements |
| `allowed_domains` parameter | HIGH | Official docs confirmed parameter behavior |
| Web search pricing ($10/1k) | HIGH | Official docs usage/pricing section |
| `node-cron` already installed | HIGH | Read `backend/package.json` directly |
| Render cron vs in-process | MEDIUM | Render docs confirm separate service model; in-process analysis is architectural inference based on single-instance deployment |
| `resend` version (6.12.0) | MEDIUM | npm search result (npm page returned 403, version from search snippet) |
| Resend free tier limits | HIGH | Fetched from resend.com/pricing directly |
| Migration numbering (next = 070) | HIGH | Listed `backend/migrations/` directory directly |

---

## Sources

- [@anthropic-ai/sdk GitHub releases](https://github.com/anthropics/anthropic-sdk-typescript/releases)
- [Anthropic web search tool docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) — fetched directly
- [Render cron jobs docs](https://render.com/docs/cronjobs)
- [Resend pricing](https://resend.com/pricing)
- [Resend Node.js docs](https://resend.com/docs/send-with-nodejs)
- [node-cron npm](https://www.npmjs.com/package/node-cron)
- [pkgpulse: node-cron vs node-schedule vs croner 2026](https://www.pkgpulse.com/blog/node-cron-vs-node-schedule-vs-croner-task-scheduling-2026)
