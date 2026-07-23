---
phase: 195-oro-valley-deep-seed
plan: 01
status: complete
completed: 2026-07-10
requirements: [SUB-01]
---

# 195-01 Summary — Town of Oro Valley structural seed

## What was built
Greenfield **Town of Oro Valley, Arizona, US** (`geo_id='0451600'`, `type='Town'`) with:
- 1 `Town Council` chamber (`official_count=7`, `name_formal='Oro Valley Town Council'`)
- 2 NEW `essentials.districts` rows, both reusing the live Phase-190 G4110 geofence (NO geometry):
  - LOCAL_EXEC / G4110 / `az` / `0451600` — Mayor
  - LOCAL / G4110 / `az` / `0451600` — the ONE shared at-large row for all 6 council (Torrance precedent)
- 7 politicians + 7 offices — party **NULL** on all 7 (nonpartisan); Barrett carries the Vice Mayor
  title annotation on her council seat; the other 5 are plain `Council Member`.

Migration `1305_town_of_oro_valley.sql` applied to **production**, in-transaction post-verify gates (a–g)
passed, ledger `1305` registered. Committed to `C:/EV-Accounts` @ `a2977e79`.

## 7-official UUID manifest (REQUIRED by Plans 02 & 03)
| external_id | UUID | full_name | seat |
|---|---|---|---|
| -4009001 | `d3009d53-a6f0-4ea0-b41d-658ce62e3753` | Joseph "Joe" Winfield | Mayor (LOCAL_EXEC) |
| -4009002 | `c33b6be0-1192-4483-9343-28084a0f947d` | Melanie Barrett | Council Member (Vice Mayor) |
| -4009003 | `d9d52a86-359c-45b0-a2c6-297e67c0e669` | Joyce Jones-Ivey | Council Member |
| -4009004 | `889fe40e-425a-44cc-864f-b191d7c226ae` | Josh Nicolson | Council Member |
| -4009005 | `4e1a2e41-9e27-42db-8b47-00f697266987` | Dr. Harry "Mo" Greene II | Council Member |
| -4009006 | `aeb4c75b-e4a9-4e94-a7f6-b1d58707d84c` | Mary Murphy | Council Member |
| -4009007 | `3bb254c4-0335-4377-b4ae-1313453c8ae9` | Elizabeth Robb | Council Member |

## Roster-currency decision (Task 2 — blocking checkpoint, executed 2026-07-10)
- **Election dates (live-verified):** Primary **July 21, 2026** (iloveov.com, authoritative civic source;
  one older tucson.com piece said Aug 4 — iloveov used). General Nov 3, 2026.
- **Certification status:** Primary had **NOT occurred** as of execute date (11 days out) → **no certified
  result**, no officeholder change.
- **Decision (operator-approved):** Seed the **current sitting 7-member roster** — they represent residents
  today. iloveov.com independently confirmed Robb + Murphy as sitting members; search confirmed
  Winfield(Mayor)/Barrett(VM)/Jones-Ivey/Nicolson still seated (terms expire Nov 2026).
- **Stale names excluded:** Wikipedia still lists Bohen & Solomon (terms "expire Nov 2024") — the Pitfall-1
  stale composite. Bohen/Solomon were replaced July 2024 and were **NOT** seeded.
- **Title convention:** Seats are "At-large" with no formal numbering (Ballotpedia) → plain `Council Member`
  (Torrance shape), NOT `(Position N)`. Vice Mayor is council-appointed → title annotation on Barrett.
- Note: Winfield is not seeking reelection and Barrett is running for Mayor, but both remain seated now;
  the roster will need a post-election refresh after Nov 2026 (tracked for a future reconcile).

## Verification
- Combined Task 3 boolean assertion → `t`; section-split → 0; distinct linked-district state → `az`.
- 1 govt, 7 offices (1 LOCAL_EXEC + 6 on the ONE shared LOCAL), party NULL, exactly one `(Vice Mayor)` on -4009002.

## Deviations
- `governments.type='Town'` (not Beaverton's generic `'LOCAL'`) — follows the human-readable AZ convention
  set by Tucson (`type='City'`, 1296) per RESEARCH.
