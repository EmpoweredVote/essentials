# Phase 167: NV 2026 Elections & Discovery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-29
**Phase:** 167-nv-2026-elections-discovery
**Areas discussed:** Statewide scope, Primary handling, Discovery test, Discovery source

---

## Statewide scope

| Option | Description | Selected |
|--------|-------------|----------|
| All 6 statewide execs | Race row for every statewide constitutional office on the NV ballot (Gov, Lt Gov, AG, SoS, Treasurer, Controller) | ✓ |
| Governor only | Literal reading of criterion #1 — Governor race only | |

**User's choice:** All 6 statewide execs
**Notes:** "Governor" in the roadmap reads as shorthand for the full statewide slate; all six offices already exist as incumbents from Phase 159, so a user on /elections sees their complete top-of-ticket.

---

## Primary handling

| Option | Description | Selected |
|--------|-------------|----------|
| General only | Seed just the 2026 General Election row + general races; primary already past | ✓ |
| Both primary + general | Mirror VA/MD verbatim — seed both rows for record parity | |

**User's choice:** General only
**Notes:** NV primary was June 9, 2026 (20 days before this discussion). Both /elections and the 180-day discovery horizon target the upcoming Nov 3 general. Intentional departure from VA/MD verbatim parity.

---

## Discovery test

| Option | Description | Selected |
|--------|-------------|----------|
| Execute a real test run | Trigger one discovery execution against the NV source; capture that it completed | ✓ |
| Seed row only (VA/MD parity) | Just seed the discovery_jurisdictions row; treat date-based eligibility as armed | |

**User's choice:** Execute a real test run
**Notes:** Literally satisfies criterion #3. Acceptance bar = run completes without error; candidate count may be small/zero (seeding candidates is discovery's downstream job, not this phase's gate). Trigger mechanism (script/endpoint/cron) is a planner research item.

---

## Discovery source

| Option | Description | Selected |
|--------|-------------|----------|
| NV SoS canonical + Ballotpedia | source_url = nvsos.gov filing list; allowed_domains adds ballotpedia.org | ✓ |
| Ballotpedia primary | Ballotpedia 2026 NV page as source_url (VA 325 precedent) | |
| Let researcher decide | Defer exact source to researcher | |

**User's choice:** NV SoS canonical + Ballotpedia
**Notes:** Researcher to confirm the exact nvsos.gov URL is parser-handleable; fall back to Ballotpedia 2026-NV page as source_url (with nvsos.gov in allowed_domains) if nvsos.gov proves unparseable.

---

## Claude's Discretion

- Exact position_name strings / zero-padding for state-legislative races (follow MD 280 pattern).
- Whether statewide + legislative + federal races land in one migration or split across Plan-02 — kept idempotent either way.

## Deferred Ideas

- Surfacing NV jurisdictions on coverage.js / Landing → Phase 168 (retrospective).
- Seeding actual 2026 candidate rows / headshots / stances → discovery output over time, not this phase.
- 2026 primary archival rows → intentionally dropped (primary already occurred).
