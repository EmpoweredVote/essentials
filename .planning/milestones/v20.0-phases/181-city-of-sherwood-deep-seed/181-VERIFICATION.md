---
phase: 181-city-of-sherwood-deep-seed
verified: 2026-07-03T23:05:00Z
status: passed
score: 9/9 must-haves verified
overrides_applied: 0
human_verification: []
verifier: inline-orchestrator (executor/verifier subagent quota exhausted at closeout; every check below was run live by the orchestrator against production DB, CDN, API, and the deployed frontend — no deploy-gated items remain, unlike 177/178)
---

# Phase 181: City of Sherwood Deep-Seed Verification Report

**Phase Goal:** A Sherwood resident looks up who represents them and gets the correct Mayor + council member, with evidence-only stances on their profiles.
**Verified:** 2026-07-03 (same-session live verification — 179/180 pattern)
**Status:** passed

## Success Criteria (ROADMAP — WASH-07)

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Any Sherwood address returns the correct Mayor + council member; form of government verified and modeled correctly | PASS | Wave-0 ground-truthed pure at-large + directly-elected 2-year Mayor from sherwoodoregon.gov + SEL101 filings + Dec-2024 org chart. Live POST /api/essentials/browse/by-area (geo_id 4167100) returns Rosener as Mayor on LOCAL_EXEC ('Sherwood (Mayor, Citywide, 2-Year Term)') + 6 Councilors on LOCAL at-large; section-split scan 0 rows; office_id nulls 0 |
| 2 | Full seated roster seeded; all officials render with 600×750 headshots | PASS | 7/7 offices live (mig 1187, pairwise identity gate); 7/7 headshots uploaded from official city portraits (mig 1188, url-embeds-uuid gate 7/7), visually identity-verified; portraits render on the live browse page |
| 3 | Evidence-only compass stances render — 100% cited, honest blank spokes, no default values | PASS | 23 stances across 7 officials (migs 1189-1195, audit-only): 23/23 answers have fully-cited context rows (reasoning + ≥1 source); 0 defaults (thin topics omitted); 0 judicial-* (A4: City Attorney/Judge appointed); Stance Breakdown renders live on Rosener's profile |
| 4 | Sherwood surfaces with the purple hasContext chip in src/lib/coverage.js | PASS | Oregon block entry committed (759a810) with browseGovernmentList ['4167100']; live landing page "Oregon OR 12 areas" lists the Sherwood chip; Railroad St banner renders (not gradient) |

## Must-haves (goal-backward)

1. geo_id integrity: 4167100 confirmed (stated 4167450 = 0 rows — third wrong stated geo_id this milestone); all writes used the corrected value — PASS
2. No duplicate government / greenfield preserved: governments count = 1 — PASS
3. Section-split = 0 rows (canonical query, post-seed) — PASS
4. Mayor-first ordering + no party label on live browse — PASS (Playwright; API serves party:"")
5. representing_city='Sherwood' inline on all 7 (banner derivation) — PASS (API + banner renders)
6. D-15 template fixes shipped: WR-A note-sync (1188), WR-B pairwise identity gate (1187, fired+passed), WR-C empty-roster guard (headshot script) — PASS
7. Stance integrity gates: triple-gate (identity + count + parity) passed on all 7 files — PASS
8. One-agent-at-a-time stance research honored (7 sequential agents; 2 quota-killed attempts fully retried, no partial artifacts) — PASS
9. Housing-charter anchor attributed per-official only after minutes-verified presence (Open Question 2 resolved: all 7 present Oct 28 2025), distinct reasoning per official, Mays never credited via former titles — PASS

## Notable execution facts

- Migrations consumed: 1187 (structural, registered) + 1188 (headshots) + 1189-1195 (stances, audit-only). On-disk MAX now 1195 → **next migration = 1196**. Ledger MAX still 1178 (trap).
- EV-Accounts commits: 60736ac4 (1187), 9ce7f5a8 (1188), 5178829c (1189-1195; 8 unrelated pre-staged AZ CSVs split out before committing).
- Essentials commits: 759a810 (surfacing) + plan summaries.
- Banner: Railroad St | dreid1987 | CC BY 3.0 (AFK-default from the two Wave-0 candidates; operator can swap post-hoc like Forest Grove).
- Live browse link: essentials.empowered.vote/results?browse_geo_id=4167100&browse_mtfcc=G4110
