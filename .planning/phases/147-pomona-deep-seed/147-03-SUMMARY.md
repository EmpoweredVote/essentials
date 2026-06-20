---
phase: 147-pomona-deep-seed
plan: 03
wave: 3
status: complete
requirements: [POMO-01]
migrations: [928_pomona_headshots.sql]
note: AUDIT-ONLY (NOT registered in schema_migrations; 3-digit ledger stays 927). Human-verify checkpoint APPROVED by user 2026-06-20.
---

# Phase 147 Wave 3 — Pomona Headshots — SUMMARY

**Outcome:** All **7** current Pomona members have a clean, correct, single canonical 600×750 headshot
(`type='default'`, press_use) at `politician_photos/{politician_id}-headshot.jpg`. **No gaps, no fabricated
photos, no wrong-person/stale images.** pomonaca.gov is fully WAF-403 — zero city-site curl; all portraits
from confirmed alt sources. Migration 928 is audit-only. **User approved all 7 at the blocking checkpoint.**

## Pre-flight image coverage (live)
- Missing (no image): Sandoval, Garcia, Lustro, Ontiveros-Cole
- Existing: Martin (1280×1700 good), Preciado (150×150 too small), Canales (469×469 official city portrait, suspect-Torres flag)

## Sourcing (pomonaca.gov WAF-403 — alt sources only, Pitfall 7)
| Member | ext_id | Source | Note |
|--------|--------|--------|------|
| Tim Sandoval (Mayor) | -200916 | PCE 2020 `MayorSandoval.jpg` | campaign site had only a couple photo — used PCE solo portrait |
| Debra Martin (D1) | 675752 | existing DB 1280×1700 reprocessed | clean professional portrait; verified woman, not "Gonzalez" |
| Victor Preciado (D2) | 675753 | PCE 2020 `Victor-Preciado.jpg` | upgraded from too-small 150×150 |
| Nora Garcia (D3) | -201350 | PCE 2020 `Nora_Garcia.jpg` | noraforpomona had only a family photo |
| Elizabeth Ontiveros-Cole (D4) | -700658 | PCE 2020 `ECole.jpg` | alt-text verified |
| Steve Lustro (D5) | -201352 | PCE 2020 `Steve_Lustro.jpg` | |
| Lorraine Canales (D6) | 675765 | existing official city-CMS portrait reprocessed | a woman (NOT the male "Torres" PCE-2025 trap); user-confirmed at checkpoint |

- **REJECTED** the forbidden PCE-2025 stale wrong-person URLs (`/2025/02/638723568…`, alt "Rubio Gonzalez"/"Robert Torres") — used for nobody (Pitfall 5).
- Processing: crop 4:5 FIRST → resize 600×750 Lanczos q90 (Pillow) → upload to Storage via SUPABASE_SERVICE_ROLE_KEY, x-upsert:true → DB row type='default', press_use.
- Note: the 5 PCE 2020 photos are correct-identity official portraits but 172×230 upscaled to 600×750 (slightly soft); accepted by user as best available.

## Post-verification — ALL GREEN
| Check | Result |
|-------|--------|
| each of 7 members has exactly 1 type='default' image | 7/7 ✓ (no member >1, no gap) |
| all at canonical `{uuid}-headshot.jpg` path | ✓ |
| all Storage public URLs HTTP 200 | ✓ |
| rows with stale `/2025/02/638723568` URL | 0 ✓ |
| migration 928 registered in schema_migrations | NO (audit-only ✓; 3-digit ledger stays 927) |
| human-verify checkpoint | APPROVED (all 7) ✓ |

## key-files.created
- `C:/EV-Accounts/backend/migrations/928_pomona_headshots.sql` (audit-only; applied to live Supabase, not in this git repo)

## Self-Check: PASSED
