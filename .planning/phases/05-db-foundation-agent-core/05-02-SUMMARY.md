---
phase: 05-db-foundation-agent-core
plan: 02
subsystem: discovery-pipeline
tags: [anthropic-sdk, tool-use, web-search, typescript]
requires: []
provides:
  - runDiscoveryAgent function (Anthropic SDK wrapper)
  - DiscoveryAgentInput, DiscoveryAgentResult, DiscoveredCandidate types
  - ANTHROPIC_API_KEY env var wiring
affects: [05-03, 06, 07]
tech-stack:
  added: ["@anthropic-ai/sdk"]
  patterns: ["forced tool_choice for citation-required structured output", "server-side web_search_20250305"]
key-files:
  created: [backend/src/lib/discoveryAgentRunner.ts]
  modified: [backend/src/lib/env.ts, backend/package.json]
key-decisions:
  - "forced tool_choice=report_candidates — only reliable way to get typed JSON back; any/auto lets Claude pick wrong tool"
  - "web_search max_uses=1 with sourceUrl, 2 without — prevents quota exhaustion"
  - "model hard-coded to claude-opus-4-6 for Opus multi-tool decision quality"
  - "ANTHROPIC_API_KEY is optional in env.ts — absent degrades discovery, does not crash server at startup"
duration: 20min
completed: 2026-04-23
---

# Phase 5 Plan 02: discoveryAgentRunner.ts Summary

**Anthropic SDK wrapper enforcing citation-required structured output via forced tool_choice=report_candidates with server-side web_search_20250305; @anthropic-ai/sdk installed and ANTHROPIC_API_KEY wired into env.ts**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-04-23T00:00:00Z
- **Completed:** 2026-04-23T00:20:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Installed @anthropic-ai/sdk in backend dependencies
- Added ANTHROPIC_API_KEY to env.ts as optional service key (consistent with FEC_API_KEY pattern)
- Created discoveryAgentRunner.ts: pure DB-free module that forces Claude to call report_candidates tool, ensuring every candidate has a citation_url before it reaches the service layer
- Defensive post-filter drops any candidate missing citation_url (belt-and-suspenders against schema drift)

## Task Commits

1. **Task 1: Install SDK + env.ts** — `1c81dad` (chore)
2. **Task 2: Create discoveryAgentRunner.ts** — `bf8d8e1` (feat)

## Files Created/Modified

- `C:\EV-Accounts\backend\src\lib\discoveryAgentRunner.ts` — Anthropic SDK wrapper, exports runDiscoveryAgent + type interfaces
- `C:\EV-Accounts\backend\src\lib\env.ts` — ANTHROPIC_API_KEY added as optional service key
- `C:\EV-Accounts\backend\package.json` — @anthropic-ai/sdk added to dependencies
- `C:\EV-Accounts\backend\package-lock.json` — lockfile updated

## Decisions Made

- `tool_choice: { type: 'tool', name: 'report_candidates' }` — forces Claude to always call this tool as final output; 'any' or 'auto' would let Claude pick web_search as its final call, hitting max_tokens without structured results
- `web_search max_uses: 1` when sourceUrl provided, `2` when not — prevents quota exhaustion (rate limit headroom concern from STATE.md)
- Model hard-coded to `claude-opus-4-6` — Opus handles multi-tool decisions better per research
- `ANTHROPIC_API_KEY` as `z.string().optional()` — consistent with FEC_API_KEY, QUEST_SERVICE_KEY; absent key degrades discovery, doesn't crash server at startup

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

discoveryAgentRunner.ts is ready for import by discoveryService.ts (Plan 05-03). The module is DB-free and can be imported and called with any DiscoveryAgentInput. ANTHROPIC_API_KEY must be set in backend .env before live agent calls work.
