---
phase: 147-pomona-deep-seed
plan: 02
wave: 2
status: complete
requirements: [POMO-01]
migrations: [927_pomona_complete.sql]
note: STRUCTURAL — migration 927 registered in supabase_migrations.schema_migrations (version '927', name 'pomona_complete')
ontiveros_cole:
  politician_id: b9f58d9e-7741-42a7-9fa2-64fb2f89a2a9
  office_id: a8e3ae4f-36c9-441c-a3b0-edbd738156d7
  external_id: -700658
  district: District 4 (7adbe57d-515a-4848-9320-ccbf3feeeeb2)
---

# Phase 147 Wave 2 — Pomona Roster Complete — SUMMARY

**Outcome:** Pomona's council is now its current, correct 7-member roster (directly-elected Mayor + 6 district
councilmembers) with fully consistent bidirectional links. Migration **927** (structural) applied + registered.

## Pre-flight (STOP-on-drift) — PASSED
- Garcia `-201350` / Lustro `-201352` / Sandoval `-200916` `office_id` all NULL (repair targets)
- `-700658` free (0 rows)
- 10 `Ontiveros` rows are all campaign-finance committee rows (NULL ext / NULL first_name, inactive) — NO real official (Pitfall 6)
- District 4 row `7adbe57d-515a-4848-9320-ccbf3feeeeb2` present (from Plan 01)
- Martin (675752) / Canales (675765) / Lustro (-201352) all active (A1/A2/A3)

## Changes applied (migration 927, idempotent)
- **Part A — 3 back-pointer repairs** (Pitfall 8): set `politicians.office_id` → Garcia `315a0a8a`, Lustro `8570f2ad`, Sandoval `657cb0b2` (offices.politician_id already set; Martin/Preciado/Canales untouched).
- **Part B — Ontiveros-Cole created + seated**: new politician `-700658` (Elizabeth Ontiveros-Cole, source pomonaca.gov, active/incumbent) + new `Council Member` office in survivor `ddabfccc` on District 4; both pointers synced.
- **Part C — official_count=7** on survivor chamber (Mayor + 6 council, Pitfall 4).
- **Mayor (Lancaster model, Pitfall 3)**: Sandoval office `657cb0b2` title stays `Mayor` on LOCAL_EXEC `Pomona Mayor` `3ec78ed9` — no new Mayor row, no rotational flag.

## Post-verification — ALL GREEN
| Check | Result |
|-------|--------|
| consistent active members (both pointers agree) | 7 ✓ |
| total offices under `ddabfccc` | 7 ✓ |
| Ontiveros-Cole `-700658` created | 1 ✓ |
| chamber official_count | 7 ✓ |
| roster | Martin D1 / Preciado D2 / Garcia D3 / Ontiveros-Cole D4 / Lustro D5 / Canales D6 / Sandoval Mayor — all `ptr_ok=true` ✓ |
| migration 927 registered | 1 ✓ |

## key-files.created
- `C:/EV-Accounts/backend/migrations/927_pomona_complete.sql` (applied to live Supabase; not in this git repo)

## For Plan 03 (headshots) — the 7 to image
| Member | ext_id | politician_id |
|--------|--------|---------------|
| Tim Sandoval (Mayor) | -200916 | 48f36a82-cb26-4701-ba08-5566533982cb |
| Debra Martin (D1) | 675752 | db853cfa-ab6d-4a30-bfbc-fb05b3956970 |
| Victor Preciado (D2) | 675753 | 56cecf7c-6de0-440f-b8e2-34945ec52333 |
| Nora Garcia (D3) | -201350 | 6fa28860-c3d6-45bf-8aad-eac353dc4559 |
| Elizabeth Ontiveros-Cole (D4) | -700658 | b9f58d9e-7741-42a7-9fa2-64fb2f89a2a9 |
| Steve Lustro (D5) | -201352 | 07e0311b-5013-49ac-849e-7aeaa3402ea2 |
| Lorraine Canales (D6) | 675765 | 3a578edc-56ad-43cf-ac8f-68d05fd5d7a8 |

## Self-Check: PASSED
