# Phase 199: AZ 2026 Elections & Discovery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-17
**Phase:** 199-az-2026-elections-discovery
**Areas discussed:** Candidate-population strategy, Local race-shell scope, Primary election row, Discovery rows + allowlist

---

## Candidate-population strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Statewide + federal by hand; discovery for rest | Hand-seed statewide + verify 9 US House; leave 90 legislative + local to the cron | ✓ |
| Shells only — discovery fills everything | Zero hand-seeded candidates; rely entirely on cron | |
| Manually seed everything now | Hand-populate all statewide + federal + 90 legislative + local | |

**User's choice:** Statewide + federal by hand; discovery for rest (Recommended)
**Notes:** AZ filing closed ~April 6, 2026 so confirmed slates are public; best effort/value ratio. 9 US House races already carry 39 candidates.

---

## Local race-shell scope

| Option | Description | Selected |
|--------|-------------|----------|
| Cycle-confirmed, existing offices only | Verify each body's 2026 cycle; seed only confirmed; no new offices | ✓ |
| All seeded local offices get shells | Shell every existing local office regardless of cycle | |
| Also add missing county offices | Create + shell Pima's other constitutional offices | |

**User's choice:** Cycle-confirmed, existing offices only (Recommended)
**Notes:** Tucson city likely odd-year (no 2026 race); Oro Valley/Marana/Sahuarita even-year; Pima BoS up. Unseeded county constitutional offices deferred.

---

## Primary election row

| Option | Description | Selected |
|--------|-------------|----------|
| Seed both primary + general | Add AZ 2026 Primary (2026-08-04) alongside existing general | ✓ |
| General only for now | Keep just the Nov 3 general row | |

**User's choice:** Seed both primary + general (Recommended)
**Notes:** Matches VA/MD; lets primary races/candidates anchor and covers both dates in the discovery window.

---

## Discovery rows + allowlist

| Option | Description | Selected |
|--------|-------------|----------|
| Statewide + Pima County, per date | 4 rows: {AZ 04, Pima} × {08-04, 11-03}; curated allowlist | ✓ |
| Statewide only, per date | 2 rows: AZ 04 × both dates | |
| Statewide + Pima + each covered city | One row per jurisdiction × both dates | |

**User's choice:** Statewide + Pima County, per date (Recommended)
**Notes:** Allowlist azsos.gov, azcleanelections.gov, pima.gov/recorder.pima.gov, ballotpedia.org. No cron_active column — date-window arming.

---

## Claude's Discretion

- Migration numbering + repo home (in-repo vs cross-repo EV-Accounts).
- ext_id / seat-anchoring scheme for new race shells.
- Landing.jsx COVERAGE_CITIES verification for AZ cities (add only if missing).

## Deferred Ideas

- Pima County constitutional offices (Sheriff, Recorder, Assessor, County Attorney, Clerk, etc.) — future phase.
- Superior Court judicial retention races — future.
- School board 2026 races — deferred per standing rule (no school-board work until badge exists).
- Hand-seeding legislative + local candidates — left to discovery cron; later reconcile can backfill.
