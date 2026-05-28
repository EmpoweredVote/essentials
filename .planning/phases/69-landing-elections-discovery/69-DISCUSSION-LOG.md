# Phase 69: Landing + Elections + Discovery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28
**Phase:** 69-landing-elections-discovery
**Areas discussed:** Landing.jsx CA city entries, US House race structure, Discovery_jurisdictions source URLs

---

## Landing.jsx CA City Entries

| Option | Description | Selected |
|--------|-------------|----------|
| Same pattern as SD/Fremont | `{ county: 'CityName', browseGovernmentList: ['geo_id'], browseStateAbbrev: 'CA' }` — one card per city | ✓ |
| SF gets county geo_id too | SF is a consolidated city-county; include both city + county geo_ids like LA | |
| Group all 7 CA cities into one entry | One 'California' entry with all 7 IDs combined | |

**User's choice:** Same pattern as SD/Fremont (Recommended)
**Notes:** Clean and consistent. No special treatment for SF's consolidated status in the landing entry.

---

## US House Race Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Both primary and general | 104 rows (2 per CD), tied to June 3 primary + November 4 general | |
| General election only | 52 rows tied to November 4 general — primary is 6 days out, filing closed | ✓ |
| Primary only for now | 52 rows for June 3, follow-up migration later for general | |

**User's choice:** General election only (Recommended)
**Notes:** CA primary is June 3 (6 days away) and filing is already closed. Focus discovery on the general cycle.

---

## Discovery_jurisdictions Source URLs

| Option | Description | Selected |
|--------|-------------|----------|
| Each city's own elections/city clerk page | Researcher finds official candidate listing URL per city — matches lavote.gov pattern | ✓ |
| CA SOS statewide for city races too | Use sos.ca.gov for all CA discovery | |
| Skip city discovery for now | Only arm Governor + US House; city discovery in v7.1 | |

**User's choice:** Each city's own elections/city clerk page (Recommended)
**Notes:** Most accurate for local races. Researcher finds per-city source URLs.

---

## Claude's Discretion

- Exact CA SOS URL format for Governor and US House discovery source
- Whether to use separate vs. shared discovery_jurisdictions row for US House races
- Migration numbering (next is 221)
- Whether to arm any discovery_jurisdictions rows for CA primary given 6-day proximity

## Deferred Ideas

None — discussion stayed within phase scope.
