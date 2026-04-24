# Domain Pitfalls: Claude Candidate Discovery

**Domain:** AI-powered civic election data discovery
**Researched:** 2026-04-23
**Stack:** Express/TypeScript, Claude API (Anthropic SDK), PostgreSQL/PostGIS, Render

---

## Critical Pitfalls

Mistakes that cause voter misinformation, data corruption, or system-level failures requiring manual recovery.

---

### Pitfall 1: Claude Hallucinating Candidate Names Without Source Verification

**What goes wrong:** Claude returns a plausible-sounding candidate name that does not actually appear on the official source page. Because Claude is generating from web search, it may synthesize a name from news coverage, speculation, or adjacent context — not the official filing record.

**Why it happens:** LLMs operating in agentic web-search mode treat all search results equally. A news article saying "five candidates are expected to file" can produce hallucinated names that never actually filed. Claude's confidence in these names is often indistinguishable from real ones.

**Consequences:** A fabricated candidate appears on the ballot display seen by real voters. Given the antipartisan mission, this is a severe trust failure — the app would be spreading misinformation about who voters can actually vote for.

**Prevention:**
- Require Claude to return a citation URL for every discovered candidate. Treat any candidate without a citation as low-confidence, never auto-upsert.
- After Claude returns names, verify each name against the source URL via a second-pass fetch — confirm the name literally appears on the page.
- Use a two-signal rule for auto-upsert: the name must appear in official DB data (Cicero) AND on an official source URL. One signal alone gates to staging queue.
- Prompt Claude to explicitly say "not found on source" rather than guessing from context.

**Detection:** Spot-check the discovery run log by fetching the citation URL for a sample of auto-upserted candidates. If the name does not appear verbatim on the page, the verification step is broken.

**Phase:** Address in Phase 1 (Agent Core). The citation-verification loop must be part of the initial agent design, not retrofitted.

---

### Pitfall 2: Source URL Rot Between Discovery Runs

**What goes wrong:** The URL for a county clerk's candidate filing page changes — a new election cycle page replaces the old one, or the site switches from a static HTML table to a JavaScript SPA. The agent silently returns zero candidates, and the weekly cron treats it as "no new candidates" rather than "agent broken."

**Why it happens:** Government websites are updated per-election with little versioning. LA County (lavote.gov/Apps/CandidateList) already shows a JavaScript app with a query parameter election ID (`?id=4338`). That ID will change for the next election. Indiana's SOS uses Excel downloads at a year-templated URL. These are intentional "updates" by the election authority, invisible to the agent.

**Consequences:** Candidates who file in a new election cycle never appear in the system. The admin never learns the agent is broken. The app shows "no candidates" races instead of newly filed candidates.

**Prevention:**
- Store a `last_candidate_count` per jurisdiction in the discovery run log. Alert if a run returns zero when the previous run returned non-zero (regression detection).
- Store the source URL in the jurisdiction registry, not hard-coded in agent logic. When a URL breaks, update one config row — not code.
- Build a "health check" run mode that fetches the source URL and confirms the page is reachable and parseable, separate from candidate ingestion.
- For lavote.gov specifically: the election ID in the URL will need to be updated per-election cycle. Document this as a mandatory onboarding step for each new election.

**Detection:** Discovery run log shows `candidates_found: 0` for a jurisdiction that previously returned candidates. Alert threshold: any jurisdiction returning 0 for two consecutive weeks during an active filing period.

**Phase:** Address in Phase 2 (Jurisdiction Registry). The registry must include a `source_url_verified_at` timestamp and a health check mechanism.

---

### Pitfall 3: Candidate Withdrawal Not Reflected — Stale Filing Shown as Active

**What goes wrong:** The agent discovers a candidate during the filing period, upserts them, and the candidate later withdraws. Official sources update their pages, but the weekly cron does not re-check existing candidates for withdrawal status. The withdrawn candidate continues to appear on the app.

**Why it happens:** Discovery scripts are designed to add new records; they do not currently have a removal or status-update path. Withdrawal is a post-filing event that occurs after the filing deadline — Indiana allows withdrawal up to 2 days after filing closes; Louisiana allows 7 days; California has its own window. The official page may show the candidate as withdrawn or simply remove them from the list.

**Consequences:** A voter sees a withdrawn candidate on the ballot display. If they research that candidate expecting to see them in November, they will not be on the ballot. This is voter misinformation.

**Prevention:**
- Each weekly discovery run for a jurisdiction should produce a full candidate list and compare it against the current DB state. Candidates present in DB but absent from the source should be flagged — not deleted — and sent to the admin review queue with reason "no longer appears on official source."
- Never auto-delete. Withdrawals must go through human confirmation before the candidate is marked `withdrawn` in the DB.
- Build the candidate status comparison as part of Phase 1 agent design, not Phase 3 or later.
- Add a `ballot_status` field or use an existing `is_active` field to distinguish "filed," "withdrawn," and "on ballot" states.

**Detection:** Admin receives a weekly diff showing "candidates in DB not found on source this week." If this list is never reviewed, withdrawals will not be caught.

**Phase:** Address in Phase 1 (Agent Core) for the comparison logic; Phase 3 (Staging Queue) for the admin notification workflow.

---

### Pitfall 4: Duplicate Records — Cicero Incumbent Plus Discovered Challenger With Same Name

**What goes wrong:** The Cicero API populates incumbents via the existing seeding process. The Claude agent independently discovers a new candidate whose name is identical or near-identical to an existing politician in the DB (e.g., "Mike Smith" running for a different office, or "Michael Smith" vs. "Mike Smith" for the same office). The upsert creates a duplicate `essentials.politicians` row, resulting in the candidate appearing twice on the ballot display — once as an incumbent with a profile and once as a discovered entry with no data.

**Why it happens:** The existing discovery scripts (Cal-Access, Indiana) already encounter this: they check `lower(full_name) = lower($1)` for exact match, but not for name variations. A Claude-powered agent using web search may extract "Mike Smith" from a source while the DB has "Michael Smith" from Cicero. These match the same person but fail the equality check.

**Consequences:** Ballot display shows duplicate candidates. The deduplication logic for candidate ordering (seeded shuffle) does not protect against true duplicates — both rows appear independently. If one has a photo and one does not, the display is visually broken and confusing.

**Prevention:**
- Before inserting any discovered candidate, run a three-step deduplication check:
  1. Exact match on `lower(full_name)` within the same race.
  2. Fuzzy match via pg_trgm similarity (threshold ~0.85) within the same race.
  3. Check `politician_sources` for the `external_id` from the official source (e.g., Cal-Access filer ID, lavote.gov candidate ID).
- Any fuzzy match (not exact) must go to the staging queue, never auto-upsert.
- For the Claude agent specifically: include the race/office/district as part of the deduplication key. "Mike Smith" in District 5 City Council is distinct from "Mike Smith" in State Assembly.
- Add a `UNIQUE` constraint or partial unique index on `(race_id, politician_id)` in the candidates-to-races join table to prevent the same person appearing twice in the same race.

**Detection:** Ballot display shows two candidates with near-identical names in the same race. Also detectable by querying: `SELECT race_id, lower(p.full_name) FROM ... GROUP BY 1,2 HAVING count(*) > 1`.

**Phase:** Address in Phase 1 (Agent Core) for deduplication logic; Phase 2 (Staging Queue) for the fuzzy-match review flow.

---

### Pitfall 5: Auto-Upsert of Low-Confidence Discoveries Bypasses the Human Gate

**What goes wrong:** The confidence scoring logic has a threshold bug or edge case. A candidate with a LOW confidence signal gets auto-upserted because the code misclassifies the source type (e.g., a news article URL is mistaken for an official `.gov` source URL), or the threshold check is inverted, or an exception path skips the gate entirely.

**Why it happens:** Confidence scoring is implemented in application code and is easy to get wrong under pressure. The "official source" detection (is this a `.gov` or official election authority domain?) sounds simple but has edge cases: lavote.gov is official; abc7.com/news/candidate-files is not; ballotpedia.org is authoritative but not official. The boundary is non-trivial.

**Consequences:** Unverified candidates go live to voters without admin review. Because the discovery system is automated and runs weekly, incorrect auto-upserts may accumulate before anyone notices.

**Prevention:**
- Maintain an explicit allowlist of official source domains per jurisdiction (e.g., `sos.ca.gov`, `lavote.gov`, `in.gov`). Only domain-matched sources qualify as "official" for auto-upsert.
- Default confidence to LOW if domain is not on the allowlist, regardless of Claude's self-assessed confidence.
- Log the confidence decision and the source domain for every candidate processed. Include in the run log email.
- Write unit tests for the confidence scoring function with edge cases: news article URLs, Ballotpedia URLs, `.gov` subdomains, and redirecting URLs.
- Implement a hard limit on auto-upserts per run (e.g., max 20 per jurisdiction per week). Anything above this threshold triggers a human review even if confidence is HIGH — a burst of new candidates is unusual and warrants verification.

**Detection:** Review the discovery run log for each run. Auto-upserted candidates should have a `source_url` from the official domain allowlist. Any without this should be investigated.

**Phase:** Address in Phase 1 (Agent Core). Confidence scoring is the most trust-critical component of the system.

---

## Moderate Pitfalls

Mistakes that cause delays, wasted admin time, or data quality degradation.

---

### Pitfall 6: Cron Job Accumulation on Render

**What goes wrong:** The scheduled discovery runs accumulate or overlap. Either a new weekly run starts before the previous one completes (unlikely on Render's native cron service, but possible if using `node-cron` inside the Express process), or on-demand triggers fired by the admin stack up multiple simultaneous runs.

**Why it happens:** Render's native cron service guarantees at-most-one running instance and postpones the next scheduled run until the current one completes (verified from Render docs). However, this guarantee only applies to Render-managed cron jobs. If discovery is triggered via an Express API route (`POST /admin/discovery/run`), multiple admin clicks or API calls can queue multiple simultaneous runs. Additionally, if the Express process itself implements the weekly cron via `node-cron` rather than Render's cron service, the guarantee is lost.

**Consequences:** Multiple simultaneous Claude API calls for the same jurisdiction blow through rate limits, create duplicate staging queue entries, and produce conflicting DB writes. The admin receives multiple near-identical email notifications.

**Prevention:**
- Use a DB-level lock for discovery runs: `INSERT INTO discovery_locks (jurisdiction_id, started_at) ... ON CONFLICT DO NOTHING`. If the insert fails (conflict), skip and log. This works regardless of whether runs originate from cron or admin trigger.
- For the weekly schedule: use Render's native cron service (not `node-cron` in Express). Render guarantees single execution.
- For on-demand triggers: implement a 60-second debounce or a run status check — if a run is already `in_progress` for a jurisdiction, return 409 Conflict instead of starting a new one.
- Store `run_status` in the discovery run log (`pending`, `in_progress`, `complete`, `failed`). Check this before starting any new run.

**Detection:** Discovery run log shows multiple rows for the same jurisdiction with overlapping `started_at` and `completed_at` timestamps.

**Phase:** Address in Phase 2 (Cron + On-Demand Trigger). The lock mechanism is required before any production scheduling.

---

### Pitfall 7: Claude API Rate Limiting During Batch Discovery

**What goes wrong:** A full sweep of all registered jurisdictions in one weekly batch triggers Claude API rate limits. At Tier 1, Claude Sonnet 4.x allows only 50 RPM and 30,000 ITPM. With 10+ jurisdictions, each requiring multiple web-search calls, the batch hits 429 errors. Error handling falls back to retrying immediately, which worsens the rate limit situation.

**Why it happens:** Claude API rate limits apply at the organization level across all models in the same tier family. A weekly cron that fires off all jurisdiction discovery jobs simultaneously will burst-exceed the per-minute limits, especially if each discovery agent makes 5-10 Claude calls per jurisdiction (one per race category, or one per page of results).

**Consequences:** Discovery runs fail mid-batch, leaving some jurisdictions processed and others not. The run log shows partial results. If retries are not idempotent, partial runs may insert some candidates correctly and miss others.

**Prevention:**
- Process jurisdictions sequentially with a delay between each (e.g., 5 seconds minimum between Claude calls). This sacrifices parallelism but respects rate limits.
- Implement exponential backoff on 429 responses with a `retry-after` header reader (Anthropic returns this header).
- Use `node-cron` or Render cron to spread jurisdiction discovery across the week rather than running all jurisdictions on Monday morning: stagger them (jurisdiction A on Monday, B on Tuesday, etc.).
- Log rate limit events in the discovery run log so they are visible in the admin email summary.
- Upgrade to Tier 2 ($40 deposit) before scaling to more than 5 jurisdictions — Tier 2 allows 1,000 RPM vs Tier 1's 50 RPM.

**Detection:** Discovery run log shows `429` error codes or incomplete runs. Claude API console shows rate limit utilization spikes.

**Phase:** Address in Phase 2 (Cron + Scheduling). Rate limit strategy must be designed before the first multi-jurisdiction batch run.

---

### Pitfall 8: Official Site Returns Outdated Pre-Filing-Period Data

**What goes wrong:** The agent discovers "candidates" from a page that is still showing the previous election's data. California's SOS Cal-Access page defaults to showing the current election's data but sometimes caches stale data during the transition between election cycles. LA County's lavote.gov candidate list uses an election ID in the URL — using an old ID returns old data, appearing valid.

**Why it happens:** Election authority websites do not always clearly label which election cycle a page refers to. The agent has no ground truth for what the current filing period dates are. Cal-Access shows "2026 PRIMARY" in a dropdown, but the page header may not include a date. A web search for "2026 primary election candidates" may return results from a page still showing preliminary or pre-filing data.

**Consequences:** Candidates from 2024 appear in 2026 races. Because the data looks official (it comes from `.gov`), the confidence score is HIGH and they auto-upsert. Voters see 2024 candidates listed for 2026 races.

**Prevention:**
- The jurisdiction registry must include `election_date` and `filing_close_date` for each jurisdiction. The agent should refuse to ingest candidates before `filing_close_date` — the candidate list is not authoritative until filing closes.
- The source URL for candidate lists should be verified to include the correct election cycle year. Add a URL validation step that checks the page contains the expected election year before trusting its candidate list.
- Include election cycle year in the agent prompt: "Find candidates for the June 2, 2026 primary election." Require the agent to confirm the page represents the 2026 cycle.

**Detection:** Ingest dates on candidates in the run log do not match the expected election cycle. Candidate names from 2024 races reappear in 2026 discovery.

**Phase:** Address in Phase 2 (Jurisdiction Registry). Election date fields are required inputs, not optional metadata.

---

### Pitfall 9: Name Normalization Inconsistency Between Agent Output and DB

**What goes wrong:** Claude extracts "JOHN Q. SMITH III" from the official source. The deduplication check compares against "John Smith" in the DB (entered by the Cicero import with middle-initial stripped). The names fail exact-match deduplication. A fuzzy match at 0.85 similarity may also miss them because the full-with-middle version and the short version differ more than the threshold. A duplicate is created.

**Why it happens:** The existing discovery scripts already encounter this: Indiana campaign finance data uses "LAST, FIRST" format with ALL CAPS; Cal-Access uses separate NAMF/NAML fields with mixed-case encoding. Claude extracting names from web search adds another normalization layer. The DB has names in title case without middle initials (Cicero's format). There is no canonical normalization applied consistently.

**Consequences:** Every real person in the system can have multiple records with name variants. The staging queue fills with near-duplicate flagged entries that require manual deduplication — exactly the scenario seen in the Cal-Access script's `flagged_ambiguous_name` report.

**Prevention:**
- Define and enforce a canonical name format in the DB: first name + last name only, title case, no middle initials, no suffixes (Jr./Sr. stripped). Apply this format at insert time in every discovery path.
- When Claude extracts names, normalize them through this canonical function before deduplication check.
- The fuzzy match for deduplication should use the normalized form, not the raw extracted form.
- Store the original extracted name in `politician_sources.notes` for audit purposes.
- Use pg_trgm similarity on the normalized name with a ~0.80 threshold (not 0.85 — "Mike Smith" vs "Michael Smith" scores ~0.73; lowering to 0.70 catches more variants at the cost of more false positives going to the staging queue, which is acceptable).

**Detection:** Two `essentials.politicians` rows for the same person with different name variants. Detectable with a query comparing pg_trgm similarity across all politicians in the same government body.

**Phase:** Address in Phase 1 (Agent Core). Name normalization must be a shared utility used by every discovery path.

---

### Pitfall 10: Admin Review Queue Becomes a Bottleneck — Ignored in Practice

**What goes wrong:** The staging queue is built but not reviewed. Low-confidence candidates accumulate for weeks without action. The admin email notifications are sent but ignored because they arrive without priority context (all items appear equally urgent). Eventually the queue has hundreds of stale items including candidates for elections that have already passed.

**Why it happens:** This is a process failure that starts as a tooling failure. If the review UI is cumbersome (raw JSON, no context about the race, no quick approve/reject action), humans will not use it. If notifications do not convey urgency (e.g., "You have 47 items to review" weekly is ignored; "Election in 3 days, 12 unreviewed candidates" is not), reviews slip.

**Consequences:** Low-confidence candidates never go live. The discovery system adds overhead (Claude API cost, admin emails) with no voter-facing value because the staging queue is never actioned.

**Prevention:**
- The admin review queue must show per-item: race name, jurisdiction, election date, source URL, candidate name, and a one-click approve/reject. No raw JSON.
- Notification emails must include a count of items older than 7 days AND a count of items for elections within 30 days. These are the urgency signals.
- Set a policy: items in the queue for more than 14 days without action trigger a second notification to a different email address (escalation path).
- Add auto-expiry: if a staging item's election date passes without action, mark it `expired` and remove it from the active queue.

**Detection:** Run a query on `staging_candidates` for items older than 14 days. If count is non-zero and growing, the queue is not being reviewed.

**Phase:** Address in Phase 3 (Staging Queue + Admin UI). The review experience is as important as the discovery logic.

---

## Minor Pitfalls

Mistakes that cause technical debt or require code fixes but do not directly harm voters.

---

### Pitfall 11: Discovery Run Log Not Queryable — Unusable for Debugging

**What goes wrong:** The run log is stored as a JSON blob or unstructured text. When a run fails or produces unexpected results, debugging requires reading raw log files rather than querying the DB. Over time, the log fills with data that cannot be filtered, aggregated, or alerted on automatically.

**Prevention:**
- Store run results as structured DB rows: `jurisdiction_id`, `run_type` (scheduled/on-demand), `started_at`, `completed_at`, `candidates_found`, `auto_upserted`, `staged_for_review`, `errors`, `source_url`, `status`.
- Store individual candidate discoveries as child rows linked to the run, not as a JSON blob on the run row.
- This enables queries like "show me all runs for LA County in the last 30 days" and "show all candidates auto-upserted this week."

**Phase:** Address in Phase 2 (Observability). Structured logging is a prerequisite for the admin email notifications.

---

### Pitfall 12: Agent Timeout on Slow Government Sites

**What goes wrong:** A county clerk website is slow (common for government sites under load near filing deadlines). The Claude tool call with web search hangs for 60+ seconds. The Express request times out. The run is marked as failed. The retry logic fires immediately and hits the same slow site again.

**Prevention:**
- Set explicit timeouts on Claude API calls (not just the HTTP client). Use Claude's `max_tokens` as an implicit output constraint, and set a wall-clock timeout via `AbortController`.
- Implement exponential backoff with jitter for retries. Do not retry a failed discovery run immediately — wait at least 10 minutes.
- For the weekly cron, a single jurisdiction failure should not fail the entire batch. Use try/catch per jurisdiction, log the failure, and continue.

**Phase:** Address in Phase 1 (Agent Core). Timeout and retry behavior must be designed from the start.

---

### Pitfall 13: Render Cron Service vs. Express `node-cron` Confusion

**What goes wrong:** The developer implements the weekly schedule using `node-cron` inside the Express process (because it is familiar), not as a Render cron job service. On Render's free/standard tier, Express servers may be spun down between requests. The cron inside the process never fires. Alternatively, if the Express server scales to multiple instances, `node-cron` runs in every instance — producing N simultaneous discovery runs.

**Prevention:**
- Use Render's native cron job service for the weekly schedule. It runs as a separate service from the web server, on a fresh container, with Render's single-execution guarantee.
- The on-demand trigger (admin fires discovery) should call an internal endpoint on the Express server protected by a service-to-service secret, with the DB-level lock (Pitfall 6) as the guard against simultaneous runs.
- Document this architecture decision clearly in the phase plan so it is not accidentally changed.

**Phase:** Address in Phase 2 (Cron + Scheduling Architecture).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Agent Core (citation + verification) | Hallucinated names with no source URL | Require citation for every name; verify name appears on cited page |
| Agent Core (confidence scoring) | News article URL scored as "official" | Explicit domain allowlist per jurisdiction |
| Agent Core (name extraction) | Name variants create duplicates | Normalize all names through canonical function before dedup check |
| Jurisdiction Registry | Source URLs with election-cycle IDs | Require `election_date` and `source_url` per election, not per jurisdiction |
| Upsert Pipeline | Auto-upsert bypasses human gate | Default to staging queue; auto-upsert only with dual-signal confirmation |
| Upsert Pipeline | Withdrawn candidates stay live | Weekly run compares full candidate list and flags removals for review |
| Cron Scheduling | Multiple simultaneous runs | DB-level lock + Render native cron service |
| Cron Scheduling | Rate limits in batch runs | Sequential processing with delay; exponential backoff on 429 |
| Staging Queue | Queue never reviewed | Rich review UI + urgency-aware notifications + auto-expiry |
| Observability | Run log not queryable | Structured DB rows, not JSON blobs |

---

## Sources

- Anthropic rate limits documentation (verified 2026-04-23): https://platform.claude.com/docs/en/api/rate-limits
- OpenNews elections scraping pitfalls (MIT Election Lab / MEDSL): https://source.opennews.org/articles/elections-scraping/
- Render cron job behavior documentation: https://render.com/docs/cronjobs
- LA County Registrar candidate list structure (direct page inspection): https://www.lavote.gov/Apps/CandidateList/Index?id=4338
- California SOS Cal-Access candidate page structure (direct page inspection): https://cal-access.sos.ca.gov/Campaign/Candidates/
- Indiana SOS candidate data format (XLSX only): https://www.in.gov/sos/elections/candidate-information/
- Spotify Engineering confidence scoring case study (2024): https://engineering.atspotify.com/2024/12/building-confidence-a-case-study-in-how-to-create-confidence-scores-for-genai-applications
- OWASP LLM09 Misinformation risk: https://genai.owasp.org/llmrisk/llm092025-misinformation/
- Existing codebase: `/c/EV-Accounts/backend/scripts/discover-cal-access-candidates.ts`, `discover-indiana-candidates.ts`
