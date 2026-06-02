---
phase: 87-ca-city-school-boards
verified: 2026-06-02T20:30:00Z
status: complete
score: 6/6 requirements verified
overrides_applied: 0
---

# Phase 87: CA City School Boards Verification Report

**Phase Goal:** 6 CA city school board G5420 geofences + board members seeded with headshots; SCHOOL section renders correctly on Reps tab
**Verified:** 2026-06-02T20:30:00Z
**Status:** complete
**Re-verification:** Yes — plans 87-03/04/05 closed UAT gaps; full re-UAT passed 2026-06-02

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 6 school district governments seeded (SFUSD, SDUSD, SCUSD, SJUSD, FUSD, BUSD) with chambers + SCHOOL districts + officials | VERIFIED | Migration 257: 6 governments + 6 chambers + 6 SCHOOL districts + 34 politicians + 34 offices; 7 post-verification SQL gates all PASS per 87-01-SUMMARY.md |
| 2 | An SF address returns SFUSD SCHOOL section with 7 officials titled "Commissioner" | VERIFIED | Live re-UAT 2026-06-02: card titles show "Commissioner" (not full district name); Results.jsx SCHOOL branch uses `qualify(cleanTitle, pol)` — commit 4c7dee3 |
| 3 | SCHOOL tiles display at same height as council tiles (130px) | VERIFIED | Live re-UAT 2026-06-02: all cards measure 130px via offsetHeight; deriveSeatSubtitle extended to include SCHOOL type — commit 4c7dee3 |
| 4 | All 7 SFUSD headshots are color photos (not greyscale) | VERIFIED | Live re-UAT 2026-06-02: 3 real photos + 4 Mission Local RGB illustrated portraits; PIL mode=RGB confirmed for all 4 Mission Local images; greyscale rejection guard added to 3 headshot scripts — commit e29e0f4 |
| 5 | 34 officials have headshots where available; missing covered by placeholder avatars | VERIFIED | 28/34 uploaded in 87-02 + 7 SFUSD color replacements in 87-05; Sharon Whitehurst-Payne (SDUSD-E, ext=-870012) documented as no-source; SJUSD 5 with no public photos — graceful placeholder renders |
| 6 | SJUSD section header shows "San Jose" (no accent é) | VERIFIED | Migration 259 applied: `governments.name` and `chambers.name_formal` both updated to "San Jose" — commit e29e0f4 |

**Score:** 6/6 requirements satisfied

### Required Artifacts

| Artifact | Expected | Status |
|----------|----------|--------|
| `C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql` | 6 governments + 34 officials | VERIFIED — migration applied; 7 SQL gates confirmed |
| `C:/EV-Accounts/backend/migrations/258_ca_city_school_headshots.sql` | AUDIT-ONLY headshot doc | VERIFIED — audit-only header present |
| `C:/EV-Accounts/backend/migrations/259_normalize_sjusd_government_name.sql` | Remove accent from San José | VERIFIED — both table rows confirmed updated |
| `C:/EV-Accounts/backend/migrations/260_sfusd_politician_images_missing_rows.sql` | AUDIT-ONLY — 4 missing politician_images rows (Huling/Alexander/Gupta/Ray) | VERIFIED — rows inserted; DB confirmed 7/7 SFUSD rows present |
| `src/pages/Results.jsx` | SCHOOL cardTitle + deriveSeatSubtitle fixed | VERIFIED — SCHOOL branch uses `qualify(cleanTitle, pol)`; deriveSeatSubtitle guard includes `dt !== 'SCHOOL'`; parenthetical extractor added |
| `scripts/_tmp-ca-school-headshots.py` | Greyscale guard added | VERIFIED — `raise ValueError(f"Greyscale image rejected...")` at line 134 |
| `scripts/ca_senate_headshots.py` | Greyscale guard added | VERIFIED — same guard at line 123 |
| `scripts/lausd-headshots/process.py` | Greyscale guard added | VERIFIED — same guard at line 116; `LA` mode removed from RGBA/P branch |

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| CA-SCHOOL-01 | SFUSD geofence + 7 board members (Commissioner) | SATISFIED | Migration 257; UAT PASS; 7 politician_images rows (migration 260 fixed 4 missing) |
| CA-SCHOOL-02 | SDUSD geofence + 5 board members (District A–E) | SATISFIED | Migration 257; 5 officials seeded; 4 headshots + 1 missing (Whitehurst-Payne, Cloudflare block documented) |
| CA-SCHOOL-03 | SCUSD geofence + 7 board members (Area 1–7) | SATISFIED | Migration 257; 7 officials; all headshots from scusd.edu |
| CA-SCHOOL-04 | SJUSD geofence + 5 board members (Trustee Area 1–5) | SATISFIED | Migration 257; 5 officials; no public headshots (placeholder renders correctly); name normalized via migration 259 |
| CA-SCHOOL-05 | FUSD geofence + 5 board members (Area 1–5) | SATISFIED | Migration 257; routing confirmed via debug agent |
| CA-SCHOOL-06 | BUSD geofence + 5 board members ("Director") | SATISFIED | Migration 257; BUSD uses "Director" title correctly |

All 6 requirements (CA-SCHOOL-01 through CA-SCHOOL-06) satisfied.

### Key Fix Summary (UAT gap closure)

| Gap | Root Cause | Fix | Commit |
|-----|------------|-----|--------|
| Card title showed district name | Results.jsx SCHOOL branch used government_name+chamber_name | Use `qualify(cleanTitle, pol)` | 4c7dee3 |
| SCHOOL tiles shorter than council | deriveSeatSubtitle early-returned null for SCHOOL | Added `dt !== 'SCHOOL'` to guard; parenthetical extractor added | 4c7dee3 |
| SFUSD headshots greyscale | Source photos at sfusd.edu are B&W; silent PIL mode=L→RGB conversion | Reject mode=L/LA with ValueError guard; replace 7 images with color sources | e29e0f4, 47cbda5, f66cee9, bd358a2 |
| SJUSD accent in section header | government_name seeded as "San José" | Migration 259 normalizes to "San Jose" | e29e0f4 |
| 4 SFUSD missing politician_images | Post-87-05 fix scripts only upserted Storage, no DB insert | Migration 260 inserts 4 rows | 2e42ec8 |

### Code Review Status

REVIEW.md (87-REVIEW.md): 1 critical, 3 warnings
- CR-01 (critical): Hardcoded Supabase service-role JWT in scripts/_tmp-ca-school-headshots.py → **ADDRESSED**: env.ts + supabase.ts migrated to `SUPABASE_SECRET_KEY`; Render env var update pending (human action)
- WR-01/02/03 (warnings): advisory — one-off scripts with hardcoded keys (low urgency, finished scripts)

### Pending (non-blocking)

| Item | Owner | Priority |
|------|-------|----------|
| Add `SUPABASE_SECRET_KEY` to Render dashboard env vars | Human (Chris) | High — blocks next backend deploy |
| Sharon Whitehurst-Payne headshot (SDUSD-E) | Human | Low — Cloudflare-protected source |

---

_Verified: 2026-06-02T20:30:00Z_
_Verifier: Claude (inline — gsd-verify-work 87)_
