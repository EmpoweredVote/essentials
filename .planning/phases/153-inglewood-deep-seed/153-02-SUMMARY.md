---
phase: 153-inglewood-deep-seed
plan: 02
wave: 2
status: complete
requirements: [INGL-01]
migration: "1019_inglewood_complete.sql"
ev_accounts_commit: 803d96d2
---

# 153-02 SUMMARY — Inglewood roster complete (Wave 2)

**Outcome:** Final 5-office roster seated in ONE structural migration (`1019`, registered, applied live, committed to EV-Accounts `803d96d2`). All acceptance assertions pass.

## Task 1 — roster pre-flight
- Wave-1 end state confirmed: single 'City Council' chamber `a25a6dea`, geo_id `0636546`. ✓
- **Padilla branch: CREATE-fresh** (ABSENT — only seated "Alex Padilla" is `-6000201`, the US Senator). New ext_id **`-701002`** (next free in the `-7010xx` band after El Monte's `-701001`; confirmed 0 rows).
- Dotson `-201082`: still linked (office `6b20a733`) → UNLINK. He is the FORMER **D1** councilman (lost March 2023 runoff to Gray), so his vacated seat is **not** reused for D2.
- Gray (666261) re-confirmed seated D1 (health-excused ≠ vacated, RESEARCH A3) → KEPT.
- Current-member back-pointers all already bidirectional (guarded repairs anyway).

## Tasks 2+3 — 1019_inglewood_complete.sql (applied + committed)
- **Part A (Padilla create-fresh):** new 'District 2' districts row (geo_id 0636546, LOCAL, CA) + Padilla politician `-701002` (source cityofinglewood.org) + new D2 office in `a25a6dea` + bidirectional back-pointer.
- **Part B:** unlinked Dotson (person + any rows KEPT); deleted his emptied office shell `6b20a733`; deleted the orphan At-Large district `d01253fb` (office-less after both doomed offices removed); guarded back-pointer repairs; `official_count=4`.

### Post-apply assertions (ALL PASS)
- Dotson `-201082` office_id NULL; politician row still exists ✓
- official_count = **4** ✓
- At-Large offices in survivor chamber = **0** ✓
- LOCAL_EXEC offices = **1** (Butts) ✓
- total survivor offices = **5**; bidirectional members = **5** ✓
- Padilla `-701002` created, 1 D2 districts row ✓
- split-section check (geo_id 0636546) = **0 rows** ✓

### Final roster
| Seat | Person | ext_id | bidir |
|------|--------|--------|-------|
| Mayor (LOCAL_EXEC) | James T. Butts Jr. | -200740 | ✓ |
| District 1 | Gloria D. Gray | 666261 | ✓ |
| District 2 | Alex Padilla | -701002 | ✓ |
| District 3 | Eloy Morales | 666263 | ✓ |
| District 4 | Dionne Faulk | 666264 | ✓ |

## Deviation (documented)
Deleted Dotson's emptied office shell `6b20a733` + its orphan At-Large district `d01253fb` (vs. the plan's cautious "leave unoccupied"). Required to satisfy the plan's own `At-Large = 0` acceptance criterion and the CONTEXT end-state of exactly Mayor + D1–D4 = 5 offices. Dotson's person row (and any stance/image rows) preserved per unlink-not-delete. West Covina 1010 precedent for deleting office-less district rows.

## Hand-off to Wave 3 (headshots)
Current officials needing portraits (cityofinglewood.org NO-WAF documentIDs from RESEARCH): Butts 20637, Gray 21642, Padilla 21957, Morales 21958, Faulk 21989. Image state to verify: Eloy 666263 has 1 (migrated from -201081 in Wave 1 — verify it's the right D3 portrait or replace with 21958); Faulk has 2 → dedup to 1; Butts/Gray have 1 each; Padilla 0 (new).

## Self-Check: PASSED
