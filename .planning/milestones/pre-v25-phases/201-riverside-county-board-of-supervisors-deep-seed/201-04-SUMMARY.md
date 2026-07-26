---
phase: 201-riverside-county-board-of-supervisors-deep-seed
plan: 04
subsystem: compass-stances
tags: [stances, compass, evidence-only, riverside-county, board-of-supervisors, audit-only]

# Dependency graph
requires:
  - phase: 201-02
    provides: "5 politician UUIDs (ext_id -4010001..-4010005) bound to the 5 supervisor offices"
provides:
  - "25 evidence-only compass stances across the 5-member Board of Supervisors (inform.politician_answers + inform.politician_context), 100% cited, honest blanks, no defaults, non-judicial topics only"
  - "hasContext eligibility satisfied for all 5 supervisors (>=1 stance row each) -> unblocks the coverage/purple-chip reconciliation in 201-05"
affects: [201-05-banner-coverage, 201-06-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Stance research run ONE SUPERVISOR AT A TIME (never parallel) per the session-quota rule; each supervisor is an independent save-point (research -> author -> orchestrator apply+assert -> next). 1316->1320 in order."
    - "gsd-executor has no web tools, so per the plan's cross-repo split the ORCHESTRATOR ran the research pass: one web-capable research agent per supervisor authored its SQL file; the orchestrator applied each via psql -f (live production) and asserted citation integrity before the next."
    - "5-chairs-per-topic source = inform.compass_stances (topic_id, value 1-5, text). Live non-judicial topic set pulled from inform.compass_topics (is_live AND is_active, topic_key NOT LIKE 'judicial-%') = 36 topics; researchers mapped documented evidence to the single best-fit discrete chair (not a polarity scale)."

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1316_riverside_supervisor_1_stances.sql
    - C:/EV-Accounts/backend/migrations/1317_riverside_supervisor_2_stances.sql
    - C:/EV-Accounts/backend/migrations/1318_riverside_supervisor_3_stances.sql
    - C:/EV-Accounts/backend/migrations/1319_riverside_supervisor_4_stances.sql
    - C:/EV-Accounts/backend/migrations/1320_riverside_supervisor_5_stances.sql
  modified: []

key-decisions:
  - "Evidence-only / honest-blank discipline held strictly: 25 stances total (Medina 4, Spiegel 5, Washington 6, Perez 6, Gutierrez 4). Every federal/state-only topic (abortion, tariffs, ukraine-support, social-security, etc.) is a deliberate blank for a county supervisor. Most seeded rows are the county-relevant cluster: homelessness-response, housing, local-immigration, growth-and-development, public-safety-approach, transportation-priorities, childcare, economic-development, jail-capacity."
  - "No pre-tenure attribution: Gutierrez's Moreno Valley World Logistics Center record (mayoral era) excluded; Perez's pre-2019 jail action excluded; Washington's Dec-2019 climate ABSTENTION excluded (an abstention is not a position)."
  - "Anti-fabrication enforced: research agents discarded WebSearch-synthesized quotes that could not be re-confirmed by a direct WebFetch (rivco.gov / district-site HTML pages are WAF-403); every reasoning/source pair traces to a page actually fetched and confirmed."
  - "All 5 migrations are AUDIT-ONLY / unregistered (no schema_migrations ledger entry), per the stance-migration convention; disk counter authoritative (1316-1320 follow 1315 from Plan 03)."

requirements-worked: [CV-01]

# Metrics
duration: 40min
completed: 2026-07-12
---

# Plan 201-04 Summary: Riverside County Supervisor Evidence-Only Compass Stances

## What was built

25 evidence-only compass stances for the 5 Riverside County supervisors, one audit-only
migration per supervisor (`1316`-`1320`, unregistered), applied to live production and committed
to `C:/EV-Accounts` (`aadb97d7`). Each stance is a discrete 1-5 chair backed by a documented
Board vote / sponsored resolution / on-record statement taken during the member's county tenure,
with real cited source URLs, plus a matching `inform.politician_context` row (reasoning + non-empty
sources array). Topics without a clear documented position get NO row (honest blank).

## Per-supervisor seeded stances (save-point order 1316 -> 1320)

- **D1 Jose Medina (4):** homelessness-response=2, local-immigration=3, economic-development=3, growth-and-development=3
- **D2 Karen Spiegel — 2026 Chair (5):** homelessness-response=2, housing=3, local-immigration=3 (her documented lone 4-1 dissent), public-safety-approach=4 (Floyd-resolution lone dissent + sheriff budget), transportation-priorities=3 (RCTC chair)
- **D3 Chuck Washington (6):** childcare=2, growth-and-development=3, homelessness-response=2, housing=3, jail-capacity=3, local-immigration=3
- **D4 Manny Perez (6):** growth-and-development=3, homelessness-response=2, housing=3, local-immigration=3, public-safety-approach=4, transportation-priorities=3
- **D5 Dr. Yxstian Gutierrez (4):** childcare=3, homelessness-response=2, housing=3, local-immigration=3

## Verification (per-file at apply time + aggregate)

- Grep gate PASS on all 5 (both INSERT targets present, no judicial INSERT, no `schema_migrations`).
- All 5 applied cleanly via `psql -f` (BEGIN/COMMIT, ON CONFLICT DO UPDATE).
- Aggregate combined boolean (plan Task 2) = **`t`**: 0 orphan answers, 0 NULL/empty sources arrays, 0 judicial-* rows for the 5 supervisors; all values in [1.0, 5.0].

## Notable honest blanks

Every non-local federal/state topic is blank for all 5 (a county supervisor has no attributable
record on abortion / immigration levels / tariffs / social-security / etc.). Documented near-misses
were investigated and rejected rather than force-fit (e.g. Washington's climate abstention,
Gutierrez's pre-tenure logistics record, Perez's data-centers explicit non-position). Blanks render
as honest empty spokes.

## Self-Check: PASSED
