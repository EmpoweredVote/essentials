# Phase 94: MD Headshots - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-05
**Phase:** 94-MD Headshots
**Areas discussed:** Federal headshot sources, Verification depth, Plan split

---

## Federal Headshot Sources

| Option | Description | Selected |
|--------|-------------|----------|
| congress.gov official photos | Public domain, consistent URL pattern, matches CA/OR/ME federal precedent | ✓ |
| Member bio pages (.house.gov / .senate.gov) | Often higher res but requires per-person URL lookup | |
| congress.gov primary, Wikimedia fallback | Try congress.gov first; fall back to Wikimedia if photo is low quality or missing | |

**User's choice:** congress.gov official photos (primary)

### Fallback question

| Option | Description | Selected |
|--------|-------------|----------|
| Wikimedia Commons fallback | Consistent with exec headshot pattern (used for MD Governor/AG); script logs and continues | ✓ |
| Skip and flag in output | Log name and politician_id; handle manually after run | |

**User's choice:** Wikimedia Commons fallback

**Notes:** Keeps consistent with md_executives_headshots.py pattern.

---

## Verification Depth

| Option | Description | Selected |
|--------|-------------|----------|
| DB query + UI spot-check | Query politician_images, report missing rows by name; manually verify 5+ profile pages | ✓ |
| DB query + HTTP HEAD ping all 202 URLs | Also confirms files physically exist in Storage (~40 sec); more thorough | |
| DB query only | Fastest; skips roadmap UI spot-check requirement | |

**User's choice:** DB query + UI spot-check

**Notes:** Matches CA/OR/ME precedent; no phantom-row failures in prior phases to justify HTTP pinging.

---

## Plan Split

| Option | Description | Selected |
|--------|-------------|----------|
| 2 plans: 94-01 federal headshots, 94-02 verification + UI | Clean separation of scripting vs. verification; mirrors Phase 93 pattern | ✓ |
| 1 plan: all together | Faster to plan; fine since total work is small (10 headshots) | |

**User's choice:** 2 plans

**Notes:** 94-01 = federal headshot script + upload; 94-02 = gap-check query for all 201 non-vacant officials + UI spot-check.

---

## Claude's Discretion

- Script structure: follow md_executives_headshots.py as the closest template
- External ID ranges: US senators -2430001..-2430002; US House reps -2440001..-2440008
- Gap-check SQL: LEFT JOIN politician_images, filter WHERE is_vacant IS NOT TRUE, report missing by name
- Photo license: 'public_domain' for congress.gov photos

## Deferred Ideas

None — discussion stayed within phase scope.
