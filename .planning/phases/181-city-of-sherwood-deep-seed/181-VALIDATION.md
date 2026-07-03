---
phase: 181
slug: city-of-sherwood-deep-seed
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-03
---

# Phase 181 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a **data deep-seed** phase — validation is via **SQL audit gates run over the live DB**
> (psql against C:/EV-Accounts/backend/.env DATABASE_URL), not a unit-test framework.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL audit queries (psql) + live browse check |
| **Config file** | C:/EV-Accounts/backend/.env (DATABASE_URL) — orchestrator applies + audits; executor has NO DB |
| **Quick run command** | `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM essentials.offices o JOIN essentials.chambers ch ON o.chamber_id=ch.id JOIN essentials.governments g ON ch.government_id=g.id WHERE g.name='City of Sherwood, Oregon, US'"` (= 7) |
| **Full suite command** | 9-check E2E gate + banner check (see map below): geo_id **4167100** geofence check (NOT the stated 4167450 — research-corrected) + section-split 0 rows + roster=7 + headshot coverage + stance evidence audit + coverage.js build |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After the structural migration (1187):** run the in-migration DO-block gates (gov + chamber + 2 districts + exactly 7 offices) PLUS the independent post-verify section-split query AND the **D-15 WR-B pairwise identity gate** (`(external_id, full_name)` pairs match the researched roster — upgraded from 180's set-membership version)
- **After headshot migration:** run headshot coverage audit (politician_images rows; research confirmed 7/7 directly downloadable from sherwoodoregon.gov — investigate any shortfall as a regression, not an expected gap)
- **After each stance migration:** verify row-count assertion fired (inserted = expected; bad topic_keys not silently dropped) + 0 uncited answers
- **Before verify:** section-split scan returns 0 rows; live browse shows the Mayor first + 6 councilors
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 181-01-* | 01 | 1 | WASH-07 | — | Wave-0 DB probes confirm geo_id **4167100** (research-CORRECTED from stated 4167450, which has 0 rows — third wrong stated geo_id this milestone) has exactly 1 G4110 geofence + greenfield (no Sherwood gov/chamber), ext_id block -4167101..-4167107 free, disk migration MAX = 1186 (next 1187; ledger MAX 1178 is a trap — on-disk counter authoritative); fresh roster re-fetch confirms 7 members unchanged; all 7 headshot URLs re-confirmed HTTP 200 | audit | `psql "$DATABASE_URL" -f _tmp-sherwood-wave0-probe.sql` | ❌ W0 | ⬜ pending |
| 181-02-* | 02 | 2 | WASH-07 | T-181-01 | Idempotent seed (WHERE NOT EXISTS on gov; office guard); Beaverton/Tualatin/Forest Grove shape (1 LOCAL_EXEC Mayor district + 1 LOCAL at-large district, both geo_id 4167100 state='or', no ward geofences — pure at-large verified HIGH); plain-title convention ('Mayor'/'Councilor', no numbered positions); Council President = title-on-seat if applicable (no separate office row); all 7 is_appointed=false; representing_city='Sherwood' inline; **D-15 WR-B: pairwise (external_id, full_name) identity gate** on the ON CONFLICT path; **D-15 WR-A: ORCHESTRATOR NOTE text kept in sync with actual gate default**; independent post-verify, 0 section-split | audit | `psql "$DATABASE_URL" -f 1187_sherwood_city_council.sql` + post-verify | ❌ W0 | ⬜ pending |
| 181-03-* | 03 | 3 | WASH-07 | — | Headshots 600×750 (4:5 crop first, Lanczos q90), canonical {uuid}-headshot.jpg, photo_license per actual source (city-site official portraits — 600×600 source, crop band accordingly); WR-01 (shipped): pipeline script exits non-zero on ANY upload failure; **D-15 WR-C: test_download_guard guards len(OFFICIALS)>0 first**; 7/7 expected — any gap is a regression | audit | `psql "$DATABASE_URL" -c "SELECT ... FROM essentials.politician_images"` + CDN HTTP 200 | ❌ W0 | ⬜ pending |
| 181-04-* | 04 | 3 | WASH-07 | — | Stances 100% cited; ZERO default/neutral values; honest blanks; topic_id via is_live JOIN (44 live topics confirmed); row-count assertions; no judicial topics (City Attorney/Municipal Judge are appointed — org-chart-confirmed); one research agent at a time, agents author their own migration files; Pamplin (Sherwood Gazette) content via D-16 search-index extraction only, cited to original URLs; Oct-2025 housing-charter vote attribution requires seated-roster-on-vote-date check (Open Question 2) before per-official use | audit | `psql "$DATABASE_URL" -f stance_audit.sql` | ❌ W0 | ⬜ pending |
| 181-05-* | 05 | 4 | WASH-07 | — | Sherwood row in coverage.js Oregon block with hasContext:true + browseGovernmentList ['4167100'] (alphabetical among OR cities); cities/sherwood.jpg per D-14 (street-level Old Town scene or true multi-roofline skyline; NO single-building roof crops, NO aerials; operator picks from presented candidates) + CURATED_LOCAL single-word key `sherwood` + attribution; prod build passes | build | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] DB probe (run FIRST): confirm geo_id **4167100** has exactly 1 G4110 row (research corrected this from the stated 4167450 which has 0 rows — re-verify regardless)
- [ ] DB probe: confirm no existing government/chamber rows for Sherwood (name + geo_id) — research found 0
- [ ] DB probe: confirm ext_id range -4167101..-4167107 is unused — research found 0 rows
- [ ] Disk `ls`: re-confirm migration MAX = 1186 (next 1187) — other workstreams consume the shared counter; ledger MAX 1178 is a trap
- [ ] Fresh fetch of sherwoodoregon.gov/government/city-council/ to re-confirm the 7-member roster unchanged
- [ ] Re-download all 7 headshot URLs to confirm continued availability (research found 7/7 HTTP 200, 600×600 JPEG each)
- [ ] View the "Railroad St" and "Downtown" banner candidate images at the 3.15:1 crop before presenting to the operator (compositional judgment untested until execution)
- [ ] Quick check of the exact Oct 28, 2025 seated roster before attributing the housing-charter vote to all 7 officials individually (Open Question 2)

*Existing psql/pipeline infrastructure covers all phase requirements — no new test framework needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mayor-first ordering + no party label on live browse | WASH-07 | Rendering behavior (groupHierarchy.js + antipartisan display) only observable in the deployed UI | Open `essentials.empowered.vote/results?browse_geo_id=4167100&browse_mtfcc=G4110`; confirm Mayor first, 6 councilors, no party anywhere |
| Community banner renders (not gradient fallback) | WASH-07 | CURATED_LOCAL key match + representing_city derivation only observable in the deployed UI | Same browse URL; Local section shows the Sherwood photo banner |
| Compass stances visible on official profiles | WASH-07 | Spoke rendering is UI behavior | Open 2–3 official profiles from the browse list; confirm cited stances render, honest blank spokes present |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
