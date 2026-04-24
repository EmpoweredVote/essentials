# Feature Landscape — AI Candidate Discovery System

**Domain:** AI-powered civic data discovery for election candidate ingestion
**Researched:** 2026-04-23
**Scope:** Features for milestone v2.1 — Claude-powered candidate and race discovery added to the existing elections app

---

## How This System Works (Verified)

Before listing features, here is what research revealed about how each of the five questions in scope actually functions in practice. This grounds the feature categorization.

### 1. Discovering Candidates from Official Sources

**Official sources have wildly inconsistent structure. There is no unified API.**

| Source | What Exists | Programmatic Access |
|--------|------------|---------------------|
| LA County lavote.gov | HTML table with candidate name, office, district, party, filing status, incumbent flag | Fetchable HTML page (verified). Filters by election year. No JSON API or bulk download found. |
| CA Secretary of State (CAL-ACCESS) | Tab-delimited bulk dump, updated daily. 80 tables, 650+ MB. Candidate intent filings are on paper (Form 501), creating a lag. | Raw data download available at sos.ca.gov. Requires joining FILER_FILINGS_CD across multiple tables to get candidate+office. Complex but structured. |
| CA SoS Power Search | Web UI with office/district/election filters. Contribution-based (not filing-based). | No documented API. HTML scraping required. |
| Indiana SoS — state/federal races | Excel spreadsheet download (.xlsx) with columns: Office, Candidate Name, Party, District, Date Filed, Incumbent. Updated periodically. URL is version-suffixed (not stable). | Download and parse. No streaming API. State+federal only — local races (county, township) not included. |
| Indiana — local races (Monroe County) | County Clerk maintains separate lists. For Monroe County, some races appear on in.gov county pages, Indiana Citizen, and chamber sites. | No structured download. Requires web search or county clerk contact. |
| FEC | JSON API (documented, versioned). Covers federal races only. | HIGH quality. Stable REST API. Not relevant for local/county races. |

**Key discovery finding:** Claude's web search tool with `allowed_domains` pinned to official election authority sites is the right approach. You are not parsing a single clean API — you are extracting structured data from heterogeneous HTML tables, PDFs, and Excel files across different authorities. An LLM handles this semantic extraction better than CSS selectors that break when site structure changes.

**Indiana local races are a gap.** The IN SoS Excel file covers state + federal only. County-level races (Monroe County Commissioner, Assessor, Clerk, Township offices) require either the county clerk's site directly or a secondary source like Ballotpedia. This is the hardest part of the discovery problem for Indiana.

### 2. Confidence Scoring

**Claude's structured output API supports a confidence field natively in the schema.** Verified against current Anthropic docs: you define a `ValidationMetadata` object alongside extracted fields, and Claude populates `confidence_score: float` (0.0–1.0) as part of the constrained JSON output.

The confidence score should be **rule-augmented**, not purely Claude's self-assessment. The system applies deterministic rules on top of Claude's score:

```
final_confidence = 'high' if:
  - source_domain is in jurisdiction.official_election_domains AND
  - candidate name + office matches an existing race in races table (fuzzy match >= 0.85)

final_confidence = 'medium' if:
  - source_domain is in jurisdiction.official_election_domains XOR
  - name+office fuzzy match >= 0.85 (one condition met, not both)

final_confidence = 'low' if:
  - source is not an official domain OR
  - no matching race found in DB
```

This is the correct pattern: Claude provides a raw extraction confidence; the application layer applies domain-knowledge rules. Claude cannot know whether a domain is "official" without being told — the jurisdictions table encodes that knowledge.

### 3. Staging / Review Queue Pattern

**The existing UnresolvedQueue.jsx in this codebase is the direct analog.** It already implements the right pattern for a different domain (campaign finance reconciliation):
- Active vs Dismissed toggle
- Per-row Resolve/Dismiss actions
- In-row sub-form for resolution (linking to existing politician)
- Source filter
- Toast notifications for results
- Refresh button

For candidate discovery, the pattern extends to: **Approve** (upsert to races/race_candidates), **Reject** (dismiss from staging), **Edit** (modify name/office before approving), with the existing politician-search widget pattern reusable for linking discovered candidates to existing DB records.

**Two-tier review:** Literature confirms separating fast triage (Approve/Reject in list view) from deep review (edit details, verify source). For this system at current scale, single-tier with edit-in-place is sufficient.

**SLA note:** No SLA is needed at current scale. The queue is a human-checked inbox, not a customer-facing commitment. Document items as "review within N days" internally once volume is known.

### 4. Jurisdiction Registry Metadata

**Required fields per jurisdiction to make discovery repeatable:**

| Field | Why Needed |
|-------|-----------|
| `name` | Human label ("Monroe County, IN") |
| `state` | 2-letter state code — drives which SoS to search |
| `county_name` | Needed for county clerk lookup |
| `election_authority_url` | The filing portal landing page to start search from |
| `official_election_domains` | String array used as `allowed_domains` in web search tool — pins Claude to authoritative sources only |
| `state_sos_excel_url` | URL to the state SoS Excel candidate list (where available) — provides bulk fallback for state/federal races |
| `local_races_source` | Enum: 'county_clerk_site' | 'state_sos_included' | 'ballotpedia_fallback' — tells the agent which strategy to use for local races |
| `election_date` | Target election date for this discovery run |
| `filing_deadline` | When candidate filing closes — discovery runs before this date see partial data |
| `active` | Boolean — whether to include in scheduled runs |

**OCD identifiers:** The Open Civic Data standard defines `ocd-jurisdiction/country:us/state:in/county:monroe/...` format. These are stable identifiers. Using OCD IDs as a secondary key (not primary) is useful when integrating external civic data sources later, but is not required for this system's first version.

**The critical insight:** `official_election_domains` is what makes confidence scoring deterministic. Without a curated list of official domains per jurisdiction, the system cannot distinguish `lavote.gov` (official) from `indianacitizen.org` (community, not official). This list requires manual curation when adding each jurisdiction — it cannot be automated.

### 5. Scheduled Discovery Cadence

**The right cadence is election-proximity-aware, not fixed.**

Research into FEC pre-election reporting schedules and election administration timelines reveals three distinct phases:

| Phase | When | Recommended Cadence | Rationale |
|-------|------|--------------------|-----------| 
| Off-season | >90 days before election | None / manual only | No active filing, stale data |
| Filing window | Filing-open → filing-deadline | Weekly | Candidates file daily; weekly captures the field without burning searches |
| Pre-election sprint | Filing-deadline + 2 weeks → election day | Daily | Late filers, withdrawals, ballot qualification updates happen rapidly |

**Implementation:** The cron job runs weekly. At each run, it checks `election_date` and `filing_deadline` for each active jurisdiction. If `now > filing_deadline + 14 days AND now < election_date`, it runs daily discovery for that jurisdiction. Otherwise, weekly is sufficient.

**On-demand trigger:** Admin should be able to force a run for any jurisdiction at any time (bootstrap new jurisdiction, investigate a gap). This is a separate API endpoint (`POST /admin/discovery/run/:jurisdictionId`), not a cron concern.

---

## Table Stakes

Features that must exist for this system to work at all. Without these, the system cannot be shipped.

| Feature | Why Required | Complexity | Dependency on Existing Schema |
|---------|-------------|------------|-------------------------------|
| Jurisdiction registry table | Stores official URLs + domains per coverage area; all other features reference it | Low | New table alongside existing `essentials` schema |
| Claude discovery agent — state/federal races | Fetches races + candidates from official SoS source; returns structured JSON with confidence | Medium | Reads `jurisdiction_id`; writes to staging table |
| Claude discovery agent — local races | Same as above but targets county clerk sites; separate strategy needed for IN local vs CA local | Medium-High | Same as above; requires `local_races_source` field in jurisdictions table |
| Confidence classification | Rule layer that applies `high/medium/low` using official domain check + DB fuzzy match | Low | Reads `races` table for fuzzy match against `position_name` |
| Auto-upsert for high-confidence results | When confidence = 'high', immediately insert to `race_candidates` without admin review | Medium | Writes to existing `race_candidates` table; must preserve `candidate_id` linkage pattern |
| Staging queue table | Holds low/medium confidence results pending admin review | Low | New `candidate_staging` table (schema already defined in STACK.md) |
| Discovery run log table | Records every run with status, counts, errors | Low | New `discovery_runs` table (schema defined in STACK.md) |
| Admin review UI — staging queue | Admin sees pending staged candidates, can Approve/Reject/Edit | Medium | Extends existing UnresolvedQueue.jsx pattern; new API endpoints |
| Approve action — upsert to live | Admin clicks Approve → candidate upserts to `race_candidates` | Medium | Must handle duplicate check before insert |
| Reject action — dismiss from staging | Admin dismisses a staged record without upsert | Low | Update `review_status = 'rejected'` in staging table |
| Admin email notification — review needed | Email fires when staging queue has new items after a discovery run | Low | Uses Resend (see STACK.md) |
| Admin email notification — run errors | Email fires when a discovery run fails entirely | Low | Same as above |
| On-demand discovery trigger | Admin can bootstrap any jurisdiction from the admin UI without waiting for cron | Low | New `POST /admin/discovery/run/:id` endpoint |
| Scheduled weekly cron | node-cron job that runs discovery for all active jurisdictions with upcoming elections | Low | node-cron already installed (STACK.md confirms) |

---

## Differentiators

Features that make this system significantly better than alternatives. Not required for MVP, but meaningfully improve quality or scalability.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Election-proximity-aware scheduling | Runs daily near elections, weekly otherwise — reduces stale data without wasting searches | Medium | Requires `election_date` + `filing_deadline` in jurisdictions table |
| Source URL tracking per candidate | Every staged candidate carries the URL Claude extracted it from — admin can verify with one click | Low | `source_url` column in staging table; rendered as link in admin UI |
| Fuzzy name match on approval | When admin approves a staged candidate, system checks if that name already exists in `race_candidates` to prevent duplicates | Medium | Levenshtein distance or pg_trgm on `full_name` in Postgres |
| Diff view on re-discovery | If a staged candidate was previously rejected, show the delta vs. the rejected record — prevents re-adding stale duplicates | High | Requires tracking prior versions in staging; defer post-MVP |
| Candidate withdrawal detection | Discovery agent looks for withdrawals/disqualifications as well as new filers | Medium | Requires updating `candidate_status = 'withdrawn'` on existing race_candidates |
| Admin confidence override | Admin can manually override a candidate's confidence tier (e.g., force 'high' for a well-known candidate from a reliable source) | Low | UI-only: add confidence_override field to staging row |
| New jurisdiction onboarding wizard | Admin fills a form with jurisdiction URL → system validates domains + fires a test run → adds to registry | Medium | Reduces friction for scaling; prevents misconfigured jurisdictions |
| Discovery run metrics dashboard | Admin sees runs over time: found/approved/rejected ratios per jurisdiction | Medium | Useful after N months of data; defer until volume justifies it |

---

## Anti-Features

Things to deliberately NOT build. These are common scope-creep patterns for this class of system.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Scraping non-official sources automatically | News sites, Wikipedia, Ballotpedia — confidence is inherently lower and not verifiable by domain rule | Restrict `allowed_domains` in web search to official election authorities only. If a candidate is only in news but not on official sites, hold for admin review, not auto-upsert |
| Automated candidate photo discovery | Photo quality is a separate concern (MEMORY notes: specific sizing, cropping, no graphics rules) | Manual headshot workflow per existing process. Discovery only covers name + office + party + source URL |
| Voter registration integration | Different system, different data provider, different compliance surface | Out of scope entirely |
| Real-time / streaming discovery | Official sites update daily at most; real-time polling would burn search quota with no benefit | Batch cron cadence is sufficient |
| Full civic data pipeline (bills, votes, etc.) | This milestone is about candidates on the ballot, not officeholder records | Incumbent data already flows from Cicero. Stay focused on challenger ingestion only |
| Multi-agent parallelism for discovery | Running multiple Claude agents in parallel for different jurisdictions looks efficient but burns rate limit quota with no usable output | MEMORY specifically notes this anti-pattern for stance research agents. Apply same rule here: one jurisdiction at a time per run |
| Auto-merge without duplicate check | Inserting without checking if candidate already exists creates duplicates in `race_candidates` | Always check before insert; see "fuzzy name match on approval" differentiator |
| Confidence score from Claude alone | Claude's self-reported score is useful but not sufficient — it cannot know which domains are "official" | Combine Claude extraction confidence with deterministic domain + DB match rules |
| Storing raw HTML/PDF content | Staging table does not need the raw page content; source URL is sufficient for admin verification | Store only `source_url`, not the fetched content |
| User-facing discovery status | End users don't need to know how candidates appear in the system | Admin-only feature throughout |

---

## Feature Dependencies

```
jurisdiction_registry
  └── Claude_discovery_agent (reads official_election_domains)
       └── confidence_classification (reads races table, checks official_domain)
            ├── auto_upsert [high] ──────────────────────► race_candidates (existing table)
            └── staging_queue [medium/low]
                 ├── admin_review_UI ──── approve ──────► race_candidates (existing table)
                 │                  └── reject ─────────► staging (review_status = rejected)
                 └── admin_email_notification

discovery_run_log
  └── (written by Claude_discovery_agent; read by metrics dashboard [future])

cron_scheduler
  └── Claude_discovery_agent (triggered weekly/daily per proximity rule)

on_demand_trigger
  └── Claude_discovery_agent (triggered by admin)
```

**Critical path for MVP:**
`jurisdiction_registry → Claude_discovery_agent → confidence_classification → staging_queue → admin_review_UI → race_candidates`

The auto-upsert for high-confidence is on the critical path conceptually but can ship as a second step: first validate that confidence scoring is working correctly via admin review, then enable auto-upsert once confidence rules are validated against real data.

---

## MVP Recommendation

**Phase 1 — Infrastructure + Manual Trigger**
Build jurisdiction registry, Claude agent, confidence classification, staging queue. No admin UI yet — review via Postgres directly. On-demand trigger only (no cron). Goal: validate that the agent finds real candidates with correct confidence scores before automating.

**Phase 2 — Admin Review UI + Email**
Build the review queue admin page (extends UnresolvedQueue pattern), approve/reject actions, and email notifications. Goal: make the system operable without DB access.

**Phase 3 — Cron + Auto-Upsert**
Enable weekly cron. Enable auto-upsert for high-confidence results. Goal: system runs without manual trigger.

**Defer post-MVP:**
- Election-proximity-aware scheduling (weekly cron is fine initially)
- Discovery run metrics dashboard (no data yet to display)
- Diff view on re-discovery (requires version history in staging)
- Withdrawal detection (requires checking existing candidates against re-runs)

---

## Sources

- [LA County Candidate List](https://www.lavote.gov/Apps/CandidateList/Index?id=4338) — fetched directly, confirmed HTML table structure with all fields listed
- [CA SoS Raw CAL-ACCESS data](https://www.sos.ca.gov/campaign-lobbying/helpful-resources/raw-data-campaign-finance-and-lobbying-activity) — confirmed tab-delimited, daily updates
- [California Civic Data Coalition — CAL-ACCESS docs](https://calaccess.californiacivicdata.org/documentation/) — confirmed FILER_FILINGS_CD schema; cross-joining required for candidate+office
- [IN SoS Candidate Information](https://www.in.gov/sos/elections/candidate-information/) — confirmed Excel format, state+federal only (county races not included)
- [Indiana Citizen 2026 Primary List](https://indianacitizen.org/2026-indiana-primary-candidate-list/) — confirmed fields: Office, Name, Party, District, Date Filed, Incumbent; state+federal scope only
- [Anthropic Structured Outputs docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — confirmed confidence_score field in schema is supported; constrained JSON output
- [OCD Identifier docs](https://open-civic-data.readthedocs.io/en/latest/ocdids.html) — confirmed standard format; not required for v2.1
- [Democracy Works / Ballot Information Project](https://www.techandciviclife.org/our-work/civic-information/our-data/ballot-information/) — confirmed civic data is collected at filing deadlines, withdrawal deadlines, and sample ballot availability (validates proximity-based scheduling)
- [Human-in-the-Loop AI patterns](https://alldaystech.com/guides/artificial-intelligence/human-in-the-loop-ai-review-queue-workflows) — confirms two-tier review, confidence gating, sampling approach
