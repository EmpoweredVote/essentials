---
phase: 153-inglewood-deep-seed
plan: 01
wave: 1
status: complete
requirements: [INGL-01]
migration: "1018_inglewood_reconcile.sql"
ev_accounts_commit: cfcd8bb4
---

# 153-01 SUMMARY — Inglewood reconcile (Wave 1)

**Outcome:** City of Inglewood government reconciled in ONE structural migration (`1018`, registered in `schema_migrations`, applied live, committed to EV-Accounts `cfcd8bb4`). All acceptance assertions pass.

## Task 1 — STOP-on-drift pre-flight findings (NO DRIFT)

**Gov** `af811c4b-e4da-4f30-ac33-9a7fe7d434ba` — geo_id NULL (un-backfilled), state CA ✓
**Chambers** (both name 'City Council', slug `inglewood-city-council`):
- SURVIVOR `a25a6dea-7f26-4f5e-bc6a-2a5d321063d5` (official_count 5) — 3 bidirectional offices
- DOOMED `8b99bcf0-813d-459a-b7e1-f82e12080ffc` (official_count NULL) — 3 one-directional offices

**Resolved office/district map (all 6 offices confirmed = CONTEXT):**
| Person | ext_id | office UUID | pol UUID | district UUID | label | dir |
|--------|--------|-------------|----------|---------------|-------|-----|
| Gloria D. Gray | 666261 | 8e9b0c61-0379-4a50-943d-951fdd8e632f | 7a04bf87-ab95-4ae7-a142-9899662637b1 | 5b24e423-9dad-4655-814f-6c4954d91943 | At-Large→**D1** | bidir |
| Eloy Morales (survivor) | 666263 | ddcd280b-565d-496c-9ec4-0e43abb7b580 | 6ed19c10-7b34-47f0-8705-0d154271e362 | d3690d9d-c70a-426d-9826-074d01f05fc5 | At-Large→**D3** | bidir |
| Dionne Faulk | 666264 | 35b92278-1f5f-4f1a-91f9-e1b642f580cf | 729bc539-3175-4e5d-96ba-c18768890e1e | 63d01cea-17b9-44f1-93b1-c0fe236fc0ae | At-Large→**D4** | bidir |
| James T. Butts Jr. (Mayor) | -200740 | 90121859-d5d4-4b0f-950e-5f6e9262abb4 | f5775ca1-99f4-4cc2-acf2-5afaacdd94b3 | 3f3c583e-b009-4ce7-9106-f8d6e1767c41 | Inglewood Mayor (LOCAL_EXEC, KEPT) | one-dir→repaired |
| Eloy Morales Jr. (DUP) | -201081 | 7fd55592-c8e9-45a7-9ddf-a2d1a9af5435 | ff97a6bb-0c1c-465a-9300-817385a8fceb | d01253fb (shared) | At-Large | one-dir→deduped |
| George Dotson (DEPARTED) | -201082 | 6b20a733-45f1-4db1-a528-029aeca8aba3 | 3e73448b-bd10-4e6b-bf2a-c9368cf64af9 | d01253fb (shared) | At-Large | one-dir→repaired (Wave 2 unlinks) |

**PADILLA VERDICT: ABSENT.** Only seated "Alex Padilla" is `-6000201` = the **US Senator** (federal `-6000xxx` scheme), a different person/office. No Inglewood D2 councilmember exists in the DB → **Wave 2 must CREATE Padilla fresh** with a new `-7010xx` ext_id (must not reuse -6000201).

**Shared-district verdict:** The 3 *current* survivor districts (5b24e423, d3690d9d, 63d01cea) each had exactly **1 office ref** → no split needed. The shared row `d01253fb` (At-Large) was referenced only by the two doomed offices (Dotson + Eloy Jr), both unlinked → irrelevant.

**Eloy images:** -201081 had 1, 666263 had 0 → migrated.
**Counters:** integer-family ledger MAX = 1011 ✓; on-disk MAX = 1017 ✓ → next = **1018** ✓.

## Task 2 — 1018_inglewood_reconcile.sql (applied + committed)

Operations: (1) geo_id `0636546` backfill; (2) repaired Butts + Dotson back-pointers; (3) Eloy dedup — migrated image -201081→666263, unlinked dup person (-201081/ff97a6bb, rows KEPT), **deleted the empty dup office shell 7fd55592**; (4) merged doomed→survivor chamber (move-assert-delete by UUID); (5) relabeled Gray→D1, Eloy→D3, Faulk→D4; (6) Mayor Butts kept LOCAL_EXEC untouched.

### Post-apply assertions (ALL PASS)
- geo_id = `0636546` ✓
- exactly 1 'City Council' chamber; doomed `8b99bcf0` gone ✓
- survivor office count = **5** (Gray D1, Eloy D3, Faulk D4, Butts Mayor, Dotson At-Large→Wave 2) ✓
- Eloy dup `-201081` office_id NULL; dup office `7fd55592` deleted; Eloy 666263 has 1 migrated image ✓
- 0 bidirectional mismatches for current survivors (666263/666264/666261/-200740) ✓
- council districts D1/D3/D4 relabeled; Mayor LOCAL_EXEC intact ✓
- split-section check (geo_id 0636546) = **0 rows** ✓
- ledger integer-family MAX = **1018** ✓

## Deviation (documented)
Plan step (4) suggested "move the empty Eloy Jr office 7fd55592 harmlessly" into the survivor. Instead I **deleted** the empty duplicate office shell after unlinking the person — this (a) achieves the plan's own expected survivor count of **5**, (b) completes the dedup by collapsing the duplicate *seat* (the duplicate *person* row -201081 + migrated image are preserved per unlink-not-delete), and (c) avoids a phantom At-Large seat that would violate Wave 2's `At-Large = 0` acceptance criterion and the CONTEXT end-state of Mayor + D1–D4 = 5 offices.

## Hand-off to Wave 2
- Survivor chamber `a25a6dea` holds 5 offices; Dotson (`-201082`, office `6b20a733`, district `d01253fb` At-Large) still linked → **Wave 2 unlinks + removes the empty shell**.
- **Padilla D2 = CREATE-fresh** (ABSENT verdict); new ext_id from `MIN(external_id)-1`.
- Set `official_count=4` (council only; Mayor excluded).

## Self-Check: PASSED
