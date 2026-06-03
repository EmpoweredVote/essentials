# Phase 88: TX Collin County School Boards - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-02
**Phase:** 88-tx-collin-county-school-boards
**Areas discussed:** Geofence loader, Cross-county ISDs, ISD scope / secondary districts

---

## Geofence Loader

| Option | Description | Selected |
|--------|-------------|----------|
| New load-tx-school-boundaries.ts | Dedicated script parallel to load-or-school-boundaries.ts. Hardcodes 5 target GEOIDs, downloads tl_2024_48_unsd.zip, inserts with state='48' and source='tiger_unsd_tx_2024'. Cleanest — doesn't touch the existing state-tiger loader. | ✓ |
| Extend load-state-tiger-boundaries.ts | Add 'unsd' to TX's layer set. More unified long-term, but modifies a complex shared script and adds TX-specific UNSD assertion logic — higher risk for a 5-ISD seed. | |

**User's choice:** New load-tx-school-boundaries.ts
**Notes:** None — recommended option selected.

---

## Cross-County ISDs

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, full G5420 footprint is correct | Geographically accurate — if you live in Frisco ISD territory you should see Frisco ISD regardless of which county. Use the full TIGER G5420 polygon. | ✓ |
| Collin County addresses only | Clip or restrict so only addresses geocoding to Collin County see the school board. Would require PostGIS intersection logic not currently in essentialsService.ts — significant extra work. | |

**User's choice:** Full G5420 footprint is correct
**Notes:** Frisco ISD spans Collin+Denton; Richardson ISD spans Collin+Dallas. Both use full TIGER polygon — no clipping.

---

## ISD Scope / Secondary Districts

| Option | Description | Selected |
|--------|-------------|----------|
| Seed only the 5 named ISDs, document gap | Plano, McKinney, Allen, Frisco, Richardson only — per TX-SCHOOL-01 through 05. Migration comment notes residents in smaller ISDs see no SCHOOL section. | ✓ |
| Seed the 5 + any easy secondary ISDs | Expand scope to include Prosper, Wylie, or others if TIGER has their G5420 boundaries. More researcher time and wider external_id block. | |

**User's choice:** 5 named ISDs only, document gap
**Notes:** Smaller ISDs (Prosper, Wylie, Celina, Lovejoy, Princeton, etc.) deferred to future phase.

---

## Claude's Discretion

None — all areas had clear user selections.

## Deferred Ideas

- **Secondary Collin County ISDs** (Prosper, Wylie, Celina, Lovejoy, Princeton, etc.) — future phase if needed
- **TX school board elections (2026 race rows)** — separate future phase
