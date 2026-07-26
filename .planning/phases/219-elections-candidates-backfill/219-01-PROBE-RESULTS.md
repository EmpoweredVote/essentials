# Phase 219 — Plan 01 Task 1 Probe Results (operator-run DB probes)

**Captured:** 2026-07-23 by orchestrator via `mcp__supabase-local` (production essentials DB, read-only SELECTs)
**Purpose:** Pre-fills the `219-01` Task 1 `checkpoint:human-verify` output so execution does NOT need to re-run the DB probes (the executor has no DB access). Task 2 folds these into `219-PREFLIGHT.md` along with the remaining WebSearch resolutions.

---

## Probe 1 — Migration counter (filesystem, `C:/EV-Accounts/backend/migrations`)

- **MAX on disk = 1392** → **next-free = 1393** (matches RESEARCH.md expectation).
- **Locked migration-number map** (single arbitration point for the 7 parallel Wave-2 plans):

  | Plan | Migration # |
  |------|-------------|
  | 219-02 | 1393 |
  | 219-03 | 1394 |
  | 219-04 | 1395 |
  | 219-05 | 1396 |
  | 219-06 | 1397 |
  | 219-07 | 1398 |
  | 219-08 | 1399 |

  > Each Wave-2 plan MUST consume its number from this map. If the on-disk counter has drifted by execute time, re-confirm MAX and shift the whole block contiguously **preserving this order**, then update this map before any Wave-2 plan runs.

## Probe 2 — Shared 2026-05-02 TX election row

- Exactly **one** row (no mint-by-name fallback needed):
  - **`election_id = 8eaba170-95f5-4c98-849e-19ff93a17680`**
  - name = `2026 Texas Municipal General` · `election_date = 2026-05-02` · `election_type = general` · `jurisdiction_level = city` · `state = TX`
- Shared-tier plans (219-02, and any city whose reference cycle is 2026-05-02) link races to this id.

## Probe 3 — `essentials.candidate_staging` existing cited proposals

Discovery cron already surfaced `pending`, `official`-confidence, cited rows for **3 of the 12** zero-race cities. These are **shortcuts** (review + promote instead of fresh research); the seed still writes `race_candidates` directly per the authoritative-seed convention.

### Nevada — reference cycle **2026-05-02** (shared tier → 219-02) ✓
Dedup to 3 city races (cron wrote many duplicate rows), all cited to `https://cityofnevadatx.org/government/elections.php`, each appears **uncontested** (1 candidate/seat):
- **Mayor** — Donald Deering
- **Place 1** — Michael Laye
- **Place 2** — Paul Baker

### Saint Paul — reference cycle **2025-05-03** (own election row → off-cycle tier 219-03)
Cited to `https://www.stpaultexas.us/local_government/elections.php`, **May 3, 2025 General**:
- **Seat 1 Alderman** — Jason Sobotka **vs** Larry Nail (contested)
- **Seat 2 Alderman** — "David S." ⚠ *name truncated in staging — resolve full name via source at execute (honest-open until sourced)*
- NOT the shared 2026-05-02 row — mint/confirm Saint Paul's own 2025-05-03 election row.

### Melissa — May-2026 was **ISD/school-district only** (off-cycle tier → 219-03)
- Only staging rows are **Melissa ISD Trustee Place 2** (Bill Gray, Stacy Fieker) — a **school-district** race, **OUT OF SCOPE** (219 seeds the *city* government, not the ISD).
- Confirms Melissa **city council** was NOT on the 2026-05-02 city ballot → Melissa belongs in the off-cycle/open tier; find the city's most-recent HELD council election at execute (resolves the migration-100-comment-vs-WebSearch conflict flagged in RESEARCH A2).

### No staging rows — need fresh WebSearch at execute (Task 2)
Blue Ridge · Farmersville · Josephine · Lavon · McKinney · Weston · Plano · Richardson · Van Alstyne

---

## Still owed by 219-01 Task 2 (WebSearch — executor CAN do)
- Lavon, Josephine reference cycle + roster leads.
- McKinney runoff finals (Mayor Cox v Sanford; At-Large 1 Lynch v Garrison, June 2025), Richardson exact May-2025 date + Place 6 runoff final, Longview D3 runoff winner (Brandon Smith 223–204 per RESEARCH).
- Saint Paul Seat 2 "David S." full name.
- Then write `219-PREFLIGHT.md` merging these + the probe results above.
