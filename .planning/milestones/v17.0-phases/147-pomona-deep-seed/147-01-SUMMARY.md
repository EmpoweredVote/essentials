---
phase: 147-pomona-deep-seed
plan: 01
wave: 1
status: complete
requirements: [POMO-01]
migrations: [926_pomona_reconcile.sql]
note: STRUCTURAL — migration 926 registered in supabase_migrations.schema_migrations (version '926', name 'pomona_reconcile')
new_district_uuids:
  District 4: 7adbe57d-515a-4848-9320-ccbf3feeeeb2
  District 5: c821d0fb-e0a5-492f-a8a4-7a4b00c362d5
---

# Phase 147 Wave 1 — Pomona Reconcile — SUMMARY

**Outcome:** The pre-existing partial, duplicate-chamber Pomona seed is now a single clean `City Council`
chamber with 6 correctly-districted offices, the LOCAL_EXEC Mayor preserved, and the Garcia/Lustro
shared-district defect resolved. Migration **926** (structural) applied + registered. Zero drift at pre-flight.

## Pre-flight (STOP-on-drift) — PASSED
All RESEARCH §4/§5 preconditions confirmed live (2026-06-20), both link directions:
- gov `3c2c2a4b` geo_id NULL, state CA, "City of Pomona, California, US"
- two `City Council` chambers: survivor `ddabfccc` (official_count 7, 3 occupied offices) + doomed `54a55a35` (official_count NULL, 3 offices)
- doomed offices: Sandoval/Mayor `657cb0b2` (district `3ec78ed9` Pomona Mayor LOCAL_EXEC), Garcia `315a0a8a` (`35d17606`), Lustro `8570f2ad` (`35d17606`)
- shared-district defect confirmed: Garcia + Lustro both on `35d17606`
- broken back-pointers confirmed: Garcia/Lustro/Sandoval `politicians.office_id = NULL` (repaired in Plan 02)
- 4 At-Large district rows + `Pomona Mayor` LOCAL_EXEC; no D4/D5 row existed
- Ontiveros-Cole (`-700658`) absent (created in Plan 02)

## Changes applied (migration 926, idempotent)
1. **geo_id backfill** — gov `3c2c2a4b` → `0658072` (guarded `WHERE geo_id IS NULL`).
2. **Chamber merge (3-office move-then-delete, Pitfall 1)** — moved all 3 doomed offices (`657cb0b2`/`315a0a8a`/`8570f2ad`) into survivor `ddabfccc`, asserted `54a55a35` empty, deleted it.
3. **District relabel** — `e282b5d3`→District 1 (Martin), `3a213f0d`→District 2 (Preciado), `35d17606`→District 3 (Garcia ONLY), `1946c2e2`→District 6 (Canales); district_type/geo_id/state unchanged.
4. **District 4 created** — `7adbe57d-515a-4848-9320-ccbf3feeeeb2` (LOCAL/0658072/CA) for Ontiveros-Cole (seated in Plan 02).
5. **District 5 created + Lustro repoint (Pitfall 2)** — `c821d0fb-e0a5-492f-a8a4-7a4b00c362d5`; Lustro's office `8570f2ad` repointed off the shared `35d17606` onto District 5.
6. **Mayor preserved (Pitfall 3)** — `Pomona Mayor` LOCAL_EXEC `3ec78ed9` untouched; no new Mayor row; no rotational title flag. Sandoval's office only moved to the survivor.

## Post-verification — ALL GREEN
| Check | Result |
|-------|--------|
| `governments.geo_id` (3c2c2a4b) | `0658072` ✓ |
| `City Council` chambers under gov | 1 ✓ |
| doomed `54a55a35` exists | 0 ✓ |
| offices under survivor `ddabfccc` | 6 ✓ (Ontiveros-Cole's 7th = Plan 02) |
| Lustro office `8570f2ad` district | `District 5` ✓ |
| districts (0658072) | D1/D2/D3/D4/D5/D6 LOCAL + `Pomona Mayor` LOCAL_EXEC ✓ |
| `feedback_section_split_check` | 0 rows ✓ |
| migration 926 registered | 1 ✓ |

## key-files.created
- `C:/EV-Accounts/backend/migrations/926_pomona_reconcile.sql` (not in this git repo — applied to live Supabase)

## For Plan 02
- **District 4 UUID:** `7adbe57d-515a-4848-9320-ccbf3feeeeb2` (seat Ontiveros-Cole here)
- **District 5 UUID:** `c821d0fb-e0a5-492f-a8a4-7a4b00c362d5` (Lustro already repointed)
- Repair broken back-pointers: Garcia `6fa28860`, Lustro `07e0311b`, Sandoval `48f36a82` → set `politicians.office_id`
- Create Ontiveros-Cole ext_id `-700658`, seat into D4 office in survivor `ddabfccc`
- Set survivor `ddabfccc` `official_count = 7`

## Self-Check: PASSED
