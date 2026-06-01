# Phase 85: Multnomah Elections + Discovery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 85-Multnomah Elections + Discovery
**Areas discussed:** Primary vs. General races, Discovery jurisdiction structure, Which offices are on the 2026 ballot, Plan structure

---

## Primary vs. General races

| Option | Description | Selected |
|--------|-------------|----------|
| November General only | Seed race rows for OR 2026 General only; primary already passed May 19 | ✓ |
| Both Primary and General | Also seed May primary race rows retroactively | |
| General only + pre-populate primary survivors | Create General rows and add known post-primary candidates immediately | |

**User's choice:** November General only

**Notes:** Oregon May 2026 primary was May 19, 2026 (already passed as of June 1). Migration SELECTs existing 'OR 2026 General' row and creates it if missing.

---

## Discovery jurisdiction structure

| Option | Description | Selected |
|--------|-------------|----------|
| One Multnomah County row (geo_id='41051') | Covers county + all 5 cities; multco.us elections page as source | ✓ |
| Individual rows per city | 6 separate rows (county + 5 cities) | |
| Rely on statewide OR row | Existing geo_id='41' covers everything | |

**User's choice:** One Multnomah County row (geo_id='41051')

---

## Discovery source URL and domains

| Option | Description | Selected |
|--------|-------------|----------|
| multco.us + ballotpedia + sos.oregon.gov | source_url=multco.us/elections; Multnomah County Elections administers all county elections | ✓ |
| Add city-specific domains too | Include greshamoregon.gov etc. in allowed_domains | |
| Researcher decides | Let researcher pick domains from multco.us research | |

**User's choice:** multco.us + ballotpedia + sos.oregon.gov

---

## Which offices are on the 2026 ballot

| Option | Description | Selected |
|--------|-------------|----------|
| Researcher finds it from multco.us/sos.oregon.gov | Researcher checks candidate filings for confirmed seats | ✓ |
| All seats regardless of stagger | Seed a race for every commissioner + Chair | |
| I know which ones | User specifies seat numbers | |

**User's choice (county):** Researcher finds it

---

## Which city offices are on the 2026 ballot

| Option | Description | Selected |
|--------|-------------|----------|
| Researcher finds it per city | Each city may have different stagger patterns; researcher checks each | ✓ |
| All seats in all cities | Seed every council seat; empty races handled by UI | |
| Only Gresham | Skip tiny cities like Wood Village and Maywood Park | |

**User's choice:** Researcher finds it per city

---

## Plan structure

| Option | Description | Selected |
|--------|-------------|----------|
| 2 plans: races + discovery | Plan 1 = migration 251 (race rows), Plan 2 = migration 252 (discovery) + smoke test | ✓ |
| 1 plan: everything in one migration | Single migration for races + discovery jurisdiction | |
| 3 plans: county + cities + discovery | More granular rollback control | |

**User's choice:** 2 plans: races + discovery

---

## Smoke test acceptance criteria

| Option | Description | Selected |
|--------|-------------|----------|
| Elections page API with Multnomah County address | Hit /elections-by-address; verify races returned end-to-end | ✓ |
| DB-only SQL row count check | SQL count only, no API call | |
| Both DB count + API call | SQL sanity + API verification | |

**User's choice:** Elections page returns races for a Multnomah County address

---

## Claude's Discretion

- Position naming convention for race rows (e.g., "Multnomah County Commissioner District 1") — researcher proposes, planner confirms
- Exact unincorporated Multnomah County test address for smoke test — researcher finds a valid address

## Deferred Ideas

None — discussion stayed within phase scope.
