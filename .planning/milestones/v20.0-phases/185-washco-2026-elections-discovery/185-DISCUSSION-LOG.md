# Phase 185: WashCo 2026 Elections & Discovery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-04
**Phase:** 185-washco-2026-elections-discovery
**Areas discussed:** Candidate ingestion scope, Candidate depth, Which seats get race rows, School-board races 2026, Discovery granularity, Discovery source

---

## Candidate ingestion scope

| Option | Description | Selected |
|--------|-------------|----------|
| Arm-only (167 parity) | Race rows + arm discovery + test run; candidates flow in from discovery over time | |
| Arm + ingest west-metro | Above + manually ingest known post-primary west-metro local candidates | ✓ |
| Broaden to statewide gap | Also tackle the 121 empty statewide legislative/down-ballot shells | |

**User's choice:** Arm + ingest west-metro
**Notes:** Resolves the `project_or_2026_candidate_gap` memory tag on this phase; statewide 121-shell fill deferred to its own future phase.

---

## Candidate depth

| Option | Description | Selected |
|--------|-------------|----------|
| Names + linkage only | Candidate rows + race_candidates linkage; no photos/stances | |
| Names + headshots | Above + 600×750 headshots where an official/campaign photo exists | ✓ |
| Full treatment | Names + headshots + evidence-only compass stances (one agent at a time) | |

**User's choice:** Names + headshots
**Notes:** Compass stances explicitly deferred to a later follow-up.

---

## Which seats get race rows

| Option | Description | Selected |
|--------|-------------|----------|
| Only seats actually up | Per-jurisdiction 2026 term-expiration research; row only for seats on the Nov ballot | ✓ |
| Row per office | A shell for every office regardless of term (misleads the ballot) | |
| Only seats with a filed candidate | Derive from the SOS/county filing list | |

**User's choice:** Only seats actually up
**Notes:** Requires per-jurisdiction term research in the research/planning step; do not guess.

---

## School-board races 2026

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm none, seed zero | Treat OR boards as May-odd-year; confirm and seed 0 races | |
| Confirm + catch specials | Confirm no regular seats, but seed any 2026 vacancy/special election if it exists | ✓ |
| Arm discovery anyway | Seed 0 races but still arm discovery rows for the 5 boards | |

**User's choice:** Confirm + catch specials
**Notes:** ORS 255 — special-district elections run May of odd years; verify against Washington County.

---

## Discovery granularity

| Option | Description | Selected |
|--------|-------------|----------|
| County + 7 cities | WashCo row + one per city (8 rows) | ✓ |
| County row only | Single WashCo row; rely on proximity + statewide SOS row | |
| County + cities + boards | Also arm the 5 school districts | |

**User's choice:** County + 7 cities
**Notes:** School-board rows not armed (consistent with 0 regular board races).

---

## Discovery source

| Option | Description | Selected |
|--------|-------------|----------|
| Washington County elections | County Elections Division candidate-filing page | ✓ |
| OR SOS filings page | Reuse sos.oregon.gov Candidate-Filings-Local-Measures | |
| County primary + SOS fallback | County as source_url; SOS + Ballotpedia in allowed_domains | |

**User's choice:** Washington County elections
**Notes:** Researcher confirms exact URL is parseable; SOS/Ballotpedia remain the fallback per D-06.

---

## Claude's Discretion

- Migration split (races / candidates+headshots / discovery) vs. combined — kept idempotent either way.
- Exact `position_name` strings per race — mirror verbatim official titles from Phases 175–184.

## Deferred Ideas

- Statewide candidate-gap fill (121 empty legislative/down-ballot shells) — own future phase.
- Compass stances for 2026 candidates — later follow-up after names + headshots.
- Coverage/Landing surfacing of west-metro election data — Phase 186 (retrospective/close).
