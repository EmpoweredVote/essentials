---
phase: 150-downey-deep-seed
verified: 2026-06-21T00:00:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
resolution: "All 5 must-haves verified after gap closure. (1) SC5 closed — orphan office 2ecc0a3e (Pelc surplus, politician_id NULL, At-Large) DELETED via corrective structural migration 999 (0 essentials.races referenced it); chamber 7cb8a90c now holds exactly 5 occupied offices (D1-D5), no phantom vacancy. (2) Both blocking human-verify checkpoints APPROVED by the operator in the execution session (2026-06-21): headshots — all 5 identities + crops confirmed (incl. D1 Ortiz≠Timothy-Horn, D3 Pemberton≠placeholder); stances — evidence-only coverage, citations, Jan-2021 rent-control pre-tenure attribution (Trujillo+Frometa only), and honest blanks (incl. Frometa immigration) confirmed. (3) Mayor identity corrected pre-headshots via migration 992 — Frometa (D4) is the rotational mayor, confirmed against the official city site. schema_migrations MAX = 999 (structural 990/991/992/999 registered; audit-only 993 headshots + 994-998 stances did not register)."
human_verification:
  - test: "Visually confirm all 5 Downey headshots show the correct person — especially D1 Horacio Ortiz (NOT Timothy Horn, stale slug) and D3 Dorothy Pemberton (NOT a placeholder, stale slug). Confirm no superimposed text/graphics, eyes ~1/3 from top, head+shoulders, not distorted. Confirm the Downey browse view does not show a 6th blank/vacant office slot."
    expected: "5 clean portraits, correct identities, correct crop; no 6th empty slot visible to users"
    why_human: "Identity verification requires visual inspection. The 6th unoccupied office (Pelc surplus 2ecc0a3e) is in the chamber with politician_id NULL — cannot determine from DB alone whether the app renders it as a visible vacancy."
  - test: "Spot-check stance citations in the Downey compass view — verify Frometa's immigration spoke is BLANK (not forced), confirm the Jan 2021 rent-control vote appears only under Trujillo and Frometa (not Sosa/Pemberton/Ortiz), and confirm thin records (Pemberton 4 stances / Ortiz 5 stances) show honest blanks on state/federal topics rather than neutral defaults."
    expected: "All populated spokes have reasoning + real source URL; Frometa immigration blank; pre-tenure attribution correct; thin records not padded."
    why_human: "Citations and blank-vs-defaulted spoke distinction require reading UI reasoning text, not just counting DB rows."
---

# Phase 150: Downey Deep-Seed Verification Report

**Phase Goal:** Take Downey (geo_id 0619766) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.
**Verified:** 2026-06-21
**Status:** passed (after gap closure + operator checkpoint approvals)
**Re-verification:** Yes — initial verify returned human_needed (1 uncertain SC5 + 2 paused checkpoints); both resolved (mig 999 cleanup + operator approvals 2026-06-21)

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Gov `1a31cf01` has `geo_id='0619766'`; ONE 'City Council' chamber `7cb8a90c`; 5 council offices with bidirectional politician links | ✓ VERIFIED | DB: `geo_id='0619766'`, 1 chamber, 5 occupied offices (all pol_ptr_ok=t, off_ptr_ok=t). 6th office `2ecc0a3e` has `politician_id NULL` (vacancy row). |
| 2 | 5 single-member districts (D1–D5, all LOCAL); exactly ONE 'Mayor' on Frometa's District 4 office; ZERO LOCAL_EXEC rows | ✓ VERIFIED | DB: 5 districts D1–D5 all `district_type=LOCAL`; `COUNT(*) WHERE title='Mayor'=1` (office `6fa79f0e` Frometa); 0 LOCAL_EXEC districts for `geo_id='0619766'`. Corrective mig 992 moved Mayor from Sosa→Frometa per operator confirmation. |
| 3 | All 5 officials have exactly one `type='default'` politician_images row; portraits at canonical `{uuid}-headshot.jpg` Storage paths | ✓ VERIFIED | DB: Each of ext_ids -700991/675353/675360/675361/-201200 has `COUNT(default)=1`. URLs match `politician_photos/{uuid}-headshot.jpg` pattern. `photo_origin_url` set to official downeyca.org pages for all 5. |
| 4 | 23 stance rows across 5 officials; 0 uncited; 0 judicial-topic rows; no defaulted values; honest blanks for thin records | ✓ VERIFIED | DB: `total_stances=23` (Trujillo 5, Sosa 6, Frometa 3, Pemberton 4, Ortiz 5); 0 rows without matching `inform.politician_context`; 0 rows where `t.judicial_role IN ('judge','city_attorney_da') OR t.is_live=false`. |
| 5 | No duplicate/stale office rows; stale members Saab/Pelc unlinked (rows KEPT); split-section check 0 rows | ? UNCERTAIN | Saab (-700160) and Pelc (-700161): `office_id NULL`, `is_active=false`, rows KEPT. Split-section check: 0 LOCAL_EXEC offices. BUT Pelc's surplus office `2ecc0a3e` remains in chamber `7cb8a90c` with `politician_id NULL` (title='Council Member', district='At-Large'). This is a stale unoccupied office row; ROADMAP SC5 says "no duplicate/stale office rows." Human must confirm whether it renders as a visible vacancy in the browse view. |

**Score:** 4/5 truths verified (1 uncertain)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `C:/EV-Accounts/backend/migrations/990_downey_reconcile.sql` | Structural migration: geo_id backfill, chamber merge, district relabel D1–D5, rotational mayor collapse, Trujillo name fix | ✓ VERIFIED | File exists; registered in `schema_migrations` as version '990'; post-checks green per SUMMARY 01. |
| `C:/EV-Accounts/backend/migrations/991_downey_complete.sql` | Structural migration: create+seat Ortiz, unlink Saab/Pelc, repair back-pointers, official_count=5 | ✓ VERIFIED | File exists; registered as version '991'; 5 active members with consistent bidirectional links confirmed in DB. |
| `C:/EV-Accounts/backend/migrations/992_downey_mayor_correction.sql` | Structural migration: Mayor title moved from Sosa (D2) → Frometa (D4); Ortiz = Mayor Pro Tem | ✓ VERIFIED | File exists; registered as version '992'; DB confirms `title='Mayor'` on office `6fa79f0e` (Frometa); `COUNT(*)=1 Mayor`. |
| `C:/EV-Accounts/backend/migrations/993_downey_headshots.sql` | Audit-only headshot migration: 5 politician_images rows, photo_origin_url backfill | ✓ VERIFIED | File exists; NOT registered in schema_migrations (ledger stays 992 — audit-only confirmed); 5 default images in DB. |
| `C:/EV-Accounts/backend/migrations/994_mario_trujillo_stances.sql` | Audit-only stances (Trujillo, 5 stances) | ✓ VERIFIED | File exists; 5 stances in DB for ext_id -201200; 100% cited. |
| `C:/EV-Accounts/backend/migrations/995_hector_sosa_stances.sql` | Audit-only stances (Sosa, 6 stances) | ✓ VERIFIED | File exists; 6 stances in DB for ext_id 675353; 100% cited. |
| `C:/EV-Accounts/backend/migrations/996_claudia_frometa_stances.sql` | Audit-only stances (Frometa, 3 stances) | ✓ VERIFIED | File exists; 3 stances in DB for ext_id 675361; 100% cited. |
| `C:/EV-Accounts/backend/migrations/997_dorothy_pemberton_stances.sql` | Audit-only stances (Pemberton, 4 stances) | ✓ VERIFIED | File exists; 4 stances in DB for ext_id 675360; 100% cited. |
| `C:/EV-Accounts/backend/migrations/998_horacio_ortiz_stances.sql` | Audit-only stances (Ortiz, 5 stances) | ✓ VERIFIED | File exists; 5 stances in DB for ext_id -700991; 100% cited. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `essentials.governments` `1a31cf01` | `geo_id='0619766'` | UPDATE guarded WHERE geo_id IS NULL or '' (mig 990) | ✓ WIRED | DB: `geo_id='0619766'` confirmed |
| `essentials.offices` `2afa4fd2` (Trujillo) | survivor chamber `7cb8a90c` | UPDATE chamber_id (mig 990) | ✓ WIRED | Trujillo now in `7cb8a90c`; bidirectional link confirmed |
| `essentials.chambers` `a30fd533` (orphan) | DELETED | Move-then-assert-then-delete (mig 990) | ✓ WIRED | DB: orphan chamber gone; only `7cb8a90c` 'City Council' remains |
| `essentials.politicians` ext_id -700991 (Ortiz, NEW) | District 1 office `44ca5c68` | INSERT politician + UPDATE offices + UPDATE politicians (mig 991) | ✓ WIRED | DB: Ortiz UUID `13dc32dd`, `pol_ptr_ok=t`, `off_ptr_ok=t` |
| `essentials.politicians` ext_ids -700160/-700161 (Saab/Pelc) | office_id NULL (unlinked) | UPDATE politicians SET office_id=NULL, is_active=false (mig 991) | ✓ WIRED | DB: both `office_id=NULL`, `is_active=false`, rows KEPT |
| `essentials.offices` `6fa79f0e` (Frometa D4) | title='Mayor' | UPDATE offices title='Mayor' (mig 992) | ✓ WIRED | DB: `title='Mayor'` on Frometa's office; exactly 1 Mayor in chamber |
| `inform.politician_answers` (23 rows) | `inform.politician_context` (reasoning + sources) | Paired INSERT per stance (migs 994–998) | ✓ WIRED | DB: 0 uncited answers; all 23 have matching context with `has_reasoning=t` |
| Supabase Storage `{uuid}-headshot.jpg` (5 objects) | `essentials.politician_images.url` type='default' | INSERT politician_images (mig 993) | ✓ WIRED | DB: canonical Storage URL pattern confirmed for all 5 |

---

### Data-Flow Trace (Level 4)

This is a SQL data-seed phase — no app code renders data; data flows directly into the production DB tables consumed by the existing API. Level 4 tracing verifies the DB rows exist and are reachable by the API layer's expected query patterns.

| Layer | Variable | Source | Produces Real Data | Status |
|-------|----------|--------|--------------------|--------|
| `essentials.governments.geo_id` | routing lookup | Migration 990 | Yes — `'0619766'` set | ✓ FLOWING |
| `essentials.chambers.official_count` | member count display | Set to 5 in mig 991 | Yes — `official_count=5` | ✓ FLOWING |
| `essentials.politician_images` (default) | headshot display | Migration 993 INSERT | Yes — 5 rows, CDN URLs | ✓ FLOWING |
| `inform.politician_answers` + `inform.politician_context` | compass spoke display | Migrations 994–998 | Yes — 23 rows, all cited | ✓ FLOWING |

---

### Behavioral Spot-Checks

Step 7b SKIPPED — this is a SQL data-seed phase with no runnable entry points to invoke directly. Verification is via DB queries against the live production Supabase instance.

---

### Probe Execution

Step 7c SKIPPED — no `scripts/*/tests/probe-*.sh` files exist for this phase. The PLAN/SUMMARY documents do not reference probes.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DWNY-01 | 150-01/02/03/04 PLAN.md | Downey (0619766) deep-seeded — government + roster + headshots + evidence-only stances | ? NEEDS HUMAN | Structural + roster + stances: VERIFIED via DB. Headshots: VERIFIED via DB (5 default images). But two blocking `checkpoint:human-verify` tasks (Plan 03 Task 3 + Plan 04 Task 3) show status "PAUSED/awaiting-checkpoint" in SUMMARYs — human approval is pending. DWNY-01 cannot be marked SATISFIED until those checkpoints are cleared. |

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `150-03-SUMMARY.md` | `status: awaiting-checkpoint` / `checkpoint: human-verify PENDING` | ⚠ Warning | Plan 03 Task 3 (headshot identity verify) was a **blocking** checkpoint; SUMMARY records it as not yet completed. |
| `150-04-SUMMARY.md` | `Tasks: 2 of 3 (Task 3 is checkpoint:human-verify — PAUSED)` | ⚠ Warning | Plan 04 Task 3 (stance spot-check) was a **blocking** checkpoint; SUMMARY records it as not yet completed. |
| DB: `2ecc0a3e` surplus office | Empty `politician_id NULL` office in chamber `7cb8a90c`, district='At-Large' | ⚠ Warning | Stale unoccupied office row remains in the chamber. PLAN 02 said "handled" = politician_id NULLed; ROADMAP SC5 says "no duplicate/stale office rows." Not a blocker (no false politician displayed; split-section check passes) but may render as a vacant At-Large slot in the UI. |
| `150-01-SUMMARY.md` | Migration numbered 990 (not 985 as planned) — auto-corrected | ℹ Info | The on-disk MAX was 989 at apply time; plan was stale. Correctly resolved. |

**Debt marker scan:** No `TBD`, `FIXME`, or `XXX` markers found in any of the 9 migration files. Clean.

---

### Human Verification Required

#### 1. Headshot Identity Confirmation (Plan 03 Task 3 — blocking, PAUSED)

**Test:** In the Downey browse view or via the profile URLs, visually confirm each of the 5 portraits:
1. D1 Horacio Ortiz — confirm this is Horacio Ortiz, NOT the prior occupant Timothy Horn (downeyca.org slug was `timonthy-horn-district-1` — known identity trap).
2. D3 Dorothy Pemberton — confirm this is Dorothy Pemberton, NOT a placeholder (slug was `vacant-district-3`).
3. All 5 — confirm no superimposed text/graphics over any face, eyes ~1/3 from top, head+shoulders visible, not distorted/stretched (4:5, 600×750).
4. Confirm each member shows exactly ONE portrait (no duplicate default rows — DB confirms this, but confirm visually).

**Also check:** Does the Downey browse view show a 6th blank/vacant office slot (from Pelc's surplus `2ecc0a3e` office, `politician_id NULL`, district='At-Large')? If so, the office row should be removed or its `chamber_id` nulled to prevent rendering a phantom vacancy.

**Expected:** 5 clean, correct-identity portraits at 600×750; NO 6th empty slot visible to users.
**Why human:** Identity confirmation requires visual inspection. The DB has the correct identities recorded by the operator, but the blocking checkpoint in the plan was never formally approved.

---

#### 2. Stance Citation Spot-Check (Plan 04 Task 3 — blocking, PAUSED)

**Test:** In the Downey compass view, spot-check the following:
1. Frometa's `local-immigration` spoke — confirm it is **BLANK** (not forced to any chair value). The DB shows 3 stances for Frometa (rent-regulation, public-safety, housing) — no immigration — confirming the honest blank, but visually verify the UI shows blank, not a defaulted neutral.
2. Rent-regulation stances — confirm the Jan 2021 rent-control vote reasoning appears ONLY for Trujillo (-201200) and Frometa (675361). Confirm the reasoning for Sosa (675353), Pemberton (675360), and Ortiz (-700991) cites THEIR OWN campaign statements (not the 2021 vote).
3. Pemberton (4 stances) and Ortiz (5 stances) thin records — confirm state/federal topics (abortion, trans-athletes, healthcare, etc.) appear as blank spokes, not neutral/moderate defaults.
4. Confirm no judicial-topic compass spokes appear for any Downey official.

**Expected:** Frometa immigration blank; pre-tenure attribution correct; thin records show honest blanks; no judicial topic placements.
**Why human:** Requires reading the reasoning text in the UI to confirm citation quality and verify blank-vs-defaulted spoke behavior. DB confirms 0 uncited rows and 0 judicial topics, but UI rendering of blank vs default requires visual confirmation.

---

### Gaps Summary

No hard BLOCKERS (all structural DB data is correct and verifiable). Two blocking human-verify checkpoints remain PAUSED per the SUMMARYs. One WARNING exists for the stale unoccupied office row `2ecc0a3e` that ROADMAP SC5 says should not exist.

**The stale office row (SC5 concern):**
Pelc's surplus office `2ecc0a3e` (`title='Council Member'`, `district='At-Large'`, `politician_id NULL`) remains attached to chamber `7cb8a90c`. PLAN 02 acceptance criteria said "exactly 5 OCCUPIED offices remain" (satisfied — 5 are occupied) but also "Pelc's surplus office handled" (handled = politician_id NULLed, not the office row removed). ROADMAP SC5 says "no duplicate/stale office rows." The row is a stale office row. It is not a BLOCKER (no false politician; split-section passes) but may render as an "At-Large" vacancy in the browse view. The human-verify check above will determine if action is needed.

---

## ROADMAP Success Criteria Summary

| SC | Criterion | Status | Evidence |
|----|-----------|--------|----------|
| SC1 | governments row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0619766 | ✓ VERIFIED | DB: gov `1a31cf01` geo_id='0619766'; 1 chamber; 5 occupied offices D1–D5 Mayor+4 Councilmembers; bidirectional links confirmed |
| SC2 | Council structure matches Downey's real form of government (district vs at-large, seat count, mayor type) | ✓ VERIFIED | DB: 5 single-member districts D1–D5 all LOCAL; rotational Mayor = title on Frometa's D4 office; ZERO LOCAL_EXEC; mig 992 corrected Mayor from Sosa→Frometa per official site |
| SC3 | Headshots at 600×750 uploaded for all officials with available portrait; genuine gaps documented | ✓ VERIFIED (DB) / ? NEEDS HUMAN (visual) | DB: all 5 have 1 default image at canonical Storage URLs; Trujillo accepted low-res (only source); awaiting visual identity checkpoint |
| SC4 | Evidence-only compass stances; 100% citation; honest blank spokes | ✓ VERIFIED (DB) / ? NEEDS HUMAN (visual) | DB: 23 rows, 0 uncited, 0 judicial; awaiting visual spot-check of reasoning text quality and blank-vs-default rendering |
| SC5 | City browse view renders roster (with photos) and stances; no duplicate/stale office rows | ? UNCERTAIN | Split-section check 0 rows. Saab/Pelc unlinked. BUT 1 unoccupied stale office row (`2ecc0a3e`, At-Large, politician_id NULL) remains in chamber — may render as phantom vacancy. Human browse-view check required. |

---

_Verified: 2026-06-21_
_Verifier: Claude (gsd-verifier)_
