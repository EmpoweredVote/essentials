# Phase 176: City of Beaverton Deep-Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-30
**Phase:** 176-city-of-beaverton-deep-seed
**Areas discussed:** Form of gov't & routing, Mayor modeling, Roster & body-name source, Headshot source & stance depth

---

## Form of government & council routing

| Option | Description | Selected |
|--------|-------------|----------|
| Verify at plan time (directive) | Researcher ground-truths charter; ward → custom X00xx geofences, at-large/by-position → city-wide via geo_id 4105350 | ✓ |
| I know it's ward-based | User confirms geographic-district councilors | |
| I know it's at-large/by-position | User confirms city-wide seats | |

**User's choice:** Verify at plan time (directive)
**Notes:** Beaverton's Nov 2020 charter makes the current form genuinely uncertain — no hardcoding from memory. Branch spelled out in CONTEXT D-01/D-02/D-03.

---

## Mayor modeling

| Option | Description | Selected |
|--------|-------------|----------|
| Verify at plan time (directive) | Confirm Mayor's role from charter; directly-elected → LOCAL_EXEC first, council-member/president → seat-with-title | ✓ |
| Directly-elected executive | User confirms strong directly-elected Mayor | |

**User's choice:** Verify at plan time (directive)
**Notes:** 2020 charter may have shifted toward council-manager. Default working expectation is directly-elected executive but subordinate to what the charter says (CONTEXT D-04/D-05). Avoid the Norwalk/Downey/Bellflower LOCAL_EXEC mis-seed.

---

## Roster & body-name source

| Option | Description | Selected |
|--------|-------------|----------|
| Strict ground-truth | Roster + exact chamber name verbatim from beavertonoregon.gov; no hardcoding; account for 2024 turnover | ✓ |
| Ground-truth + note incumbents | Same, plus cross-check against known incumbents and flag discrepancies | |

**User's choice:** Strict ground-truth
**Notes:** CONTEXT D-06.

---

## Headshot source & stance depth

| Option | Description | Selected |
|--------|-------------|----------|
| Standard playbook | beavertonoregon.gov headshots (fallback Ballotpedia/Wikimedia), 600×750; all live topics, evidence-only, one agent at a time, no defaults, 18–21+ target | ✓ |
| Photos only this phase | Seed gov + roster + headshots, defer stances | |

**User's choice:** Standard playbook
**Notes:** CONTEXT D-07/D-08. No divergence from the deep-seed standard.

---

## Claude's Discretion

- External_id range for Beaverton officials (Wave-0 DB probe, non-colliding OR range).
- Next migration number — best estimate 1127 (highest on disk = 1126, confirmed 2026-06-30); confirm DB ledger MAX in Wave-0.
- Custom X00xx mtfcc + district_type — only if D-02 resolves to the ward branch.
- Whether council offices carry a free-text seat/district label for display clarity.

## Deferred Ideas

- Other west-metro cities (177–182), school boards (183–184), 2026 elections + discovery (185) — own phases.
- Beaverton appointed boards/commissions and city-manager staff — not elected officials; out of scope.
