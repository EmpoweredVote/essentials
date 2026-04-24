# Project Research Summary

**Project:** v2.1 Claude Candidate Discovery
**Domain:** AI-powered civic data discovery - challenger candidate ingestion for ballot display
**Researched:** 2026-04-23
**Confidence:** HIGH

## Executive Summary

The v2.1 milestone adds an automated candidate discovery pipeline to the existing EmpoweredVote backend. The system uses Claude web search to extract challenger candidates from official election authority sites, routes discoveries through a confidence-gated staging queue, and upserts approved records into the existing race_candidates table. The infrastructure footprint is deliberately minimal: node-cron is already installed, emailService.ts already exists, and the race_candidates table already supports NULL politician_id rows for challengers. Only two new npm packages are required (@anthropic-ai/sdk, resend), and all new logic lives in-process within the existing Render web service.

The recommended approach is a three-phase build: foundation (DB tables + agent runner, manually triggered, output reviewed via direct SQL), then operationalization (admin review UI + email notifications + on-demand trigger), then automation (weekly cron + confidence-based auto-upsert). This sequence is non-negotiable. Enabling auto-upsert before confidence scoring has been validated against real election data is the fastest path to voter misinformation. Every discovered candidate must flow through candidate_staging and human approval before touching race_candidates.

The top systemic risks are hallucinated candidate names (Claude synthesizing from news rather than filing records), source URL rot (government sites change election-cycle IDs silently), and stale withdrawal status (candidates who un-file remain live). All three require proactive architecture decisions in Phase 1: citation-required output schema, a zero-candidate regression alert, and a compare-not-add-only discovery loop. Name normalization is the deduplication linchpin. Without a canonical format applied at every insertion point, fuzzy matching will both over-flag real duplicates and under-catch variant spellings of the same person.

---

## Key Findings

### Recommended Stack

The backend stack is unchanged (Express/TypeScript, Postgres/PostGIS, Supabase, Render). Two packages are new. @anthropic-ai/sdk (v0.91.0) provides the Claude agent with web search using the web_search_20250305 tool. The allowed_domains parameter pins searches to official election authority URLs stored per jurisdiction, preventing news-site contamination. resend (v6.12.0) handles admin email on Render free tier (3,000/month, 100/day), consistent with the existing emailService.ts pattern. node-cron 4.2.1 is already installed - zero infrastructure change for scheduling.

**Core technologies:**
- @anthropic-ai/sdk v0.91.0: Claude agent with server-side web search - recommended over Playwright/Cheerio because LLM handles heterogeneous HTML/Excel/PDF structures that break CSS selectors when government sites update
- node-cron 4.2.1: Already installed - weekly cron runs in-process on single-instance Render web service; no separate Render Cron service needed
- resend v6.12.0: Admin email notifications - permanent free tier sufficient; SendGrid eliminated free tier May 2025
- pool.query() (existing): All three new tables use the existing Postgres pool; no new DB client
- emailService.ts (existing): Import sendEmail() directly - already integrated with Resend, degrades gracefully when key absent

**Critical prerequisite:** Web search must be enabled org-wide in Anthropic Console (console.anthropic.com/settings/privacy) before the API tool works. This is a one-time admin toggle, not a code change.

### Expected Features

Official election authority sources have no unified API. LA County uses a JavaScript app with per-election query parameters (the id query parameter on lavote.gov/Apps/CandidateList changes each cycle). Indiana SoS provides Excel downloads for state/federal races only; county-level races require county clerk sites or Ballotpedia fallback. California CAL-ACCESS bulk dump is structured but requires joining across multiple tables. Claude web search with allowed_domains is the correct abstraction for handling this heterogeneity.

**Must have (table stakes):**
- Jurisdiction registry table with official_election_domains[] (enables deterministic confidence scoring), election_authority_url, election_date, filing_deadline, local_races_source enum
- Claude discovery agent returning structured JSON with citation URL per candidate - no citation means low-confidence, never auto-upsert
- Two-signal confidence scoring: official domain check (from allowlist) AND fuzzy DB match against races.position_name; Claude self-reported score alone is insufficient
- candidate_staging table as the mandatory gate - every discovered candidate enters here first, regardless of confidence
- discovery_runs log with raw_agent_output JSONB column for hallucination audit trail
- Admin review UI with per-item race context, source URL link, and one-click approve/reject (extending existing UnresolvedQueue.jsx pattern)
- Approve action upserts to race_candidates with is_incumbent=false, candidate_status filed, politician_id NULL
- Reject action marks staging row rejected
- Admin email shows count of staged items plus count of items for elections within 30 days (urgency signal, not just volume)
- Withdrawal detection: each discovery run compares full discovered list against current DB state; candidates present in DB but absent from source are flagged for admin review, never auto-deleted
- Sequential jurisdiction processing: one at a time, with delay between Claude calls - parallel runs exhaust rate limits with no usable output

**Should have (differentiators):**
- Election-proximity-aware scheduling: weekly during filing window, daily during pre-election sprint (filing-deadline + 14 days through election day)
- Source URL and source excerpt stored per staging row (admin can verify with one click)
- Fuzzy name match at approve time (pg_trgm, 0.80 threshold on normalized names) to catch Mike Smith vs Michael Smith
- On-demand trigger endpoint for bootstrapping new jurisdictions without waiting for cron
- DB-level run lock (check status = running before starting) to prevent simultaneous runs from cron and manual trigger

**Defer (v2+):**
- Discovery run metrics dashboard (no data volume to display yet)
- Diff view on re-discovery (requires staging version history)
- New jurisdiction onboarding wizard (manual SQL seed is fine initially)
- Auto-upsert for high-confidence results (enable only after confidence scoring is validated against real data)
- Election-proximity-aware scheduling (weekly cron is sufficient for initial launch)

### Architecture Approach

All new logic is in-process within the existing Express backend at C:/EV-Accounts/backend/src. Four new files: lib/discoveryService.ts (orchestration and DB ops), lib/discoveryAgentRunner.ts (Anthropic SDK wrapper, isolated for testability), routes/essentialsDiscovery.ts (HTTP surface: trigger, queue, approve/reject), cron/discoveryCron.ts (weekly sweep registration). Two existing files modified: index.ts (register router and start cron) and lib/env.ts (add ANTHROPIC_API_KEY). All three new DB tables land in the essentials schema. Migration numbering starts at 070 (current highest is 069_donor_name_normalized.sql).

**Major components:**
1. discoveryAgentRunner.ts: Anthropic SDK call with web_search_20250305 tool; returns structured JSON per candidate with full_name, office_name, source_url, source_excerpt, is_incumbent, confidence; isolated module enables standalone testing against live election sites before wiring to service layer
2. discoveryService.ts: Orchestrates the full run (load jurisdiction, create run row, call agent, normalize names, dedup check, write staging, update run log, send email); also implements getQueue(), approveCandidate(), rejectCandidate(); approveCandidate() upserts to race_candidates with exact-match then fuzzy-match dedup guard
3. essentialsDiscovery.ts (route): POST /trigger/:id returns 202 immediately, runs async; GET /queue lists staging rows; PATCH /queue/:id/approve and /reject; all protected by requireAdminToken
4. discoveryCron.ts: weekly schedule iterates enabled jurisdictions sequentially via for...of loop (never Promise.all)
5. Three new essentials.* tables: discovery_jurisdictions (registry), discovery_runs (audit log with JSONB raw output), candidate_staging (review queue with partial unique index preventing same name+office twice per run)

### Critical Pitfalls

1. **Hallucinated candidate names** - Claude synthesizes names from news context, not filing records. Mitigation: require source_url for every candidate; run a second-pass fetch confirming the name appears verbatim on the cited page before staging; any candidate without a citation is immediately low-confidence and never auto-upserts.

2. **Source URL rot** - Government sites change election-cycle page IDs silently. The lavote.gov id parameter changes each cycle; Indiana SoS uses year-templated Excel URLs. Mitigation: alert when any jurisdiction returns zero candidates after previously returning non-zero; store source_url in the registry so URL updates require only a DB row change, not a code deploy.

3. **Withdrawal not detected** - Discovery adds but never removes; withdrawn candidates stay live. Mitigation: each run produces a full candidate list and compares against DB state; candidates in DB but absent from source are flagged for admin review with reason "no longer appears on official source"; no auto-deletion ever.

4. **Duplicate from name variants** - "JOHN Q. SMITH III" (agent output) vs "John Smith" (Cicero import) fails exact match and may fail fuzzy match. Mitigation: canonical normalization (first + last, title case, no middle initial, no suffix) applied at every insert point; fuzzy match uses normalized form at 0.80 threshold; any match below exact goes to staging, never auto-upsert.

5. **Parallel jurisdiction processing** - Running all jurisdictions simultaneously on cron hits 429s mid-batch. Mitigation: sequential for...of loop with delay; exponential backoff on 429; upgrade to Anthropic Tier 2 ($40 deposit) before scaling beyond 5 jurisdictions.

---

## Implications for Roadmap

Based on combined research, three phases are recommended. The sequence is dependency-driven: you cannot validate confidence scoring without first having the agent produce real output, and you should not automate before confidence scoring is validated.

### Phase 1: Agent Core + DB Foundation

**Rationale:** The agent and name normalization utility are the highest-risk components. They interact with live government sites, produce output that can harm voters if wrong, and require validation before any automation. Build them first in the most visible possible mode (manual trigger, output reviewed directly in Postgres) so problems surface before any cron or auto-upsert exists.

**Delivers:** Three DB migrations (070-072); discoveryAgentRunner.ts callable standalone; discoveryService.runDiscoveryForJurisdiction() callable from a test script; staging rows visible in DB with correct confidence labels and source URLs.

**Addresses:** Jurisdiction registry, Claude discovery agent (state/federal and local), confidence classification, candidate_staging and discovery_runs tables, name normalization utility, citation-required output schema, withdrawal comparison loop.

**Avoids:** Hallucination pitfall (citation requirement + second-pass verification), name variant duplicate pitfall (canonical normalization function), stale withdrawal pitfall (compare-not-add-only loop).

**Research flag:** Needs phase-level research on Anthropic rate limits for claude-sonnet-4-6; structured output via tool use vs JSON-in-text; whether election authority page content fits in a single context window. Also needs architectural decision: does approveCandidate() create a races row if none exists, or require a pre-existing race?

### Phase 2: Admin Review UI + Email + On-Demand Trigger

**Rationale:** With a validated agent, operationalize it for non-developer admin use. The registry formalizes the official_election_domains metadata that drives confidence scoring. The review UI makes the staging queue actionable without DB access. Email notifications close the feedback loop.

**Delivers:** Admin review queue page (extending UnresolvedQueue.jsx); approve/reject API endpoints wiring to race_candidates upsert; Resend-based email with urgency-aware subject line; on-demand trigger endpoint; zero-candidate regression alert in email.

**Uses:** resend npm package, existing emailService.ts, existing requireAdminToken middleware, existing UnresolvedQueue.jsx pattern.

**Addresses:** Admin review UI, approve/reject actions, email notifications, fuzzy-match dedup guard at approve time, on-demand trigger, source URL rot regression detection.

**Avoids:** Review queue becoming an ignored bottleneck (urgency-aware email: items older than 7 days and items for elections within 30 days); auto-upsert bypassing human gate before confidence is proven.

**Research flag:** Standard patterns - no additional research phase needed.

### Phase 3: Cron Automation + Auto-Upsert (Post-Validation Only)

**Rationale:** Only after Phase 2 has produced real discovery runs reviewed by humans and validated as accurate does it make sense to automate. Cron and auto-upsert are efficiency features, not trust features - those are in Phases 1 and 2.

**Delivers:** Weekly node-cron sweep processing all enabled jurisdictions sequentially; auto-upsert path for candidates meeting dual-signal high-confidence criteria (official domain + fuzzy DB race match); DB-level run lock preventing simultaneous runs.

**Implements:** discoveryCron.ts; auto-upsert branch in discoveryService.approveCandidate(); sequential processing loop with exponential backoff on 429.

**Avoids:** Rate limit exhaustion (sequential for...of with delays, exponential backoff); simultaneous run conflicts (status check before starting); stale withdrawal accumulation (comparison loop from Phase 1 now runs automatically on schedule).

**Research flag:** Validate rate limit headroom with a 3-jurisdiction test batch before enabling against full jurisdiction list.

### Phase Ordering Rationale

- Phase 1 before Phase 2: Admin UI is useless without a working agent producing staging rows to review
- Phase 2 before Phase 3: Cron and auto-upsert must not run unsupervised before confidence scoring has been validated against real election data
- Name normalization in Phase 1, not later: Once duplicate records exist in race_candidates, cleanup is expensive; the dedup logic must be correct from the first insert
- Withdrawal comparison loop in Phase 1, not deferred: PITFALLS.md identifies this as an architectural must-have. Once the agent produces output, every run must compare against DB state. Retrofitting this later risks a window of stale withdrawn candidates going live.

### Research Flags

Needs deeper research during planning:
- **Phase 1 (Agent Core):** Anthropic API rate limits for claude-sonnet-4-6 at current tier; structured output approach (tool use vs JSON-in-text); context window fit for large SoS pages
- **Phase 1 (Approval Path):** Does approveCandidate() need to create a races row if none exists, or require a pre-existing race? Recommendation: require pre-existing race; flag staging candidates with no matching race as flagged=true with flag_reason "no matching race in DB"

Standard patterns - no research phase needed:
- **Phase 2 (Admin UI):** UnresolvedQueue.jsx pattern is a direct analog; well-understood in codebase
- **Phase 2 (Email):** Resend API and existing emailService.ts integration are documented and proven
- **Phase 3 (Cron):** node-cron is already in use in the backend; in-process scheduling pattern is established

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | node-cron installation confirmed by reading package.json directly; @anthropic-ai/sdk v0.91.0 verified from GitHub releases; web search tool API shape confirmed from official Anthropic docs; Resend free tier confirmed from resend.com/pricing |
| Features | HIGH | LA County, Indiana SoS, and CA CAL-ACCESS source structures all verified by direct page fetch; Anthropic structured outputs docs confirmed confidence_score field; feature categorization grounded in verified source behavior, not assumptions |
| Architecture | HIGH | Backend file structure confirmed by direct codebase inspection; race_candidates NULL politician_id pattern confirmed from migration 042; emailService.ts existence confirmed; migration numbering (next = 070) confirmed by reading migrations directory |
| Pitfalls | HIGH | Rate limit values from official Anthropic docs; government site URL rot confirmed by directly observing lavote.gov election ID parameter and Indiana year-templated Excel URL; name variant problem confirmed by existing discover-cal-access-candidates.ts in codebase |

**Overall confidence:** HIGH

### Gaps to Address

- **Anthropic rate limit stress test:** Tier 1 is 50 RPM. Validate with a 3-jurisdiction test batch before enabling Phase 3 cron sweep.
- **Race row pre-existence requirement:** approveCandidate() behavior when no matching race row exists must be decided in Phase 1 planning. Recommended resolution: require pre-existing race; flag staging rows with no match as flagged=true.
- **Indiana local races coverage gap:** Indiana SoS Excel file covers state and federal only. Scope v2.1 Indiana discovery to state and federal; document local races as a known gap. Ballotpedia fallback requires a separate agent strategy.
- **lavote.gov election ID per-cycle:** The id query parameter changes each election cycle. Document as a mandatory manual update step when setting up each new election cycle for LA-region jurisdictions.

---

## Sources

### Primary (HIGH confidence)
- Anthropic web search tool docs (platform.claude.com) - tool versions, allowed_domains parameter, pricing at $10 per 1,000 searches
- @anthropic-ai/sdk GitHub releases - version 0.91.0 confirmed
- Resend pricing (resend.com/pricing) - free tier limits confirmed: 3,000/month, 100/day
- LA County candidate list (lavote.gov/Apps/CandidateList/Index) - direct page inspection confirming HTML structure and election ID URL pattern
- IN SoS candidate information (in.gov/sos/elections/candidate-information/) - confirmed Excel format, state+federal only
- Anthropic rate limits docs (platform.claude.com/docs/en/api/rate-limits) - Tier 1/2 limits
- /c/EV-Accounts/backend/package.json - confirmed node-cron 4.2.1 already installed
- /c/EV-Accounts/backend/migrations/ - confirmed migration 069 is highest; next = 070
- /c/EV-Accounts/backend/src/ - confirmed layered architecture, emailService.ts, requireAdminToken, cron patterns

### Secondary (MEDIUM confidence)
- Anthropic structured outputs docs - confidence_score field confirmed in schema
- CA SoS CAL-ACCESS raw data - bulk dump format confirmed
- Render cron job docs - single-execution guarantee confirmed for Render-managed cron
- Democracy Works / Ballot Information Project - filing deadline and pre-election sprint timing patterns
- Indiana Citizen 2026 primary list - confirmed state+federal scope only; local races absent

### Tertiary (informational, not load-bearing)
- OWASP LLM09 Misinformation risk - hallucination risk framing
- Spotify Engineering confidence scoring case study (2024) - rule-augmented scoring pattern

---
*Research completed: 2026-04-23*
*Ready for roadmap: yes*
