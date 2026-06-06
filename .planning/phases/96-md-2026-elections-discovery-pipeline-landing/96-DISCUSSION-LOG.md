# Phase 96: MD 2026 Elections + Discovery Pipeline + Landing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-06
**Phase:** 96-MD 2026 Elections + Discovery Pipeline + Landing
**Areas discussed:** Delegate race structure, Landing entry

---

## Delegate Race Structure

| Option | Description | Selected |
|--------|-------------|----------|
| One row, seats=3 | Single race row per district with seats=N. Cleaner Elections tab. Fewer total rows than 141. | ✓ |
| Three rows, suffixed names | Three rows per district: "District 5 (1 of 3)" etc. Hits 141-row target but position names are awkward. | |
| Researcher decides | Let researcher query sub-district distribution first. | |

**User's choice:** One row, seats=3 for whole-district multi-member races.

**Follow-up — Sub-district seat count:**

| Option | Description | Selected |
|--------|-------------|----------|
| seats=1 always | All A/B sub-districts get seats=1 regardless of actual count. | |
| seats=N matching actual | Researcher queries actual delegate count per sub-district and sets seats correctly. | ✓ |

**User's choice:** seats=N matching actual delegate count for sub-districts.

**Notes:** The ROADMAP's "141 delegate race rows" and "198 total" were based on a one-row-per-seat model that conflicts with the `UNIQUE (election_id, position_name, primary_party)` constraint. The planner should document the actual total count and note the deviation.

---

## Landing Entry

| Option | Description | Selected |
|--------|-------------|----------|
| Leonardtown + St. Mary's County | browseGovernmentList: ['2446475', '24037'] — shows both town and county officials. | ✓ |
| Leonardtown only | browseGovernmentList: ['2446475'] — shows just Leonardtown + MD state officials. | |

**User's choice:** Leonardtown + St. Mary's County bundled together.

**Notes:** Entry goes in COVERAGE_CITIES array (not COVERAGE_COUNTIES). Label = "Leonardtown", state = "Maryland", browseStateAbbrev = "MD".

---

## Claude's Discretion

- **MD primary date:** Likely July 14, 2026 — researcher must verify at elections.maryland.gov before writing the migration
- **Discovery allowed_domains:** `['elections.maryland.gov', 'mgaleg.maryland.gov', 'ballotpedia.org', 'maryland.gov']` — researcher may refine
- **discovery_jurisdictions schema:** No `cron_active` column — ROADMAP wording is stale; use date-based rows (ME/OR pattern)
- **LG not on separate ballot:** LG Aruna Miller runs on the same ticket as Governor Moore; no separate race row for LG
- **State Treasurer excluded:** is_appointed_position=true (General Assembly-elected) — no race row per ME/OR pattern
- **Election naming:** `'2026 Maryland State Primary'` + `'2026 Maryland General Election'` (MA/ME naming convention)

## Deferred Ideas

None — discussion stayed within phase scope.
